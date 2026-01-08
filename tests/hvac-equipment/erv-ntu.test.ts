/**
 * ERV NTU-Effectiveness Model Tests
 *
 * @description
 * Test suite for Energy Recovery Ventilator (ERV) heat exchanger effectiveness
 * calculations using the NTU (Number of Transfer Units) method.
 *
 * @references
 * - Kays, W.M. & London, A.L. (1984). Compact Heat Exchangers, 3rd ed.
 * - ASHRAE Handbook - HVAC Systems and Equipment (2020), Chapter 26
 * - Zhang, L.Z. (2008). Total heat recovery: Heat and moisture recovery from ventilation air
 */

import { describe, it, expect } from 'vitest';
import {
  calculateEffectiveness,
  calculateCapacityRatio,
  calculateNtu,
  calculateErvPerformance,
  calculateSupplyOutletConditions,
  calculateExhaustOutletConditions,
} from '../../src/hvac-equipment/erv';
import type {
  FlowArrangement,
  ERVInputs,
  NtuEffectivenessData,
} from '../../src/hvac-equipment/erv/types';

// ============================================================================
// Reference Data from Kays & London (1984)
// ============================================================================

/**
 * Standard NTU-Effectiveness data from Kays & London (1984), Table 3-4
 * Note: These values are read from charts and have inherent precision limits (~2-5%)
 * The analytical formulas used in the code are exact, so we use 5% tolerance
 */
const NTU_EFFECTIVENESS_DATA: Record<FlowArrangement, NtuEffectivenessData[]> = {
  counterflow: [
    { ntu: 0.5, cr: 0.0, effectiveness: 0.393 },
    { ntu: 0.5, cr: 0.5, effectiveness: 0.362 }, // Formula: 0.362
    { ntu: 0.5, cr: 1.0, effectiveness: 0.333 },
    { ntu: 1.0, cr: 0.0, effectiveness: 0.632 },
    { ntu: 1.0, cr: 0.5, effectiveness: 0.565 }, // Formula: 0.565
    { ntu: 1.0, cr: 1.0, effectiveness: 0.500 },
    { ntu: 2.0, cr: 0.0, effectiveness: 0.865 },
    { ntu: 2.0, cr: 0.5, effectiveness: 0.775 }, // Formula: 0.775
    { ntu: 2.0, cr: 1.0, effectiveness: 0.667 },
    { ntu: 5.0, cr: 0.0, effectiveness: 0.993 },
    { ntu: 5.0, cr: 0.5, effectiveness: 0.957 }, // Formula: 0.957
    { ntu: 5.0, cr: 1.0, effectiveness: 0.833 },
  ],
  crossflow_unmixed: [
    { ntu: 0.5, cr: 0.0, effectiveness: 0.393 },
    { ntu: 0.5, cr: 1.0, effectiveness: 0.315 }, // Formula approximation
    { ntu: 1.0, cr: 0.0, effectiveness: 0.632 },
    { ntu: 1.0, cr: 1.0, effectiveness: 0.469 }, // Formula approximation
    { ntu: 2.0, cr: 0.0, effectiveness: 0.865 },
    { ntu: 2.0, cr: 1.0, effectiveness: 0.615 }, // Formula approximation
  ],
  crossflow_mixed: [
    // Mixed crossflow data (one side mixed, one unmixed)
    { ntu: 1.0, cr: 0.5, effectiveness: 0.568 },
    { ntu: 2.0, cr: 0.5, effectiveness: 0.767 },
  ],
  parallel: [
    { ntu: 0.5, cr: 0.0, effectiveness: 0.393 },
    { ntu: 0.5, cr: 1.0, effectiveness: 0.316 }, // Formula: (1-exp(-1))/2 = 0.316
    { ntu: 1.0, cr: 0.0, effectiveness: 0.632 },
    { ntu: 1.0, cr: 1.0, effectiveness: 0.432 }, // Formula: (1-exp(-2))/2 = 0.432
    { ntu: 2.0, cr: 0.0, effectiveness: 0.865 },
    { ntu: 2.0, cr: 1.0, effectiveness: 0.491 }, // Formula: (1-exp(-4))/2 = 0.491
    { ntu: 5.0, cr: 0.0, effectiveness: 0.993 },
    { ntu: 5.0, cr: 1.0, effectiveness: 0.500 }, // Asymptotic limit
  ],
};

// ============================================================================
// NTU Calculation Tests
// ============================================================================

