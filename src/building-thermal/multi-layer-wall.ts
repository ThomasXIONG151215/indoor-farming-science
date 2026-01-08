/**
 * Multi-Layer Wall Heat Transfer Model
 *
 * @description
 * Steady-state heat conduction through multi-layer wall assemblies.
 * Implements thermal resistance network method per ISO 6946:2017.
 *
 * @equation
 * ```
 * Steady-state thermal resistance network:
 * R_total = R_se + sum(d_i / k_i) + R_si
 *
 * U-value (thermal transmittance):
 * U = 1 / R_total [W/(m2.K)]
 *
 * Heat flux density:
 * q = U * deltaT = U * (T_out - T_in) [W/m2]
 *
 * Total heat flow:
 * Q = q * A [W]
 * ```
 *
 * Where:
 * - R_se: External surface resistance [(m2.K)/W]
 * - R_si: Internal surface resistance [(m2.K)/W]
 * - d_i: Layer thickness [m]
 * - k_i: Layer thermal conductivity [W/(m.K)]
 *
 * @accuracy
 * - Validated against ISO 6946:2017 Annex B examples
 * - Typical accuracy: +/- 5% for well-characterized materials
 *
 * @references
 * - ISO 6946:2017 - Building components and building elements -
 *   Thermal resistance and thermal transmittance - Calculation methods
 * - ASHRAE Handbook - Fundamentals (2021), Chapter 27
 * - Incropera, F.P. & DeWitt, D.P. - Fundamentals of Heat and Mass Transfer
 *
 * @module building-thermal/multi-layer-wall
 */

import type {
  WallLayer,
  MultiLayerWallInputs,
  MultiLayerWallOutputs,
  SurfaceResistances,
  TemperatureBoundaries,
} from './types';
import {
  SURFACE_RESISTANCES,
  DEFAULT_CONVECTION_COEFFICIENTS,
} from './materials';

// ============================================================================
// Main Calculation Function
// ============================================================================

/**
 * Calculate heat transfer through a multi-layer wall assembly
 *
 * @description
 * Computes steady-state heat transfer using the thermal resistance network method.
 * Returns U-value, heat flux, temperature profile, and resistance breakdown.
 *
 * @param inputs Wall assembly and boundary condition parameters
 * @returns Complete heat transfer calculation results
 *
 * @throws Error if inputs are invalid (empty layers, negative values, etc.)
 *
 * @example
 * ```typescript
 * import { calculateMultiLayerWall } from '@vflab/indoor-farming-science/building-thermal';
 *
 * const result = calculateMultiLayerWall({
 *   layers: [
 *     { name: 'Brick', thickness: 0.102, thermalConductivity: 0.77 },
 *     { name: 'Insulation', thickness: 0.050, thermalConductivity: 0.04 },
 *     { name: 'Concrete', thickness: 0.100, thermalConductivity: 0.51 },
 *   ],
 *   insideTemperature: 20,
 *   outsideTemperature: -5,
 *   area: 25, // optional
 * });
 *
 * console.log(`U-value: ${result.uValue.toFixed(3)} W/(m2.K)`);
 * console.log(`Heat loss: ${result.totalHeatFlow.toFixed(1)} W`);
 * ```
 */
