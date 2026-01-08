/**
 * ERV NTU-Effectiveness Model Type Definitions
 *
 * @description
 * Type definitions for Energy Recovery Ventilator (ERV) heat exchanger
 * calculations using the NTU (Number of Transfer Units) method.
 *
 * @references
 * - Kays, W.M. & London, A.L. (1984). Compact Heat Exchangers, 3rd ed.
 * - ASHRAE Handbook - HVAC Systems and Equipment (2020), Chapter 26
 * - Zhang, L.Z. (2008). Total heat recovery: Heat and moisture recovery from ventilation air
 *
 * @module hvac-equipment/erv
 */

// ============================================================================
// Flow Arrangement Types
// ============================================================================

/**
 * Heat exchanger flow arrangement type
 *
 * @description
 * Defines the flow pattern between the two air streams in the ERV.
 * The flow arrangement significantly affects the heat transfer effectiveness.
 *
 * @reference Kays & London (1984), Chapter 3
 *
 * - `counterflow`: Optimal arrangement where fluids flow in opposite directions.
 *   Achieves highest effectiveness for given NTU.
 * - `crossflow_unmixed`: Both fluids unmixed, typical for plate-fin exchangers.
 *   Less effective than counterflow but easier to manufacture.
 * - `crossflow_mixed`: One fluid mixed, one unmixed. Less common in ERVs.
 * - `parallel`: Both fluids flow in same direction. Lowest effectiveness,
 *   rarely used in ERVs except for special applications.
 */
export type FlowArrangement = 'counterflow' | 'crossflow_unmixed' | 'crossflow_mixed' | 'parallel';

/**
 * Humidity input unit specification
 */
export type HumidityUnit = 'absolute' | 'relative';

// ============================================================================
// Input/Output Types
// ============================================================================

/**
 * ERV calculation input parameters
 *
 * @description
 * Complete input specification for ERV performance calculation.
 * Supports both absolute humidity (kg/kg) and relative humidity (%) inputs.
 */
export interface ERVInputs {
  /**
   * Supply air volumetric flow rate
   * @unit m3/s
   * @typical 0.05 - 2.0 for residential/commercial
   */
  supplyAirFlow: number;

  /**
   * Exhaust air volumetric flow rate
   * @unit m3/s
   * @typical 0.05 - 2.0 for residential/commercial
   */
  exhaustAirFlow: number;

  /**
   * Supply (outdoor) air temperature
   * @unit Celsius
   */
  supplyTemperature: number;

  /**
   * Exhaust (indoor/return) air temperature
   * @unit Celsius
   */
  exhaustTemperature: number;

  /**
   * Supply air humidity
   * @unit kg/kg (absolute) or % (relative), based on humidityUnit
   */
  supplyHumidity: number;

  /**
   * Exhaust air humidity
   * @unit kg/kg (absolute) or % (relative), based on humidityUnit
   */
  exhaustHumidity: number;

  /**
   * Humidity input unit specification
   * - 'absolute': humidity ratio in kg water / kg dry air
   * - 'relative': relative humidity in % (0-100)
   */
  humidityUnit: HumidityUnit;

  /**
   * Number of Transfer Units for sensible heat
   * @unit dimensionless
   * @typical 1.0 - 5.0 for ERVs
   *
   * @equation NTU = UA / C_min
   * where UA is overall heat transfer coefficient times area (W/K),
   * C_min is minimum heat capacity rate (W/K)
   */
  ntuSensible: number;

  /**
   * Number of Transfer Units for latent (moisture) transfer
   * @unit dimensionless
   * @typical 0.5 - 3.0 for membrane ERVs
   * @optional If not provided, only sensible recovery is calculated
   *
   * @description
   * NTU for mass transfer, based on mass transfer coefficient.
   * Only applicable for enthalpy exchangers with permeable membranes.
   */
  ntuLatent?: number;

  /**
   * Heat exchanger flow arrangement
   */
  flowArrangement: FlowArrangement;

  /**
   * Total fan power consumption (both supply and exhaust fans)
   * @unit W
   * @optional Used for COP calculation if provided
   */
  fanPower?: number;

