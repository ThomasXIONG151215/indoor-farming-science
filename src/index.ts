/**
 * Indoor Farming Science Models
 *
 * @description
 * Open-source TypeScript library for scientifically-validated
 * indoor farming simulation models.
 *
 * @packageDocumentation
 *
 * @example
 * ```typescript
 * // Import specific modules
 * import { penmanMonteith } from '@vflab/indoor-farming-science-models/plant-physiology';
 * import { multiLayerWall } from '@vflab/indoor-farming-science-models/building-thermal';
 * import { calculateErvPerformance } from '@vflab/indoor-farming-science-models/hvac-equipment';
 *
 * // Or import everything
 * import * as Models from '@vflab/indoor-farming-science-models';
 * ```
 *
 * @see {@link https://github.com/vflab/indoor-farming-science-models}
 */

// Common utilities
export * from './common';

// Plant physiology models (transpiration, photosynthesis, growth)
export * from './plant-physiology';

// Building thermal models (walls, glazing, materials)
export * from './building-thermal';

// HVAC equipment models (ERV, heat exchangers, psychrometrics)
export * from './hvac-equipment';

// Energy systems models (PV, storage, radiative cooling)
export * from './energy-systems';

/**
 * Library version
 */
export const VERSION = '1.0.0';

/**
 * Library name
 */
export const LIBRARY_NAME = '@vflab/indoor-farming-science-models';