export function calculateMultiLayerWall(
  inputs: MultiLayerWallInputs
): MultiLayerWallOutputs {
  // Validate inputs
  validateInputs(inputs);

  // Extract inputs with defaults
  const {
    layers,
    insideTemperature,
    outsideTemperature,
    insideConvection = DEFAULT_CONVECTION_COEFFICIENTS.inside,
    outsideConvection = DEFAULT_CONVECTION_COEFFICIENTS.outside,
    area = 1,
  } = inputs;

  // Calculate surface resistances from convection coefficients
  // R = 1 / h
  const surfaceResistanceInside = 1 / insideConvection;
  const surfaceResistanceOutside = 1 / outsideConvection;

  // Calculate layer resistances
  // R_i = d_i / k_i
  const layerResistanceValues = layers.map((layer) =>
    calculateLayerResistance(layer.thickness, layer.thermalConductivity)
  );

  // Calculate total resistance
  // R_total = R_se + sum(R_i) + R_si
  const sumLayerResistances = layerResistanceValues.reduce((sum, r) => sum + r, 0);
  const totalResistance =
    surfaceResistanceOutside + sumLayerResistances + surfaceResistanceInside;

  // Calculate U-value
  // U = 1 / R_total
  const uValue = 1 / totalResistance;

  // Calculate temperature difference (outside - inside for heat gain convention)
  const deltaT = outsideTemperature - insideTemperature;

  // Calculate heat flux
  // q = U * deltaT
  // Positive = heat flows from outside to inside (heat gain)
  // Negative = heat flows from inside to outside (heat loss)
  const heatFlux = uValue * deltaT;

  // Calculate total heat flow
  // Q = q * A
  const totalHeatFlow = heatFlux * area;

  // Calculate temperature profile through the wall
  const temperatureProfile = calculateTemperatureProfile(
    layers,
    layerResistanceValues,
    {
      inside: surfaceResistanceInside,
      outside: surfaceResistanceOutside,
    },
    {
      inside: insideTemperature,
      outside: outsideTemperature,
    }
  );

  return {
    totalResistance,
    uValue,
    heatFlux,
    totalHeatFlow,
    temperatureProfile,
    layerResistances: {
      outsideSurface: surfaceResistanceOutside,
      layers: layerResistanceValues,
      insideSurface: surfaceResistanceInside,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate thermal resistance of a single homogeneous layer
 *
 * @description
 * Applies Fourier's law for steady-state conduction:
 * R = d / k
 *
 * @param thickness Layer thickness in meters
 * @param thermalConductivity Thermal conductivity in W/(m.K)
 * @returns Thermal resistance in (m2.K)/W
 *
 * @example
 * ```typescript
 * // 200mm concrete wall
 * const R = calculateLayerResistance(0.200, 1.4);
 * // R = 0.143 (m2.K)/W
 * ```
 */
export function calculateLayerResistance(
  thickness: number,
  thermalConductivity: number
): number {
  if (thickness <= 0) {
    throw new Error(`Layer thickness must be positive, got: ${thickness}`);
  }
  if (thermalConductivity <= 0) {
    throw new Error(
      `Thermal conductivity must be positive, got: ${thermalConductivity}`
    );
  }

  return thickness / thermalConductivity;
}

/**
 * Calculate temperature profile through the wall assembly
 *
 * @description
 * Calculates temperature at each interface using the principle that heat flux
 * is constant through all layers in steady state:
 *
 * T_next = T_current + q * R_layer
 *
 * Starting from outside surface and progressing inward.
 *
 * @param layers Wall layer definitions
 * @param layerResistances Resistance of each layer [(m2.K)/W]
 * @param surfaceResistances Inside and outside surface resistances
 * @param temps Boundary temperatures
 * @returns Array of interface temperatures [degC]
 */
export function calculateTemperatureProfile(
  layers: WallLayer[],
  layerResistances: number[],
  surfaceResistances: SurfaceResistances,
  temps: TemperatureBoundaries
): number[] {
  // Calculate total resistance
  const totalResistance =
    surfaceResistances.outside +
    layerResistances.reduce((sum, r) => sum + r, 0) +
    surfaceResistances.inside;

  // Calculate heat flux (positive = heat flows inward from outside)
  const deltaT = temps.outside - temps.inside;
  const heatFlux = deltaT / totalResistance;

  // Build temperature profile from outside to inside
  const profile: number[] = [];

  // Start at outside air temperature
  let currentTemp = temps.outside;

  // Temperature after outside surface resistance (outside wall surface)
  currentTemp = currentTemp - heatFlux * surfaceResistances.outside;
  profile.push(currentTemp);

  // Temperature at each layer interface
  for (let i = 0; i < layers.length; i++) {
    currentTemp = currentTemp - heatFlux * layerResistances[i];
    profile.push(currentTemp);
  }

  // Note: The last temperature should be close to inside air temperature
  // after accounting for inside surface resistance
  // currentTemp - heatFlux * surfaceResistances.inside should equal temps.inside

  return profile;
}

/**
 * Calculate U-value from layer data
 *
 * @description
 * Convenience function to directly calculate U-value without full output.
 *
 * @param layers Wall layers
 * @param insideConvection Inside convection coefficient [W/(m2.K)]
 * @param outsideConvection Outside convection coefficient [W/(m2.K)]
 * @returns U-value [W/(m2.K)]
 */
export function calculateUValue(
  layers: WallLayer[],
  insideConvection: number = DEFAULT_CONVECTION_COEFFICIENTS.inside,
  outsideConvection: number = DEFAULT_CONVECTION_COEFFICIENTS.outside
): number {
  const rInside = 1 / insideConvection;
  const rOutside = 1 / outsideConvection;

  const rLayers = layers.reduce(
    (sum, layer) => sum + layer.thickness / layer.thermalConductivity,
    0
  );

  const rTotal = rInside + rLayers + rOutside;
  return 1 / rTotal;
}

/**
 * Calculate heat loss/gain through wall over a time period
 *
 * @description
 * Integrates heat flow over time for energy calculations:
 * E = Q * t
 *
 * @param inputs Wall inputs
 * @param hours Duration in hours
 * @returns Energy in Wh
 */
export function calculateHeatEnergy(
  inputs: MultiLayerWallInputs,
  hours: number
): number {
  const result = calculateMultiLayerWall(inputs);
  return result.totalHeatFlow * hours;
}

// ============================================================================
// Input Validation
// ============================================================================

/**
 * Validate multi-layer wall inputs
 *
 * @param inputs Input parameters to validate
 * @throws Error if validation fails
 */
function validateInputs(inputs: MultiLayerWallInputs): void {
  const errors: string[] = [];

  // Validate layers array
  if (!inputs.layers || inputs.layers.length === 0) {
    errors.push('At least one wall layer is required');
  }

  // Validate each layer
  inputs.layers?.forEach((layer, index) => {
    if (layer.thickness <= 0) {
      errors.push(
        `Layer ${index + 1} (${layer.name || 'unnamed'}): thickness must be positive, got ${layer.thickness} m`
      );
    }
    if (layer.thermalConductivity <= 0) {
      errors.push(
        `Layer ${index + 1} (${layer.name || 'unnamed'}): thermalConductivity must be positive, got ${layer.thermalConductivity} W/(m.K)`
      );
    }
    if (layer.density !== undefined && layer.density <= 0) {
      errors.push(
        `Layer ${index + 1} (${layer.name || 'unnamed'}): density must be positive, got ${layer.density} kg/m3`
      );
    }
    if (layer.specificHeat !== undefined && layer.specificHeat <= 0) {
      errors.push(
        `Layer ${index + 1} (${layer.name || 'unnamed'}): specificHeat must be positive, got ${layer.specificHeat} J/(kg.K)`
      );
    }
  });

  // Validate temperatures
  if (
    typeof inputs.insideTemperature !== 'number' ||
    !Number.isFinite(inputs.insideTemperature)
  ) {
    errors.push(
      `insideTemperature must be a finite number, got: ${inputs.insideTemperature}`
    );
  }
  if (
    typeof inputs.outsideTemperature !== 'number' ||
    !Number.isFinite(inputs.outsideTemperature)
  ) {
    errors.push(
      `outsideTemperature must be a finite number, got: ${inputs.outsideTemperature}`
    );
  }

  // Validate convection coefficients if provided
  if (
    inputs.insideConvection !== undefined &&
    inputs.insideConvection <= 0
  ) {
    errors.push(
      `insideConvection must be positive, got: ${inputs.insideConvection}`
    );
  }
  if (
    inputs.outsideConvection !== undefined &&
    inputs.outsideConvection <= 0
  ) {
    errors.push(
      `outsideConvection must be positive, got: ${inputs.outsideConvection}`
    );
  }

  // Validate area if provided
  if (inputs.area !== undefined && inputs.area <= 0) {
    errors.push(`area must be positive, got: ${inputs.area}`);
  }

  // Throw if any errors
  if (errors.length > 0) {
    throw new Error(
      `Multi-layer wall input validation failed:\n${errors.join('\n')}`
    );
  }
}

// ============================================================================
// Advanced Calculations
// ============================================================================

/**
 * Calculate thermal mass (heat capacity) of the wall
 *
 * @description
 * Calculates the total heat capacity of the wall assembly:
 * C = sum(rho_i * c_i * d_i * A)
 *
 * Useful for dynamic simulations and thermal comfort analysis.
 *
 * @param layers Wall layers with density and specific heat
 * @param area Wall area in m2
 * @returns Total heat capacity in J/K
 */
export function calculateThermalMass(
  layers: WallLayer[],
  area: number = 1
): number {
  let totalCapacity = 0;

  for (const layer of layers) {
    if (layer.density !== undefined && layer.specificHeat !== undefined) {
      // C = rho * c * V = rho * c * d * A
      const layerCapacity =
        layer.density * layer.specificHeat * layer.thickness * area;
      totalCapacity += layerCapacity;
    }
  }

  return totalCapacity;
}

/**
 * Calculate time constant of the wall
 *
 * @description
 * The thermal time constant (tau) indicates how quickly the wall
 * responds to temperature changes:
 * tau = R * C
 *
 * Where R is total thermal resistance and C is thermal mass.
 *
 * @param inputs Wall inputs
 * @returns Time constant in seconds
 */
export function calculateTimeConstant(inputs: MultiLayerWallInputs): number {
  const result = calculateMultiLayerWall(inputs);
  const thermalMass = calculateThermalMass(inputs.layers, inputs.area ?? 1);

  // tau = R * C
  // Units: [(m2.K)/W] * [J/K] = [m2.K.J/(W.K)] = [m2.J/W] = [m2.W.s/W] = [m2.s]
  // But we need seconds, so divide by area:
  // For unit area (A=1): tau = R * (C/A) where C/A = rho*c*d [J/(m2.K)]

  const thermalMassPerArea = thermalMass / (inputs.area ?? 1);
  return result.totalResistance * thermalMassPerArea;
}

/**
 * Calculate decrement factor for periodic heat flow
 *
 * @description
 * The decrement factor indicates how much the amplitude of temperature
 * oscillations is reduced as they pass through the wall.
 *
 * For a simplified single-layer equivalent:
 * f = exp(-d * sqrt(pi / (alpha * P)))
 *
 * Where P is the period (typically 24 hours = 86400 s) and alpha is
 * thermal diffusivity.
 *
 * @param layers Wall layers
 * @param period Period of temperature oscillation in seconds (default 24h)
 * @returns Decrement factor (0-1)
 */
export function calculateDecrementFactor(
  layers: WallLayer[],
  period: number = 86400
): number {
  let totalDecrement = 1;

  for (const layer of layers) {
    if (layer.density !== undefined && layer.specificHeat !== undefined) {
      // Thermal diffusivity: alpha = k / (rho * c)
      const alpha =
        layer.thermalConductivity / (layer.density * layer.specificHeat);

      // Decrement for this layer
      const decrement = Math.exp(
        -layer.thickness * Math.sqrt(Math.PI / (alpha * period))
      );

      totalDecrement *= decrement;
    }
  }

  return totalDecrement;
}

export default calculateMultiLayerWall;
