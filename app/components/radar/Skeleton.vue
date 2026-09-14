<script setup lang="ts">
/**
 * Gabarit d'attente. La maquette est explicite : « aucun mouvement au-delà d'une
 * pulsation d'opacité, pas de spinner centré ». La pulsation est neutralisée par
 * la règle globale prefers-reduced-motion de main.css.
 */
withDefaults(defineProps<{ lignes?: number }>(), { lignes: 3 })
const LARGEURS = ['40%', '85%', '65%', '74%', '52%']
</script>

<template>
  <div
    class="animate-pulse border border-gray-200 p-4"
    style="border-radius: var(--radius-control)"
    aria-hidden="true"
  >
    <div
      v-for="i in lignes"
      :key="i"
      class="mb-2 h-2.5 rounded bg-gray-100 last:mb-0"
      :style="{ width: LARGEURS[(i - 1) % LARGEURS.length] }"
    />
  </div>
</template>
