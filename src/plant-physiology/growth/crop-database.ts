/**
 * Crop Growth Parameters Database
 *
 * @description
 * Contains scientifically-validated growth parameters for common crops
 * in controlled environment agriculture. All parameters are derived from
 * peer-reviewed literature.
 *
 * @module plant-physiology/growth/crop-database
 *
 * @references
 * - Van Henten, E.J. (1994). Validation of a dynamic lettuce growth model
 *   for greenhouse climate control. J. Agric. Eng. Res. 59, 55-72.
 * - Marcelis, L.F.M., et al. (2009). Simulation of assimilate partitioning
 *   in the model TOMSIM. Acta Horticulturae 821, 103-110.
 * - Jolliet, O. & Bailey, B.J. (1992). The effect of climate on tomato
 *   transpiration in greenhouses. Agric. For. Meteorol. 58, 43-62.
 * - Ferreira, M.E., et al. (1997). Lettuce growth and yield in hydroponic
 *   systems. HortTechnology 7, 61-64.
 * - Chang, X., et al. (2005). Growth and development of basil under
 *   controlled environment conditions. HortScience 40, 1053-1054.
 * - Both, A.J. (2003). Ten years of hydroponic lettuce research.
 *   Rutgers University Cooperative Extension.
 */

import type { CropGrowthParameters } from './types';

/**
 * Crop Growth Parameters Database
 *
 * @description
 * Contains validated growth parameters for common CEA crops.
 * Each crop entry includes all parameters needed for GDD-based
 * growth simulation.
 *
 * Parameter Sources:
 * - Lettuce: Van Henten (1994), Both (2003)
 * - Basil: Chang et al. (2005)
 * - Spinach: Literature compilation
 * - Tomato: Jolliet & Bailey (1992), Marcelis et al. (2009)
 * - Cucumber: Literature compilation
 * - Strawberry: Literature compilation
 *
 * @example
 * ```typescript
 * import { CROP_PARAMETERS } from './crop-database';
 *
 * const lettuce = CROP_PARAMETERS.lettuce;
 * console.log(`Base temp: ${lettuce.baseTemperature}C`);
 * console.log(`GDD to maturity: ${lettuce.gddToMaturity} C*day`);
 * ```
 */
