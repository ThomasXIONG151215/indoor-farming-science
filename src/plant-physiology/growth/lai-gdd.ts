/**
 * LAI-GDD Growth Model
 *
 * @description
 * Growing Degree Days (GDD) and Leaf Area Index (LAI) growth models for
 * controlled environment agriculture. Provides functions for calculating
 * thermal time accumulation and predicting plant growth stages.
 *
 * @equation
 * GDD Calculation (daily):
 * ```
 * GDD = max(0, T_avg - T_base)
 * ```
 *
 * GDD Calculation (hourly):
 * ```
 * GDD_hour = max(0, T - T_base) / 24
 * ```
 *
 * LAI Linear Model:
 * ```
 * LAI(GDD) = min(LAI_max, LAI_initial + growth_rate * GDD)
 * ```
 *
 * LAI Logistic Model:
 * ```
 * LAI(GDD) = LAI_max / (1 + exp(-k * (GDD - GDD_half)))
 * ```
 *
 * Where:
 * - T_avg, T: Temperature (C)
 * - T_base: Base temperature below which no growth occurs (C)
 * - LAI_max: Maximum leaf area index (m2/m2)
 * - LAI_initial: Initial leaf area index (m2/m2)
 * - growth_rate: Linear LAI growth rate (m2/m2 per C*day)
 * - k: Logistic growth rate constant (1/(C*day))
 * - GDD_half: GDD at which LAI reaches half of maximum (C*day)
 *
 * @accuracy
 * - Linear model: Simple, works well for early growth stages
 * - Logistic model: Better represents sigmoidal growth pattern
 *
 * @references
 * - Van Henten, E.J. (1994). Validation of a dynamic lettuce growth model
 *   for greenhouse climate control. J. Agric. Eng. Res. 59, 55-72.
 * - Marcelis, L.F.M., et al. (2009). Simulation of assimilate partitioning
 *   in the model TOMSIM. Acta Horticulturae 821, 103-110.
 * - Jolliet, O. & Bailey, B.J. (1992). The effect of climate on tomato
 *   transpiration in greenhouses. Agric. For. Meteorol. 58, 43-62.
 * - McMaster, G.S. & Wilhelm, W.W. (1997). Growing degree-days: one equation,
 *   two interpretations. Agric. For. Meteorol. 87, 291-300.
 *
 * @module plant-physiology/growth
 */

import type {
  GddIncrementInputs,
  GrowthModelInputs,
  GrowthModelOutputs,
  CropGrowthParameters,
  GrowthStage,
  LaiModelType,
} from './types';

// ============================================================================
// Constants
// ============================================================================

/** Hours per day for GDD conversion */
const HOURS_PER_DAY = 24;

// ============================================================================
// GDD Calculation Functions
// ============================================================================

/**
 * Calculate GDD increment for a single time step
 *
 * @description
 * Calculates the Growing Degree Days increment based on current temperature
 * and time step duration. Uses the simple averaging method.
 *
 * @equation
 * ```
 * GDD_increment = max(0, min(T, T_cutoff) - T_base) * (timeStep / 24)
 * ```
 *
 * @param inputs - GDD calculation input parameters
 * @returns GDD increment in Celsius-days
 *
 * @example
 * ```typescript
 * // Calculate hourly GDD for lettuce at 20C
 * const gddIncrement = calculateGddIncrement({
 *   temperature: 20,
 *   baseTemperature: 4,
 *   timeStepHours: 1,
 * });
 * // Returns: 0.667 C*day
 * ```
 *
 * @reference McMaster & Wilhelm (1997), Method 1
 */
export function calculateGddIncrement(inputs: GddIncrementInputs): number {
  const { temperature, baseTemperature, timeStepHours, upperCutoffTemperature } = inputs;

  // Validate time step
  if (timeStepHours < 0) {
    throw new Error('Time step must be non-negative');
  }

  // Handle zero time step
  if (timeStepHours === 0) {
    return 0;
  }

  // Apply upper cutoff if specified
  let effectiveTemp = temperature;
  if (upperCutoffTemperature !== undefined && temperature > upperCutoffTemperature) {
    effectiveTemp = upperCutoffTemperature;
  }

  // Calculate temperature above base
  const tempAboveBase = effectiveTemp - baseTemperature;

  // GDD is zero if temperature is at or below base
  if (tempAboveBase <= 0) {
    return 0;
  }

  // Convert hourly increment to daily GDD units
  // GDD_day = T_above_base * (hours / 24)
  const gddIncrement = tempAboveBase * (timeStepHours / HOURS_PER_DAY);

  return gddIncrement;
}

