/** Where the editor world came from at boot. */
export type EditorBootSource = 'project' | 'autosave' | 'empty';

/**
 * Loads the live world. `scenes/main.titane` always wins over the
 * localStorage recovery buffer so a stale autosave cannot hide the project.
 */
export const bootEditorWorld = async (hooks: {
  loadProject: () => Promise<boolean>;
  loadAutosave: () => boolean;
  seedEmpty: () => void;
}): Promise<EditorBootSource> => {
  if (await hooks.loadProject()) return 'project';
  if (hooks.loadAutosave()) return 'autosave';
  hooks.seedEmpty();
  return 'empty';
};
