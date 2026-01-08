/**
 * Farquhar-von Caemmerer-Berry (FvCB) Photosynthesis Model
 *
 * Implementation of the biochemical model of C3 photosynthesis.
 *
 * @module plant-physiology/photosynthesis/farquhar-fvcb
 *
 * @description
 * The FvCB model describes photosynthesis as limited by three potential processes:
 * 1. Rubisco carboxylation (Ac) - enzyme activity limited
 * 2. RuBP regeneration (Aj) - electron transport limited
 * 3. Triose phosphate utilization (Ap) - export limited
 *
 * Net assimilation: A = min(Ac, Aj, Ap) - Rd
 *
 * @references
 * - Farquhar, G.D., von Caemmerer, S., Berry, J.A. (1980). A biochemical model
 *   of photosynthetic CO2 assimilation in leaves of C3 species. Planta 149:78-90.
 *   DOI: 10.1007/BF00386231
 *
 * - von Caemmerer, S., Farquhar, G.D. (1981). Some relationships between the
 *   biochemistry of photosynthesis and the gas exchange of leaves.
 *   Planta 153:376-387.
 *
 * - Bernacchi, C.J., Singsaas, E.L., Pimentel, C., Portis Jr, A.R., Long, S.P.
 *   (2001). Improved temperature response functions for models of Rubisco-limited
 *   photosynthesis. Plant Cell Environ. 24:253-259.
 *
 * - Bernacchi, C.J., Pimentel, C., Long, S.P. (2003). In vivo temperature response
 *   functions that improve the prediction of photosynthesis. Plant Cell Environ.
 *   26:1419-1430.
 *
 * - Sharkey, T.D., Bernacchi, C.J., Farquhar, G.D., Singsaas, E.L. (2007).
 *   Fitting photosynthetic carbon dioxide response curves for C3 leaves.
 *   Plant Cell Environ. 30:1035-1040.
 */

import type {
  PhotosynthesisEnvironment,
  FvCBParameters,
  RubiscoKinetics,
  TemperatureResponseParams,
  PhotosynthesisResult,
  FvCBOptions,
  LightResponseInput,
  CropPhotosynthesisParams,
} from './types';

// ============================================================================
// Physical Constants
// ============================================================================

/**
 * Universal gas constant [J mol⁻¹ K⁻¹]
 * @reference CODATA 2018
 */
const R = 8.314462618;

/**
 * Reference temperature [K] (25°C)
 */
const T_REF = 298.15;

// ============================================================================
// Default Rubisco Kinetics (Bernacchi et al. 2001, 2003)
// ============================================================================

/**
 * Default Rubisco kinetics from Bernacchi et al. (2001, 2003)
 * Based on in vivo measurements of tobacco (Nicotiana tabacum)
 *
 * These values are widely used as reasonable defaults for C3 plants
 * but should be replaced with species-specific values when available.
 *
 * @reference
 * - Bernacchi, C.J., et al. (2001). Plant Cell Environ. 24:253-259.
 * - Bernacchi, C.J., et al. (2003). Plant Cell Environ. 26:1419-1430.
 */
export const DEFAULT_RUBISCO_KINETICS: RubiscoKinetics = {
  // Michaelis-Menten constant for CO2 at 25°C [Pa]
  // From Bernacchi (2001): Kc25 = 404.9 µbar = 40.49 Pa
  Kc25: 40.49,
  KcResponse: {
    // Ea = 79430 J mol⁻¹ (Bernacchi 2001)
    Ea: 79430,
  },

  // Michaelis-Menten constant for O2 at 25°C [Pa]
  // From Bernacchi (2001): Ko25 = 278.4 mbar = 27840 Pa
  Ko25: 27840,
  KoResponse: {
    // Ea = 36380 J mol⁻¹ (Bernacchi 2001)
    Ea: 36380,
  },

  // CO2 compensation point without Rd (Γ*) at 25°C [Pa]
  // From Bernacchi (2001): Γ* = 42.75 µbar = 4.275 Pa
  GammaStar25: 4.275,
  GammaStarResponse: {
    // Ea = 37830 J mol⁻¹ (Bernacchi 2001)
    Ea: 37830,
  },
};

