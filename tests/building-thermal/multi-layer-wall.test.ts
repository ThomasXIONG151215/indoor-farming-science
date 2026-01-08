/**
 * Multi-Layer Wall Heat Transfer Model Tests
 *
 * @description
 * Test suite for steady-state heat conduction through multi-layer walls.
 * Validates calculations against ISO 6946:2017 standard examples.
 *
 * @references
 * - ISO 6946:2017 - Building components and building elements - Thermal resistance and thermal transmittance
 * - ASHRAE Handbook - Fundamentals (2021), Chapter 27
 * - Incropera, F.P. & DeWitt, D.P. - Fundamentals of Heat and Mass Transfer
 */

import { describe, it, expect } from 'vitest';
import {
  calculateMultiLayerWall,
  calculateLayerResistance,
  calculateTemperatureProfile,
  MATERIAL_THERMAL_PROPERTIES,
} from '../../src/building-thermal';
import type {
  MultiLayerWallInputs,
  MultiLayerWallOutputs,
  WallLayer,
} from '../../src/building-thermal';

// ============================================================================
// Test Data from ISO 6946:2017
// ============================================================================

/**
 * ISO 6946:2017 Example Wall Assembly
 * Reference: ISO 6946:2017 Annex B
 */
const ISO_EXAMPLE_WALL: WallLayer[] = [
  {
    name: 'External brick',
    thickness: 0.102,
    thermalConductivity: 0.77,
  },
  {
    name: 'Air gap (unventilated)',
    thickness: 0.050,
    thermalConductivity: 0.18, // Equivalent conductivity for R=0.18
  },
  {
    name: 'EPS insulation',
    thickness: 0.050,
    thermalConductivity: 0.04,
  },
  {
    name: 'Concrete block',
    thickness: 0.100,
    thermalConductivity: 0.51,
  },
  {
    name: 'Plaster',
    thickness: 0.013,
    thermalConductivity: 0.57,
  },
];

/**
 * Expected values from ISO 6946:2017 calculation
 * Total R = R_si + R_layers + R_se
 * R_si = 0.13 (m2.K)/W (horizontal heat flow, still air)
 * R_se = 0.04 (m2.K)/W (horizontal heat flow, wind)
 *
 * Layer resistances:
 * - Brick: 0.102/0.77 = 0.132
 * - Air gap: 0.050/0.18 = 0.278 (effective)
 * - EPS: 0.050/0.04 = 1.250
 * - Concrete: 0.100/0.51 = 0.196
 * - Plaster: 0.013/0.57 = 0.023
 *
 * Sum = 0.132 + 0.278 + 1.250 + 0.196 + 0.023 = 1.879
 * Total R = 0.13 + 1.879 + 0.04 = 2.049
 * U = 1/2.049 = 0.488 W/(m2.K)
 */
const ISO_EXPECTED = {
  totalResistance: 2.049,
  uValue: 0.488,
  tolerance: 0.05, // 5% tolerance for validation
};

// ============================================================================
// Test Suite: ISO 6946 Standard Validation
// ============================================================================

