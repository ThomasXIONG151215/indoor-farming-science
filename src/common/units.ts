/**
 * Unit Conversion Utilities for Indoor Farming Science Models
 *
 * @description
 * Functions for converting between different units commonly used
 * in building physics, HVAC, and plant physiology calculations.
 */

import {
  KELVIN_OFFSET,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  W_TO_KW,
  KW_TO_W,
  J_TO_MJ,
  MJ_TO_J,
  PA_TO_KPA,
  KPA_TO_PA,
  LATENT_HEAT_VAPORIZATION,
  WATER_DENSITY,
} from './constants';

// ============================================================================
// Temperature Conversions
// ============================================================================

/**
 * Convert Celsius to Kelvin
 * @param celsius Temperature in °C
 * @returns Temperature in K
 */
export function celsiusToKelvin(celsius: number): number {
  return celsius + KELVIN_OFFSET;
}

/**
 * Convert Kelvin to Celsius
 * @param kelvin Temperature in K
 * @returns Temperature in °C
 */
export function kelvinToCelsius(kelvin: number): number {
  return kelvin - KELVIN_OFFSET;
}

/**
 * Convert Celsius to Fahrenheit
 * @param celsius Temperature in °C
 * @returns Temperature in °F
 */
export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

/**
 * Convert Fahrenheit to Celsius
 * @param fahrenheit Temperature in °F
 * @returns Temperature in °C
 */
export function fahrenheitToCelsius(fahrenheit: number): number {
  return ((fahrenheit - 32) * 5) / 9;
}

// ============================================================================
// Pressure Conversions
// ============================================================================

/**
 * Convert Pascal to kiloPascal
 * @param pa Pressure in Pa
 * @returns Pressure in kPa
 */
export function paToKpa(pa: number): number {
  return pa * PA_TO_KPA;
}

/**
 * Convert kiloPascal to Pascal
 * @param kpa Pressure in kPa
 * @returns Pressure in Pa
 */
export function kpaToPa(kpa: number): number {
  return kpa * KPA_TO_PA;
}

/**
 * Convert bar to Pascal
 * @param bar Pressure in bar
 * @returns Pressure in Pa
 */
export function barToPa(bar: number): number {
  return bar * 100000;
}

/**
 * Convert Pascal to bar
 * @param pa Pressure in Pa
 * @returns Pressure in bar
 */
export function paToBar(pa: number): number {
  return pa / 100000;
}

/**
 * Convert mmHg to Pascal
 * @param mmhg Pressure in mmHg
 * @returns Pressure in Pa
 */
export function mmhgToPa(mmhg: number): number {
  return mmhg * 133.322;
}

/**
 * Convert Pascal to mmHg
 * @param pa Pressure in Pa
 * @returns Pressure in mmHg
 */
export function paToMmhg(pa: number): number {
  return pa / 133.322;
}

// ============================================================================
// Power and Energy Conversions
// ============================================================================

/**
 * Convert Watts to kilowatts
 * @param w Power in W
 * @returns Power in kW
 */
export function wToKw(w: number): number {
  return w * W_TO_KW;
}

/**
 * Convert kilowatts to Watts
 * @param kw Power in kW
 * @returns Power in W
 */
export function kwToW(kw: number): number {
  return kw * KW_TO_W;
}

/**
 * Convert Joules to MegaJoules
 * @param j Energy in J
 * @returns Energy in MJ
 */
export function jToMj(j: number): number {
  return j * J_TO_MJ;
}

/**
 * Convert MegaJoules to Joules
 * @param mj Energy in MJ
 * @returns Energy in J
 */
export function mjToJ(mj: number): number {
  return mj * MJ_TO_J;
}

/**
 * Convert kWh to Joules
 * @param kwh Energy in kWh
 * @returns Energy in J
 */
export function kwhToJ(kwh: number): number {
  return kwh * 3.6e6;
}

/**
 * Convert Joules to kWh
 * @param j Energy in J
 * @returns Energy in kWh
 */
export function jToKwh(j: number): number {
  return j / 3.6e6;
}

/**
 * Convert BTU to Joules
 * @param btu Energy in BTU
 * @returns Energy in J
 */
export function btuToJ(btu: number): number {
  return btu * 1055.06;
}

/**
 * Convert Joules to BTU
 * @param j Energy in J
 * @returns Energy in BTU
 */
export function jToBtu(j: number): number {
  return j / 1055.06;
}

// ============================================================================
// Length Conversions
// ============================================================================

/**
 * Convert millimeters to meters
 * @param mm Length in mm
 * @returns Length in m
 */
export function mmToM(mm: number): number {
  return mm / 1000;
}

/**
 * Convert meters to millimeters
 * @param m Length in m
 * @returns Length in mm
 */
export function mToMm(m: number): number {
  return m * 1000;
}