/**
 * Temperature response parameters for Vcmax
 * Peaked Arrhenius function
 *
 * @reference Bernacchi et al. (2003) Table 1
 */
export const VCMAX_TEMPERATURE_RESPONSE: TemperatureResponseParams = {
  Ea: 65330, // Activation energy [J mol⁻¹]
  Ed: 149250, // Deactivation energy [J mol⁻¹]
  dS: 485, // Entropy factor [J mol⁻¹ K⁻¹]
};

/**
 * Temperature response parameters for Jmax
 * Peaked Arrhenius function
 *
 * @reference Bernacchi et al. (2003) Table 1
 */
export const JMAX_TEMPERATURE_RESPONSE: TemperatureResponseParams = {
  Ea: 43540, // Activation energy [J mol⁻¹]
  Ed: 152040, // Deactivation energy [J mol⁻¹]
  dS: 495, // Entropy factor [J mol⁻¹ K⁻¹]
};

/**
 * Temperature response parameters for Rd
 * Simple Arrhenius function
 *
 * @reference Bernacchi et al. (2001)
 */
export const RD_TEMPERATURE_RESPONSE: TemperatureResponseParams = {
  Ea: 46390, // Activation energy [J mol⁻¹]
};

// ============================================================================
// Temperature Response Functions
// ============================================================================

/**
 * Simple Arrhenius temperature response
 *
 * @description
 * k(T) = k25 * exp(Ea/R * (1/T_ref - 1/T))
 *
 * Used for: Kc, Ko, Γ*, Rd
 *
 * @reference Equation 1 in Bernacchi et al. (2001)
 *
 * @param value25 - Parameter value at 25°C
 * @param Ea - Activation energy [J mol⁻¹]
 * @param T - Leaf temperature [K]
 * @returns Temperature-adjusted parameter value
 */
export function arrheniusResponse(
  value25: number,
  Ea: number,
  T: number
): number {
  // k(T) = k25 * exp(Ea/R * (T - T_ref) / (T_ref * T))
  // Equivalent to: k(T) = k25 * exp(Ea/R * (1/T_ref - 1/T))
  return value25 * Math.exp((Ea / R) * ((T - T_REF) / (T_REF * T)));
}

/**
 * Peaked Arrhenius temperature response (Johnson modification)
 *
 * @description
 * For parameters with thermal deactivation at high temperatures:
 *
 * k(T) = k25 * exp(Ea/R * (1/T_ref - 1/T)) /
 *        (1 + exp((dS*T - Ed) / (R*T)))
 *
 * Normalized form (Medlyn et al. 2002):
 * k(T) = k25 * f(T) / f(T_ref)
 * where f(T) = exp(Ea*(T-T_ref)/(R*T_ref*T)) / (1 + exp((dS*T-Ed)/(R*T)))
 *
 * Used for: Vcmax, Jmax
 *
 * @reference
 * - Harley, P.C., Tenhunen, J.D. (1991). Modeling the photosynthetic response
 *   of C3 leaves to environmental factors. In: Boote, K.J., Loomis, R.S. (Eds.),
 *   Modeling Crop Photosynthesis. CSSA, Madison, pp. 17-39.
 * - Medlyn, B.E., et al. (2002). Plant Cell Environ. 25:1167-1179.
 *
 * @param value25 - Parameter value at 25°C
 * @param params - Temperature response parameters (Ea, Ed, dS)
 * @param T - Leaf temperature [K]
 * @returns Temperature-adjusted parameter value
 */
export function peakedArrheniusResponse(
  value25: number,
  params: TemperatureResponseParams,
  T: number
): number {
  const { Ea, Ed = 200000, dS = 650 } = params;

  // Numerator: activation term
  const activation = Math.exp((Ea * (T - T_REF)) / (R * T_REF * T));

  // Denominator: deactivation term at temperature T
  const deactivationT = 1 + Math.exp((dS * T - Ed) / (R * T));

  // Denominator: deactivation term at reference temperature
  const deactivationRef = 1 + Math.exp((dS * T_REF - Ed) / (R * T_REF));

  return value25 * activation * (deactivationRef / deactivationT);
}

