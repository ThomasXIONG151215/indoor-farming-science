/**
 * PV Module Database
 *
 * Database of PV module specifications from manufacturer datasheets.
 * All parameters are at Standard Test Conditions (STC):
 * - Irradiance: 1000 W/m²
 * - Cell Temperature: 25°C
 * - Air Mass: AM1.5G
 *
 * @module energy-systems/pv-modules
 *
 * @references
 * - Manufacturer datasheets (see individual module references)
 * - IEC 61215: Crystalline silicon terrestrial photovoltaic (PV) modules
 * - IEC 61730: Photovoltaic (PV) module safety qualification
 */

import type { PVModuleSpecification } from './types';

/**
 * Database of PV module specifications
 *
 * @description
 * Contains specifications for common high-efficiency PV modules
 * from leading manufacturers. Data is sourced from official
 * manufacturer datasheets.
 *
 * Temperature coefficients:
 * - alphaIsc: Relative coefficient [%/°C] converted to [1/°C]
 *   e.g., 0.042%/°C → 0.00042 /°C
 * - betaVoc: Relative coefficient [%/°C] converted to [1/°C]
 *   e.g., -0.27%/°C → -0.0027 /°C
 * - gammaPmax: Relative coefficient [%/°C] converted to [1/°C]
 *   e.g., -0.35%/°C → -0.0035 /°C
 *
 * @example
 * ```typescript
 * const jinko = PV_MODULE_DATABASE['jinko_tiger_pro_545'];
 * console.log(`Pmax: ${jinko.pMax} W`);
 * ```
 */
export const PV_MODULE_DATABASE: Record<string, PVModuleSpecification> = {
  /**
   * Jinko Solar Tiger Pro 545W
   *
   * High-efficiency monocrystalline PERC module with half-cut cells
   * and multi-busbar technology.
   *
   * @reference Jinko Solar JKM545M-72HL4-V Datasheet (2023)
   */
  jinko_tiger_pro_545: {
    model: 'Tiger Pro 545W',
    manufacturer: 'Jinko Solar',
    pMax: 545,
    vMpp: 41.28,
    iMpp: 13.21,
    vOc: 49.62,
    iSc: 13.89,
    alphaIsc: 0.00042, // +0.042%/°C
    betaVoc: -0.0027, // -0.27%/°C
    gammaPmax: -0.0035, // -0.35%/°C
    nCells: 144, // 72 cells * 2 (half-cut)
    nBypass: 3,
    area: 2.562, // 2274 x 1134 mm
    reference: 'Jinko Solar JKM545M-72HL4-V Datasheet 2023',
  },

  /**
   * LONGi Hi-MO 5 545W
   *
   * High-efficiency monocrystalline PERC module with M10 wafer
   * and half-cut cell design.
   *
   * @reference LONGi LR5-72HPH-545M Datasheet (2023)
   */
  longi_hi_mo_5_545: {
    model: 'Hi-MO 5 545W',
    manufacturer: 'LONGi',
    pMax: 545,
    vMpp: 41.8,
    iMpp: 13.04,
    vOc: 49.5,
    iSc: 13.85,
    alphaIsc: 0.00045, // +0.045%/°C
    betaVoc: -0.0026, // -0.26%/°C
    gammaPmax: -0.0034, // -0.34%/°C
    nCells: 144, // 72 cells * 2 (half-cut)
    nBypass: 3,
    area: 2.562, // 2256 x 1133 mm
    reference: 'LONGi LR5-72HPH-545M Datasheet 2023',
  },

  /**
   * Trina Solar Vertex S+ 445W
   *
   * High-efficiency n-type TOPCon module with 210mm wafer
   * and multi-busbar technology.
   *
   * @reference Trina Solar TSM-445NEG9.28 Datasheet (2023)
   */
  trina_vertex_s_445: {
    model: 'Vertex S+ 445W',
    manufacturer: 'Trina Solar',
    pMax: 445,
    vMpp: 37.2,
    iMpp: 11.96,
    vOc: 44.2,
    iSc: 12.65,
    alphaIsc: 0.00043, // +0.043%/°C
    betaVoc: -0.0024, // -0.24%/°C (n-type has lower temp coefficient)
    gammaPmax: -0.0029, // -0.29%/°C
    nCells: 144, // 72 cells * 2 (half-cut)
    nBypass: 3,
    area: 1.903, // 1762 x 1080 mm
    reference: 'Trina Solar TSM-445NEG9.28 Datasheet 2023',
  },

  /**
   * Canadian Solar HiKu7 660W
   *
   * Large-format high-power module with 210mm wafer
   * and half-cut cell technology.
   *
   * @reference Canadian Solar CS7L-660MS Datasheet (2023)
   */
  canadian_hiku7_660: {
    model: 'HiKu7 660W',
    manufacturer: 'Canadian Solar',
    pMax: 660,
    vMpp: 44.0,
    iMpp: 15.0,
    vOc: 52.6,
    iSc: 15.82,
    alphaIsc: 0.00045, // +0.045%/°C
    betaVoc: -0.0026, // -0.26%/°C
    gammaPmax: -0.0034, // -0.34%/°C
    nCells: 132, // 66 cells * 2 (half-cut)
    nBypass: 3,
    area: 2.903, // 2384 x 1218 mm
    reference: 'Canadian Solar CS7L-660MS Datasheet 2023',
  },

  /**
   * JA Solar DeepBlue 3.0 Pro 545W
   *
   * High-efficiency monocrystalline PERC module with
   * PECVD film and SMBB technology.
   *
   * @reference JA Solar JAM72S30-545/MR Datasheet (2023)
   */
  ja_deepblue_545: {
    model: 'DeepBlue 3.0 Pro 545W',
    manufacturer: 'JA Solar',
    pMax: 545,
    vMpp: 41.52,
    iMpp: 13.13,
    vOc: 49.77,
    iSc: 13.85,
    alphaIsc: 0.00044, // +0.044%/°C
    betaVoc: -0.0027, // -0.27%/°C
    gammaPmax: -0.0035, // -0.35%/°C
    nCells: 144, // 72 cells * 2 (half-cut)
    nBypass: 3,
    area: 2.562,
    reference: 'JA Solar JAM72S30-545/MR Datasheet 2023',
  },

  /**
   * Risen Energy Titan S 415W
   *
   * High-efficiency monocrystalline module with
   * 166mm half-cut cells.
   *
   * @reference Risen Energy RSM40-8-415M Datasheet (2023)
   */
  risen_titan_s_415: {
    model: 'Titan S 415W',
    manufacturer: 'Risen Energy',
    pMax: 415,
    vMpp: 31.2,
    iMpp: 13.3,
    vOc: 37.2,
    iSc: 14.1,
    alphaIsc: 0.0005, // +0.05%/°C
    betaVoc: -0.0026, // -0.26%/°C
    gammaPmax: -0.0035, // -0.35%/°C
    nCells: 108, // 54 cells * 2 (half-cut)
    nBypass: 3,
    area: 1.865, // 1722 x 1083 mm
    reference: 'Risen Energy RSM40-8-415M Datasheet 2023',
  },

  /**
   * Suntech Power Ultra V Mini 410W
   *
   * Residential high-efficiency module with
   * n-type HJT technology.
   *
   * @reference Suntech STP410S-C54/Umh Datasheet (2023)
   */
  suntech_ultra_v_410: {
    model: 'Ultra V Mini 410W',
    manufacturer: 'Suntech Power',
    pMax: 410,
    vMpp: 31.3,
    iMpp: 13.1,
    vOc: 37.8,
    iSc: 13.8,
    alphaIsc: 0.00048, // +0.048%/°C
    betaVoc: -0.0024, // -0.24%/°C (HJT has low temp coef)
    gammaPmax: -0.0026, // -0.26%/°C
    nCells: 108, // 54 cells * 2 (half-cut)
    nBypass: 3,
    area: 1.747, // 1722 x 1015 mm
    reference: 'Suntech STP410S-C54/Umh Datasheet 2023',
  },

  /**
   * Q CELLS Q.PEAK DUO ML-G11 410W
   *
   * High-performance residential module with
   * Q.ANTUM DUO Z Technology.
   *
   * @reference Hanwha Q CELLS Q.PEAK DUO ML-G11 Datasheet (2023)
   */
  qcells_peak_duo_410: {
    model: 'Q.PEAK DUO ML-G11 410W',
    manufacturer: 'Q CELLS',
    pMax: 410,
    vMpp: 31.08,
    iMpp: 13.19,
    vOc: 37.02,
    iSc: 13.95,
    alphaIsc: 0.00044, // +0.044%/°C
    betaVoc: -0.0025, // -0.25%/°C
    gammaPmax: -0.0034, // -0.34%/°C
    nCells: 108, // 54 cells * 2 (half-cut)
    nBypass: 3,
    area: 1.819, // 1708 x 1065 mm
    reference: 'Hanwha Q CELLS Q.PEAK DUO ML-G11 Datasheet 2023',
  },
} as const;

