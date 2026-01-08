/**
 * Photosynthesis Module
 *
 * @description
 * Biochemical models of leaf photosynthesis for C3 plants in controlled environments.
 * The main model is the Farquhar-von Caemmerer-Berry (FvCB) model which describes
 * photosynthesis as limited by Rubisco carboxylation, RuBP regeneration, or TPU.
 *
 * @module plant-physiology/photosynthesis
 *
 * @example
 * ```typescript
 * import {
 *   farquharFvCB,
 *   getCropParams,
 *   calculateLightResponse,
 * } from '@vflab/indoor-farming-science-models/plant-physiology';
 *
 * // Get lettuce parameters
 * const lettuce = getCropParams('lettuce');
 *
 * // Calculate photosynthesis
 * const result = farquharFvCB(
 *   {
 *     leafTemperature: 293.15, // 20°C
 *     intercellularCO2: 30,    // Pa
 *     absorbedPPFD: 400,       // µmol m⁻² s⁻¹
 *   },
 *   lettuce.params
 * );
 *
 * console.log(`Net assimilation: ${result.netAssimilation.toFixed(2)} µmol m⁻² s⁻¹`);
 * console.log(`Limiting factor: ${result.limitingFactor}`);
 * ```
 *
 * @references
 * - Farquhar, G.D., von Caemmerer, S., Berry, J.A. (1980). A biochemical model
 *   of photosynthetic CO2 assimilation in leaves of C3 species. Planta 149:78-90.
 */

// Types
export type {
  PhotosynthesisEnvironment,
  FvCBParameters,
  RubiscoKinetics,
  TemperatureResponseParams,
  PhotosynthesisResult,
  FvCBOptions,
  LightResponseInput,
  ACiCurveFittingInput,
  CropPhotosynthesisParams,
} from './types';

// FvCB model
export {
  // Main calculation
  farquharFvCB,

  // Convenience functions
  calculateLightResponse,
  calculateACiCurve,

  // Temperature response functions
  arrheniusResponse,
  peakedArrheniusResponse,

  // Component calculations
  calculateElectronTransportRate,
  calculateRubiscoLimited,
  calculateElectronTransportLimited,
  calculateTpuLimited,
  smoothMinimum,

  // Kinetic constants
  DEFAULT_RUBISCO_KINETICS,
  VCMAX_TEMPERATURE_RESPONSE,
  JMAX_TEMPERATURE_RESPONSE,
  RD_TEMPERATURE_RESPONSE,

  // Crop database
  CROP_PHOTOSYNTHESIS_PARAMS,
  getCropParams,
  listAvailableCrops,
} from './farquhar-fvcb';
