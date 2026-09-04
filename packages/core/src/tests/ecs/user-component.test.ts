import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TitaneEngine } from '../../runtime/engine';
import type { IRenderer } from '../../runtime/renderer-interface';
import { defineComponent } from '../../ecs/kernel/registry';
import { addComponent, getComponent, removeComponent } from '../../ecs/kernel/component';
import { createEntity } from '../../ecs/kernel/entity';
import { f } from '../../ecs/schema/fields';
import { serializeWorld, deserializeWorld } from '../../ecs/serialization';
import { FIXED_DT } from '../../utils/fixed-step';

const createMockRenderer = (): IRenderer => ({
    init: vi.fn(),
    render: vi.fn(),
    handleResize: vi.fn(),
    setSize: vi.fn(),
    dispose: vi.fn()
});

const createEngine = (): TitaneEngine => {
    const canvas = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        getBoundingClientRect: vi.fn(() => ({ width: 800, height: 600, top: 0, left: 0 })),
        getContext: vi.fn()
    } as unknown as HTMLCanvasElement;
    return new TitaneEngine(createMockRenderer(), canvas);
};

const Motor = defineComponent('UserMotor', {
    schema: {
        speed: f.number({ min: 0, max: 20, step: 0.1, default: 5 })
    }
});

describe('user defineComponent', () => {
    it('infers data from the schema and revives through serialization', () => {
        const world = createEngine().world;
        const entity = createEntity(world);
        addComponent(world, entity, Motor, Motor.create());

        const live = getComponent(world, entity, Motor);
        expect(live?.speed).toBe(5);
        if (live) live.speed = 8.25;

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as ReturnType<typeof serializeWorld>
        );
        expect(getComponent(restored, entity, Motor)?.speed).toBe(8.25);
    });

    it('fills schema defaults when an older payload omitted a field', () => {
        const restored = deserializeWorld({
            version: 1,
            nextId: 1,
            entities: [0],
            components: { UserMotor: { 0: {} } }
        });
        expect(getComponent(restored, 0, Motor)?.speed).toBe(5);
    });
});

describe('engine.registerComponent lifecycle', () => {
    let engine: TitaneEngine;

    const Walker = defineComponent('UserWalker', {
        schema: {
            speed: f.number({ default: 2 })
        },
        onStart: vi.fn(),
        onUpdate: vi.fn(),
        onDestroy: vi.fn()
    });

    beforeEach(() => {
        engine = createEngine();
        Walker.onStart = vi.fn();
        Walker.onUpdate = vi.fn();
        Walker.onDestroy = vi.fn();
        engine.registerComponent(Walker);
    });

    it('lists the type for Add Component and ignores a second register', () => {
        engine.registerComponent(Walker);
        expect(engine.getUserComponents()).toEqual([Walker]);
    });

    it('does not run hooks on a paused editor tick', () => {
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Walker, Walker.create());

        engine.tick(FIXED_DT);

        expect(Walker.onStart).not.toHaveBeenCalled();
        expect(Walker.onUpdate).not.toHaveBeenCalled();
    });

    it('runs onStart once and onUpdate every simulating step', () => {
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Walker, Walker.create());

        engine.isPaused = false;
        engine.tick(FIXED_DT);
        engine.tick(FIXED_DT);

        expect(Walker.onStart).toHaveBeenCalledTimes(1);
        expect(Walker.onUpdate).toHaveBeenCalledTimes(2);
        expect(Walker.onUpdate).toHaveBeenCalledWith(
            expect.objectContaining({ entity, dt: FIXED_DT, data: expect.objectContaining({ speed: 2 }) })
        );
    });

    it('runs onDestroy with last data when the component is removed during play', () => {
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Walker, Walker.create());

        engine.isPaused = false;
        engine.tick(FIXED_DT);
        removeComponent(engine.world, entity, Walker);
        engine.tick(FIXED_DT);

        expect(Walker.onDestroy).toHaveBeenCalledTimes(1);
        expect(Walker.onDestroy).toHaveBeenCalledWith(
            expect.objectContaining({ entity, data: expect.objectContaining({ speed: 2 }) })
        );
    });

    it('re-runs onStart after a snapshot restore (Play stop)', () => {
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Walker, Walker.create());

        engine.saveSnapshot();
        engine.isPaused = false;
        engine.tick(FIXED_DT);
        expect(Walker.onStart).toHaveBeenCalledTimes(1);

        engine.restoreSnapshot();
        engine.tick(FIXED_DT);
        expect(Walker.onStart).toHaveBeenCalledTimes(2);
    });

    it('keeps onStart from re-firing across isolated step() calls', () => {
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Walker, Walker.create());

        engine.step();
        engine.step();

        expect(Walker.onStart).toHaveBeenCalledTimes(1);
        expect(Walker.onUpdate).toHaveBeenCalledTimes(2);
    });
});

describe('script isolation and hot reload', () => {
    const Boom = defineComponent('UserBoom', {
        schema: {
            armed: f.boolean({ default: true })
        },
        onUpdate({ data }) {
            if (data.armed) throw new Error('boom');
        }
    });

    const Hot = defineComponent('UserHot', {
        schema: {
            speed: f.number({ default: 1 })
        }
    });

    it('isolates an onUpdate throw so the engine keeps ticking', () => {
        const engine = createEngine();
        engine.registerComponent(Boom);
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Boom, Boom.create());

        engine.isPaused = false;
        expect(() => engine.tick(FIXED_DT)).not.toThrow();
        expect(engine.scriptError).toMatchObject({
            componentId: 'UserBoom',
            entity,
            hook: 'onUpdate',
            message: 'boom'
        });
        expect(() => engine.tick(FIXED_DT)).not.toThrow();
    });

    it('does not restore after keepPlayChanges', () => {
        const engine = createEngine();
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Motor, Motor.create());
        const live = getComponent(engine.world, entity, Motor);
        expect(live).toBeDefined();
        if (!live) return;

        engine.saveSnapshot();
        live.speed = 11;
        engine.keepPlayChanges();
        engine.restoreSnapshot();
        expect(getComponent(engine.world, entity, Motor)?.speed).toBe(11);
    });

    it('patches schema and hooks on a second defineComponent and rebakes live data', () => {
        const engine = createEngine();
        engine.registerComponent(Hot);
        const entity = createEntity(engine.world);
        addComponent(engine.world, entity, Hot, Hot.create());

        const onUpdate = vi.fn();
        const patched = defineComponent('UserHot', {
            schema: {
                speed: f.number({ default: 1 }),
                jump: f.number({ default: 3 })
            },
            onUpdate
        });

        expect(patched).toBe(Hot);
        engine.reloadUserComponent(patched);
        expect(getComponent(engine.world, entity, Hot)).toMatchObject({ speed: 1, jump: 3 });

        engine.isPaused = false;
        engine.tick(FIXED_DT);
        expect(onUpdate).toHaveBeenCalled();
    });
});