/**
 * Convert centimeters to meters
 * @param cm Length in cm
 * @returns Length in m
 */
export function cmToM(cm: number): number {
  return cm / 100;
}

/**
 * Convert meters to centimeters
 * @param m Length in m
 * @returns Length in cm
 */
export function mToCm(m: number): number {
  return m * 100;
}

/**
 * Convert inches to meters
 * @param inches Length in inches
 * @returns Length in m
 */
export function inchesToM(inches: number): number {
  return inches * 0.0254;
}

/**
 * Convert meters to inches
 * @param m Length in m
 * @returns Length in inches
 */
export function mToInches(m: number): number {
  return m / 0.0254;
}

/**
 * Convert feet to meters
 * @param feet Length in feet
 * @returns Length in m
 */
export function feetToM(feet: number): number {
  return feet * 0.3048;
}

/**
 * Convert meters to feet
 * @param m Length in m
 * @returns Length in feet
 */
export function mToFeet(m: number): number {
  return m / 0.3048;
}

// ============================================================================
// Flow Rate Conversions
// ============================================================================

/**
 * Convert m³/s to L/s
 * @param m3s Flow rate in m³/s
 * @returns Flow rate in L/s
 */
export function m3sToLs(m3s: number): number {
  return m3s * 1000;
}

/**
 * Convert L/s to m³/s
 * @param ls Flow rate in L/s
 * @returns Flow rate in m³/s
 */
export function lsToM3s(ls: number): number {
  return ls / 1000;
}

/**
 * Convert m³/h to m³/s
 * @param m3h Flow rate in m³/h
 * @returns Flow rate in m³/s
 */
export function m3hToM3s(m3h: number): number {
  return m3h / SECONDS_PER_HOUR;
}

/**
 * Convert m³/s to m³/h
 * @param m3s Flow rate in m³/s
 * @returns Flow rate in m³/h
 */
export function m3sToM3h(m3s: number): number {
  return m3s * SECONDS_PER_HOUR;
}

/**
 * Convert CFM (ft³/min) to m³/s
 * @param cfm Flow rate in CFM
 * @returns Flow rate in m³/s
 */
export function cfmToM3s(cfm: number): number {
  return cfm * 0.000471947;
}

/**
 * Convert m³/s to CFM
 * @param m3s Flow rate in m³/s
 * @returns Flow rate in CFM
 */
export function m3sToCfm(m3s: number): number {
  return m3s / 0.000471947;
}

// ============================================================================
// Transpiration Rate Conversions
// ============================================================================

/**
 * Convert transpiration from kg/(m²·s) to mm/h
 * Water: 1 kg/m² = 1 mm depth
 * @param kgPerM2s Transpiration rate in kg/(m²·s)
 * @returns Transpiration rate in mm/h
 */
export function transpirationMassToMmPerHour(kgPerM2s: number): number {
  return kgPerM2s * SECONDS_PER_HOUR;
}

/**
 * Convert transpiration from mm/h to kg/(m²·s)
 * @param mmPerH Transpiration rate in mm/h
 * @returns Transpiration rate in kg/(m²·s)
 */
export function transpirationMmPerHourToMass(mmPerH: number): number {
  return mmPerH / SECONDS_PER_HOUR;
}

/**
 * Convert transpiration from kg/(m²·s) to L/(m²·day)
 * @param kgPerM2s Transpiration rate in kg/(m²·s)
 * @returns Transpiration rate in L/(m²·day)
 */
export function transpirationMassToLPerM2Day(kgPerM2s: number): number {
  return kgPerM2s * SECONDS_PER_DAY;
}

/**
 * Convert transpiration from mm/day to kg/(m²·s)
 * @param mmPerDay Transpiration rate in mm/day
 * @returns Transpiration rate in kg/(m²·s)
 */
export function transpirationMmPerDayToMass(mmPerDay: number): number {
  return mmPerDay / SECONDS_PER_DAY;
}

/**
 * Convert latent heat flux to transpiration rate
 * @param latentHeatFlux Latent heat flux in W/m²
 * @param latentHeat Latent heat of vaporization in J/kg (default 2.45e6)
 * @returns Transpiration rate in kg/(m²·s)
 */
export function latentHeatFluxToTranspiration(
  latentHeatFlux: number,
  latentHeat: number = LATENT_HEAT_VAPORIZATION
): number {
  return latentHeatFlux / latentHeat;
}

/**
 * Convert transpiration rate to latent heat flux
 * @param transpirationRate Transpiration rate in kg/(m²·s)
 * @param latentHeat Latent heat of vaporization in J/kg (default 2.45e6)
 * @returns Latent heat flux in W/m²
 */
