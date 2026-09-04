import { PROJECT_FOLDERS, type ProjectItem, type ProjectKind } from '~/types/project';
import { filterProjectItems, folderLabel } from '~/utils/project-browser';

/**
 * Catalog + folder + search for the bottom Project panel.
 */
export const useProjectBrowser = () => {
  const { assets } = useProjectAssets();
  const { prefabs } = usePrefabCatalog();
  const { scenes } = useSceneCatalog();

  const folder = useState<ProjectKind>('titane-project-folder', () => 'scene');
  const query = useState('titane-project-query', () => '');
  const selectedUrl = useState<string | null>('titane-project-selected', () => null);

  const items = computed<ProjectItem[]>(() => {
    const fromAssets: ProjectItem[] = assets.value.map((asset) => ({
      kind: asset.kind,
      name: asset.name,
      url: asset.url,
      label: asset.name.split('/').pop() ?? asset.name
    }));
    const fromPrefabs: ProjectItem[] = prefabs.value.map((prefab) => ({
      kind: 'prefab',
      name: prefab.name,
      url: prefab.url,
      label: prefab.name.split('/').pop() ?? prefab.name
    }));
    return [...scenes.value, ...fromPrefabs, ...fromAssets];
  });

  const visible = computed<ProjectItem[]>(() =>
    filterProjectItems(items.value, folder.value, query.value)
  );

  const breadcrumb = computed<string>(() => `Assets › ${folderLabel(folder.value)}`);

  const selectFolder = (next: ProjectKind): void => {
    folder.value = next;
    selectedUrl.value = null;
  };

  const selectItem = (item: ProjectItem): void => {
    selectedUrl.value = item.url;
  };

  return {
    folders: PROJECT_FOLDERS,
    folder,
    query,
    selectedUrl,
    visible,
    breadcrumb,
    selectFolder,
    selectItem
  };
};
