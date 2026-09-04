import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../runtime/engine';
import type { IRenderer } from '../runtime/renderer-interface';
import type { TitanePlugin } from '../runtime/plugin';
import { Phase } from '../ecs/pipeline/system';

const createMockRenderer = (): IRenderer => ({
    init: vi.fn(),
    render: vi.fn(),
    handleResize: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn()
});

describe('engine.use', () => {
    let engine: TitaneEngine;

    beforeEach(() => {
        const canvas = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600, top: 0, left: 0 })),
            getContext: vi.fn()
        } as unknown as HTMLCanvasElement;
        engine = new TitaneEngine(createMockRenderer(), canvas);
    });

    it('lets a plugin register systems', () => {
        const system = vi.fn();
        const plugin: TitanePlugin = {
            name: 'gameplay',
            register: (host) => {
                host.addSystem(Phase.UPDATE, system);
            }
        };

        engine.use(plugin);
        engine.tick();

        expect(system).toHaveBeenCalledTimes(1);
        expect(system).toHaveBeenCalledWith(engine.world, expect.any(Number));
    });

    it('rejects a second plugin with the same name', () => {
        const second = vi.fn();
        engine.use({ name: 'physics-extra', register: vi.fn() });
        expect(() => engine.use({ name: 'physics-extra', register: second })).toThrow(
            /already registered/
        );
        expect(second).not.toHaveBeenCalled();
    });

    it('rejects an empty name', () => {
        expect(() => engine.use({ name: '  ', register: vi.fn() })).toThrow(/must not be empty/);
    });
});
