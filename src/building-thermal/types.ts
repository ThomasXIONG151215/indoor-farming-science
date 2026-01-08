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
 *
 * @example
 * ```typescript
 * const concreteLayer: WallLayer = {
 *   name: 'Concrete',
 *   thickness: 0.200,          // 200mm
 *   thermalConductivity: 1.4,  // W/(m.K)
 *   density: 2200,             // kg/m3
 *   specificHeat: 880,         // J/(kg.K)
 * };
 * ```
 */
export interface WallLayer {
  /**
   * Layer identifier or description
   * @example 'Concrete block', 'EPS insulation'
   */
  name: string;

  /**
   * Layer thickness
   * @unit m (meters)
   * @range 0.0001 - 10
   */
  thickness: number;

  /**
   * Thermal conductivity of the material
   * @unit W/(m.K)
   * @range 0.001 - 500
   * @reference ASHRAE Handbook Table 4, ISO 10456:2007
   */
  thermalConductivity: number;

  /**
   * Material density (optional, for transient calculations)
   * @unit kg/m3
   * @range 1 - 10000
   */
  density?: number;

  /**
   * Specific heat capacity (optional, for transient calculations)
   * @unit J/(kg.K)
   * @range 100 - 5000
   */
  specificHeat?: number;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input parameters for multi-layer wall heat transfer calculation
 *
 * @description
 * Complete specification for steady-state heat transfer through a multi-layer
 * wall assembly. Includes boundary conditions (temperatures) and surface
 * convection coefficients.
 *
 * @remarks
 * - Layers should be ordered from outside to inside
 * - Surface convection coefficients default to ISO 6946 values if not provided
 * - Area is optional and used only for total heat flow calculation
 *
 * @example
 * ```typescript
 * const inputs: MultiLayerWallInputs = {
 *   layers: [
 *     { name: 'Brick', thickness: 0.102, thermalConductivity: 0.77 },
 *     { name: 'Insulation', thickness: 0.050, thermalConductivity: 0.04 },
 *   ],
 *   insideTemperature: 20,   // Indoor setpoint
 *   outsideTemperature: -5,  // Winter design condition
 *   area: 25,                // Wall area in m2
 * };
 * ```
 */
export interface MultiLayerWallInputs {
  /**
   * Array of wall layers (ordered from outside to inside)
   * @minimum 1 layer required
   */
  layers: WallLayer[];

  /**
   * Inside (room) air temperature
   * @unit degC
   * @range -20 to 50 (typical building range)
   */
  insideTemperature: number;

  /**
   * Outside (ambient) air temperature
   * @unit degC
   * @range -50 to 60 (climate range)
   */
  outsideTemperature: number;

  /**
   * Inside surface convection coefficient
   * @unit W/(m2.K)
   * @default 7.69 (horizontal heat flow, still air, R_si = 0.13)
   * @reference ISO 6946:2017, Table 1
   */
  insideConvection?: number;

  /**
   * Outside surface convection coefficient
   * @unit W/(m2.K)
   * @default 25 (horizontal heat flow, wind 4m/s, R_se = 0.04)
   * @reference ISO 6946:2017, Table 1
   */
  outsideConvection?: number;

  /**
   * Wall surface area (optional)
   * @unit m2
   * @default 1
   * @description Used to calculate total heat flow (Q = q * A)
   */
  area?: number;
}

// ============================================================================
// Output Types
// ============================================================================

/**
 * Results from multi-layer wall heat transfer calculation
 *
 * @description
 * Complete output including U-value, thermal resistances, heat flow,
 * and temperature profile through the wall assembly.
 *
 * @remarks
 * Sign convention for heat flux:
 * - Positive: heat flows from outside to inside (heat gain)
 * - Negative: heat flows from inside to outside (heat loss)
 *
 * In our implementation, we use absolute value for consistency:
 * q = U * |deltaT|, with direction implicit in temperature comparison
 *
 * @example
 * ```typescript
 * const result: MultiLayerWallOutputs = {
 *   uValue: 0.35,           // Well-insulated wall
 *   totalResistance: 2.86,  // m2.K/W
 *   heatFlux: 8.75,         // W/m2 (25 degC difference)
 *   totalHeatFlow: 218.75,  // W (for 25 m2 wall)
 *   temperatureProfile: [
 *     -3.5,   // Outside surface temperature
 *     2.1,    // After brick layer
 *     18.3,   // After insulation
 *     19.6,   // Inside surface temperature
 *   ],
 *   layerResistances: {
 *     outsideSurface: 0.04,
 *     layers: [0.132, 1.25],
 *     insideSurface: 0.13,
 *   },
 * };
 * ```
 */
export interface MultiLayerWallOutputs {
  /**
   * Total thermal resistance of the wall assembly
   * @unit (m2.K)/W
   * @formula R_total = R_se + sum(d_i/k_i) + R_si
   */
  totalResistance: number;

  /**
   * Overall U-value (thermal transmittance)
   * @unit W/(m2.K)
   * @formula U = 1 / R_total
   */
  uValue: number;

  /**
   * Heat flux density through the wall
   * @unit W/m2
   * @formula q = U * deltaT
   */
  heatFlux: number;

  /**
   * Total heat flow through the wall
   * @unit W
   * @formula Q = q * A
   * @default Equals heatFlux when area = 1 or not specified
   */
  totalHeatFlow: number;

  /**
   * Temperature at each interface through the wall
   * @unit degC
   * @description
   * Array of temperatures starting from outside surface to inside air.
   * Length = number of layers + 1 (includes outside and inside surface temps)
   *
   * For n layers: [T_outside_surface, T_1-2, T_2-3, ..., T_inside_surface, T_inside_air]
   */
  temperatureProfile: number[];

  /**
   * Thermal resistance breakdown
   * @unit (m2.K)/W
   */
  layerResistances: {
    /** Outside surface resistance R_se */
    outsideSurface: number;
    /** Resistance of each material layer R_i = d_i / k_i */
    layers: number[];
    /** Inside surface resistance R_si */
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
