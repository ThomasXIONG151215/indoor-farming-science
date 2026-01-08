/**
 * Plant Growth Models Module
 *
 * @description
 * Growing Degree Days (GDD) and Leaf Area Index (LAI) models for
 * controlled environment agriculture. Provides thermal time-based
 * growth simulation for various crops.
 *
 * @module plant-physiology/growth
 *
 * @example
 * ```typescript
 * import {
 *   calculateGddIncrement,
 *   calculateLaiFromGdd,
 *   simulateGrowth,
 *   CROP_PARAMETERS,
 * } from '@vflab/indoor-farming-science/plant-physiology/growth';
 *
 * // Calculate GDD for lettuce at 20C
 * const gddIncrement = calculateGddIncrement({
 *   temperature: 20,
 *   baseTemperature: 4,
 *   timeStepHours: 1,
 * });
 *
 * // Simulate growth
 * const result = simulateGrowth({
 *   temperature: 22,
 *   baseTemperature: 4,
 *   currentGdd: 100,
 *   timeStepHours: 1,
 * }, CROP_PARAMETERS.lettuce);
 *
 * console.log(`LAI: ${result.lai} m2/m2`);
 * console.log(`Stage: ${result.growthStage}`);
 * ```
 *
 * @references
 * - Van Henten, E.J. (1994). Validation of a dynamic lettuce growth model
 *   for greenhouse climate control. J. Agric. Eng. Res. 59, 55-72.
 * - Marcelis, L.F.M., et al. (2009). Simulation of assimilate partitioning
 *   in the model TOMSIM. Acta Horticulturae 821, 103-110.
 * - McMaster, G.S. & Wilhelm, W.W. (1997). Growing degree-days: one equation,
 *   two interpretations. Agric. For. Meteorol. 87, 291-300.
 */

// Export types
export type {
  GddIncrementInputs,
  GrowthModelInputs,
  GrowthModelOutputs,
  CropGrowthParameters,
  GrowthStage,
  LaiModelType,
  TemperatureTimeSeries,
  GrowthSimulationResult,
} from './types';

// Export LAI-GDD functions
export {
  calculateGddIncrement,
  calculateCumulativeGdd,
  calculateLaiFromGdd,
  calculateGrowthStage,
  calculateDryWeight,
  simulateGrowth,
} from './lai-gdd';

// Export crop database
export {
  CROP_PARAMETERS,
  getCropParameters,
  listAvailableCrops,
  cropExists,
} from './crop-database';

// Default export
import laiGdd from './lai-gdd';
import { CROP_PARAMETERS } from './crop-database';

export default {
  ...laiGdd,
  CROP_PARAMETERS,
};