describe('Multi-Layer Wall: ISO 6946 Validation', () => {
  it('should calculate total thermal resistance correctly per ISO 6946', () => {
    const inputs: MultiLayerWallInputs = {
      layers: ISO_EXAMPLE_WALL,
      insideTemperature: 20,
      outsideTemperature: 0,
      insideConvection: 7.69, // 1/0.13 = 7.69 W/(m2.K) per ISO 6946
      outsideConvection: 25, // 1/0.04 = 25 W/(m2.K) per ISO 6946
    };

    const result = calculateMultiLayerWall(inputs);

    // Validate total resistance within tolerance
    const relativeError = Math.abs(result.totalResistance - ISO_EXPECTED.totalResistance) / ISO_EXPECTED.totalResistance;
    expect(relativeError).toBeLessThan(ISO_EXPECTED.tolerance);
  });

  it('should calculate U-value correctly per ISO 6946', () => {
    const inputs: MultiLayerWallInputs = {
      layers: ISO_EXAMPLE_WALL,
      insideTemperature: 20,
      outsideTemperature: 0,
      insideConvection: 7.69,
      outsideConvection: 25,
    };

    const result = calculateMultiLayerWall(inputs);

    // Validate U-value within tolerance
    const relativeError = Math.abs(result.uValue - ISO_EXPECTED.uValue) / ISO_EXPECTED.uValue;
    expect(relativeError).toBeLessThan(ISO_EXPECTED.tolerance);
  });

  it('should use default convection coefficients from ISO 6946 when not provided', () => {
    const inputs: MultiLayerWallInputs = {
      layers: ISO_EXAMPLE_WALL,
      insideTemperature: 20,
      outsideTemperature: 0,
    };

    const result = calculateMultiLayerWall(inputs);

    // Should use default R_si = 0.13, R_se = 0.04
    expect(result.layerResistances.insideSurface).toBeCloseTo(0.13, 2);
    expect(result.layerResistances.outsideSurface).toBeCloseTo(0.04, 2);
  });
});

// ============================================================================
// Test Suite: Single Layer Wall Simplification
// ============================================================================

describe('Multi-Layer Wall: Single Layer Validation', () => {
  it('should calculate single layer concrete wall correctly', () => {
    // Simple 200mm concrete wall
    const inputs: MultiLayerWallInputs = {
      layers: [
        {
          name: 'Concrete',
          thickness: 0.200,
          thermalConductivity: 1.4, // W/(m.K) - medium density concrete
        },
      ],
      insideTemperature: 20,
      outsideTemperature: 0,
      insideConvection: 7.69, // R_si = 0.13
      outsideConvection: 25, // R_se = 0.04
    };

    const result = calculateMultiLayerWall(inputs);

    // R_concrete = 0.200 / 1.4 = 0.143
    // R_total = 0.13 + 0.143 + 0.04 = 0.313
    // U = 1/0.313 = 3.19
    expect(result.layerResistances.layers[0]).toBeCloseTo(0.143, 3);
    expect(result.totalResistance).toBeCloseTo(0.313, 2);
    expect(result.uValue).toBeCloseTo(3.19, 1);
  });

  it('should calculate high-performance insulated wall correctly', () => {
    // Single 100mm EPS insulation panel
    const inputs: MultiLayerWallInputs = {
      layers: [
        {
          name: 'EPS',
          thickness: 0.100,
          thermalConductivity: 0.038, // High-performance EPS
        },
      ],
      insideTemperature: 20,
      outsideTemperature: -10,
      insideConvection: 7.69,
      outsideConvection: 25,
    };

    const result = calculateMultiLayerWall(inputs);

    // R_eps = 0.100 / 0.038 = 2.632
    // R_total = 0.13 + 2.632 + 0.04 = 2.802
    // U = 1/2.802 = 0.357
    expect(result.layerResistances.layers[0]).toBeCloseTo(2.632, 2);
    expect(result.uValue).toBeCloseTo(0.357, 2);
  });
});

// ============================================================================
// Test Suite: Temperature Profile Calculation
// ============================================================================

