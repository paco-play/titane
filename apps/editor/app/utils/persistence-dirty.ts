/**
 * Tracks in-place component edits the entity-Set watcher cannot see.
 *
 * Structural changes (spawn, delete, load) still persist immediately.
 * The 60s auto-save timer only serializes when this flag is set, so an
 * idle editor does not rewrite local storage every minute.
 */

let dirty = false;

/**
 * Records that the world has unsaved component edits.
 */
export const markPersistenceDirty = (): void => {
  dirty = true;
};

/**
 * Clears the flag after a successful serialize, or after a load that
 * replaced the world with a known snapshot.
 */
export const clearPersistenceDirty = (): void => {
  dirty = false;
};

/**
 * @returns True when a deferred serialize is pending.
 */
export const isPersistenceDirty = (): boolean => dirty;
