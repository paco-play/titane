import * as THREE from 'three';
import type { World } from '@titane/core';
import { Fog, getComponent, pickFog } from '@titane/core';

/**
 * Writes authored World fog onto `scene.fog`.
 * No component → no fog. `Camera.far` is not touched.
 */
export class FogApplier {
  private readonly color = new THREE.Color();

  /**
   * Syncs linear distance fog with the ECS Fog component, if any.
   */
  public apply(world: World, scene: THREE.Scene): void {
    const entity = pickFog(world);
    const data = entity !== null ? getComponent(world, entity, Fog) : undefined;
    if (!data) {
      scene.fog = null;
      return;
    }

    this.color.set(data.color);
    const far = Math.max(0.1, data.fadeDistance);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(this.color);
      scene.fog.near = 0;
      scene.fog.far = far;
      return;
    }

    scene.fog = new THREE.Fog(this.color.clone(), 0, far);
  }
}