/**
 * Get module specification by name
 *
 * @param moduleName - Module identifier (key in PV_MODULE_DATABASE)
 * @returns Module specification or undefined if not found
 *
 * @example
 * ```typescript
 * const spec = getModuleSpec('jinko_tiger_pro_545');
 * if (spec) {
 *   console.log(`Pmax: ${spec.pMax} W`);
 * }
 * ```
 */
export function getModuleSpec(moduleName: string): PVModuleSpecification | undefined {
  return PV_MODULE_DATABASE[moduleName];
}

/**
 * List all available module names
 *
 * @returns Array of module identifier strings
 *
 * @example
 * ```typescript
 * const modules = listAvailableModules();
 * // ['jinko_tiger_pro_545', 'longi_hi_mo_5_545', ...]
 * ```
 */
export function listAvailableModules(): string[] {
  return Object.keys(PV_MODULE_DATABASE);
}

/**
 * Search modules by manufacturer
 *
 * @param manufacturer - Manufacturer name (case-insensitive partial match)
 * @returns Array of matching module specifications
 *
 * @example
 * ```typescript
 * const jinkoModules = searchModulesByManufacturer('jinko');
 * ```
 */
export function searchModulesByManufacturer(
  manufacturer: string
): PVModuleSpecification[] {
  const searchTerm = manufacturer.toLowerCase();
  return Object.values(PV_MODULE_DATABASE).filter((module) =>
    module.manufacturer.toLowerCase().includes(searchTerm)
  );
}

/**
 * Search modules by power range
 *
 * @param minPower - Minimum power [W]
 * @param maxPower - Maximum power [W]
 * @returns Array of matching module specifications
 *
 * @example
 * ```typescript
 * const highPowerModules = searchModulesByPower(500, 700);
 * ```
 */
export function searchModulesByPower(
  minPower: number,
  maxPower: number
): PVModuleSpecification[] {
  return Object.values(PV_MODULE_DATABASE).filter(
    (module) => module.pMax >= minPower && module.pMax <= maxPower
  );
}
