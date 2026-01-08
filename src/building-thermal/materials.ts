/**
 * Building Material Thermal Properties Database
 *
 * @description
 * Scientifically-validated thermal properties for common building materials.
 * All values are sourced from peer-reviewed literature and international standards.
 *
 * @module building-thermal/materials
 *
 * @references
 * - ASHRAE Handbook - Fundamentals (2021), Chapter 26, Table 4
 * - ISO 10456:2007 - Building materials and products - Hygrothermal properties
 * - Incropera, F.P. & DeWitt, D.P. - Fundamentals of Heat and Mass Transfer, Appendix A
 * - Clarke, J.A. (2001). Energy Simulation in Building Design
 */

import type { MaterialProperties, MaterialDatabase } from './types';

// ============================================================================
// Material Thermal Properties Database
// ============================================================================

/**
 * Thermal properties of common building materials
 *
 * @description
 * Comprehensive database of thermal conductivity (k), density (rho),
 * and specific heat (c_p) for materials used in building construction.
 *
 * Property sources:
 * - Thermal conductivity: Design values at 10degC mean temperature
 * - Density: Nominal values for typical material grades
 * - Specific heat: Values at 20degC
 *
 * @example
 * ```typescript
 * import { MATERIAL_THERMAL_PROPERTIES } from './materials';
 *
 * const concrete = MATERIAL_THERMAL_PROPERTIES.concrete;
 * console.log(`Concrete k = ${concrete.thermalConductivity} W/(m.K)`);
 * // Output: Concrete k = 1.4 W/(m.K)
 * ```
 */
