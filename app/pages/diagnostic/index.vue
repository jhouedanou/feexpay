<script setup lang="ts">
// P02 — deux diagnostics indépendants, triplet chiffré par carte (maquette planche 03/05).
const cards = [
  {
    type: 'dirigeant',
    titre: 'Profil du dirigeant',
    desc: 'Votre archétype parmi huit figures inspirantes',
    chiffres: ['14 questions', '4 à 6 minutes', '8 profils possibles'],
    img: '/brand/emb-stratege-64.png',
  },
  {
    type: 'rayonnement',
    titre: 'Rayonnement de l’entreprise',
    desc: 'Score sur 100, niveau et météo',
    chiffres: ['7 questions', '2 à 4 minutes', '5 niveaux de lecture'],
    img: '/brand/logo-mark-2026.png',
  },
]

useSeoMeta({ title: 'Choisissez un diagnostic — Radar by FeexPay' })
</script>

<template>
  <section class="mx-auto max-w-[1200px] px-5 py-12 md:px-8">
    <p class="type-eyebrow">Étape 1 sur 3 · choix du diagnostic</p>
    <h1 class="mt-2 type-h1">Choisissez un diagnostic</h1>
    <p class="mt-3 type-body text-gray-700">
      Les deux sont indépendants. Vous pourrez faire le second ensuite.
    </p>

    <div class="mt-9 grid gap-5 md:grid-cols-2">
      <div
        v-for="c in cards"
        :key="c.type"
        class="flex flex-col border border-gray-200 bg-white p-6"
        style="border-radius: var(--radius-card); box-shadow: var(--shadow-sm)"
      >
        <img :src="c.img" alt="" class="h-12 w-12" >
        <h2 class="mt-4 type-h3">{{ c.titre }}</h2>
        <p class="mt-1.5 type-small text-gray-600">{{ c.desc }}</p>

        <dl class="mt-5 grid grid-cols-3 gap-3 border-t border-gray-200 pt-4">
          <div v-for="ch in c.chiffres" :key="ch">
            <dd class="type-caption text-gray-600">{{ ch }}</dd>
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

    <p class="mt-8 type-small text-gray-500">
      Vos réponses sont enregistrées au fur et à mesure.
    </p>
  </section>
</template>
