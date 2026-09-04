import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { kindFromExtension, listProjectAssets } from '../server/utils/list-project-assets';

describe('listProjectAssets', () => {
  it('maps known extensions to asset kinds', () => {
    expect(kindFromExtension('.PNG')).toBe('texture');
    expect(kindFromExtension('.glb')).toBe('model');
    expect(kindFromExtension('.ogg')).toBe('audio');
    expect(kindFromExtension('.txt')).toBeUndefined();
  });

  it('returns an empty list when the folder is missing', async () => {
    expect(await listProjectAssets(join(tmpdir(), 'titane-missing-assets'))).toEqual([]);
  });

  it('lists nested files and skips unknowns', async () => {
    const root = mkdtempSync(join(tmpdir(), 'titane-assets-'));
    mkdirSync(join(root, 'textures'));
    writeFileSync(join(root, 'textures', 'hero.png'), '');
    writeFileSync(join(root, 'crate.glb'), '');
    writeFileSync(join(root, 'notes.txt'), '');
    writeFileSync(join(root, '.gitkeep'), '');

    expect(await listProjectAssets(root)).toEqual([
      { url: '/assets/crate.glb', name: 'crate.glb', kind: 'model' },
      { url: '/assets/textures/hero.png', name: 'textures/hero.png', kind: 'texture' }
    ]);
  });
});
