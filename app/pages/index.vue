<script setup lang="ts">
// P01 — seule page indexée. Tous les textes sont repris de la maquette normative
// (docs/maquette/{mobile-390,desktop-1440}-P01.md), sans modification.
useSeoMeta({
  title: 'Radar by FeexPay — Diagnostic gratuit du dirigeant et de son entreprise',
  description:
    'Comprenez votre style de direction, puis mesurez le rayonnement de votre entreprise. Votre résultat s’affiche à la dernière question.',
  ogTitle: 'Deux lectures de votre entreprise, en moins de dix minutes',
  ogDescription:
    'Comprenez votre style de direction, puis mesurez le rayonnement de votre entreprise.',
  ogImage: '/brand/hero-archetypes-orbit-1040.png',
})

const stats = [
  { valeur: '8', libelle: 'profils de dirigeant' },
  { valeur: '5', libelle: 'niveaux de rayonnement' },
  { valeur: '21', libelle: 'questions au total' },
]

const diagnostics = [
  {
    titre: 'Profil du dirigeant',
    texte:
      'Identifiez votre archétype de direction parmi huit profils et ce qu’il implique dans vos décisions quotidiennes.',
    chiffres: ['14 questions', '4 à 6 minutes'],
    to: '/diagnostic/dirigeant/introduction',
  },
  {
    titre: 'Rayonnement de l’entreprise',
    texte:
      'Mesurez ce que votre marché perçoit réellement de votre entreprise, avec un score sur 100 et un niveau de lecture.',
    chiffres: ['7 questions', '2 à 4 minutes'],
    to: '/diagnostic/rayonnement/introduction',
  },
]

