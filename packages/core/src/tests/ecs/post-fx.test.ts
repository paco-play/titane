import { describe, expect, it } from 'vitest';
import { addComponent, getComponent, hasComponent } from '../../ecs/kernel/component';
import { createEntity } from '../../ecs/kernel/entity';
import { createWorld } from '../../ecs/kernel/world';
import { Name } from '../../ecs/components/name';
import { Mesh, createMesh } from '../../ecs/components/mesh';
import { Transform, createTransform } from '../../ecs/components/transform';
import {
    PostFx,
    createPostFx,
    postFxIsIdentity,
    DEFAULT_POST_FX_TINT
} from '../../ecs/components/post-fx';
import {
    pickPostFx,
    ensurePostFx,
    clearPostFx,
    WORLD_POST_FX_NAME
} from '../../ecs/kernel/post-fx-utils';
import { deserializeWorld, serializeWorld, type SerializedWorld } from '../../ecs/serialization';

describe('PostFx', () => {
    it('defaults to identity grading', () => {
        const data = createPostFx();
        expect(data).toEqual({
            bloom: 0,
            exposure: 1,
            contrast: 1,
            saturation: 1,
            tint: DEFAULT_POST_FX_TINT,
            vignette: 0
        });
        expect(postFxIsIdentity(data)).toBe(true);
    });

    it('clamps authored values', () => {
        expect(createPostFx(9, 0, 9, 9, '', 2)).toEqual({
            bloom: 3,
            exposure: 0.1,
            contrast: 3,
            saturation: 3,
            tint: DEFAULT_POST_FX_TINT,
            vignette: 1
        });
    });

    it('ensurePostFx creates a named filter-only entity once', () => {
        const world = createWorld();
        const a = ensurePostFx(world);
        const b = ensurePostFx(world);

        expect(a).toBe(b);
        expect(getComponent(world, a, Name)?.value).toBe(WORLD_POST_FX_NAME);
        expect(hasComponent(world, a, Transform)).toBe(false);
        expect(getComponent(world, a, PostFx)).toEqual(createPostFx());
    });

    it('clearPostFx destroys a filter-only entity', () => {
        const world = createWorld();
        const entity = ensurePostFx(world);
        clearPostFx(world);
        expect(pickPostFx(world)).toBe(null);
        expect(world.entities.active.has(entity)).toBe(false);
    });

    it('clearPostFx strips PostFx parked on a mesh', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Mesh, createMesh());
        addComponent(world, entity, PostFx, createPostFx(1));
        clearPostFx(world);
        expect(pickPostFx(world)).toBe(null);
        expect(world.entities.active.has(entity)).toBe(true);
        expect(hasComponent(world, entity, PostFx)).toBe(false);
    });

    it('round-trips through .titane JSON', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, PostFx, createPostFx(0.8, 1.2, 1.1, 0.7, '#ffccaa', 0.3));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, PostFx)).toEqual({
            bloom: 0.8,
            exposure: 1.2,
            contrast: 1.1,
            saturation: 0.7,
            tint: '#ffccaa',
            vignette: 0.3
        });
        expect(postFxIsIdentity(getComponent(restored, entity, PostFx)!)).toBe(false);
    });
});