  /**
   * Atmospheric pressure
   * @unit kPa
   * @default 101.325
   */
  atmosphericPressure?: number;
}

/**
 * ERV calculation output results
 *
 * @description
 * Complete output from ERV performance calculation including
 * effectiveness values, heat recovery rates, and outlet conditions.
 */
export interface ERVOutputs {
  /**
   * Sensible heat transfer effectiveness
   * @unit dimensionless (0-1)
   *
   * @equation epsilon_s = (T_supply_in - T_supply_out) / (T_supply_in - T_exhaust_in)
   */
  sensibleEffectiveness: number;

  /**
   * Latent (moisture) transfer effectiveness
   * @unit dimensionless (0-1)
   *
   * @equation epsilon_l = (W_supply_in - W_supply_out) / (W_supply_in - W_exhaust_in)
   */
  latentEffectiveness: number;

  /**
   * Total (enthalpy) effectiveness
   * @unit dimensionless (0-1)
   *
   * @description
   * Enthalpy-based total effectiveness, accounting for both
   * sensible and latent heat transfer.
   */
  totalEffectiveness: number;

  /**
   * Sensible heat recovery rate
   * @unit W
   *
   * @equation Q_s = epsilon_s * C_min * (T_exhaust - T_supply)
   */
  sensibleHeatRecovery: number;

  /**
   * Latent heat recovery rate
   * @unit W
   *
   * @equation Q_l = epsilon_l * m_dot_min * h_fg * (W_exhaust - W_supply)
   * where h_fg is latent heat of vaporization (~2.45 MJ/kg)
   */
  latentHeatRecovery: number;

  /**
   * Total heat recovery rate
   * @unit W
   *
   * @equation Q_total = Q_s + Q_l
   */
  totalHeatRecovery: number;

  /**
   * Supply air outlet temperature
   * @unit Celsius
   */
  supplyOutletTemperature: number;

  /**
   * Supply air outlet humidity ratio
   * @unit kg/kg (absolute humidity)
   */
  supplyOutletHumidity: number;

  /**
   * Exhaust air outlet temperature
   * @unit Celsius
   */
  exhaustOutletTemperature: number;

  /**
   * Exhaust air outlet humidity ratio
   * @unit kg/kg (absolute humidity)
   */
  exhaustOutletHumidity: number;

  /**
   * Heat capacity ratio
   * @unit dimensionless (0-1)
   *
   * @equation C_r = C_min / C_max
   */
  capacityRatio: number;

  /**
   * Fan power consumption
   * @unit W
   * @optional Only present if fanPower was provided in inputs
   */
  fanPower?: number;

  /**
   * Coefficient of Performance
   * @unit dimensionless
   * @optional Only calculated if fanPower was provided
   *
   * @equation COP = Q_total / P_fan
   */
  cop?: number;
}

// ============================================================================
// Supporting Types
// ============================================================================

/**
 * Supply air outlet calculation inputs
 */
export interface SupplyOutletInputs {
  /** Inlet (outdoor) temperature in Celsius */
  inletTemperature: number;
  /** Inlet humidity ratio in kg/kg */
  inletHumidity: number;
  /** Exhaust (indoor) temperature in Celsius */
  exhaustTemperature: number;
  /** Exhaust humidity ratio in kg/kg */
  exhaustHumidity: number;
  /** Sensible effectiveness (0-1) */
  sensibleEffectiveness: number;
  /** Latent effectiveness (0-1) */
  latentEffectiveness: number;
}

/**
 * Exhaust air outlet calculation inputs
 */
export interface ExhaustOutletInputs {
  /** Inlet (indoor/return) temperature in Celsius */
  inletTemperature: number;
  /** Inlet humidity ratio in kg/kg */
  inletHumidity: number;
  /** Supply (outdoor) temperature in Celsius */
  supplyTemperature: number;
  /** Supply humidity ratio in kg/kg */
  supplyHumidity: number;
  /** Sensible effectiveness (0-1) */
  sensibleEffectiveness: number;
  /** Latent effectiveness (0-1) */
  latentEffectiveness: number;
  /** Capacity ratio C_r = C_min/C_max */
  capacityRatio: number;
}

/**
 * Outlet conditions result
 */
