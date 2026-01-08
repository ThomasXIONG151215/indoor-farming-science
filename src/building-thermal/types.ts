/**
 * Type Definitions for Building Thermal Models
 *
 * @description
 * Interfaces and types for multi-layer wall heat transfer calculations.
 * Based on ISO 6946:2017 and ASHRAE Handbook standards.
 *
 * @module building-thermal
 *
 * @references
 * - ISO 6946:2017 - Building components and building elements
 * - ASHRAE Handbook - Fundamentals (2021), Chapter 27
 * - Incropera, F.P. & DeWitt, D.P. - Fundamentals of Heat and Mass Transfer
 */

// ============================================================================
// Wall Layer Types
// ============================================================================

/**
 * Single wall layer definition
 *
 * @description
 * Defines a single homogeneous layer in a multi-layer wall assembly.
 * Each layer is characterized by its thickness and thermal properties.
 */
export interface WallLayer {
  name: string;
  thickness: number;
  thermalConductivity: number;
  density?: number;
  specificHeat?: number;
}

/**
 * Input parameters for multi-layer wall heat transfer calculation
 */
export interface MultiLayerWallInputs {
  layers: WallLayer[];
  insideTemperature: number;
  outsideTemperature: number;
  insideConvection?: number;
  outsideConvection?: number;
  area?: number;
}

/**
 * Results from multi-layer wall heat transfer calculation
 */
export interface MultiLayerWallOutputs {
  totalResistance: number;
  uValue: number;
  heatFlux: number;
  totalHeatFlow: number;
  temperatureProfile: number[];
  layerResistances: {
    outsideSurface: number;
    layers: number[];
    insideSurface: number;
  };
}

// ============================================================================
// Material Properties Types
// ============================================================================

/**
 * Thermal properties of building materials
 *
 * @description
 * Complete thermal characterization of a building material including
 * steady-state and transient properties.
 *
 * @reference
 * - ASHRAE Handbook - Fundamentals (2021), Chapter 26, Table 4
 * - ISO 10456:2007 - Building materials and products
 * - Incropera & DeWitt - Fundamentals of Heat and Mass Transfer, Appendix A
 */
export interface MaterialProperties {
  /**
   * Full material name
   */
  name: string;

  /**
   * Thermal conductivity
   * @unit W/(m.K)
   */
  thermalConductivity: number;

  /**
   * Material density
   * @unit kg/m3
   */
  density: number;

  /**
   * Specific heat capacity
   * @unit J/(kg.K)
   */
  specificHeat: number;

  /**
   * Literature reference for property values
   */
  reference: string;

  /**
   * Additional notes or conditions
   */
  notes?: string;
}

/**
 * Material thermal properties database type
 */
export type MaterialDatabase = Record<string, MaterialProperties>;

// ============================================================================
// Convection Coefficient Types
// ============================================================================

/**
 * Surface thermal resistance values per ISO 6946:2017
 *
 * @description
 * Standard surface resistances for different orientations and conditions.
 *
 * @reference ISO 6946:2017, Table 1
 */
export interface SurfaceResistances {
  /**
   * Internal surface resistance R_si
   * @unit (m2.K)/W
   */
  inside: number;

  /**
   * External surface resistance R_se
   * @unit (m2.K)/W
   */
  outside: number;
}

/**
 * Heat flow direction for convection coefficient selection
 *
 * @description
 * - 'horizontal': Heat flow through vertical wall (most common)
 * - 'upward': Heat flow through floor/ceiling (heat rising)
 * - 'downward': Heat flow through ceiling/floor (heat falling)
 *
 * @reference ISO 6946:2017, Table 1
 */
export type HeatFlowDirection = 'horizontal' | 'upward' | 'downward';

/**
 * Surface condition affecting convection
 */
export type SurfaceCondition = 'still_air' | 'low_wind' | 'high_wind';

// ============================================================================
// Calculation Helper Types
// ============================================================================

/**
 * Temperature boundary conditions
 */
export interface TemperatureBoundaries {
  /** Inside air temperature in degC */
  inside: number;
  /** Outside air temperature in degC */
  outside: number;
}

/**
 * Validation result for wall inputs
 */
export interface WallValidationResult {
  /** Whether all inputs are valid */
  valid: boolean;
  /** Error messages for invalid inputs */
  errors: string[];
  /** Warning messages for edge-case inputs */
  warnings: string[];
}
