<script setup lang="ts">
// P01 — seule page indexée. Titres et accroches repris de la maquette (planches 03 et 05).
useSeoMeta({
  title: 'Radar by FeexPay — Diagnostic gratuit du dirigeant et de son entreprise',
  description:
    'Deux lectures de votre entreprise, en moins de dix minutes. Gratuit, sans compte, résultat immédiat.',
  ogTitle: 'Radar by FeexPay',
  ogDescription: 'Deux lectures de votre entreprise, en moins de dix minutes.',
  ogImage: '/brand/hero-archetypes-orbit-1040.png',
})

const benefices = [
  'Votre archétype de dirigeant parmi huit figures inspirantes',
  'Le score de rayonnement de votre entreprise, avec sa météo',
  'Trois à cinq minutes par diagnostic',
  'Aucun formulaire avant le résultat',
]

const stats = [
  { valeur: '8', libelle: 'profils de dirigeant' },
  { valeur: '5', libelle: 'niveaux de rayonnement' },
  { valeur: '21', libelle: 'questions au total' },
]
</script>

<template>
  <div>
    <section class="px-5 py-12 md:px-8 md:py-20" style="background: var(--gradient-hero)">
      <div class="mx-auto grid max-w-[1200px] items-center gap-10 md:grid-cols-2 md:gap-14">
        <div>
          <p class="type-eyebrow">Diagnostic gratuit</p>
          <h1 class="mt-3 type-display">
            Deux lectures de votre entreprise, en moins de dix minutes
          </h1>
          <p class="mt-4 type-body text-gray-700 md:text-lg">
            Deux diagnostics courts, un résultat immédiat.
          </p>
          <ul class="mt-7 space-y-2.5">
            <li v-for="b in benefices" :key="b" class="flex items-start gap-2.5 type-body text-gray-700">
              <UiIcon name="check" :size="20" class="mt-0.5 text-orange-600" />
              <span>{{ b }}</span>
            </li>
          </ul>
          <NuxtLink
            to="/diagnostic"
            class="mt-9 inline-flex w-full items-center justify-center bg-orange-600 px-7 text-base font-semibold text-white hover:bg-orange-700 active:bg-orange-800 sm:w-auto"
            style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
          >
            Commencer un diagnostic
          </NuxtLink>
        </div>

        <img
          src="/brand/hero-archetypes-orbit-1040.png"
          alt="Les huit archétypes de dirigeants en orbite"
          class="mx-auto w-full max-w-md"
          width="1040"
          height="1040"
          fetchpriority="high"
        >
      </div>
    </section>

    <!-- Bandeau de statistiques : desktop seulement dans la maquette. -->
    <section class="hidden border-b border-gray-200 px-8 py-8 md:block">
      <dl class="mx-auto grid max-w-[1200px] grid-cols-3 gap-8">
        <div v-for="s in stats" :key="s.libelle" class="text-center">
          <dt class="sr-only">{{ s.libelle }}</dt>
          <dd>
            <span class="type-figure text-4xl">{{ s.valeur }}</span>
            <span class="mt-1 block type-small text-gray-600">{{ s.libelle }}</span>
          </dd>
        </div>
      </dl>
    </section>

    <!-- Bande CTA en dégradé inverse (le seul emploi du navy plein sur cette page). -->
    <section class="px-5 py-14 md:px-8" style="background: var(--gradient-inverse)">
      <div class="mx-auto flex max-w-[1200px] flex-col items-start gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="type-h2 text-white">Dix minutes pour savoir où vous en êtes</h2>
          <p class="mt-2 type-body text-navy-100">
            Vos réponses sont enregistrées au fur et à mesure. Vous pouvez reprendre plus tard.
          </p>
        </div>
        <NuxtLink
          to="/diagnostic"
          class="inline-flex w-full items-center justify-center bg-white px-7 text-base font-semibold text-navy-700 hover:bg-navy-50 md:w-auto"
          style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        >
          Commencer mon diagnostic
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
