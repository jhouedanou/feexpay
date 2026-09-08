<script setup lang="ts">
// P01 — seule page indexée. Composition et textes relevés sur les cadres 390, 834 et 1440
// de la maquette (docs/maquette/frames/*-P01.html). Les textes varient par largeur :
// la version desktop porte une phrase de plus dans le hero et les cartes.
useSeoMeta({
  title: 'Radar by FeexPay — Diagnostic gratuit du dirigeant et de son entreprise',
  description:
    'Comprenez votre style de direction, puis mesurez le rayonnement de votre entreprise. Votre résultat s’affiche à la dernière question.',
  ogTitle: 'Deux lectures de votre entreprise, en moins de dix minutes',
  ogDescription: 'Comprenez votre style de direction, puis mesurez le rayonnement de votre entreprise.',
  ogImage: '/brand/hero-archetypes-orbit-1040.png',
})

const stats = [
  { valeur: '8', libelle: 'profils de dirigeant' },
  { valeur: '5', libelle: 'niveaux de rayonnement' },
  { valeur: '21', libelle: 'questions au total' },
]

const etapes = [
  { titre: 'Vous répondez une question par écran', texte: 'Une seule réponse au choix par question.' },
  { titre: 'Votre résultat s’affiche immédiatement', texte: 'Votre profil apparaît dès la dernière question répondue.' },
  { titre: 'Vous recevez l’analyse complète', texte: 'Rapport en ligne, PDF et lecture croisée si vous réalisez les deux diagnostics.' },
]
</script>