export function transpirationToLatentHeatFlux(
  transpirationRate: number,
  latentHeat: number = LATENT_HEAT_VAPORIZATION
): number {
  return transpirationRate * latentHeat;
}

// ============================================================================
// Radiation Conversions
// ============================================================================

/**
 * Convert PPFD (μmol/m²/s) to PAR (W/m²)
 * @param ppfd PPFD in μmol/(m²·s)
 * @param conversionFactor Conversion factor (default 4.57 for typical spectrum)
 * @returns PAR in W/m²
 */
export function ppfdToPar(ppfd: number, conversionFactor: number = 4.57): number {
  return ppfd / conversionFactor;
}

/**
 * Convert PAR (W/m²) to PPFD (μmol/m²/s)
 * @param par PAR in W/m²
 * @param conversionFactor Conversion factor (default 4.57 for typical spectrum)
 * @returns PPFD in μmol/(m²·s)
 */
export function parToPpfd(par: number, conversionFactor: number = 4.57): number {
  return par * conversionFactor;
}

/**
 * Convert daily solar radiation from MJ/(m²·day) to W/m² average
 * @param mjPerM2Day Daily radiation in MJ/(m²·day)
 * @returns Average power in W/m²
 */
export function dailySolarToWm2(mjPerM2Day: number): number {
  return (mjPerM2Day * MJ_TO_J) / SECONDS_PER_DAY;
}

/**
 * Convert W/m² average to daily solar radiation MJ/(m²·day)
 * @param wm2 Average power in W/m²
 * @returns Daily radiation in MJ/(m²·day)
 */
export function wm2ToDailySolar(wm2: number): number {
  return (wm2 * SECONDS_PER_DAY) * J_TO_MJ;
}

// ============================================================================
// Thermal Resistance/Conductance Conversions
// ============================================================================

/**
 * Convert thermal conductivity to thermal resistance for a layer
 * R = thickness / conductivity
 * @param thickness Layer thickness in m
 * @param conductivity Thermal conductivity in W/(m·K)
 * @returns Thermal resistance in (m²·K)/W
 */
export function conductivityToResistance(thickness: number, conductivity: number): number {
  if (conductivity <= 0) {
    throw new Error('Thermal conductivity must be positive');
  }
  return thickness / conductivity;
}

/**
 * Convert thermal resistance to U-value
 * U = 1 / R_total
 * @param totalResistance Total thermal resistance in (m²·K)/W
 * @returns U-value in W/(m²·K)
 */
export function resistanceToUValue(totalResistance: number): number {
  if (totalResistance <= 0) {
    throw new Error('Thermal resistance must be positive');
  }
  return 1 / totalResistance;
}

/**
 * Convert U-value to thermal resistance
 * R = 1 / U
 * @param uValue U-value in W/(m²·K)
 * @returns Thermal resistance in (m²·K)/W
 */
export function uValueToResistance(uValue: number): number {
  if (uValue <= 0) {
    throw new Error('U-value must be positive');
  }
  return 1 / uValue;
}

/**
 * Convert R-value (imperial) to metric thermal resistance
 * R_SI = R_IP × 0.1761
 * @param rValueImperial R-value in (ft²·°F·h)/BTU
 * @returns Thermal resistance in (m²·K)/W
 */
export function rValueImperialToMetric(rValueImperial: number): number {
  return rValueImperial * 0.1761;
}

/**
 * Convert metric thermal resistance to R-value (imperial)
 * R_IP = R_SI / 0.1761
 * @param rValueMetric Thermal resistance in (m²·K)/W
 * @returns R-value in (ft²·°F·h)/BTU
 */
export function rValueMetricToImperial(rValueMetric: number): number {
  return rValueMetric / 0.1761;
}

// ============================================================================
// Humidity Conversions
// ============================================================================

/**
 * Convert humidity ratio to specific humidity
 * q = w / (1 + w)
 * @param humidityRatio Humidity ratio in kg/kg
 * @returns Specific humidity in kg/kg
 */
export function humidityRatioToSpecific(humidityRatio: number): number {
  return humidityRatio / (1 + humidityRatio);
}

/**
 * Convert specific humidity to humidity ratio
 * w = q / (1 - q)
 * @param specificHumidity Specific humidity in kg/kg
 * @returns Humidity ratio in kg/kg
 */
export function specificToHumidityRatio(specificHumidity: number): number {
  return specificHumidity / (1 - specificHumidity);
}

/**
 * Convert vapor concentration (g/m³) to humidity ratio at given conditions
 * @param vaporConcentration Vapor concentration in g/m³
 * @param airDensity Air density in kg/m³ (default 1.2)
 * @returns Humidity ratio in kg/kg
 */
export function vaporConcentrationToHumidityRatio(
  vaporConcentration: number,
  airDensity: number = 1.2
): number {
  return (vaporConcentration / 1000) / airDensity;
}
