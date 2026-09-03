export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  // Ensure the workspace packages are treated as ESM
  build: {
    transpile: ['@titane/core', '@titane/renderer', 'three', '@dimforge/rapier3d-compat']
  },
  vite: {
    optimizeDeps: {
      exclude: ['@dimforge/rapier3d-compat']
    }
  },
  imports: {
    dirs: [
      'composables/**',
    ]
  },
  runtimeConfig: {
    public: {
      demoUrl: 'http://localhost:3001'
    }
  },
  typescript: {
    shim: false,
    strict: true
  }
})
