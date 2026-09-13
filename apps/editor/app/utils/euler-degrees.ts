/**
 * Inspector Transform rotation is typed in degrees; ECS stores radians.
 */

const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

/**
 * Converts an Euler axis from radians (ECS) to degrees (Inspector).
 */
export const radToDeg = (radians: number): number => radians * RAD_TO_DEG;

/**
 * Converts an Euler axis from degrees (Inspector) to radians (ECS).
 */
export const degToRad = (degrees: number): number => degrees * DEG_TO_RAD;
