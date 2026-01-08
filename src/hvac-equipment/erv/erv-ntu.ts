/**
 * ERV NTU-Effectiveness Model
 *
 * @description
 * Energy Recovery Ventilator (ERV) heat exchanger performance calculations
 * using the NTU (Number of Transfer Units) method. This model calculates
 * sensible and latent heat recovery based on established heat exchanger theory.
 *
 * @references
 * - Kays, W.M. & London, A.L. (1984). Compact Heat Exchangers, 3rd ed.
 *   McGraw-Hill. ISBN 0-07-033418-8. Chapter 3: Basic Thermal Design Theory.
 * - ASHRAE Handbook - HVAC Systems and Equipment (2020), Chapter 26:
 *   Air-to-Air Energy Recovery Equipment.
 * - Zhang, L.Z. (2008). Total heat recovery: Heat and moisture recovery
 *   from ventilation air. Nova Science Publishers.
 * - Incropera, F.P. & DeWitt, D.P. (2002). Fundamentals of Heat and Mass
 *   Transfer, 5th ed. John Wiley & Sons. Chapter 11: Heat Exchangers.
 *
 * @module hvac-equipment/erv
 */

import {
  SPECIFIC_HEAT_AIR,
  AIR_DENSITY_STANDARD,
  LATENT_HEAT_VAPORIZATION,
  ATMOSPHERIC_PRESSURE_STANDARD,
  KELVIN_OFFSET,
} from '../../common/constants';

import {
  saturationVaporPressure,
  humidityRatio,
  airDensity,
} from '../../plant-physiology/transpiration/psychrometrics';

import type {
  FlowArrangement,
  ERVInputs,
  ERVOutputs,
  SupplyOutletInputs,
  ExhaustOutletInputs,
  OutletConditions,
  ERVValidationResult,
  DEFAULT_ERV_PARAMETER_RANGES,
} from './types';

// ============================================================================
// NTU Calculation
// ============================================================================

/**
 * Calculate Number of Transfer Units (NTU)
 *
 * @description
 * NTU is a dimensionless parameter that characterizes the heat transfer
 * "size" of a heat exchanger relative to the fluid heat capacity.
 *
 * @equation
 * ```
 * NTU = UA / C_min
 * ```
 * where:
 * - UA = Overall heat transfer coefficient times area (W/K)
 * - C_min = Minimum heat capacity rate (W/K)
 *
 * @param ua Overall heat transfer coefficient times area (W/K)
 * @param cMin Minimum heat capacity rate (W/K)
 * @returns Number of Transfer Units (dimensionless)
 *
 * @throws {Error} If cMin <= 0 or ua < 0
 *
 * @reference Kays & London (1984), Equation 3-1
 */
export function calculateNtu(ua: number, cMin: number): number {
  if (cMin <= 0) {
    throw new Error(`C_min must be positive, got ${cMin}`);
  }
  if (ua < 0) {
    throw new Error(`UA must be non-negative, got ${ua}`);
  }

  return ua / cMin;
}

// ============================================================================
// Capacity Ratio Calculation
// ============================================================================

/**
 * Calculate heat capacity ratio C_r
 *
 * @description
 * The capacity ratio is the ratio of minimum to maximum heat capacity rates.
 * It ranges from 0 (one fluid with infinite capacity, e.g., condensation)
 * to 1 (balanced flow with equal capacity rates).
 *
 * @equation
 * ```
 * C_r = C_min / C_max
 * ```
 * where:
 * - C_min = min(m_dot_1 * cp_1, m_dot_2 * cp_2)
 * - C_max = max(m_dot_1 * cp_1, m_dot_2 * cp_2)
 *
 * @param cMin Minimum heat capacity rate (W/K)
 * @param cMax Maximum heat capacity rate (W/K)
 * @returns Capacity ratio (0-1)
 *
 * @throws {Error} If either value is <= 0
 *
 * @reference Kays & London (1984), Equation 3-3
 */
