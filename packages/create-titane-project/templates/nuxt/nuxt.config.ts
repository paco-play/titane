const withEditor = process.env.NODE_ENV !== 'production';

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    ssr: false,
    // Dev: embed the editor at /titane. Production build does not extend the layer.
    extends: withEditor ? ['@titane/editor'] : [],
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
