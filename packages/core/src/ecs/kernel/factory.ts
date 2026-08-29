import type { World } from './world';
import type { Entity } from '../types';
import { createEntity } from './entity';
import { addComponent } from './component';
import { Transform, createTransform, type Vec3 } from '../components/transform';
import { Mesh, createMesh, type PrimitiveType } from '../components/mesh';
import { Name, createName } from '../components/name';

/**
 * Options accepted when spawning a primitive game object.
 */
export interface PrimitiveOptions {
    name?: string;
    primitive?: PrimitiveType;
    color?: string;
    position?: Vec3;
}

/** Capitalized primitive name, used as the default entity name. */
const defaultName = (primitive: PrimitiveType): string =>
    primitive.charAt(0).toUpperCase() + primitive.slice(1);

/**
 * Spawns a named, renderable entity with a Transform and a Mesh.
 * @param world - The world to spawn into.
 * @param options - Overrides for the shape, color, name and position.
 * @returns The newly created entity.
 */
export const createPrimitive = (world: World, options: PrimitiveOptions = {}): Entity => {
    const primitive = options.primitive ?? 'box';

    const entity = createEntity(world);
    addComponent(world, entity, Name, createName(options.name ?? defaultName(primitive)));
    addComponent(world, entity, Transform, createTransform(options.position));
    addComponent(world, entity, Mesh, createMesh(primitive, options.color));

    return entity;
};
