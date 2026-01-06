/**
 * Graamans PFAL Transpiration Model (2017)
 *
 * @description
 * Plant factory-specific transpiration model based on energy balance approach.
 * Optimized for closed controlled environment agriculture (CEA) with artificial lighting.
 *
 * Key features:
 * - PPFD-driven stomatal resistance calculation (Equation 9)
 * - Separate light/dark period handling
 * - LED vs HPS spectral efficiency
 * - Forced vs free convection aerodynamic resistance
 *
 * @equation
 * Stomatal resistance (light period):
 * ```
 * rs = 60 × (1500 + PPFD) / (200 + PPFD)   [s/m]
 * ```
 *
 * Stomatal resistance (dark period):
 * ```
 * rs = 450   [s/m]
 * ```
 *
 * Net radiation from artificial lighting:
 * ```
 * Rn = (1 - ρr) × PPFD × 4.57 × CAC   [W/m²]
 * ```
 *
 * @accuracy
 * - PFAL environments: High (RMSE ≈ 0.004 g/m²/s)
 * - 24h average: 0.030 g/m²/s
 * - Light period: 0.041 g/m²/s
 * - Dark period: 0.011 g/m²/s
 *
 * @references
 * - Graamans, L., et al. (2017). Plant factories; crop transpiration and energy balance.
 *   Agricultural Systems, 153, 138-147.
 *
 * @module plant-physiology/transpiration
 */

import {
  LATENT_HEAT_VAPORIZATION,
  PSYCHROMETRIC_CONSTANT_PA,
  SPECIFIC_HEAT_AIR,
  GRAAMANS_RS_BASE,
  PPFD_SATURATION,
  PPFD_RESPONSE_THRESHOLD,
  STOMATAL_RESISTANCE_DARK,
  AERODYNAMIC_RESISTANCE_FORCED,
  AERODYNAMIC_RESISTANCE_FREE,
  PAR_REFLECTION_LETTUCE,
  PPFD_TO_PAR_CONVERSION,
  CULTIVATION_AREA_COVER,
  SECONDS_PER_HOUR,
  KELVIN_OFFSET,
} from '../../common/constants';
import type { PfalTranspirationInputs, TranspirationOutputs } from '../../common/types';
import {
  calculateVpd,
  vaporPressureSlope,
  airDensity,
  saturationVaporConcentration,
  vaporConcentration,
} from './psychrometrics';

/**
 * Configuration options for Graamans PFAL model
 */
export interface GraamansPfalOptions {
  /** LED spectrum efficiency (default 1.0) */
  ledSpectrumEfficiency?: number;
  /** HPS spectrum efficiency (default 0.85) */
  hpsSpectrumEfficiency?: number;
  /** PAR reflection coefficient (default 0.065 for lettuce) */
  parReflectionCoefficient?: number;
  /** Cultivation area cover ratio (default 0.90) */
  cultivationAreaCover?: number;
  /** Typical leaf diameter for lettuce (default 0.11 m) */
  leafDiameter?: number;
  /** LAI correction for aerodynamic resistance */
  enableLaiCorrection?: boolean;
}

/**
 * Calculate transpiration using the Graamans PFAL model
 *
 * @param inputs - Input parameters for the model
 * @param options - Model configuration options
 * @returns Transpiration calculation results
 *
 * @example
 * ```typescript
 * const result = graamansPfal({
 *   airTemperature: 22,
 *   relativeHumidity: 70,
 *   ppfd: 300,
 *   stomatalResistance: 100, // Will be overridden by PPFD-based calculation
 *   aerodynamicResistance: 100, // Will be overridden by circulation type
 *   netRadiation: 0, // Will be calculated from PPFD
 *   lightingType: 'LED',
 *   forcedCirculation: true,
 *   photoperiodActive: true,
 * });
 *
 * console.log(`Transpiration: ${result.transpirationRate} mm/h`);
 * ```
 */