describe('NTU Calculation', () => {
  describe('calculateNtu', () => {
    it('should calculate NTU correctly from UA and C_min', () => {
      // NTU = UA / C_min
      // UA = 500 W/K, C_min = 200 W/K -> NTU = 2.5
      const result = calculateNtu(500, 200);
      expect(result).toBe(2.5);
    });

    it('should handle small C_min values', () => {
      // UA = 100 W/K, C_min = 50 W/K -> NTU = 2.0
      const result = calculateNtu(100, 50);
      expect(result).toBe(2.0);
    });

    it('should return high NTU for high UA/C_min ratio', () => {
      // UA = 1000 W/K, C_min = 100 W/K -> NTU = 10
      const result = calculateNtu(1000, 100);
      expect(result).toBe(10);
    });

    it('should throw error for zero or negative C_min', () => {
      expect(() => calculateNtu(500, 0)).toThrow();
      expect(() => calculateNtu(500, -100)).toThrow();
    });

    it('should throw error for negative UA', () => {
      expect(() => calculateNtu(-500, 200)).toThrow();
    });
  });
});

// ============================================================================
// Capacity Ratio Tests
// ============================================================================

describe('Capacity Ratio Calculation', () => {
  describe('calculateCapacityRatio', () => {
    it('should calculate C_r correctly', () => {
      // C_r = C_min / C_max
      // C_min = 200, C_max = 400 -> C_r = 0.5
      const result = calculateCapacityRatio(200, 400);
      expect(result).toBe(0.5);
    });

    it('should return 1.0 for balanced flow (C_min = C_max)', () => {
      const result = calculateCapacityRatio(300, 300);
      expect(result).toBe(1.0);
    });

    it('should clamp C_r to range [0, 1]', () => {
      // Even if inputs are wrong, result should be <= 1
      const result = calculateCapacityRatio(500, 400); // Wrong order
      expect(result).toBeLessThanOrEqual(1.0);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('should throw error for zero or negative values', () => {
      expect(() => calculateCapacityRatio(0, 400)).toThrow();
      expect(() => calculateCapacityRatio(200, 0)).toThrow();
      expect(() => calculateCapacityRatio(-200, 400)).toThrow();
    });
  });
});

// ============================================================================
// Effectiveness Calculation Tests - Analytical Formula Validation
// ============================================================================

describe('Effectiveness Calculation - Formula Validation', () => {
  describe('Counterflow Heat Exchanger', () => {
    const arrangement: FlowArrangement = 'counterflow';

    it.each(NTU_EFFECTIVENESS_DATA.counterflow)(
      'NTU=$ntu, C_r=$cr should give effectiveness ~$effectiveness',
      ({ ntu, cr, effectiveness }) => {
        const result = calculateEffectiveness(ntu, cr, arrangement);
        // Allow 5% tolerance for chart-read reference data
        expect(result).toBeCloseTo(effectiveness, 1);
      }
    );

    it('should approach 1.0 for C_r=0 as NTU increases', () => {
      // For C_r = 0 (infinite C_max), effectiveness = 1 - exp(-NTU)
      // As NTU -> infinity, effectiveness -> 1.0
      const effectiveness10 = calculateEffectiveness(10, 0, arrangement);
      expect(effectiveness10).toBeGreaterThan(0.999);
    });

    it('should give epsilon = NTU/(1+NTU) for C_r=1', () => {
      // For counterflow with C_r = 1: epsilon = NTU / (1 + NTU)
      const ntu = 3.0;
      const expectedEffectiveness = ntu / (1 + ntu); // 0.75
      const result = calculateEffectiveness(ntu, 1.0, arrangement);
      expect(result).toBeCloseTo(expectedEffectiveness, 4);
    });

    it('should give exact epsilon = 1 - exp(-NTU) for C_r=0', () => {
      const ntu = 2.0;
      const expected = 1 - Math.exp(-ntu);
      const result = calculateEffectiveness(ntu, 0, arrangement);
      expect(result).toBeCloseTo(expected, 6);
    });
  });

  describe('Crossflow Heat Exchanger (Both Fluids Unmixed)', () => {
    const arrangement: FlowArrangement = 'crossflow_unmixed';

    it.each(NTU_EFFECTIVENESS_DATA.crossflow_unmixed)(
      'NTU=$ntu, C_r=$cr should give effectiveness ~$effectiveness',
      ({ ntu, cr, effectiveness }) => {
        const result = calculateEffectiveness(ntu, cr, arrangement);
        // Allow 5% tolerance for approximation formula
        expect(result).toBeCloseTo(effectiveness, 1);
      }
    );

    it('should give same result as counterflow for C_r=0', () => {
      // For C_r = 0, all flow arrangements give same effectiveness
      const ntu = 1.5;
      const counterflow = calculateEffectiveness(ntu, 0, 'counterflow');
      const crossflow = calculateEffectiveness(ntu, 0, 'crossflow_unmixed');
      expect(crossflow).toBeCloseTo(counterflow, 6);
    });

    it('should be less than counterflow for C_r=1', () => {
      // Crossflow with C_r=1 is less effective than counterflow
      const ntu = 2.0;
      const counterflow = calculateEffectiveness(ntu, 1.0, 'counterflow');
      const crossflow = calculateEffectiveness(ntu, 1.0, 'crossflow_unmixed');
      expect(crossflow).toBeLessThan(counterflow);
    });
  });

  describe('Parallel Flow Heat Exchanger', () => {
    const arrangement: FlowArrangement = 'parallel';

    it.each(NTU_EFFECTIVENESS_DATA.parallel)(
      'NTU=$ntu, C_r=$cr should give effectiveness ~$effectiveness',
      ({ ntu, cr, effectiveness }) => {
        const result = calculateEffectiveness(ntu, cr, arrangement);
        // Allow 5% tolerance
        expect(result).toBeCloseTo(effectiveness, 1);
      }
    );

    it('should have maximum effectiveness of 0.5 for C_r=1 as NTU->inf', () => {
      // For parallel flow with C_r = 1: epsilon_max = 0.5
      const result = calculateEffectiveness(100, 1.0, arrangement);
      expect(result).toBeCloseTo(0.5, 2);
    });

    it('should always be less than or equal to counterflow', () => {
      const ntu = 2.0;
      const cr = 0.5;
      const parallel = calculateEffectiveness(ntu, cr, arrangement);
      const counterflow = calculateEffectiveness(ntu, cr, 'counterflow');
      expect(parallel).toBeLessThanOrEqual(counterflow);
    });

    it('should give exact formula for C_r=1', () => {
      // epsilon = (1 - exp(-2*NTU)) / 2
      const ntu = 1.5;
      const expected = (1 - Math.exp(-2 * ntu)) / 2;
      const result = calculateEffectiveness(ntu, 1.0, arrangement);
      expect(result).toBeCloseTo(expected, 6);
    });
  });
});

// ============================================================================
// Limiting Condition Tests
// ============================================================================

describe('Effectiveness - Limiting Conditions', () => {
  describe('NTU = 0 (No heat exchanger)', () => {
    it('should return 0 effectiveness for any flow arrangement', () => {
      const arrangements: FlowArrangement[] = ['counterflow', 'crossflow_unmixed', 'parallel'];
      for (const arr of arrangements) {
        const result = calculateEffectiveness(0, 0.5, arr);
        expect(result).toBe(0);
      }
    });
  });

  describe('NTU -> infinity', () => {
    it('should approach 1.0 for counterflow with C_r < 1', () => {
      const result = calculateEffectiveness(50, 0.5, 'counterflow');
      expect(result).toBeGreaterThan(0.99);
    });

    it('should approach 1/(1+C_r) for parallel flow', () => {
      // As NTU -> infinity, parallel flow: epsilon -> 1/(1+C_r)
      const cr = 0.5;
      const expected = 1 / (1 + cr); // 0.667
      const result = calculateEffectiveness(100, cr, 'parallel');
      expect(result).toBeCloseTo(expected, 2);
    });
  });

  describe('C_r = 0 (Evaporation/Condensation)', () => {
    it('should give epsilon = 1 - exp(-NTU) for all arrangements', () => {
      const ntu = 1.5;
      const expected = 1 - Math.exp(-ntu); // 0.777

      const arrangements: FlowArrangement[] = ['counterflow', 'crossflow_unmixed', 'parallel'];
      for (const arr of arrangements) {
        const result = calculateEffectiveness(ntu, 0, arr);
        expect(result).toBeCloseTo(expected, 4);
      }
    });
  });

  describe('C_r = 1 (Balanced Flow)', () => {
    it('should give epsilon = NTU/(1+NTU) for counterflow', () => {
      const ntu = 2.0;
      const expected = ntu / (1 + ntu); // 0.667
      const result = calculateEffectiveness(ntu, 1.0, 'counterflow');
      expect(result).toBeCloseTo(expected, 4);
    });

    it('should give epsilon = (1-exp(-2*NTU))/2 for parallel flow', () => {
      const ntu = 2.0;
      const expected = (1 - Math.exp(-2 * ntu)) / 2; // 0.491
      const result = calculateEffectiveness(ntu, 1.0, 'parallel');
      expect(result).toBeCloseTo(expected, 4);
    });
  });
});

// ============================================================================
// Energy Balance Tests
// ============================================================================

describe('Energy Conservation', () => {
  describe('Heat transfer balance', () => {
    it('should have similar temperature changes for balanced flow', () => {
      const inputs: ERVInputs = {
        supplyAirFlow: 0.5, // m3/s
        exhaustAirFlow: 0.5,
        supplyTemperature: 35, // Hot outdoor air (summer)
        exhaustTemperature: 24, // Cool indoor air
        supplyHumidity: 0.020, // kg/kg
        exhaustHumidity: 0.010,
        humidityUnit: 'absolute',
        ntuSensible: 2.0,
        flowArrangement: 'counterflow',
      };

      const result = calculateErvPerformance(inputs);

      // Heat lost by supply air = Heat gained by exhaust air
      const supplyTempDrop = inputs.supplyTemperature - result.supplyOutletTemperature;
      const exhaustTempRise = result.exhaustOutletTemperature - inputs.exhaustTemperature;

      // With similar flow rates, temperature changes should be similar
      // Account for air density differences at different temperatures
      expect(supplyTempDrop).toBeGreaterThan(0);
      expect(exhaustTempRise).toBeGreaterThan(0);
      // Within 10% due to density differences
      expect(Math.abs(supplyTempDrop - exhaustTempRise) / supplyTempDrop).toBeLessThan(0.1);
    });

    it('should balance enthalpy for total heat recovery', () => {
      const inputs: ERVInputs = {
        supplyAirFlow: 0.3,
        exhaustAirFlow: 0.3,
        supplyTemperature: 32,
        exhaustTemperature: 22,
        supplyHumidity: 0.018,
        exhaustHumidity: 0.008,
        humidityUnit: 'absolute',
        ntuSensible: 2.5,
        ntuLatent: 2.0,
        flowArrangement: 'counterflow',
      };

      const result = calculateErvPerformance(inputs);

      // Total heat recovery should equal sum of sensible and latent
      expect(result.totalHeatRecovery).toBeCloseTo(
        result.sensibleHeatRecovery + result.latentHeatRecovery,
        1
      );
    });
  });
});

// ============================================================================
// ERV Performance Calculation Tests
// ============================================================================

describe('ERV Performance Calculation', () => {
  describe('calculateErvPerformance - Summer Cooling', () => {
    it('should pre-cool hot outdoor air using cool exhaust', () => {
      const inputs: ERVInputs = {
        supplyAirFlow: 0.5, // 1800 m3/h
        exhaustAirFlow: 0.5,
        supplyTemperature: 35, // Hot outdoor
        exhaustTemperature: 24, // Cool indoor
        supplyHumidity: 0.020,
        exhaustHumidity: 0.010,
        humidityUnit: 'absolute',
        ntuSensible: 2.0,
        flowArrangement: 'counterflow',
      };

      const result = calculateErvPerformance(inputs);

      // Supply outlet should be cooler than inlet
      expect(result.supplyOutletTemperature).toBeLessThan(inputs.supplyTemperature);
      expect(result.supplyOutletTemperature).toBeGreaterThan(inputs.exhaustTemperature);

      // Sensible heat recovery should be positive (cooling effect)
      expect(result.sensibleHeatRecovery).toBeGreaterThan(0);

      // Effectiveness should be within valid range
      expect(result.sensibleEffectiveness).toBeGreaterThan(0);
      expect(result.sensibleEffectiveness).toBeLessThan(1);
    });

    it('should dehumidify humid outdoor air with latent recovery', () => {
      const inputs: ERVInputs = {
        supplyAirFlow: 0.4,
        exhaustAirFlow: 0.4,
        supplyTemperature: 32,
        exhaustTemperature: 24,
        supplyHumidity: 0.022, // High humidity outdoor
        exhaustHumidity: 0.009, // Low humidity indoor
        humidityUnit: 'absolute',
        ntuSensible: 2.0,
        ntuLatent: 1.5,
        flowArrangement: 'crossflow_unmixed',
      };

      const result = calculateErvPerformance(inputs);

      // Supply outlet humidity should be lower than inlet
      expect(result.supplyOutletHumidity).toBeLessThan(inputs.supplyHumidity);
      expect(result.supplyOutletHumidity).toBeGreaterThan(inputs.exhaustHumidity);

      // Latent heat recovery should be positive
      expect(result.latentHeatRecovery).toBeGreaterThan(0);
    });
  });

  describe('calculateErvPerformance - Winter Heating', () => {
    it('should pre-heat cold outdoor air using warm exhaust', () => {
      const inputs: ERVInputs = {
        supplyAirFlow: 0.4,
        exhaustAirFlow: 0.4,
        supplyTemperature: -5, // Cold outdoor
        exhaustTemperature: 22, // Warm indoor
        supplyHumidity: 0.002, // Dry outdoor
        exhaustHumidity: 0.008, // More humid indoor
        humidityUnit: 'absolute',
        ntuSensible: 2.5,
        flowArrangement: 'counterflow',
      };

      const result = calculateErvPerformance(inputs);

      // Supply outlet should be warmer than inlet
      expect(result.supplyOutletTemperature).toBeGreaterThan(inputs.supplyTemperature);
      expect(result.supplyOutletTemperature).toBeLessThan(inputs.exhaustTemperature);

      // Sensible heat recovery should be positive (heating effect)
      expect(result.sensibleHeatRecovery).toBeGreaterThan(0);
    });

    it('should humidify dry outdoor air with latent recovery', () => {
      const inputs: ERVInputs = {
        supplyAirFlow: 0.3,
        exhaustAirFlow: 0.3,
        supplyTemperature: 0,
        exhaustTemperature: 20,
        supplyHumidity: 0.003,
        exhaustHumidity: 0.010,
        humidityUnit: 'absolute',
        ntuSensible: 2.0,
        ntuLatent: 1.8,
        flowArrangement: 'counterflow',
      };

      const result = calculateErvPerformance(inputs);

      // Supply outlet humidity should be higher than inlet
      expect(result.supplyOutletHumidity).toBeGreaterThan(inputs.supplyHumidity);
      expect(result.supplyOutletHumidity).toBeLessThan(inputs.exhaustHumidity);

      // Latent heat recovery should be positive
      expect(result.latentHeatRecovery).toBeGreaterThan(0);
    });
  });

  describe('Unequal Airflow Rates', () => {
    it('should handle different supply and exhaust flow rates', () => {
      const inputs: ERVInputs = {
        supplyAirFlow: 0.5, // More supply
        exhaustAirFlow: 0.4, // Less exhaust
        supplyTemperature: 35,
        exhaustTemperature: 24,
        supplyHumidity: 0.018,
        exhaustHumidity: 0.010,
        humidityUnit: 'absolute',
        ntuSensible: 2.0,
        flowArrangement: 'counterflow',
      };

      const result = calculateErvPerformance(inputs);

      // Should still produce valid results
      expect(result.sensibleEffectiveness).toBeGreaterThan(0);
      expect(result.sensibleEffectiveness).toBeLessThanOrEqual(1);
      expect(result.capacityRatio).toBeGreaterThan(0);
      expect(result.capacityRatio).toBeLessThanOrEqual(1);
    });

    it('should calculate capacity ratio correctly for unequal flows', () => {
      const inputs: ERVInputs = {
        supplyAirFlow: 0.6,
        exhaustAirFlow: 0.3, // Half the supply
        supplyTemperature: 30,
        exhaustTemperature: 22,
        supplyHumidity: 0.015,
        exhaustHumidity: 0.010,
        humidityUnit: 'absolute',
        ntuSensible: 1.5,
        flowArrangement: 'crossflow_unmixed',
      };

      const result = calculateErvPerformance(inputs);

      // C_r should be close to 0.5 (accounting for density differences)
      // At 30C vs 22C, densities differ by ~3%
      expect(result.capacityRatio).toBeGreaterThan(0.45);
      expect(result.capacityRatio).toBeLessThan(0.55);
    });
  });
});

// ============================================================================
// Outlet Condition Tests
// ============================================================================

describe('Outlet Conditions Calculation', () => {
  describe('Supply Side Outlet', () => {
    it('should calculate supply outlet temperature correctly', () => {
      const supplyOutlet = calculateSupplyOutletConditions({
        inletTemperature: 35,
        inletHumidity: 0.020,
        exhaustTemperature: 24,
        exhaustHumidity: 0.010,
        sensibleEffectiveness: 0.7,
        latentEffectiveness: 0.6,
      });

      // T_out = T_in - effectiveness * (T_in - T_exhaust)
      // T_out = 35 - 0.7 * (35 - 24) = 35 - 7.7 = 27.3
      expect(supplyOutlet.temperature).toBeCloseTo(27.3, 1);
    });

    it('should calculate supply outlet humidity correctly', () => {
      const supplyOutlet = calculateSupplyOutletConditions({
        inletTemperature: 35,
        inletHumidity: 0.020,
        exhaustTemperature: 24,
        exhaustHumidity: 0.010,
        sensibleEffectiveness: 0.7,
        latentEffectiveness: 0.6,
      });

      // W_out = W_in - effectiveness * (W_in - W_exhaust)
      // W_out = 0.020 - 0.6 * (0.020 - 0.010) = 0.020 - 0.006 = 0.014
      expect(supplyOutlet.humidity).toBeCloseTo(0.014, 4);
    });
  });

  describe('Exhaust Side Outlet', () => {
    it('should calculate exhaust outlet temperature correctly', () => {
      const exhaustOutlet = calculateExhaustOutletConditions({
        inletTemperature: 24,
        inletHumidity: 0.010,
        supplyTemperature: 35,
        supplyHumidity: 0.020,
        sensibleEffectiveness: 0.7,
        latentEffectiveness: 0.6,
        capacityRatio: 1.0, // Balanced flow
      });

      // For balanced flow: exhaust temp rise = supply temp drop
      // T_exhaust_out = 24 + 0.7 * (35 - 24) = 31.7
      expect(exhaustOutlet.temperature).toBeCloseTo(31.7, 1);
    });
  });
});

// ============================================================================
// COP and Fan Power Tests
// ============================================================================

describe('COP and Fan Power', () => {
  it('should calculate COP when fan power is provided', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.5,
      exhaustAirFlow: 0.5,
      supplyTemperature: 35,
      exhaustTemperature: 24,
      supplyHumidity: 0.020,
      exhaustHumidity: 0.010,
      humidityUnit: 'absolute',
      ntuSensible: 2.5,
      ntuLatent: 2.0,
      flowArrangement: 'counterflow',
      fanPower: 200, // W
    };

    const result = calculateErvPerformance(inputs);

    // COP = Total heat recovery / Fan power
    expect(result.cop).toBeDefined();
    expect(result.cop).toBeGreaterThan(0);
    expect(result.fanPower).toBe(200);
  });

  it('should have positive COP for valid ERV operation', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.4,
      exhaustAirFlow: 0.4,
      supplyTemperature: 32,
      exhaustTemperature: 22,
      supplyHumidity: 0.018,
      exhaustHumidity: 0.008,
      humidityUnit: 'absolute',
      ntuSensible: 2.5,
      ntuLatent: 2.0,
      flowArrangement: 'counterflow',
      fanPower: 150,
    };

    const result = calculateErvPerformance(inputs);

    // ERV COP should be positive and reasonable
    // High COP (>30) is possible with large temperature/humidity differences
    expect(result.cop).toBeGreaterThan(0);
    expect(result.totalHeatRecovery).toBeGreaterThan(0);
  });

  it('should not calculate COP when fan power is not provided', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.4,
      exhaustAirFlow: 0.4,
      supplyTemperature: 30,
      exhaustTemperature: 22,
      supplyHumidity: 0.015,
      exhaustHumidity: 0.010,
      humidityUnit: 'absolute',
      ntuSensible: 2.0,
      flowArrangement: 'counterflow',
    };

    const result = calculateErvPerformance(inputs);

    expect(result.cop).toBeUndefined();
    expect(result.fanPower).toBeUndefined();
  });
});

