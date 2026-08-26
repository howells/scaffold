/**
 * Drag physics utilities.
 *
 * The logarithmic resistance function creates a rubber-band feel:
 * initial movement is free, but gets progressively harder the further
 * you drag. Combined with spring-smoothed motion values, this produces
 * a natural, elastic gesture.
 */

const RESISTANCE_DIVISOR = 20;
const RESISTANCE_SCALE = 4;
const RESISTANCE_MIN = 0.1;

/**
 * Logarithmic resistance — decelerates drag progressively.
 * Returns a multiplier between RESISTANCE_MIN and 1.0.
 *
 * At distance 0: returns 1.0 (full movement)
 * At distance 50: returns ~0.77
 * At distance 100: returns ~0.58
 * At distance 200: returns ~0.42
 */
export function calculateResistance(distance: number): number {
  return Math.max(
    RESISTANCE_MIN,
    1 - Math.log(distance / RESISTANCE_DIVISOR + 1) / RESISTANCE_SCALE
  );
}

export const SCALE_INPUT = [0, 50, 100];
export const SCALE_OUTPUT = [1, 0.98, 0.95];

export const OPACITY_INPUT = [0, 80];
export const OPACITY_OUTPUT = [1, 0.96];

export const DEFAULT_DISTANCE_THRESHOLD = 100;
export const DEFAULT_VELOCITY_THRESHOLD = 500;
