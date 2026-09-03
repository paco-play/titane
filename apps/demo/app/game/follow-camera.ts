import type { Entity, System, World } from '@titane/core';
import { getComponent, Transform } from '@titane/core';
import type { ThreeRenderer } from '@titane/renderer';
import { CAMERA_OFFSET } from './constants';

/**
 * Keeps the game camera behind and above the player.
 * Lives in the demo, not the engine: follow cameras are gameplay.
 */
export const createFollowCameraSystem = (
  player: Entity,
  renderer: ThreeRenderer
): System =>
  (world: World): void => {
    const transform = getComponent(world, player, Transform);
    if (!transform) return;

    renderer.setCamera({
      position: {
        x: transform.position.x + CAMERA_OFFSET.x,
        y: transform.position.y + CAMERA_OFFSET.y,
        z: transform.position.z + CAMERA_OFFSET.z
      },
      lookAt: {
        x: transform.position.x,
        y: transform.position.y,
        z: transform.position.z
      }
    });
  };
