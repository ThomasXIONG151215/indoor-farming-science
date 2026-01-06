/**
 * Shared Type Definitions for Indoor Farming Science Models
 *
 * @description
 * Common interfaces and types used across all modules.
 * Ensures consistent data structures throughout the library.
 */

// ============================================================================
// Environmental Parameters
// ============================================================================

/**
 * Basic environmental conditions
 */
export interface EnvironmentalConditions {
  /** Air temperature in Celsius */
  airTemperature: number;
  /** Relative humidity in percentage (0-100) */
  relativeHumidity: number;
  /** Atmospheric pressure in kPa (optional, default 101.325) */
  atmosphericPressure?: number;
}

/**
 * Extended environmental conditions with radiation
 */
export interface ExtendedEnvironmentalConditions extends EnvironmentalConditions {
  /** Net radiation in W/m² */
  netRadiation?: number;
  /** PPFD (Photosynthetic Photon Flux Density) in μmol/(m²·s) */
  ppfd?: number;
  /** CO2 concentration in ppm */
  co2Concentration?: number;
  /** Wind speed or air velocity in m/s */
  airVelocity?: number;
}

/**
 * Vapor pressure deficit (VPD) calculation result
 */
export interface VpdResult {
  /** Saturation vapor pressure in kPa */
  saturationVaporPressure: number;
  /** Actual vapor pressure in kPa */
  actualVaporPressure: number;
  /** Vapor pressure deficit in kPa */
  vpd: number;
  /** Slope of saturation vapor pressure curve in kPa/°C */
  vaporPressureSlope: number;
}

// ============================================================================
// Transpiration Types
// ============================================================================

/**
 * Input parameters for transpiration models
 */
export interface TranspirationInputs {
  /** Air temperature in Celsius */
  airTemperature: number;
  /** Relative humidity in percentage (0-100) */
  relativeHumidity: number;
  /** Net radiation in W/m² */
  netRadiation: number;
  /** Stomatal resistance in s/m */
  stomatalResistance: number;
  /** Aerodynamic resistance in s/m */
  aerodynamicResistance: number;
  /** Soil heat flux in W/m² (optional, default 0 for plant factories) */
  soilHeatFlux?: number;
  /** Vapor pressure deficit in kPa (optional, auto-calculated if not provided) */
  vpd?: number;
  /** Leaf area index (optional) */
  leafAreaIndex?: number;
}

/**
 * Output results from transpiration models
 */
export interface TranspirationOutputs {
  /** Transpiration rate in mm/h */
  transpirationRate: number;
  /** Mass transpiration rate in kg/(m²·s) */
  transpirationRateMass: number;
  /** Latent heat flux in W/m² */
  latentHeatFlux: number;
  /** Sensible heat flux in W/m² */
  sensibleHeatFlux: number;
  /** Water vapor flux in kg/(m²·s) */
  waterVaporFlux: number;
  /** Calculated VPD in kPa */
  vpdCalculated: number;
  /** Vapor pressure slope in kPa/°C */
  vaporPressureSlope: number;
  /** Model components for detailed analysis */
  modelComponents: {
    /** Radiation-driven term in W/m² */
    radiationTerm: number;
    /** Aerodynamic term in W/m² */
    aerodynamicTerm: number;
    /** Resistance ratio rs/ra */
    resistanceRatio: number;
  };
}

/**
 * PFAL-specific transpiration inputs
 */
export interface PfalTranspirationInputs extends TranspirationInputs {
  /** PPFD in μmol/(m²·s) */
  ppfd: number;
  /** Lighting type ('LED' | 'HPS') */
  lightingType?: 'LED' | 'HPS';
  /** Whether forced circulation is active */
  forcedCirculation?: boolean;
  /** Whether photoperiod is active (light on) */
  photoperiodActive?: boolean;
}

// ============================================================================
// Photosynthesis Types
// ============================================================================

/**
 * Input parameters for FvCB photosynthesis model
 */
export interface PhotosynthesisInputs {
  /** Air temperature in Celsius */
  airTemperature: number;
  /** PPFD in μmol/(m²·s) */
  ppfd: number;
  /** CO2 concentration in ppm (optional, default 400) */
  co2Concentration?: number;
  /** Relative humidity in percentage (optional, for stomatal conductance) */
  relativeHumidity?: number;
  /** Vcmax at 25°C in μmol/(m²·s) (optional, default 60) */
  vcmax25?: number;
  /** Jmax at 25°C in μmol/(m²·s) (optional, default 100) */
  jmax25?: number;
}

/**
 * Output results from photosynthesis models
 */
