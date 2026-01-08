/**
 * Photosynthesis Module Type Definitions
 *
 * Types for the Farquhar-von Caemmerer-Berry (FvCB) biochemical model
 * of C3 photosynthesis.
 *
 * @module plant-physiology/photosynthesis/types
 *
 * @references
 * - Farquhar, G.D., von Caemmerer, S., Berry, J.A. (1980). A biochemical model
 *   of photosynthetic CO2 assimilation in leaves of C3 species. Planta 149:78-90.
 * - von Caemmerer, S. (2000). Biochemical Models of Leaf Photosynthesis.
 *   CSIRO Publishing, Collingwood, Australia.
 * - Bernacchi, C.J., et al. (2001). Improved temperature response functions
 *   for models of Rubisco-limited photosynthesis. Plant Cell Environ. 24:253-259.
 */

/**
 * Environmental conditions for photosynthesis calculation
 */
export interface PhotosynthesisEnvironment {
  /**
   * Leaf temperature [K]
   * @range 273-323 K (0-50°C)
   */
  leafTemperature: number;

  /**
   * Intercellular CO2 partial pressure [Pa]
   * Also known as Ci
   * @range 0-100 Pa (typical indoor: 20-40 Pa)
   */
  intercellularCO2: number;

  /**
   * Photosynthetically active radiation absorbed by leaf [µmol m⁻² s⁻¹]
   * This is PPFD * absorptance, not incident PPFD
   * @range 0-2000 µmol m⁻² s⁻¹
   */
  absorbedPPFD: number;

  /**
   * Atmospheric pressure [Pa]
   * @default 101325 Pa
   */
  atmosphericPressure?: number;

  /**
   * Oxygen partial pressure [Pa]
   * @default 21000 Pa (21% of 101325 Pa)
   */
  oxygenPartialPressure?: number;
}

/**
 * Biochemical parameters for FvCB model at 25°C reference temperature
 *
 * These parameters are species-specific and should be obtained from
 * literature or measured experimentally.
 *
 * @references
 * - Wullschleger, S.D. (1993). Biochemical limitations to carbon assimilation
 *   in C3 plants - A retrospective analysis. New Phytologist 125:563-582.
 * - Sharkey, T.D., et al. (2007). Fitting photosynthetic carbon dioxide
 *   response curves for C3 leaves. Plant Cell Environ. 30:1035-1040.
 */
export interface FvCBParameters {
  /**
   * Maximum rate of Rubisco carboxylation at 25°C [µmol m⁻² s⁻¹]
   * @range 20-200 µmol m⁻² s⁻¹ (typical: 50-150)
   *
   * @reference Wullschleger (1993) Table 1
   */
  Vcmax25: number;

  /**
   * Maximum rate of electron transport at 25°C [µmol m⁻² s⁻¹]
   * Typically Jmax25 ≈ 1.67 * Vcmax25
   * @range 50-400 µmol m⁻² s⁻¹ (typical: 80-250)
   *
   * @reference Wullschleger (1993) Table 1
   */
  Jmax25: number;

  /**
   * Day respiration at 25°C [µmol m⁻² s⁻¹]
   * Typically Rd25 ≈ 0.01-0.02 * Vcmax25
   * @range 0.5-3 µmol m⁻² s⁻¹
   */
  Rd25: number;

  /**
   * Triose phosphate utilization rate at 25°C [µmol m⁻² s⁻¹]
   * Often omitted (set to Infinity) unless specifically measured
   * @optional
   */
  TPU25?: number;

  /**
   * Curvature factor for light response of electron transport [-]
   * @range 0.7-1.0 (typical: 0.9)
   * @default 0.9
   */
  theta?: number;

  /**
   * Quantum yield of electron transport [mol e⁻ mol⁻¹ photons]
   * At low light, accounts for absorptance already if using absorbedPPFD
   * @range 0.2-0.5 (typical: 0.3-0.4)
   * @default 0.3
   */
  alpha?: number;
}

/**
 * Temperature response parameters for Arrhenius/peaked functions
 *
 * @references
 * - Bernacchi, C.J., et al. (2001). Improved temperature response functions.
 *   Plant Cell Environ. 24:253-259.
 * - Bernacchi, C.J., et al. (2003). In vivo temperature response functions.
 *   Plant Cell Environ. 26:1419-1430.
 */
export interface TemperatureResponseParams {
  /**
   * Activation energy [J mol⁻¹]
   * For simple Arrhenius: parameter = ref * exp(Ea/R * (1/Tref - 1/T))
   */
  Ea: number;

  /**
   * Deactivation energy [J mol⁻¹]
   * Only for peaked response (Vcmax, Jmax)
   * @optional
   */
  Ed?: number;

  /**
   * Entropy factor [J mol⁻¹ K⁻¹]
   * Only for peaked response (Vcmax, Jmax)
   * @optional
   */
  dS?: number;
}

/**
 * Kinetic constants at 25°C with temperature response parameters
 *
 * Default values from Bernacchi et al. (2001, 2003) for tobacco
 * These can be adjusted for other species
 */