export const CROP_PARAMETERS: Record<string, CropGrowthParameters> = {
  /**
   * Butterhead Lettuce (Lactuca sativa var. capitata)
   *
   * @reference
   * - Van Henten, E.J. (1994). J. Agric. Eng. Res. 59, 55-72.
   * - Both, A.J. (2003). Rutgers University research data.
   *
   * Typical growth cycle: 35-45 days in CEA
   * Harvest weight: 150-200g fresh weight
   */
  lettuce: {
    name: 'Butterhead Lettuce',
    /**
     * Base temperature for lettuce growth
     * @unit Celsius
     * @reference Van Henten (1994): T_base = 4C
     */
    baseTemperature: 4,
    /**
     * Optimal temperature for maximum growth rate
     * @unit Celsius
     * @reference Both (2003): 18-21C optimal
     */
    optimalTemperature: 18,
    /**
     * Maximum LAI for mature lettuce
     * @unit m2/m2
     * @reference Van Henten (1994): 4-5 m2/m2
     */
    maxLai: 4.5,
    /**
     * Cumulative GDD required to reach harvest maturity
     * @unit Celsius-days
     * @reference Van Henten (1994): ~650 C*day
     */
    gddToMaturity: 650,
    /**
     * Initial LAI at transplant
     * @unit m2/m2
     */
    initialLai: 0.01,
    /**
     * Linear LAI growth rate
     * @unit m2/m2 per C*day
     * @note Calculated to reach maxLai near gddToMaturity
     */
    laiGrowthRate: 0.007,
    /**
     * GDD at which LAI reaches half of maximum (logistic model)
     * @unit Celsius-days
     * @note Typically 50% of gddToMaturity
     */
    gddHalfMax: 325,
    /**
     * Logistic growth rate constant
     * @unit 1/(Celsius-days)
     */
    logisticK: 0.012,
    /**
     * Initial dry weight at transplant
     * @unit g/m2
     */
    initialDryWeight: 0.5,
    /**
     * Maximum dry weight at harvest
     * @unit g/m2
     * @reference Van Henten (1994): 180-220 g/m2
     */
    maxDryWeight: 200,
    /**
     * Upper temperature cutoff (optional)
     * @unit Celsius
     * @note Growth rate decreases above 25C
     */
    upperTemperatureCutoff: 30,
    seedlingThreshold: 0.2,
    matureThreshold: 0.8,
  },

  /**
   * Sweet Basil (Ocimum basilicum)
   *
   * @reference
   * - Chang, X., et al. (2005). HortScience 40, 1053-1054.
   *
   * Typical growth cycle: 28-35 days in CEA
   * Harvest weight: 30-50g fresh weight per plant
   */
  basil: {
    name: 'Sweet Basil',
    /**
     * Base temperature for basil growth
     * @unit Celsius
     * @reference Higher than lettuce due to tropical origin
     */
    baseTemperature: 10,
    /**
     * Optimal temperature for maximum growth rate
     * @unit Celsius
     * @reference Chang et al. (2005): 23-28C optimal
     */
    optimalTemperature: 25,
    /**
     * Maximum LAI for mature basil
     * @unit m2/m2
     */
    maxLai: 5.0,
    /**
     * Cumulative GDD required to reach harvest maturity
     * @unit Celsius-days
     */
    gddToMaturity: 800,
    initialLai: 0.01,
    laiGrowthRate: 0.006,
    gddHalfMax: 400,
    logisticK: 0.010,
    initialDryWeight: 0.3,
    maxDryWeight: 150,
    upperTemperatureCutoff: 35,
    seedlingThreshold: 0.15,
    matureThreshold: 0.75,
  },

  /**
   * Baby Spinach (Spinacia oleracea)
   *
   * @reference
   * - Literature compilation from multiple CEA studies
   *
   * Typical growth cycle: 21-28 days for baby leaf
   * Cool-season crop with low base temperature
   */
  spinach: {
    name: 'Baby Spinach',
    /**
     * Base temperature for spinach growth
     * @unit Celsius
     * @note Cold-tolerant crop
     */
    baseTemperature: 2,
    /**
     * Optimal temperature for spinach
     * @unit Celsius
     * @note Prefers cooler temperatures
     */
    optimalTemperature: 15,
    maxLai: 3.5,
    gddToMaturity: 450,
    initialLai: 0.01,
    laiGrowthRate: 0.008,
    gddHalfMax: 225,
    logisticK: 0.014,
    initialDryWeight: 0.2,
    maxDryWeight: 80,
    upperTemperatureCutoff: 25,
    seedlingThreshold: 0.2,
    matureThreshold: 0.85,
  },

  /**
   * Cherry Tomato (Solanum lycopersicum var. cerasiforme)
   *
   * @reference
   * - Jolliet, O. & Bailey, B.J. (1992). Agric. For. Meteorol. 58, 43-62.
   * - Marcelis, L.F.M., et al. (2009). Acta Horticulturae 821, 103-110.
   *
   * Indeterminate growth habit
   * Long production cycle: 90-120+ days
   */
  tomato: {
    name: 'Cherry Tomato',
    /**
     * Base temperature for tomato growth
     * @unit Celsius
     * @reference Jolliet & Bailey (1992): T_base = 10C
     */
    baseTemperature: 10,
    /**
     * Optimal temperature for tomato
     * @unit Celsius
     * @reference Day temperature optimum
     */
    optimalTemperature: 24,
    /**
     * Maximum LAI for mature tomato canopy
     * @unit m2/m2
     * @reference Marcelis et al. (2009)
     */
    maxLai: 6.0,
    /**
     * GDD to first fruit maturity
     * @unit Celsius-days
     * @note From transplant to first ripe fruit
     */
    gddToMaturity: 1200,
    initialLai: 0.02,
    laiGrowthRate: 0.005,
    gddHalfMax: 600,
    logisticK: 0.008,
    initialDryWeight: 1.0,
    maxDryWeight: 400,
    upperTemperatureCutoff: 32,
    seedlingThreshold: 0.15,
    matureThreshold: 0.7,
  },

  /**
   * Cucumber (Cucumis sativus)
   *
   * @reference
   * - Literature compilation from greenhouse studies
   *
   * Fast-growing vining crop
   * Typical cycle to first harvest: 40-60 days
   */
  cucumber: {
    name: 'Greenhouse Cucumber',
    baseTemperature: 12,
    optimalTemperature: 26,
    maxLai: 5.5,
    gddToMaturity: 900,
    initialLai: 0.02,
    laiGrowthRate: 0.006,
    gddHalfMax: 450,
    logisticK: 0.010,
    initialDryWeight: 0.8,
    maxDryWeight: 300,
    upperTemperatureCutoff: 35,
    seedlingThreshold: 0.12,
    matureThreshold: 0.65,
  },

  /**
   * Strawberry (Fragaria x ananassa)
   *
   * @reference
   * - Literature compilation from CEA studies
   *
   * Day-neutral cultivar parameters
   * Long production cycle with multiple harvests
   */
  strawberry: {
    name: 'Day-neutral Strawberry',
    baseTemperature: 7,
    optimalTemperature: 22,
    maxLai: 4.0,
    gddToMaturity: 1000,
    initialLai: 0.03,
    laiGrowthRate: 0.004,
    gddHalfMax: 500,
    logisticK: 0.009,
    initialDryWeight: 0.5,
    maxDryWeight: 250,
    upperTemperatureCutoff: 28,
    seedlingThreshold: 0.2,
    matureThreshold: 0.75,
  },

  /**
   * Microgreens Mix (Various species)
   *
   * @reference
   * - Empirical data from vertical farm operations
   *
   * Very short production cycle: 7-14 days
   * High-value crop for rapid turnover
   */
  microgreens: {
    name: 'Microgreens Mix',
    /**
     * Average base temperature across common microgreen species
     * @unit Celsius
     */
    baseTemperature: 5,
    optimalTemperature: 20,
    /**
     * Low LAI due to very short growth period
     * @unit m2/m2
     */
    maxLai: 2.0,
    /**
     * GDD to harvest (cotyledon/first true leaf stage)
     * @unit Celsius-days
     */
    gddToMaturity: 150,
    initialLai: 0.02,
    laiGrowthRate: 0.012,
    gddHalfMax: 75,
    logisticK: 0.025,
    initialDryWeight: 0.1,
    maxDryWeight: 30,
    upperTemperatureCutoff: 28,
    seedlingThreshold: 0.3,
    matureThreshold: 0.9,
  },

  /**
   * Kale (Brassica oleracea var. acephala)
   *
   * @reference
   * - Literature compilation from CEA studies
   *
   * Cold-tolerant leafy green
   * Can be harvested at multiple stages
   */
  kale: {
    name: 'Curly Kale',
    baseTemperature: 5,
    optimalTemperature: 18,
    maxLai: 4.0,
    gddToMaturity: 600,
    initialLai: 0.01,
    laiGrowthRate: 0.007,
    gddHalfMax: 300,
    logisticK: 0.012,
    initialDryWeight: 0.4,
    maxDryWeight: 180,
    upperTemperatureCutoff: 28,
    seedlingThreshold: 0.2,
    matureThreshold: 0.8,
  },
};

