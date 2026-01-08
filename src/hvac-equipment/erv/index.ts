/**
 * ERV (Energy Recovery Ventilator) Module
 *
 * @description
 * NTU-Effectiveness based models for Energy Recovery Ventilators.
 * Provides calculations for sensible and latent heat recovery
 * in air-to-air heat exchangers.
 *
 * @references
 * - Kays, W.M. & London, A.L. (1984). Compact Heat Exchangers, 3rd ed.
 * - ASHRAE Handbook - HVAC Systems and Equipment (2020), Chapter 26
 * - Zhang, L.Z. (2008). Total heat recovery
 *
 * @module hvac-equipment/erv
 */

// Export types
export type {
  FlowArrangement,
  HumidityUnit,
  ERVInputs,
  ERVOutputs,
  SupplyOutletInputs,
  ExhaustOutletInputs,
  OutletConditions,
  NtuEffectivenessData,
  ERVSpecification,
  ERVOperatingPoint,
  ERVPerformanceCurve,
  ERVValidationResult,
  ERVParameterRanges,
} from './types';

// Export default ranges
export { DEFAULT_ERV_PARAMETER_RANGES } from './types';

// Export core functions
export {
  calculateNtu,
  calculateCapacityRatio,
  calculateEffectiveness,
  calculateSupplyOutletConditions,
  calculateExhaustOutletConditions,
  calculateErvPerformance,
  validateErvInputs,
} from './erv-ntu';
