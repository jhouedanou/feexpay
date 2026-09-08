<script setup lang="ts">
// P02 — sélection du diagnostic. Cadres 390, 834 et 1440 (docs/maquette/frames/*-P02.html).
definePageMeta({ layout: 'bare' })
useSeoMeta({ title: 'Par quoi souhaitez-vous commencer ? — Radar by FeexPay' })

const cards = [
  {
    type: 'dirigeant',
    icone: 'compass-outline',
    titre: 'Profil du dirigeant',
    sousTitre: 'Votre manière de diriger',
    texte: 'Prenez du recul sur vos réflexes de décision, d’organisation et d’exécution.',
    resultat: 'Résultat : un archétype principal et, le cas échéant, un profil secondaire.',
    chiffres: [
      { valeur: '14', libelle: 'questions' },
      { valeur: '4 à 6', libelle: 'minutes' },
      { valeur: '8', libelle: 'profils possibles' },
    ],
  },
  {
    type: 'rayonnement',
    icone: 'broadcast',
    titre: 'Rayonnement de l’entreprise',
    sousTitre: 'Ce que votre marché perçoit',
    texte: 'Mesurez la notoriété, la différenciation, la présence numérique et l’empreinte de votre entreprise.',
    resultat: 'Résultat : un score sur 100, un niveau et une météo.',
    chiffres: [
      { valeur: '7', libelle: 'questions' },
      { valeur: '2 à 4', libelle: 'minutes' },
      { valeur: '5', libelle: 'niveaux de lecture' },
    ],
  },
]
</script>

<template>
  <div class="flex flex-1 flex-col">
    <RadarTopBar back="/" logo>
      <template #right>
        <span class="hidden lg:inline">Étape 1 sur 3 · choix du diagnostic</span>
      </template>
    </RadarTopBar>

    <section
      class="flex-1 px-5 pt-7 pb-8 md:px-10 md:pt-11 md:pb-12 lg:px-0 lg:pt-16 lg:pb-20"
      style="background: linear-gradient(180deg, #eef3f9 0%, #ffffff 46%)"
    >
      <div class="wrap lg:!px-6">
        <div class="mb-6 md:mb-8 md:max-w-[620px] lg:mb-10 lg:max-w-[680px]">
          <h1 class="mb-2.5 text-[30px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600 md:mb-3 md:text-4xl md:leading-[1.16] md:tracking-[-0.02em] lg:mb-3.5 lg:text-[44px] lg:leading-[1.12] lg:tracking-[-0.025em]">
            Par quoi souhaitez-vous commencer ?
          </h1>
          <p class="text-base leading-[1.6] text-gray-600 md:text-[17px] lg:text-lg lg:leading-[1.65]" style="text-wrap: pretty">
            Les deux diagnostics sont indépendants. Réalisez-les dans l’ordre qui vous convient ; la lecture croisée s’ajoute lorsque les deux sont terminés.
          </p>
        </div>

        <div class="flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-5 lg:gap-6">
          <div
            v-for="c in cards"
            :key="c.type"
            class="rounded-[14px] border-[1.5px] border-gray-200 bg-white px-5 py-[22px] md:px-6 md:py-[26px] lg:border lg:p-8"
            style="box-shadow: var(--shadow-sm)"
          >
            <div class="mb-3.5 flex items-center gap-3 md:mb-4 lg:mb-5 lg:gap-4">
              <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600 md:h-12 md:w-12 lg:h-14 lg:w-14 lg:rounded-[14px]">
                <UiIcon :name="c.icone" class="!h-6 !w-6 md:!h-[26px] md:!w-[26px] lg:!h-[30px] lg:!w-[30px]" />
              </span>
              <div>
                <p class="text-[19px] leading-[1.25] font-semibold text-navy-600 md:text-xl lg:text-2xl lg:leading-[1.2] lg:tracking-[-0.015em]">{{ c.titre }}</p>
                <p class="mt-0.5 text-[13px] leading-[1.3] text-gray-500 lg:mt-[3px] lg:text-sm">{{ c.sousTitre }}</p>
              </div>
            </div>
            <p class="mb-4 text-[15px] leading-[1.55] text-gray-600 md:mb-[18px] lg:mb-6 lg:text-base lg:leading-[1.65]">
              {{ c.texte }} <br class="lg:hidden" >{{ c.resultat }}
            </p>
            <dl class="mb-4 flex gap-4 border-y border-gray-100 py-3.5 md:mb-[18px] md:py-4 lg:mb-6 lg:gap-6 lg:py-5">
              <div v-for="ch in c.chiffres" :key="ch.libelle" class="flex-1">
                <dd class="text-lg leading-[1.2] font-semibold text-navy-600 md:text-[19px] lg:text-[22px] lg:leading-[1.1]">{{ ch.valeur }}</dd>
                <dt class="mt-0.5 text-xs leading-[1.3] text-gray-500 lg:mt-1 lg:text-[13px]">{{ ch.libelle }}</dt>
              </div>
            </dl>
            <NuxtLink :to="`/diagnostic/${c.type}/introduction`" class="btn btn-primary h-12 w-full text-base md:text-[15px] lg:h-[52px] lg:text-base">
              Commencer ce diagnostic
            </NuxtLink>
          </div>
        </div>

        <p class="mt-5 text-[13px] leading-[1.55] text-gray-500 md:mt-[22px] lg:hidden">
          Vos réponses sont enregistrées au fur et à mesure. Vous pouvez interrompre un diagnostic et le reprendre.
        </p>
        <div class="mt-6 hidden items-center gap-4 rounded-[14px] bg-navy-50 px-7 py-[22px] lg:flex">
          <UiIcon name="vector-intersection" :size="24" class="shrink-0 text-navy-600" />
          <p class="flex-1 text-[15px] leading-[1.6] text-gray-700">
            Réalisez les deux et la lecture croisée s’ajoute automatiquement : elle met en regard votre pilotage interne et ce que perçoit votre marché.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
