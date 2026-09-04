import type { ProjectAsset } from '~/types/asset';

/**
 * Loads the host `public/assets` catalog once and shares it across Inspector fields.
 */
export const useProjectAssets = () => {
  const assets = useState<ProjectAsset[]>('titane-project-assets', () => []);
  const started = useState('titane-project-assets-started', () => false);

  const refresh = async (): Promise<void> => {
    try {
      assets.value = await $fetch<ProjectAsset[]>('/api/titane/assets');
    } catch {
      assets.value = [];
    }
  };

  if (import.meta.client && !started.value) {
    started.value = true;
    void refresh();
  }

  return { assets, refresh };
};