export interface PhotosynthesisOutputs {
  /** Net assimilation rate in μmol/(m²·s) */
  netAssimilation: number;
  /** Rubisco-limited rate in μmol/(m²·s) */
  rubiscoLimitedRate: number;
  /** RuBP-regeneration limited rate in μmol/(m²·s) */
  rubpLimitedRate: number;
  /** Dark respiration rate in μmol/(m²·s) */
  darkRespiration: number;
  /** Electron transport rate in μmol/(m²·s) */
  electronTransportRate: number;
  /** Stomatal conductance in mol/(m²·s) */
  stomatalConductance: number;
  /** Intercellular CO2 concentration in μmol/mol */
  intercellularCo2: number;
  /** Limiting factor ('rubisco' | 'light' | 'co-limited') */
  limitingFactor: 'rubisco' | 'light' | 'co-limited';
}

// ============================================================================
// Growth Model Types
// ============================================================================

/**
 * Growth degree day calculation inputs
 */
export interface GddInputs {
  /** Daily maximum temperature in °C */
  temperatureMax: number;
  /** Daily minimum temperature in °C */
  temperatureMin: number;
  /** Base temperature for crop in °C */
  baseTemperature: number;
  /** Upper cutoff temperature in °C (optional) */
  upperCutoff?: number;
}

/**
 * LAI-GDD model outputs
 */
export interface LaiGddOutputs {
  /** Current LAI value */
  leafAreaIndex: number;
  /** Cumulative GDD in °Cd */
  cumulativeGdd: number;
  /** Growth stage */
  growthStage: 'seedling' | 'vegetative' | 'mature';
  /** Days after planting */
  daysAfterPlanting: number;
  /** LAI development rate */
  laiDevelopmentRate: number;
}

// ============================================================================
// Building Thermal Types
// ============================================================================

/**
 * Wall layer definition
 */
export interface WallLayer {
  /** Layer name/identifier */
  name?: string;
  /** Material name or ID */
  material: string;
  /** Layer thickness in meters */
  thickness: number;
  /** Thermal conductivity in W/(m·K) (optional, from database) */
  thermalConductivity?: number;
  /** Density in kg/m³ (optional, for dynamic calculation) */
  density?: number;
  /** Specific heat in J/(kg·K) (optional, for dynamic calculation) */
  specificHeat?: number;
}

/**
 * Multi-layer wall calculation inputs
 */
export interface MultiLayerWallInputs {
  /** Array of wall layers (outside to inside) */
  layers: WallLayer[];
  /** Inside air temperature in °C */
  insideTemperature: number;
  /** Outside air temperature in °C */
  outsideTemperature: number;
  /** Inside surface convection coefficient in W/(m²·K) (optional) */
  insideConvection?: number;
  /** Outside surface convection coefficient in W/(m²·K) (optional) */
  outsideConvection?: number;
  /** Wall area in m² (optional, for total heat flow) */
  wallArea?: number;
}

/**
 * Multi-layer wall calculation outputs
 */
export interface MultiLayerWallOutputs {
  /** Overall U-value in W/(m²·K) */
  uValue: number;
  /** Total thermal resistance in (m²·K)/W */
  totalResistance: number;
  /** Heat flux through wall in W/m² */
  heatFlux: number;
  /** Total heat flow in W (if area provided) */
  totalHeatFlow?: number;
  /** Temperature at each interface in °C */
  interfaceTemperatures: number[];
  /** Thermal resistance of each component in (m²·K)/W */
  layerResistances: {
    outsideSurface: number;
    layers: number[];
    insideSurface: number;
  };
}

// ============================================================================
// Glass/Glazing Types
// ============================================================================

/**
 * Glass optical properties inputs
 */
export interface GlassOpticsInputs {
  /** Incident angle in degrees */
  incidentAngle: number;
  /** Refractive index of glass (default 1.52) */
  refractiveIndex?: number;
  /** Glass thickness in meters */
  thickness: number;
  /** Extinction coefficient in 1/m (optional) */
  extinctionCoefficient?: number;
  /** Number of panes */
  numberOfPanes?: number;
}

/**
 * Glass optical properties outputs
 */
export interface GlassOpticsOutputs {
  /** Total transmittance */
  transmittance: number;
  /** Total reflectance */
  reflectance: number;
  /** Total absorptance */
  absorptance: number;
  /** Solar heat gain coefficient */
  shgc: number;
  /** Fresnel reflection at each interface */
  fresnelComponents?: {
    parallelPolarization: number;
    perpendicularPolarization: number;
    average: number;
  };
}

// ============================================================================
// HVAC Equipment Types
// ============================================================================

/**
 * ERV (Energy Recovery Ventilator) inputs
 */
export interface ErvInputs {
  /** Supply air temperature in °C */
  supplyAirTemperature: number;
  /** Supply air humidity ratio in kg/kg */
  supplyAirHumidity: number;
  /** Exhaust air temperature in °C */
  exhaustAirTemperature: number;
  /** Exhaust air humidity ratio in kg/kg */
  exhaustAirHumidity: number;
  /** Air flow rate in m³/s */
  airFlowRate: number;
  /** Sensible effectiveness (0-1) */
  sensibleEffectiveness: number;
  /** Latent effectiveness (0-1) */
  latentEffectiveness: number;
}

/**
 * ERV calculation outputs
 */
