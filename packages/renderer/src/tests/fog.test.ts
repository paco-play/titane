import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  addComponent,
  createEntity,
  createFog,
  createWorld,
  Fog
} from '@titane/core';
import { FogApplier } from '../fog';

describe('FogApplier', () => {
  it('clears scene fog when none is authored', () => {
    const world = createWorld();
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xffffff, 0, 10);
    const applier = new FogApplier();

    applier.apply(world, scene);

    expect(scene.fog).toBeNull();
  });

  it('applies linear fog from color and fade distance', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Fog, createFog('#112233', 25));
    const scene = new THREE.Scene();
    const applier = new FogApplier();

    applier.apply(world, scene);

    expect(scene.fog).toBeInstanceOf(THREE.Fog);
    const fog = scene.fog as THREE.Fog;
    expect(fog.near).toBe(0);
    expect(fog.far).toBe(25);
    expect(fog.color.getHexString()).toBe('112233');
  });
});