export const MATERIAL_THERMAL_PROPERTIES: MaterialDatabase = {
  // ==========================================================================
  // Concrete and Masonry
  // ==========================================================================

  concrete: {
    name: 'Concrete (medium density)',
    thermalConductivity: 1.4,
    density: 2200,
    specificHeat: 880,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Medium density reinforced concrete',
  },

  concrete_lightweight: {
    name: 'Concrete (lightweight aggregate)',
    thermalConductivity: 0.53,
    density: 1400,
    specificHeat: 1000,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Lightweight aggregate concrete',
  },

  concrete_high_density: {
    name: 'Concrete (high density)',
    thermalConductivity: 2.0,
    density: 2400,
    specificHeat: 880,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'High density structural concrete',
  },

  brick_common: {
    name: 'Brick (common)',
    thermalConductivity: 0.77,
    density: 1920,
    specificHeat: 835,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Common clay brick',
  },

  brick_face: {
    name: 'Brick (face brick)',
    thermalConductivity: 1.3,
    density: 2100,
    specificHeat: 880,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Face brick for exterior finish',
  },

  concrete_block: {
    name: 'Concrete block (hollow)',
    thermalConductivity: 0.51,
    density: 1000,
    specificHeat: 880,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Medium weight hollow block, 200mm',
  },

  mortar: {
    name: 'Cement mortar',
    thermalConductivity: 0.93,
    density: 1900,
    specificHeat: 920,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Cement mortar for masonry joints',
  },

  // ==========================================================================
  // Insulation Materials
  // ==========================================================================

  insulation_eps: {
    name: 'EPS Expanded Polystyrene',
    thermalConductivity: 0.038,
    density: 25,
    specificHeat: 1400,
    reference: 'ISO 10456:2007, Table A.1',
    notes: 'Standard grade EPS, lambda_D = 0.038',
  },

  insulation_xps: {
    name: 'XPS Extruded Polystyrene',
    thermalConductivity: 0.035,
    density: 35,
    specificHeat: 1400,
    reference: 'ISO 10456:2007, Table A.1',
    notes: 'Standard grade XPS',
  },

  insulation_pir: {
    name: 'PIR Polyisocyanurate',
    thermalConductivity: 0.022,
    density: 32,
    specificHeat: 1400,
    reference: 'ISO 10456:2007, Table A.1',
    notes: 'High-performance rigid foam insulation',
  },

  insulation_pur: {
    name: 'PUR Polyurethane',
    thermalConductivity: 0.024,
    density: 35,
    specificHeat: 1400,
    reference: 'ISO 10456:2007, Table A.1',
    notes: 'Polyurethane rigid foam',
  },

  insulation_mineral_wool: {
    name: 'Mineral wool (glass/rock)',
    thermalConductivity: 0.040,
    density: 100,
    specificHeat: 840,
    reference: 'ISO 10456:2007, Table A.1',
    notes: 'Glass or rock wool batts',
  },

  insulation_cellulose: {
    name: 'Cellulose fiber',
    thermalConductivity: 0.040,
    density: 50,
    specificHeat: 2020,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Loose-fill cellulose insulation',
  },

  insulation_aerogel: {
    name: 'Aerogel blanket',
    thermalConductivity: 0.015,
    density: 150,
    specificHeat: 1000,
    reference: 'Manufacturer data, Aspen Aerogels',
    notes: 'High-performance aerogel insulation',
  },

  insulation_vacuum: {
    name: 'Vacuum Insulation Panel (VIP)',
    thermalConductivity: 0.007,
    density: 200,
    specificHeat: 800,
    reference: 'ISO 16478:2015',
    notes: 'Center-of-panel value, aged',
  },

  // ==========================================================================
  // Board Materials
  // ==========================================================================

  gypsum: {
    name: 'Gypsum Board',
    thermalConductivity: 0.16,
    density: 800,
    specificHeat: 1090,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Standard gypsum wallboard',
  },

  plasterboard: {
    name: 'Plasterboard',
    thermalConductivity: 0.21,
    density: 900,
    specificHeat: 840,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Standard plasterboard',
  },

  plywood: {
    name: 'Plywood',
    thermalConductivity: 0.15,
    density: 600,
    specificHeat: 1215,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Douglas fir plywood',
  },

  osb: {
    name: 'OSB (Oriented Strand Board)',
    thermalConductivity: 0.13,
    density: 650,
    specificHeat: 1700,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Standard OSB sheathing',
  },

  particleboard: {
    name: 'Particleboard',
    thermalConductivity: 0.17,
    density: 700,
    specificHeat: 1300,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Medium density particleboard',
  },

  cement_board: {
    name: 'Fiber cement board',
    thermalConductivity: 0.25,
    density: 1400,
    specificHeat: 840,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Fiber reinforced cement board',
  },

  // ==========================================================================
  // Metals
  // ==========================================================================

  steel: {
    name: 'Steel (carbon)',
    thermalConductivity: 50,
    density: 7850,
    specificHeat: 500,
    reference: 'Incropera & DeWitt, Table A.1',
    notes: 'Carbon steel, AISI 1010',
  },

  stainless_steel: {
    name: 'Stainless steel (304)',
    thermalConductivity: 16,
    density: 7900,
    specificHeat: 500,
    reference: 'Incropera & DeWitt, Table A.1',
    notes: 'AISI 304 stainless steel',
  },

  aluminum: {
    name: 'Aluminum alloy',
    thermalConductivity: 160,
    density: 2700,
    specificHeat: 900,
    reference: 'Incropera & DeWitt, Table A.1',
    notes: 'Typical building aluminum alloy',
  },

  copper: {
    name: 'Copper (pure)',
    thermalConductivity: 401,
    density: 8940,
    specificHeat: 385,
    reference: 'Incropera & DeWitt, Table A.1',
    notes: 'Pure copper at 300K',
  },

  // ==========================================================================
  // Glass and Glazing
  // ==========================================================================

  glass: {
    name: 'Float Glass',
    thermalConductivity: 1.0,
    density: 2500,
    specificHeat: 750,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Standard float glass',
  },

  glass_low_e: {
    name: 'Low-E coated glass',
    thermalConductivity: 1.0,
    density: 2500,
    specificHeat: 750,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Low-E coating affects radiative properties, not conduction',
  },

  polycarbonate: {
    name: 'Polycarbonate sheet',
    thermalConductivity: 0.20,
    density: 1200,
    specificHeat: 1200,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Solid polycarbonate glazing',
  },

  polycarbonate_multiwall: {
    name: 'Polycarbonate multiwall',
    thermalConductivity: 0.20,
    density: 150,
    specificHeat: 1200,
    reference: 'Manufacturer data',
    notes: 'Effective density for multiwall panel',
  },

  // ==========================================================================
  // Air and Gas Cavities
  // ==========================================================================

  air_gap: {
    name: 'Air Gap (unventilated)',
    thermalConductivity: 0.025,
    density: 1.2,
    specificHeat: 1005,
    reference: 'ISO 6946:2017, Annex D',
    notes: 'Effective conductivity for 20mm unventilated gap',
  },

  air_gap_10mm: {
    name: 'Air Gap 10mm',
    thermalConductivity: 0.025,
    density: 1.2,
    specificHeat: 1005,
    reference: 'ISO 6946:2017, Annex D',
    notes: 'Effective R = 0.15 for 10mm gap, horizontal heat flow',
  },

  air_gap_25mm: {
    name: 'Air Gap 25mm+',
    thermalConductivity: 0.028,
    density: 1.2,
    specificHeat: 1005,
    reference: 'ISO 6946:2017, Annex D',
    notes: 'Effective R = 0.18 for 25mm+ gap, horizontal heat flow',
  },

  argon: {
    name: 'Argon gas (glazing cavity)',
    thermalConductivity: 0.018,
    density: 1.7,
    specificHeat: 520,
    reference: 'ISO 10292:1994',
    notes: 'For IGU argon-filled cavities',
  },

  // ==========================================================================
  // Finishes and Coatings
  // ==========================================================================

  plaster_cement: {
    name: 'Cement plaster',
    thermalConductivity: 0.57,
    density: 1800,
    specificHeat: 840,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Sand/cement render',
  },

  plaster_gypsum: {
    name: 'Gypsum plaster',
    thermalConductivity: 0.51,
    density: 1300,
    specificHeat: 840,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Lightweight gypsum plaster',
  },

  render_external: {
    name: 'External render',
    thermalConductivity: 1.0,
    density: 1800,
    specificHeat: 1000,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Cement-based external render',
  },

  tile_ceramic: {
    name: 'Ceramic tile',
    thermalConductivity: 1.3,
    density: 2300,
    specificHeat: 840,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Ceramic floor/wall tiles',
  },

  // ==========================================================================
  // Wood and Timber
  // ==========================================================================

  timber_softwood: {
    name: 'Softwood timber',
    thermalConductivity: 0.13,
    density: 500,
    specificHeat: 1600,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Pine, spruce at 12% moisture content',
  },

  timber_hardwood: {
    name: 'Hardwood timber',
    thermalConductivity: 0.18,
    density: 700,
    specificHeat: 1600,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'Oak, beech at 12% moisture content',
  },

  // ==========================================================================
  // Membranes and Barriers
  // ==========================================================================

  vapor_barrier_pe: {
    name: 'Polyethylene vapor barrier',
    thermalConductivity: 0.50,
    density: 920,
    specificHeat: 2300,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'PE sheet, negligible thermal resistance for typical thickness',
  },

  waterproof_membrane: {
    name: 'Bituminous membrane',
    thermalConductivity: 0.23,
    density: 1100,
    specificHeat: 1000,
    reference: 'ISO 10456:2007, Table 3',
    notes: 'APP modified bitumen',
  },

  // ==========================================================================
  // Soil and Earth
  // ==========================================================================

  soil_clay: {
    name: 'Clay soil',
    thermalConductivity: 1.5,
    density: 1500,
    specificHeat: 1800,
    reference: 'ISO 13370:2017, Table 1',
    notes: 'Saturated clay soil',
  },

  soil_sand: {
    name: 'Sandy soil',
    thermalConductivity: 2.0,
    density: 1600,
    specificHeat: 1500,
    reference: 'ISO 13370:2017, Table 1',
    notes: 'Saturated sandy soil',
  },

  gravel: {
    name: 'Gravel (loose)',
    thermalConductivity: 0.36,
    density: 1840,
    specificHeat: 840,
    reference: 'ASHRAE Handbook 2021, Chapter 26, Table 4',
    notes: 'Loose fill gravel',
  },
};

