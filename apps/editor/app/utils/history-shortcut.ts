import type { SaveKeyEvent } from './save-shortcut';

/**
 * True when the event target is an editable field (native text undo must win).
 */
export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return target.isContentEditable;
};

/**
 * True for Ctrl+Z / Cmd+Z (no Shift/Alt, not a key-repeat).
 */
export const isUndoShortcut = (event: SaveKeyEvent): boolean =>
  (event.ctrlKey || event.metaKey)
  && !event.shiftKey
  && !event.altKey
  && event.code === 'KeyZ'
  && !event.repeat;

/**
 * True for Ctrl+Y / Cmd+Y, or Ctrl/Cmd+Shift+Z.
 */
export const isRedoShortcut = (event: SaveKeyEvent): boolean => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.repeat) return false;
  if (event.code === 'KeyY' && !event.shiftKey) return true;
  return event.code === 'KeyZ' && event.shiftKey;
};
