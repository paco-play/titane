import { describe, expect, it } from 'vitest';
import { isRedoShortcut, isUndoShortcut } from '../app/utils/history-shortcut';
import type { SaveKeyEvent } from '../app/utils/save-shortcut';

const key = (partial: Partial<SaveKeyEvent> & Pick<SaveKeyEvent, 'code'>): SaveKeyEvent => ({
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  repeat: false,
  ...partial
});

describe('history shortcuts', () => {
  it('maps Ctrl+Z to undo and Ctrl+Y / Shift+Z to redo', () => {
    expect(isUndoShortcut(key({ ctrlKey: true, code: 'KeyZ' }))).toBe(true);
    expect(isUndoShortcut(key({ ctrlKey: true, shiftKey: true, code: 'KeyZ' }))).toBe(false);
    expect(isRedoShortcut(key({ ctrlKey: true, code: 'KeyY' }))).toBe(true);
    expect(isRedoShortcut(key({ ctrlKey: true, shiftKey: true, code: 'KeyZ' }))).toBe(true);
    expect(isRedoShortcut(key({ ctrlKey: true, code: 'KeyZ' }))).toBe(false);
  });
});
