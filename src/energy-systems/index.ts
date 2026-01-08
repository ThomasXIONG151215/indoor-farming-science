/**
 * Energy Systems Module
 *
 * @description
 * Models for energy systems commonly used in indoor farming:
 * - Photovoltaic (PV) panels
 * - Energy storage systems
 * - Radiative cooling
 *
 * @module energy-systems
 *
 * @example
 * ```typescript
 * import {
 *   PVSingleDiodeModel,
 *   PV_MODULE_DATABASE,
 *   calculateMPP,
 * } from '@vflab/indoor-farming-science/energy-systems';
 *
 * // Create a PV model
 * const pv = new PVSingleDiodeModel('jinko_tiger_pro_545');
 *
 * // Calculate output at operating conditions
 * const output = pv.calculate({
 *   irradiance: 800,      // W/m²
 *   cellTemperature: 45,  // °C
 * });
 *
 * console.log(`Power: ${output.pMpp.toFixed(1)} W`);
 * ```
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type {
  PVModuleSpecification,
  PVInputs,
  PVOutputs,
  IVCurve,
  FiveParameters,
  MPPResult,
  PVArrayConfiguration,
  PVSystemLosses,
} from './types';

// ============================================================================
// Constants
// ============================================================================

export {
  PV_CONSTANTS,
  calculateBandgap,
  calculateThermalVoltage,
  estimateCellTemperature,
} from './pv-constants';

// ============================================================================
// Module Database
// ============================================================================

export {
  PV_MODULE_DATABASE,
  getModuleSpec,
  listAvailableModules,
  searchModulesByManufacturer,
  searchModulesByPower,
} from './pv-modules';

// ============================================================================
// Single Diode Model
// ============================================================================

export {
  // Class
  PVSingleDiodeModel,

  // Functions
  extractFiveParameters,
  calculatePhotocurrent,
  calculateSaturationCurrent,
  solveSingleDiodeEquation,
  calculateIVCurve,
  calculateMPP,
} from './pv-single-diode';
