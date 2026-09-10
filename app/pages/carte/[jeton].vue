<script setup lang="ts">
/**
 * Page publique d'une carte partagée. C'est l'adresse que WhatsApp et LinkedIn reçoivent :
 * elle porte les balises Open Graph et donc l'aperçu, et invite à faire le test.
 *
 * Elle ne montre rien de nominatif — ni nom, ni email, ni entreprise. Le rapport reste
 * derrière son propre jeton, qui n'a pas vocation à être publié.
 *
 * Seule page publique du produit à être indexable avec `/`, puisqu'elle est faite pour être
 * partagée : sans quoi les robots d'aperçu, qui respectent `noindex`, n'afficheraient rien.
 */
definePageMeta({ layout: 'default' })

const route = useRoute()
const jeton = route.params.jeton as string
const { data: carte, error } = await useFetch<any>(`/api/public/cartes/${jeton}`)
if (error.value || !carte.value) throw createError({ statusCode: 404, statusMessage: 'Carte introuvable' })

const config = useRuntimeConfig()
const url = `${config.public.appBaseUrl}/carte/${jeton}`
const image = computed(() => (carte.value.image ? `${config.public.appBaseUrl}${carte.value.image}` : undefined))

useSeoMeta({
  title: `${carte.value.titre} — Radar by FeexPay`,
  description: 'Deux lectures de votre entreprise en moins de dix minutes : votre manière de diriger, et ce que votre marché perçoit.',
  robots: 'index, follow',
  ogTitle: carte.value.titre,
  ogDescription: carte.value.sousTitre
    ? `${carte.value.sousTitre}. Faites le test avec Radar by FeexPay : deux lectures de votre entreprise en moins de dix minutes.`
    : 'Faites le test avec Radar by FeexPay : deux lectures de votre entreprise en moins de dix minutes.',
  ogType: 'website',
  ogUrl: url,
  ogImage: image.value,
  ogImageType: carte.value.imageType ?? undefined,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterTitle: carte.value.titre,
  twitterImage: image.value,
})
</script>

<template>
  <div class="wrap py-10 lg:!px-6 lg:py-16">
    <div class="mx-auto max-w-[760px] text-center">
      <p class="eyebrow mb-3 text-orange-600">Radar by FeexPay</p>
      <h1 class="mb-3 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600 lg:mb-4 lg:text-[38px] lg:leading-[1.15]">{{ carte.titre }}</h1>
      <p v-if="carte.sousTitre" class="mb-7 text-base leading-[1.6] text-gray-600 lg:mb-9 lg:text-lg">{{ carte.sousTitre }}</p>

      <img
        v-if="carte.image"
        :src="carte.image"
        :alt="carte.titre"
        class="mx-auto mb-8 w-full max-w-[600px] rounded-[14px] border border-gray-200"
        width="1200"
        height="630"
      >

      <div class="rounded-2xl bg-navy-600 px-6 py-8 text-left lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-10">
        <div>
          <p class="mb-2 text-[19px] leading-[1.3] font-semibold text-white lg:text-[26px] lg:leading-[1.2]">Et vous, où en êtes-vous ?</p>
          <p class="mb-5 text-sm leading-[1.55] text-navy-200 lg:mb-0 lg:max-w-[520px] lg:text-base">
            Quatorze questions sur votre manière de diriger, sept sur le rayonnement de votre entreprise. Résultat affiché avant tout formulaire.
          </p>
        </div>
        <NuxtLink to="/diagnostic" class="btn btn-white h-12 w-full text-[15px] lg:h-14 lg:w-auto lg:shrink-0 lg:px-7 lg:text-base">Faire le diagnostic</NuxtLink>
      </div>
    </div>
  </div>
</template>
