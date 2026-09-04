import { mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SerializedWorld } from '@titane/core';
import { PROJECT_SCENE_FILENAME, looksLikeSerializedWorld, writeProjectScene } from '../server/utils/write-project-scene';
import { isSaveShortcut, type SaveKeyEvent } from '../app/utils/save-shortcut';

const scene = (): SerializedWorld => ({
  version: 1,
  nextId: 2,
  entities: [1],
  components: {}
});

describe('writeProjectScene', () => {
  it('writes only main.titane', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'titane-scene-'));
    const target = await writeProjectScene(dir, scene());

    expect(target).toBe(join(dir, PROJECT_SCENE_FILENAME));
    expect(JSON.parse(readFileSync(target, 'utf8'))).toMatchObject({ nextId: 2, entities: [1] });
    expect(readdirSync(dir)).toEqual([PROJECT_SCENE_FILENAME]);
  });

  it('rejects a prefab-shaped payload', () => {
    expect(looksLikeSerializedWorld(scene())).toBe(true);
    expect(looksLikeSerializedWorld({ version: 1, root: 0, entities: [0], components: {} })).toBe(false);
  });
});

describe('isSaveShortcut', () => {
  it('matches Ctrl+S and Cmd+S only', () => {
    const key = (overrides: Partial<SaveKeyEvent>): SaveKeyEvent => ({
      ctrlKey: false,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      code: 'KeyS',
      repeat: false,
      ...overrides
    });

    expect(isSaveShortcut(key({ ctrlKey: true }))).toBe(true);
    expect(isSaveShortcut(key({ metaKey: true }))).toBe(true);
    expect(isSaveShortcut(key({ ctrlKey: true, shiftKey: true }))).toBe(false);
    expect(isSaveShortcut(key({ ctrlKey: true, code: 'KeyA' }))).toBe(false);
    expect(isSaveShortcut(key({ ctrlKey: true, repeat: true }))).toBe(false);
    expect(isSaveShortcut(key({}))).toBe(false);
  });
});