const etapes = [
  {
    n: '01',
    titre: 'Vous répondez une question par écran',
    texte: 'Une seule réponse au choix par question.',
  },
  {
    n: '02',
    titre: 'Votre résultat s’affiche immédiatement',
    texte: 'Votre profil apparaît dès la dernière question répondue.',
  },
  {
    n: '03',
    titre: 'Vous recevez l’analyse complète',
    texte: 'Rapport en ligne, PDF et lecture croisée si vous réalisez les deux diagnostics.',
  },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section class="px-5 py-12 md:px-8 md:py-20" style="background: var(--gradient-hero)">
      <div class="mx-auto grid max-w-[1200px] items-center gap-10 lg:grid-cols-2 lg:gap-14">
        <div>
          <p class="type-eyebrow">Diagnostic gratuit</p>
          <h1 class="mt-3 type-display">
            Deux lectures de votre entreprise, en moins de dix minutes
          </h1>
          <p class="mt-5 text-[17px] leading-[1.65] text-gray-600 md:text-lg">
            Comprenez votre style de direction, puis mesurez le rayonnement de votre entreprise.<span
              class="hidden md:inline"
            >
              Votre résultat s’affiche à la dernière question.</span
            >
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <NuxtLink
              to="/diagnostic"
              class="inline-flex items-center justify-center bg-orange-600 px-7 text-base font-semibold text-white hover:bg-orange-700 active:bg-orange-800"
              style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
            >
              Commencer un diagnostic
            </NuxtLink>
            <a
              href="#fonctionnement"
              class="inline-flex items-center justify-center border border-gray-300 bg-white px-7 text-base font-semibold text-navy-600 hover:border-navy-300"
              style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
            >
              Voir le fonctionnement
            </a>
          </div>

          <!-- Barre de statistiques : dans le hero en desktop, absente en mobile. -->
          <dl class="mt-10 hidden divide-x divide-gray-200 md:flex">
            <div v-for="(s, i) in stats" :key="s.libelle" :class="i === 0 ? 'pr-8' : 'px-8'">
              <dd class="type-figure text-[26px] leading-[1.1]">{{ s.valeur }}</dd>
              <dt class="mt-1 type-caption text-gray-500">{{ s.libelle }}</dt>
            </div>
          </dl>
        </div>

        <div
          class="hidden bg-white/60 p-8 lg:block"
          style="border-radius: 20px"
        >
          <img
            src="/brand/hero-archetypes-orbit-1040.png"
            alt="Les huit archétypes de dirigeants en orbite"
            class="mx-auto w-full max-w-lg"
            width="1040"
            height="1040"
            fetchpriority="high"
          >
        </div>
      </div>
    </section>

    <!-- Deux diagnostics, deux lectures -->
    <section class="px-5 py-14 md:px-8 md:py-20">
      <div class="mx-auto max-w-[1200px]">
        <h2 class="type-h1">Deux diagnostics, deux lectures</h2>
        <p class="mt-4 max-w-[760px] text-[17px] leading-[1.6] text-gray-600">
          Indépendants l’un de l’autre, mais réalisés ensemble, ils produisent une lecture croisée
          que ni l’un ni l’autre ne donne seul.
        </p>

        <div class="mt-9 grid gap-5 md:grid-cols-3">
          <NuxtLink
            v-for="d in diagnostics"
            :key="d.titre"
            :to="d.to"
            class="flex flex-col border border-gray-200 bg-white p-6 hover:border-navy-300"
            style="border-radius: var(--radius-card); box-shadow: var(--shadow-sm)"
          >
            <h3 class="text-[21px] font-semibold leading-[1.28] text-navy-600">{{ d.titre }}</h3>
            <p class="mt-3 flex-1 text-[15px] leading-[1.6] text-gray-600">{{ d.texte }}</p>
            <p class="mt-5 flex gap-4">
              <span
                v-for="ch in d.chiffres"
                :key="ch"
                class="text-xs font-medium text-navy-600"
              >
                {{ ch }}
              </span>
            </p>
          </NuxtLink>

          <!-- Carte lecture croisée : navy plein, texte clair. -->
          <div
            class="flex flex-col p-6 text-white"
            style="background: var(--gradient-inverse); border-radius: var(--radius-card)"
          >
            <h3 class="text-[21px] font-semibold leading-[1.28]">Lecture croisée</h3>
            <p class="mt-3 flex-1 text-[15px] leading-[1.6] text-navy-200">
              Quand les deux diagnostics sont terminés, la mise en regard du pilotage et du
              rayonnement fait apparaître la zone à traiter en premier.
            </p>
            <p class="mt-5 text-[15px] font-medium text-orange-300">
              Débloquée automatiquement →
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Comment cela fonctionne -->
    <section id="fonctionnement" class="scroll-mt-24 bg-gray-50 px-5 py-14 md:px-8 md:py-20">
      <div class="mx-auto max-w-[1200px]">
        <h2 class="type-h1">Comment cela fonctionne</h2>
        <ol class="mt-9 grid gap-8 md:grid-cols-3">
          <li v-for="e in etapes" :key="e.n">
            <p class="type-eyebrow" :class="e.n === '01' ? 'text-orange-600' : 'text-gray-400'">
              {{ e.n }}
            </p>
            <h3 class="mt-2 text-[19px] font-semibold leading-[1.3] text-navy-600">
              {{ e.titre }}
            </h3>
            <p class="mt-2 type-body text-gray-600">{{ e.texte }}</p>
          </li>
        </ol>

        <div class="mt-12 border-t border-gray-200 pt-8">
          <h3 class="text-lg font-semibold leading-[1.35] text-navy-600">
            Vos données sont protégées
          </h3>
          <p class="mt-2 max-w-[760px] text-[15px] leading-[1.6] text-gray-600">
            Vos réponses servent à produire votre rapport, rien d’autre. Vous pouvez en demander la
            suppression à tout moment.
          </p>
          <NuxtLink
            to="/confidentialite"
            class="mt-3 inline-block text-[15px] font-medium text-orange-600 underline underline-offset-[3px]"
          >
            Politique de confidentialité
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Bande CTA -->
    <section class="px-5 py-14 md:px-8" style="background: var(--gradient-inverse)">
      <div
        class="mx-auto flex max-w-[1200px] flex-col items-start gap-6 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <h2 class="text-3xl font-semibold leading-[1.2] text-white">
            Dix minutes pour savoir où vous en êtes
          </h2>
          <p class="mt-3 max-w-[620px] type-body text-navy-200">
            Vos réponses servent à produire votre rapport, rien d’autre. Vous pouvez en demander la
            suppression à tout moment.
          </p>
        </div>
        <NuxtLink
          to="/diagnostic"
          class="inline-flex w-full shrink-0 items-center justify-center bg-orange-600 px-7 text-base font-semibold text-white hover:bg-orange-700 active:bg-orange-800 md:w-auto"
          style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        >
          Commencer un diagnostic
        </NuxtLink>
      </div>
    </section>
  </div>
</template>
