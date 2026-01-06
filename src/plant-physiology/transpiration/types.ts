/**
 * Type Definitions for Transpiration Models
 *
 * @module plant-physiology/transpiration
 */

// Re-export common types
export type {
  TranspirationInputs,
  TranspirationOutputs,
  PfalTranspirationInputs,
  VpdResult,
} from '../../common/types';

/**
 * Crop type identifiers
 */
export type CropType =
  | 'lettuce'
  | 'tomato'
  | 'cucumber'
  | 'spinach'
  | 'herbs'
  | 'strawberry'
  | 'pepper'
  | 'custom';

/**
 * Growth stage identifiers
 */
export type GrowthStage =
  | 'seedling'
  | 'vegetative'
  | 'flowering'
  | 'fruiting'
  | 'mature';

/**
 * Crop-specific transpiration parameters
 */
export interface CropTranspirationParameters {
  /** Crop type name */
  name: string;
  /** Maximum stomatal conductance in mm/s */
  maxStomatalConductance: number;
  /** Optimal temperature for transpiration in °C */
  optimalTemperature: number;
  /** Temperature tolerance range in °C */
  temperatureRange: number;
  /** Light saturation point in μmol/(m²·s) */
  lightSaturation: number;
  /** VPD sensitivity coefficient */
  vpdSensitivity: number;
  /** Reference CO2 concentration in ppm */
  co2Reference: number;
  /** Water use efficiency in g/g */
  waterUseEfficiency: number;
  /** Maximum leaf area index */
  maxLAI: number;
}

/**
 * Growth stage modification factors
 */
export interface GrowthStageFactors {
  /** LAI multiplication factor */
  lai: number;
  /** Stomatal conductance modification */
  conductance: number;
  /** Transpiration efficiency modification */
  efficiency: number;
}

/**
 * Extended transpiration result with crop-specific data
 */
export interface CropTranspirationResult {
  /** Base transpiration outputs */
  transpiration: {
    rate: number;
    rateMass: number;
    dailyTotal: number;
  };
  /** Energy balance */
  energy: {
    latentHeatFlux: number;
    sensibleHeatFlux: number;
    netRadiation: number;
  };
  /** Environmental response factors */
  responses: {
    lightResponse: number;
    temperatureResponse: number;
    vpdResponse: number;
    co2Response: number;
  };
  /** System impacts */
  systemImpact: {
    humidityLoad: number;
    coolingLoad: number;
    waterConsumption: number;
  };
}
