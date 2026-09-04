/** The fields Ctrl+S needs. `KeyboardEvent` satisfies this. */
export interface SaveKeyEvent {
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly altKey: boolean;
  readonly code: string;
  readonly repeat: boolean;
}

/**
 * True for Ctrl+S / Cmd+S (no Shift/Alt, not a key-repeat).
 */
export const isSaveShortcut = (event: SaveKeyEvent): boolean =>
  (event.ctrlKey || event.metaKey)
  && !event.shiftKey
  && !event.altKey
  && event.code === 'KeyS'
  && !event.repeat;
