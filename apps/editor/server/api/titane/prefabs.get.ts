import { join } from 'node:path';
import { listProjectPrefabs } from '../../utils/list-project-prefabs';

/**
 * Lists `.titane` files in the host project's `public/prefabs`.
 */
export default defineEventHandler(async () => {
  const prefabsDir = join(process.cwd(), 'public', 'prefabs');
  return listProjectPrefabs(prefabsDir);
});