export function calculateCapacityRatio(cMin: number, cMax: number): number {
  if (cMin <= 0 || cMax <= 0) {
    throw new Error(`Heat capacity rates must be positive, got C_min=${cMin}, C_max=${cMax}`);
  }

  // Ensure cMin <= cMax by using correct min/max
  const actualCmin = Math.min(cMin, cMax);
  const actualCmax = Math.max(cMin, cMax);

  return actualCmin / actualCmax;
}

// ============================================================================
// Effectiveness Calculations by Flow Arrangement
// ============================================================================

/**
 * Calculate effectiveness for counterflow heat exchanger
 *
 * @description
 * Counterflow arrangement provides the highest effectiveness for a given NTU.
 * In counterflow, the hot and cold fluids flow in opposite directions.
 *
 * @equation
 * For C_r < 1:
 * ```
 * epsilon = (1 - exp(-NTU * (1 - C_r))) / (1 - C_r * exp(-NTU * (1 - C_r)))
 * ```
 *
 * For C_r = 1:
 * ```
 * epsilon = NTU / (1 + NTU)
 * ```
 *
 * @param ntu Number of Transfer Units
 * @param cr Capacity ratio (0-1)
 * @returns Effectiveness (0-1)
 *
 * @reference Kays & London (1984), Table 3-4
 */
function calculateEffectivenessCounterflow(ntu: number, cr: number): number {
  if (ntu === 0) return 0;

  // Special case: C_r = 0 (one fluid with infinite capacity)
  if (cr === 0) {
    return 1 - Math.exp(-ntu);
  }

  // Special case: C_r = 1 (balanced flow)
  // Use numerical tolerance for floating point comparison
  if (Math.abs(cr - 1) < 1e-10) {
    return ntu / (1 + ntu);
  }

  // General case: 0 < C_r < 1
  const expTerm = Math.exp(-ntu * (1 - cr));
  return (1 - expTerm) / (1 - cr * expTerm);
}

/**
 * Calculate effectiveness for crossflow heat exchanger (both fluids unmixed)
 *
 * @description
 * Crossflow with both fluids unmixed is common in plate-fin heat exchangers.
 * Less effective than counterflow but easier to manufacture.
 *
 * @equation
 * ```
 * epsilon = 1 - exp[(1/C_r) * NTU^0.22 * (exp(-C_r * NTU^0.78) - 1)]
 * ```
 *
 * For C_r = 0:
 * ```
 * epsilon = 1 - exp(-NTU)
 * ```
 *
 * @param ntu Number of Transfer Units
 * @param cr Capacity ratio (0-1)
 * @returns Effectiveness (0-1)
 *
 * @reference Kays & London (1984), Table 3-4; ASHRAE Handbook (2020)
 */
function calculateEffectivenessCrossflowUnmixed(ntu: number, cr: number): number {
  if (ntu === 0) return 0;

  // Special case: C_r = 0
  if (cr === 0) {
    return 1 - Math.exp(-ntu);
  }

  // General case using Kays & London approximation
  // This is a widely-used empirical correlation
  const ntu022 = Math.pow(ntu, 0.22);
  const ntu078 = Math.pow(ntu, 0.78);
  const innerExp = Math.exp(-cr * ntu078) - 1;
  return 1 - Math.exp((ntu022 / cr) * innerExp);
}

/**
 * Calculate effectiveness for crossflow heat exchanger (one fluid mixed)
 *
 * @description
 * Crossflow with one fluid mixed (C_max fluid) and one unmixed (C_min fluid).
 * Less common in ERVs.
 *
 * @equation
 * C_max fluid mixed, C_min unmixed:
 * ```
 * epsilon = (1/C_r) * (1 - exp(-C_r * (1 - exp(-NTU))))
 * ```
 *
 * @param ntu Number of Transfer Units
 * @param cr Capacity ratio (0-1)
 * @returns Effectiveness (0-1)
 *
 * @reference Incropera & DeWitt (2002), Table 11.3
 */
