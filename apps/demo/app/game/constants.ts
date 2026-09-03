/** Half-extents of the playable slab, in world units (scale of a unit box). */
export const SLAB_SIZE = 12;

/** World Y below which the player has walked off the slab. */
export const FALL_Y = -3;

/** Camera offset from the player, in world units. */
export const CAMERA_OFFSET = { x: 8, y: 10, z: 8 } as const;
