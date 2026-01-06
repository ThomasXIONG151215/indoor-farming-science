/**
 * Transpiration Models Module
 *
 * @description
 * Collection of scientifically-validated transpiration models for indoor farming.
 * Includes classic models (Penman-Monteith) and CEA-specific models (Graamans PFAL).
 *
 * @module plant-physiology/transpiration
 *
 * @example
 * ```typescript
 * // Classic Penman-Monteith
 * import { penmanMonteith } from '@vflab/indoor-farming-science-models/plant-physiology';
 *
 * const result = penmanMonteith({
 *   airTemperature: 22,
 *   relativeHumidity: 70,
 *   netRadiation: 150,
 *   stomatalResistance: 100,
 *   aerodynamicResistance: 50,
 * });
 *
 * // Plant factory specific (PPFD-driven)
 * import { graamansPfal } from '@vflab/indoor-farming-science-models/plant-physiology';
 *
 * const pfalResult = graamansPfal({
 *   airTemperature: 22,
 *   relativeHumidity: 70,
 *   ppfd: 300,
 *   forcedCirculation: true,
 *   photoperiodActive: true,
 * });
 * ```
 */

// Psychrometric calculations (core utilities)
export {
  saturationVaporPressure,
  saturationVaporPressureBuck,
  actualVaporPressure,
  vaporPressureSlope,
  calculateVpd,
  psychrometricConstant,
  airDensity,
  latentHeatOfVaporization,
  humidityRatio,
  specificEnthalpy,
  vaporConcentration,
  saturationVaporConcentration,
  dewPointTemperature,
  wetBulbTemperature,
} from './psychrometrics';

// Penman-Monteith model
export {
  penmanMonteith,
  estimateStomatalResistance,
  calculateAerodynamicResistance,
} from './penman-monteith';
export type { PenmanMonteithInputs } from './penman-monteith';

// Graamans PFAL model
export {
  graamansPfal,
  calculateGraamansStomatalResistance,
  calculateStanghelliniAerodynamicResistance,
  calculateNetRadiationFromLighting,
  estimateDailyTranspiration,
} from './graamans-pfal';
export type { GraamansPfalOptions } from './graamans-pfal';

// Type definitions
export * from './types';
