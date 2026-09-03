export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  build: {
    transpile: ['@titane/core', '@titane/renderer', 'three', '@dimforge/rapier3d-compat']
  },
  vite: {
    optimizeDeps: {
      exclude: ['@dimforge/rapier3d-compat']
    }
  },
  devServer: {
    port: 3001
  },
  imports: {
    dirs: [
      'composables/**'
    ]
  },
  runtimeConfig: {
    public: {
      editorOrigin: 'http://localhost:3000'
    }
  },
  typescript: {
    shim: false,
    strict: true
  }
})
