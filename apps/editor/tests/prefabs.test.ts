import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listProjectPrefabs } from '../server/utils/list-project-prefabs';
import { prefabFileName } from '../app/utils/prefab-filename';

describe('prefab catalog', () => {
  it('slugifies a download name', () => {
    expect(prefabFileName('Red Crate')).toBe('red-crate.titane');
    expect(prefabFileName('  ')).toBe('prefab.titane');
  });

  it('returns an empty list when the folder is missing', async () => {
    expect(await listProjectPrefabs(join(tmpdir(), 'titane-missing-prefabs'))).toEqual([]);
  });

  it('lists nested .titane files and skips others', async () => {
    const root = mkdtempSync(join(tmpdir(), 'titane-prefabs-'));
    mkdirSync(join(root, 'props'));
    writeFileSync(join(root, 'props', 'barrel.titane'), '{}');
    writeFileSync(join(root, 'notes.txt'), '');
    writeFileSync(join(root, '.gitkeep'), '');

    expect(await listProjectPrefabs(root)).toEqual([
      { url: '/prefabs/props/barrel.titane', name: 'props/barrel' }
    ]);
  });
});
