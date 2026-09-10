<script setup lang="ts">
// Écrans du parcours : pas de navigation de site (maquette P02 à P14). Chaque page pose sa
// barre supérieure avec RadarTopBar. Le pied de page compact de la maquette V1.2 (politique,
// mentions, « Gérer mes cookies ») est présent partout sauf sur les questions et le calcul,
// où rien ne doit distraire de la réponse.
// La politique s'ouvre par-dessus la page : quitter l'écran ferait perdre une saisie ou
// la place dans un parcours.
const { ouvrir: ouvrirConfidentialite } = useConfidentialiteModale()
const route = useRoute()
const { ouvrir: gererCookies, panneau } = useConsent()
const piedDePage = computed(() => !/\/diagnostic\/[^/]+\/(question|calcul)/.test(route.path))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-white">
    <!-- Le bandeau de cookies est ancré en bas et capte les clics : sans cette réserve, il
         recouvre le dernier bouton de la page en mobile (constaté sur P11). -->
    <main class="flex flex-1 flex-col" :class="{ 'pb-[152px] md:pb-[120px] lg:pb-0': panneau }"><slot /></main>
    <footer v-if="piedDePage" class="bg-navy-600 px-5 py-5 md:px-10 lg:px-0 lg:py-[26px]">
      <div class="wrap flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-8 lg:!px-6">
        <img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="h-5 w-auto lg:h-6" >
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] leading-[1.3] text-navy-100">
          <button type="button" class="hover:text-white" @click="ouvrirConfidentialite">Politique de confidentialité</button>
          <NuxtLink to="/mentions-legales" class="hover:text-white">Mentions légales</NuxtLink>
          <button type="button" class="border-b border-dotted border-white/50 pb-0.5 hover:text-white" @click="gererCookies">Gérer mes cookies</button>
        </div>
      </div>
    </footer>
    <ConsentBanner />
  </div>
</template>