describe('Multi-Layer Wall: Temperature Profile', () => {
  it('should calculate interface temperatures correctly', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        {
          name: 'Outer layer',
          thickness: 0.100,
          thermalConductivity: 1.0, // R = 0.1
        },
        {
          name: 'Insulation',
          thickness: 0.100,
          thermalConductivity: 0.05, // R = 2.0
        },
        {
          name: 'Inner layer',
          thickness: 0.100,
          thermalConductivity: 1.0, // R = 0.1
        },
      ],
      insideTemperature: 20,
      outsideTemperature: 0,
      insideConvection: 10, // R_si = 0.1
      outsideConvection: 20, // R_se = 0.05
    };

    const result = calculateMultiLayerWall(inputs);

    // R_total = 0.1 + 0.05 + 0.1 + 2.0 + 0.1 = 2.35
    // q = deltaT / R_total = 20 / 2.35 = 8.51 W/m2 (heat flows from inside to outside)

    // Temperature profile (from outside to inside):
    // T_outside_surface = T_out + q * R_se = 0 + 8.51 * 0.05 = 0.43
    // After outer layer: 0.43 + 8.51 * 0.1 = 1.28
    // After insulation: 1.28 + 8.51 * 2.0 = 18.30
    // After inner layer (inside surface): 18.30 + 8.51 * 0.1 = 19.15

    // Profile length = number of layers + 1 (outside surface + interfaces after each layer)
    expect(result.temperatureProfile.length).toBe(4);
    expect(result.temperatureProfile[0]).toBeCloseTo(0.43, 1); // Outside surface
    // Inside surface should be close to inside air temp
    expect(result.temperatureProfile[3]).toBeCloseTo(19.15, 1);
  });

  it('should show temperature drop proportional to thermal resistance', () => {
    // Most temperature drop should occur across insulation layer
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Concrete', thickness: 0.100, thermalConductivity: 1.4 },
        { name: 'Insulation', thickness: 0.050, thermalConductivity: 0.04 },
        { name: 'Gypsum', thickness: 0.013, thermalConductivity: 0.16 },
      ],
      insideTemperature: 22,
      outsideTemperature: -5,
    };

    const result = calculateMultiLayerWall(inputs);

    // Insulation resistance dominates (0.050/0.04 = 1.25 m2.K/W)
    // Temperature drop across insulation should be largest
    const tempDropConcrete = result.temperatureProfile[1] - result.temperatureProfile[0];
    const tempDropInsulation = result.temperatureProfile[2] - result.temperatureProfile[1];
    const tempDropGypsum = result.temperatureProfile[3] - result.temperatureProfile[2];

    expect(tempDropInsulation).toBeGreaterThan(tempDropConcrete);
    expect(tempDropInsulation).toBeGreaterThan(tempDropGypsum);
  });
});

// ============================================================================
// Test Suite: Heat Flow Calculations
// ============================================================================

describe('Multi-Layer Wall: Heat Flow', () => {
  it('should calculate heat flux magnitude correctly', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Test', thickness: 0.100, thermalConductivity: 1.0 },
      ],
      insideTemperature: 20,
      outsideTemperature: 0,
      insideConvection: 10, // R_si = 0.1
      outsideConvection: 20, // R_se = 0.05
    };

    const result = calculateMultiLayerWall(inputs);

    // R_total = 0.1 + 0.1 + 0.05 = 0.25
    // |q| = |deltaT| / R_total = 20 / 0.25 = 80 W/m2
    // Sign convention: q = U * (T_out - T_in) = U * (0 - 20) = -80
    // Negative means heat flows from inside to outside (heat loss)
    expect(Math.abs(result.heatFlux)).toBeCloseTo(80, 0);
  });

  it('should calculate total heat flow with area', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Test', thickness: 0.100, thermalConductivity: 1.0 },
      ],
      insideTemperature: 20,
      outsideTemperature: 0,
      insideConvection: 10,
      outsideConvection: 20,
      area: 10, // 10 m2
    };

    const result = calculateMultiLayerWall(inputs);

    // |Q| = |q| * A = 80 * 10 = 800 W
    expect(Math.abs(result.totalHeatFlow)).toBeCloseTo(800, 0);
  });

  it('should handle negative temperature difference (heat gain)', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Test', thickness: 0.200, thermalConductivity: 1.0 },
      ],
      insideTemperature: 22,
      outsideTemperature: 35, // Hot outside
    };

    const result = calculateMultiLayerWall(inputs);

    // Heat flows from outside to inside (heat gain)
    // q = U * (T_out - T_in) = U * (35 - 22) > 0 (positive = heat gain)
    expect(result.heatFlux).toBeGreaterThan(0);
  });

  it('should return zero heat flux for zero temperature difference', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Test', thickness: 0.200, thermalConductivity: 1.0 },
      ],
      insideTemperature: 20,
      outsideTemperature: 20,
    };

    const result = calculateMultiLayerWall(inputs);

    expect(result.heatFlux).toBe(0);
    expect(result.totalHeatFlow).toBe(0);
  });
});

