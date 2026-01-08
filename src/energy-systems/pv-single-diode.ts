/**
 * PV Single Diode Model
 *
 * Implementation of the single-diode equivalent circuit model for
 * photovoltaic (PV) module performance prediction.
 *
 * @module energy-systems/pv-single-diode
 *
 * @description
 * The single-diode model represents a PV cell/module as an equivalent circuit
 * consisting of:
 * - A current source (photocurrent I_ph)
 * - A diode with saturation current I_0 and ideality factor n
 * - A series resistance R_s
 * - A shunt (parallel) resistance R_sh
 *
 * The governing equation is:
 * I = I_ph - I_0 × [exp((V + I×R_s)/(n×N_s×V_t)) - 1] - (V + I×R_s)/R_sh
 *
 * where:
 * - V_t = k×T/q is the thermal voltage
 * - N_s is the number of cells in series
 *
 * Five parameters (I_ph, I_0, R_s, R_sh, n) are extracted from manufacturer
 * datasheet specifications at STC, then adjusted for actual operating conditions.
 *
 * @references
 * - De Soto, W., Klein, S.A., Beckman, W.A. (2006). Improvement and validation
 *   of a model for photovoltaic array performance. Solar Energy, 80(1), 78-88.
 *   DOI: 10.1016/j.solener.2005.06.010
 *
 * - Villalva, M.G., Gazoli, J.R., Filho, E.R. (2009). Comprehensive approach to
 *   modeling and simulation of photovoltaic arrays. IEEE Transactions on Power
 *   Electronics, 24(5), 1198-1208. DOI: 10.1109/TPEL.2009.2013862
 *
 * - King, D.L., Boyson, W.E., Kratochvil, J.A. (2004). Photovoltaic Array
 *   Performance Model. Sandia National Laboratories Report SAND2004-3535.
 *
 * - Sera, D., Teodorescu, R., Rodriguez, P. (2007). PV panel model based on
 *   datasheet values. IEEE International Symposium on Industrial Electronics.
 */

import type {
  PVModuleSpecification,
  PVInputs,
  PVOutputs,
  IVCurve,
  FiveParameters,
  MPPResult,
} from './types';
import { PV_CONSTANTS, calculateThermalVoltage, calculateBandgap } from './pv-constants';
import { getModuleSpec, PV_MODULE_DATABASE } from './pv-modules';

// Re-export for convenience
export { calculateThermalVoltage } from './pv-constants';

// ============================================================================
// Numerical Solver Configuration
// ============================================================================

/**
 * Newton-Raphson solver configuration
 */
const SOLVER_CONFIG = {
  /** Maximum iterations for Newton-Raphson */
  MAX_ITERATIONS: 100,
  /** Convergence tolerance for current [A] */
  TOLERANCE: 1e-9,
};

/**
 * Number of points for I-V curve generation
 */
const DEFAULT_IV_POINTS = 100;

// ============================================================================
// Five Parameter Extraction
// ============================================================================

/**
 * Extract five parameters from module datasheet at STC
 *
 * @description
 * Uses the improved iterative method from Villalva et al. (2009) to extract
 * the five parameters (I_ph, I_0, R_s, R_sh, n) from datasheet values.
 *
 * The algorithm uses an iterative approach to find Rs and Rsh that make
 * the calculated power at MPP match the datasheet value while ensuring
 * the I-V curve passes through the key datasheet points.
 *
 * Key insight: For module-level modeling, we use a modified approach where
 * the ideality factor n is applied to the module thermal voltage (n*Ns*Vt),
 * which affects how I_0 is calculated from the Voc condition.
 *
 * @param spec - PV module specification from datasheet
 * @returns Five parameters at STC (25°C)
 *
 * @reference
 * Villalva, M.G., et al. (2009). IEEE Trans. Power Electron., 24(5), 1198-1208.
 *
 * @example
 * ```typescript
 * const spec = PV_MODULE_DATABASE['jinko_tiger_pro_545'];
 * const params = extractFiveParameters(spec);
 * console.log(`I_ph: ${params.iPhoto} A`);
 * console.log(`I_0: ${params.iSat} A`);
 * ```
 */
