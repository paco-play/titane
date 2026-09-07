import { describe, expect, it } from 'vitest';
import {
  Input,
  Mesh,
  Name,
  Skybox,
  Transform,
  addComponent,
  createEntity,
  createDefaultInput,
  createMesh,
  createName,
  createSkybox,
  createTransform,
  createWorld
} from '@titane/core';
import { isHierarchyVisible } from '../app/utils/hierarchy-visible';

describe('isHierarchyVisible', () => {
  it('hides the engine Input singleton', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Input, createDefaultInput());

    expect(isHierarchyVisible(world, entity)).toBe(false);
  });

  it('hides a Transform-less sky entity', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName('Skybox'));
    addComponent(world, entity, Skybox, createSkybox());

    expect(isHierarchyVisible(world, entity)).toBe(false);
  });

  it('keeps a mesh that also carries Skybox', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName('Cube'));
    addComponent(world, entity, Transform, createTransform());
    addComponent(world, entity, Mesh, createMesh());
    addComponent(world, entity, Skybox, createSkybox());

    expect(isHierarchyVisible(world, entity)).toBe(true);
  });
});