// ============================================================================
// Test Suite: Energy Conservation
// ============================================================================

describe('Multi-Layer Wall: Energy Conservation', () => {
  it('should have equal heat flux magnitude through all layers (steady state)', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Layer1', thickness: 0.100, thermalConductivity: 1.0 },
        { name: 'Layer2', thickness: 0.050, thermalConductivity: 0.05 },
        { name: 'Layer3', thickness: 0.050, thermalConductivity: 0.5 },
      ],
      insideTemperature: 25,
      outsideTemperature: 5,
    };

    const result = calculateMultiLayerWall(inputs);

    // Calculate heat flux through each layer using q = k * deltaT / d
    const temps = result.temperatureProfile;
    const layers = inputs.layers;

    // Heat flux through layer 1 (from outside surface to interface 1)
    const q1 = layers[0].thermalConductivity * (temps[1] - temps[0]) / layers[0].thickness;
    // Heat flux through layer 2
    const q2 = layers[1].thermalConductivity * (temps[2] - temps[1]) / layers[1].thickness;
    // Heat flux through layer 3
    const q3 = layers[2].thermalConductivity * (temps[3] - temps[2]) / layers[2].thickness;

    // All heat flux magnitudes should be equal (energy conservation in steady state)
    // Note: result.heatFlux uses convention q = U*(T_out - T_in), so it's negative here
    // Layer-by-layer q uses direction from outside to inside, so positive
    expect(Math.abs(q1)).toBeCloseTo(Math.abs(result.heatFlux), 1);
    expect(Math.abs(q2)).toBeCloseTo(Math.abs(result.heatFlux), 1);
    expect(Math.abs(q3)).toBeCloseTo(Math.abs(result.heatFlux), 1);
  });
});

// ============================================================================
// Test Suite: Layer Resistance Calculation
// ============================================================================

describe('Multi-Layer Wall: Layer Resistance', () => {
  it('should calculate individual layer resistance correctly', () => {
    // R = d / k
    const resistance = calculateLayerResistance(0.200, 1.4);
    expect(resistance).toBeCloseTo(0.143, 3);
  });

  it('should handle high conductivity materials (steel)', () => {
    // Steel: k = 50 W/(m.K)
    const resistance = calculateLayerResistance(0.005, 50);
    expect(resistance).toBeCloseTo(0.0001, 4);
  });

  it('should handle low conductivity materials (insulation)', () => {
    // EPS: k = 0.038 W/(m.K)
    const resistance = calculateLayerResistance(0.100, 0.038);
    expect(resistance).toBeCloseTo(2.632, 2);
  });
});

// ============================================================================
// Test Suite: Material Database
// ============================================================================

describe('Multi-Layer Wall: Material Database', () => {
  it('should have concrete properties from ASHRAE Handbook', () => {
    const concrete = MATERIAL_THERMAL_PROPERTIES.concrete;
    expect(concrete).toBeDefined();
    expect(concrete.thermalConductivity).toBeCloseTo(1.4, 1);
    expect(concrete.density).toBeCloseTo(2200, -2);
    expect(concrete.specificHeat).toBeCloseTo(880, -1);
  });

  it('should have EPS insulation properties from ISO 10456', () => {
    const eps = MATERIAL_THERMAL_PROPERTIES.insulation_eps;
    expect(eps).toBeDefined();
    expect(eps.thermalConductivity).toBeCloseTo(0.038, 3);
    expect(eps.density).toBeCloseTo(25, -1);
  });

  it('should have gypsum board properties from ASHRAE', () => {
    const gypsum = MATERIAL_THERMAL_PROPERTIES.gypsum;
    expect(gypsum).toBeDefined();
    expect(gypsum.thermalConductivity).toBeCloseTo(0.16, 2);
  });

  it('should have steel properties from Incropera', () => {
    const steel = MATERIAL_THERMAL_PROPERTIES.steel;
    expect(steel).toBeDefined();
    expect(steel.thermalConductivity).toBeCloseTo(50, 0);
    expect(steel.density).toBeCloseTo(7850, -1);
  });

  it('should have glass properties from ASHRAE', () => {
    const glass = MATERIAL_THERMAL_PROPERTIES.glass;
    expect(glass).toBeDefined();
    expect(glass.thermalConductivity).toBeCloseTo(1.0, 1);
  });
});

