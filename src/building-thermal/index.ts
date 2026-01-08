/**
 * Building Thermal Module
 *
 * @description
 * Models for building envelope heat transfer including multi-layer walls,
 * glazing systems, and thermal bridges. Based on ISO 6946:2017 and
 * ASHRAE Handbook standards.
 *
 * @module building-thermal
 *
 * @example
 * ```typescript
 * import {
 *   calculateMultiLayerWall,
 *   calculateLayerResistance,
 *   MATERIAL_THERMAL_PROPERTIES,
 * } from '@vflab/indoor-farming-science/building-thermal';
 *
 * // Calculate U-value for a wall assembly
 * const result = calculateMultiLayerWall({
 *   layers: [
 *     { name: 'Brick', thickness: 0.102, thermalConductivity: 0.77 },
 *     { name: 'Insulation', thickness: 0.100, thermalConductivity: 0.04 },
 *     { name: 'Block', thickness: 0.100, thermalConductivity: 0.51 },
 *   ],
 *   insideTemperature: 20,
 *   outsideTemperature: -5,
 * });
 *
 * console.log(`U-value: ${result.uValue.toFixed(2)} W/(m2.K)`);
 * ```
 *
 * @references
 * - ISO 6946:2017 - Building components and building elements
 * - ASHRAE Handbook - Fundamentals (2021), Chapter 27
 * - Incropera, F.P. & DeWitt, D.P. - Fundamentals of Heat and Mass Transfer
 */

// Types
export type {
  WallLayer,
  MultiLayerWallInputs,
  MultiLayerWallOutputs,
  MaterialProperties,
  MaterialDatabase,
  SurfaceResistances,
  HeatFlowDirection,
  SurfaceCondition,
  TemperatureBoundaries,
  WallValidationResult,
} from './types';

// Multi-layer wall model
export {
  calculateMultiLayerWall,
  calculateLayerResistance,
  calculateTemperatureProfile,
  calculateUValue,
  calculateHeatEnergy,
  calculateThermalMass,
  calculateTimeConstant,
  calculateDecrementFactor,
} from './multi-layer-wall';

// Material database
export {
  MATERIAL_THERMAL_PROPERTIES,
  SURFACE_RESISTANCES,
  DEFAULT_CONVECTION_COEFFICIENTS,
  getMaterialProperties,
  listAvailableMaterials,
  findMaterialsByThermalConductivity,
  calculateThermalDiffusivity,
  calculateThermalEffusivity,
} from './materials';

// Default export
export { default as multiLayerWall } from './multi-layer-wall';

// Glazing models (to be implemented)
// export * from './glazing';

// Solar heat gain models (to be implemented)
// export * from './solar';

// Thermal bridge models (to be implemented)
// export * from './thermal-bridge';
