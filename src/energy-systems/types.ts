/**
 * Energy Systems Module Type Definitions
 *
 * Types for photovoltaic, energy storage, and radiative cooling models.
 *
 * @module energy-systems/types
 *
 * @references
 * - De Soto, W., et al. (2006). Improvement and validation of a model for
 *   photovoltaic array performance. Solar Energy, 80(1), 78-88.
 * - Villalva, M.G., et al. (2009). Comprehensive approach to modeling and
 *   simulation of photovoltaic arrays. IEEE Trans. Power Electron., 24(5), 1198-1208.
 * - King, D.L., et al. (2004). Sandia Photovoltaic Array Performance Model. SAND2004-3535.
 */

// ============================================================================
// Photovoltaic Module Specification
// ============================================================================

/**
 * PV Module specification from manufacturer datasheet
 *
 * All electrical parameters are at Standard Test Conditions (STC):
 * - Irradiance: 1000 W/m²
 * - Cell Temperature: 25°C
 * - Air Mass: AM1.5G
 *
 * @example
 * ```typescript
 * const module: PVModuleSpecification = {
 *   model: 'Tiger Pro 545W',
 *   manufacturer: 'Jinko Solar',
 *   pMax: 545,
 *   vMpp: 41.28,
 *   iMpp: 13.21,
 *   vOc: 49.62,
 *   iSc: 13.89,
 *   alphaIsc: 0.00042,
 *   betaVoc: -0.0027,
 *   gammaPmax: -0.0035,
 *   nCells: 144,
 *   nBypass: 3,
 *   area: 2.562,
 *   reference: 'Jinko Solar Datasheet 2023'
 * };
 * ```
 */
export interface PVModuleSpecification {
  /**
   * Module model name/number
   */
  model: string;

  /**
   * Manufacturer name
   */
  manufacturer: string;

  /**
   * Maximum power at STC [W]
   * Also known as Pmax or rated power
   * @range 50-700 W (typical residential/commercial modules)
   */
  pMax: number;

  /**
   * Voltage at maximum power point at STC [V]
   * @range 20-60 V (typical)
   */
  vMpp: number;

  /**
   * Current at maximum power point at STC [A]
   * @range 5-15 A (typical)
   */
  iMpp: number;

  /**
   * Open circuit voltage at STC [V]
   * Voc > Vmpp always
   * @range 25-70 V (typical)
   */
  vOc: number;

  /**
   * Short circuit current at STC [A]
   * Isc > Impp always
   * @range 5-16 A (typical)
   */
  iSc: number;

  /**
   * Temperature coefficient of Isc [A/°C] or [%/°C]
   * Typically positive (Isc increases with temperature)
   *
   * If given as absolute [A/°C]: use directly
   * If given as relative [%/°C]: multiply by Isc/100
   *
   * @range 0.0003-0.0006 A/°C (absolute) or 0.03-0.06 %/°C (relative)
   */
  alphaIsc: number;

  /**
   * Temperature coefficient of Voc [V/°C per volt] or [%/°C]
   * Typically negative (Voc decreases with temperature)
   *
   * If given as [%/°C]: value like -0.0027 means -0.27%/°C
   * Multiply by Voc to get absolute change
   *
   * @range -0.004 to -0.002 per °C (relative) or -0.15 to -0.10 V/°C (absolute per cell)
   */
  betaVoc: number;

  /**
   * Temperature coefficient of Pmax [%/°C]
   * Typically negative (power decreases with temperature)
   *
   * @range -0.005 to -0.003 per °C (i.e., -0.5% to -0.3% per °C)
   */
  gammaPmax: number;

  /**
   * Number of cells in series
   * @range 54-144 (typical for crystalline silicon modules)
   */
  nCells: number;

  /**
   * Number of bypass diodes
   * @range 1-4 (typical)
   */
  nBypass: number;

  /**
   * Module area [m²]
   * Total area including frame
   * @range 1.5-3.0 m² (typical)
   */
  area: number;

  /**
   * Reference/source for module data
   */
  reference: string;
}

// ============================================================================
// PV Model Inputs
// ============================================================================

/**
 * Input conditions for PV model calculation
 */
export interface PVInputs {
  /**
   * Total irradiance on module plane [W/m²]
   * Sum of direct, diffuse, and ground-reflected radiation
   * @range 0-1500 W/m² (typical Earth surface)
   */
  irradiance: number;

  /**
   * Cell temperature [°C]
   * Usually higher than ambient due to heating from absorbed radiation
   *
   * Can be estimated from ambient temperature and NOCT:
   * T_cell = T_ambient + (NOCT - 20) * G / 800
   *
   * @range -20 to 80°C (typical operating range)
   */
  cellTemperature: number;

  /**
   * Module specification or module name from database
   * If string, looks up in PV_MODULE_DATABASE
   */
  module?: PVModuleSpecification | string;
}

// ============================================================================
// PV Model Outputs
// ============================================================================

/**
 * Output of PV single diode model calculation
 */
export interface PVOutputs {
  /**
   * Operating voltage [V]
   * At the current operating point (may equal vMpp if at MPP)
   */
  voltage: number;

  /**
   * Operating current [A]
   * At the current operating point (may equal iMpp if at MPP)
   */
  current: number;

  /**
   * Operating power [W]
   * P = V * I at current operating point
   */
  power: number;

  /**
   * Voltage at maximum power point [V]
   */
  vMpp: number;

  /**
   * Current at maximum power point [A]
   */
  iMpp: number;

  /**
   * Power at maximum power point [W]
   * Maximum extractable power at current conditions
   */
  pMpp: number;

  /**
   * Open circuit voltage [V]
   * Voltage when I = 0
   */
  vOc: number;

  /**
   * Short circuit current [A]
   * Current when V = 0
   */
  iSc: number;