export function extractFiveParameters(spec: PVModuleSpecification): FiveParameters {
  const { vOc, iSc, vMpp, iMpp, pMax, nCells } = spec;

  // Thermal voltage at STC (per cell)
  const Vt = calculateThermalVoltage(PV_CONSTANTS.STC_TEMPERATURE);

  // -------------------------------------------------------------------------
  // Step 1: Determine ideality factor n
  // -------------------------------------------------------------------------
  // Ideality factor depends on cell technology
  // For high-efficiency silicon: n ≈ 1.0-1.3
  // Use empirical relationship with fill factor
  const FF = pMax / (vOc * iSc);
  // Higher FF typically correlates with lower ideality factor
  const n = Math.max(1.0, Math.min(1.5, 1.3 - 0.5 * (FF - 0.75)));

  // Module thermal voltage: a = n * Ns * Vt
  // This is the voltage scaling factor for the diode equation
  const a = n * nCells * Vt;

  // -------------------------------------------------------------------------
  // Step 2: Initial estimates for Rs and Rsh
  // -------------------------------------------------------------------------
  // Following Villalva et al. (2009) methodology

  // Initial Rsh: Start with a high value (will be refined)
  // Rsh affects the slope of I-V curve near Isc
  let rsh = (vOc - vMpp) / Math.max(0.01, iSc - iMpp) * 5; // Initial estimate
  rsh = Math.max(500, Math.min(rsh, 50000));

  // Initial Rs: Start near zero (will be increased during iteration)
  let rs = (vOc - vMpp) / iMpp * 0.15; rs = Math.max(0.01, Math.min(rs, 1.0));

  // -------------------------------------------------------------------------
  // Step 3: Iterative refinement of Rs and Rsh (Villalva algorithm)
  // -------------------------------------------------------------------------
  // The goal is to find Rs and Rsh such that:
  // 1. The calculated Pmax matches the datasheet Pmax
  // 2. The I-V curve passes through (0, Isc), (Voc, 0), and (Vmpp, Impp)

  const MAX_ITERATIONS = 300;
  const P_TOL = 0.005; // 0.01% power tolerance
  const RS_INCREMENT = 0.01; // Small Rs increment

  let iPhoto = iSc; // Initial estimate
  let iSat = 1e-10; // Initial estimate

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Calculate I_ph from Isc condition (at V=0, I=Isc)
    // From: Isc = Iph - I0*(exp(Isc*Rs/a)-1) - Isc*Rs/Rsh
    // Rearranging: Iph = Isc*(1 + Rs/Rsh) + I0*(exp(Isc*Rs/a)-1)
    // Initially, I0 term is negligible
    iPhoto = iSc * (1 + rs / rsh);

    // Calculate I_0 from Voc condition (at V=Voc, I=0)
    // From: 0 = Iph - I0*(exp(Voc/a)-1) - Voc/Rsh
    // Rearranging: I0 = (Iph - Voc/Rsh) / (exp(Voc/a) - 1)
    const expVocA = Math.exp(vOc / a);
    iSat = (iPhoto - vOc / rsh) / (expVocA - 1);

    // Ensure I0 is positive
    if (iSat <= 0) {
      iSat = 1e-15;
    }

    // Refine I_ph with the calculated I_0
    const expIscRsA = Math.exp(iSc * rs / a);
    iPhoto = iSc * (1 + rs / rsh) + iSat * (expIscRsA - 1);

    // Recalculate I_0 with refined I_ph
    iSat = (iPhoto - vOc / rsh) / (expVocA - 1);
    if (iSat <= 0) {
      iSat = 1e-15;
    }

    // Build current parameters
    const params: FiveParameters = { iPhoto, iSat, rs, rsh, n };

    // Calculate current at MPP using Newton-Raphson
    const iMppCalc = solveSingleDiodeEquation(vMpp, params, Vt, nCells);
    const pMppCalc = vMpp * iMppCalc;

    // Check convergence
    const pError = (pMppCalc - pMax) / pMax;

    if (Math.abs(pError) < P_TOL) {
      // Converged - parameters found
      break;
    }

    // Adjust Rs based on power error
    // If Pcalc > Pmax, need to increase Rs (more losses)
    // If Pcalc < Pmax, need to decrease Rs (less losses)
    if (pError > 0) {
      // Power too high, increase Rs
      rs += RS_INCREMENT;
    } else {
      // Power too low, decrease Rs
      rs -= RS_INCREMENT * 0.5;
      if (rs < 0.0001) {
        rs = 0.0001;
      }
    }

    // Limit Rs to reasonable range
    // Rs should not exceed (Voc - Vmpp) / Impp
    const rsMax = (vOc - vMpp) / iMpp;
    if (rs > rsMax) {
      rs = rsMax * 0.95;
    }

    // Adjust Rsh to maintain Isc accuracy
    // Calculate Isc with current parameters
    const iScCalc = solveSingleDiodeEquation(0, params, Vt, nCells);
    const iScError = (iScCalc - iSc) / iSc;

    if (Math.abs(iScError) > 0.001) {
      // Adjust Rsh to compensate
      // Higher Rsh = higher Isc
      rsh = rsh * (1 + iScError * 0.5);
      rsh = Math.max(100, Math.min(rsh, 50000));
    }
  }

  return {
    iPhoto,
    iSat,
    rs,
    rsh,
    n,
  };
}

