/**
 * Psychrometric Calculations for Transpiration Models
 *
 * @description
 * Core psychrometric functions used by all transpiration models.
 * Based on ASHRAE Handbook and FAO-56 equations.
 *
 * @references
 * - Allen, R.G., et al. (1998). FAO Irrigation and drainage paper No. 56.
 * - ASHRAE Handbook - Fundamentals (2021)
 */

import {
  LATENT_HEAT_VAPORIZATION,
  LATENT_HEAT_VAPORIZATION_0C,
  LATENT_HEAT_TEMP_COEFF,
  PSYCHROMETRIC_CONSTANT,
  SPECIFIC_HEAT_AIR,
  AIR_DENSITY_STANDARD,
  ATMOSPHERIC_PRESSURE_STANDARD,
  WATER_AIR_MOLECULAR_RATIO,
  KELVIN_OFFSET,
} from '../../common/constants';
import type { VpdResult } from '../../common/types';

/**
 * Calculate saturation vapor pressure using Tetens equation
 *
 * @equation
 * ```
 * e_s = 0.6108 × exp(17.27 × T / (T + 237.3))   [kPa]
 * ```
 *
 * @param temperature Air temperature in °C
 * @returns Saturation vapor pressure in kPa
 *
 * @reference FAO-56, Equation 11
 */
export function saturationVaporPressure(temperature: number): number {
  return 0.6108 * Math.exp((17.27 * temperature) / (temperature + 237.3));
}

/**
 * Calculate saturation vapor pressure using more accurate Magnus formula
 *
 * @equation
 * ```
 * e_s = 0.61121 × exp((18.678 - T/234.5) × (T / (257.14 + T)))   [kPa]
 * ```
 *
 * @param temperature Air temperature in °C
 * @returns Saturation vapor pressure in kPa
 *
 * @reference Buck (1981) - Journal of Applied Meteorology
 */
export function saturationVaporPressureBuck(temperature: number): number {
  return 0.61121 * Math.exp((18.678 - temperature / 234.5) * (temperature / (257.14 + temperature)));
}

/**
 * Calculate actual vapor pressure from relative humidity
 *
 * @equation
 * ```
 * e_a = e_s × (RH / 100)
 * ```
 *
 * @param saturationPressure Saturation vapor pressure in kPa
 * @param relativeHumidity Relative humidity in %
 * @returns Actual vapor pressure in kPa
 */
export function actualVaporPressure(saturationPressure: number, relativeHumidity: number): number {
  return saturationPressure * (relativeHumidity / 100);
}

/**
 * Calculate slope of saturation vapor pressure curve (Δ)
 *
 * @equation
 * ```
 * Δ = 4098 × e_s / (T + 237.3)²   [kPa/°C]
 * ```
 *
 * @param temperature Air temperature in °C
 * @returns Slope in kPa/°C
 *
 * @reference FAO-56, Equation 13
 */
export function vaporPressureSlope(temperature: number): number {
  const es = saturationVaporPressure(temperature);
  return (4098 * es) / Math.pow(temperature + 237.3, 2);
}

/**
 * Calculate vapor pressure deficit (VPD)
 *
 * @equation
 * ```
 * VPD = e_s - e_a = e_s × (1 - RH/100)   [kPa]
 * ```
 *
 * @param temperature Air temperature in °C
 * @param relativeHumidity Relative humidity in %
 * @returns VPD calculation result
 */
export function calculateVpd(temperature: number, relativeHumidity: number): VpdResult {
  const es = saturationVaporPressure(temperature);
  const ea = actualVaporPressure(es, relativeHumidity);
  const vpd = es - ea;
  const delta = vaporPressureSlope(temperature);

  return {
    saturationVaporPressure: es,
    actualVaporPressure: ea,
    vpd,
    vaporPressureSlope: delta,
  };
}

/**
 * Calculate psychrometric constant adjusted for altitude/pressure
 *
 * @equation
 * ```
 * γ = (Cp × P) / (ε × λ) = 0.000665 × P   [kPa/°C]
 * ```
 *
 * @param atmosphericPressure Atmospheric pressure in kPa (default 101.325)
 * @returns Psychrometric constant in kPa/°C
 *
 * @reference FAO-56, Equation 8
 */
export function psychrometricConstant(
  atmosphericPressure: number = ATMOSPHERIC_PRESSURE_STANDARD
): number {
  return 0.000665 * atmosphericPressure;
}

/**
 * Calculate air density from temperature and pressure
 *
 * @equation
 * ```
 * ρ = P / (R_d × T_K) × (1 - 0.378 × e_a / P)
 * ```
 *
 * Simplified for dry air:
 * ```
 * ρ = 3.486 × P / T_K   [kg/m³]
 * ```
 *
 * @param temperature Air temperature in °C
 * @param atmosphericPressure Atmospheric pressure in kPa (default 101.325)
 * @returns Air density in kg/m³
 *
 * @reference FAO-56, Appendix 3
 */
