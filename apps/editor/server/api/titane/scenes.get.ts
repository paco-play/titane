import { join } from 'node:path';
import { listProjectScenes } from '../../utils/list-project-scenes';

/**
 * Lists `.titane` files in the host project's `scenes/`.
 */
export default defineEventHandler(async () => {
  const scenesDir = join(process.cwd(), 'scenes');
  return listProjectScenes(scenesDir);
});
