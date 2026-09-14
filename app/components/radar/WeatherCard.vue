<script setup lang="ts">
// Indexé sur le code ASCII servi par l'API, pas sur le libellé français :
// un changement de libellé dans la matrice ne doit pas faire disparaître l'icône.
const ICONS: Record<string, string> = {
  soleil: '☀️',
  eclaircies: '🌤️',
  nuageux: '☁️',
  pluie: '🌧️',
  tempete: '⛈️',
}
defineProps<{ meteo: string; meteoCode: string; niveau: string; nuance: string | null }>()
</script>

<template>
  <div class="flex items-center gap-4 rounded-2xl border border-navy-100 bg-navy-50 p-4">
    <span class="text-4xl" aria-hidden="true">{{ ICONS[meteoCode] ?? '🌡️' }}</span>
    <div>
      <p class="text-xs uppercase tracking-wide text-gray-500">Météo</p>
      <p class="text-lg font-semibold text-navy-800">{{ meteo }}<span v-if="nuance" class="font-normal text-gray-600"> · {{ nuance }}</span></p>
      <p class="text-sm text-gray-600">{{ niveau }}</p>
    </div>
  </div>
</template>
