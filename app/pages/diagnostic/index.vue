<script setup lang="ts">
// P02 — textes repris de docs/maquette/desktop-1440-P02.md, sans modification.
const cards = [
  {
    type: 'dirigeant',
    titre: 'Profil du dirigeant',
    sousTitre: 'Votre manière de diriger',
    texte:
      'Prenez du recul sur vos réflexes de décision, d’organisation et d’exécution. Résultat : un archétype principal et, le cas échéant, un profil secondaire.',
    chiffres: [
      { valeur: '14', libelle: 'questions' },
      { valeur: '4 à 6', libelle: 'minutes' },
      { valeur: '8', libelle: 'profils possibles' },
    ],
    img: '/brand/emb-stratege-64.png',
  },
  {
    type: 'rayonnement',
    titre: 'Rayonnement de l’entreprise',
    sousTitre: 'Ce que votre marché perçoit',
    texte:
      'Mesurez la notoriété, la différenciation, la présence numérique et l’empreinte de votre entreprise. Résultat : un score sur 100, un niveau et une météo.',
    chiffres: [
      { valeur: '7', libelle: 'questions' },
      { valeur: '2 à 4', libelle: 'minutes' },
      { valeur: '5', libelle: 'niveaux de lecture' },
    ],
    img: '/brand/logo-mark-2026.png',
  },
]

useSeoMeta({ title: 'Par quoi souhaitez-vous commencer ? — Radar by FeexPay' })
</script>

<template>
  <section class="mx-auto max-w-[1200px] px-5 py-12 md:px-8 md:py-16">
    <p class="type-eyebrow">Étape 1 sur 3 · choix du diagnostic</p>
    <h1 class="mt-3 type-h1">Par quoi souhaitez-vous commencer ?</h1>
    <p class="mt-4 max-w-[760px] text-[17px] leading-[1.6] text-gray-600">
      Les deux diagnostics sont indépendants. Réalisez-les dans l’ordre qui vous convient ; la
      lecture croisée s’ajoute lorsque les deux sont terminés.
    </p>

    <div class="mt-10 grid gap-5 md:grid-cols-2">
      <div
        v-for="c in cards"
        :key="c.type"
        class="flex flex-col border border-gray-200 bg-white p-6 md:p-7"
        style="border-radius: var(--radius-card); box-shadow: var(--shadow-sm)"
      >
        <img :src="c.img" alt="" class="h-12 w-12" >
        <h2 class="mt-5 text-[21px] font-semibold leading-[1.28] text-navy-600">{{ c.titre }}</h2>
        <p class="mt-1 text-[15px] font-medium text-gray-500">{{ c.sousTitre }}</p>
        <p class="mt-4 flex-1 text-[15px] leading-[1.6] text-gray-600">{{ c.texte }}</p>

        <dl class="mt-6 grid grid-cols-3 gap-4 border-t border-gray-200 pt-5">
          <div v-for="ch in c.chiffres" :key="ch.libelle">
            <dd class="type-figure text-[22px] leading-[1.1]">{{ ch.valeur }}</dd>
            <dt class="mt-0.5 type-caption text-gray-500">{{ ch.libelle }}</dt>
          </div>
        </dl>

        <NuxtLink
          :to="`/diagnostic/${c.type}/introduction`"
          class="mt-6 inline-flex items-center justify-center bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700 active:bg-orange-800"
          style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        >
          Commencer ce diagnostic
        </NuxtLink>
      </div>
    </div>

    <p
      class="mt-8 border border-navy-100 bg-navy-50 p-5 text-[15px] leading-[1.6] text-navy-700"
      style="border-radius: var(--radius-card)"
    >
      Réalisez les deux et la lecture croisée s’ajoute automatiquement : elle met en regard votre
      pilotage interne et ce que perçoit votre marché.
    </p>
  </section>
</template>
