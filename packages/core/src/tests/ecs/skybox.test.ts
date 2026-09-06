import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent } from '../../ecs/kernel/component';
import {
    Skybox,
    createSkybox,
    DEFAULT_SKYBOX_COLOR
} from '../../ecs/components/skybox';
import { pickSkybox } from '../../ecs/kernel/skybox-utils';

describe('Skybox', () => {
    it('defaults to the engine void color and no cubemap', () => {
        expect(createSkybox()).toEqual({
            color: DEFAULT_SKYBOX_COLOR,
            cubemap: ''
        });
    });

    it('trims the cubemap url on create and revive', () => {
        expect(createSkybox('#112233', '  /sky.hdr  ').cubemap).toBe('/sky.hdr');

        const revive = Skybox.revive;
        expect(revive).toBeDefined();
        if (!revive) return;
        expect(revive({})).toEqual({
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
});
