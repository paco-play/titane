import type { World } from '../ecs/kernel/world';
import { defineQuery, runQuery } from '../ecs/kernel/query';
import { getComponent, hasComponent, updateComponent } from '../ecs/kernel/component';
import { transformSystem } from '../ecs/systems/transform';
import { Collider } from '../ecs/components/collider';
import { Transform } from '../ecs/components/transform';
import { RigidBody } from '../ecs/components/rigid-body';
import { Agent } from '../ecs/components/agent';
import {
    Nav,
    NAV_MAX_AXIS,
    createNav,
    type NavData
} from '../ecs/components/nav';
import { ensureNav } from '../ecs/kernel/nav-utils';
import { aabbContainsXz, colliderWorldAabb, type WorldAabb } from './bounds';

const colliderQuery = defineQuery([Transform, Collider]);

type Volume = WorldAabb & { walkable: boolean };

/**
 * Rasterizes walkable colliders (and blockers) into the World `Nav` entity.
 * Runs `transformSystem` first so parented colliders use world pose.
 */
export const bakeNavGrid = (world: World): NavData => {
    transformSystem(world);
    const entity = ensureNav(world);
    const settings = getComponent(world, entity, Nav) ?? createNav();
    const baked = rasterize(world, settings);
    updateComponent(world, entity, Nav, (data) => {
        data.cellSize = baked.cellSize;
        data.agentRadius = baked.agentRadius;
        data.agentHeight = baked.agentHeight;
        data.originX = baked.originX;
        data.originY = baked.originY;
        data.originZ = baked.originZ;
        data.width = baked.width;
        data.depth = baked.depth;
        data.cells = baked.cells;
    });
    return getComponent(world, entity, Nav) ?? baked;
};

const rasterize = (world: World, settings: NavData): NavData => {
    const volumes = collectVolumes(world);
    const floors = volumes.filter((volume) => volume.walkable);
    if (floors.length === 0) {
        return { ...settings, originX: 0, originY: 0, originZ: 0, width: 0, depth: 0, cells: [] };
    }

    let minX = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxZ = -Infinity;
    let originY = floors[0].maxY;
    for (const floor of floors) {
        if (floor.minX < minX) minX = floor.minX;
        if (floor.minZ < minZ) minZ = floor.minZ;
        if (floor.maxX > maxX) maxX = floor.maxX;
        if (floor.maxZ > maxZ) maxZ = floor.maxZ;
        if (floor.maxY < originY) originY = floor.maxY;
    }

    const spanX = Math.max(settings.cellSize, maxX - minX);
    const spanZ = Math.max(settings.cellSize, maxZ - minZ);
    const cellSize = Math.max(
        settings.cellSize,
        spanX / NAV_MAX_AXIS,
        spanZ / NAV_MAX_AXIS
    );
    const width = Math.max(1, Math.min(NAV_MAX_AXIS, Math.ceil(spanX / cellSize)));
    const depth = Math.max(1, Math.min(NAV_MAX_AXIS, Math.ceil(spanZ / cellSize)));
    const cells = new Array<number>(width * depth).fill(0);
    const pad = settings.agentRadius;
    const nav: NavData = {
        ...settings,
        cellSize,
        originX: minX,
        originY,
        originZ: minZ,
        width,
        depth,
        cells
    };

    for (let iz = 0; iz < depth; iz++) {
        for (let ix = 0; ix < width; ix++) {
            const x = minX + (ix + 0.5) * cellSize;
            const z = minZ + (iz + 0.5) * cellSize;
            const floorY = floorAt(floors, x, z, pad);
            if (floorY === null) continue;
            if (blockedAt(volumes, x, z, floorY, settings.agentHeight, pad)) continue;
            cells[iz * width + ix] = 1;
        }
    }

    return nav;
};

const collectVolumes = (world: World): Volume[] => {
    const volumes: Volume[] = [];
    for (const entity of runQuery(world, colliderQuery)) {
        if (hasComponent(world, entity, Agent)) continue;
        const rigid = getComponent(world, entity, RigidBody);
        if (rigid?.kind === 'dynamic') continue;
        const transform = getComponent(world, entity, Transform);
        const collider = getComponent(world, entity, Collider);
        if (!transform || !collider) continue;
        const aabb = colliderWorldAabb(collider, transform.scale, transform.worldMatrix);
        volumes.push({ ...aabb, walkable: collider.walkable });
    }
    return volumes;
};

const floorAt = (floors: Volume[], x: number, z: number, pad: number): number | null => {
    let top: number | null = null;
    for (const floor of floors) {
        if (!aabbContainsXz(floor, x, z, -pad)) continue;
        if (top === null || floor.maxY > top) top = floor.maxY;
    }
    return top;
};

const blockedAt = (
    volumes: Volume[],
    x: number,
    z: number,
    floorY: number,
    agentHeight: number,
    pad: number
): boolean => {
    for (const volume of volumes) {
        if (volume.walkable) continue;
        if (!aabbContainsXz(volume, x, z, pad)) continue;
        if (volume.maxY <= floorY + 0.05) continue;
        if (volume.minY >= floorY + agentHeight) continue;
        return true;
    }
    return false;
};