export interface ErvOutputs {
  /** Outlet supply air temperature in °C */
  outletSupplyTemperature: number;
  /** Outlet supply air humidity ratio in kg/kg */
  outletSupplyHumidity: number;
  /** Sensible heat recovered in W */
  sensibleHeatRecovered: number;
  /** Latent heat recovered in W */
  latentHeatRecovered: number;
  /** Total heat recovered in W */
  totalHeatRecovered: number;
  /** NTU (Number of Transfer Units) */
  ntu?: number;
}

/**
 * Heat exchanger calculation inputs
 */
export interface HeatExchangerInputs {
  /** Hot side inlet temperature in °C */
  hotInletTemperature: number;
  /** Cold side inlet temperature in °C */
  coldInletTemperature: number;
  /** Hot side mass flow rate in kg/s */
  hotMassFlowRate: number;
  /** Cold side mass flow rate in kg/s */
  coldMassFlowRate: number;
  /** Hot side specific heat in J/(kg·K) */
  hotSpecificHeat: number;
  /** Cold side specific heat in J/(kg·K) */
  coldSpecificHeat: number;
  /** Overall heat transfer coefficient × area in W/K */
  ua: number;
  /** Flow arrangement ('counterflow' | 'parallelflow' | 'crossflow') */
  flowArrangement: 'counterflow' | 'parallelflow' | 'crossflow';
}

/**
 * Heat exchanger calculation outputs
 */
export interface HeatExchangerOutputs {
  /** Hot side outlet temperature in °C */
  hotOutletTemperature: number;
  /** Cold side outlet temperature in °C */
  coldOutletTemperature: number;
  /** Heat transfer rate in W */
  heatTransferRate: number;
  /** Effectiveness */
  effectiveness: number;
  /** NTU */
  ntu: number;
  /** Capacity ratio */
  capacityRatio: number;
}

// ============================================================================
// Energy Systems Types
// ============================================================================

/**
 * Photovoltaic single diode model inputs
 */
export interface PvInputs {
  /** Solar irradiance in W/m² */
  irradiance: number;
  /** Cell temperature in °C */
  cellTemperature: number;
  /** Number of cells in series */
  cellsInSeries: number;
  /** Number of modules in parallel */
  modulesInParallel?: number;
  /** Reference irradiance in W/m² (default 1000) */
  referenceIrradiance?: number;
  /** Reference temperature in °C (default 25) */
  referenceTemperature?: number;
  /** Short circuit current at STC in A */
  shortCircuitCurrent: number;
  /** Open circuit voltage at STC in V */
  openCircuitVoltage: number;
  /** Maximum power point current at STC in A */
  mppCurrent: number;
  /** Maximum power point voltage at STC in V */
  mppVoltage: number;
  /** Temperature coefficient of Isc in A/°C */
  tempCoeffIsc: number;
  /** Temperature coefficient of Voc in V/°C */
  tempCoeffVoc: number;
}

/**
 * Photovoltaic calculation outputs
 */
export interface PvOutputs {
  /** Maximum power output in W */
  maxPower: number;
  /** Maximum power point current in A */
  mppCurrent: number;
  /** Maximum power point voltage in V */
  mppVoltage: number;
  /** Short circuit current in A */
  shortCircuitCurrent: number;
  /** Open circuit voltage in V */
  openCircuitVoltage: number;
  /** Module efficiency */
  efficiency: number;
  /** Fill factor */
  fillFactor: number;
}

/**
 * Battery storage model inputs
 */
export interface BatteryInputs {
  /** Nominal capacity in Wh */
  nominalCapacity: number;
  /** Current state of charge (0-1) */
  stateOfCharge: number;
  /** Power flow in W (positive = charging, negative = discharging) */
  powerFlow: number;
  /** Time step in hours */
  timeStep: number;
  /** Charging efficiency (0-1) */
  chargingEfficiency?: number;
  /** Discharging efficiency (0-1) */
  dischargingEfficiency?: number;
  /** Minimum SOC limit (0-1) */
  minSoc?: number;
  /** Maximum SOC limit (0-1) */
  maxSoc?: number;
}

/**
 * Battery storage model outputs
 */
export interface BatteryOutputs {
  /** New state of charge (0-1) */
  newStateOfCharge: number;
  /** Actual energy change in Wh */
  energyChange: number;
  /** Actual power processed in W */
  actualPower: number;
  /** Energy losses in Wh */
  losses: number;
  /** Whether SOC limits were hit */
  limitReached: boolean;
}

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error messages if validation failed */
  errors: string[];
  /** Warning messages */
  warnings: string[];
}

/**
 * Parameter range definition for validation
 */
export interface ParameterRange {
  /** Minimum valid value */
  min: number;
  /** Maximum valid value */
  max: number;
  /** Unit of the parameter */
  unit: string;
  /** Whether the parameter is required */
  required?: boolean;
  /** Default value if not provided */
  defaultValue?: number;
}
