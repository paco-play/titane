import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import type { IRenderer } from '../../runtime/renderer-interface';
import { createPrimitive } from '../../ecs/kernel/factory';
import { addComponent } from '../../ecs/kernel/component';
import { RigidBody, createRigidBody } from '../../ecs/components/rigid-body';
import { Sensor, createSensor } from '../../ecs/components/sensor';
import { Phase } from '../../ecs/pipeline/system';
import { getPhysicsSession, getIntersections } from '../../physics/session';
import { createTriggerSystem } from '../../ecs/systems/trigger';
import type { Entity } from '../../ecs/types';

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

describe('Sensor / Trigger', () => {
    let engine: TitaneEngine;
    /** Large fixed sensor box at y=0, half-extents (10, 2, 10). */
    let sensor: Entity;
    /** Dynamic sphere that starts inside the sensor volume. */
    let ball: Entity;

    beforeEach(async () => {
        vi.stubGlobal('requestAnimationFrame', vi.fn());
        engine = new TitaneEngine(createMockRenderer(), createMockCanvas());
        await engine.ready;

        // Fixed sensor box (no contact forces, just events)
        sensor = createPrimitive(engine.world, {
            name: 'Sensor',
            primitive: 'box',
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 20, y: 4, z: 20 }
        });
        addComponent(engine.world, sensor, RigidBody, createRigidBody('fixed'));
        addComponent(engine.world, sensor, Sensor, createSensor('test-zone'));

        // Dynamic sphere spawned inside the sensor volume
        ball = createPrimitive(engine.world, {
            name: 'Ball',
            primitive: 'sphere',
            position: { x: 0, y: 0.5, z: 0 }
        });
        addComponent(engine.world, ball, RigidBody, createRigidBody('dynamic'));

        // Step enough to let physics build and fire the first event
        for (let i = 0; i < 3; i++) engine.step();
    });

    it('getIntersections returns the overlapping entity', () => {
        const session = getPhysicsSession(engine.world);
        expect(session).not.toBeNull();

        const overlaps = getIntersections(session!, sensor);
        expect(overlaps.has(ball)).toBe(true);
    });

    it('intersection is symmetric — ball also lists the sensor', () => {
        const session = getPhysicsSession(engine.world);
        expect(session).not.toBeNull();

        const overlaps = getIntersections(session!, ball);
        expect(overlaps.has(sensor)).toBe(true);
    });

    it('createTriggerSystem fires onEnter on the first overlapping tick', async () => {
        const engine2 = new TitaneEngine(createMockRenderer(), createMockCanvas());
        await engine2.ready;

        const sensorB = createPrimitive(engine2.world, {
            name: 'Sensor',
            primitive: 'box',
            position: { x: 0, y: 0, z: 0 },
            scale: { x: 20, y: 4, z: 20 }
        });
        addComponent(engine2.world, sensorB, RigidBody, createRigidBody('fixed'));
        addComponent(engine2.world, sensorB, Sensor, createSensor('zone'));

        const ballB = createPrimitive(engine2.world, {
            name: 'Ball',
            primitive: 'sphere',
            position: { x: 0, y: 0.5, z: 0 }
        });
        addComponent(engine2.world, ballB, RigidBody, createRigidBody('dynamic'));

        const entered: Entity[] = [];
        const exited: Entity[] = [];

        engine2.addSystem(Phase.POST_PHYSICS, createTriggerSystem(
            sensorB,
            (e) => entered.push(e),
            (e) => exited.push(e)
        ));

        for (let i = 0; i < 5; i++) engine2.step();

        expect(entered).toContain(ballB);
        expect(exited).not.toContain(ballB);
    });
});