export function airDensity(
  temperature: number,
  atmosphericPressure: number = ATMOSPHERIC_PRESSURE_STANDARD
): number {
  const temperatureK = temperature + KELVIN_OFFSET;
  return (3.486 * atmosphericPressure) / temperatureK;
}

/**
 * Calculate latent heat of vaporization at given temperature
 *
 * @equation
 * ```
 * λ = 2.501 - 0.002361 × T   [MJ/kg]
 * λ = (2.501 - 0.002361 × T) × 10⁶   [J/kg]
 * ```
 *
 * @param temperature Air temperature in °C
 * @returns Latent heat of vaporization in J/kg
 *
 * @reference Henderson-Sellers (1984)
 */
export function latentHeatOfVaporization(temperature: number): number {
  return LATENT_HEAT_VAPORIZATION_0C - LATENT_HEAT_TEMP_COEFF * temperature;
}

/**
 * Calculate humidity ratio (mixing ratio) from vapor pressure
 *
 * @equation
 * ```
 * w = ε × e_a / (P - e_a) = 0.622 × e_a / (P - e_a)   [kg/kg]
 * ```
 *
 * @param vaporPressure Vapor pressure in kPa
 * @param atmosphericPressure Atmospheric pressure in kPa
 * @returns Humidity ratio in kg water / kg dry air
 *
 * @reference ASHRAE Handbook - Fundamentals
 */
export function humidityRatio(
  vaporPressure: number,
  atmosphericPressure: number = ATMOSPHERIC_PRESSURE_STANDARD
): number {
  return (WATER_AIR_MOLECULAR_RATIO * vaporPressure) / (atmosphericPressure - vaporPressure);
}

/**
 * Calculate specific enthalpy of moist air
 *
 * @equation
 * ```
 * h = Cp_a × T + w × (2501 + 1.84 × T)   [kJ/kg]
 * ```
 *
 * @param temperature Air temperature in °C
 * @param humidityRatioValue Humidity ratio in kg/kg
 * @returns Specific enthalpy in kJ/kg dry air
 *
 * @reference ASHRAE Handbook - Fundamentals
 */
export function specificEnthalpy(temperature: number, humidityRatioValue: number): number {
  const cpAir = 1.006; // kJ/(kg·K) for dry air
  const cpVapor = 1.84; // kJ/(kg·K) for water vapor
  const latentHeatKj = 2501; // kJ/kg at 0°C

  return cpAir * temperature + humidityRatioValue * (latentHeatKj + cpVapor * temperature);
}

/**
 * Calculate vapor concentration (absolute humidity) from temperature and RH
 *
 * @equation
 * ```
 * χ = (e_a × M_w) / (R × T_K) × 1000   [g/m³]
 * ```
 *
 * Simplified:
 * ```
 * χ = 2165 × e_a / T_K   [g/m³]
 * ```
 *
 * @param temperature Air temperature in °C
 * @param relativeHumidity Relative humidity in %
 * @returns Vapor concentration in g/m³
 *
 * @reference Graamans et al. (2017)
 */
export function vaporConcentration(temperature: number, relativeHumidity: number): number {
  const es = saturationVaporPressure(temperature);
  const ea = actualVaporPressure(es, relativeHumidity);
  const temperatureK = temperature + KELVIN_OFFSET;
  return (2165 * ea) / temperatureK;
}

/**
 * Calculate saturation vapor concentration at given temperature
 *
 * @param temperature Air temperature in °C
 * @returns Saturation vapor concentration in g/m³
 */
export function saturationVaporConcentration(temperature: number): number {
  const es = saturationVaporPressure(temperature);
  const temperatureK = temperature + KELVIN_OFFSET;
  return (2165 * es) / temperatureK;
}

/**
 * Calculate dew point temperature
 *
 * @equation
 * ```
 * T_d = (237.3 × ln(e_a / 0.6108)) / (17.27 - ln(e_a / 0.6108))   [°C]
 * ```
 *
 * @param vaporPressure Actual vapor pressure in kPa
 * @returns Dew point temperature in °C
 *
 * @reference Lawrence (2005) - Bulletin of the American Meteorological Society
 */
export function dewPointTemperature(vaporPressure: number): number {
  const ln_ratio = Math.log(vaporPressure / 0.6108);
  return (237.3 * ln_ratio) / (17.27 - ln_ratio);
}

/**
 * Calculate wet bulb temperature (approximation)
 *
 * @param temperature Air temperature in °C
 * @param relativeHumidity Relative humidity in %
 * @returns Wet bulb temperature in °C (approximation)
 *
 * @reference Stull (2011) - Journal of Applied Meteorology and Climatology
 */
export function wetBulbTemperature(temperature: number, relativeHumidity: number): number {
  // Stull formula (valid for RH > 5%)
  return (
    temperature * Math.atan(0.151977 * Math.sqrt(relativeHumidity + 8.313659)) +
    Math.atan(temperature + relativeHumidity) -
    Math.atan(relativeHumidity - 1.676331) +
    0.00391838 * Math.pow(relativeHumidity, 1.5) * Math.atan(0.023101 * relativeHumidity) -
    4.686035
  );
}
