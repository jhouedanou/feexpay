<script setup lang="ts">
// Compteurs résolus côté serveur pour éviter tout décalage de mise en page.
const { data: counts } = await useAsyncData('diagnostic-counts', async () => {
  const [d, r] = await Promise.all([
    $fetch<{ questions: unknown[] }>('/api/public/questions/dirigeant'),
    $fetch<{ questions: unknown[] }>('/api/public/questions/rayonnement'),
  ])
  return { dirigeant: d.questions.length, rayonnement: r.questions.length }
})

const cards = computed(() => [
  {
    type: 'dirigeant',
    titre: 'Profil du dirigeant',
    desc: `${counts.value?.dirigeant ?? '—'} questions · votre archétype parmi 8 figures`,
    duree: '≈ 4 min',
    img: '/brand/emb-stratege-64.png',
  },
  {
    type: 'rayonnement',
    titre: "Rayonnement de l'entreprise",
    desc: `${counts.value?.rayonnement ?? '—'} questions · score 0–100 et météo`,
    duree: '≈ 2 min',
    img: '/brand/logo-mark.png',
  },
])
</script>

<template>
  <section class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-2xl font-semibold text-navy-800 md:text-3xl">Choisissez un diagnostic</h1>
    <p class="mt-2 text-gray-600">Les deux sont indépendants. Vous pourrez faire le second ensuite.</p>
    <div class="mt-8 grid gap-4 md:grid-cols-2">
      <NuxtLink
        v-for="c in cards"
        :key="c.type"
        :to="`/diagnostic/${c.type}/introduction`"
        class="rounded-2xl border-2 border-gray-200 bg-white p-6 transition hover:border-orange-400"
      >
        <img :src="c.img" alt="" class="h-12 w-12" />
        <h2 class="mt-4 text-lg font-semibold text-navy-800">{{ c.titre }}</h2>
        <p class="mt-1 text-sm text-gray-600">{{ c.desc }}</p>
        <p class="mt-3 text-xs text-gray-500">{{ c.duree }}</p>
      </NuxtLink>
    </div>
  </section>
</template>