/**
 * Calculate cumulative GDD from a temperature time series
 *
 * @description
 * Sums GDD increments over multiple time steps to calculate total thermal time.
 *
 * @param temperatures - Array of temperature values in Celsius
 * @param baseTemperature - Base temperature for the crop in Celsius
 * @param timeStepHours - Time step between measurements in hours
 * @param upperCutoffTemperature - Optional upper temperature cutoff in Celsius
 * @returns Cumulative GDD in Celsius-days
 *
 * @example
 * ```typescript
 * // Calculate cumulative GDD for 5 hours of data
 * const temperatures = [18, 20, 22, 19, 21];
 * const cumulativeGdd = calculateCumulativeGdd(temperatures, 4, 1);
 * // Returns: 3.333 C*day
 * ```
 */
export function calculateCumulativeGdd(
  temperatures: number[],
  baseTemperature: number,
  timeStepHours: number,
  upperCutoffTemperature?: number
): number {
  if (temperatures.length === 0) {
    return 0;
  }

  let cumulativeGdd = 0;

  for (const temp of temperatures) {
    cumulativeGdd += calculateGddIncrement({
      temperature: temp,
      baseTemperature,
      timeStepHours,
      upperCutoffTemperature,
    });
  }

  return cumulativeGdd;
}

// ============================================================================
// LAI Growth Functions
// ============================================================================

/**
 * Calculate LAI from cumulative GDD using specified model
 *
 * @description
 * Predicts Leaf Area Index based on accumulated thermal time using either
 * a linear or logistic growth model.
 *
 * @equation
 * Linear Model:
 * ```
 * LAI = min(LAI_max, LAI_initial + growth_rate * GDD)
 * ```
 *
 * Logistic Model:
 * ```
 * LAI = LAI_max / (1 + exp(-k * (GDD - GDD_half)))
 * ```
 *
 * @param gdd - Cumulative GDD in Celsius-days
 * @param params - Crop growth parameters
 * @param modelType - Model type ('linear' or 'logistic')
 * @returns LAI value in m2/m2
 *
 * @example
 * ```typescript
 * import { CROP_PARAMETERS } from './crop-database';
 *
 * // Calculate LAI for lettuce at 300 GDD
 * const lai = calculateLaiFromGdd(300, CROP_PARAMETERS.lettuce, 'linear');
 * // Returns: 2.11 m2/m2
 * ```
 *
 * @reference Van Henten (1994), Equation 5
 */
export function calculateLaiFromGdd(
  gdd: number,
  params: CropGrowthParameters,
  modelType: LaiModelType = 'linear'
): number {
  // Handle negative GDD (return initial LAI)
  if (gdd < 0) {
    return params.initialLai;
  }

  if (modelType === 'linear') {
    return calculateLaiLinear(gdd, params);
  } else {
    return calculateLaiLogistic(gdd, params);
  }
}

/**
 * Linear LAI growth model
 *
 * @equation
 * ```
 * LAI = min(LAI_max, LAI_initial + growth_rate * GDD)
 * ```
 *
 * @reference Simplified from Van Henten (1994)
 */
function calculateLaiLinear(gdd: number, params: CropGrowthParameters): number {
  const { initialLai, laiGrowthRate, maxLai } = params;

  // Linear growth capped at maximum
  const lai = initialLai + laiGrowthRate * gdd;

  return Math.min(lai, maxLai);
}

/**
 * Logistic LAI growth model (sigmoid)
 *
 * @description
 * Models the characteristic S-shaped growth curve where growth rate
 * accelerates early, peaks at the inflection point, then decelerates.
 *
 * @equation
 * ```
 * LAI = LAI_max / (1 + exp(-k * (GDD - GDD_half)))
 * ```
 *
 * @reference Marcelis et al. (2009)
 */
function calculateLaiLogistic(gdd: number, params: CropGrowthParameters): number {
  const { maxLai, gddHalfMax, logisticK } = params;

  // Logistic function
  // LAI = LAI_max / (1 + exp(-k * (GDD - GDD_half)))
  const exponent = -logisticK * (gdd - gddHalfMax);

  // Prevent overflow for very large negative exponents
  if (exponent > 700) {
    return 0;
  }

  const lai = maxLai / (1 + Math.exp(exponent));

  return lai;
}

// ============================================================================
// Growth Stage Functions
// ============================================================================

/**
 * Determine growth stage based on cumulative GDD
 *
 * @description
 * Classifies the current growth stage based on the ratio of accumulated
 * GDD to the GDD required for maturity.
 *
 * Growth stages:
 * - Seedling: GDD < 20% of maturity GDD
 * - Vegetative: 20% <= GDD < 80% of maturity GDD
 * - Mature: GDD >= 80% of maturity GDD
 *
 * @param gdd - Cumulative GDD in Celsius-days
 * @param params - Crop growth parameters
 * @returns Growth stage classification
 *
 * @example
 * ```typescript
 * const stage = calculateGrowthStage(400, CROP_PARAMETERS.lettuce);
 * // Returns: 'vegetative'
 * ```
 */