function calculateEffectivenessCrossflowMixed(ntu: number, cr: number): number {
  if (ntu === 0) return 0;

  // Special case: C_r = 0
  if (cr === 0) {
    return 1 - Math.exp(-ntu);
  }

  // C_max fluid mixed, C_min unmixed
  const innerExp = 1 - Math.exp(-ntu);
  return (1 / cr) * (1 - Math.exp(-cr * innerExp));
}

/**
 * Calculate effectiveness for parallel flow heat exchanger
 *
 * @description
 * Parallel flow (cocurrent) arrangement where both fluids flow in the same
 * direction. Least effective arrangement; maximum effectiveness is 0.5
 * when C_r = 1.
 *
 * @equation
 * ```
 * epsilon = (1 - exp(-NTU * (1 + C_r))) / (1 + C_r)
 * ```
 *
 * @param ntu Number of Transfer Units
 * @param cr Capacity ratio (0-1)
 * @returns Effectiveness (0-1)
 *
 * @reference Kays & London (1984), Table 3-4
 */
function calculateEffectivenessParallel(ntu: number, cr: number): number {
  if (ntu === 0) return 0;

  // Special case: C_r = 0
  if (cr === 0) {
    return 1 - Math.exp(-ntu);
  }

  return (1 - Math.exp(-ntu * (1 + cr))) / (1 + cr);
}

/**
 * Calculate heat exchanger effectiveness using NTU method
 *
 * @description
 * Main entry point for effectiveness calculation. Routes to appropriate
 * formula based on flow arrangement.
 *
 * @param ntu Number of Transfer Units (dimensionless, >= 0)
 * @param cr Capacity ratio C_min/C_max (dimensionless, 0-1)
 * @param flowArrangement Heat exchanger flow arrangement type
 * @returns Heat transfer effectiveness (dimensionless, 0-1)
 *
 * @example
 * ```typescript
 * // Counterflow heat exchanger with NTU=2.0, balanced flow
 * const effectiveness = calculateEffectiveness(2.0, 1.0, 'counterflow');
 * console.log(effectiveness); // ~0.667
 * ```
 *
 * @reference
 * - Kays & London (1984), Chapter 3
 * - ASHRAE Handbook - Fundamentals (2021), Chapter 4
 */
export function calculateEffectiveness(
  ntu: number,
  cr: number,
  flowArrangement: FlowArrangement
): number {
  // Handle edge cases
  if (ntu < 0) {
    throw new Error(`NTU must be non-negative, got ${ntu}`);
  }
  if (cr < 0 || cr > 1) {
    throw new Error(`Capacity ratio must be between 0 and 1, got ${cr}`);
  }

  switch (flowArrangement) {
    case 'counterflow':
      return calculateEffectivenessCounterflow(ntu, cr);
    case 'crossflow_unmixed':
      return calculateEffectivenessCrossflowUnmixed(ntu, cr);
    case 'crossflow_mixed':
      return calculateEffectivenessCrossflowMixed(ntu, cr);
    case 'parallel':
      return calculateEffectivenessParallel(ntu, cr);
    default:
      throw new Error(`Unknown flow arrangement: ${flowArrangement}`);
  }
}

// ============================================================================
// Outlet Condition Calculations
// ============================================================================

/**
 * Calculate supply air outlet conditions
 *
 * @description
 * Calculates the temperature and humidity of the supply air exiting
 * the ERV based on effectiveness values.
 *
 * @equation
 * ```
 * T_supply_out = T_supply_in - epsilon_s * (T_supply_in - T_exhaust_in)
 * W_supply_out = W_supply_in - epsilon_l * (W_supply_in - W_exhaust_in)
 * ```
 *
 * @param inputs Supply outlet calculation inputs
 * @returns Supply air outlet temperature and humidity
 */
