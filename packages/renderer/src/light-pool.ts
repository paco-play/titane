import * as THREE from 'three';
import type { Entity, World } from '@titane/core';
import { defineQuery, runQuery, getComponent, Light, Transform } from '@titane/core';
import type { LightData, LightKind } from '@titane/core';

const lightQuery = defineQuery([Light]);

/** All Three.js light types that this pool can own. */
type ThreeLight = THREE.DirectionalLight | THREE.PointLight | THREE.AmbientLight;

/** Runtime entry kept per tracked entity. */
interface LightEntry {
    light: ThreeLight;
    kind: LightKind;
    directionalTarget?: THREE.Object3D | null;
}

/**
 * Manages Three.js light objects derived from ECS `Light` components.
 *
 * Responsibilities:
 * - Creates the correct Three.js light the first time an entity is seen.
 * - Re-creates the light object when `kind` changes (different class needed).
 * - Syncs color, intensity, distance and position/direction every render frame.
 * - Removes lights whose entities have been destroyed.
 *
 * The pool owns all lights it creates and adds them to the scene itself.
 */
export class LightPool {
    private readonly scene: THREE.Scene;
    private readonly tracked = new Map<Entity, LightEntry>();
    private readonly liveSet = new Set<Entity>();

    constructor(scene: THREE.Scene) {
        this.scene = scene;
    }

    /**
     * Drives the full light lifecycle for one render frame.
     * Call this before `renderer.render(scene, camera)`.
     * @param world - The current ECS world.
     */
    public sync(world: World): void {
        const liveEntities = runQuery(world, lightQuery);
        this.liveSet.clear();
        for (const entity of liveEntities) this.liveSet.add(entity);

        // Remove destroyed entities.
        for (const [entity, entry] of this.tracked) {
            if (!this.liveSet.has(entity)) {
                this.scene.remove(entry.light);
                if (entry.directionalTarget) this.scene.remove(entry.directionalTarget);
                this.tracked.delete(entity);
            }
        }

        // Create or update lights for all live entities.
        for (const entity of liveEntities) {
            const data = getComponent(world, entity, Light);
            if (!data) continue;

            let entry = this.tracked.get(entity);

            // (Re-)create when the light object is absent or the kind changed.
            if (!entry || entry.kind !== data.kind) {
                if (entry) {
                    this.scene.remove(entry.light);
                    if (entry.directionalTarget) this.scene.remove(entry.directionalTarget);
                }

                const built = buildLight(data.kind, this.scene);
                entry = {
                    light: built.light,
                    kind: data.kind,
                    directionalTarget: built.directionalTarget
                };
                this.tracked.set(entity, entry);
            }

            applyLightData(entry.light, data, world, entity);
        }
    }

    /**
     * Whether any light entities currently exist in the world.
     * Used by the renderer to decide whether to add fallback lights.
     */
    public get isEmpty(): boolean {
        return this.tracked.size === 0;
    }

    /** Removes all managed lights from the scene and clears the registry. */
    public dispose(): void {
        for (const { light, directionalTarget } of this.tracked.values()) {
            this.scene.remove(light);
            if (directionalTarget) this.scene.remove(directionalTarget);
        }
        this.tracked.clear();
    }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Constructs the appropriate Three.js light class for the given kind. */
function buildLight(
    kind: LightKind,
    scene: THREE.Scene
): { light: ThreeLight; directionalTarget: THREE.Object3D | null } {
    switch (kind) {
        case 'directional': {
            const light = new THREE.DirectionalLight();
            // DirectionalLight needs its target to be added to the scene.
            scene.add(light);
            scene.add(light.target);
            return { light, directionalTarget: light.target };
        }
        case 'point': {
            const light = new THREE.PointLight();
            scene.add(light);
            return { light, directionalTarget: null };
        }
        case 'ambient': {
            const light = new THREE.AmbientLight();
            scene.add(light);
            return { light, directionalTarget: null };
        }
    }
}

/**
 * Copies ECS `LightData` fields onto the Three.js light object.
 * Also positions / orients directional and point lights from the `Transform`.
 */
function applyLightData(
    light: ThreeLight,
    data: LightData,
    world: World,
    entity: Entity
): void {

    light.color.set(data.color);
    light.intensity = data.intensity;

    const transform = getComponent(world, entity, Transform);
    if (!transform) return;

    // worldMatrix is column-major. Translation is in the last column.
    const m = transform.worldMatrix;
    const px = m[12];
    const py = m[13];
    const pz = m[14];

    if (light instanceof THREE.PointLight) {
        light.distance = data.distance;
        light.position.set(px, py, pz);
        return;
    }

    if (light instanceof THREE.DirectionalLight) {
        light.position.set(px, py, pz);

        // DirectionalLight points from its position towards `target`.
        // ECS basis columns represent the entity axes; we use -Z as "forward".
        const fx = -m[8];
        const fy = -m[9];
        const fz = -m[10];
        const len = Math.hypot(fx, fy, fz);
        if (len > 0) {
            const nx = fx / len;
            const ny = fy / len;
            const nz = fz / len;
            light.target.position.set(px + nx, py + ny, pz + nz);
        }
    }
}
