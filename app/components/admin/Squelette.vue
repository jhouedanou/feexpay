<script setup lang="ts">
/** Squelette de chargement (A08) : blocs gris en pulsation d'opacité, sans autre mouvement. */
withDefaults(defineProps<{ lignes?: number }>(), { lignes: 4 })
</script>

<template>
  <div class="card animate-pulse p-6" aria-busy="true" aria-label="Chargement">
    <div class="mb-5 h-5 w-1/3 rounded bg-gray-100" />
    <div v-for="i in lignes" :key="i" class="mb-3 h-4 rounded bg-gray-100" :style="{ width: `${90 - i * 9}%` }" />
  </div>
</template>
