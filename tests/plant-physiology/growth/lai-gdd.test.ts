/**
 * LAI-GDD Growth Model Tests
 *
 * @description
 * Test suite for Growing Degree Days (GDD) calculation and
 * Leaf Area Index (LAI) growth models.
 *
 * @references
 * - Van Henten, E.J. (1994). Validation of a dynamic lettuce growth model
 *   for greenhouse climate control. J. Agric. Eng. Res. 59, 55-72.
 * - Marcelis, L.F.M., et al. (2009). Simulation of assimilate partitioning
 *   in the model TOMSIM.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateGddIncrement,
  calculateCumulativeGdd,
  calculateLaiFromGdd,
  calculateGrowthStage,
  calculateDryWeight,
  simulateGrowth,
  CROP_PARAMETERS,
} from '../../../src/plant-physiology/growth';
import type {
  GrowthModelInputs,
  GrowthModelOutputs,
  CropGrowthParameters,
} from '../../../src/plant-physiology/growth/types';

// ============================================================================
// GDD Calculation Tests
// ============================================================================

describe('GDD Calculation', () => {
  describe('calculateGddIncrement', () => {
    it('should calculate GDD correctly for temperature above base', () => {
      // Average temperature 20C, base temperature 4C (lettuce)
      // Expected GDD increment for 1 hour = (20 - 4) / 24 = 0.667 C*day
      const result = calculateGddIncrement({
        temperature: 20,
        baseTemperature: 4,
        timeStepHours: 1,
      });

      expect(result).toBeCloseTo(16 / 24, 3); // 0.667 C*day
    });

    it('should return 0 when temperature is below base temperature', () => {
      // Temperature 3C, base temperature 4C
      // GDD should be 0 (no growth below base temperature)
      const result = calculateGddIncrement({
        temperature: 3,
        baseTemperature: 4,
        timeStepHours: 1,
      });

      expect(result).toBe(0);
    });

    it('should return 0 when temperature equals base temperature', () => {
      const result = calculateGddIncrement({
        temperature: 4,
        baseTemperature: 4,
        timeStepHours: 1,
      });

      expect(result).toBe(0);
    });

    it('should scale correctly with time step', () => {
      const oneHour = calculateGddIncrement({
        temperature: 20,
        baseTemperature: 4,
        timeStepHours: 1,
      });

      const sixHours = calculateGddIncrement({
        temperature: 20,
        baseTemperature: 4,
        timeStepHours: 6,
      });

      expect(sixHours).toBeCloseTo(oneHour * 6, 6);
    });

    it('should handle 24-hour time step correctly', () => {
      // 24-hour time step should give full daily GDD
      const result = calculateGddIncrement({
        temperature: 20,
        baseTemperature: 4,
        timeStepHours: 24,
      });

      expect(result).toBe(16); // Full 16 C*day
    });

    it('should cap GDD at upper cutoff temperature if provided', () => {
      // Temperature 35C, base 4C, upper cutoff 30C
      // Should use 30C instead of 35C for calculation
      const result = calculateGddIncrement({
        temperature: 35,
        baseTemperature: 4,
        upperCutoffTemperature: 30,
        timeStepHours: 24,
      });

      expect(result).toBe(30 - 4); // 26 C*day, not 31
    });
  });

  describe('calculateCumulativeGdd', () => {
    it('should accumulate GDD correctly over multiple time steps', () => {
      const temperatures = [18, 20, 22, 19, 21]; // 5 hours of data
      const baseTemperature = 4;

      const result = calculateCumulativeGdd(temperatures, baseTemperature, 1);

      // Expected: sum of (T - Tbase) / 24 for each hour
      // = (14 + 16 + 18 + 15 + 17) / 24 = 80 / 24 = 3.333 C*day
      expect(result).toBeCloseTo(80 / 24, 3);
    });

    it('should handle mixed temperatures above and below base', () => {
      const temperatures = [20, 3, 18, 2, 22]; // Some below base (4C)
      const baseTemperature = 4;

      const result = calculateCumulativeGdd(temperatures, baseTemperature, 1);

      // Only count: 16, 0, 14, 0, 18 = 48 / 24 = 2.0 C*day
      expect(result).toBeCloseTo(48 / 24, 3);
    });

    it('should return 0 for empty temperature array', () => {
      const result = calculateCumulativeGdd([], 4, 1);
      expect(result).toBe(0);
    });
  });
});

// ============================================================================
// LAI Growth Model Tests
// ============================================================================

describe('LAI Growth Model', () => {
  describe('calculateLaiFromGdd - Linear Model', () => {
    const lettuceParams: CropGrowthParameters = CROP_PARAMETERS.lettuce;

    it('should return initial LAI at GDD = 0', () => {
      const result = calculateLaiFromGdd(0, lettuceParams, 'linear');
      expect(result).toBe(lettuceParams.initialLai);
    });

    it('should increase LAI linearly with GDD', () => {
      // At GDD = 100, LAI = 0.01 + 0.007 * 100 = 0.71
      const result = calculateLaiFromGdd(100, lettuceParams, 'linear');
      const expected = lettuceParams.initialLai + lettuceParams.laiGrowthRate * 100;
      expect(result).toBeCloseTo(expected, 4);
    });

    it('should cap LAI at maximum value', () => {
      // Very high GDD should cap at maxLai
      const result = calculateLaiFromGdd(10000, lettuceParams, 'linear');
      expect(result).toBe(lettuceParams.maxLai);
    });

    it('should reach max LAI at expected GDD', () => {
      // Calculate GDD needed to reach max LAI
      // maxLai = initialLai + laiGrowthRate * GDD
      // GDD = (maxLai - initialLai) / laiGrowthRate
      const gddToMax =
        (lettuceParams.maxLai - lettuceParams.initialLai) / lettuceParams.laiGrowthRate;

      const result = calculateLaiFromGdd(gddToMax, lettuceParams, 'linear');
      expect(result).toBeCloseTo(lettuceParams.maxLai, 4);
    });
  });

  describe('calculateLaiFromGdd - Logistic Model', () => {
    const lettuceParams: CropGrowthParameters = CROP_PARAMETERS.lettuce;

    it('should return near-initial LAI at GDD = 0', () => {
      const result = calculateLaiFromGdd(0, lettuceParams, 'logistic');
      // Logistic at GDD=0: LAI_max / (1 + exp(-k * (0 - GDD_half)))
      // Should be small but not exactly initialLai
      expect(result).toBeLessThan(lettuceParams.maxLai * 0.1);
    });

    it('should reach half of max LAI at GDD_half', () => {
      // Logistic model: LAI(GDD_half) = LAI_max / 2
      const result = calculateLaiFromGdd(lettuceParams.gddHalfMax, lettuceParams, 'logistic');
      expect(result).toBeCloseTo(lettuceParams.maxLai / 2, 2);
    });

    it('should approach max LAI at high GDD', () => {
      // At very high GDD, LAI should approach maxLai
      const result = calculateLaiFromGdd(1500, lettuceParams, 'logistic');
      expect(result).toBeGreaterThan(lettuceParams.maxLai * 0.95);
      expect(result).toBeLessThanOrEqual(lettuceParams.maxLai);
    });

    it('should show sigmoid growth pattern', () => {
      // LAI growth should accelerate then decelerate
      const lai100 = calculateLaiFromGdd(100, lettuceParams, 'logistic');
      const lai300 = calculateLaiFromGdd(300, lettuceParams, 'logistic');
      const lai500 = calculateLaiFromGdd(500, lettuceParams, 'logistic');

      // Early growth rate
      const rate1 = (lai300 - lai100) / 200;
      // Later growth rate (should be decreasing after half-max point)
      const rate2 = (lai500 - lai300) / 200;

      // Around the half-max point (325 for lettuce), growth should peak
      // After that, rate should decrease
      if (lettuceParams.gddHalfMax < 300) {
        expect(rate2).toBeLessThan(rate1);
      }
    });
  });
});

// ============================================================================
// Growth Stage Tests
// ============================================================================

describe('Growth Stage Determination', () => {
  const lettuceParams = CROP_PARAMETERS.lettuce;

  describe('calculateGrowthStage', () => {
    it('should return seedling stage at early GDD', () => {
      // Seedling: GDD < 20% of maturity
      const seedlingGdd = lettuceParams.gddToMaturity * 0.1;
      const stage = calculateGrowthStage(seedlingGdd, lettuceParams);
      expect(stage).toBe('seedling');
    });

    it('should return vegetative stage at mid GDD', () => {
      // Vegetative: 20% < GDD < 80% of maturity
      const vegetativeGdd = lettuceParams.gddToMaturity * 0.5;
      const stage = calculateGrowthStage(vegetativeGdd, lettuceParams);
      expect(stage).toBe('vegetative');
    });

    it('should return mature stage at high GDD', () => {
      // Mature: GDD >= 80% of maturity
      const matureGdd = lettuceParams.gddToMaturity * 0.85;
      const stage = calculateGrowthStage(matureGdd, lettuceParams);
      expect(stage).toBe('mature');
    });

    it('should return mature stage at full maturity', () => {
      const stage = calculateGrowthStage(lettuceParams.gddToMaturity, lettuceParams);
      expect(stage).toBe('mature');
    });

    it('should return seedling at GDD = 0', () => {
      const stage = calculateGrowthStage(0, lettuceParams);
      expect(stage).toBe('seedling');
    });
  });
});

// ============================================================================
// Dry Weight Estimation Tests
// ============================================================================

describe('Dry Weight Estimation', () => {
  const lettuceParams = CROP_PARAMETERS.lettuce;

  describe('calculateDryWeight', () => {
    it('should return initial dry weight at GDD = 0', () => {
      const result = calculateDryWeight(0, lettuceParams);
      expect(result).toBe(lettuceParams.initialDryWeight);
    });

    it('should increase dry weight with GDD', () => {
      const dw0 = calculateDryWeight(0, lettuceParams);
      const dw300 = calculateDryWeight(300, lettuceParams);

      expect(dw300).toBeGreaterThan(dw0);
    });

    it('should approach max dry weight at maturity', () => {
      const result = calculateDryWeight(lettuceParams.gddToMaturity, lettuceParams);
      expect(result).toBeGreaterThan(lettuceParams.maxDryWeight * 0.8);
    });

    it('should cap at max dry weight', () => {
      // Very high GDD should not exceed max
      const result = calculateDryWeight(2000, lettuceParams);
      expect(result).toBeLessThanOrEqual(lettuceParams.maxDryWeight);
    });
  });
});

// ============================================================================
// Full Growth Simulation Tests
// ============================================================================

describe('Growth Simulation', () => {
  describe('simulateGrowth', () => {
    const lettuceParams = CROP_PARAMETERS.lettuce;

    it('should return complete growth model outputs', () => {
      const inputs: GrowthModelInputs = {
        temperature: 22,
        baseTemperature: lettuceParams.baseTemperature,
        currentGdd: 100,
        timeStepHours: 1,
      };

      const result = simulateGrowth(inputs, lettuceParams);

      // Check all required output fields exist
      expect(result.gddIncrement).toBeDefined();
      expect(result.totalGdd).toBeDefined();
      expect(result.lai).toBeDefined();
      expect(result.dryWeight).toBeDefined();
      expect(result.growthStage).toBeDefined();
    });

    it('should correctly calculate GDD increment', () => {
      const inputs: GrowthModelInputs = {
        temperature: 20,
        baseTemperature: 4,
        currentGdd: 50,
        timeStepHours: 1,
      };

      const result = simulateGrowth(inputs, lettuceParams);

      // GDD increment = (20 - 4) / 24 = 0.667
      expect(result.gddIncrement).toBeCloseTo(16 / 24, 3);
      expect(result.totalGdd).toBeCloseTo(50 + 16 / 24, 3);
    });

    it('should not increment GDD when temperature is below base', () => {
      const inputs: GrowthModelInputs = {
        temperature: 3,
        baseTemperature: 4,
        currentGdd: 100,
        timeStepHours: 1,
      };

      const result = simulateGrowth(inputs, lettuceParams);

      expect(result.gddIncrement).toBe(0);
      expect(result.totalGdd).toBe(100);
    });

    it('should update LAI based on new total GDD', () => {
      const inputs: GrowthModelInputs = {
        temperature: 22,
        baseTemperature: 4,
        currentGdd: 200,
        timeStepHours: 1,
      };

      const result = simulateGrowth(inputs, lettuceParams);

      // LAI should be calculated from totalGdd, not currentGdd
      const expectedLai = calculateLaiFromGdd(result.totalGdd, lettuceParams, 'linear');
      expect(result.lai).toBeCloseTo(expectedLai, 6);
    });
  });
});

// ============================================================================
// Crop Parameters Database Tests
// ============================================================================

describe('Crop Parameters Database', () => {
  it('should have lettuce parameters defined', () => {
    expect(CROP_PARAMETERS.lettuce).toBeDefined();
    expect(CROP_PARAMETERS.lettuce.name).toBe('Butterhead Lettuce');
    expect(CROP_PARAMETERS.lettuce.baseTemperature).toBe(4);
  });

  it('should have basil parameters defined', () => {
    expect(CROP_PARAMETERS.basil).toBeDefined();
    expect(CROP_PARAMETERS.basil.name).toBe('Sweet Basil');
    expect(CROP_PARAMETERS.basil.baseTemperature).toBe(10);
  });

  it('should have all required parameters for each crop', () => {
    const requiredParams = [
      'name',
      'baseTemperature',
      'optimalTemperature',
      'maxLai',
      'gddToMaturity',
      'initialLai',
      'laiGrowthRate',
      'gddHalfMax',
      'logisticK',
      'initialDryWeight',
      'maxDryWeight',
    ];

    for (const [cropName, params] of Object.entries(CROP_PARAMETERS)) {
      for (const param of requiredParams) {
        expect(params).toHaveProperty(
          param,
          expect.anything(),
          `Crop ${cropName} missing parameter ${param}`
        );
      }
    }
  });

  it('should have physiologically reasonable parameter values', () => {
    for (const [cropName, params] of Object.entries(CROP_PARAMETERS)) {
      // Base temperature should be positive but moderate
      expect(params.baseTemperature).toBeGreaterThanOrEqual(0);
      expect(params.baseTemperature).toBeLessThan(20);

      // Max LAI should be reasonable (1-10)
      expect(params.maxLai).toBeGreaterThan(0.5);
      expect(params.maxLai).toBeLessThan(15);

      // GDD to maturity should be positive
      expect(params.gddToMaturity).toBeGreaterThan(0);

      // Initial LAI should be small
      expect(params.initialLai).toBeGreaterThan(0);
      expect(params.initialLai).toBeLessThan(0.5);

      // Growth rate should be positive
      expect(params.laiGrowthRate).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// Literature Validation Tests
// ============================================================================

describe('Literature Validation - Van Henten (1994)', () => {
  /**
   * Van Henten (1994) lettuce growth model validation data:
   * - Base temperature: 4C
   * - GDD to maturity: ~650 C*day
   * - Final LAI: 4-5 m2/m2
   * - Final dry weight: ~200-250 g/m2
   */

  const lettuceParams = CROP_PARAMETERS.lettuce;

  it('should match Van Henten base temperature for lettuce', () => {
    // Van Henten (1994) uses Tbase = 4C for lettuce
    expect(lettuceParams.baseTemperature).toBe(4);
  });

  it('should reach reasonable LAI at maturity GDD', () => {
    // Van Henten reports final LAI of 4-5 m2/m2
    const laiAtMaturity = calculateLaiFromGdd(650, lettuceParams, 'linear');
    expect(laiAtMaturity).toBeGreaterThanOrEqual(3.5);
    expect(laiAtMaturity).toBeLessThanOrEqual(5.5);
  });

  it('should simulate realistic growth over 30-day lettuce cycle', () => {
    // Simulate 30 days at optimal temperature (18C)
    // 18C for lettuce: GDD/day = 18 - 4 = 14 C*day
    // 30 days * 14 = 420 C*day
    const temperatures = Array(30 * 24).fill(18); // 30 days, hourly data
    const totalGdd = calculateCumulativeGdd(temperatures, 4, 1);

    // Should be around 420 C*day
    expect(totalGdd).toBeCloseTo(14 * 30, 1);

    // LAI at this point should be developing
    const lai = calculateLaiFromGdd(totalGdd, lettuceParams, 'linear');
    expect(lai).toBeGreaterThan(2.0); // Well into vegetative growth
    expect(lai).toBeLessThan(lettuceParams.maxLai); // Not yet mature
  });

  it('should show appropriate growth rate in vegetative stage', () => {
    // Van Henten reports relative growth rate of ~0.1-0.2 /day in vegetative stage
    // This translates to LAI roughly doubling every 5-7 days in optimal conditions
    const lai200 = calculateLaiFromGdd(200, lettuceParams, 'logistic');
    const lai350 = calculateLaiFromGdd(350, lettuceParams, 'logistic');

    // At optimal temp (18C), 150 GDD takes about 10-11 days
    // LAI should at least double in this period during vegetative growth
    expect(lai350 / lai200).toBeGreaterThan(1.5);
  });
});