  /**
   * Module efficiency [%]
   * eta = Pmax / (Area * G) * 100
   */
  efficiency: number;

  /**
   * Fill factor [%]
   * FF = Pmax / (Voc * Isc) * 100
   * Measure of I-V curve "squareness"
   * @range 70-85% for crystalline silicon
   */
  fillFactor: number;

  /**
   * Extracted photocurrent [A]
   * One of the five single-diode model parameters
   */
  iPhoto: number;

  /**
   * Extracted saturation current [A]
   * One of the five single-diode model parameters
   * Very small value, typically 1e-12 to 1e-8 A
   */
  iSat: number;

  /**
   * Extracted series resistance [Ohm]
   * One of the five single-diode model parameters
   * @range 0.1-0.5 Ohm (typical for module)
   */
  rs: number;

  /**
   * Extracted shunt (parallel) resistance [Ohm]
   * One of the five single-diode model parameters
   * @range 100-10000 Ohm (high for good modules)
   */
  rsh: number;

  /**
   * Extracted diode ideality factor [-]
   * One of the five single-diode model parameters
   * @range 1.0-1.5 for single-diode model
   */
  n: number;
}

// ============================================================================
// I-V Curve
// ============================================================================

/**
 * I-V curve data structure
 *
 * Contains arrays of voltage, current, and power points
 * defining the characteristic curve of the PV module
 */
export interface IVCurve {
  /**
   * Array of voltage points [V]
   * From 0 to Voc
   */
  voltage: number[];

  /**
   * Array of current points [A]
   * From Isc (at V=0) to 0 (at V=Voc)
   */
  current: number[];

  /**
   * Array of power points [W]
   * P[i] = voltage[i] * current[i]
   */
  power: number[];
}

// ============================================================================
// Five Parameters (Single Diode Model)
// ============================================================================

/**
 * Five parameters of the single-diode model
 *
 * These parameters are extracted from the module specification
 * at reference conditions (usually STC) and then adjusted for
 * actual operating conditions (irradiance, temperature).
 *
 * @description
 * Single diode equation:
 * I = I_ph - I_0 * [exp((V + I*R_s)/(n*N_s*V_t)) - 1] - (V + I*R_s)/R_sh
 *
 * where:
 * - V_t = k*T/q (thermal voltage)
 * - N_s = number of cells in series
 *
 * @references
 * - Villalva, M.G., et al. (2009). IEEE Trans. Power Electron., 24(5), 1198-1208.
 */
export interface FiveParameters {
  /**
   * Photocurrent (light-generated current) [A]
   * Approximately equal to Isc
   */
  iPhoto: number;

  /**
   * Diode saturation (reverse saturation) current [A]
   * Very small, typically 1e-12 to 1e-8 A
   */
  iSat: number;

  /**
   * Series resistance [Ohm]
   * Represents contact resistance and bulk resistance
   */
  rs: number;

  /**
   * Shunt (parallel) resistance [Ohm]
   * Represents leakage paths across the p-n junction
   */
  rsh: number;

  /**
   * Diode ideality factor [-]
   * n = 1 for ideal diode, typically 1.0-1.5 for real cells
   */
  n: number;
}

// ============================================================================
// MPP (Maximum Power Point) Result
// ============================================================================

/**
 * Maximum Power Point result
 */
export interface MPPResult {
  /**
   * Voltage at MPP [V]
   */
  vMpp: number;

  /**
   * Current at MPP [A]
   */
  iMpp: number;

  /**
   * Power at MPP [W]
   */
  pMpp: number;
}

// ============================================================================
// PV Array Configuration
// ============================================================================

/**
 * PV array configuration for multiple modules
 */
export interface PVArrayConfiguration {
  /**
   * Number of modules in series per string
   */
  modulesInSeries: number;

  /**
   * Number of parallel strings
   */
  stringsInParallel: number;

  /**
   * Module specification
   */
  module: PVModuleSpecification;

  /**
   * Array tilt angle [degrees]
   * 0 = horizontal, 90 = vertical
   */
  tiltAngle?: number;

  /**
   * Array azimuth angle [degrees]
   * 0 = North, 90 = East, 180 = South, 270 = West
   */
  azimuthAngle?: number;
}

// ============================================================================
// PV System Losses
// ============================================================================

/**
 * PV system loss factors
 *
 * These factors account for various losses in a real PV system
 * beyond what the single-diode model captures.
 */
export interface PVSystemLosses {
  /**
   * Soiling losses [%]
   * Dust, dirt, bird droppings, etc.
   * @range 1-5% (typical)
   */
  soiling?: number;

  /**
   * Shading losses [%]
   * Near shading from obstacles
   * @range 0-10% (site dependent)
   */
  shading?: number;

  /**
   * Snow losses [%]
   * Annual average for snow cover
   * @range 0-5% (climate dependent)
   */
  snow?: number;

  /**
   * Mismatch losses [%]
   * Module-to-module variation
   * @range 1-3% (typical)
   */
  mismatch?: number;

  /**
   * Wiring (DC) losses [%]
   * DC cable losses
   * @range 1-3% (typical)
   */
  dcWiring?: number;

  /**
   * AC wiring losses [%]
   * AC cable losses
   * @range 0.5-1.5% (typical)
   */
  acWiring?: number;

  /**
   * Inverter efficiency [%]
   * DC to AC conversion efficiency
   * @range 95-98% (typical modern inverters)
   */
  inverterEfficiency?: number;

  /**
   * Age degradation [%]
   * Annual degradation rate
   * @range 0.3-0.8%/year (typical for crystalline silicon)
   */
  ageDegradation?: number;

  /**
   * System availability [%]
   * Uptime considering maintenance and failures
   * @range 97-99% (typical)
   */
  availability?: number;
}
