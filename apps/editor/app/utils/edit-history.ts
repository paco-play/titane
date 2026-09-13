import { captureWorldState, restoreWorldState, type World } from '@titane/core';

const MAX_STACK = 50;

/**
 * Snapshot stack for edit-mode undo / redo.
 * Play Keep / Discard stays on the engine snapshot, not here.
 */
export const createEditHistory = () => {
  let lastCommitted: World | null = null;
  let coalescing = false;
  const undoStack: World[] = [];
  const redoStack: World[] = [];

  /**
   * Seeds the baseline after load / reset. Clears both stacks.
   */
  const prime = (world: World): void => {
    lastCommitted = captureWorldState(world);
    coalescing = false;
    undoStack.length = 0;
    redoStack.length = 0;
  };

  /**
   * Records the previous committed world as one undo step.
   * Multiple calls in the same turn collapse into a single step.
   */
  const record = (world: World): void => {
    if (!lastCommitted) {
      lastCommitted = captureWorldState(world);
      return;
    }

    if (!coalescing) {
      undoStack.push(lastCommitted);
      if (undoStack.length > MAX_STACK) undoStack.shift();
      redoStack.length = 0;
      coalescing = true;
      queueMicrotask(() => {
        coalescing = false;
      });
    }

    lastCommitted = captureWorldState(world);
  };

  /**
   * Restores the previous recorded world into `target`.
   * @returns False when the undo stack is empty.
   */
  const undo = (target: World): boolean => {
    const previous = undoStack.pop();
    if (!previous) return false;

    redoStack.push(captureWorldState(target));
    restoreWorldState(target, previous);
    lastCommitted = captureWorldState(target);
    coalescing = false;
    return true;
  };

  /**
   * Re-applies a world undone by `undo`.
   * @returns False when the redo stack is empty.
   */
  const redo = (target: World): boolean => {
    const next = redoStack.pop();
    if (!next) return false;

    undoStack.push(captureWorldState(target));
    restoreWorldState(target, next);
    lastCommitted = captureWorldState(target);
    coalescing = false;
    return true;
  };

  return {
    prime,
    record,
    undo,
    redo,
    canUndo: (): boolean => undoStack.length > 0,
    canRedo: (): boolean => redoStack.length > 0
  };
};
