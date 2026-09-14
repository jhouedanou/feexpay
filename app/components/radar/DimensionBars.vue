<script setup lang="ts">
// Libellés fournis par l'API (server/utils/result.ts) : aucun vocabulaire du
// moteur n'est dupliqué ici, et `app/` n'importe jamais `@radar/scoring`.
defineProps<{ dims: { code: string; nom: string; valeur: number }[] }>()
</script>

<template>
  <ul class="space-y-3">
    <li v-for="d in dims" :key="d.code">
      <div class="mb-1 flex justify-between text-sm">
        <span class="text-gray-700">{{ d.nom }}</span>
        <span class="font-medium text-navy-700">{{ d.valeur }}</span>
      </div>
      <div class="h-2 rounded-full bg-gray-100">
        <div class="h-full rounded-full bg-navy-500" :style="{ width: d.valeur + '%' }" />
      </div>
    </li>
  </ul>
</template>
