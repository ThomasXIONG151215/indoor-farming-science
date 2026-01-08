/**
 * Growth Model Type Definitions
 *
 * @description
 * Type definitions for LAI-GDD growth models used in controlled environment agriculture.
 * Includes interfaces for model inputs, outputs, and crop-specific parameters.
 *
 * @module plant-physiology/growth/types
 *
 * @references
 * - Marcelis, L.F.M., et al. (2009). Simulation of assimilate partitioning
 *   in the model TOMSIM. Acta Horticulturae 821, 103-110.
 * - Van Henten, E.J. (1994). Validation of a dynamic lettuce growth model
 *   for greenhouse climate control. J. Agric. Eng. Res. 59, 55-72.
 * - Jolliet, O. & Bailey, B.J. (1992). The effect of climate on tomato
 *   transpiration in greenhouses. Agric. For. Meteorol. 58, 43-62.
 */

// ============================================================================
// GDD Calculation Types
// ============================================================================

/**
 * Input parameters for single time-step GDD calculation
 */
export interface GddIncrementInputs {
  /** Current air temperature in Celsius */
  temperature: number;
  /** Base temperature for the crop in Celsius (no growth below this temperature) */
  baseTemperature: number;
  /** Time step duration in hours */
  timeStepHours: number;
  /** Upper cutoff temperature in Celsius (optional, caps GDD accumulation) */
  upperCutoffTemperature?: number;
}

/**
 * Input parameters for growth model simulation
 */
export interface GrowthModelInputs {
  /** Current air temperature in Celsius */
  temperature: number;
  /** Base temperature for the crop in Celsius */
  baseTemperature: number;
  /** Cumulative GDD from previous time steps in Celsius-days */
  currentGdd: number;
  /** Time step duration in hours */
  timeStepHours: number;
  /** Upper cutoff temperature in Celsius (optional) */
  upperCutoffTemperature?: number;
}

// ============================================================================
// Growth Model Output Types
// ============================================================================

/**
 * Output results from growth model simulation
 */
export interface GrowthModelOutputs {
  /** GDD increment for this time step in Celsius-days */
  gddIncrement: number;
  /** Total cumulative GDD in Celsius-days */
  totalGdd: number;
  /** Current leaf area index in m2/m2 */
  lai: number;
  /** Estimated dry weight in g/m2 */
  dryWeight: number;
  /** Current growth stage */
  growthStage: GrowthStage;
}

/**
 * Growth stage enumeration
 */
export type GrowthStage = 'seedling' | 'vegetative' | 'mature';

/**
 * LAI model type selection
 */
export type LaiModelType = 'linear' | 'logistic';

// ============================================================================
// Crop Parameters Types
// ============================================================================

/**
 * Crop-specific growth parameters
 *
 * @description
 * Contains all parameters needed to model crop growth using GDD and LAI relationships.
 * Parameters are derived from published literature for specific crops.
 *
 * @example
 * ```typescript
 * const lettuceParams: CropGrowthParameters = {
 *   name: 'Butterhead Lettuce',
 *   baseTemperature: 4,
 *   optimalTemperature: 18,
 *   maxLai: 4.5,
 *   gddToMaturity: 650,
 *   initialLai: 0.01,
 *   laiGrowthRate: 0.007,
 *   gddHalfMax: 325,
 *   logisticK: 0.012,
 *   initialDryWeight: 0.5,
 *   maxDryWeight: 200,
 * };
 * ```
 */
export interface CropGrowthParameters {
  /** Human-readable crop name */
  name: string;

  /**
   * Base temperature below which no growth occurs
   * @unit Celsius
   * @reference Van Henten (1994) for lettuce: 4C
   */
  baseTemperature: number;

  /**
   * Optimal temperature for maximum growth rate
   * @unit Celsius
   */
  optimalTemperature: number;

  /**
   * Maximum achievable leaf area index
   * @unit m2/m2
   */
  maxLai: number;

  /**
   * Cumulative GDD required to reach maturity
   * @unit Celsius-days
   * @reference Van Henten (1994) for lettuce: ~650 C*day
   */
  gddToMaturity: number;

  /**
   * Initial LAI at planting/germination
   * @unit m2/m2
   */
  initialLai: number;

  /**
   * Linear LAI growth rate (for linear model)
   * @unit m2/m2 per Celsius-day
   */
  laiGrowthRate: number;

  /**
   * GDD at which LAI reaches half of maximum (for logistic model)
   * @unit Celsius-days
   */
  gddHalfMax: number;

  /**
   * Logistic growth rate constant
   * @unit 1/(Celsius-days)
   */
  logisticK: number;

  /**
   * Initial dry weight at planting
   * @unit g/m2
   */
  initialDryWeight: number;

  /**
   * Maximum dry weight at full maturity
   * @unit g/m2
   */
  maxDryWeight: number;

  /**
   * Upper temperature cutoff for GDD calculation (optional)
   * @unit Celsius
   * @description Above this temperature, effective temperature is capped
   */
  upperTemperatureCutoff?: number;

  /**
   * Seedling stage threshold as fraction of GDD to maturity
   * @unit dimensionless (0-1)
   * @default 0.2
   */
  seedlingThreshold?: number;

  /**
   * Mature stage threshold as fraction of GDD to maturity
   * @unit dimensionless (0-1)
   * @default 0.8
   */
  matureThreshold?: number;
}

// ============================================================================
// Batch Processing Types
// ============================================================================

/**
 * Time series temperature data for batch GDD calculation
 */
export interface TemperatureTimeSeries {
  /** Array of temperature values in Celsius */
  temperatures: number[];
  /** Time step between measurements in hours */
  timeStepHours: number;
  /** Base temperature for the crop in Celsius */
  baseTemperature: number;
  /** Upper cutoff temperature in Celsius (optional) */
  upperCutoffTemperature?: number;
}

/**
 * Result from batch growth simulation
 */
export interface GrowthSimulationResult {
  /** Array of cumulative GDD values at each time step */
  gddTimeSeries: number[];
  /** Array of LAI values at each time step */
  laiTimeSeries: number[];
  /** Array of growth stages at each time step */
  stageTimeSeries: GrowthStage[];
  /** Array of dry weight estimates at each time step */
  dryWeightTimeSeries: number[];
  /** Final cumulative GDD */
  finalGdd: number;
  /** Final LAI */
  finalLai: number;
  /** Final growth stage */
  finalStage: GrowthStage;
  /** Final dry weight estimate */
  finalDryWeight: number;
  /** Days to reach each growth stage */
  daysToStages: {
    seedling: number;
    vegetative: number;
    mature: number | null;
  };
}
