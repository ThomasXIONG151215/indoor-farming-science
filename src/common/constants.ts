/**
 * Physical Constants for Indoor Farming Science Models
 *
 * @description
 * Scientifically-validated physical constants used across all modules.
 * All values are based on peer-reviewed literature and standard references.
 *
 * @references
 * - ASHRAE Handbook - Fundamentals (2021)
 * - Allen, R.G., et al. (1998). FAO Irrigation and drainage paper No. 56.
 * - Graamans, L., et al. (2017). Plant factories; crop transpiration and energy balance.
 * - Monteith, J.L. & Unsworth, M.H. (2013). Principles of Environmental Physics.
 */

// ============================================================================
// Thermodynamic Constants
// ============================================================================

/**
 * Latent heat of vaporization of water at 20°C
 * @unit J/kg
 * @reference ASHRAE Handbook, Table 6
 */
export const LATENT_HEAT_VAPORIZATION = 2.45e6;

/**
 * Latent heat of vaporization at 0°C
 * @unit J/kg
 */
export const LATENT_HEAT_VAPORIZATION_0C = 2.501e6;

/**
 * Temperature coefficient for latent heat
 * λ(T) = λ₀ - 2361 × T
 * @unit J/(kg·°C)
 */
export const LATENT_HEAT_TEMP_COEFF = 2361;

/**
 * Psychrometric constant at standard atmospheric pressure (101.325 kPa)
 * γ = (Cp × P) / (ε × λ)
 * @unit kPa/°C
 * @reference FAO-56, Equation 8
 */
export const PSYCHROMETRIC_CONSTANT = 0.0665;

/**
 * Psychrometric constant (alternative notation)
 * @unit Pa/K
 * @reference Graamans et al. (2017), symbol table
 */
export const PSYCHROMETRIC_CONSTANT_PA = 66.5;

/**
 * Specific heat of dry air at constant pressure
 * @unit J/(kg·K)
 * @reference ASHRAE Handbook
 */
export const SPECIFIC_HEAT_AIR = 1013;

/**
 * Specific heat of dry air (kJ units)
 * @unit kJ/(kg·K)
 */
export const SPECIFIC_HEAT_AIR_KJ = 1.013;

/**
 * Specific heat of water vapor at constant pressure
 * @unit J/(kg·K)
 */
export const SPECIFIC_HEAT_WATER_VAPOR = 1840;

/**
 * Air density at standard conditions (20°C, 101.325 kPa)
 * @unit kg/m³
 */
export const AIR_DENSITY_STANDARD = 1.2;

/**
 * Water density at standard conditions (20°C)
 * @unit kg/m³
 */
export const WATER_DENSITY = 998.2;

/**
 * Stefan-Boltzmann constant
 * @unit W/(m²·K⁴)
 */
export const STEFAN_BOLTZMANN = 5.67e-8;

/**
 * Stefan-Boltzmann constant (MJ units for FAO-56)
 * @unit MJ/(K⁴·m²·day)
 */
export const STEFAN_BOLTZMANN_MJ = 4.903e-9;

/**
 * Universal gas constant
 * @unit J/(mol·K)
 */
export const GAS_CONSTANT = 8.314;

/**
 * Molar mass of water
 * @unit kg/mol
 */
export const MOLAR_MASS_WATER = 0.018015;

/**
 * Molar mass of dry air
 * @unit kg/mol
 */
export const MOLAR_MASS_AIR = 0.02897;

/**
 * Ratio of molecular weight of water vapor to dry air (ε)
 * @unit dimensionless
 */
export const WATER_AIR_MOLECULAR_RATIO = 0.622;

// ============================================================================
// Atmospheric Constants
// ============================================================================

/**
 * Standard atmospheric pressure at sea level
 * @unit kPa
 */
export const ATMOSPHERIC_PRESSURE_STANDARD = 101.325;

/**
 * Standard atmospheric pressure
 * @unit Pa
 */
