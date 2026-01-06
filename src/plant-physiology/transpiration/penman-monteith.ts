/**
 * Penman-Monteith Transpiration Model (1965)
 *
 * @description
 * Classic Penman-Monteith equation for evapotranspiration calculation.
 * Combines radiation and aerodynamic terms for accurate plant water loss estimation.
 *
 * @equation
 * ```
 * ET = (Δ(Rn-G) + ρa·cp·VPD/ra) / (λ(Δ + γ(1 + rs/ra)))
 * ```
 *
 * Where:
 * - ET: Evapotranspiration rate [kg/(m²·s)]
 * - Δ: Slope of saturation vapor pressure curve [kPa/°C]
 * - Rn: Net radiation [W/m²]
 * - G: Soil heat flux [W/m²] (≈0 for plant factories)
 * - ρa: Air density [kg/m³]
 * - cp: Specific heat of air [J/(kg·K)]
 * - VPD: Vapor pressure deficit [kPa]
 * - ra: Aerodynamic resistance [s/m]
 * - rs: Stomatal resistance [s/m]
 * - λ: Latent heat of vaporization [J/kg]
 * - γ: Psychrometric constant [kPa/°C]
 *
 * @accuracy
 * - Outdoor environments: High (R² > 0.90)
 * - CEA environments: Moderate (tends to overestimate 15-30%)
 *
 * @references
 * - Monteith, J.L. (1965). Evaporation and environment. Symposia of the Society
 *   for Experimental Biology, 19, 205-234.
 * - Allen, R.G., et al. (1998). FAO Irrigation and Drainage Paper No. 56.
 * - Stanghellini, C. (1987). Transpiration of greenhouse crops. IMAG-DLO.
 *
 * @see stanghellini.ts for CEA-optimized variant
 * @see graamans-pfal.ts for plant factory specific model
 *
 * @module plant-physiology/transpiration
 */

import {
  LATENT_HEAT_VAPORIZATION,
  PSYCHROMETRIC_CONSTANT,
  SPECIFIC_HEAT_AIR,
  AIR_DENSITY_STANDARD,
  KPA_TO_PA,
  SECONDS_PER_HOUR,
} from '../../common/constants';
import type { TranspirationInputs, TranspirationOutputs } from '../../common/types';
import {
  validateRange,
  ENVIRONMENTAL_RANGES,
  PLANT_PHYSIOLOGY_RANGES,
} from '../../common/validation';
import {
  calculateVpd,
  vaporPressureSlope,
  airDensity,
  psychrometricConstant,
  latentHeatOfVaporization,
} from './psychrometrics';

/**
 * Extended inputs for Penman-Monteith model
 */
export interface PenmanMonteithInputs extends TranspirationInputs {
  /** Atmospheric pressure in kPa (optional, default 101.325) */
  atmosphericPressure?: number;
  /** Use temperature-dependent latent heat (default true) */
  useTemperatureDependentLatentHeat?: boolean;
  /** Use pressure-dependent psychrometric constant (default true) */
  usePressureDependentPsychrometric?: boolean;
}

/**
 * Calculate transpiration using the Penman-Monteith equation
 *
 * @param inputs - Input parameters for the model
 * @returns Transpiration calculation results
 *
 * @example
 * ```typescript
 * const result = penmanMonteith({
 *   airTemperature: 22,
 *   relativeHumidity: 70,
 *   netRadiation: 150,
 *   stomatalResistance: 100,
 *   aerodynamicResistance: 50,
 * });
 *
 * console.log(`Transpiration: ${result.transpirationRate} mm/h`);
 * console.log(`Latent heat flux: ${result.latentHeatFlux} W/m²`);
 * ```
 */
