import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent, hasComponent } from '../../ecs/kernel/component';
import { Transform, createTransform } from '../../ecs/components/transform';
import { Mesh, createMesh } from '../../ecs/components/mesh';
import { Name } from '../../ecs/components/name';
import {
    Skybox,
    createSkybox,
    DEFAULT_SKYBOX_COLOR,
    DEFAULT_SKYBOX_CUBEMAP
} from '../../ecs/components/skybox';
import {
    pickSkybox,
    ensureSkybox,
    clearSkybox,
    WORLD_SKYBOX_NAME
} from '../../ecs/kernel/skybox-utils';

describe('Skybox', () => {
    it('defaults to the engine sky cubemap', () => {
        expect(createSkybox()).toEqual({
            color: DEFAULT_SKYBOX_COLOR,
            cubemap: DEFAULT_SKYBOX_CUBEMAP
        });
    });

    it('trims the cubemap url on create and revive', () => {
        expect(createSkybox('#112233', '  /sky.hdr  ').cubemap).toBe('/sky.hdr');

        const revive = Skybox.revive;
        expect(revive).toBeDefined();
        if (!revive) return;
        expect(revive({})).toEqual({
            color: DEFAULT_SKYBOX_COLOR,
            cubemap: DEFAULT_SKYBOX_CUBEMAP
        });
        expect(revive({ cubemap: '' })).toEqual({
            color: DEFAULT_SKYBOX_COLOR,
            cubemap: ''
        });
        expect(revive({ color: '#abcabc', cubemap: ' env.png ' })).toEqual({
            color: '#abcabc',
            cubemap: 'env.png'
        });
    });

    it('picks the first authored skybox', () => {
        const world = createWorld();
        const a = createEntity(world);
        const b = createEntity(world);
        addComponent(world, a, Skybox, createSkybox('#111111'));
        addComponent(world, b, Skybox, createSkybox('#222222'));

        expect(pickSkybox(world)).toBe(a);
    });

    it('ensureSkybox creates a named sky-only entity once', () => {
        const world = createWorld();
        const a = ensureSkybox(world);
        const b = ensureSkybox(world);

        expect(a).toBe(b);
        expect(getComponent(world, a, Name)?.value).toBe(WORLD_SKYBOX_NAME);
        expect(hasComponent(world, a, Transform)).toBe(false);
        expect(hasComponent(world, a, Mesh)).toBe(false);
        expect(getComponent(world, a, Skybox)).toEqual(createSkybox());
    });

    it('clearSkybox destroys a sky-only entity', () => {
        const world = createWorld();
        const entity = ensureSkybox(world);

        clearSkybox(world);

        expect(pickSkybox(world)).toBe(null);
        expect(world.entities.active.has(entity)).toBe(false);
    });

    it('clearSkybox strips Skybox parked on a mesh', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform());
        addComponent(world, entity, Mesh, createMesh());
        addComponent(world, entity, Skybox, createSkybox('#111111'));

        clearSkybox(world);

        expect(pickSkybox(world)).toBe(null);
        expect(world.entities.active.has(entity)).toBe(true);
        expect(hasComponent(world, entity, Skybox)).toBe(false);
    });
});
