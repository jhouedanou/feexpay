import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  future: { compatibilityVersion: 4 },
  devtools: { enabled: false },
  css: ['~/assets/css/main.css'],
  // Cast : @tailwindcss/vite est typé pour Vite 7, Nuxt 3 embarque Vite 5.
  vite: { plugins: [tailwindcss() as never] },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Radar by FeexPay',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },
  // Seule la landing est indexée (CDC).
  routeRules: {
    '/': { headers: { 'X-Robots-Tag': 'all' } },
    '/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
  },
  runtimeConfig: {
    databaseUrl: '',
    supabaseServiceKey: '',
    appBaseUrl: 'http://localhost:3000',
    public: { ga4MeasurementId: '', metaPixelId: '', trackingEnabled: false },
  },
  nitro: { experimental: { openAPI: true } },
})
