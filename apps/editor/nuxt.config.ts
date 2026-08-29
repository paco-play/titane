export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  ssr: false,
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  // Ensure the workspace packages are treated as ESM
  build: {
    transpile: ['@titane/core', '@titane/renderer', 'three']
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
