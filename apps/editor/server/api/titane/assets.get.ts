import { join } from 'node:path';
import { listProjectAssets } from '../../utils/list-project-assets';

/**
 * Lists files in the host project's `public/assets` for the Inspector picker.
 */
export default defineEventHandler(async () => {
  const assetsDir = join(process.cwd(), 'public', 'assets');
  return listProjectAssets(assetsDir);
});