// ============================================================================
// Current/Voltage Correction Functions
// ============================================================================

/**
 * Calculate photocurrent at actual conditions
 *
 * @description
 * Adjusts reference photocurrent for actual irradiance and temperature:
 * I_ph = I_ph_ref × (1 + α_Isc × (T - T_ref)) × (G / G_ref)
 *
 * Note: alphaIsc from datasheets is typically a relative coefficient.
 * For example, 0.00042 means 0.042%/°C.
 *
 * @param iPhRef - Reference photocurrent at STC [A]
 * @param irradiance - Actual irradiance [W/m²]
 * @param temperature - Actual cell temperature [°C]
 * @param alphaIsc - Relative temperature coefficient of Isc [1/°C]
 * @returns Photocurrent at actual conditions [A]
 *
 * @reference De Soto et al. (2006), Eq. 4
 */
export function calculatePhotocurrent(
  iPhRef: number,
  irradiance: number,
  temperature: number,
  alphaIsc: number
): number {
  const { STC_IRRADIANCE, STC_TEMPERATURE } = PV_CONSTANTS;

  if (irradiance <= 0) {
    return 0;
  }

  // Temperature difference from STC
  const dT = temperature - STC_TEMPERATURE;

  // Temperature-corrected photocurrent
  // alphaIsc is relative coefficient (e.g., 0.00042 = 0.042%/°C)
  const iPhTemp = iPhRef * (1 + alphaIsc * dT);

  // Irradiance scaling (linear with irradiance)
  return iPhTemp * (irradiance / STC_IRRADIANCE);
}

/**
 * Calculate saturation current at actual temperature
 *
 * @description
 * Adjusts reference saturation current for actual temperature:
 * I_0 = I_0_ref × (T/T_ref)³ × exp[(q×E_g)/(n×k) × (1/T_ref - 1/T)]
 *
 * The strong temperature dependence of I_0 is the primary cause
 * of Voc decrease with temperature.
 *
 * @param i0Ref - Reference saturation current at STC [A]
 * @param temperature - Actual cell temperature [°C]
 * @param n - Diode ideality factor [-]
 * @returns Saturation current at actual temperature [A]
 *
 * @reference De Soto et al. (2006), Eq. 5
 */
export function calculateSaturationCurrent(
  i0Ref: number,
  temperature: number,
  n: number
): number {
  const { BOLTZMANN, ELECTRON_CHARGE, STC_TEMPERATURE } = PV_CONSTANTS;

  const T = temperature + 273.15; // Convert to Kelvin
  const Tref = STC_TEMPERATURE + 273.15;

  // Bandgap energy at reference temperature
  const EgRef = calculateBandgap(STC_TEMPERATURE); // eV

  // Temperature ratio term (T/Tref)³
  const tempRatio = Math.pow(T / Tref, 3);

  // Exponential term from bandgap temperature dependence
  // exp[(q×E_g)/(n×k) × (1/T_ref - 1/T)]
  const expArg = (ELECTRON_CHARGE * EgRef) / (n * BOLTZMANN) * (1 / Tref - 1 / T);
  const expTerm = Math.exp(expArg);

  return i0Ref * tempRatio * expTerm;
}

// ============================================================================
// Single Diode Equation Solver
// ============================================================================

/**
 * Solve single diode equation for current at given voltage
 *
 * @description
 * Solves the implicit equation:
 * I = I_ph - I_0 × [exp((V + I×R_s)/(n×N_s×V_t)) - 1] - (V + I×R_s)/R_sh
 *
 * Uses Newton-Raphson iteration to find I for given V.
 *
 * @param voltage - Module voltage [V]
 * @param params - Five parameters at operating conditions
 * @param Vt - Thermal voltage at operating temperature [V]
 * @param nCells - Number of cells in series
 * @returns Module current [A]
 *
 * @reference Villalva et al. (2009), Section II.A
 */