export interface RubiscoKinetics {
  /**
   * Michaelis-Menten constant for CO2 at 25°C [Pa]
   * @default 40.49 Pa (Bernacchi 2001)
   */
  Kc25: number;

  /**
   * Michaelis-Menten constant for O2 at 25°C [Pa]
   * @default 27840 Pa (Bernacchi 2001)
   */
  Ko25: number;

  /**
   * CO2 compensation point (without Rd) at 25°C [Pa]
   * Also called Gamma-star (Γ*)
   * @default 4.275 Pa (Bernacchi 2001)
   */
  GammaStar25: number;

  /**
   * Temperature response for Kc
   */
  KcResponse: TemperatureResponseParams;

  /**
   * Temperature response for Ko
   */
  KoResponse: TemperatureResponseParams;

  /**
   * Temperature response for Gamma-star
   */
  GammaStarResponse: TemperatureResponseParams;
}

/**
 * Result of FvCB photosynthesis calculation
 */
export interface PhotosynthesisResult {
  /**
   * Net CO2 assimilation rate [µmol m⁻² s⁻¹]
   * A = min(Ac, Aj, Ap) - Rd
   */
  netAssimilation: number;

  /**
   * Gross CO2 assimilation rate [µmol m⁻² s⁻¹]
   * Ag = min(Ac, Aj, Ap)
   */
  grossAssimilation: number;

  /**
   * Rubisco-limited assimilation rate [µmol m⁻² s⁻¹]
   * Ac (carboxylation limited)
   */
  rubiscoLimited: number;

  /**
   * RuBP regeneration (electron transport) limited rate [µmol m⁻² s⁻¹]
   * Aj (electron transport limited)
   */
  electronTransportLimited: number;

  /**
   * TPU-limited assimilation rate [µmol m⁻² s⁻¹]
   * Ap (triose phosphate utilization limited)
   * Infinity if TPU not limiting
   */
  tpuLimited: number;

  /**
   * Day respiration rate [µmol m⁻² s⁻¹]
   * Rd (positive value, subtracted from gross)
   */
  dayRespiration: number;

  /**
   * Actual electron transport rate [µmol m⁻² s⁻¹]
   * J at current PPFD and temperature
   */
  electronTransportRate: number;

  /**
   * Limiting factor at current conditions
   */
  limitingFactor: 'rubisco' | 'electron_transport' | 'tpu';

  /**
   * Temperature-adjusted Vcmax [µmol m⁻² s⁻¹]
   */
  Vcmax: number;

  /**
   * Temperature-adjusted Jmax [µmol m⁻² s⁻¹]
   */
  Jmax: number;

  /**
   * Effective Michaelis-Menten constant for CO2 [Pa]
   * Km = Kc * (1 + O/Ko)
   */
  effectiveKm: number;

  /**
   * CO2 compensation point [Pa]
   * Γ* (temperature adjusted)
   */
  compensationPoint: number;
}

/**
 * Options for FvCB calculation
 */
export interface FvCBOptions {
  /**
   * Custom Rubisco kinetics (species-specific)
   * Uses Bernacchi tobacco values if not provided
   */
  rubiscoKinetics?: Partial<RubiscoKinetics>;

  /**
   * Include TPU limitation
   * @default false
   */
  includeTpuLimitation?: boolean;

  /**
   * Use smooth minimum instead of strict minimum for transitions
   * @default false
   */
  useSmoothMinimum?: boolean;

  /**
   * Curvature for smooth minimum (if useSmoothMinimum is true)
   * @default 0.98
   */
  smoothCurvature?: number;
}

/**
 * Parameters for A-Ci curve fitting
 */
export interface ACiCurveFittingInput {
  /**
   * Array of intercellular CO2 values [Pa]
   */
  Ci: number[];

  /**
   * Array of measured net assimilation rates [µmol m⁻² s⁻¹]
   */
  A: number[];

  /**
   * Leaf temperature during measurement [K]
   */
  leafTemperature: number;

  /**
   * PPFD during measurement (saturating light) [µmol m⁻² s⁻¹]
   */
  ppfd: number;
}

/**
 * Parameters for light response curve calculation
 */
export interface LightResponseInput {
  /**
   * Leaf temperature [K]
   */
  leafTemperature: number;

  /**
   * Intercellular CO2 [Pa]
   * Typically at ambient (~40 Pa) or elevated conditions
   */
  intercellularCO2: number;

  /**
   * Array of PPFD values to calculate [µmol m⁻² s⁻¹]
   */
  ppfdRange: number[];
}

/**
 * Crop-specific default parameters
 *
 * Literature values for common indoor farming crops
 */
export interface CropPhotosynthesisParams {
  /**
   * Crop name
   */
  name: string;

  /**
   * Scientific name
   */
  scientificName: string;

  /**
   * FvCB parameters
   */
  params: FvCBParameters;

  /**
   * Optimal temperature for photosynthesis [K]
   */
  optimalTemperature: number;

  /**
   * Literature reference
   */
  reference: string;
}
