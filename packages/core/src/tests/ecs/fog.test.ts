import { describe, expect, it } from 'vitest';
import { addComponent, getComponent, hasComponent } from '../../ecs/kernel/component';
import { createEntity } from '../../ecs/kernel/entity';
import { createWorld } from '../../ecs/kernel/world';
import { Name } from '../../ecs/components/name';
import { Mesh, createMesh } from '../../ecs/components/mesh';
import { Transform, createTransform } from '../../ecs/components/transform';
import {
  Fog,
  createFog,
  DEFAULT_FOG_COLOR,
  DEFAULT_FOG_FADE_DISTANCE
} from '../../ecs/components/fog';
import {
  pickFog,
  ensureFog,
  clearFog,
  WORLD_FOG_NAME
} from '../../ecs/kernel/fog-utils';
import { deserializeWorld, serializeWorld } from '../../ecs/serialization';

describe('Fog', () => {
  it('defaults to a linear fade that is not a camera clip', () => {
    expect(createFog()).toEqual({
      color: DEFAULT_FOG_COLOR,
      fadeDistance: DEFAULT_FOG_FADE_DISTANCE
    });
  });

  it('clamps fade distance and fills a missing color', () => {
    expect(createFog('', 0)).toEqual({
      color: DEFAULT_FOG_COLOR,
      fadeDistance: 0.1
    });
  });

  it('ensureFog creates a named fog-only entity once', () => {
    const world = createWorld();
    const a = ensureFog(world);
    const b = ensureFog(world);

    expect(a).toBe(b);
    expect(getComponent(world, a, Name)?.value).toBe(WORLD_FOG_NAME);
    expect(hasComponent(world, a, Transform)).toBe(false);
    expect(getComponent(world, a, Fog)).toEqual(createFog());
  });

  it('clearFog destroys a fog-only entity', () => {
    const world = createWorld();
    const entity = ensureFog(world);
    clearFog(world);
    expect(pickFog(world)).toBe(null);
    expect(world.entities.active.has(entity)).toBe(false);
  });

  it('clearFog strips Fog parked on a mesh', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Transform, createTransform());
    addComponent(world, entity, Mesh, createMesh());
    addComponent(world, entity, Fog, createFog('#111111', 12));
    clearFog(world);
    expect(pickFog(world)).toBe(null);
    expect(world.entities.active.has(entity)).toBe(true);
    expect(hasComponent(world, entity, Fog)).toBe(false);
  });

  it('round-trips through .titane JSON', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Fog, createFog('#aabbcc', 40));
    const restored = deserializeWorld(serializeWorld(world));
    expect(getComponent(restored, entity, Fog)).toEqual({
      color: '#aabbcc',
      fadeDistance: 40
    });
  });
});