// ============================================================================
// Surface Resistance Values (ISO 6946:2017)
// ============================================================================

/**
 * Standard surface thermal resistances per ISO 6946:2017, Table 1
 *
 * @description
 * Surface resistances (R_si and R_se) depend on:
 * - Direction of heat flow (horizontal, upward, downward)
 * - Whether surface is internal or external
 *
 * @unit (m2.K)/W
 */
export const SURFACE_RESISTANCES = {
  /**
   * Internal surface resistances R_si
   * @reference ISO 6946:2017, Table 1
   */
  internal: {
    /** Horizontal heat flow (vertical wall) */
    horizontal: 0.13,
    /** Upward heat flow (floor heating, warm ceiling) */
    upward: 0.10,
    /** Downward heat flow (warm floor, cold ceiling) */
    downward: 0.17,
  },

  /**
   * External surface resistances R_se
   * @reference ISO 6946:2017, Table 1
   */
  external: {
    /** All directions (assumes wind exposure) */
    horizontal: 0.04,
    upward: 0.04,
    downward: 0.04,
  },
};

/**
 * Default convection coefficients derived from surface resistances
 * h = 1 / R
 *
 * @unit W/(m2.K)
 */
export const DEFAULT_CONVECTION_COEFFICIENTS = {
  /**
   * Inside surface convection coefficient
   * h_si = 1 / R_si = 1 / 0.13 = 7.69 W/(m2.K)
   */
  inside: 1 / SURFACE_RESISTANCES.internal.horizontal,

  /**
   * Outside surface convection coefficient
   * h_se = 1 / R_se = 1 / 0.04 = 25 W/(m2.K)
   */
  outside: 1 / SURFACE_RESISTANCES.external.horizontal,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get material properties by key
 *
 * @param materialKey Material identifier from database
 * @returns Material properties or undefined if not found
 *
 * @example
 * ```typescript
 * const concrete = getMaterialProperties('concrete');
 * if (concrete) {
 *   console.log(`k = ${concrete.thermalConductivity} W/(m.K)`);
 * }
 * ```
 */
export function getMaterialProperties(materialKey: string): MaterialProperties | undefined {
  return MATERIAL_THERMAL_PROPERTIES[materialKey];
}

/**
 * List all available materials in the database
 *
 * @returns Array of material keys
 */
export function listAvailableMaterials(): string[] {
  return Object.keys(MATERIAL_THERMAL_PROPERTIES);
}

/**
 * Search materials by thermal conductivity range
 *
 * @param minK Minimum thermal conductivity W/(m.K)
 * @param maxK Maximum thermal conductivity W/(m.K)
 * @returns Array of matching material entries
 */
export function findMaterialsByThermalConductivity(
  minK: number,
  maxK: number
): Array<{ key: string; properties: MaterialProperties }> {
  return Object.entries(MATERIAL_THERMAL_PROPERTIES)
    .filter(
      ([_, props]) =>
        props.thermalConductivity >= minK && props.thermalConductivity <= maxK
    )
    .map(([key, properties]) => ({ key, properties }));
}

/**
 * Calculate thermal diffusivity of a material
 *
 * @description
 * Thermal diffusivity (alpha) = k / (rho * c_p)
 * Measures how quickly temperature changes propagate through a material.
 *
 * @param material Material properties
 * @returns Thermal diffusivity in m2/s
 */
export function calculateThermalDiffusivity(material: MaterialProperties): number {
  return material.thermalConductivity / (material.density * material.specificHeat);
}

/**
 * Calculate thermal effusivity of a material
 *
 * @description
 * Thermal effusivity (b) = sqrt(k * rho * c_p)
 * Measures a material's ability to exchange heat with its surroundings.
 *
 * @param material Material properties
 * @returns Thermal effusivity in J/(m2.K.s^0.5)
 */
export function calculateThermalEffusivity(material: MaterialProperties): number {
  return Math.sqrt(
    material.thermalConductivity * material.density * material.specificHeat
  );
}