export function graamansPfal(
  inputs: PfalTranspirationInputs,
  options: GraamansPfalOptions = {}
): TranspirationOutputs {
  const {
    airTemperature,
    relativeHumidity,
    ppfd,
    lightingType = 'LED',
    forcedCirculation = true,
    photoperiodActive = true,
    leafAreaIndex = 3.0,
  } = inputs;

  const {
    ledSpectrumEfficiency = 1.0,
    hpsSpectrumEfficiency = 0.85,
    parReflectionCoefficient = PAR_REFLECTION_LETTUCE,
    cultivationAreaCover = CULTIVATION_AREA_COVER,
    leafDiameter = 0.11,
    enableLaiCorrection = true,
  } = options;

  // =========================================================================
  // Step 1: Calculate stomatal resistance (Graamans Equation 9)
  // =========================================================================
  //
  // Light period: rs = 60 × (1500 + PPFD) / (200 + PPFD)   [s/m]
  // Dark period:  rs = 450   [s/m]
  //
  // This is the key PFAL-specific equation that accounts for the
  // relationship between light intensity and stomatal opening.
  // =========================================================================

  const stomatalResistance = calculateGraamansStomatalResistance(ppfd, photoperiodActive);

  // =========================================================================
  // Step 2: Calculate aerodynamic resistance
  // =========================================================================
  //
  // Forced circulation: ra = 100 s/m
  // Free convection:    ra = 200 s/m
  //
  // With optional LAI correction:
  // ra_corrected = ra × max(0.5, min(2.0, 3.0/LAI))
  // =========================================================================

  let aerodynamicResistance = forcedCirculation
    ? AERODYNAMIC_RESISTANCE_FORCED
    : AERODYNAMIC_RESISTANCE_FREE;

  if (enableLaiCorrection && leafAreaIndex > 0) {
    const laiCorrection = Math.max(0.5, Math.min(2.0, 3.0 / leafAreaIndex));
    aerodynamicResistance *= laiCorrection;
  }

  // =========================================================================
  // Step 3: Calculate net radiation from artificial lighting
  // =========================================================================
  //
  // Rn = (1 - ρr) × I_lighting × CAC
  // I_lighting = PPFD × 4.57 / spectrum_efficiency   [W/m²]
  //
  // Where:
  // - ρr: PAR reflection coefficient (0.065 for lettuce)
  // - CAC: Cultivation area cover (0.90 typical)
  // - 4.57: PPFD to PAR conversion factor
  // =========================================================================

  const spectrumEfficiency = lightingType === 'LED' ? ledSpectrumEfficiency : hpsSpectrumEfficiency;
  const lightingIntensity = (ppfd / PPFD_TO_PAR_CONVERSION) * spectrumEfficiency;
  const netRadiation = (1 - parReflectionCoefficient) * lightingIntensity * cultivationAreaCover;

  // =========================================================================
  // Step 4: Calculate VPD and other psychrometric properties
  // =========================================================================

  const vpdResult = calculateVpd(airTemperature, relativeHumidity);
  const vpd = vpdResult.vpd;
  const delta = vpdResult.vaporPressureSlope;

  // Air density at current conditions
  const rho = airDensity(airTemperature);

  // Psychrometric constant (Pa/K version for this model)
  const gamma = PSYCHROMETRIC_CONSTANT_PA / 1000; // Convert to kPa/K

  // Latent heat of vaporization
  const lambda = LATENT_HEAT_VAPORIZATION;

  // =========================================================================
  // Step 5: Apply Penman-Monteith equation with PFAL parameters
  // =========================================================================
  //
  // LE = [Δ(Rn - G) + ρa·cp·VPD/ra] / [Δ + γ(1 + rs/ra)]
  //
  // Note: G = 0 for plant factories (no soil heat flux)
  // =========================================================================

  const soilHeatFlux = 0; // No soil heat flux in hydroponics/aeroponics

  // Radiation term [W/m²]
  const radiationTerm = delta * (netRadiation - soilHeatFlux);

  // Aerodynamic term [W/m²]
  // VPD in kPa, convert to Pa for unit consistency
  const aerodynamicTerm = (rho * SPECIFIC_HEAT_AIR * vpd * 1000) / aerodynamicResistance;

  // Numerator
  const numerator = radiationTerm + aerodynamicTerm;

  // Resistance ratio
  const resistanceRatio = stomatalResistance / aerodynamicResistance;

  // Denominator factor
  const denominatorFactor = delta + gamma * (1 + resistanceRatio);

  // Latent heat flux [W/m²]
  const latentHeatFlux = numerator / denominatorFactor;

  // Sensible heat flux [W/m²]
  const sensibleHeatFlux = (netRadiation - soilHeatFlux) - latentHeatFlux;

  // =========================================================================
  // Step 6: Convert to transpiration rates
  // =========================================================================

  // Mass transpiration rate [kg/(m²·s)]
  const transpirationRateMass = latentHeatFlux / lambda;

  // Volumetric rate [mm/h]
  const transpirationRate = transpirationRateMass * SECONDS_PER_HOUR;

  // Water vapor flux
  const waterVaporFlux = transpirationRateMass;

  return {
    transpirationRate,
    transpirationRateMass,
    latentHeatFlux,
    sensibleHeatFlux,
    waterVaporFlux,
    vpdCalculated: vpd,
    vaporPressureSlope: delta,
    modelComponents: {
      radiationTerm,
      aerodynamicTerm,
      resistanceRatio,
    },
  };
}

/**
 * Calculate stomatal resistance using Graamans Equation 9
 *
 * @description
 * PPFD-driven stomatal resistance model specifically validated for plant factories.
 *
 * @equation
 * Light period:
 * ```
 * rs = 60 × (1500 + PPFD) / (200 + PPFD)   [s/m]
 * ```
 *
 * Dark period:
 * ```
 * rs = 450   [s/m]
 * ```
 *
 * @param ppfd PPFD in μmol/(m²·s)
 * @param isLightPeriod Whether lights are on
 * @returns Stomatal resistance in s/m
 *
 * @reference Graamans et al. (2017), Equation 9
 */
