/** Fallback offset when the camera sits on the orbit target. */
export const DEFAULT_ORBIT_OFFSET = { x: 0, y: 2, z: 6 };

export type OrbitVec3 = { x: number; y: number; z: number };

/**
 * Pans the editor orbit so `focus` is centered, keeping the current
 * camera-to-target offset (same distance and angle).
 */
export const panOrbitToFocus = (
    camera: OrbitVec3,
    target: OrbitVec3,
    focus: OrbitVec3
): { camera: OrbitVec3; target: OrbitVec3 } => {
    let ox = camera.x - target.x;
    let oy = camera.y - target.y;
    let oz = camera.z - target.z;
    if (ox * ox + oy * oy + oz * oz < 1e-8) {
        ox = DEFAULT_ORBIT_OFFSET.x;
        oy = DEFAULT_ORBIT_OFFSET.y;
        oz = DEFAULT_ORBIT_OFFSET.z;
    }
    return {
        camera: { x: focus.x + ox, y: focus.y + oy, z: focus.z + oz },
        target: { x: focus.x, y: focus.y, z: focus.z }
    };
};
