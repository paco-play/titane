import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Loads Rapier's CJS build by absolute path so Vite cannot intercept the
 * `@dimforge/rapier3d-compat` specifier.
 */
const files = ['rapier.cjs', 'rapier.cjs.js'] as const;
const dirs = [
    join(process.cwd(), 'node_modules', '@dimforge', 'rapier3d-compat'),
    join(process.cwd(), '..', '..', 'node_modules', '@dimforge', 'rapier3d-compat'),
    fileURLToPath(new URL('../../node_modules/@dimforge/rapier3d-compat/', import.meta.url)),
    fileURLToPath(new URL('../../../node_modules/@dimforge/rapier3d-compat/', import.meta.url))
];

const cjsPath = dirs.flatMap(dir => files.map(file => join(dir, file))).find(existsSync);
if (!cjsPath) {
    throw new Error('[titane] Rapier CJS build not found for Vitest');
}

const required = createRequire(import.meta.url)(cjsPath) as Record<string, unknown>;
const rapier = (
    typeof required.init === 'function' ? required : required.default
) as typeof import('@dimforge/rapier3d-compat');

export default rapier;
