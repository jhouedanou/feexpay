<script setup lang="ts">
useSeoMeta({
  title: 'Radar by FeexPay — Diagnostic gratuit du dirigeant et de son entreprise',
  description: 'Découvrez votre profil de dirigeant et le rayonnement de votre entreprise en quelques minutes. Gratuit, sans compte, résultat immédiat.',
  ogTitle: 'Radar by FeexPay',
  ogImage: '/brand/hero-archetypes-orbit-1040.png',
})
</script>

<template>
  <section class="px-4 py-10" style="background: var(--gradient-hero)">
    <div class="mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-2">
      <div>
        <h1 class="text-3xl font-semibold leading-tight text-navy-800 md:text-5xl">Quel dirigeant êtes-vous ? Jusqu'où rayonne votre entreprise ?</h1>
        <p class="mt-4 text-lg text-gray-700">Deux diagnostics courts, un résultat immédiat.</p>
        <ul class="mt-6 space-y-2 text-gray-700">
          <li>✓ Votre archétype de dirigeant parmi 8 figures inspirantes</li>
          <li>✓ Le score de rayonnement de votre entreprise, avec sa météo</li>
          <li>✓ 3 à 5 minutes par diagnostic</li>
          <li>✓ Aucun formulaire avant le résultat</li>
        </ul>
        <NuxtLink to="/diagnostic" class="mt-8 inline-flex min-h-12 items-center rounded-xl bg-orange-500 px-6 py-3 text-base font-semibold text-white hover:bg-orange-600">
          Commencer mon diagnostic
        </NuxtLink>
      </div>
      <img
        src="/brand/hero-archetypes-orbit-1040.png"
        alt="Les huit archétypes de dirigeants en orbite"
        class="mx-auto w-full max-w-md"
        width="1040"
        height="1040"
        fetchpriority="high"
      />
    </div>
  </section>
</template>