export const ATMOSPHERIC_PRESSURE_PA = 101325;

/**
 * Atmospheric CO2 concentration (baseline)
 * @unit ppm
 * @reference Approximate 2025 value
 */
export const CO2_ATMOSPHERIC_BASELINE = 420;

/**
 * O2 concentration in atmosphere
 * @unit μmol/mol
 */
export const O2_CONCENTRATION = 210000;

// ============================================================================
// Radiation Constants
// ============================================================================

/**
 * Solar constant (extraterrestrial radiation)
 * @unit W/m²
 */
export const SOLAR_CONSTANT = 1361;

/**
 * PAR fraction of total solar radiation
 * Photosynthetically Active Radiation (400-700nm) / Total Solar
 * @unit dimensionless
 */
export const PAR_FRACTION = 0.45;

/**
 * PPFD to PAR conversion factor
 * @unit W·m⁻²/(μmol·m⁻²·s⁻¹)
 * @reference Graamans et al. (2017)
 */
export const PPFD_TO_PAR_CONVERSION = 4.57;

/**
 * Typical albedo for vegetation
 * @unit dimensionless
 */
export const ALBEDO_VEGETATION = 0.23;

/**
 * PAR reflection coefficient for lettuce
 * @unit dimensionless
 * @reference Graamans et al. (2017)
 */
export const PAR_REFLECTION_LETTUCE = 0.065;

// ============================================================================
// Plant Physiology Constants
// ============================================================================

/**
 * Stomatal resistance minimum (well-watered, high light)
 * @unit s/m
 * @reference Stanghellini (1987)
 */
export const STOMATAL_RESISTANCE_MIN = 100;

/**
 * Stomatal resistance maximum (stressed/dark)
 * @unit s/m
 */
export const STOMATAL_RESISTANCE_MAX = 1000;

/**
 * Dark period stomatal resistance
 * @unit s/m
 * @reference Graamans et al. (2017), Equation 9
 */
export const STOMATAL_RESISTANCE_DARK = 450;

/**
 * Graamans stomatal resistance base value
 * r_s = 60 × (1500 + PPFD) / (200 + PPFD)
 * @unit s/m
 * @reference Graamans et al. (2017), Equation 9
 */
export const GRAAMANS_RS_BASE = 60;

/**
 * PPFD saturation point for stomatal response
 * @unit μmol/m²/s
 */
export const PPFD_SATURATION = 1500;

/**
 * PPFD response threshold for stomatal model
 * @unit μmol/m²/s
 */
export const PPFD_RESPONSE_THRESHOLD = 200;

/**
 * Aerodynamic resistance for forced circulation (PFAL)
 * @unit s/m
 * @reference Graamans et al. (2017)
 */
export const AERODYNAMIC_RESISTANCE_FORCED = 100;

/**
 * Aerodynamic resistance for free convection (PFAL)
 * @unit s/m
 */
export const AERODYNAMIC_RESISTANCE_FREE = 200;

/**
 * Typical boundary layer resistance (CEA)
 * @unit s/m
 * @reference Stanghellini (1987)
 */
export const BOUNDARY_LAYER_RESISTANCE = 150;

/**
 * Cultivation area cover ratio (typical PFAL)
 * @unit dimensionless
 */
export const CULTIVATION_AREA_COVER = 0.90;

// ============================================================================
// Photosynthesis Constants (Farquhar FvCB Model)
// ============================================================================

/**
 * Maximum carboxylation rate at 25°C
 * @unit μmol/(m²·s)
 * @reference Farquhar et al. (1980)
 */
export const VCMAX_25 = 60.0;

/**
 * Maximum electron transport rate at 25°C
 * @unit μmol/(m²·s)
 */
export const JMAX_25 = 100.0;

/**
 * CO2 Michaelis-Menten constant at 25°C
 * @unit μmol/mol
 */
export const KC_25 = 404.0;

