<script setup lang="ts">
// L01 — politique de confidentialité (maquette V1.2, cadres 390 et 1440). Texte provisoire
// de maquettage : la version validée par FeexPay (annexe 05) remplacera ces contenus.
// Le corps du texte vit dans `LegalConfidentialiteTexte`, partagé avec la fenêtre modale
// de P10 ; cette page n'apporte que l'en-tête et le sommaire.
useSeoMeta({ title: 'Politique de confidentialité — Radar by FeexPay', robots: 'noindex' })
const { ouvrir } = useConsent()
</script>

<template>
  <div>
    <div class="px-5 pt-7 pb-6 md:px-10 lg:px-0 lg:pt-14 lg:pb-10" style="background: linear-gradient(180deg, #eef3f9 0%, #ffffff 100%)">
      <div class="wrap lg:!px-6">
        <p class="mb-3 text-[13px] leading-[1.3] text-gray-500"><NuxtLink to="/" class="hover:text-navy-600">Accueil</NuxtLink> <span class="text-gray-300">/</span> Politique de confidentialité</p>
        <h1 class="mb-3.5 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-navy-600 lg:text-[40px]">Politique de confidentialité</h1>
        <p class="max-w-[760px] text-base leading-[1.65] text-gray-600">Cette politique explique quelles données Radar by FeexPay collecte, pourquoi, combien de temps elles sont conservées et comment exercer vos droits. Dernière mise à jour : {{ MAJ_CONFIDENTIALITE }}.</p>
      </div>
    </div>

    <div class="wrap pb-14 lg:flex lg:gap-14 lg:!px-6">
      <aside class="hidden w-[260px] shrink-0 lg:block">
        <div class="sticky top-6 rounded-xl border border-gray-200 bg-gray-50 p-5">
          <p class="eyebrow mb-3.5 text-gray-500">Sommaire</p>
          <ol class="flex flex-col gap-[9px]">
            <li v-for="(t, i) in SOMMAIRE_CONFIDENTIALITE" :key="t"><a :href="`#l01-${i + 1}`" class="text-[13px] leading-[1.4] text-navy-600 hover:underline">{{ i + 1 }}. {{ t }}</a></li>
          </ol>
          <div class="my-[18px] h-px bg-gray-200" />
          <button type="button" class="btn btn-outline h-11 w-full rounded-[10px] text-[13px]" @click="ouvrir">Gérer mes cookies</button>
        </div>
      </aside>

      <LegalConfidentialiteTexte />
    </div>
  </div>
</template>
