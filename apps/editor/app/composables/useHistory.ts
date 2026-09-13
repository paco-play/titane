import { writeAutosave } from '~/utils/autosave-buffer';
import { createEditHistory } from '~/utils/edit-history';

const history = createEditHistory();
const replaying = ref(false);
const revision = ref(0);

const bump = (): void => {
  revision.value += 1;
};

/**
 * Edit-mode undo / redo. Play Keep / Discard stays a snapshot on the engine.
 */
export const useHistory = () => {
  const { engine, syncWorld, notifyInspect, markDirty } = useTitane();
  const { isPlaying } = useRuntime();

  const apply = (ran: boolean): void => {
    if (!ran || !engine.value) return;
    replaying.value = true;
    try {
      syncWorld();
      notifyInspect();
      markDirty();
      writeAutosave(engine.value.world);
    } finally {
      bump();
      // Keep the quiet window open until after the entity watcher flush,
      // otherwise persist would record the restored world and wipe redo.
      void nextTick(() => {
        replaying.value = false;
      });
    }
  };

  /**
   * Runs a world restore without recording a persist as an undo step.
   */
  const runQuiet = (fn: () => void): void => {
    replaying.value = true;
    try {
      fn();
    } finally {
      replaying.value = false;
    }
  };

  /**
   * Seeds the undo baseline after load, reset, or Keep Play.
   */
  const prime = (): void => {
    if (!engine.value) return;
    history.prime(engine.value.world);
    bump();
  };

  /**
   * Pushes one undo step from the last committed persist. No-op in Play.
   */
  const record = (): void => {
    if (!engine.value || isPlaying.value || replaying.value) return;
    history.record(engine.value.world);
    bump();
  };

  /**
   * Restores the previous persist. No-op in Play.
   */
  const undo = (): void => {
    if (!engine.value || isPlaying.value) return;
    apply(history.undo(engine.value.world));
  };

  /**
   * Re-applies the last undone persist. No-op in Play.
   */
  const redo = (): void => {
    if (!engine.value || isPlaying.value) return;
    apply(history.redo(engine.value.world));
  };

  return {
    prime,
    runQuiet,
    record,
    undo,
    redo,
    isReplaying: (): boolean => replaying.value,
    canUndo: computed(() => {
      void revision.value;
      return history.canUndo();
    }),
    canRedo: computed(() => {
      void revision.value;
      return history.canRedo();
    })
  };
};
