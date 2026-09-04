import { describe, expect, it } from 'vitest';
import { parseProjectItemPayload } from '../app/utils/project-item-payload';

describe('parseProjectItemPayload', () => {
  it('reads a model tile', () => {
    expect(parseProjectItemPayload(JSON.stringify({
      kind: 'model',
      url: '/assets/crate.glb',
      name: 'crate.glb',
      label: 'crate'
    }))).toEqual({
      kind: 'model',
      url: '/assets/crate.glb',
      name: 'crate.glb',
      label: 'crate'
    });
  });

  it('rejects invalid JSON and unknown kinds', () => {
    expect(parseProjectItemPayload('')).toBeNull();
    expect(parseProjectItemPayload('{')).toBeNull();
    expect(parseProjectItemPayload(JSON.stringify({ kind: 'shader', url: '/x' }))).toBeNull();
    expect(parseProjectItemPayload(JSON.stringify({ kind: 'model', url: '' }))).toBeNull();
  });

  it('fills name and label from the url when omitted', () => {
    expect(parseProjectItemPayload(JSON.stringify({
      kind: 'prefab',
      url: '/prefabs/box.titane'
    }))).toEqual({
      kind: 'prefab',
      url: '/prefabs/box.titane',
      name: '/prefabs/box.titane',
      label: '/prefabs/box.titane'
    });
  });
});