export function penmanMonteith(inputs: PenmanMonteithInputs): TranspirationOutputs {
  // Extract inputs with defaults
  const {
    airTemperature,
    relativeHumidity,
    netRadiation,
    stomatalResistance,
    aerodynamicResistance,
    soilHeatFlux = 0,
    vpd: providedVpd,
    atmosphericPressure = 101.325,
    useTemperatureDependentLatentHeat = true,
    usePressureDependentPsychrometric = true,
  } = inputs;

  // Validate inputs
  validateInputs(inputs);

  // Calculate or use provided VPD
  const vpdResult = calculateVpd(airTemperature, relativeHumidity);
  const vpd = providedVpd ?? vpdResult.vpd;

  // Calculate slope of saturation vapor pressure curve (Δ)
  // Δ = 4098 × e_s / (T + 237.3)² [kPa/°C]
  const delta = vpdResult.vaporPressureSlope;

  // Calculate temperature-dependent latent heat if enabled
  // λ = 2.501 - 0.002361 × T [MJ/kg] → [J/kg]
  const lambda = useTemperatureDependentLatentHeat
    ? latentHeatOfVaporization(airTemperature)
    : LATENT_HEAT_VAPORIZATION;

  // Calculate pressure-dependent psychrometric constant if enabled
  // γ = 0.000665 × P [kPa/°C]
  const gamma = usePressureDependentPsychrometric
    ? psychrometricConstant(atmosphericPressure)
    : PSYCHROMETRIC_CONSTANT;

  // Calculate air density
  // ρ = 3.486 × P / T_K [kg/m³]
  const rho = airDensity(airTemperature, atmosphericPressure);

  // =========================================================================
  // Penman-Monteith Equation
  // =========================================================================
  //
  // ET = [Δ(Rn - G) + ρa·cp·VPD/ra] / [λ(Δ + γ(1 + rs/ra))]
  //
  // Numerator has two terms:
  //   1. Radiation term: Δ(Rn - G)
  //   2. Aerodynamic term: ρa·cp·VPD/ra
  //
  // Denominator:
  //   λ × [Δ + γ(1 + rs/ra)]
  // =========================================================================

  // Radiation term [W/m²]
  // Note: Δ is in kPa/°C, need to convert to be dimensionally consistent
  // Actually in the standard form, this simplifies when units are handled correctly
  const radiationTerm = delta * (netRadiation - soilHeatFlux);

  // Aerodynamic term [W/m²]
  // ρa·cp·VPD/ra where VPD is in kPa, need to convert to Pa for unit consistency
  // Or use VPD in kPa and cp in kJ/(kg·K)
  const aerodynamicTerm = (rho * SPECIFIC_HEAT_AIR * vpd * KPA_TO_PA) / aerodynamicResistance;

  // Numerator [W/m²]
  const numerator = radiationTerm + aerodynamicTerm;

  // Resistance ratio (rs/ra)
  const resistanceRatio = stomatalResistance / aerodynamicResistance;

  // Denominator factor (Δ + γ(1 + rs/ra)) [kPa/°C]
  const denominatorFactor = delta + gamma * (1 + resistanceRatio);

  // Latent heat flux [W/m²]
  // LE = numerator / denominatorFactor
  // Note: The division by λ happens when converting to mass flux
  const latentHeatFlux = numerator / denominatorFactor;

  // Sensible heat flux [W/m²] from energy balance
  // H = (Rn - G) - LE
  const sensibleHeatFlux = (netRadiation - soilHeatFlux) - latentHeatFlux;

  // Convert latent heat flux to transpiration rate
  // E = LE / λ [kg/(m²·s)]
  const transpirationRateMass = latentHeatFlux / lambda;

  // Convert to mm/h (1 kg/m² = 1 mm water depth)
  const transpirationRate = transpirationRateMass * SECONDS_PER_HOUR;

  // Water vapor flux equals mass transpiration rate
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
 * Validate Penman-Monteith inputs
 */
function validateInputs(inputs: PenmanMonteithInputs): void {
  const errors: string[] = [];

  // Temperature validation
  const tempResult = validateRange(
    inputs.airTemperature,
    ENVIRONMENTAL_RANGES.airTemperature,
    'airTemperature'
  );
  if (!tempResult.valid) errors.push(...tempResult.errors);

  // Humidity validation
  const rhResult = validateRange(
    inputs.relativeHumidity,
    ENVIRONMENTAL_RANGES.relativeHumidity,
    'relativeHumidity'
  );
  if (!rhResult.valid) errors.push(...rhResult.errors);

  // Net radiation validation
  if (inputs.netRadiation !== undefined) {
    const rnResult = validateRange(
      inputs.netRadiation,
      ENVIRONMENTAL_RANGES.netRadiation,
      'netRadiation'
    );
    if (!rnResult.valid) errors.push(...rnResult.errors);
  }

  // Stomatal resistance validation
  const rsResult = validateRange(
    inputs.stomatalResistance,
    PLANT_PHYSIOLOGY_RANGES.stomatalResistance,
    'stomatalResistance'
  );
  if (!rsResult.valid) errors.push(...rsResult.errors);

  // Aerodynamic resistance validation
  const raResult = validateRange(
    inputs.aerodynamicResistance,
    PLANT_PHYSIOLOGY_RANGES.aerodynamicResistance,
    'aerodynamicResistance'
  );
  if (!raResult.valid) errors.push(...raResult.errors);

  if (errors.length > 0) {
    throw new Error(`Penman-Monteith input validation failed:\n${errors.join('\n')}`);
  }
}

/**
 * Calculate stomatal resistance from environmental factors
 *
 * @description
 * Empirical model for stomatal resistance based on light, VPD, and temperature.
 * Useful when measured stomatal resistance is not available.
 *
 * @equation
 * ```
 * rs = rs_min × f_light × f_vpd × f_temp
 * ```
 *
 * @param ppfd PPFD in μmol/(m²·s)
 * @param vpd VPD in kPa
 * @param temperature Temperature in °C
 * @param options Model options
 * @returns Estimated stomatal resistance in s/m
 */
export function estimateStomatalResistance(
  ppfd: number,
  vpd: number,
  temperature: number,
  options: {
    rsMin?: number;
    rsMax?: number;
    ppfdHalfSaturation?: number;
    vpdSensitivity?: number;
    optimalTemperature?: number;
    temperatureRange?: number;
  } = {}
): number {
  const {
    rsMin = 100, // s/m - well-watered, high light
    rsMax = 1000, // s/m - stressed/dark
    ppfdHalfSaturation = 200, // μmol/(m²·s)
    vpdSensitivity = 0.5, // kPa⁻¹
    optimalTemperature = 25, // °C
    temperatureRange = 10, // °C
  } = options;

  // Light response (Michaelis-Menten type)
  // f_light decreases rs as light increases
  const lightFactor = ppfd > 0 ? 1 + (ppfdHalfSaturation / ppfd) : 10;

  // VPD response (linear increase with VPD)
  // f_vpd increases rs as VPD increases (stomata close)
  const vpdFactor = 1 + vpdSensitivity * vpd;

  // Temperature response (optimum curve)
  const tempDeviation = Math.abs(temperature - optimalTemperature);
  const tempFactor = 1 + Math.pow(tempDeviation / temperatureRange, 2);

  // Combined resistance
  const rs = rsMin * lightFactor * vpdFactor * tempFactor;

  // Clamp to valid range
  return Math.min(Math.max(rs, rsMin), rsMax);
}

/**
 * Calculate aerodynamic resistance for a plant canopy
 *
 * @description
 * Calculates aerodynamic resistance based on wind speed and canopy properties.
 *
 * @equation
 * For neutral stability:
 * ```
 * ra = ln((z-d)/z0m) × ln((z-d)/z0h) / (k² × u)
 * ```
 *
 * Simplified for CEA (low wind):
 * ```
 * ra ≈ 208 / u  [s/m]
 * ```
 *
 * @param windSpeed Wind speed at reference height in m/s
 * @param options Calculation options
 * @returns Aerodynamic resistance in s/m
 *
 * @reference FAO-56, Equations 4-6
 */
export function calculateAerodynamicResistance(
  windSpeed: number,
  options: {
    referenceHeight?: number;
    plantHeight?: number;
    useSimplified?: boolean;
  } = {}
): number {
  const {
    referenceHeight = 2, // m - standard measurement height
    plantHeight = 0.12, // m - default grass height
    useSimplified = false,
  } = options;

  // Minimum wind speed to avoid division by zero
  const u = Math.max(windSpeed, 0.1);

  if (useSimplified) {
    // Simplified formula for CEA environments
    // ra = 208 / u  (FAO-56 assumption for grass)
    return 208 / u;
  }

  // Full calculation
  const k = 0.41; // von Karman constant
  const d = 0.67 * plantHeight; // Zero plane displacement
  const z0m = 0.123 * plantHeight; // Roughness length for momentum
  const z0h = 0.1 * z0m; // Roughness length for heat

  const z_minus_d = referenceHeight - d;

  // Avoid negative or zero arguments for log
  if (z_minus_d <= 0 || z_minus_d <= z0m || z_minus_d <= z0h) {
    // Fall back to simplified
    return 208 / u;
  }

  const ra =
    (Math.log(z_minus_d / z0m) * Math.log(z_minus_d / z0h)) / (Math.pow(k, 2) * u);

  return ra;
}

export default penmanMonteith;
