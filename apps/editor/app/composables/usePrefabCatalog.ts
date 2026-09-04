import type { ProjectPrefab } from '~/types/prefab';

/**
 * Loads the host `public/prefabs` catalog once and shares it across the editor.
 */
export const usePrefabCatalog = () => {
  const prefabs = useState<ProjectPrefab[]>('titane-project-prefabs', () => []);
  const started = useState('titane-project-prefabs-started', () => false);

  const refresh = async (): Promise<void> => {
    try {
      prefabs.value = await $fetch<ProjectPrefab[]>('/api/titane/prefabs');
    } catch {
      prefabs.value = [];
    }
  };

  if (import.meta.client && !started.value) {
    started.value = true;
    void refresh();
  }

  return { prefabs, refresh };
};