/**
 * O2 Michaelis-Menten constant at 25°C
 * @unit μmol/mol
 */
export const KO_25 = 248000.0;

/**
 * CO2 compensation point at 25°C
 * @unit μmol/mol
 */
export const GAMMA_STAR_25 = 42.75;

/**
 * Dark respiration rate at 25°C
 * @unit μmol/(m²·s)
 */
export const RD_25 = 1.0;

/**
 * Quantum yield of electron transport
 * @unit mol e⁻/mol photons
 */
export const QUANTUM_YIELD = 0.24;

/**
 * Curvature factor for light response
 * @unit dimensionless
 */
export const LIGHT_RESPONSE_CURVATURE = 0.7;

/**
 * Ball-Berry slope parameter
 * @unit dimensionless
 */
export const BALL_BERRY_SLOPE = 9.0;

/**
 * Minimum stomatal conductance (Ball-Berry)
 * @unit mol/(m²·s)
 */
export const STOMATAL_CONDUCTANCE_MIN = 0.01;

// ============================================================================
// Temperature Response Q10 Values
// ============================================================================

/**
 * Q10 for Vcmax temperature response
 * @unit dimensionless
 */
export const Q10_VCMAX = 2.4;

/**
 * Q10 for Jmax temperature response
 * @unit dimensionless
 */
export const Q10_JMAX = 2.0;

/**
 * Q10 for dark respiration
 * @unit dimensionless
 */
export const Q10_RD = 2.0;

/**
 * Q10 for Kc temperature response
 * @unit dimensionless
 */
export const Q10_KC = 2.1;

/**
 * Q10 for Ko temperature response
 * @unit dimensionless
 */
export const Q10_KO = 1.2;

/**
 * Q10 for Gamma* temperature response
 * @unit dimensionless
 */
export const Q10_GAMMA_STAR = 1.75;

// ============================================================================
// Building Thermal Constants
// ============================================================================

/**
 * Inside surface convection coefficient (still air, horizontal heat flow)
 * @unit W/(m²·K)
 * @reference ISO 6946
 */
export const CONVECTION_COEFF_INSIDE = 7.7;

/**
 * Outside surface convection coefficient (wind 4m/s)
 * @unit W/(m²·K)
 * @reference ISO 6946
 */
export const CONVECTION_COEFF_OUTSIDE = 25.0;

/**
 * Inside surface resistance (horizontal heat flow)
 * @unit (m²·K)/W
 */
export const SURFACE_RESISTANCE_INSIDE = 0.13;

/**
 * Outside surface resistance (wind 4m/s)
 * @unit (m²·K)/W
 */
export const SURFACE_RESISTANCE_OUTSIDE = 0.04;

/**
 * Absolute zero in Celsius
 * @unit °C
 */
export const ABSOLUTE_ZERO_C = -273.15;

/**
 * Kelvin offset for temperature conversion
 * @unit K
 */
export const KELVIN_OFFSET = 273.15;

// ============================================================================
// Unit Conversion Constants
// ============================================================================

/**
 * Seconds per hour
 */
export const SECONDS_PER_HOUR = 3600;

/**
 * Seconds per day
 */
export const SECONDS_PER_DAY = 86400;

/**
 * Hours per day
 */
export const HOURS_PER_DAY = 24;

/**
 * Minutes per hour
 */
export const MINUTES_PER_HOUR = 60;

/**
 * Watts to kilowatts conversion
 */
export const W_TO_KW = 0.001;

/**
 * Kilowatts to watts conversion
 */
export const KW_TO_W = 1000;

/**
 * Joules to MJ conversion
 */
export const J_TO_MJ = 1e-6;

/**
 * MJ to Joules conversion
 */
export const MJ_TO_J = 1e6;

/**
 * Pascal to kPa conversion
 */
export const PA_TO_KPA = 0.001;

/**
 * kPa to Pascal conversion
 */
export const KPA_TO_PA = 1000;
