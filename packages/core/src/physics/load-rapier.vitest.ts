import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

/**
 * Loads Rapier's CJS build by absolute path so Vite cannot intercept it.
 */
const cjsPath = fileURLToPath(
    new URL('../../node_modules/@dimforge/rapier3d-compat/rapier.cjs', import.meta.url)
);

const required = createRequire(import.meta.url)(cjsPath) as Record<string, unknown>;
const rapier = (
    typeof required.init === 'function' ? required : required.default
) as typeof import('@dimforge/rapier3d-compat');

export default rapier;
