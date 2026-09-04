import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import type { IRenderer } from '../../runtime/renderer-interface';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { Transform, createTransform } from '../../ecs/components/transform';
import { RigidBody, createRigidBody } from '../../ecs/components/rigid-body';
import { Collider, createCollider } from '../../ecs/components/collider';
import { Name, createName } from '../../ecs/components/name';
import { setMeshColliderGeometryProvider } from '../../physics/session';

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

const spawnBody = (engine: TitaneEngine, y: number) => {
    const entity = createEntity(engine.world);
    addComponent(engine.world, entity, Name, createName('Body'));
    addComponent(engine.world, entity, Transform, createTransform({ x: 0, y, z: 0 }));
    addComponent(engine.world, entity, RigidBody, createRigidBody('dynamic'));
    return entity;
};

describe('Collider component', () => {
    let engine: TitaneEngine;

    beforeEach(() => {
        vi.stubGlobal('requestAnimationFrame', vi.fn());
        engine = new TitaneEngine(createMockRenderer(), createMockCanvas());
    });

    it('simulates a box collider without a Mesh', () => {
        const entity = spawnBody(engine, 5);
        addComponent(engine.world, entity, Collider, createCollider('box'));

        const startY = getComponent(engine.world, entity, Transform)!.position.y;
        for (let i = 0; i < 30; i++) engine.step();

        expect(getComponent(engine.world, entity, Transform)!.position.y).toBeLessThan(startY);
    });

    it('does not crash when a mesh collider has no geometry yet', () => {
        const entity = spawnBody(engine, 5);
        addComponent(engine.world, entity, Collider, createCollider('mesh'));

        expect(() => {
            for (let i = 0; i < 5; i++) engine.step();
        }).not.toThrow();
        expect(getComponent(engine.world, entity, Transform)!.position.y).toBeCloseTo(5, 5);
    });

    it('builds a trimesh when the renderer supplies geometry', () => {
        const entity = spawnBody(engine, 5);
        addComponent(engine.world, entity, Collider, createCollider('mesh'));
        setMeshColliderGeometryProvider(engine.world, () => ({
            vertices: new Float32Array([
                -1, 0, -1,
                1, 0, -1,
                0, 0, 1
            ]),
            indices: new Uint32Array([0, 1, 2])
        }));

        expect(() => {
            for (let i = 0; i < 10; i++) engine.step();
        }).not.toThrow();
        expect(getComponent(engine.world, entity, Transform)!.position.y).toBeCloseTo(5, 5);
    });
});
