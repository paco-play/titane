import { describe, it, expect, vi } from 'vitest';
import { createWorld } from '../../ecs/kernel/world';
import { createEntity } from '../../ecs/kernel/entity';
import { addComponent, getComponent } from '../../ecs/kernel/component';
import { Transform, createTransform } from '../../ecs/components/transform';
import { Name, createName } from '../../ecs/components/name';
import { Mesh, createMesh } from '../../ecs/components/mesh';
import { Light } from '../../ecs/components/light';
import { Camera, createCamera } from '../../ecs/components/camera';
import { Gltf, createGltf } from '../../ecs/components/gltf';
import { Sound, createSound } from '../../ecs/components/sound';
import { RigidBody, createRigidBody } from '../../ecs/components/rigid-body';
import {
    SCENE_FORMAT_VERSION,
    serializeWorld,
    deserializeWorld,
    isSerializedWorld,
    type SerializedWorld
} from '../../ecs/serialization';
import { listOrphans } from '../../ecs/kernel/orphans';

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

    it('distinguishes a scene payload from a prefab-shaped object', () => {
        expect(isSerializedWorld(serializeWorld(createWorld()))).toBe(true);
        expect(isSerializedWorld({ version: 1, root: 0, entities: [0], components: {} })).toBe(false);
        expect(isSerializedWorld(null)).toBe(false);
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

    it('should keep unknown components as missing-script orphans', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const restored = deserializeWorld({
            version: SCENE_FORMAT_VERSION,
            nextId: 1,
            entities: [0],
            components: { 'not-a-registered-component': { 0: { foo: 1 } } }
        });

        expect(restored.entities.active.has(0)).toBe(true);
        expect(listOrphans(restored, 0)).toEqual([
            { id: 'not-a-registered-component', data: { foo: 1 } }
        ]);
        expect(warn).toHaveBeenCalled();

        const roundTrip = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(restored))) as SerializedWorld
        );
        expect(listOrphans(roundTrip, 0)).toEqual([
            { id: 'not-a-registered-component', data: { foo: 1 } }
        ]);

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
            albedo: '',
            roughness: 1,
            metalness: 0,
            emissive: '#000000',
            castShadow: true,
            receiveShadow: true
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

    it('should round-trip mesh material fields', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Mesh, createMesh('box', '#ffffff', '', 0.25, 0.9, '#112233'));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, Mesh)).toMatchObject({
            roughness: 0.25,
            metalness: 0.9,
            emissive: '#112233',
            castShadow: true,
            receiveShadow: true
        });
    });

    it('should fill Light.castShadow when an older scene omitted it', () => {
        const restored = deserializeWorld({
            version: SCENE_FORMAT_VERSION,
            nextId: 1,
            entities: [0],
            components: {
                light: { 0: { kind: 'directional', color: '#ffffff', intensity: 1, distance: 0 } }
            }
        });

        expect(getComponent(restored, 0, Light)?.castShadow).toBe(false);
    });

    it('should round-trip a glTF URL', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Gltf, createGltf('hero.glb', 'Walk', true, false));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, Gltf)).toEqual({
            url: 'hero.glb',
            clip: 'Walk',
            playing: true,
            loop: false,
            fade: 0
        });
    });

    it('should fill Gltf animation fields when an older scene omitted them', () => {
        const restored = deserializeWorld({
            version: SCENE_FORMAT_VERSION,
            nextId: 1,
            entities: [0],
            components: {
                gltf: { 0: { url: 'hero.glb' } }
            }
        });

        expect(getComponent(restored, 0, Gltf)).toEqual({
            url: 'hero.glb',
            clip: '',
            playing: false,
            loop: true,
            fade: 0
        });
    });

    it('should round-trip Gltf fade', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Gltf, createGltf('hero.glb', 'Walk', true, true, 0.2));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, Gltf)?.fade).toBe(0.2);
    });

    it('should round-trip rigid-body material fields', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, RigidBody, createRigidBody('fixed', 0.8, 0.4));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, RigidBody)).toEqual({
            kind: 'fixed',
            friction: 0.8,
            restitution: 0.4
        });
    });

    it('should fill RigidBody friction and restitution when an older scene omitted them', () => {
        const restored = deserializeWorld({
            version: SCENE_FORMAT_VERSION,
            nextId: 1,
            entities: [0],
            components: {
                'rigid-body': { 0: { kind: 'dynamic' } }
            }
        });

        expect(getComponent(restored, 0, RigidBody)).toEqual({
            kind: 'dynamic',
            friction: 0.5,
            restitution: 0
        });
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

    it('should round-trip a camera', () => {
        const world = createWorld();
        const entity = createEntity(world);
        addComponent(world, entity, Camera, createCamera(60, 0.2, 200, false));

        const restored = deserializeWorld(
            JSON.parse(JSON.stringify(serializeWorld(world))) as SerializedWorld
        );

        expect(getComponent(restored, entity, Camera)).toEqual({
            fov: 60,
            near: 0.2,
            far: 200,
            current: false
        });
    });

    it('should fill Camera fields when an older scene omitted them', () => {
        const restored = deserializeWorld({
            version: SCENE_FORMAT_VERSION,
            nextId: 1,
            entities: [0],
            components: {
                camera: { 0: {} }
            }
        });

        expect(getComponent(restored, 0, Camera)).toEqual({
            fov: 75,
            near: 0.1,
            far: 1000,
            current: true
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
