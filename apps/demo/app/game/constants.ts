/** Half-extents of the playable slab, in world units (scale of a unit box). */
export const SLAB_SIZE = 12;

/**
 * Y position of the centre of the kill-zone sensor box.
 * The sensor sits well below the slab so a falling body always passes through it.
 */
export const KILL_ZONE_Y = -6;

/** Half-height of the kill-zone sensor box in world units. */
export const KILL_ZONE_HALF_HEIGHT = 3;

/** Camera offset from the player, in world units. */
export const CAMERA_OFFSET = { x: 8, y: 10, z: 8 } as const;