export function calculateGraamansStomatalResistance(
  ppfd: number,
  isLightPeriod: boolean = true
): number {
  // Dark period: fixed high resistance
  if (!isLightPeriod || ppfd < 10) {
    return STOMATAL_RESISTANCE_DARK;
  }

  // Light period: PPFD-dependent resistance
  // rs = 60 × (1500 + PPFD) / (200 + PPFD)
  return GRAAMANS_RS_BASE * ((PPFD_SATURATION + ppfd) / (PPFD_RESPONSE_THRESHOLD + ppfd));
}

/**
 * Calculate aerodynamic resistance using Stanghellini mixed convection formula
 *
 * @description
 * More detailed aerodynamic resistance calculation for CEA environments.
 *
 * @equation
 * ```
 * ra = 1174 × d^0.5 / (d × |Tl - Ta| + 207 × U²)^0.25   [s/m]
 * ```
 *
 * Where:
 * - d: Leaf characteristic dimension [m]
 * - Tl: Leaf temperature [°C]
 * - Ta: Air temperature [°C]
 * - U: Air velocity [m/s]
 *
 * @param leafDiameter Leaf characteristic dimension in m
 * @param leafTemperature Leaf temperature in °C
 * @param airTemperature Air temperature in °C
 * @param airVelocity Air velocity in m/s
 * @returns Aerodynamic resistance in s/m
 *
 * @reference Stanghellini (1987)
 */
export function calculateStanghelliniAerodynamicResistance(
  leafDiameter: number,
  leafTemperature: number,
  airTemperature: number,
  airVelocity: number
): number {
  // Ensure minimum air velocity
  const U = Math.max(airVelocity, 0.05);

  // Temperature difference term
  const tempDiff = Math.abs(leafTemperature - airTemperature);

  // Mixed convection formula
  const numerator = 1174 * Math.sqrt(leafDiameter);
  const denominator = Math.pow(leafDiameter * tempDiff + 207 * U * U, 0.25);

  // Avoid division by very small numbers
  if (denominator < 0.001) {
    return AERODYNAMIC_RESISTANCE_FREE; // Fallback to free convection
  }

  return numerator / denominator;
}

/**
 * Calculate net radiation from artificial lighting
 *
 * @param ppfd PPFD in μmol/(m²·s)
 * @param options Configuration options
 * @returns Net radiation in W/m²
 */
export function calculateNetRadiationFromLighting(
  ppfd: number,
  options: {
    lightingType?: 'LED' | 'HPS';
    parReflectionCoefficient?: number;
    cultivationAreaCover?: number;
  } = {}
): number {
  const {
    lightingType = 'LED',
    parReflectionCoefficient = PAR_REFLECTION_LETTUCE,
    cultivationAreaCover = CULTIVATION_AREA_COVER,
  } = options;

  // Spectrum efficiency factor
  const spectrumEfficiency = lightingType === 'LED' ? 1.0 : 0.85;

  // Convert PPFD to PAR irradiance
  // PAR [W/m²] = PPFD [μmol/m²/s] / 4.57
  const parIrradiance = (ppfd / PPFD_TO_PAR_CONVERSION) * spectrumEfficiency;

  // Net radiation with reflection and coverage
  return (1 - parReflectionCoefficient) * parIrradiance * cultivationAreaCover;
}

/**
 * Estimate daily transpiration for a photoperiod schedule
 *
 * @param lightPeriodHours Hours of light per day
 * @param ppfd PPFD during light period in μmol/(m²·s)
 * @param airTemperature Air temperature in °C
 * @param relativeHumidity Relative humidity in %
 * @returns Estimated daily transpiration in L/(m²·day)
 */
export function estimateDailyTranspiration(
  lightPeriodHours: number,
  ppfd: number,
  airTemperature: number,
  relativeHumidity: number
): number {
  const darkPeriodHours = 24 - lightPeriodHours;

  // Light period transpiration
  const lightResult = graamansPfal({
    airTemperature,
    relativeHumidity,
    ppfd,
    stomatalResistance: 0, // Will be calculated
    aerodynamicResistance: 0, // Will be calculated
    netRadiation: 0, // Will be calculated
    photoperiodActive: true,
  });

  // Dark period transpiration
  const darkResult = graamansPfal({
    airTemperature,
    relativeHumidity,
    ppfd: 0,
    stomatalResistance: 0,
    aerodynamicResistance: 0,
    netRadiation: 0,
    photoperiodActive: false,
  });

  // Daily total (mm/day = L/m²/day)
  const dailyTranspiration =
    lightResult.transpirationRate * lightPeriodHours +
    darkResult.transpirationRate * darkPeriodHours;

  return dailyTranspiration;
}

export default graamansPfal;