export function calculateGrowthStage(
  gdd: number,
  params: CropGrowthParameters
): GrowthStage {
  const seedlingThreshold = params.seedlingThreshold ?? 0.2;
  const matureThreshold = params.matureThreshold ?? 0.8;

  const gddRatio = gdd / params.gddToMaturity;

  if (gddRatio < seedlingThreshold) {
    return 'seedling';
  } else if (gddRatio < matureThreshold) {
    return 'vegetative';
  } else {
    return 'mature';
  }
}

// ============================================================================
// Dry Weight Estimation
// ============================================================================

/**
 * Estimate dry weight from cumulative GDD
 *
 * @description
 * Estimates plant dry weight based on thermal time accumulation using
 * a logistic growth model. Dry weight is a primary indicator of crop
 * yield and economic value.
 *
 * @equation
 * ```
 * DW = DW_max / (1 + exp(-k * (GDD - GDD_half)))
 * ```
 *
 * Where DW_max is adjusted for the dry weight growth pattern.
 *
 * @param gdd - Cumulative GDD in Celsius-days
 * @param params - Crop growth parameters
 * @returns Estimated dry weight in g/m2
 *
 * @example
 * ```typescript
 * const dryWeight = calculateDryWeight(500, CROP_PARAMETERS.lettuce);
 * // Returns: ~120 g/m2
 * ```
 *
 * @reference Van Henten (1994), dry matter production model
 */
export function calculateDryWeight(
  gdd: number,
  params: CropGrowthParameters
): number {
  const { initialDryWeight, maxDryWeight, gddHalfMax, logisticK } = params;

  if (gdd <= 0) {
    return initialDryWeight;
  }

  // Use logistic model for dry weight accumulation
  // Similar to LAI but with different parameters
  const exponent = -logisticK * (gdd - gddHalfMax);

  // Prevent overflow
  if (exponent > 700) {
    return initialDryWeight;
  }

  // Logistic growth from initial to max dry weight
  const growthFraction = 1 / (1 + Math.exp(exponent));
  const dryWeight = initialDryWeight + (maxDryWeight - initialDryWeight) * growthFraction;

  return Math.min(dryWeight, maxDryWeight);
}

// ============================================================================
// Full Growth Simulation
// ============================================================================

/**
 * Simulate plant growth for a single time step
 *
 * @description
 * Comprehensive growth simulation that calculates GDD increment, updates
 * cumulative GDD, and derives all growth metrics (LAI, dry weight, stage).
 *
 * @param inputs - Growth model input parameters
 * @param params - Crop growth parameters
 * @param laiModel - LAI model type ('linear' or 'logistic')
 * @returns Complete growth model outputs
 *
 * @example
 * ```typescript
 * import { CROP_PARAMETERS } from './crop-database';
 *
 * const result = simulateGrowth({
 *   temperature: 22,
 *   baseTemperature: 4,
 *   currentGdd: 100,
 *   timeStepHours: 1,
 * }, CROP_PARAMETERS.lettuce);
 *
 * console.log(`GDD: ${result.totalGdd.toFixed(1)} C*day`);
 * console.log(`LAI: ${result.lai.toFixed(2)} m2/m2`);
 * console.log(`Stage: ${result.growthStage}`);
 * ```
 */
export function simulateGrowth(
  inputs: GrowthModelInputs,
  params: CropGrowthParameters,
  laiModel: LaiModelType = 'linear'
): GrowthModelOutputs {
  const {
    temperature,
    baseTemperature,
    currentGdd,
    timeStepHours,
    upperCutoffTemperature,
  } = inputs;

  // Calculate GDD increment
  const gddIncrement = calculateGddIncrement({
    temperature,
    baseTemperature,
    timeStepHours,
    upperCutoffTemperature: upperCutoffTemperature ?? params.upperTemperatureCutoff,
  });

  // Calculate new total GDD
  const totalGdd = currentGdd + gddIncrement;

  // Calculate LAI from total GDD
  const lai = calculateLaiFromGdd(totalGdd, params, laiModel);

  // Calculate dry weight
  const dryWeight = calculateDryWeight(totalGdd, params);

  // Determine growth stage
  const growthStage = calculateGrowthStage(totalGdd, params);

  return {
    gddIncrement,
    totalGdd,
    lai,
    dryWeight,
    growthStage,
  };
}

export default {
  calculateGddIncrement,
  calculateCumulativeGdd,
  calculateLaiFromGdd,
  calculateGrowthStage,
  calculateDryWeight,
  simulateGrowth,
};