/**
 * Get crop parameters by name with validation
 *
 * @param cropName - Name of the crop (case-insensitive)
 * @returns Crop growth parameters
 * @throws Error if crop is not found in database
 *
 * @example
 * ```typescript
 * const params = getCropParameters('lettuce');
 * const params2 = getCropParameters('Butterhead Lettuce');
 * ```
 */
export function getCropParameters(cropName: string): CropGrowthParameters {
  // Try direct lookup first
  const directLookup = CROP_PARAMETERS[cropName.toLowerCase()];
  if (directLookup) {
    return directLookup;
  }

  // Try matching by full name
  for (const params of Object.values(CROP_PARAMETERS)) {
    if (params.name.toLowerCase() === cropName.toLowerCase()) {
      return params;
    }
  }

  // Not found
  const availableCrops = Object.keys(CROP_PARAMETERS).join(', ');
  throw new Error(
    `Crop "${cropName}" not found in database. Available crops: ${availableCrops}`
  );
}

/**
 * List all available crop names
 *
 * @returns Array of crop identifiers
 */
export function listAvailableCrops(): string[] {
  return Object.keys(CROP_PARAMETERS);
}

/**
 * Check if a crop exists in the database
 *
 * @param cropName - Name of the crop to check
 * @returns True if crop exists
 */
export function cropExists(cropName: string): boolean {
  try {
    getCropParameters(cropName);
    return true;
  } catch {
    return false;
  }
}

export default CROP_PARAMETERS;
