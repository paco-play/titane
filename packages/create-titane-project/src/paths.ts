import { dirname, isAbsolute, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Directory that contains `templates/` (the create-titane-project package).
 */
export const packageRoot = (): string => PKG_ROOT;

/**
 * Titane monorepo root (`packages/core` lives here).
 */
export const monorepoRoot = (): string => join(PKG_ROOT, '..', '..');

/**
 * Absolute path to a named template folder.
 */
export const templateDir = (name: 'shared' | 'nuxt' | 'vanilla'): string =>
    join(PKG_ROOT, 'templates', name);

/**
 * True when this CLI is running from the Titane monorepo checkout.
 */
export const isTitaneCheckout = (root = monorepoRoot()): boolean =>
    existsSync(join(root, 'packages', 'core', 'package.json'));

/**
 * `file:` dependency from a generated project to a monorepo package.
 * @param fromDir - Generated project directory.
 * @param targetDir - Absolute path of the dependency package.
 */
export const toFileDep = (fromDir: string, targetDir: string): string => {
    let rel = relative(fromDir, targetDir).split('\\').join('/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return `file:${rel}`;
};

/**
 * Resolves the output directory. Relative paths are against `cwd`.
 */
export const resolveProjectDir = (directory: string, cwd = process.cwd()): string =>
    isAbsolute(directory) ? directory : resolve(cwd, directory);

/**
 * Turns a display name into a lowercase npm package name.
 */
export const toPackageName = (raw: string): string => {
    const slug = raw
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]+/g, '-')
        .replace(/^[-.]+|[-.]+$/g, '');
    return slug.length > 0 ? slug : 'my-titane-game';
};

/**
 * Absolute paths of the engine packages the scaffold links with `file:`.
 */
export const enginePackageDirs = (root = monorepoRoot()): {
    core: string
    renderer: string
    editor: string
} => ({
    core: join(root, 'packages', 'core'),
    renderer: join(root, 'packages', 'renderer'),
    editor: join(root, 'apps', 'editor')
});
