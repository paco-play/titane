import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineNuxtConfig } from 'nuxt/config';

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  // Absolute path so this file still resolves when the editor is consumed as a layer.
  css: [join(rootDir, 'app/assets/css/main.css')],
  components: [
    {
      path: join(rootDir, 'app/components/Inspector/fields'),
      prefix: 'Inspector',
      pathPrefix: false
    },
    {
      path: join(rootDir, 'app/components/Inspector/sections'),
      prefix: 'Inspector',
      pathPrefix: false
    },
    { path: join(rootDir, 'app/components') }
  ],
  ignore: ['scenes/**'],
  watchers: {
    chokidar: {
      ignored: ['**/scenes/**']
    }
  },
  // Ensure the workspace packages are treated as ESM
  build: {
    transpile: ['@titane/core', '@titane/renderer', 'three', '@dimforge/rapier3d-compat']
  },
  vite: {
    optimizeDeps: {
      exclude: ['@dimforge/rapier3d-compat']
    },
    assetsInclude: ['**/*.titane'],
    server: {
      watch: {
        // Ctrl+S writes this folder; a reload would drop the editor.
        ignored: ['**/scenes/**']
      }
    }
  },
  nitro: {
    watchOptions: {
      ignored: ['**/scenes/**']
    },
    publicAssets: [
      {
        dir: join(rootDir, 'scenes'),
        baseURL: 'scenes',
        maxAge: 0
      }
    ]
  },
  imports: {
    dirs: [
      'composables/**',
    ]
  },
  typescript: {
    shim: false,
    strict: true
  }
})
