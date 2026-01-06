# Indoor Farming Science Models

[![npm version](https://badge.fury.io/js/%40vflab%2Findoor-farming-science-models.svg)](https://www.npmjs.com/package/@vflab/indoor-farming-science-models)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Open-source TypeScript library for scientifically-validated indoor farming simulation models.**

This library provides peer-reviewed, literature-based models for simulating controlled environment agriculture (CEA) systems, including plant factories and vertical farms.

## Scientific Transparency

Every model in this library:
- Is based on **peer-reviewed scientific literature**
- Includes **complete mathematical formulas** in code comments
- Provides **literature references** for all equations and parameters
- Has been **validated** against published experimental data

We believe in open science. All formulas are visible and documented.

## Installation

```bash
npm install @vflab/indoor-farming-science-models
```

## Modules

### Plant Physiology
Models for plant water and carbon dynamics in controlled environments.

```typescript
import {
  penmanMonteith,      // Classic transpiration model
  stanghellini,        // CEA-optimized transpiration
  graamansPfal,        // Plant factory specific
  farquharFvCB,        // Photosynthesis model
  laiGddGrowth         // Growth dynamics
} from '@vflab/indoor-farming-science-models/plant-physiology';
```

**Key Models:**
- **Penman-Monteith (1965)**: Classic evapotranspiration equation
- **Stanghellini (1987)**: Greenhouse-optimized transpiration
- **Graamans PFAL (2017)**: Plant factory energy balance
- **Farquhar-von Caemmerer-Berry**: Biochemical photosynthesis
- **LAI-GDD**: Growth degree day based development

### Building Thermal
Heat transfer models for building envelopes and materials.

```typescript
import {
  multiLayerWall,      // Resistance network + FDM
  glassOptics,         // Fresnel equations
  solarHeatGain,       // SHGC calculations
  materialDatabase     // Thermal properties
} from '@vflab/indoor-farming-science-models/building-thermal';
```

**Key Models:**
- **Multi-layer Wall**: Thermal resistance network and finite difference
- **Glass Optics**: Fresnel equations for glazing
- **Solar Heat Gain**: Envelope solar radiation absorption

### HVAC Equipment
Equipment-level models for climate control systems.

```typescript
import {
  ervNtuEffectiveness, // Energy recovery ventilator
  heatExchanger,       // Counter/cross flow
  psychrometrics,      // Humid air properties
  compressorModel      // Vapor compression
} from '@vflab/indoor-farming-science-models/hvac-equipment';
```

**Key Models:**
- **ERV NTU-Effectiveness**: Heat/moisture recovery
- **Heat Exchangers**: Plate, shell-tube, counterflow
- **Psychrometrics**: Humid air calculations

### Energy Systems
Renewable energy and storage models.

```typescript
import {
  pvSingleDiode,       // Photovoltaic model
  batteryStorage,      // Li-ion battery model
  radiativeCooling     // Sky cooling
} from '@vflab/indoor-farming-science-models/energy-systems';
```

**Key Models:**
- **PV Single Diode**: Solar cell I-V characteristics
- **Battery Storage**: State of charge dynamics
- **Radiative Cooling**: Atmospheric window cooling

## Example Usage

### Transpiration Calculation

```typescript
import { penmanMonteith } from '@vflab/indoor-farming-science-models/plant-physiology';

const result = penmanMonteith({
  airTemperature: 22,        // °C
  relativeHumidity: 70,      // %
  netRadiation: 150,         // W/m²
  stomatalResistance: 100,   // s/m
  aerodynamicResistance: 50  // s/m
});

console.log(`Transpiration: ${result.transpirationRate} mm/h`);
console.log(`Latent heat: ${result.latentHeatFlux} W/m²`);
```

### Multi-layer Wall Heat Transfer

```typescript
import { multiLayerWall } from '@vflab/indoor-farming-science-models/building-thermal';

const wall = multiLayerWall({
  layers: [
    { material: 'concrete', thickness: 0.2 },
    { material: 'insulation', thickness: 0.1 },
    { material: 'gypsum', thickness: 0.015 }
  ],
  insideTemperature: 22,   // °C
  outsideTemperature: 35,  // °C
  insideConvection: 8.3,   // W/(m²·K)
  outsideConvection: 23    // W/(m²·K)
});

console.log(`U-value: ${wall.uValue} W/(m²·K)`);
console.log(`Heat flux: ${wall.heatFlux} W/m²`);
```

## Literature References

### Transpiration Models
- Monteith, J.L. (1965). Evaporation and environment. *Symposia of the Society for Experimental Biology*, 19, 205-234.
- Stanghellini, C. (1987). Transpiration of greenhouse crops. *IMAG-DLO*.
- Allen, R.G., et al. (1998). FAO Irrigation and drainage paper No. 56.
- Graamans, L., et al. (2017). Plant factories; crop transpiration and energy balance. *Agricultural Systems*, 153, 138-147.

### Photosynthesis Models
- Farquhar, G.D., von Caemmerer, S., & Berry, J.A. (1980). A biochemical model of photosynthetic CO2 assimilation in leaves of C3 species. *Planta*, 149(1), 78-90.

### Building Thermal
- ASHRAE Handbook - Fundamentals (2021)
- ISO 6946:2017 - Building components and building elements

### HVAC Equipment
- ASHRAE Handbook - HVAC Systems and Equipment (2020)
- Kays, W.M. & London, A.L. (1984). Compact Heat Exchangers.

## API Documentation

Full API documentation is available at [docs/api](./docs/api).

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

**VFLab** - Advancing indoor farming through open science.
