import tailwindcss from '@tailwindcss/vite'

// Les règles d'en-têtes sont figées au build. En développement, Vite a besoin d'`eval` et
// d'une connexion WebSocket pour le rechargement à chaud : la CSP n'est posée qu'en
// production, le reste des en-têtes s'applique partout.
const PRODUCTION = process.env.NODE_ENV === 'production'

// Origines tierces autorisées, strictement celles du plan de tracking (annexe 04) :
// GA4 par gtag.js, Meta par fbevents.js, Poppins servi en local mais Google Fonts laissé
// ouvert pour les gabarits d'email ouverts dans un onglet.
const CSP = [
  "default-src 'self'",
  // Nuxt écrit le payload d'hydratation dans un script en ligne, sans nonce : `unsafe-inline`
  // est inévitable tant qu'on ne passe pas par un middleware de nonce. Compromis consigné
  // dans docs/ARCHITECTURE.md.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  // blob: et data: servent les cartes de partage dessinées sur canvas (P13/P14).
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.facebook.com",
  "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://connect.facebook.net https://graph.facebook.com",
  "frame-src https://www.facebook.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ')

const ENTETES_SECURITE: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  ...(PRODUCTION
    ? {
        'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
        'Content-Security-Policy': CSP,
      }
    : {}),
}

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-08',
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Radar by FeexPay',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
      link: [
        // Le kit prescrit le symbole FeexPay comme favicon.
        { rel: 'icon', href: '/brand/logo-mark-2026.png', type: 'image/png' },
        // Seule la graisse du corps de texte est préchargée : les titres arrivent
        // en même temps que le CSS, un preload par graisse coûterait plus qu'il ne rapporte.
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: '/fonts/poppins-400-latin.woff2',
          crossorigin: 'anonymous',
        },
      ],
    },
    // Durées de la maquette (planche Foundations) : apparition de carte 220 ms,
    // courbe cubic-bezier(.2,0,0,1). Neutralisé par la règle prefers-reduced-motion.
    pageTransition: { name: 'page', mode: 'out-in' },
    layoutTransition: false,
  },

  // PLAN.md §7 : seule P01 est indexable, tout le reste est noindex.
  // En-tête posé directement (pas de module robots pour l'instant).
  routeRules: {
    '/**': { headers: { ...ENTETES_SECURITE, 'X-Robots-Tag': 'noindex, nofollow' } },
    '/': { headers: { ...ENTETES_SECURITE, 'X-Robots-Tag': 'index, follow' } },
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
    resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET ?? '',
    // Posé par Vercel dans l'en-tête Authorization des tâches planifiées (vercel.json).
    cronSecret: process.env.CRON_SECRET ?? '',
    // Sans accès DNS : onboarding@resend.dev ne délivre qu'au titulaire du compte Resend.
    resendFrom: process.env.RESEND_FROM ?? 'Radar by FeexPay <onboarding@resend.dev>',
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
