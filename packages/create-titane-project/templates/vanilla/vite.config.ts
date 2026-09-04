import { defineConfig } from 'vite';

export default defineConfig({
    assetsInclude: ['**/*.titane'],
    optimizeDeps: {
        exclude: ['@dimforge/rapier3d-compat']
    }
});
