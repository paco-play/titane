import { describe, it, expect } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { Gltf, createGltf, playGltfClip } from '../../ecs/components/gltf';

describe('Gltf', () => {
    it('clamps fade on create', () => {
        expect(createGltf('hero.glb', 'Walk', true, true, -1).fade).toBe(0);
        expect(createGltf('hero.glb', 'Walk', true, true, Number.NaN).fade).toBe(0);
        expect(createGltf('hero.glb', 'Walk', true, true, 0.25).fade).toBe(0.25);
    });

    it('playGltfClip sets clip, playing, and optional fade', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Gltf, createGltf('hero.glb', 'Walk', false, true, 0.1));

        playGltfClip(world, entity, 'Run', 0.25);

        expect(getComponent(world, entity, Gltf)).toEqual({
            url: 'hero.glb',
            clip: 'Run',
            playing: true,
            loop: true,
            fade: 0.25
        });
    });

    it('playGltfClip keeps the stored fade when omitted', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Gltf, createGltf('hero.glb', 'Walk', true, true, 0.2));

        playGltfClip(world, entity, 'Idle');

        const data = getComponent(world, entity, Gltf);
        expect(data?.clip).toBe('Idle');
        expect(data?.playing).toBe(true);
        expect(data?.fade).toBe(0.2);
    });
});