// ============================================================================
// Relative Humidity Input Tests
// ============================================================================

describe('Relative Humidity Input Handling', () => {
  it('should convert relative humidity to absolute humidity', () => {
    // Test with known RH values and verify humidity calculations work
    const inputsRelative: ERVInputs = {
      supplyAirFlow: 0.3,
      exhaustAirFlow: 0.3,
      supplyTemperature: 30,
      exhaustTemperature: 22,
      supplyHumidity: 60, // 60% RH
      exhaustHumidity: 60, // 60% RH
      humidityUnit: 'relative',
      ntuSensible: 2.0,
      ntuLatent: 1.5,
      flowArrangement: 'counterflow',
    };

    const result = calculateErvPerformance(inputsRelative);

    // Output humidity should be in kg/kg (absolute)
    // At 30C, 60% RH: W ~ 0.016 kg/kg
    // At 22C, 60% RH: W ~ 0.010 kg/kg
    expect(result.supplyOutletHumidity).toBeGreaterThan(0.008);
    expect(result.supplyOutletHumidity).toBeLessThan(0.020);
    expect(result.latentHeatRecovery).toBeGreaterThan(0);
  });

  it('should produce valid results for relative humidity inputs', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.3,
      exhaustAirFlow: 0.3,
      supplyTemperature: 35,
      exhaustTemperature: 24,
      supplyHumidity: 70, // 70% RH - high humidity
      exhaustHumidity: 50, // 50% RH
      humidityUnit: 'relative',
      ntuSensible: 2.0,
      ntuLatent: 1.5,
      flowArrangement: 'counterflow',
    };

    const result = calculateErvPerformance(inputs);

    // Should produce valid effectiveness values
    expect(result.sensibleEffectiveness).toBeGreaterThan(0);
    expect(result.sensibleEffectiveness).toBeLessThan(1);
    expect(result.latentEffectiveness).toBeGreaterThan(0);
    expect(result.latentEffectiveness).toBeLessThan(1);
  });
});