export function solveSingleDiodeEquation(
  voltage: number,
  params: FiveParameters,
  Vt: number,
  nCells: number
): number {
  const { iPhoto, iSat, rs, rsh, n } = params;

  // Thermal voltage for module (a = n * Ns * Vt)
  const a = n * nCells * Vt;

  // Handle edge cases
  if (voltage < 0) {
    return iPhoto; // Approximate short-circuit behavior
  }

  // Initial guess: start near photocurrent
  let I = iPhoto * 0.95;

  // Newton-Raphson iteration
  for (let iter = 0; iter < SOLVER_CONFIG.MAX_ITERATIONS; iter++) {
    // Argument for exponential
    const expArg = (voltage + I * rs) / a;

    // Limit exponential argument to prevent overflow
    const expArgLimited = Math.min(expArg, 700);
    const expTerm = Math.exp(expArgLimited);

    // Function: f(I) = I - I_ph + I_0*(exp(...)-1) + (V+I*Rs)/Rsh
    const f = I - iPhoto + iSat * (expTerm - 1) + (voltage + I * rs) / rsh;

    // Derivative: df/dI = 1 + I_0*Rs/a*exp(...) + Rs/Rsh
    const dfdI = 1 + (iSat * rs / a) * expTerm + rs / rsh;

    // Newton-Raphson update
    const dI = f / dfdI;
    I = I - dI;

    // Ensure I stays in reasonable bounds
    I = Math.max(0, Math.min(I, iPhoto * 1.1));

    // Check convergence
    if (Math.abs(dI) < SOLVER_CONFIG.TOLERANCE) {
      break;
    }
  }

  return Math.max(0, I);
}

// ============================================================================
// I-V Curve Calculation
// ============================================================================

/**
 * Calculate I-V curve for PV module
 *
 * @description
 * Generates the characteristic I-V curve by solving the single diode
 * equation at multiple voltage points from 0 to Voc.
 *
 * @param spec - Module specification
 * @param irradiance - Irradiance [W/m²]
 * @param temperature - Cell temperature [°C]
 * @param numPoints - Number of points on curve (default 100)
 * @returns I-V curve data
 *
 * @example
 * ```typescript
 * const spec = PV_MODULE_DATABASE['jinko_tiger_pro_545'];
 * const ivCurve = calculateIVCurve(spec, 1000, 25, 100);
 * // Plot ivCurve.voltage vs ivCurve.current
 * ```
 */
export function calculateIVCurve(
  spec: PVModuleSpecification,
  irradiance: number,
  temperature: number,
  numPoints: number = DEFAULT_IV_POINTS
): IVCurve {
  // Handle zero irradiance
  if (irradiance <= 0) {
    return {
      voltage: Array(numPoints).fill(0),
      current: Array(numPoints).fill(0),
      power: Array(numPoints).fill(0),
    };
  }

  // Extract reference parameters at STC
  const paramsRef = extractFiveParameters(spec);

  // Adjust parameters for operating conditions
  const Vt = calculateThermalVoltage(temperature);
  const iPhoto = calculatePhotocurrent(
    paramsRef.iPhoto,
    irradiance,
    temperature,
    spec.alphaIsc
  );
  const iSat = calculateSaturationCurrent(paramsRef.iSat, temperature, paramsRef.n);

  const params: FiveParameters = {
    iPhoto,
    iSat,
    rs: paramsRef.rs,
    rsh: paramsRef.rsh,
    n: paramsRef.n,
  };

  // Estimate Voc at operating conditions
  // Voc changes with temperature (negative coefficient)
  const dT = temperature - PV_CONSTANTS.STC_TEMPERATURE;
  const VocTemp = spec.vOc * (1 + spec.betaVoc * dT);

  // Adjust Voc for irradiance (logarithmic relationship)
  // At low irradiance, Voc decreases approximately as n*Ns*Vt*ln(G/Gref)
  let Voc = VocTemp;
  if (irradiance < PV_CONSTANTS.STC_IRRADIANCE) {
    Voc = VocTemp + params.n * spec.nCells * Vt *
      Math.log(irradiance / PV_CONSTANTS.STC_IRRADIANCE);
  }
  Voc = Math.max(0.1, Voc);

  // Generate voltage array from 0 to Voc
  const voltage: number[] = [];
  const current: number[] = [];
  const power: number[] = [];

  for (let i = 0; i < numPoints; i++) {
    const V = (i / (numPoints - 1)) * Voc;
    const I = solveSingleDiodeEquation(V, params, Vt, spec.nCells);

    voltage.push(V);
    current.push(I);
    power.push(V * I);
  }

  return { voltage, current, power };
}

