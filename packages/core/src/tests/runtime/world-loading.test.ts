import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import type { IRenderer } from '../../runtime/renderer-interface';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent, hasComponent } from '../../ecs/kernel/component';
import { createPrimitive } from '../../ecs/kernel/factory';
import { Input } from '../../ecs/components/input';
import { Name } from '../../ecs/components/name';
import { Transform } from '../../ecs/components/transform';
import { RigidBody, createRigidBody } from '../../ecs/components/rigid-body';
import { PlayerControlled, createPlayerControlled } from '../../ecs/components/player-controlled';
import { serializeWorld, deserializeWorld, type SerializedWorld } from '../../ecs/serialization';
import { createSparseStore } from '../../ecs/kernel/store';

const createMockRenderer = (): IRenderer => ({
    init: vi.fn(),
    render: vi.fn(),
    handleResize: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn()
});

const createMockCanvas = (): HTMLCanvasElement => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    clientWidth: 800,
    clientHeight: 600,
    getBoundingClientRect: () => ({ left: 0, top: 0 })
} as unknown as HTMLCanvasElement);

describe('Engine world loading', () => {
    let engine: TitaneEngine;

    beforeEach(() => {
        engine = new TitaneEngine(createMockRenderer(), createMockCanvas());
    });

    it('never hands out the id reserved by the input singleton', () => {
        // An empty scene carries nextId 0, which would otherwise be handed back
        // out and let a game object overwrite the engine's input entity.
        engine.loadWorld(createWorld());

        const spawned = createEntity(engine.world);

        expect(spawned).not.toBe(engine.globalInputEntity);
        expect(hasComponent(engine.world, spawned, Input)).toBe(false);
        expect(hasComponent(engine.world, engine.globalInputEntity, Input)).toBe(true);
    });

    it('keeps the input singleton out of the recycled pool', () => {
        const source = createWorld();
        source.entities.recycled.push(engine.globalInputEntity);

        engine.loadWorld(source);

        expect(engine.world.entities.recycled).not.toContain(engine.globalInputEntity);
        expect(createEntity(engine.world)).not.toBe(engine.globalInputEntity);
    });

    it('keeps scene entities when id 0 was reserved for the input singleton', () => {
        const source = createWorld();
        createEntity(source);

        const ground = createPrimitive(source, {
            name: 'Ground',
            scale: { x: 12, y: 0.5, z: 12 },
            position: { x: 0, y: -0.25, z: 0 }
        });
        addComponent(source, ground, RigidBody, createRigidBody('fixed'));

        const player = createPrimitive(source, {
            name: 'Player',
            primitive: 'sphere',
            position: { x: 0, y: 1.5, z: 0 }
        });
        addComponent(source, player, RigidBody, createRigidBody('dynamic'));
        addComponent(source, player, PlayerControlled, createPlayerControlled());

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(source))) as SerializedWorld
        );
        engine.loadWorld(restored);

        expect(hasComponent(engine.world, engine.globalInputEntity, Input)).toBe(true);
        expect(getComponent(engine.world, ground, Name)?.value).toBe('Ground');
        expect(getComponent(engine.world, ground, Transform)?.scale).toEqual({ x: 12, y: 0.5, z: 12 });
        expect(getComponent(engine.world, ground, RigidBody)?.kind).toBe('fixed');
        expect(hasComponent(engine.world, player, PlayerControlled)).toBe(true);
        expect(getComponent(engine.world, player, RigidBody)?.kind).toBe('dynamic');
    });

    it('keeps exactly one input singleton after loading a scene that carried its own', () => {
        const source = createWorld();
        const foreignInput = createEntity(source);
        const inputStore = createSparseStore();
        inputStore.set(foreignInput, { keys: {}, justPressed: {}, mouse: { x: 0, y: 0, buttons: [] } });
        source._stores[Input.index] = inputStore;

        engine.loadWorld(source);

        const liveStore = engine.world._stores[Input.index];
        expect(liveStore?.size).toBe(1);
        expect(liveStore?.has(engine.globalInputEntity)).toBe(true);
    });
});
