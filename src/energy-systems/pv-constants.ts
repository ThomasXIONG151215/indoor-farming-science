/**
 * Photovoltaic Physical Constants
 *
 * Physical constants used in PV modeling, with values from CODATA 2018
 * and established literature sources.
 *
 * @module energy-systems/pv-constants
 *
 * @references
 * - CODATA 2018: https://physics.nist.gov/cuu/Constants/
 * - Sze, S.M. (2007). Physics of Semiconductor Devices, 3rd ed. Wiley.
 * - Green, M.A. (2003). Physica E: Low-dimensional Systems and Nanostructures,
 *   14(1-2), 65-70. (Temperature-dependent band gap)
 */

/**
 * Physical constants for PV calculations
 *
 * @description
 * All values are from CODATA 2018 recommendations where applicable.
 * These are fundamental physical constants used throughout the
 * single-diode model implementation.
 */
export const PV_CONSTANTS = {
  /**
   * Boltzmann constant [J/K]
   *
   * @reference CODATA 2018: k = 1.380649 × 10⁻²³ J/K (exact)
   */
  BOLTZMANN: 1.380649e-23,

  /**
   * Elementary charge (electron charge magnitude) [C]
   *
   * @reference CODATA 2018: e = 1.602176634 × 10⁻¹⁹ C (exact)
   */
  ELECTRON_CHARGE: 1.602176634e-19,

  /**
   * Silicon bandgap energy at 25°C [eV]
   *
   * Temperature dependence (Varshni equation):
   * E_g(T) = E_g(0) - α*T²/(T + β)
   *
   * For silicon:
   * E_g(0) = 1.166 eV
   * α = 4.73 × 10⁻⁴ eV/K
   * β = 636 K
   *
   * At 25°C (298.15 K): E_g ≈ 1.12 eV
   *
   * @reference
   * - Sze, S.M. (2007). Physics of Semiconductor Devices.
   * - Green, M.A. (1990). J. Appl. Phys. 67, 2944.
   */
  BANDGAP_SI: 1.12,

  /**
   * Silicon bandgap energy at 0 K [eV]
   * Used for temperature-dependent bandgap calculation
   *
   * @reference Sze, S.M. (2007). Physics of Semiconductor Devices.
   */
  BANDGAP_SI_0K: 1.166,

  /**
   * Varshni coefficient alpha for silicon [eV/K]
   *
   * @reference Sze, S.M. (2007). Physics of Semiconductor Devices.
   */
  VARSHNI_ALPHA_SI: 4.73e-4,

  /**
   * Varshni coefficient beta for silicon [K]
   *
   * @reference Sze, S.M. (2007). Physics of Semiconductor Devices.
   */
  VARSHNI_BETA_SI: 636,

  /**
   * Standard Test Conditions (STC) irradiance [W/m²]
   *
   * @reference IEC 61215, IEC 61646
   */
  STC_IRRADIANCE: 1000,

  /**
   * Standard Test Conditions (STC) cell temperature [°C]
   *
   * @reference IEC 61215, IEC 61646
   */
  STC_TEMPERATURE: 25,

  /**
   * Nominal Operating Cell Temperature (NOCT) standard conditions
   * Ambient temperature [°C]
   *
   * @reference IEC 61215
   */
  NOCT_AMBIENT: 20,

  /**
   * NOCT standard irradiance [W/m²]
   *
   * @reference IEC 61215
   */
  NOCT_IRRADIANCE: 800,

  /**
   * NOCT standard wind speed [m/s]
   *
   * @reference IEC 61215
   */
  NOCT_WIND_SPEED: 1,

  /**
   * Default NOCT for crystalline silicon modules [°C]
   * Typical range: 42-48°C
   *
   * @reference Typical manufacturer datasheets
   */
  DEFAULT_NOCT: 45,

  /**
   * Air mass coefficient at STC
   * AM1.5G (Global) spectrum
   *
   * @reference ASTM G173-03
   */
  STC_AIR_MASS: 1.5,
} as const;

/**
 * Type for PV constants object
 */
export type PVConstantsType = typeof PV_CONSTANTS;

/**
 * Calculate temperature-dependent silicon bandgap
 *
 * Uses the Varshni equation:
 * E_g(T) = E_g(0) - α*T²/(T + β)
 *
 * @param temperatureCelsius - Temperature [°C]
 * @returns Bandgap energy [eV]
 *
 * @reference
 * - Varshni, Y.P. (1967). Physica, 34(1), 149-154.
 * - Sze, S.M. (2007). Physics of Semiconductor Devices.
 *
 * @example
 * ```typescript
 * const Eg25 = calculateBandgap(25);  // ≈ 1.12 eV
 * const Eg50 = calculateBandgap(50);  // ≈ 1.10 eV
 * ```
 */
export function calculateBandgap(temperatureCelsius: number): number {
  const T_K = temperatureCelsius + 273.15;
  const { BANDGAP_SI_0K, VARSHNI_ALPHA_SI, VARSHNI_BETA_SI } = PV_CONSTANTS;

  return BANDGAP_SI_0K - (VARSHNI_ALPHA_SI * T_K * T_K) / (T_K + VARSHNI_BETA_SI);
}

/**
 * Calculate thermal voltage
 *
 * V_t = k * T / q
 *
 * This is the voltage equivalent of thermal energy at temperature T.
 * At 25°C: V_t ≈ 25.69 mV
 *
 * @param temperatureCelsius - Temperature [°C]
 * @returns Thermal voltage [V]
 *
 * @reference
 * Fundamental semiconductor physics
 *
 * @example
 * ```typescript
 * const Vt = calculateThermalVoltage(25);  // ≈ 0.02569 V
 * ```
 */
export function calculateThermalVoltage(temperatureCelsius: number): number {
  const T_K = temperatureCelsius + 273.15;
  return (PV_CONSTANTS.BOLTZMANN * T_K) / PV_CONSTANTS.ELECTRON_CHARGE;
}

/**
 * Calculate cell temperature from ambient conditions using NOCT
 *
 * T_cell = T_ambient + (NOCT - 20) * G / 800
 *
 * This is a simplified linear model. More accurate models consider
 * wind speed and mounting configuration.
 *
 * @param ambientTemperature - Ambient temperature [°C]
 * @param irradiance - Plane of array irradiance [W/m²]
 * @param noct - Nominal Operating Cell Temperature [°C], default 45°C
 * @returns Estimated cell temperature [°C]
 *
 * @reference
 * - King, D.L., et al. (2004). Sandia Photovoltaic Array Performance Model.
 *   SAND2004-3535, Eq. 2.
 *
 * @example
 * ```typescript
 * const Tcell = estimateCellTemperature(25, 1000);  // ≈ 56.25°C
 * ```
 */
export function estimateCellTemperature(
  ambientTemperature: number,
  irradiance: number,
  noct: number = PV_CONSTANTS.DEFAULT_NOCT
): number {
  if (irradiance <= 0) {
    return ambientTemperature;
  }

  const { NOCT_AMBIENT, NOCT_IRRADIANCE } = PV_CONSTANTS;
  return ambientTemperature + ((noct - NOCT_AMBIENT) * irradiance) / NOCT_IRRADIANCE;
}