// ============================================================================
// Maximum Power Point Calculation
// ============================================================================

/**
 * Calculate maximum power point (MPP)
 *
 * @description
 * Finds the voltage, current, and power at the maximum power point
 * using golden section search on the I-V curve.
 *
 * @param spec - Module specification
 * @param irradiance - Irradiance [W/m²]
 * @param temperature - Cell temperature [°C]
 * @returns MPP result (Vmpp, Impp, Pmpp)
 *
 * @example
 * ```typescript
 * const spec = PV_MODULE_DATABASE['jinko_tiger_pro_545'];
 * const mpp = calculateMPP(spec, 1000, 25);
 * console.log(`Pmax: ${mpp.pMpp} W at ${mpp.vMpp} V`);
 * ```
 */
export function calculateMPP(
  spec: PVModuleSpecification,
  irradiance: number,
  temperature: number
): MPPResult {
  if (irradiance <= 0) {
    return { vMpp: 0, iMpp: 0, pMpp: 0 };
  }

  const { STC_IRRADIANCE, STC_TEMPERATURE } = PV_CONSTANTS;
  const dT = temperature - STC_TEMPERATURE;
  const G_ratio = irradiance / STC_IRRADIANCE;

  // Temperature correction using datasheet coefficients (De Soto 2006)
  const vMppTemp = spec.vMpp * (1 + spec.betaVoc * dT);
  const iMppTemp = spec.iMpp * (1 + spec.alphaIsc * dT);

  // Irradiance scaling
  const iMppScaled = iMppTemp * G_ratio;

  // Vmpp logarithmic dependence at low irradiance
  const Vt = calculateThermalVoltage(temperature);
  const n = 1.2;
  let vMppScaled = vMppTemp;
  if (G_ratio < 1.0) {
    vMppScaled = vMppTemp + n * spec.nCells * Vt * Math.log(Math.max(0.01, G_ratio));
  }
  vMppScaled = Math.max(0.1, vMppScaled);

  const pMpp = vMppScaled * iMppScaled;

  // Efficiency derating for very low irradiance
  let effFactor = 1.0;
  if (irradiance < 200) {
    effFactor = 0.9 + 0.1 * (irradiance / 200);
  }

  return {
    vMpp: vMppScaled,
    iMpp: iMppScaled,
    pMpp: pMpp * effFactor,
  };
}

// ============================================================================
// PV Single Diode Model Class
// ============================================================================

/**
 * PV Single Diode Model
 *
 * @description
 * Complete implementation of the single-diode equivalent circuit model
 * for PV module performance prediction. Provides methods for calculating
 * electrical output at any irradiance and temperature conditions.
 *
 * @example
 * ```typescript
 * // Create model from database
 * const model = new PVSingleDiodeModel('jinko_tiger_pro_545');
 *
 * // Calculate output at operating conditions
 * const result = model.calculate({
 *   irradiance: 800,
 *   cellTemperature: 45,
 * });
 *
 * console.log(`Power: ${result.pMpp.toFixed(1)} W`);
 * console.log(`Efficiency: ${result.efficiency.toFixed(1)}%`);
 * ```
 */
export class PVSingleDiodeModel {
  private readonly spec: PVModuleSpecification;
  private readonly paramsRef: FiveParameters;

  /**
   * Create a PV single diode model
   *
   * @param moduleOrName - Module specification or name from database
   * @throws Error if module name not found in database
   */
  constructor(moduleOrName: PVModuleSpecification | string) {
    if (typeof moduleOrName === 'string') {
      const spec = getModuleSpec(moduleOrName);
      if (!spec) {
        throw new Error(
          `Module '${moduleOrName}' not found in database. ` +
          `Available modules: ${Object.keys(PV_MODULE_DATABASE).join(', ')}`
        );
      }
      this.spec = spec;
    } else {
      this.spec = moduleOrName;
    }

    // Extract five parameters at STC
    this.paramsRef = extractFiveParameters(this.spec);
  }

