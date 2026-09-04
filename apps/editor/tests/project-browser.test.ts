import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { filterProjectItems, folderLabel } from '../app/utils/project-browser';
import { listProjectScenes } from '../server/utils/list-project-scenes';
import type { ProjectItem } from '../app/types/project';

const sample: ProjectItem[] = [
  { kind: 'scene', name: 'main.titane', url: '/scenes/main.titane', label: 'main' },
  { kind: 'prefab', name: 'crate', url: '/prefabs/crate.titane', label: 'crate' },
  { kind: 'texture', name: 'textures/hero.png', url: '/assets/textures/hero.png', label: 'hero.png' }
];

describe('filterProjectItems', () => {
  it('keeps the selected folder and matches the query on label or path', () => {
    const main = sample[0];
    const hero = sample[2];
    expect(main).toBeDefined();
    expect(hero).toBeDefined();
    if (!main || !hero) return;
    expect(filterProjectItems(sample, 'scene', '')).toEqual([main]);
    expect(filterProjectItems(sample, 'texture', 'HERO')).toEqual([hero]);
    expect(filterProjectItems(sample, 'texture', 'nope')).toEqual([]);
  });
});

describe('folderLabel', () => {
  it('names each sidebar folder', () => {
    expect(folderLabel('scene')).toBe('Scenes');
    expect(folderLabel('texture')).toBe('Textures');
  });
});

describe('listProjectScenes', () => {
  it('returns an empty list when the folder is missing', async () => {
    expect(await listProjectScenes(join(tmpdir(), 'titane-missing-scenes'))).toEqual([]);
  });

  it('lists nested .titane files and skips others', async () => {
    const root = mkdtempSync(join(tmpdir(), 'titane-scenes-'));
    mkdirSync(join(root, 'levels'));
    writeFileSync(join(root, 'main.titane'), '{}');
    writeFileSync(join(root, 'levels', 'menu.titane'), '{}');
    writeFileSync(join(root, 'notes.txt'), '');
    writeFileSync(join(root, '.gitkeep'), '');

    expect(await listProjectScenes(root)).toEqual([
      { kind: 'scene', name: 'levels/menu.titane', url: '/scenes/levels/menu.titane', label: 'levels/menu' },
      { kind: 'scene', name: 'main.titane', url: '/scenes/main.titane', label: 'main' }
    ]);
  });
});
