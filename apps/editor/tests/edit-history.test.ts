import { describe, expect, it } from 'vitest';
import {
  addComponent,
  captureWorldState,
  createEntity,
  createName,
  createWorld,
  getComponent,
  Name
} from '@titane/core';
import { createEditHistory } from '../app/utils/edit-history';

describe('createEditHistory', () => {
  it('undoes the last recorded world and redos it', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName('Before'));
    const history = createEditHistory();
    history.prime(world);

    getComponent(world, entity, Name)!.value = 'After';
    history.record(world);

    expect(history.undo(world)).toBe(true);
    expect(getComponent(world, entity, Name)?.value).toBe('Before');

    expect(history.redo(world)).toBe(true);
    expect(getComponent(world, entity, Name)?.value).toBe('After');
  });

  it('returns false when there is nothing to undo', () => {
    const world = createWorld();
    const history = createEditHistory();
    history.prime(world);
    expect(history.undo(world)).toBe(false);
    expect(history.canUndo()).toBe(false);
  });

  it('primes clears stacks', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName('A'));
    const history = createEditHistory();
    history.prime(world);
    getComponent(world, entity, Name)!.value = 'B';
    history.record(world);
    history.prime(captureWorldState(world));
    expect(history.canUndo()).toBe(false);
  });

  it('coalesces two records in the same turn into one undo step', () => {
    const world = createWorld();
    const entity = createEntity(world);
    addComponent(world, entity, Name, createName('A'));
    const history = createEditHistory();
    history.prime(world);

    getComponent(world, entity, Name)!.value = 'B';
    history.record(world);
    getComponent(world, entity, Name)!.value = 'C';
    history.record(world);

    expect(history.undo(world)).toBe(true);
    expect(getComponent(world, entity, Name)?.value).toBe('A');
    expect(history.undo(world)).toBe(false);
  });
});
