import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import { projectScenesDirectory } from '../server/utils/project-scenes-directory';

describe('projectScenesDirectory', () => {
  it('resolves scenes/ from process cwd, not the editor layer folder', () => {
    expect(projectScenesDirectory(join('host', 'game'))).toBe(join('host', 'game', 'scenes'));
  });
});
