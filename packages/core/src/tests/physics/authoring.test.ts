import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { Transform, createTransform } from '../../ecs/components/transform';
import { RigidBody, createRigidBody } from '../../ecs/components/rigid-body';
import { Collider, createCollider } from '../../ecs/components/collider';
import { Name, createName } from '../../ecs/components/name';
import { ensureRigidBodyForCollider, rigidKindForCollider } from '../../physics/authoring';
import { createMockRenderer } from '../mock-renderer';

const createMockCanvas = (): HTMLCanvasElement => ({
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600, top: 0, left: 0 })),
    getContext: vi.fn()
} as unknown as HTMLCanvasElement);

describe('rigidKindForCollider', () => {
    it('spawns dynamic when attaching an analytic collider with no body', () => {
        expect(rigidKindForCollider('box', null)).toBe('dynamic');
        expect(rigidKindForCollider('sphere', null)).toBe('dynamic');
        expect(rigidKindForCollider('capsule', null)).toBe('dynamic');
    });

    it('keeps an existing kind for analytic colliders', () => {
        expect(rigidKindForCollider('box', 'dynamic')).toBe('dynamic');
        expect(rigidKindForCollider('box', 'fixed')).toBe('fixed');
    });

    it('forces mesh colliders to fixed', () => {
        expect(rigidKindForCollider('mesh', null)).toBe('fixed');
        expect(rigidKindForCollider('mesh', 'dynamic')).toBe('fixed');
    });
});

describe('ensureRigidBodyForCollider', () => {
    let engine: TitaneEngine;

    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', vi.fn());
        engine = new TitaneEngine(createMockRenderer(), createMockCanvas());
    });

    it('does not freeze an existing dynamic body when attaching a box collider', () => {
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Name, createName('Body'));
        addComponent(engine.world, entity, Transform, createTransform({ x: 0, y: 5, z: 0 }));
        addComponent(engine.world, entity, RigidBody, createRigidBody('dynamic'));

        ensureRigidBodyForCollider(engine.world, entity, 'box');
        addComponent(engine.world, entity, Collider, createCollider('box'));

        expect(getComponent(engine.world, entity, RigidBody)?.kind).toBe('dynamic');

        const startY = getComponent(engine.world, entity, Transform)!.position.y;
        for (let i = 0; i < 30; i++) engine.step();
        expect(getComponent(engine.world, entity, Transform)!.position.y).toBeLessThan(startY);
    });

    it('creates a dynamic body when an analytic collider has none', () => {
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Transform, createTransform());
        ensureRigidBodyForCollider(engine.world, entity, 'sphere');
        expect(getComponent(engine.world, entity, RigidBody)?.kind).toBe('dynamic');
    });

    it('forces an existing dynamic body to fixed for a mesh collider', () => {
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Transform, createTransform());
        addComponent(engine.world, entity, RigidBody, createRigidBody('dynamic'));
        ensureRigidBodyForCollider(engine.world, entity, 'mesh');
        expect(getComponent(engine.world, entity, RigidBody)?.kind).toBe('fixed');
    });
});
