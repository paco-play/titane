import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../runtime/engine';
import { IRenderer } from '../runtime/renderer-interface';
import { Name } from '../ecs/components/name';
import { addComponent, getComponent } from '../ecs/kernel/component';
import { createEntity } from '../ecs/kernel/entity';
import { Phase } from '../ecs/pipeline/system';
import { Input } from '../ecs/components/input';

/**
 * Mock Renderer to avoid WebGL dependencies in Node environment.
 */
const createMockRenderer = (): IRenderer => ({
    init: vi.fn(),
    render: vi.fn(),
    handleResize: vi.fn(),
    setSize: vi.fn(),
    setGridVisible: vi.fn(),
    dispose: vi.fn(),
});

describe('Engine Lifecycle & State Management', () => {
    let engine: TitaneEngine;
    let mockRenderer: IRenderer;
    let canvas: HTMLCanvasElement;

    beforeEach(() => {
        vi.useFakeTimers();

        // 1. Mock requestAnimationFrame globally for Node.js
        // We use setTimeout to simulate a frame tick
        vi.stubGlobal('requestAnimationFrame', vi.fn((cb) => setTimeout(cb, 16)));
        vi.stubGlobal('cancelAnimationFrame', vi.fn((id) => clearTimeout(id)));

        mockRenderer = createMockRenderer();

        // 2. Updated Canvas Mock
        canvas = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600, top: 0, left: 0 })),
            getContext: vi.fn(),
        } as unknown as HTMLCanvasElement;

        engine = new TitaneEngine(mockRenderer, canvas);
    });

    it('should initialize with a valid world and global input entity', () => {
        expect(engine.world).toBeDefined();
        expect(engine.globalInputEntity).toBeDefined();
        // Entity 0 is usually the GlobalInput
        expect(engine.world.entities.active.has(engine.globalInputEntity)).toBe(true);
    });

    it('should restore snapshots in place, keeping the World reference stable', () => {
        // 1. Setup initial state
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Name, { value: 'Original' });

        const originalWorldReference = engine.world;
        const originalStore = engine.world._stores[Name.index];

        // 2. Save Snapshot
        engine.saveSnapshot();

        // 3. Mutate the world
        const nameComp = getComponent(engine.world, entity, Name);
        if (nameComp) nameComp.value = 'Modified During Play';

        // 4. Restore Snapshot
        engine.restoreSnapshot();

        // The World and its stores must keep their identity: the input driver,
        // renderer and editor UI all hold these references.
        expect(engine.world).toBe(originalWorldReference);
        expect(engine.world._stores[Name.index]).toBe(originalStore);

        // Data must be restored to original values
        expect(getComponent(engine.world, entity, Name)?.value).toBe('Original');
    });

    it('should keep the input driver bound to live data after a restore', () => {
        engine.saveSnapshot();
        engine.restoreSnapshot();

        // The global input entity survives the restore and is still writable
        window.dispatchEvent({ type: 'keydown', code: 'KeyW' } as unknown as Event);

        const input = getComponent(engine.world, engine.globalInputEntity, Input);
        expect(input?.keys['KeyW']).toBe(true);
    });

    it('should run game systems registered through addSystem', () => {
        const gameSystem = vi.fn();
        engine.addSystem(Phase.UPDATE, gameSystem);

        engine.tick();

        expect(gameSystem).toHaveBeenCalledTimes(1);
        expect(gameSystem).toHaveBeenCalledWith(engine.world, expect.any(Number));
    });

    it('should respect the isPaused flag in the execution loop', async () => {
        engine.start();

        // Case 1: Paused (Editor Mode)
        engine.isPaused = true;
        vi.advanceTimersByTime(16); // Simulate one frame

        // Renderer should be called even when paused
        expect(mockRenderer.render).toHaveBeenCalled();

        // Case 2: Playing (Simulation Mode)
        engine.isPaused = false;
        vi.advanceTimersByTime(16);

        // Bypass private access using bracket notation to avoid TS errors without changing source
        expect(engine['isRunning']).toBe(true);

        engine.stop();
        expect(engine['isRunning']).toBe(false);
    });

    it('should cleanup resources on dispose', () => {
        const stopSpy = vi.spyOn(engine, 'stop');

        engine.dispose();

        expect(stopSpy).toHaveBeenCalled();
        // This confirms the engine orchestration refactor keeps cleanup intact.
    });
});