// ============================================================================
// Electron Transport
// ============================================================================

/**
 * Calculate potential electron transport rate (J) from absorbed PPFD
 *
 * @description
 * Solves the non-rectangular hyperbola:
 * θ*J² - (α*PPFD + Jmax)*J + α*PPFD*Jmax = 0
 *
 * Solution (smaller root):
 * J = (α*PPFD + Jmax - sqrt((α*PPFD + Jmax)² - 4*θ*α*PPFD*Jmax)) / (2*θ)
 *
 * @reference
 * - Farquhar, G.D., Wong, S.C. (1984). An empirical model of stomatal
 *   conductance. Aust. J. Plant Physiol. 11:191-210.
 * - von Caemmerer, S. (2000). Biochemical Models of Leaf Photosynthesis.
 *   Chapter 2, Equation 2.21.
 *
 * @param absorbedPPFD - PPFD absorbed by leaf [µmol m⁻² s⁻¹]
 * @param Jmax - Maximum electron transport rate [µmol m⁻² s⁻¹]
 * @param alpha - Quantum yield of electron transport [mol e⁻ mol⁻¹ photons]
 * @param theta - Curvature factor [-]
 * @returns Electron transport rate J [µmol m⁻² s⁻¹]
 */
export function calculateElectronTransportRate(
  absorbedPPFD: number,
  Jmax: number,
  alpha: number = 0.3,
  theta: number = 0.9
): number {
  // Handle edge cases
  if (absorbedPPFD <= 0) {
    return 0;
  }
  if (Jmax <= 0) {
    return 0;
  }

  // For theta = 1, the equation becomes linear
  if (Math.abs(theta - 1) < 1e-10) {
    return Math.min(alpha * absorbedPPFD, Jmax);
  }

  // For theta = 0, also linear
  if (theta < 1e-10) {
    return Math.min(alpha * absorbedPPFD, Jmax);
  }

  // Non-rectangular hyperbola solution
  const a = theta;
  const b = -(alpha * absorbedPPFD + Jmax);
  const c = alpha * absorbedPPFD * Jmax;

  // Discriminant
  const discriminant = b * b - 4 * a * c;

  // Should always be positive for valid inputs, but check
  if (discriminant < 0) {
    // Fallback to minimum
    return Math.min(alpha * absorbedPPFD, Jmax);
  }

  // Smaller root (the physiologically meaningful one)
  const J = (-b - Math.sqrt(discriminant)) / (2 * a);

  return J;
}

// ============================================================================
// FvCB Model Core Calculations
// ============================================================================

/**
 * Calculate Rubisco-limited assimilation rate (Ac)
 *
 * @description
 * At low CO2, photosynthesis is limited by the carboxylation rate of Rubisco:
 *
 * Ac = Vcmax * (Ci - Γ*) / (Ci + Km)
 *
 * where Km = Kc * (1 + O/Ko)
 *
 * @reference
 * Farquhar et al. (1980) Equation 5
 *
 * @param Vcmax - Maximum Rubisco carboxylation rate [µmol m⁻² s⁻¹]
 * @param Ci - Intercellular CO2 [Pa]
 * @param gammaStar - CO2 compensation point [Pa]
 * @param Km - Effective Michaelis constant [Pa]
 * @returns Rubisco-limited rate Ac [µmol m⁻² s⁻¹]
 */
export function calculateRubiscoLimited(
  Vcmax: number,
  Ci: number,
  gammaStar: number,
  Km: number
): number {
  // Avoid division by zero
  if (Ci + Km <= 0) {
    return 0;
  }

  // Net assimilation is zero or negative below compensation point
  const Ac = (Vcmax * (Ci - gammaStar)) / (Ci + Km);

  return Math.max(0, Ac);
}