<template>
  <div>
    <!-- Hero -->
    <section
      class="px-5 pt-7 pb-8 md:px-10 md:pt-11 md:pb-12 lg:px-0 lg:py-20"
      style="background: linear-gradient(180deg, #eef3f9 0%, #ffffff 72%)"
    >
      <div class="wrap flex flex-col md:flex-row md:gap-8 lg:items-center lg:gap-16 lg:!px-6">
        <div class="min-w-0 md:flex-[1.15] lg:flex-1">
          <p class="eyebrow mb-3 text-orange-600 md:mb-3.5 lg:mb-4 lg:text-[13px]">Diagnostic gratuit</p>
          <h1
            class="mb-3.5 text-[34px] leading-[1.15] font-semibold tracking-[-0.02em] text-navy-600 md:mb-4 md:text-[42px] md:leading-[1.12] lg:mb-5 lg:text-[56px] lg:leading-[1.08] lg:tracking-[-0.025em]"
            style="text-wrap: pretty"
          >
            Deux lectures de votre entreprise, en moins de dix minutes
          </h1>
          <p
            class="mb-[22px] text-base leading-[1.6] text-gray-600 md:mb-[26px] md:text-[17px] lg:mb-8 lg:max-w-[520px] lg:text-lg lg:leading-[1.65]"
            style="text-wrap: pretty"
          >
            Comprenez votre style de direction, puis mesurez le rayonnement de votre entreprise.<span class="hidden lg:inline"> Votre résultat s’affiche à la dernière question.</span>
          </p>
          <div class="flex flex-col gap-2.5 md:flex-row md:gap-3 lg:mb-8 lg:gap-3.5">
            <NuxtLink to="/diagnostic" class="btn btn-primary h-[52px] text-base md:px-[26px] lg:h-14 lg:px-[30px]">Commencer un diagnostic</NuxtLink>
            <a href="#fonctionnement" class="btn btn-outline h-[52px] text-base md:px-[22px] lg:h-14 lg:px-[26px]">Voir le fonctionnement</a>
          </div>
          <dl class="hidden gap-8 lg:flex">
            <template v-for="(s, i) in stats" :key="s.libelle">
              <div v-if="i > 0" class="w-px bg-gray-200" aria-hidden="true" />
              <div>
                <dd class="text-[26px] leading-[1.1] font-bold tracking-[-0.02em] text-navy-600">{{ s.valeur }}</dd>
                <dt class="mt-1 text-[13px] leading-[1.35] text-gray-500">{{ s.libelle }}</dt>
              </div>
            </template>
          </dl>
        </div>
        <!-- Illustration : sous le hero en mobile, à droite en tablette et desktop. -->
        <div class="mt-7 -mx-0 md:mt-0 md:flex md:flex-1 md:items-center lg:w-[520px] lg:flex-none">
          <div class="overflow-hidden rounded-2xl lg:rounded-[20px]" style="background: #f6f8fc">
            <img
              src="/brand/hero-archetypes-orbit-1040.png"
              alt="Les huit emblèmes de profil de dirigeant en orbite autour du radar"
              class="block h-auto w-full"
              width="1040"
              height="1040"
              fetchpriority="high"
            >
          </div>
        </div>
      </div>
    </section>

    <!-- Deux diagnostics, deux lectures -->
    <section class="border-t border-gray-200 bg-gray-50 px-5 py-7 md:p-10 lg:px-0 lg:py-20">
      <div class="wrap lg:!px-6">
        <div class="mb-4 md:mb-[22px] lg:mb-9 lg:max-w-[640px]">
          <h2 class="text-2xl leading-[1.25] font-semibold text-navy-600 md:text-[28px] md:leading-[1.22] md:tracking-[-0.015em] lg:mb-3 lg:text-4xl lg:leading-[1.16] lg:tracking-[-0.02em]">
            Deux diagnostics, deux lectures
          </h2>
          <p class="hidden text-[17px] leading-[1.6] text-gray-600 lg:block">
            Indépendants l’un de l’autre, mais réalisés ensemble, ils produisent une lecture croisée que ni l’un ni l’autre ne donne seul.
          </p>
        </div>
        <div class="flex flex-col gap-3 md:grid md:grid-cols-2 md:gap-5 lg:grid-cols-3 lg:gap-6">
          <NuxtLink to="/diagnostic/dirigeant/introduction" class="card carte-diag group block p-5 md:p-6 lg:p-7">
            <span class="tuile inline-flex items-center justify-center text-navy-600 lg:mb-[18px] lg:h-14 lg:w-14 lg:rounded-[14px] lg:bg-orange-50">
              <UiIcon name="compass-outline" class="!h-[26px] !w-[26px] md:!h-7 md:!w-7" />
            </span>
            <p class="titre mt-2.5 mb-1.5 text-lg leading-[1.3] font-semibold text-navy-600 md:mt-3 md:mb-2 md:text-[19px] lg:mt-0 lg:mb-2.5 lg:text-[21px] lg:leading-[1.28]">Profil du dirigeant</p>
            <p class="texte mb-3.5 text-[15px] leading-[1.55] text-gray-600 md:mb-4 lg:mb-[18px] lg:leading-[1.6]">
              Identifiez votre archétype de direction parmi huit profils et ce qu’il implique dans vos décisions<span class="hidden lg:inline"> quotidiennes</span>.
            </p>
            <div class="flex flex-wrap gap-2"><span class="chip">14 questions</span><span class="chip">4 à 6 minutes</span></div>
          </NuxtLink>
          <NuxtLink to="/diagnostic/rayonnement/introduction" class="card carte-diag group block p-5 md:p-6 lg:p-7">
            <span class="tuile inline-flex items-center justify-center text-navy-600 lg:mb-[18px] lg:h-14 lg:w-14 lg:rounded-[14px] lg:bg-orange-50">
              <UiIcon name="broadcast" class="!h-[26px] !w-[26px] md:!h-7 md:!w-7" />
            </span>
            <p class="titre mt-2.5 mb-1.5 text-lg leading-[1.3] font-semibold text-navy-600 md:mt-3 md:mb-2 md:text-[19px] lg:mt-0 lg:mb-2.5 lg:text-[21px] lg:leading-[1.28]">Rayonnement de l’entreprise</p>
            <p class="texte mb-3.5 text-[15px] leading-[1.55] text-gray-600 md:mb-4 lg:mb-[18px] lg:leading-[1.6]">
              Mesurez ce que votre marché perçoit réellement de votre entreprise, avec un score sur 100<span class="hidden lg:inline"> et un niveau de lecture</span>.
            </p>
            <div class="flex flex-wrap gap-2"><span class="chip">7 questions</span><span class="chip">2 à 4 minutes</span></div>
          </NuxtLink>
          <!-- Carte lecture croisée : desktop seulement. -->
          <NuxtLink to="/diagnostic" class="card carte-diag group hidden p-7 lg:block">
            <span class="tuile mb-[18px] inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-orange-50 text-navy-600">
              <UiIcon name="vector-intersection" :size="28" />
            </span>
            <p class="titre mb-2.5 text-[21px] leading-[1.28] font-semibold text-navy-600">Lecture croisée</p>
            <p class="texte mb-[18px] text-[15px] leading-[1.6] text-gray-600">
              Quand les deux diagnostics sont terminés, la mise en regard du pilotage et du rayonnement fait apparaître la zone à traiter en premier.
            </p>
            <span class="text-[15px] leading-none font-medium text-orange-600 group-hover:text-orange-300">Débloquée automatiquement →</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Comment cela fonctionne -->
    <section id="fonctionnement" class="scroll-mt-20 bg-white px-5 py-7 md:p-10 lg:px-0 lg:py-20">
      <div class="wrap lg:!px-6">
        <h2 class="mb-[18px] text-2xl leading-[1.25] font-semibold text-navy-600 md:mb-6 md:text-[28px] md:leading-[1.22] md:tracking-[-0.015em] lg:mb-10 lg:text-4xl lg:leading-[1.16] lg:tracking-[-0.02em]">
          Comment cela fonctionne
        </h2>
        <ol class="flex flex-col gap-[18px] md:grid md:grid-cols-3 md:gap-6 lg:gap-8">
          <li
            v-for="(e, i) in etapes"
            :key="e.titre"
            class="etape group flex gap-3.5 md:block lg:border-t-2 lg:border-gray-200 lg:pt-[22px]"
          >
            <span
              class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-navy-50 text-[15px] leading-none font-semibold text-navy-600 group-hover:bg-orange-50 group-hover:text-orange-700 md:mb-3.5 md:h-9 md:w-9 md:text-base lg:hidden"
            >
              {{ i + 1 }}
            </span>
            <span class="mb-3 hidden font-mono text-[13px] leading-none font-semibold text-gray-400 group-hover:text-orange-600 lg:block">
              0{{ i + 1 }}
            </span>
            <div>
              <p class="mb-1 text-base leading-[1.35] font-semibold text-navy-600 md:mb-1.5 lg:mb-2 lg:text-[19px] lg:leading-[1.3]">{{ e.titre }}</p>
              <p class="text-[15px] leading-[1.55] text-gray-600 lg:text-base lg:leading-[1.6]">{{ e.texte }}</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- Données protégées -->
    <section class="bg-navy-50 px-5 py-6 md:px-10 md:py-8 lg:border-t lg:border-navy-100 lg:px-0 lg:py-9">
      <div class="wrap flex items-start gap-3 md:items-center md:justify-between md:gap-8 lg:gap-12 lg:!px-6">
        <div class="flex items-start gap-3 md:gap-3.5 lg:gap-4">
          <UiIcon name="shield-check-outline" class="shrink-0 text-navy-600 !h-6 !w-6 md:!h-[26px] md:!w-[26px] lg:!h-7 lg:!w-7" />
          <div>
            <p class="mb-1 text-base leading-[1.35] font-semibold text-navy-600 md:text-[17px] lg:mb-[5px] lg:text-lg">Vos données sont protégées</p>
            <p class="text-sm leading-[1.55] text-gray-600 md:max-w-[520px] lg:max-w-[620px] lg:text-[15px] lg:leading-[1.6]">
              Vos réponses servent à produire votre rapport, rien d’autre. Vous pouvez en demander la suppression à tout moment.
            </p>
          </div>
        </div>
        <NuxtLink to="/confidentialite" class="hidden shrink-0 text-sm leading-none font-medium text-orange-600 hover:underline md:block lg:text-[15px]">
          Politique de confidentialité
        </NuxtLink>
      </div>
    </section>

    <!-- Bande d'appel : desktop seulement. -->
    <section class="hidden py-14 lg:block" style="background: var(--gradient-inverse)">
      <div class="wrap flex items-center justify-between gap-12 lg:!px-6">
        <div>
          <h2 class="mb-2.5 text-[30px] leading-[1.2] font-semibold tracking-[-0.02em] text-white">Dix minutes pour savoir où vous en êtes</h2>
          <p class="max-w-[560px] text-base leading-[1.6] text-navy-200">
            Vos réponses servent à produire votre rapport, rien d’autre. Vous pouvez en demander la suppression à tout moment.
          </p>
        </div>
        <NuxtLink to="/diagnostic" class="btn btn-primary h-14 shrink-0 px-[30px] text-base">Commencer un diagnostic</NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Survol des cartes de diagnostic : bleu nuit, tuile translucide, textes clairs. */
.carte-diag {
  transition:
    background-color var(--dur-card) var(--ease-standard),
    border-color var(--dur-card) var(--ease-standard),
    color var(--dur-card) var(--ease-standard);
}
.carte-diag:hover {
  background: var(--color-navy-600);
  border-color: var(--color-navy-600);
}
.carte-diag:hover .tuile {
  background: rgba(255, 255, 255, 0.12);
  color: var(--color-orange-300);
}
.carte-diag:hover .titre {
  color: #fff;
}
.carte-diag:hover .texte {
  color: var(--color-navy-200);
}
.carte-diag:hover .chip {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}
.carte-diag .tuile,
.carte-diag .titre,
.carte-diag .texte,
.carte-diag .chip {
  transition:
    background-color var(--dur-card) var(--ease-standard),
    color var(--dur-card) var(--ease-standard);
}

/* Survol des étapes : filet et numéro passent à l'orange. */
.etape {
  transition: border-color var(--dur-state) var(--ease-standard);
}
.etape:hover {
  border-color: var(--color-orange-600);
}
</style>
