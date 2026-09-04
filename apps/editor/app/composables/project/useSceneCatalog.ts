import type { ProjectItem } from '~/types/project';

/**
 * Loads the host `scenes/` catalog once and shares it across the editor.
 */
export const useSceneCatalog = () => {
  const scenes = useState<ProjectItem[]>('titane-project-scenes', () => []);
  const started = useState('titane-project-scenes-started', () => false);

  const refresh = async (): Promise<void> => {
    try {
      scenes.value = await $fetch<ProjectItem[]>('/api/titane/scenes');
    } catch {
      scenes.value = [];
    }
  };

  if (import.meta.client && !started.value) {
    started.value = true;
    void refresh();
  }

  return { scenes, refresh };
};
