import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import type { IRenderer } from '../../runtime/renderer-interface';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { hasComponent } from '../../ecs/kernel/component';
import { Input } from '../../ecs/components/input';

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

    it('keeps exactly one input singleton after loading a scene that carried its own', () => {
        const source = createWorld();
        const foreignInput = createEntity(source);
        source._stores[Input.index] = new Map([[foreignInput, { keys: {}, justPressed: {}, mouse: { x: 0, y: 0, buttons: [] } }]]);

        engine.loadWorld(source);

        const inputStore = engine.world._stores[Input.index];
        expect(inputStore?.size).toBe(1);
        expect(inputStore?.has(engine.globalInputEntity)).toBe(true);
    });
});
