<script setup lang="ts">
const LABELS: Record<string, string> = {
  VIS: 'Vision', STR: 'Stratégie', EXE: 'Exécution', ORG: 'Organisation',
  INF: 'Influence', AUD: 'Audace', ADA: 'Adaptabilité', TRA: 'Transformation',
  notoriete: 'Notoriété', lectureConcurrentielle: 'Lecture concurrentielle', differenciation: 'Différenciation',
  digital: 'Digital', empreinte: 'Empreinte',
}
defineProps<{ dims: Record<string, number> }>()
</script>

<template>
  <ul class="space-y-3">
    <li v-for="(v, k) in dims" :key="k">
      <div class="mb-1 flex justify-between text-sm">
        <span class="text-gray-700">{{ LABELS[k] ?? k }}</span>
        <span class="font-medium text-navy-700">{{ Math.round(v) }}</span>
      </div>
      <div class="h-2 rounded-full bg-gray-100">
        <div class="h-full rounded-full bg-navy-500" :style="{ width: Math.round(v) + '%' }" />
      </div>
    </li>
  </ul>
</template>
