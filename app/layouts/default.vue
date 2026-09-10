<script setup lang="ts">
// Navigation de site et pied de page : réservés à la landing (P01) et aux pages cadres.
// Trois compositions, relevées sur les cadres 390, 834 et 1440 de la maquette.
const menu = ref(false)
const { ouvrir: gererCookies, panneau } = useConsent()
const route = useRoute()
watch(() => route.fullPath, () => (menu.value = false))
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-white">
    <header
      class="sticky top-0 z-30 border-b border-gray-200 backdrop-blur-[10px]"
      style="background: rgba(255, 255, 255, 0.95)"
    >
      <div class="wrap flex items-center justify-between py-3.5 md:py-4 lg:h-[76px] lg:py-0">
        <div class="flex items-center lg:gap-9">
          <NuxtLink to="/" class="shrink-0" aria-label="Radar by FeexPay, accueil">
            <img src="/brand/logo-feexpay.svg" alt="FeexPay" class="h-5 w-auto md:h-[22px] lg:h-6" >
          </NuxtLink>
          <nav class="hidden items-center gap-[26px] text-[15px] font-medium leading-none text-gray-700 lg:flex">
            <NuxtLink to="/diagnostic" class="hover:text-navy-600">Le diagnostic</NuxtLink>
            <NuxtLink to="/#fonctionnement" class="hover:text-navy-600">Fonctionnement</NuxtLink>
            <NuxtLink to="/politique-de-confidentialite" class="hover:text-navy-600">Confidentialité</NuxtLink>
          </nav>
        </div>

        <!-- Tablette : deux liens et un bouton court. -->
        <div class="hidden items-center gap-6 md:flex lg:hidden">
          <NuxtLink to="/diagnostic" class="text-sm font-medium leading-none text-gray-700 hover:text-navy-600">Le diagnostic</NuxtLink>
          <NuxtLink to="/#fonctionnement" class="text-sm font-medium leading-none text-gray-700 hover:text-navy-600">Fonctionnement</NuxtLink>
          <NuxtLink to="/diagnostic" class="btn btn-primary h-11 rounded-[10px] px-[18px] text-sm">Commencer</NuxtLink>
        </div>

        <!-- Desktop : renvoi vers feexpay.me et bouton long. -->
        <div class="hidden items-center gap-3.5 lg:flex">
          <a href="https://feexpay.me" rel="noopener noreferrer" class="text-[15px] font-medium leading-none text-navy-600 hover:underline">feexpay.me</a>
          <NuxtLink to="/diagnostic" class="btn btn-primary h-11 rounded-[10px] px-5 text-[15px]">Commencer un diagnostic</NuxtLink>
        </div>

        <!-- Mobile : bouton menu 44 px. -->
        <button
          type="button"
          class="-my-2.5 -mr-2.5 inline-flex h-11 w-11 items-center justify-center rounded-full text-navy-600 md:hidden"
          :aria-expanded="menu"
          aria-controls="menu-mobile"
          aria-label="Menu"
          @click="menu = !menu"
        >
          <UiIcon :name="menu ? 'close' : 'menu'" :size="24" />
        </button>
      </div>

      <nav v-show="menu" id="menu-mobile" class="border-t border-gray-200 bg-white px-5 py-3 md:hidden">
        <NuxtLink to="/diagnostic" class="block py-3 text-[15px] font-medium text-gray-700">Le diagnostic</NuxtLink>
        <NuxtLink to="/#fonctionnement" class="block py-3 text-[15px] font-medium text-gray-700">Fonctionnement</NuxtLink>
        <NuxtLink to="/politique-de-confidentialite" class="block py-3 text-[15px] font-medium text-gray-700">Confidentialité</NuxtLink>
        <NuxtLink to="/diagnostic" class="btn btn-primary mt-2 mb-2 h-[52px] w-full text-base">Commencer un diagnostic</NuxtLink>
      </nav>
    </header>

    <!-- Réserve la hauteur du bandeau de cookies, ancré en bas et cliquable. -->
    <main class="flex-1" :class="{ 'pb-[152px] md:pb-[120px] lg:pb-0': panneau }"><slot /></main>

    <footer class="bg-navy-600 lg:border-t lg:border-white/15">
      <!-- Mobile -->
      <div class="px-5 py-7 md:hidden">
        <img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="mb-[18px] h-[22px] w-auto" >
        <div class="mb-5 flex flex-col gap-2.5 text-sm leading-[1.4] text-navy-100">
          <NuxtLink to="/politique-de-confidentialite" class="hover:text-white">Politique de confidentialité</NuxtLink>
          <NuxtLink to="/mentions-legales" class="hover:text-white">Mentions légales</NuxtLink>
          <a href="mailto:contact.ci@feexpay.me" class="hover:text-white">Nous écrire</a>
          <button type="button" class="self-start border-b border-dotted border-white/50 pb-0.5 text-left hover:text-white" @click="gererCookies">Gérer mes cookies</button>
        </div>
        <p class="text-xs leading-[1.5] text-navy-300">Radar by FeexPay · Powered by FeexPay</p>
      </div>

      <!-- Tablette -->
      <div class="hidden items-start justify-between gap-10 px-10 py-9 md:flex lg:hidden">
        <div>
          <img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="mb-4 h-6 w-auto" >
          <p class="text-xs leading-[1.5] text-navy-300">Radar by FeexPay · Powered by FeexPay</p>
        </div>
        <div class="flex gap-10 text-sm leading-[1.4] text-navy-100">
          <div class="flex flex-col gap-2.5">
            <NuxtLink to="/politique-de-confidentialite" class="hover:text-white">Politique de confidentialité</NuxtLink>
            <NuxtLink to="/mentions-legales" class="hover:text-white">Mentions légales</NuxtLink>
          </div>
          <div class="flex flex-col gap-2.5">
            <a href="mailto:contact.ci@feexpay.me" class="hover:text-white">Nous écrire</a>
            <button type="button" class="self-start border-b border-dotted border-white/50 pb-0.5 text-left hover:text-white" @click="gererCookies">Gérer mes cookies</button>
          </div>
        </div>
      </div>

      <!-- Desktop -->
      <div class="wrap hidden justify-between gap-16 pt-12 pb-10 lg:flex">
        <div class="max-w-[300px]">
          <img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="mb-4 h-[26px] w-auto" >
          <p class="text-[13px] leading-[1.6] text-navy-300">Radar by FeexPay · Powered by FeexPay. Rapidité — Sécurité — Fiabilité.</p>
        </div>
        <div class="flex gap-16 text-sm leading-[1.4] text-navy-100">
          <div class="flex flex-col gap-3">
            <span class="eyebrow text-navy-300">Le diagnostic</span>
            <NuxtLink to="/diagnostic/dirigeant/introduction" class="hover:text-white">Profil du dirigeant</NuxtLink>
            <NuxtLink to="/diagnostic/rayonnement/introduction" class="hover:text-white">Rayonnement de l'entreprise</NuxtLink>
            <NuxtLink to="/diagnostic" class="hover:text-white">Lecture croisée</NuxtLink>
          </div>
          <div class="flex flex-col gap-3">
            <span class="eyebrow text-navy-300">Cadre</span>
            <NuxtLink to="/politique-de-confidentialite" class="hover:text-white">Politique de confidentialité</NuxtLink>
            <NuxtLink to="/mentions-legales" class="hover:text-white">Mentions légales</NuxtLink>
            <button type="button" class="self-start border-b border-dotted border-white/50 pb-0.5 text-left hover:text-white" @click="gererCookies">Gérer mes cookies</button>
          </div>
          <div class="flex flex-col gap-3">
            <span class="eyebrow text-navy-300">FeexPay</span>
            <a href="mailto:contact.ci@feexpay.me" class="hover:text-white">Nous écrire</a>
          </div>
        </div>
      </div>
    </footer>
    <ConsentBanner />
  </div>
</template>
