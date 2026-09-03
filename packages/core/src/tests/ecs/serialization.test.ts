import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { Transform, createTransform } from '../../ecs/components/transform';
import { Name, createName } from '../../ecs/components/name';
import { Mesh, createMesh } from '../../ecs/components/mesh';
import { Gltf, createGltf } from '../../ecs/components/gltf';
import { Sound, createSound } from '../../ecs/components/sound';
import {
    SCENE_FORMAT_VERSION,
    serializeWorld,
    deserializeWorld,
    type SerializedWorld
} from '../../ecs/serialization';

describe('ECS: Scene Serialization', () => {
    it('should round-trip a world through JSON', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Name, createName('Hero'));
        addComponent(world, entity, Transform, createTransform({ x: 1, y: 2, z: 3 }));

        const raw = JSON.stringify(serializeWorld(world));
        const restored = deserializeWorld(JSON.parse(raw) as SerializedWorld);

        expect(restored.entities.active.has(entity)).toBe(true);
        expect(getComponent(restored, entity, Name)?.value).toBe('Hero');
        expect(getComponent(restored, entity, Transform)?.position).toEqual({ x: 1, y: 2, z: 3 });
    });

    it('should stamp the format version', () => {
        expect(serializeWorld(createWorld()).version).toBe(SCENE_FORMAT_VERSION);
    });

    it('should revive the worldMatrix that JSON cannot represent', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Transform, createTransform({ x: 5, y: 0, z: 0 }));

        const raw = JSON.stringify(serializeWorld(world));
        const restored = deserializeWorld(JSON.parse(raw) as SerializedWorld);
        const transform = getComponent(restored, entity, Transform);

        // A real Float32Array again, flagged for the transform system to recompute
        expect(transform?.worldMatrix).toBeInstanceOf(Float32Array);
        expect(transform?.worldMatrix.length).toBe(16);
        expect(transform?.isDirty).toBe(true);
    });

    it('should preserve parenting across a round-trip', () => {
        const world = createWorld();
        const parent = createEntity(world);
        const child = createEntity(world);
        addComponent(world, parent, Transform, createTransform());

        const childTransform = createTransform();
        childTransform.parent = parent;
        addComponent(world, child, Transform, childTransform);

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, child, Transform)?.parent).toBe(parent);
        expect(getComponent(restored, parent, Transform)?.parent).toBeNull();
    });

    it('should skip unknown components instead of corrupting the world', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const restored = deserializeWorld({
            version: SCENE_FORMAT_VERSION,
            nextId: 1,
            entities: [0],
            components: { 'not-a-registered-component': { 0: { foo: 1 } } }
        });

        expect(restored.entities.active.has(0)).toBe(true);
        expect(warn).toHaveBeenCalled();

        warn.mockRestore();
    });

    it('should fill Mesh.albedo when an older scene omitted it', () => {
        const restored = deserializeWorld({
            version: SCENE_FORMAT_VERSION,
            nextId: 1,
            entities: [0],
            components: {
                mesh: { 0: { primitive: 'box', color: '#00ff00' } }
            }
        });

        expect(getComponent(restored, 0, Mesh)).toEqual({
            primitive: 'box',
            color: '#00ff00',
            albedo: ''
        });
    });

    it('should round-trip a mesh albedo URL', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Mesh, createMesh('sphere', '#ffffff', 'wall.png'));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, Mesh)?.albedo).toBe('wall.png');
    });

    it('should round-trip a glTF URL', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Gltf, createGltf('hero.glb'));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, Gltf)?.url).toBe('hero.glb');
    });

    it('should round-trip a sound clip', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Sound, createSound('wind.ogg', 0.5, true, false, true));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, Sound)).toEqual({
            url: 'wind.ogg',
            volume: 0.5,
            loop: true,
            positional: false,
            playing: true
        });
    });

    it('should refuse scenes written by a newer format', () => {
        expect(() => deserializeWorld({
            version: SCENE_FORMAT_VERSION + 1,
            nextId: 0,
            entities: [],
            components: {}
        })).toThrow(/newer/);
    });
});
