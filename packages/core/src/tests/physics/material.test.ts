import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import type { IRenderer } from '../../runtime/renderer-interface';
import { createPrimitive } from '../../ecs/kernel/factory';
import { addComponent, getComponent, updateComponent } from '../../ecs/kernel/component';
import { Mesh } from '../../ecs/components/mesh';
import { Transform } from '../../ecs/components/transform';
import { RigidBody, createRigidBody } from '../../ecs/components/rigid-body';
import { getPhysicsSession } from '../../physics/session';

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

describe('Physics material', () => {
    let engine: TitaneEngine;

    beforeEach(async () => {
        vi.stubGlobal('requestAnimationFrame', vi.fn());
        engine = new TitaneEngine(createMockRenderer(), createMockCanvas());
        await engine.ready;
    });

    it('applies Rapier defaults when friction and restitution are omitted', () => {
        const cube = createPrimitive(engine.world);
        addComponent(engine.world, cube, RigidBody, createRigidBody('dynamic'));

        engine.step();

        const collider = getPhysicsSession(engine.world)!.bodies.get(cube)!.collider;
        expect(collider.friction()).toBeCloseTo(0.5);
        expect(collider.restitution()).toBeCloseTo(0);
    });

    it('writes custom friction and restitution onto the live collider', () => {
        const cube = createPrimitive(engine.world);
        addComponent(engine.world, cube, RigidBody, createRigidBody('dynamic', 0.2, 0.9));

        engine.step();

        const collider = getPhysicsSession(engine.world)!.bodies.get(cube)!.collider;
        expect(collider.friction()).toBeCloseTo(0.2);
        expect(collider.restitution()).toBeCloseTo(0.9);
    });

    it('updates the live collider when material fields change', () => {
        const cube = createPrimitive(engine.world);
        addComponent(engine.world, cube, RigidBody, createRigidBody('dynamic'));
        engine.step();

        const first = getPhysicsSession(engine.world)!.bodies.get(cube)!.collider;
        const handle = first.handle;

        updateComponent(engine.world, cube, RigidBody, (data) => {
            data.friction = 1.4;
            data.restitution = 0.75;
        });
        engine.step();

        const next = getPhysicsSession(engine.world)!.bodies.get(cube)!.collider;
        expect(next.handle).toBe(handle);
        expect(next.friction()).toBeCloseTo(1.4);
        expect(next.restitution()).toBeCloseTo(0.75);
    });

    it('keeps material when the collider shape is rebuilt', () => {
        const cube = createPrimitive(engine.world, { primitive: 'box' });
        addComponent(engine.world, cube, RigidBody, createRigidBody('dynamic', 0.3, 0.6));
        engine.step();

        updateComponent(engine.world, cube, Mesh, (data) => {
            data.primitive = 'sphere';
        });
        engine.step();

        const collider = getPhysicsSession(engine.world)!.bodies.get(cube)!.collider;
        expect(collider.friction()).toBeCloseTo(0.3);
        expect(collider.restitution()).toBeCloseTo(0.6);
    });

    it('bounces higher when both bodies have restitution 1', async () => {
        const peakAfterContact = async (restitution: number): Promise<number> => {
            const local = new TitaneEngine(createMockRenderer(), createMockCanvas());
            await local.ready;

            const ground = createPrimitive(local.world, {
                primitive: 'box',
                scale: { x: 12, y: 0.5, z: 12 },
                position: { x: 0, y: -0.25, z: 0 }
            });
            addComponent(local.world, ground, RigidBody, createRigidBody('fixed', 0.5, restitution));

            const ball = createPrimitive(local.world, {
                primitive: 'sphere',
                position: { x: 0, y: 4, z: 0 }
            });
            addComponent(local.world, ball, RigidBody, createRigidBody('dynamic', 0.5, restitution));

            let peak = 0;
            let sawContact = false;
            for (let i = 0; i < 120; i++) {
                local.step();
                const y = getComponent(local.world, ball, Transform)!.position.y;
                if (!sawContact && y < 1.2) sawContact = true;
                if (sawContact && y > peak) peak = y;
            }
            return peak;
        };

        expect(await peakAfterContact(1)).toBeGreaterThan((await peakAfterContact(0)) + 0.5);
    });
});