// ============================================================================
// Test Suite: Input Validation and Edge Cases
// ============================================================================

describe('Multi-Layer Wall: Input Validation', () => {
  it('should throw error for empty layers array', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [],
      insideTemperature: 20,
      outsideTemperature: 0,
    };

    expect(() => calculateMultiLayerWall(inputs)).toThrow();
  });

  it('should throw error for zero or negative thickness', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Invalid', thickness: 0, thermalConductivity: 1.0 },
      ],
      insideTemperature: 20,
      outsideTemperature: 0,
    };

    expect(() => calculateMultiLayerWall(inputs)).toThrow();
  });

  it('should throw error for zero or negative thermal conductivity', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Invalid', thickness: 0.1, thermalConductivity: 0 },
      ],
      insideTemperature: 20,
      outsideTemperature: 0,
    };

    expect(() => calculateMultiLayerWall(inputs)).toThrow();
  });

  it('should throw error for negative convection coefficient', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Test', thickness: 0.1, thermalConductivity: 1.0 },
      ],
      insideTemperature: 20,
      outsideTemperature: 0,
      insideConvection: -1,
    };

    expect(() => calculateMultiLayerWall(inputs)).toThrow();
  });

  it('should handle extreme temperature differences', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Test', thickness: 0.200, thermalConductivity: 1.0 },
      ],
      insideTemperature: 25,
      outsideTemperature: -40, // Extreme cold
    };

    const result = calculateMultiLayerWall(inputs);

    // q = U * (T_out - T_in) = U * (-40 - 25) < 0 (heat loss, flows outward)
    // The magnitude should be large
    expect(Math.abs(result.heatFlux)).toBeGreaterThan(100);
    expect(Number.isFinite(result.uValue)).toBe(true);
  });

  it('should handle very thin layers', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Paint', thickness: 0.0001, thermalConductivity: 0.5 }, // 0.1mm paint
        { name: 'Concrete', thickness: 0.200, thermalConductivity: 1.4 },
      ],
      insideTemperature: 20,
      outsideTemperature: 0,
    };

    const result = calculateMultiLayerWall(inputs);

    // Paint layer should have negligible resistance
    expect(result.layerResistances.layers[0]).toBeLessThan(0.001);
    expect(Number.isFinite(result.uValue)).toBe(true);
  });

  it('should handle many layers (complex assembly)', () => {
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'External render', thickness: 0.020, thermalConductivity: 1.0 },
        { name: 'Brick', thickness: 0.100, thermalConductivity: 0.77 },
        { name: 'Air gap', thickness: 0.050, thermalConductivity: 0.18 },
        { name: 'Insulation 1', thickness: 0.050, thermalConductivity: 0.04 },
        { name: 'Insulation 2', thickness: 0.050, thermalConductivity: 0.04 },
        { name: 'Vapor barrier', thickness: 0.001, thermalConductivity: 0.5 },
        { name: 'Concrete block', thickness: 0.100, thermalConductivity: 0.51 },
        { name: 'Plaster', thickness: 0.013, thermalConductivity: 0.57 },
      ],
      insideTemperature: 20,
      outsideTemperature: -5,
    };

    const result = calculateMultiLayerWall(inputs);

    expect(result.layerResistances.layers.length).toBe(8);
    // Profile has n+1 points: outside surface + after each of n layers
    expect(result.temperatureProfile.length).toBe(9);
    expect(Number.isFinite(result.uValue)).toBe(true);
    expect(result.uValue).toBeGreaterThan(0);
  });
});

