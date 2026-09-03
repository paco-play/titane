import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import type { IRenderer } from '../../runtime/renderer-interface';
import { createPrimitive } from '../../ecs/kernel/factory';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { Transform } from '../../ecs/components/transform';
import { Velocity, createVelocity } from '../../ecs/components/velocity';
import { RigidBody, createRigidBody } from '../../ecs/components/rigid-body';
import { FIXED_DT } from '../../utils/fixed-step';
import { Phase } from '../../ecs/pipeline/system';

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

describe('Rapier physics', () => {
    let engine: TitaneEngine;

    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', vi.fn());
        engine = new TitaneEngine(createMockRenderer(), createMockCanvas());
    });

    it('drops a dynamic body under gravity', () => {
        const cube = createPrimitive(engine.world, {
            name: 'Falling',
            position: { x: 0, y: 5, z: 0 }
        });
        addComponent(engine.world, cube, RigidBody, createRigidBody('dynamic'));

        const startY = getComponent(engine.world, cube, Transform)!.position.y;
        for (let i = 0; i < 30; i++) engine.step();

        expect(getComponent(engine.world, cube, Transform)!.position.y).toBeLessThan(startY);
    });

    it('keeps a fixed body in place', () => {
        const cube = createPrimitive(engine.world, {
            position: { x: 0, y: 5, z: 0 }
        });
        addComponent(engine.world, cube, RigidBody, createRigidBody('fixed'));

        for (let i = 0; i < 30; i++) engine.step();

        expect(getComponent(engine.world, cube, Transform)!.position.y).toBeCloseTo(5, 5);
    });

    it('still integrates Velocity when there is no RigidBody', () => {
        const cube = createPrimitive(engine.world);
        addComponent(engine.world, cube, Velocity, createVelocity(10, 0, 0));

        engine.step();

        expect(getComponent(engine.world, cube, Transform)!.position.x).toBeCloseTo(10 * FIXED_DT, 5);
    });

    it('does not let Velocity integrate an entity that has a RigidBody', () => {
        const cube = createPrimitive(engine.world, {
            position: { x: 0, y: 0, z: 0 }
        });
        addComponent(engine.world, cube, Velocity, createVelocity(100, 0, 0));
        addComponent(engine.world, cube, RigidBody, createRigidBody('fixed'));

        engine.step();

        expect(getComponent(engine.world, cube, Transform)!.position.x).toBeCloseTo(0, 5);
    });

    it('runs one UPDATE while remaining paused', () => {
        const gameSystem = vi.fn();
        engine.addSystem(Phase.UPDATE, gameSystem);

        expect(engine.isPaused).toBe(true);
        engine.step();

        expect(engine.isPaused).toBe(true);
        expect(gameSystem).toHaveBeenCalledTimes(1);
        expect(gameSystem).toHaveBeenCalledWith(engine.world, FIXED_DT);
    });

    it('does not simulate on a paused tick', () => {
        const cube = createPrimitive(engine.world, {
            position: { x: 0, y: 5, z: 0 }
        });
        addComponent(engine.world, cube, RigidBody, createRigidBody('dynamic'));
        addComponent(engine.world, cube, Velocity, createVelocity(10, 0, 0));

        engine.tick(FIXED_DT);

        const transform = getComponent(engine.world, cube, Transform)!;
        expect(transform.position.x).toBe(0);
        expect(transform.position.y).toBe(5);
    });

    it('rebuilds Rapier state after a snapshot restore', () => {
        const cube = createPrimitive(engine.world, {
            position: { x: 0, y: 5, z: 0 }
        });
        addComponent(engine.world, cube, RigidBody, createRigidBody('dynamic'));

        engine.saveSnapshot();
        engine.step();
        expect(getComponent(engine.world, cube, Transform)!.position.y).toBeLessThan(5);

        engine.restoreSnapshot();
        expect(getComponent(engine.world, cube, Transform)!.position.y).toBeCloseTo(5, 5);

        engine.step();
        expect(getComponent(engine.world, cube, Transform)!.position.y).toBeLessThan(5);
    });
});
