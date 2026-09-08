<script setup lang="ts">
/**
 * Barres horizontales. La maquette est explicite : « aucun graphique radar »
 * malgré le nom du produit. « Le bleu nuit porte les séries ; l'orange met en
 * évidence la dimension la plus pondérée. »
 */
const LABELS: Record<string, string> = {
  VIS: 'Vision',
  STR: 'Stratégie',
  EXE: 'Exécution',
  ORG: 'Organisation',
  INF: 'Influence',
  AUD: 'Audace',
  ADA: 'Adaptabilité',
  TRA: 'Transformation',
  notoriete: 'Notoriété',
  lectureConcurrentielle: 'Lecture concurrentielle',
  differenciation: 'Différenciation',
  digital: 'Digital',
  empreinte: 'Empreinte',
}

const props = defineProps<{ dims: Record<string, number> }>()

/** La valeur la plus haute est mise en avant en orange. */
const maxKey = computed(() => {
  const entries = Object.entries(props.dims)
  if (!entries.length) return null
  return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
})
</script>

<template>
  <ul class="space-y-3">
    <li v-for="(v, k) in dims" :key="k">
      <div class="mb-1 flex justify-between type-small">
        <span class="text-gray-700">{{ LABELS[k] ?? k }}</span>
        <span class="font-semibold text-navy-700">{{ Math.round(v) }}</span>
      </div>
      <div class="h-2 rounded-full bg-gray-100">
        <div
          class="h-full rounded-full"
          :class="k === maxKey ? 'bg-orange-600' : 'bg-navy-500'"
          :style="{ width: Math.round(v) + '%' }"
        />
      </div>
    </li>
  </ul>
</template>
