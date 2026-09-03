import type { Entity, System, World } from '@titane/core';
import { getComponent, Transform } from '@titane/core';

/**
 * Fires once when the player drops below `thresholdY`.
 * The host owns the HUD / pause reaction; this system only detects the fall.
 */
export const createLoseSystem = (
  player: Entity,
  thresholdY: number,
  onFall: () => void
): System =>
  (world: World): void => {
    const transform = getComponent(world, player, Transform);
    if (!transform) return;
    if (transform.position.y < thresholdY) onFall();
  };