// ============================================================================
// Validation and Edge Cases
// ============================================================================

describe('Input Validation', () => {
  it('should throw error for negative airflow', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: -0.5,
      exhaustAirFlow: 0.5,
      supplyTemperature: 30,
      exhaustTemperature: 22,
      supplyHumidity: 0.015,
      exhaustHumidity: 0.010,
      humidityUnit: 'absolute',
      ntuSensible: 2.0,
      flowArrangement: 'counterflow',
    };

    expect(() => calculateErvPerformance(inputs)).toThrow();
  });

  it('should throw error for invalid humidity values', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.5,
      exhaustAirFlow: 0.5,
      supplyTemperature: 30,
      exhaustTemperature: 22,
      supplyHumidity: -0.01, // Invalid negative
      exhaustHumidity: 0.010,
      humidityUnit: 'absolute',
      ntuSensible: 2.0,
      flowArrangement: 'counterflow',
    };

    expect(() => calculateErvPerformance(inputs)).toThrow();
  });

  it('should throw error for relative humidity > 100%', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.5,
      exhaustAirFlow: 0.5,
      supplyTemperature: 30,
      exhaustTemperature: 22,
      supplyHumidity: 120, // Invalid > 100%
      exhaustHumidity: 60,
      humidityUnit: 'relative',
      ntuSensible: 2.0,
      flowArrangement: 'counterflow',
    };

    expect(() => calculateErvPerformance(inputs)).toThrow();
  });

  it('should handle zero NTU (no heat transfer)', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.5,
      exhaustAirFlow: 0.5,
      supplyTemperature: 35,
      exhaustTemperature: 24,
      supplyHumidity: 0.020,
      exhaustHumidity: 0.010,
      humidityUnit: 'absolute',
      ntuSensible: 0, // No heat transfer
      flowArrangement: 'counterflow',
    };

    const result = calculateErvPerformance(inputs);

    // With NTU = 0, effectiveness = 0, so no temperature change
    expect(result.sensibleEffectiveness).toBe(0);
    expect(result.sensibleHeatRecovery).toBe(0);
    expect(result.supplyOutletTemperature).toBe(inputs.supplyTemperature);
  });

  it('should handle equal supply and exhaust temperatures', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.5,
      exhaustAirFlow: 0.5,
      supplyTemperature: 25,
      exhaustTemperature: 25, // Same as supply
      supplyHumidity: 0.020,
      exhaustHumidity: 0.010,
      humidityUnit: 'absolute',
      ntuSensible: 2.0,
      ntuLatent: 1.5,
      flowArrangement: 'counterflow',
    };

    const result = calculateErvPerformance(inputs);

    // No temperature difference -> no sensible heat transfer
    expect(result.sensibleHeatRecovery).toBe(0);
    // But latent heat recovery should still occur
    expect(result.latentHeatRecovery).toBeGreaterThan(0);
  });
});