export interface OutletConditions {
  /** Outlet temperature in Celsius */
  temperature: number;
  /** Outlet humidity ratio in kg/kg */
  humidity: number;
}

/**
 * NTU-Effectiveness reference data point
 *
 * @description
 * Data structure for storing reference NTU-effectiveness values
 * from Kays & London (1984) for validation testing.
 */
export interface NtuEffectivenessData {
  /** Number of Transfer Units */
  ntu: number;
  /** Capacity ratio C_r = C_min/C_max */
  cr: number;
  /** Heat transfer effectiveness (0-1) */
  effectiveness: number;
}

// ============================================================================
// ERV Specification Types
// ============================================================================

/**
 * ERV equipment specification from manufacturer data
 *
 * @description
 * Standard ERV specification format for storing manufacturer
 * performance data and deriving NTU values.
 */
export interface ERVSpecification {
  /** Equipment model name/number */
  model: string;

  /** Manufacturer name */
  manufacturer: string;

  /**
   * Nominal airflow rate
   * @unit m3/h
   */
  nominalAirflow: number;

  /**
   * Sensible efficiency at nominal conditions
   * @unit % (0-100)
   */
  sensibleEfficiency: number;

  /**
   * Latent efficiency at nominal conditions
   * @unit % (0-100)
   */
  latentEfficiency: number;

  /**
   * Total efficiency at nominal conditions
   * @unit % (0-100)
   */
  totalEfficiency: number;

  /**
   * Fan power consumption at nominal airflow
   * @unit W
   */
  fanPower: number;

  /**
   * Pressure drop at nominal airflow
   * @unit Pa
   */
  pressureDrop: number;

  /**
   * Flow arrangement type
   */
  flowArrangement?: FlowArrangement;

  /**
   * Reference source for the specification data
   */
  reference: string;
}

/**
 * Operating point for ERV performance characterization
 */
export interface ERVOperatingPoint {
  /** Airflow rate in m3/s */
  airflow: number;
  /** Sensible effectiveness at this point */
  sensibleEffectiveness: number;
  /** Latent effectiveness at this point */
  latentEffectiveness: number;
  /** Fan power at this point in W */
  fanPower: number;
  /** Pressure drop at this point in Pa */
  pressureDrop: number;
}

/**
 * ERV performance curve parameters
 *
 * @description
 * Parameters for modeling ERV performance variation with airflow.
 * Effectiveness typically decreases with increasing airflow.
 */
export interface ERVPerformanceCurve {
  /** Reference airflow for curve normalization in m3/s */
  referenceAirflow: number;
  /** Sensible effectiveness at reference airflow */
  sensibleEffectivenessRef: number;
  /** Latent effectiveness at reference airflow */
  latentEffectivenessRef: number;
  /**
   * Exponent for effectiveness-airflow relationship
   * epsilon = epsilon_ref * (V_ref / V)^n
   * @typical 0.3 - 0.5
   */
  airflowExponent: number;
  /** Fan power coefficient (W/(m3/s)^3) */
  fanPowerCoefficient: number;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * ERV input validation result
 */
export interface ERVValidationResult {
  /** Whether all inputs are valid */
  valid: boolean;
  /** Array of error messages */
  errors: string[];
  /** Array of warning messages */
  warnings: string[];
}

/**
 * Valid ranges for ERV input parameters
 */
export interface ERVParameterRanges {
  /** Airflow range in m3/s */
  airflow: { min: number; max: number };
  /** Temperature range in Celsius */
  temperature: { min: number; max: number };
  /** Absolute humidity range in kg/kg */
  humidityAbsolute: { min: number; max: number };
  /** Relative humidity range in % */
  humidityRelative: { min: number; max: number };
  /** NTU range */
  ntu: { min: number; max: number };
}

/**
 * Default parameter ranges for validation
 */
export const DEFAULT_ERV_PARAMETER_RANGES: ERVParameterRanges = {
  airflow: { min: 0, max: 10 },
  temperature: { min: -40, max: 60 },
  humidityAbsolute: { min: 0, max: 0.05 },
  humidityRelative: { min: 0, max: 100 },
  ntu: { min: 0, max: 20 },
};
