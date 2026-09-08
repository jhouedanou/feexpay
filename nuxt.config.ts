import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-08',
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Radar by FeexPay',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },

  // PLAN.md §7 : seule P01 est indexable, tout le reste est noindex.
  // En-tête posé directement (pas de module robots pour l'instant).
  routeRules: {
    '/**': { headers: { 'X-Robots-Tag': 'noindex, nofollow' } },
    '/': { headers: { 'X-Robots-Tag': 'index, follow' } },
  },

  css: ['~/assets/css/main.css'],
  vite: { plugins: [tailwindcss()] },

  typescript: { strict: true, typeCheck: false },

  nitro: { experimental: { openAPI: true } },

  // Les noms de variables suivent le CDC (SUPABASE_URL…), pas la convention NUXT_* :
  // on les lit donc explicitement. Rien de secret sous `public` — la clé service et
  // DATABASE_URL restent serveur (vérifié au Lot 7 par grep sur .output/public).
  runtimeConfig: {
    supabaseUrl: process.env.SUPABASE_URL ?? '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
    databaseUrl: process.env.DATABASE_URL ?? '',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    public: {
      appBaseUrl: process.env.APP_BASE_URL ?? 'http://localhost:3000',
      supabaseUrl: process.env.SUPABASE_URL ?? '',
      supabaseKey: process.env.SUPABASE_KEY ?? '',
      ga4MeasurementId: process.env.PUBLIC_GA4_MEASUREMENT_ID ?? '',
      metaPixelId: process.env.PUBLIC_META_PIXEL_ID ?? '',
      trackingEnabled: process.env.TRACKING_ENABLED === 'true',
    },
  },
})