export function calculateSupplyOutletConditions(inputs: SupplyOutletInputs): OutletConditions {
  const {
    inletTemperature,
    inletHumidity,
    exhaustTemperature,
    exhaustHumidity,
    sensibleEffectiveness,
    latentEffectiveness,
  } = inputs;

  // Supply outlet temperature
  // For cooling: T_in > T_exhaust, so outlet is cooler than inlet
  // For heating: T_in < T_exhaust, so outlet is warmer than inlet
  const outletTemperature =
    inletTemperature - sensibleEffectiveness * (inletTemperature - exhaustTemperature);

  // Supply outlet humidity ratio
  // For dehumidification: W_in > W_exhaust, so outlet is drier
  // For humidification: W_in < W_exhaust, so outlet is more humid
  const outletHumidity =
    inletHumidity - latentEffectiveness * (inletHumidity - exhaustHumidity);

  return {
    temperature: outletTemperature,
    humidity: outletHumidity,
  };
}

/**
 * Calculate exhaust air outlet conditions
 *
 * @description
 * Calculates the temperature and humidity of the exhaust air exiting
 * the ERV based on effectiveness and energy balance.
 *
 * @equation
 * Energy balance for sensible heat:
 * ```
 * m_supply * cp * (T_supply_in - T_supply_out) = m_exhaust * cp * (T_exhaust_out - T_exhaust_in)
 * ```
 *
 * For balanced flow (m_supply = m_exhaust):
 * ```
 * T_exhaust_out = T_exhaust_in + epsilon_s * (T_supply_in - T_exhaust_in)
 * ```
 *
 * For unbalanced flow, the temperature rise is scaled by capacity ratio.
 *
 * @param inputs Exhaust outlet calculation inputs
 * @returns Exhaust air outlet temperature and humidity
 */
export function calculateExhaustOutletConditions(inputs: ExhaustOutletInputs): OutletConditions {
  const {
    inletTemperature,
    inletHumidity,
    supplyTemperature,
    supplyHumidity,
    sensibleEffectiveness,
    latentEffectiveness,
    capacityRatio,
  } = inputs;

  // For exhaust outlet, apply energy balance
  // The heat lost/gained by supply equals heat gained/lost by exhaust
  // With capacity ratio adjustment for unbalanced flow

  // Exhaust temperature change is related to supply temperature change
  // Q = C_supply * (T_supply_in - T_supply_out) = C_exhaust * (T_exhaust_out - T_exhaust_in)
  // If C_supply < C_exhaust: T_exhaust change < T_supply change
  // If C_supply > C_exhaust: T_exhaust change > T_supply change

  // Using effectiveness definition based on C_min side:
  // epsilon = Q_actual / Q_max = C_min * dT_actual / (C_min * dT_max)
  // For the C_max fluid: dT = C_r * epsilon * dT_max

  const tempDifference = supplyTemperature - inletTemperature;
  const humidityDifference = supplyHumidity - inletHumidity;

  // Exhaust outlet temperature
  // If supply is C_min (capacityRatio < 1), exhaust change is smaller
  // Exhaust side receives/loses: epsilon * C_r * (T_supply - T_exhaust)
  // But we want to express in terms of exhaust side temperature rise
  // T_exhaust_out = T_exhaust_in + epsilon * C_r * (T_supply_in - T_exhaust_in) [if exhaust is C_max]
  // or T_exhaust_out = T_exhaust_in + epsilon * (T_supply_in - T_exhaust_in) [if exhaust is C_min]

  // For simplicity and common practice in ERV calculations (balanced or near-balanced):
  // Use the symmetric approach where exhaust temp change equals supply temp change for balanced flow
  const exhaustTempChange = sensibleEffectiveness * capacityRatio * tempDifference;
  const exhaustHumidityChange = latentEffectiveness * capacityRatio * humidityDifference;

  const outletTemperature = inletTemperature + exhaustTempChange;
  const outletHumidity = inletHumidity + exhaustHumidityChange;

  return {
    temperature: outletTemperature,
    humidity: Math.max(0, outletHumidity), // Ensure non-negative humidity
  };
}

