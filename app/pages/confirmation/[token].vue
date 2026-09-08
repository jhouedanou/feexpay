<script setup lang="ts">
/**
 * P11 — confirmation. « Célébration sobre : une icône, aucune animation festive. »
 * Le rapport et son PDF arrivent aux étapes suivantes du Lot 3 ; l'écran dit
 * l'état réel plutôt que d'annoncer un envoi qui n'a pas eu lieu.
 */
const route = useRoute()
const token = route.params.token as string

useSeoMeta({ title: 'Votre analyse est prête — Radar by FeexPay' })
</script>

<template>
  <section class="mx-auto max-w-[760px] px-5 py-16 md:px-8">
    <UiIcon name="check-circle-outline" :size="48" class="text-green-600" />
    <h1 class="mt-5 type-h1">Votre analyse est prête</h1>
    <p class="mt-3 type-body text-gray-700">
      Vos informations sont enregistrées. Le rapport détaillé et son envoi par email sont en
      cours de mise en service : vous serez prévenu dès qu’ils seront disponibles.
    </p>

    <div
      class="mt-8 border border-navy-100 bg-navy-50 p-5"
      style="border-radius: var(--radius-card)"
    >
      <p class="font-semibold text-navy-800">Deuxième diagnostic</p>
      <p class="mt-1.5 type-small text-gray-700">
        Les deux lectures se croisent : faire le second diagnostic enrichit votre analyse.
      </p>
      <NuxtLink
        to="/diagnostic"
        class="mt-4 inline-flex items-center justify-center bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700 active:bg-orange-800"
        style="min-height: var(--control-h); border-radius: var(--radius-control)"
      >
        Choisir un diagnostic
      </NuxtLink>
    </div>

    <p class="mt-8 type-caption text-gray-500">Référence : {{ token.slice(0, 8) }}…</p>
  </section>
</template>
