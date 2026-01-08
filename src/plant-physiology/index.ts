/**
 * Plant Physiology Module
 *
 * @description
 * Models for plant water and carbon dynamics in controlled environments.
 * Includes transpiration, photosynthesis, and growth models.
 *
 * @module plant-physiology
 *
 * @example
 * ```typescript
 * import {
 *   penmanMonteith,
 *   graamansPfal,
 *   calculateVpd,
 * } from '@vflab/indoor-farming-science-models/plant-physiology';
 *
 * // For growth models, use the growth namespace
 * import { growth } from '@vflab/indoor-farming-science-models/plant-physiology';
 * const result = growth.simulateGrowth(inputs, growth.CROP_PARAMETERS.lettuce);
 * ```
 */

// Transpiration models
export * from './transpiration';

// Photosynthesis models
export * from './photosynthesis';

// Growth models - exported as namespace to avoid naming conflicts
// with photosynthesis module's listAvailableCrops and transpiration's GrowthStage
import * as growth from './growth';
export { growth };

// Also re-export key growth types and functions with explicit names
export type {
  GrowthModelInputs,
  GrowthModelOutputs,
  CropGrowthParameters,
  LaiModelType,
  TemperatureTimeSeries,
  GrowthSimulationResult,
  GddIncrementInputs,
} from './growth';

// Re-export growth stage type with alias to avoid conflict with transpiration types
export type { GrowthStage as CropGrowthStage } from './growth';

// Export main growth functions with explicit names
export {
  calculateGddIncrement,
  calculateCumulativeGdd,
  calculateLaiFromGdd,
  calculateGrowthStage as calculateCropGrowthStage,
  calculateDryWeight,
  simulateGrowth,
  CROP_PARAMETERS as CROP_GROWTH_PARAMETERS,
  getCropParameters as getGrowthCropParameters,
  cropExists,
} from './growth';

// Rename listAvailableCrops to avoid conflict with photosynthesis module
export { listAvailableCrops as listAvailableGrowthCrops } from './growth';

// Crop databases (to be implemented)
// export * from './databases';
