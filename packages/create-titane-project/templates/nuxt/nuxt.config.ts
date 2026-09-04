import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { defineNuxtConfig } from 'nuxt/config';

const withEditor = process.env.NODE_ENV !== 'production';

/**
 * Resolves the editor layer by package directory so c12 does not have to
 * guess `@titane/editor` from a package with no Node "main" until linked.
 */
const editorLayer = (): string[] => {
    if (!withEditor) return [];
    try {
        const require = createRequire(import.meta.url);
        return [dirname(require.resolve('@titane/editor/package.json'))];
    }
    catch {
        return [];
    }
};

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,
    // Dev: embed the editor at /titane. Production build does not extend the layer.
    extends: editorLayer(),
    build: {
        transpile: ['@titane/core', '@titane/renderer', 'three', '@dimforge/rapier3d-compat']
    },
    vite: {
        optimizeDeps: {
            exclude: ['@dimforge/rapier3d-compat']
        },
        assetsInclude: ['**/*.titane']
    },
    nitro: {
        publicAssets: [
            {
                dir: 'scenes',
                baseURL: 'scenes',
                maxAge: 0
            }
        ]
    }
});
