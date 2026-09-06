import { listProjectScenes } from '../../utils/list-project-scenes';
import { projectScenesDirectory } from '../../utils/project-scenes-directory';

/**
 * Lists `.titane` files in the host project's `scenes/`.
 */
export default defineEventHandler(async () => {
  return listProjectScenes(projectScenesDirectory());
});