// ============================================================================
// Manufacturer Specification Validation
// ============================================================================

describe('Manufacturer Specification Validation', () => {
  /**
   * Test against typical ERV manufacturer specifications
   * Reference: Typical residential/commercial ERV data
   */

  it('should match typical residential ERV performance', () => {
    // Typical 200 CFM (340 m3/h) residential ERV
    // Sensible efficiency: 75-85%
    // Latent efficiency: 50-70%
    const inputs: ERVInputs = {
      supplyAirFlow: 0.0944, // 340 m3/h = 0.0944 m3/s
      exhaustAirFlow: 0.0944,
      supplyTemperature: 35, // Summer conditions
      exhaustTemperature: 24,
      supplyHumidity: 0.018,
      exhaustHumidity: 0.010,
      humidityUnit: 'absolute',
      ntuSensible: 3.5, // Typical for 80% sensible effectiveness
      ntuLatent: 2.0, // Typical for 60% latent effectiveness
      flowArrangement: 'counterflow',
      fanPower: 100, // Typical fan power
    };

    const result = calculateErvPerformance(inputs);

    // Validate against manufacturer ranges
    expect(result.sensibleEffectiveness).toBeGreaterThan(0.7);
    expect(result.sensibleEffectiveness).toBeLessThan(0.9);
    expect(result.latentEffectiveness).toBeGreaterThan(0.5);
    expect(result.latentEffectiveness).toBeLessThan(0.75);
  });

  it('should calculate realistic heat recovery rates', () => {
    // Large commercial ERV: 1000 m3/h
    const inputs: ERVInputs = {
      supplyAirFlow: 0.278, // 1000 m3/h
      exhaustAirFlow: 0.278,
      supplyTemperature: 32,
      exhaustTemperature: 24,
      supplyHumidity: 0.018,
      exhaustHumidity: 0.009,
      humidityUnit: 'absolute',
      ntuSensible: 3.0,
      ntuLatent: 2.0,
      flowArrangement: 'crossflow_unmixed',
    };

    const result = calculateErvPerformance(inputs);

    // Sensible heat recovery for 8C temperature difference, ~0.278 m3/s
    // Q = rho * V * cp * dT * effectiveness
    // Q ~ 1.2 * 0.278 * 1000 * 8 * 0.75 ~ 2000 W
    expect(result.sensibleHeatRecovery).toBeGreaterThan(1500);
    expect(result.sensibleHeatRecovery).toBeLessThan(3000);
  });
});