/**
 * Calculate RuBP regeneration (electron transport) limited assimilation rate (Aj)
 *
 * @description
 * At high CO2 and/or low light, photosynthesis is limited by RuBP regeneration:
 *
 * Aj = J * (Ci - Γ*) / (4*Ci + 8*Γ*)
 *
 * The coefficients 4 and 8 come from the stoichiometry of the Calvin cycle
 * (4 electrons needed per CO2 fixed, plus photorespiration costs)
 *
 * @reference
 * Farquhar et al. (1980) Equation 7
 *
 * @param J - Electron transport rate [µmol m⁻² s⁻¹]
 * @param Ci - Intercellular CO2 [Pa]
 * @param gammaStar - CO2 compensation point [Pa]
 * @returns RuBP-limited rate Aj [µmol m⁻² s⁻¹]
 */
export function calculateElectronTransportLimited(
  J: number,
  Ci: number,
  gammaStar: number
): number {
  // Avoid division by zero
  const denominator = 4 * Ci + 8 * gammaStar;
  if (denominator <= 0) {
    return 0;
  }

  const Aj = (J * (Ci - gammaStar)) / denominator;

  return Math.max(0, Aj);
}

/**
 * Calculate TPU-limited assimilation rate (Ap)
 *
 * @description
 * At very high CO2, photosynthesis may be limited by the rate at which
 * triose phosphates can be utilized (exported from the chloroplast):
 *
 * Ap = 3 * TPU * (Ci - Γ*) / (Ci - (1+3*α)*Γ*)
 *
 * For simplicity, often approximated as: Ap = 3 * TPU
 *
 * @reference
 * Sharkey, T.D. (1985). Photosynthesis in intact leaves of C3 plants: Physics,
 * physiology and rate limitations. Bot. Rev. 51:53-105.
 *
 * @param TPU - Triose phosphate utilization rate [µmol m⁻² s⁻¹]
 * @param Ci - Intercellular CO2 [Pa]
 * @param gammaStar - CO2 compensation point [Pa]
 * @returns TPU-limited rate Ap [µmol m⁻² s⁻¹]
 */
export function calculateTpuLimited(
  TPU: number,
  Ci: number,
  gammaStar: number
): number {
  if (!TPU || TPU === Infinity) {
    return Infinity;
  }

  // Simplified TPU limitation (Sharkey et al. 2007 recommendation)
  // Ap = 3 * TPU (assumes photorespiration returns 0.5 mol Pi per oxygenation)
  return 3 * TPU;
}

/**
 * Smooth minimum function (hyperbolic)
 *
 * @description
 * Instead of strict min(a, b), uses hyperbolic blending:
 * result = (a + b - sqrt((a-b)² + 4*θ*a*b)) / 2
 *
 * This provides a smoother transition between limiting factors
 * which can be more realistic and numerically stable.
 *
 * @reference
 * Collatz, G.J., et al. (1991). Physiological and environmental regulation
 * of stomatal conductance, photosynthesis and transpiration.
 * Agric. For. Meteorol. 54:107-136.
 *
 * @param a - First value
 * @param b - Second value
 * @param theta - Curvature (0.98-0.999, closer to 1 = sharper transition)
 * @returns Smooth minimum value
 */
export function smoothMinimum(a: number, b: number, theta: number = 0.98): number {
  // Handle infinities
  if (!isFinite(a)) return b;
  if (!isFinite(b)) return a;

  const diff = a - b;
  const discriminant = diff * diff + 4 * (1 - theta) * a * b;

  return (a + b - Math.sqrt(discriminant)) / 2;
}

// ============================================================================
// Main FvCB Calculation
// ============================================================================

/**
 * Calculate leaf photosynthesis using the FvCB model
 *
 * @description
 * The complete Farquhar-von Caemmerer-Berry model for C3 photosynthesis.
 * Calculates net CO2 assimilation as the minimum of three potentially
 * limiting rates, minus day respiration.
 *
 * A = min(Ac, Aj, Ap) - Rd
 *
 * @reference
 * Farquhar, G.D., von Caemmerer, S., Berry, J.A. (1980). Planta 149:78-90.
 *
 * @param env - Environmental conditions
 * @param params - Biochemical parameters at 25°C
 * @param options - Calculation options
 * @returns Photosynthesis result with all component rates
 *
 * @example
 * ```typescript
 * const result = farquharFvCB(
 *   {
 *     leafTemperature: 298.15, // 25°C
 *     intercellularCO2: 30,    // Pa
 *     absorbedPPFD: 500,       // µmol m⁻² s⁻¹
 *   },
 *   {
 *     Vcmax25: 120,
 *     Jmax25: 200,
 *     Rd25: 1.5,
 *   }
 * );
 * console.log(`Net A: ${result.netAssimilation.toFixed(2)} µmol m⁻² s⁻¹`);
 * ```
 */
