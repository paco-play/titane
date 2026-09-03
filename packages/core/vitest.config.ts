import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const rapierNode = fileURLToPath(new URL('./src/physics/load-rapier.vitest.ts', import.meta.url));

export default defineConfig({
    resolve: {
        alias: {
            '@dimforge/rapier3d-compat': rapierNode
        }
    },
    test: {
        environment: 'node',
        include: ['src/tests/**/*.test.ts'],
        setupFiles: ['./src/tests/setup.ts'],
    },
});
