import { describe, expect, it } from 'vitest';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { createEntity } from '../../ecs/kernel/entity';
import { createWorld } from '../../ecs/kernel/world';
import { Collider, createCollider } from '../../ecs/components/collider';
import { Name, createName } from '../../ecs/components/name';
import { Transform, createTransform } from '../../ecs/components/transform';
import { Agent } from '../../ecs/components/agent';
import { Nav, createNav, navHasGrid, navIsWalkable, worldToNavCell } from '../../ecs/components/nav';
import { ensureNav, pickNav, clearNav } from '../../ecs/kernel/nav-utils';
import { bakeNavGrid } from '../../nav/bake';
import { findNavPath } from '../../nav/astar';
import { agentSystem } from '../../ecs/systems/agent';
import { deserializeWorld, serializeWorld, type SerializedWorld } from '../../ecs/serialization';

const spawnBox = (
    world: ReturnType<typeof createWorld>,
    position: { x: number; y: number; z: number },
    size: { x: number; y: number; z: number },
    walkable: boolean
): number => {
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName(walkable ? 'Floor' : 'Wall'));
    addComponent(world, entity, Transform, createTransform(position));
    const collider = createCollider('box');
    collider.size = size;
    collider.walkable = walkable;
    addComponent(world, entity, Collider, collider);
    return entity;
};

describe('Nav bake and Agent', () => {
    it('createCollider defaults walkable to false and revives omitted as false', () => {
        expect(createCollider().walkable).toBe(false);
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Collider, createCollider());
        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );
        expect(getComponent(restored, entity, Collider)?.walkable).toBe(false);
    });

    it('ensureNav creates a named nav-only entity once', () => {
        const world = createWorld();
        const a = ensureNav(world);
        const b = ensureNav(world);
        expect(a).toBe(b);
        expect(getComponent(world, a, Name)?.value).toBe('Nav');
        expect(getComponent(world, a, Nav)).toEqual(createNav());
    });

    it('bakes a walkable floor into a filled grid', () => {
        const world = createWorld();
        spawnBox(world, { x: 0, y: 0, z: 0 }, { x: 8, y: 0.2, z: 8 }, true);
        const nav = bakeNavGrid(world);
        expect(navHasGrid(nav)).toBe(true);
        expect(nav.width).toBeGreaterThan(4);
        expect(nav.depth).toBeGreaterThan(4);
        let walkable = 0;
        for (const cell of nav.cells) if (cell === 1) walkable += 1;
        expect(walkable).toBeGreaterThan(8);
    });

    it('A* goes around a blocking wall', () => {
        const world = createWorld();
        spawnBox(world, { x: 0, y: 0, z: 0 }, { x: 10, y: 0.2, z: 10 }, true);
        spawnBox(world, { x: 0, y: 1, z: 0 }, { x: 0.4, y: 2, z: 4 }, false);
        const nav = bakeNavGrid(world);
        const start = worldToNavCell(nav, -4, 0);
        const goal = worldToNavCell(nav, 4, 0);
        expect(start).not.toBeNull();
        expect(goal).not.toBeNull();
        expect(navIsWalkable(nav, start!.ix, start!.iz)).toBe(true);
        expect(navIsWalkable(nav, goal!.ix, goal!.iz)).toBe(true);

        const path = findNavPath(nav, start!, goal!);
        expect(path).not.toBeNull();
        const detour = path!.some((cell) => Math.abs(cell.iz - start!.iz) >= 2);
        expect(detour).toBe(true);
        expect(path![path!.length - 1]).toEqual(goal);
    });

    it('Agent walks toward destination on baked nav', () => {
        const world = createWorld();
        spawnBox(world, { x: 0, y: 0, z: 0 }, { x: 10, y: 0.2, z: 10 }, true);
        bakeNavGrid(world);

        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: -3, y: 0.2, z: 0 }));
        addComponent(world, entity, Agent, { destination: { x: 3, y: 0, z: 0 }, speed: 4 });

        for (let i = 0; i < 40; i++) agentSystem(world, 0.1);

        const transform = getComponent(world, entity, Transform)!;
        expect(transform.position.x).toBeGreaterThan(0);
    });

    it('round-trips baked Nav and Agent through .titane JSON', () => {
        const world = createWorld();
        spawnBox(world, { x: 0, y: 0, z: 0 }, { x: 4, y: 0.2, z: 4 }, true);
        bakeNavGrid(world);
        const agent = createEntity(world);
        addComponent(world, agent, Transform, createTransform({ x: 0, y: 0.2, z: 0 }));
        addComponent(world, agent, Agent, { destination: { x: 1, y: 0, z: -1 }, speed: 2.5 });

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );
        const navEntity = pickNav(restored);
        expect(navEntity).not.toBeNull();
        const nav = getComponent(restored, navEntity!, Nav)!;
        expect(navHasGrid(nav)).toBe(true);
        expect(getComponent(restored, agent, Agent)).toEqual({
            destination: { x: 1, y: 0, z: -1 },
            speed: 2.5
        });
    });

    it('clearNav destroys a nav-only entity', () => {
        const world = createWorld();
        ensureNav(world);
        clearNav(world);
        expect(pickNav(world)).toBeNull();
    });
});