export function farquharFvCB(
  env: PhotosynthesisEnvironment,
  params: FvCBParameters,
  options: FvCBOptions = {}
): PhotosynthesisResult {
  // Extract environment
  const {
    leafTemperature: T,
    intercellularCO2: Ci,
    absorbedPPFD,
    oxygenPartialPressure = 21000, // 21% of 101325 Pa
  } = env;

  // Extract parameters
  const {
    Vcmax25,
    Jmax25,
    Rd25,
    TPU25 = Infinity,
    theta = 0.9,
    alpha = 0.3,
  } = params;

  // Extract options
  const {
    rubiscoKinetics = {},
    includeTpuLimitation = false,
    useSmoothMinimum = false,
    smoothCurvature = 0.98,
  } = options;

  // Merge with default Rubisco kinetics
  const kinetics: RubiscoKinetics = {
    ...DEFAULT_RUBISCO_KINETICS,
    ...rubiscoKinetics,
  };

  // -------------------------------------------------------------------------
  // Temperature adjustments
  // -------------------------------------------------------------------------

  // Vcmax - peaked Arrhenius
  const Vcmax = peakedArrheniusResponse(Vcmax25, VCMAX_TEMPERATURE_RESPONSE, T);

  // Jmax - peaked Arrhenius
  const Jmax = peakedArrheniusResponse(Jmax25, JMAX_TEMPERATURE_RESPONSE, T);

  // Rd - simple Arrhenius
  const Rd = arrheniusResponse(Rd25, RD_TEMPERATURE_RESPONSE.Ea, T);

  // TPU - assume Q10 of 2 if specified
  const TPU = includeTpuLimitation && TPU25 !== Infinity
    ? TPU25 * Math.pow(2, (T - T_REF) / 10)
    : Infinity;

  // Kc - simple Arrhenius
  const Kc = arrheniusResponse(kinetics.Kc25, kinetics.KcResponse.Ea, T);

  // Ko - simple Arrhenius
  const Ko = arrheniusResponse(kinetics.Ko25, kinetics.KoResponse.Ea, T);

  // Gamma star - simple Arrhenius
  const gammaStar = arrheniusResponse(
    kinetics.GammaStar25,
    kinetics.GammaStarResponse.Ea,
    T
  );

  // Effective Michaelis constant: Km = Kc * (1 + O/Ko)
  const O = oxygenPartialPressure;
  const Km = Kc * (1 + O / Ko);

  // -------------------------------------------------------------------------
  // Calculate limiting rates
  // -------------------------------------------------------------------------

  // Electron transport rate
  const J = calculateElectronTransportRate(absorbedPPFD, Jmax, alpha, theta);

  // Rubisco-limited rate
  const Ac = calculateRubiscoLimited(Vcmax, Ci, gammaStar, Km);

  // Electron transport-limited rate
  const Aj = calculateElectronTransportLimited(J, Ci, gammaStar);

  // TPU-limited rate
  const Ap = calculateTpuLimited(TPU, Ci, gammaStar);

  // -------------------------------------------------------------------------
  // Determine limiting factor and gross assimilation
  // -------------------------------------------------------------------------

  let Ag: number;
  let limitingFactor: 'rubisco' | 'electron_transport' | 'tpu';

  if (useSmoothMinimum) {
    // Smooth transition between Ac and Aj
    const Acj = smoothMinimum(Ac, Aj, smoothCurvature);
    // Then with Ap if included
    Ag = includeTpuLimitation ? smoothMinimum(Acj, Ap, smoothCurvature) : Acj;

    // Determine limiting factor (approximate)
    if (Ac < Aj && (!includeTpuLimitation || Ac < Ap)) {
      limitingFactor = 'rubisco';
    } else if (Aj < Ac && (!includeTpuLimitation || Aj < Ap)) {
      limitingFactor = 'electron_transport';
    } else {
      limitingFactor = 'tpu';
    }
  } else {
    // Strict minimum
    const rates: Array<{ rate: number; factor: 'rubisco' | 'electron_transport' | 'tpu' }> = [
      { rate: Ac, factor: 'rubisco' as const },
      { rate: Aj, factor: 'electron_transport' as const },
    ];

    if (includeTpuLimitation && isFinite(Ap)) {
      rates.push({ rate: Ap, factor: 'tpu' as const });
    }

    const limiting = rates.reduce((min, current) =>
      current.rate < min.rate ? current : min
    );

    Ag = limiting.rate;
    limitingFactor = limiting.factor;
  }

  // Net assimilation
  const netAssimilation = Ag - Rd;

  // -------------------------------------------------------------------------
  // Return results
  // -------------------------------------------------------------------------

  return {
    netAssimilation,
    grossAssimilation: Ag,
    rubiscoLimited: Ac,
    electronTransportLimited: Aj,
    tpuLimited: Ap,
    dayRespiration: Rd,
    electronTransportRate: J,
    limitingFactor,
    Vcmax,
    Jmax,
    effectiveKm: Km,
    compensationPoint: gammaStar,
  };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Calculate light response curve
 *
 * @description
 * Calculates net assimilation at multiple PPFD levels,
 * useful for characterizing light saturation and efficiency.
 *
 * @param params - FvCB parameters
 * @param input - Light response calculation input
 * @param options - FvCB options
 * @returns Array of {ppfd, netAssimilation, limitingFactor}
 */
export function calculateLightResponse(
  params: FvCBParameters,
  input: LightResponseInput,
  options: FvCBOptions = {}
): Array<{
  ppfd: number;
  netAssimilation: number;
  limitingFactor: 'rubisco' | 'electron_transport' | 'tpu';
}> {
  const { leafTemperature, intercellularCO2, ppfdRange } = input;

  return ppfdRange.map((ppfd) => {
    const result = farquharFvCB(
      {
        leafTemperature,
        intercellularCO2,
        absorbedPPFD: ppfd * 0.85, // Assume 85% absorptance
      },
      params,
      options
    );

    return {
      ppfd,
      netAssimilation: result.netAssimilation,
      limitingFactor: result.limitingFactor,
    };
  });
}

/**
 * Calculate A-Ci curve
 *
 * @description
 * Calculates net assimilation at multiple Ci levels at saturating light,
 * useful for extracting Vcmax, Jmax, and diagnosing limitations.
 *
 * @param params - FvCB parameters
 * @param leafTemperature - Leaf temperature [K]
 * @param ciRange - Array of Ci values [Pa]
 * @param saturatingPPFD - PPFD for saturation [µmol m⁻² s⁻¹]
 * @param options - FvCB options
 * @returns Array of {ci, netAssimilation, Ac, Aj, limitingFactor}
 */
export function calculateACiCurve(
  params: FvCBParameters,
  leafTemperature: number,
  ciRange: number[],
  saturatingPPFD: number = 1500,
  options: FvCBOptions = {}
): Array<{
  ci: number;
  netAssimilation: number;
  rubiscoLimited: number;
  electronTransportLimited: number;
  limitingFactor: 'rubisco' | 'electron_transport' | 'tpu';
}> {
  return ciRange.map((ci) => {
    const result = farquharFvCB(
      {
        leafTemperature,
        intercellularCO2: ci,
        absorbedPPFD: saturatingPPFD * 0.85,
      },
      params,
      options
    );

    return {
      ci,
      netAssimilation: result.netAssimilation,
      rubiscoLimited: result.rubiscoLimited,
      electronTransportLimited: result.electronTransportLimited,
      limitingFactor: result.limitingFactor,
    };
  });
}

// ============================================================================
// Crop Parameter Database
// ============================================================================

/**
 * Default photosynthesis parameters for common indoor farming crops
 *
 * @reference
 * - Wullschleger, S.D. (1993). New Phytologist 125:563-582.
 * - Lefsrud, M.G., Kopsell, D.A., Sams, C.E. (2008). HortScience 43:2063-2068.
 * - Pennisi, G., et al. (2020). Front. Plant Sci. 11:305.
 */
export const CROP_PHOTOSYNTHESIS_PARAMS: Record<string, CropPhotosynthesisParams> = {
  lettuce: {
    name: 'Lettuce',
    scientificName: 'Lactuca sativa',
    params: {
      Vcmax25: 80, // µmol m⁻² s⁻¹
      Jmax25: 130, // µmol m⁻² s⁻¹
      Rd25: 1.0, // µmol m⁻² s⁻¹
      theta: 0.9,
      alpha: 0.3,
    },
    optimalTemperature: 293.15, // 20°C
    reference: 'Wullschleger (1993); Pennisi et al. (2020)',
  },

  basil: {
    name: 'Basil',
    scientificName: 'Ocimum basilicum',
    params: {
      Vcmax25: 100, // µmol m⁻² s⁻¹
      Jmax25: 170, // µmol m⁻² s⁻¹
      Rd25: 1.5, // µmol m⁻² s⁻¹
      theta: 0.9,
      alpha: 0.32,
    },
    optimalTemperature: 298.15, // 25°C
    reference: 'Pennisi et al. (2020)',
  },

  spinach: {
    name: 'Spinach',
    scientificName: 'Spinacia oleracea',
    params: {
      Vcmax25: 90, // µmol m⁻² s⁻¹
      Jmax25: 150, // µmol m⁻² s⁻¹
      Rd25: 1.2, // µmol m⁻² s⁻¹
      theta: 0.9,
      alpha: 0.28,
    },
    optimalTemperature: 291.15, // 18°C
    reference: 'Wullschleger (1993)',
  },

  tomato: {
    name: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    params: {
      Vcmax25: 120, // µmol m⁻² s⁻¹
      Jmax25: 200, // µmol m⁻² s⁻¹
      Rd25: 1.8, // µmol m⁻² s⁻¹
      theta: 0.9,
      alpha: 0.3,
    },
    optimalTemperature: 298.15, // 25°C
    reference: 'Wullschleger (1993)',
  },

  strawberry: {
    name: 'Strawberry',
    scientificName: 'Fragaria x ananassa',
    params: {
      Vcmax25: 70, // µmol m⁻² s⁻¹
      Jmax25: 115, // µmol m⁻² s⁻¹
      Rd25: 0.8, // µmol m⁻² s⁻¹
      theta: 0.9,
      alpha: 0.28,
    },
    optimalTemperature: 293.15, // 20°C
    reference: 'Hidaka et al. (2013)',
  },

  cannabis: {
    name: 'Cannabis',
    scientificName: 'Cannabis sativa',
    params: {
      Vcmax25: 140, // µmol m⁻² s⁻¹
      Jmax25: 230, // µmol m⁻² s⁻¹
      Rd25: 2.0, // µmol m⁻² s⁻¹
      theta: 0.85,
      alpha: 0.32,
    },
    optimalTemperature: 301.15, // 28°C
    reference: 'Chandra et al. (2008, 2011)',
  },

  microgreens: {
    name: 'Microgreens (Generic)',
    scientificName: 'Various',
    params: {
      Vcmax25: 95, // µmol m⁻² s⁻¹
      Jmax25: 160, // µmol m⁻² s⁻¹
      Rd25: 1.4, // µmol m⁻² s⁻¹
      theta: 0.9,
      alpha: 0.3,
    },
    optimalTemperature: 295.15, // 22°C
    reference: 'Pennisi et al. (2020)',
  },
};

/**
 * Get photosynthesis parameters for a specific crop
 *
 * @param cropName - Name of the crop (case-insensitive)
 * @returns Crop parameters or undefined if not found
 */
export function getCropParams(cropName: string): CropPhotosynthesisParams | undefined {
  const key = cropName.toLowerCase();
  return CROP_PHOTOSYNTHESIS_PARAMS[key];
}

/**
 * List all available crop parameter sets
 */
export function listAvailableCrops(): string[] {
  return Object.keys(CROP_PHOTOSYNTHESIS_PARAMS);
}
