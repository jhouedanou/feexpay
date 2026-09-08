<script setup lang="ts">
// P01 — accueil. Socle Lot 0 : contenu définitif à venir au Lot 1.
useSeoMeta({
  title: 'Radar by FeexPay',
  description:
    'Deux diagnostics gratuits : profil du dirigeant et rayonnement de votre entreprise.',
})

const { data: health } = await useFetch('/api/public/health')
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-16">
    <h1 class="text-3xl font-semibold">Radar by FeexPay</h1>
    <p class="mt-4 text-black/70">
      Socle applicatif en place (Lot&nbsp;0). Les écrans P01–P14 arrivent aux lots suivants.
    </p>
    <dl class="mt-8 text-sm">
      <div class="flex gap-2">
        <dt class="text-black/50">Moteur de scoring&nbsp;:</dt>
        <dd>version {{ health?.scoringVersion }} — checksum {{ health?.checksum }}</dd>
      </div>
    </dl>
  </section>
</template>