  /**
   * Get module specification
   */
  get module(): PVModuleSpecification {
    return this.spec;
  }

  /**
   * Get reference parameters (at STC)
   */
  get referenceParameters(): FiveParameters {
    return { ...this.paramsRef };
  }

  /**
   * Calculate PV output at given conditions
   *
   * @param inputs - Operating conditions (irradiance, temperature)
   * @returns Complete PV output including MPP, efficiency, and parameters
   */
  calculate(inputs: Omit<PVInputs, 'module'>): PVOutputs {
    const { irradiance, cellTemperature } = inputs;

    // Handle zero or negative irradiance
    if (irradiance <= 0) {
      return this.createZeroOutput();
    }

    // Calculate operating parameters
    const Vt = calculateThermalVoltage(cellTemperature);
    const iPhoto = calculatePhotocurrent(
      this.paramsRef.iPhoto,
      irradiance,
      cellTemperature,
      this.spec.alphaIsc
    );
    const iSat = calculateSaturationCurrent(
      this.paramsRef.iSat,
      cellTemperature,
      this.paramsRef.n
    );

    const params: FiveParameters = {
      iPhoto,
      iSat,
      rs: this.paramsRef.rs,
      rsh: this.paramsRef.rsh,
      n: this.paramsRef.n,
    };

    // Calculate Voc at operating conditions
    const vOc = this.calculateVoc(params, Vt, irradiance, cellTemperature);

    // Calculate Isc (current at V=0)
    const iSc = solveSingleDiodeEquation(0, params, Vt, this.spec.nCells);

    // Calculate MPP using datasheet-based approach (De Soto 2006)
    const mpp = calculateMPP(this.spec, irradiance, cellTemperature);

    // Calculate efficiency and fill factor
    const efficiency = (mpp.pMpp / (this.spec.area * irradiance)) * 100;
    const fillFactor = vOc > 0 && iSc > 0
      ? (mpp.pMpp / (vOc * iSc)) * 100
      : 0;

    return {
      // Operating point (at MPP by default)
      voltage: mpp.vMpp,
      current: mpp.iMpp,
      power: mpp.pMpp,

      // MPP values
      vMpp: mpp.vMpp,
      iMpp: mpp.iMpp,
      pMpp: mpp.pMpp,

      // Key points
      vOc,
      iSc,

      // Efficiency metrics
      efficiency,
      fillFactor,

      // Five parameters at operating conditions
      iPhoto: params.iPhoto,
      iSat: params.iSat,
      rs: params.rs,
      rsh: params.rsh,
      n: params.n,
    };
  }

  /**
   * Generate I-V curve at given conditions
   *
   * @param irradiance - Irradiance [W/m²]
   * @param temperature - Cell temperature [°C]
   * @param numPoints - Number of points (default 100)
   * @returns I-V curve data
   */
  getIVCurve(
    irradiance: number,
    temperature: number,
    numPoints: number = DEFAULT_IV_POINTS
  ): IVCurve {
    return calculateIVCurve(this.spec, irradiance, temperature, numPoints);
  }

  /**
   * Calculate Voc at operating conditions
   */
  private calculateVoc(
    params: FiveParameters,
    Vt: number,
    irradiance: number,
    temperature: number
  ): number {
    // Temperature effect on Voc
    const dT = temperature - PV_CONSTANTS.STC_TEMPERATURE;
    let vOc = this.spec.vOc * (1 + this.spec.betaVoc * dT);

    // Irradiance effect (logarithmic) - only for reduced irradiance
    if (irradiance < PV_CONSTANTS.STC_IRRADIANCE && irradiance > 0) {
      vOc += params.n * this.spec.nCells * Vt *
        Math.log(irradiance / PV_CONSTANTS.STC_IRRADIANCE);
    }

    return Math.max(0, vOc);
  }

  /**
   * Create zero output for zero irradiance condition
   */
  private createZeroOutput(): PVOutputs {
    return {
      voltage: 0,
      current: 0,
      power: 0,
      vMpp: 0,
      iMpp: 0,
      pMpp: 0,
      vOc: 0,
      iSc: 0,
      efficiency: 0,
      fillFactor: 0,
      iPhoto: 0,
      iSat: this.paramsRef.iSat,
      rs: this.paramsRef.rs,
      rsh: this.paramsRef.rsh,
      n: this.paramsRef.n,
    };
  }
}
