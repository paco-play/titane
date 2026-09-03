import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import type { IRenderer } from '../../runtime/renderer-interface';
import { createPrimitive } from '../../ecs/kernel/factory';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { Transform } from '../../ecs/components/transform';
import { Input } from '../../ecs/components/input';
import { RigidBody, createRigidBody } from '../../ecs/components/rigid-body';
import { PlayerControlled, createPlayerControlled } from '../../ecs/components/player-controlled';
import { createPhysicsPlayerControlSystem } from '../../ecs/systems/physics-player-control';
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

describe('createPhysicsPlayerControlSystem', () => {
    let engine: TitaneEngine;

    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', vi.fn());
        engine = new TitaneEngine(createMockRenderer(), createMockCanvas());
        engine.addSystem(Phase.UPDATE, createPhysicsPlayerControlSystem());

        const ground = createPrimitive(engine.world, {
            name: 'Ground',
            position: { x: 0, y: -0.5, z: 0 },
            scale: { x: 20, y: 1, z: 20 }
        });
        addComponent(engine.world, ground, RigidBody, createRigidBody('fixed'));
    });

    const spawnPlayer = () => {
        const player = createPrimitive(engine.world, {
            name: 'Player',
            primitive: 'sphere',
            position: { x: 0, y: 2, z: 0 }
        });
        addComponent(engine.world, player, RigidBody, createRigidBody('dynamic'));
        addComponent(engine.world, player, PlayerControlled, createPlayerControlled());
        return player;
    };

    it('rests on a fixed slab instead of falling through', () => {
        const player = spawnPlayer();

        for (let i = 0; i < 90; i++) engine.step();

        expect(getComponent(engine.world, player, Transform)!.position.y).toBeGreaterThan(0.2);
        expect(getComponent(engine.world, player, Transform)!.position.y).toBeLessThan(1.5);
    });

    it('applies WASD as horizontal linvel and keeps the body on the slab', () => {
        const player = spawnPlayer();
        for (let i = 0; i < 45; i++) engine.step();

        const input = getComponent(engine.world, engine.globalInputEntity, Input)!;
        input.keys['KeyW'] = true;

        const startZ = getComponent(engine.world, player, Transform)!.position.z;
        for (let i = 0; i < 60; i++) engine.step();

        const transform = getComponent(engine.world, player, Transform)!;
        expect(transform.position.z).toBeLessThan(startZ - 1);
        expect(transform.position.y).toBeGreaterThan(0.2);
    });
});
