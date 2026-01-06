/**
 * Input Validation Utilities for Indoor Farming Science Models
 *
 * @description
 * Functions for validating input parameters with meaningful error messages.
 * Includes range checking and type validation for all model inputs.
 */

import type { ValidationResult, ParameterRange } from './types';

// ============================================================================
// Standard Parameter Ranges
// ============================================================================

/**
 * Standard ranges for environmental parameters
 */
export const ENVIRONMENTAL_RANGES: Record<string, ParameterRange> = {
  airTemperature: {
    min: -40,
    max: 60,
    unit: '°C',
    required: true,
  },
  relativeHumidity: {
    min: 0,
    max: 100,
    unit: '%',
    required: true,
  },
  atmosphericPressure: {
    min: 80,
    max: 110,
    unit: 'kPa',
    required: false,
    defaultValue: 101.325,
  },
  netRadiation: {
    min: -100,
    max: 2000,
    unit: 'W/m²',
    required: false,
  },
  ppfd: {
    min: 0,
    max: 3000,
    unit: 'μmol/(m²·s)',
    required: false,
  },
  co2Concentration: {
    min: 100,
    max: 5000,
    unit: 'ppm',
    required: false,
    defaultValue: 400,
  },
  airVelocity: {
    min: 0,
    max: 50,
    unit: 'm/s',
    required: false,
  },
};

/**
 * Standard ranges for plant physiology parameters
 */
export const PLANT_PHYSIOLOGY_RANGES: Record<string, ParameterRange> = {
  stomatalResistance: {
    min: 10,
    max: 10000,
    unit: 's/m',
    required: true,
  },
  aerodynamicResistance: {
    min: 1,
    max: 1000,
    unit: 's/m',
    required: true,
  },
  leafAreaIndex: {
    min: 0,
    max: 15,
    unit: 'm²/m²',
    required: false,
  },
  soilHeatFlux: {
    min: -100,
    max: 100,
    unit: 'W/m²',
    required: false,
    defaultValue: 0,
  },
  vpd: {
    min: 0,
    max: 10,
    unit: 'kPa',
    required: false,
  },
};

/**
 * Standard ranges for photosynthesis parameters
 */
export const PHOTOSYNTHESIS_RANGES: Record<string, ParameterRange> = {
  vcmax25: {
    min: 10,
    max: 200,
    unit: 'μmol/(m²·s)',
    required: false,
    defaultValue: 60,
  },
  jmax25: {
    min: 20,
    max: 400,
    unit: 'μmol/(m²·s)',
    required: false,
    defaultValue: 100,
  },
};

/**
 * Standard ranges for building thermal parameters
 */
export const BUILDING_THERMAL_RANGES: Record<string, ParameterRange> = {
  thickness: {
    min: 0.0001,
    max: 10,
    unit: 'm',
    required: true,
  },
  thermalConductivity: {
    min: 0.001,
    max: 500,
    unit: 'W/(m·K)',
    required: true,
  },
  insideTemperature: {
    min: -20,
    max: 50,
    unit: '°C',
    required: true,
  },
  outsideTemperature: {
    min: -50,
    max: 60,
    unit: '°C',
    required: true,
  },
  convectionCoefficient: {
    min: 0.1,
    max: 100,
    unit: 'W/(m²·K)',
    required: false,
  },
};

/**
 * Standard ranges for HVAC parameters
 */
export const HVAC_RANGES: Record<string, ParameterRange> = {
  airFlowRate: {
    min: 0,
    max: 1000,
    unit: 'm³/s',
    required: true,
  },
  sensibleEffectiveness: {
    min: 0,
    max: 1,
    unit: 'dimensionless',
    required: true,
  },
  latentEffectiveness: {
    min: 0,
    max: 1,
    unit: 'dimensionless',
    required: true,
  },
  humidityRatio: {
    min: 0,
    max: 0.1,
    unit: 'kg/kg',
    required: true,
  },
};

/**
 * Standard ranges for energy system parameters
 */
