import { describe, expect, it, vi } from 'vitest';
import { bootEditorWorld } from '../app/utils/boot-editor-world';

describe('bootEditorWorld', () => {
  it('loads the project scene even when an autosave buffer exists', async () => {
    const loadAutosave = vi.fn(() => true);
    const seedEmpty = vi.fn();

    const source = await bootEditorWorld({
      loadProject: async () => true,
      loadAutosave,
      seedEmpty
    });

    expect(source).toBe('project');
    expect(loadAutosave).not.toHaveBeenCalled();
    expect(seedEmpty).not.toHaveBeenCalled();
  });

  it('falls back to autosave when the project file is missing', async () => {
    const source = await bootEditorWorld({
      loadProject: async () => false,
      loadAutosave: () => true,
      seedEmpty: vi.fn()
    });

    expect(source).toBe('autosave');
  });

  it('seeds the empty world when neither project nor autosave exists', async () => {
    const seedEmpty = vi.fn();

    const source = await bootEditorWorld({
      loadProject: async () => false,
      loadAutosave: () => false,
      seedEmpty
    });

    expect(source).toBe('empty');
    expect(seedEmpty).toHaveBeenCalledOnce();
  });
});