// ============================================================================
// Humidity Conversion Utilities
// ============================================================================

/**
 * Convert relative humidity to absolute humidity (humidity ratio)
 *
 * @param temperature Air temperature in Celsius
 * @param relativeHumidity Relative humidity in % (0-100)
 * @param pressure Atmospheric pressure in kPa
 * @returns Humidity ratio in kg water / kg dry air
 */
function relativeToAbsoluteHumidity(
  temperature: number,
  relativeHumidity: number,
  pressure: number = ATMOSPHERIC_PRESSURE_STANDARD
): number {
  const pSat = saturationVaporPressure(temperature);
  const pVapor = pSat * (relativeHumidity / 100);
  return humidityRatio(pVapor, pressure);
}

// ============================================================================
// Input Validation
// ============================================================================

/**
 * Validate ERV input parameters
 *
 * @param inputs ERV calculation inputs
 * @returns Validation result with errors and warnings
 */
export function validateErvInputs(inputs: ERVInputs): ERVValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate airflow rates
  if (inputs.supplyAirFlow <= 0) {
    errors.push(`Supply airflow must be positive, got ${inputs.supplyAirFlow}`);
  }
  if (inputs.exhaustAirFlow <= 0) {
    errors.push(`Exhaust airflow must be positive, got ${inputs.exhaustAirFlow}`);
  }

  // Validate temperatures
  if (inputs.supplyTemperature < -50 || inputs.supplyTemperature > 60) {
    warnings.push(
      `Supply temperature ${inputs.supplyTemperature}C is outside typical range [-50, 60]`
    );
  }
  if (inputs.exhaustTemperature < -20 || inputs.exhaustTemperature > 40) {
    warnings.push(
      `Exhaust temperature ${inputs.exhaustTemperature}C is outside typical range [-20, 40]`
    );
  }

  // Validate humidity
  if (inputs.humidityUnit === 'absolute') {
    if (inputs.supplyHumidity < 0) {
      errors.push(`Supply humidity must be non-negative, got ${inputs.supplyHumidity}`);
    }
    if (inputs.exhaustHumidity < 0) {
      errors.push(`Exhaust humidity must be non-negative, got ${inputs.exhaustHumidity}`);
    }
    if (inputs.supplyHumidity > 0.05) {
      warnings.push(`Supply humidity ${inputs.supplyHumidity} kg/kg is unusually high`);
    }
    if (inputs.exhaustHumidity > 0.05) {
      warnings.push(`Exhaust humidity ${inputs.exhaustHumidity} kg/kg is unusually high`);
    }
  } else {
    // Relative humidity validation
    if (inputs.supplyHumidity < 0 || inputs.supplyHumidity > 100) {
      errors.push(`Supply RH must be 0-100%, got ${inputs.supplyHumidity}`);
    }
    if (inputs.exhaustHumidity < 0 || inputs.exhaustHumidity > 100) {
      errors.push(`Exhaust RH must be 0-100%, got ${inputs.exhaustHumidity}`);
    }
  }

  // Validate NTU
  if (inputs.ntuSensible < 0) {
    errors.push(`Sensible NTU must be non-negative, got ${inputs.ntuSensible}`);
  }
  if (inputs.ntuSensible > 15) {
    warnings.push(`Sensible NTU ${inputs.ntuSensible} is unusually high for ERV applications`);
  }
  if (inputs.ntuLatent !== undefined) {
    if (inputs.ntuLatent < 0) {
      errors.push(`Latent NTU must be non-negative, got ${inputs.ntuLatent}`);
    }
    if (inputs.ntuLatent > 10) {
      warnings.push(`Latent NTU ${inputs.ntuLatent} is unusually high`);
    }
  }

  // Validate fan power
  if (inputs.fanPower !== undefined && inputs.fanPower < 0) {
    errors.push(`Fan power must be non-negative, got ${inputs.fanPower}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Main ERV Performance Calculation
// ============================================================================

/**
 * Calculate complete ERV performance
 *
 * @description
 * Main entry point for ERV performance calculation. Computes sensible and
 * latent heat recovery, effectiveness values, and outlet conditions using
 * the NTU-effectiveness method.
 *
 * @param inputs ERV calculation inputs including airflows, temperatures,
 *               humidity, NTU values, and flow arrangement
 * @returns Complete ERV performance outputs
 *
 * @throws {Error} If input validation fails
 *
 * @example
 * ```typescript
 * const inputs: ERVInputs = {
 *   supplyAirFlow: 0.5,       // m3/s (1800 m3/h)
 *   exhaustAirFlow: 0.5,
 *   supplyTemperature: 35,    // Hot summer outdoor
 *   exhaustTemperature: 24,   // Cool indoor
 *   supplyHumidity: 0.020,    // kg/kg
 *   exhaustHumidity: 0.010,
 *   humidityUnit: 'absolute',
 *   ntuSensible: 2.5,
 *   ntuLatent: 2.0,
 *   flowArrangement: 'counterflow',
 *   fanPower: 200,
 * };
 *
 * const result = calculateErvPerformance(inputs);
 * console.log(`Sensible effectiveness: ${result.sensibleEffectiveness.toFixed(2)}`);
 * console.log(`Heat recovery: ${result.totalHeatRecovery.toFixed(0)} W`);
 * console.log(`COP: ${result.cop?.toFixed(1)}`);
 * ```
 *
 * @reference
 * - ASHRAE Handbook - HVAC Systems and Equipment (2020), Chapter 26
 * - Zhang, L.Z. (2008). Total heat recovery
 */
export function calculateErvPerformance(inputs: ERVInputs): ERVOutputs {
  // Validate inputs
  const validation = validateErvInputs(inputs);
  if (!validation.valid) {
    throw new Error(`Invalid ERV inputs: ${validation.errors.join('; ')}`);
  }

  const atmosphericPressure = inputs.atmosphericPressure ?? ATMOSPHERIC_PRESSURE_STANDARD;

  // Convert humidity to absolute if relative was provided
  let supplyHumidityAbs: number;
  let exhaustHumidityAbs: number;

  if (inputs.humidityUnit === 'relative') {
    supplyHumidityAbs = relativeToAbsoluteHumidity(
      inputs.supplyTemperature,
      inputs.supplyHumidity,
      atmosphericPressure
    );
    exhaustHumidityAbs = relativeToAbsoluteHumidity(
      inputs.exhaustTemperature,
      inputs.exhaustHumidity,
      atmosphericPressure
    );
  } else {
    supplyHumidityAbs = inputs.supplyHumidity;
    exhaustHumidityAbs = inputs.exhaustHumidity;
  }

  // Calculate air densities at respective temperatures
  const rhoSupply = airDensity(inputs.supplyTemperature, atmosphericPressure);
  const rhoExhaust = airDensity(inputs.exhaustTemperature, atmosphericPressure);

  // Calculate mass flow rates (kg/s)
  const massFlowSupply = inputs.supplyAirFlow * rhoSupply;
  const massFlowExhaust = inputs.exhaustAirFlow * rhoExhaust;

  // Calculate heat capacity rates (W/K)
  const cSupply = massFlowSupply * SPECIFIC_HEAT_AIR;
  const cExhaust = massFlowExhaust * SPECIFIC_HEAT_AIR;

  // Determine C_min and C_max
  const cMin = Math.min(cSupply, cExhaust);
  const cMax = Math.max(cSupply, cExhaust);
  const capacityRatio = cMin / cMax;

  // Calculate sensible effectiveness
  const sensibleEffectiveness = calculateEffectiveness(
    inputs.ntuSensible,
    capacityRatio,
    inputs.flowArrangement
  );

  // Calculate latent effectiveness
  let latentEffectiveness = 0;
  if (inputs.ntuLatent !== undefined && inputs.ntuLatent > 0) {
    // For latent (moisture) transfer, use same effectiveness formula
    // but with mass transfer NTU
    latentEffectiveness = calculateEffectiveness(
      inputs.ntuLatent,
      capacityRatio,
      inputs.flowArrangement
    );
  }

  // Calculate temperature difference (absolute value for heat transfer magnitude)
  const tempDifference = inputs.supplyTemperature - inputs.exhaustTemperature;
  const humidityDifference = supplyHumidityAbs - exhaustHumidityAbs;

  // Calculate sensible heat recovery (W)
  // Q_s = epsilon_s * C_min * |T_supply - T_exhaust|
  // Positive value indicates heat recovery (benefit)
  const sensibleHeatRecovery = sensibleEffectiveness * cMin * Math.abs(tempDifference);

  // Calculate latent heat recovery (W)
  // Q_l = epsilon_l * m_dot_min * h_fg * |W_supply - W_exhaust|
  // where m_dot_min is the mass flow rate corresponding to C_min
  const massFlowMin = cMin / SPECIFIC_HEAT_AIR;
  const latentHeatRecovery = latentEffectiveness * massFlowMin * LATENT_HEAT_VAPORIZATION *
    Math.abs(humidityDifference);

  // Total heat recovery
  const totalHeatRecovery = sensibleHeatRecovery + latentHeatRecovery;

  // Calculate total (enthalpy) effectiveness
  // Weighted average based on relative magnitudes of sensible and latent loads
  const qSensibleMax = cMin * Math.abs(tempDifference);
  const qLatentMax = massFlowMin * LATENT_HEAT_VAPORIZATION * Math.abs(humidityDifference);
  const qTotalMax = qSensibleMax + qLatentMax;

  let totalEffectiveness: number;
  if (qTotalMax > 0) {
    totalEffectiveness = totalHeatRecovery / qTotalMax;
  } else {
    // No heat transfer potential
    totalEffectiveness = 0;
  }

  // Calculate outlet conditions
  const supplyOutlet = calculateSupplyOutletConditions({
    inletTemperature: inputs.supplyTemperature,
    inletHumidity: supplyHumidityAbs,
    exhaustTemperature: inputs.exhaustTemperature,
    exhaustHumidity: exhaustHumidityAbs,
    sensibleEffectiveness,
    latentEffectiveness,
  });

  const exhaustOutlet = calculateExhaustOutletConditions({
    inletTemperature: inputs.exhaustTemperature,
    inletHumidity: exhaustHumidityAbs,
    supplyTemperature: inputs.supplyTemperature,
    supplyHumidity: supplyHumidityAbs,
    sensibleEffectiveness,
    latentEffectiveness,
    capacityRatio,
  });

  // Calculate COP if fan power is provided
  let cop: number | undefined;
  let fanPower: number | undefined;

  if (inputs.fanPower !== undefined && inputs.fanPower > 0) {
    fanPower = inputs.fanPower;
    cop = totalHeatRecovery / fanPower;
  }

  return {
    sensibleEffectiveness,
    latentEffectiveness,
    totalEffectiveness,
    sensibleHeatRecovery,
    latentHeatRecovery,
    totalHeatRecovery,
    supplyOutletTemperature: supplyOutlet.temperature,
    supplyOutletHumidity: supplyOutlet.humidity,
    exhaustOutletTemperature: exhaustOutlet.temperature,
    exhaustOutletHumidity: exhaustOutlet.humidity,
    capacityRatio,
    fanPower,
    cop,
  };
}