// ============================================================================
// Test Suite: Plant Factory Wall Scenarios
// ============================================================================

describe('Multi-Layer Wall: Plant Factory Applications', () => {
  it('should calculate insulated container wall (typical PFAL)', () => {
    // Typical insulated container wall for plant factory
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Steel cladding', thickness: 0.0006, thermalConductivity: 50 },
        { name: 'PIR insulation', thickness: 0.100, thermalConductivity: 0.022 },
        { name: 'Steel inner', thickness: 0.0006, thermalConductivity: 50 },
      ],
      insideTemperature: 22, // Typical lettuce growing temp
      outsideTemperature: 35, // Hot summer day
      area: 50, // 50 m2 wall
    };

    const result = calculateMultiLayerWall(inputs);

    // PIR insulation should dominate (R = 0.1/0.022 = 4.55)
    // Total R approx 4.55 + 0.13 + 0.04 = 4.72
    // U approx 0.21
    expect(result.uValue).toBeLessThan(0.3); // Well insulated
    expect(result.heatFlux).toBeGreaterThan(0); // Heat gain in summer (T_out > T_in)
  });

  it('should calculate greenhouse glazing assembly', () => {
    // Double glazed polycarbonate
    // Note: This is a simplified thermal model. Real glazing also has
    // radiation effects which are not captured here.
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Outer PC', thickness: 0.006, thermalConductivity: 0.2 },
        { name: 'Air gap', thickness: 0.016, thermalConductivity: 0.025 },
        { name: 'Inner PC', thickness: 0.006, thermalConductivity: 0.2 },
      ],
      insideTemperature: 20,
      outsideTemperature: 5,
      area: 200, // 200 m2 glazing
    };

    const result = calculateMultiLayerWall(inputs);

    // With our simple conduction model:
    // R_outer = 0.006/0.2 = 0.03
    // R_gap = 0.016/0.025 = 0.64
    // R_inner = 0.006/0.2 = 0.03
    // R_total = 0.04 + 0.03 + 0.64 + 0.03 + 0.13 = 0.87
    // U = 1.15 W/(m2.K)
    // This is lower than typical glazing because real glazing includes radiation
    expect(result.uValue).toBeGreaterThan(0.5);
    expect(result.uValue).toBeLessThan(2.0);
  });

  it('should calculate floor/ceiling with soil heating consideration', () => {
    // Floor assembly with insulation below
    const inputs: MultiLayerWallInputs = {
      layers: [
        { name: 'Concrete slab', thickness: 0.150, thermalConductivity: 1.4 },
        { name: 'XPS insulation', thickness: 0.100, thermalConductivity: 0.035 },
      ],
      insideTemperature: 20, // Room temperature
      outsideTemperature: 12, // Ground temperature
    };

    const result = calculateMultiLayerWall(inputs);

    // Should have reasonably low heat loss to ground
    expect(result.uValue).toBeLessThan(0.5);
  });
});

// ============================================================================
// Test Suite: Temperature Profile Helper Function
// ============================================================================

describe('calculateTemperatureProfile', () => {
  it('should calculate temperature profile for given inputs', () => {
    const layers: WallLayer[] = [
      { name: 'Layer1', thickness: 0.100, thermalConductivity: 1.0 },
    ];
    const layerResistances = [0.1];
    const surfaceResistances = { inside: 0.13, outside: 0.04 };
    const temps = {
      inside: 20,
      outside: 0,
    };

    const profile = calculateTemperatureProfile(
      layers,
      layerResistances,
      surfaceResistances,
      temps
    );

    expect(profile.length).toBe(2);
    expect(profile[0]).toBeLessThan(temps.inside);
    expect(profile[0]).toBeGreaterThan(temps.outside);
  });
});
