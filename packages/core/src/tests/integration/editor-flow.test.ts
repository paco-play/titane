import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import { IRenderer } from '../../runtime/renderer-interface';
import { createPrimitive } from '../../ecs/kernel/factory';
import { setParent } from '../../ecs/kernel/transform-utils';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { Transform } from '../../ecs/components/transform';
import { Velocity, createVelocity } from '../../ecs/components/velocity';
import { Name } from '../../ecs/components/name';
import { Input } from '../../ecs/components/input';
import { serializeWorld, deserializeWorld, type SerializedWorld } from '../../ecs/serialization';

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
    getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600, top: 0, left: 0 })),
    getContext: vi.fn()
} as unknown as HTMLCanvasElement);

/**
 * Reproduces the sequence of operations the editor performs, to catch
 * regressions that unit tests scoped to a single module would miss.
 */
describe('Integration: editor flow', () => {
    let engine: TitaneEngine;

    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', vi.fn());
        engine = new TitaneEngine(createMockRenderer(), createMockCanvas());
    });

    it('should integrate velocity and compute the world matrix of a demo cube', () => {
        const cube = createPrimitive(engine.world, { name: 'Demo Cube' });
        addComponent(engine.world, cube, Velocity, createVelocity(10, 0, 0));

        engine.isPaused = false;
        engine.tick();

        const transform = getComponent(engine.world, cube, Transform)!;

        // Moved along X, and the matrix translation reflects the new position.
        // worldMatrix is a Float32Array, hence the tolerance against a float64 position.
        expect(transform.position.x).toBeGreaterThan(0);
        expect(transform.worldMatrix[12]).toBeCloseTo(transform.position.x, 6);
        expect(transform.isDirty).toBe(false);
    });

    it('should keep transform hierarchy in sync while paused, like the editor does', () => {
        const parent = createPrimitive(engine.world);
        const child = createPrimitive(engine.world);
        setParent(engine.world, child, parent);

        getComponent(engine.world, parent, Transform)!.position.x = 10;
        getComponent(engine.world, parent, Transform)!.isDirty = true;
        getComponent(engine.world, child, Transform)!.position.x = 2;
        getComponent(engine.world, child, Transform)!.isDirty = true;

        // Paused: gameplay is frozen but the hierarchy must still resolve
        expect(engine.isPaused).toBe(true);
        engine.tick();

        expect(getComponent(engine.world, child, Transform)!.worldMatrix[12]).toBe(12);
    });

    it('should survive a save/load round-trip through the engine', () => {
        const cube = createPrimitive(engine.world, { name: 'Saved Cube' });
        getComponent(engine.world, cube, Transform)!.position.y = 4;

        const file = JSON.stringify(serializeWorld(engine.world));
        engine.loadWorld(deserializeWorld(JSON.parse(file) as SerializedWorld));
        engine.tick();

        expect(getComponent(engine.world, cube, Name)?.value).toBe('Saved Cube');
        expect(getComponent(engine.world, cube, Transform)?.worldMatrix[13]).toBe(4);

        // The engine keeps exactly one input singleton, still on its own entity
        expect(engine.world._stores[Input.index]?.size).toBe(1);
        expect(getComponent(engine.world, engine.globalInputEntity, Input)).toBeDefined();
    });

    it('should restore a play-mode snapshot back to the edit-mode state', () => {
        const cube = createPrimitive(engine.world);
        addComponent(engine.world, cube, Velocity, createVelocity(50, 0, 0));

        engine.saveSnapshot();
        engine.isPaused = false;
        engine.tick();
        expect(getComponent(engine.world, cube, Transform)!.position.x).toBeGreaterThan(0);

        engine.isPaused = true;
        engine.restoreSnapshot();
        engine.tick();

        expect(getComponent(engine.world, cube, Transform)!.position.x).toBe(0);
    });
});