export const ENERGY_SYSTEM_RANGES: Record<string, ParameterRange> = {
  irradiance: {
    min: 0,
    max: 1500,
    unit: 'W/m²',
    required: true,
  },
  cellTemperature: {
    min: -40,
    max: 100,
    unit: '°C',
    required: true,
  },
  stateOfCharge: {
    min: 0,
    max: 1,
    unit: 'dimensionless',
    required: true,
  },
  efficiency: {
    min: 0,
    max: 1,
    unit: 'dimensionless',
    required: false,
    defaultValue: 0.95,
  },
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate a single numeric value against a range
 * @param value The value to validate
 * @param range The parameter range definition
 * @param paramName The parameter name for error messages
 * @returns Validation result
 */
export function validateRange(
  value: number | undefined,
  range: ParameterRange,
  paramName: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if required parameter is missing
  if (value === undefined || value === null) {
    if (range.required) {
      errors.push(`${paramName} is required but was not provided`);
    }
    return { valid: errors.length === 0, errors, warnings };
  }

  // Check if value is a number
  if (typeof value !== 'number' || isNaN(value)) {
    errors.push(`${paramName} must be a valid number, got: ${value}`);
    return { valid: false, errors, warnings };
  }

  // Check if value is finite
  if (!isFinite(value)) {
    errors.push(`${paramName} must be finite, got: ${value}`);
    return { valid: false, errors, warnings };
  }

  // Check range
  if (value < range.min) {
    errors.push(
      `${paramName} = ${value} ${range.unit} is below minimum (${range.min} ${range.unit})`
    );
  } else if (value > range.max) {
    errors.push(
      `${paramName} = ${value} ${range.unit} is above maximum (${range.max} ${range.unit})`
    );
  }

  // Add warning if value is at boundary
  const rangeSize = range.max - range.min;
  const lowerBound = range.min + rangeSize * 0.05;
  const upperBound = range.max - rangeSize * 0.05;

  if (value < lowerBound || value > upperBound) {
    warnings.push(
      `${paramName} = ${value} ${range.unit} is near the valid range boundary [${range.min}, ${range.max}]`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate multiple parameters against their ranges
 * @param params Object containing parameter values
 * @param ranges Object containing parameter range definitions
 * @returns Combined validation result
 */
export function validateParameters(
  params: Record<string, number | undefined>,
  ranges: Record<string, ParameterRange>
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];

  for (const [paramName, range] of Object.entries(ranges)) {
    const result = validateRange(params[paramName], range, paramName);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  };
}

/**
 * Validate transpiration model inputs
 * @param inputs Transpiration input parameters
 * @returns Validation result
 */
export function validateTranspirationInputs(inputs: {
  airTemperature?: number;
  relativeHumidity?: number;
  netRadiation?: number;
  stomatalResistance?: number;
  aerodynamicResistance?: number;
  soilHeatFlux?: number;
  vpd?: number;
  leafAreaIndex?: number;
}): ValidationResult {
  const ranges = {
    ...ENVIRONMENTAL_RANGES,
    ...PLANT_PHYSIOLOGY_RANGES,
  };

  return validateParameters(inputs as Record<string, number | undefined>, ranges);
}

/**
 * Validate photosynthesis model inputs
 * @param inputs Photosynthesis input parameters
 * @returns Validation result
 */
export function validatePhotosynthesisInputs(inputs: {
  airTemperature?: number;
  ppfd?: number;
  co2Concentration?: number;
  relativeHumidity?: number;
  vcmax25?: number;
  jmax25?: number;
}): ValidationResult {
  const ranges = {
    airTemperature: ENVIRONMENTAL_RANGES.airTemperature,
    ppfd: ENVIRONMENTAL_RANGES.ppfd,
    co2Concentration: ENVIRONMENTAL_RANGES.co2Concentration,
    relativeHumidity: ENVIRONMENTAL_RANGES.relativeHumidity,
    ...PHOTOSYNTHESIS_RANGES,
  };

  return validateParameters(inputs as Record<string, number | undefined>, ranges);
}

/**
 * Validate building thermal inputs
 * @param inputs Building thermal input parameters
 * @returns Validation result
 */
export function validateBuildingThermalInputs(inputs: {
  insideTemperature?: number;
  outsideTemperature?: number;
  thickness?: number;
  thermalConductivity?: number;
}): ValidationResult {
  return validateParameters(
    inputs as Record<string, number | undefined>,
    BUILDING_THERMAL_RANGES
  );
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Apply default values to parameters
 * @param params Input parameters
 * @param ranges Parameter range definitions with defaults
 * @returns Parameters with defaults applied
 */
export function applyDefaults<T extends Record<string, number | undefined>>(
  params: T,
  ranges: Record<string, ParameterRange>
): T {
  const result = { ...params };

  for (const [paramName, range] of Object.entries(ranges)) {
    if (
      (result[paramName as keyof T] === undefined || result[paramName as keyof T] === null) &&
      range.defaultValue !== undefined
    ) {
      (result as Record<string, number | undefined>)[paramName] = range.defaultValue;
    }
  }

  return result;
}

/**
 * Clamp a value to a valid range
 * @param value The value to clamp
 * @param min Minimum value
 * @param max Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Check if a value is within a range (inclusive)
 * @param value The value to check
 * @param min Minimum value
 * @param max Maximum value
 * @returns True if value is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Assert that a condition is true, throw error with message if false
 * @param condition The condition to check
 * @param message Error message if condition is false
 */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

/**
 * Validate and throw if invalid
 * @param params Parameters to validate
 * @param ranges Range definitions
 * @param context Context string for error message
 */
export function validateOrThrow(
  params: Record<string, number | undefined>,
  ranges: Record<string, ParameterRange>,
  context: string = 'Input validation'
): void {
  const result = validateParameters(params, ranges);
  if (!result.valid) {
    throw new Error(`${context} failed:\n${result.errors.join('\n')}`);
  }
}