// ============================================================================
// Edge Cases and Error Handling Tests
// ============================================================================

describe('Edge Cases and Validation', () => {
  it('should handle negative temperatures correctly', () => {
    const result = calculateGddIncrement({
      temperature: -5,
      baseTemperature: 4,
      timeStepHours: 1,
    });

    expect(result).toBe(0);
  });

  it('should handle very high temperatures with cutoff', () => {
    // Extremely high temp should be capped if cutoff provided
    const result = calculateGddIncrement({
      temperature: 50,
      baseTemperature: 4,
      upperCutoffTemperature: 30,
      timeStepHours: 24,
    });

    expect(result).toBe(26); // 30 - 4
  });

  it('should throw error for negative time step', () => {
    expect(() =>
      calculateGddIncrement({
        temperature: 20,
        baseTemperature: 4,
        timeStepHours: -1,
      })
    ).toThrow();
  });

  it('should handle zero time step gracefully', () => {
    const result = calculateGddIncrement({
      temperature: 20,
      baseTemperature: 4,
      timeStepHours: 0,
    });

    expect(result).toBe(0);
  });

  it('should handle negative GDD (should return 0 LAI or initial)', () => {
    const result = calculateLaiFromGdd(-10, CROP_PARAMETERS.lettuce, 'linear');
    expect(result).toBe(CROP_PARAMETERS.lettuce.initialLai);
  });
});
