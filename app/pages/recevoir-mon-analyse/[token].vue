<script setup lang="ts">
// P10 — formulaire de conversion. Le Lot 3 (lead, rapport, PDF, email) n'est pas livré :
// il dépend du DNS feexpay.me et de l'hébergement du worker. Écran d'attente en attendant,
// pour ne pas laisser un lien mort sur la page de résultat.
const route = useRoute()
const token = route.params.token as string
definePageMeta({ layout: 'default' })
</script>

<template>
  <section class="mx-auto max-w-xl px-4 py-16 text-center">
    <h1 class="text-2xl font-semibold text-navy-800">Analyse complète bientôt disponible</h1>
    <p class="mt-4 text-gray-700">
      Le rapport détaillé, son PDF et son envoi par email arrivent dans une prochaine version.
      Votre résultat, lui, reste accessible.
    </p>
    <NuxtLink
      :to="`/resultat/dirigeant/${token}`"
      class="mt-8 inline-flex min-h-12 items-center rounded-xl bg-orange-500 px-6 font-semibold text-white"
    >
      Revenir à mon résultat
    </NuxtLink>
  </section>
</template>