// ============================================================================
// Integration with Psychrometrics Module
// ============================================================================

describe('Psychrometrics Integration', () => {
  it('should use psychrometrics for humidity ratio calculations', () => {
    // Test that RH -> absolute humidity conversion uses proper psychrometrics
    const inputs: ERVInputs = {
      supplyAirFlow: 0.3,
      exhaustAirFlow: 0.3,
      supplyTemperature: 30,
      exhaustTemperature: 20,
      supplyHumidity: 70, // 70% RH
      exhaustHumidity: 50, // 50% RH
      humidityUnit: 'relative',
      ntuSensible: 2.0,
      ntuLatent: 1.5,
      flowArrangement: 'counterflow',
    };

    const result = calculateErvPerformance(inputs);

    // Output humidity should be in kg/kg (absolute)
    expect(result.supplyOutletHumidity).toBeGreaterThan(0.005);
    expect(result.supplyOutletHumidity).toBeLessThan(0.030);
    expect(result.exhaustOutletHumidity).toBeGreaterThan(0.005);
    expect(result.exhaustOutletHumidity).toBeLessThan(0.030);
  });

  it('should calculate total enthalpy change correctly', () => {
    const inputs: ERVInputs = {
      supplyAirFlow: 0.4,
      exhaustAirFlow: 0.4,
      supplyTemperature: 32,
      exhaustTemperature: 24,
      supplyHumidity: 0.018,
      exhaustHumidity: 0.010,
      humidityUnit: 'absolute',
      ntuSensible: 2.5,
      ntuLatent: 2.0,
      flowArrangement: 'counterflow',
    };

    const result = calculateErvPerformance(inputs);

    // Total effectiveness should be weighted combination
    expect(result.totalEffectiveness).toBeGreaterThan(0);
    expect(result.totalEffectiveness).toBeLessThan(1);

    // Total heat should equal sensible + latent
    const expectedTotal = result.sensibleHeatRecovery + result.latentHeatRecovery;
    expect(result.totalHeatRecovery).toBeCloseTo(expectedTotal, 1);
  });
});
