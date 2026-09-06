import { join } from 'node:path';

/**
 * Host (or standalone editor) `scenes/` directory.
 * Matches PUT /api/titane/scene so GET `/scenes/main.titane` is the project file.
 */
export const projectScenesDirectory = (cwd = process.cwd()): string => join(cwd, 'scenes');
