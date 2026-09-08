<script setup lang="ts">
/**
 * Météo du rayonnement. Icônes MDI, jamais d'emoji (règle du design system).
 * « Le niveau reste compréhensible sans la couleur et sans l'icône météo » :
 * le libellé porte l'information, l'icône ne fait que l'accompagner.
 */
const ICONS: Record<string, string> = {
  Soleil: 'weather-sunny',
  Éclaircies: 'weather-partly-cloudy',
  Nuageux: 'weather-cloudy',
  Pluie: 'weather-rainy',
  Tempête: 'weather-lightning-rainy',
}

const props = defineProps<{ meteo: string; niveau: string; nuance: string | null }>()
const icon = computed(() => ICONS[props.meteo] ?? 'weather-cloudy')
</script>

<template>
  <div
    class="flex items-center gap-4 border border-navy-100 bg-navy-50 p-4"
    style="border-radius: var(--radius-card)"
  >
    <UiIcon :name="icon" :size="40" class="text-navy-600" />
    <div>
      <p class="type-eyebrow">Météo</p>
      <p class="mt-1 text-lg font-semibold text-navy-800">
        {{ meteo }}<span v-if="nuance" class="font-normal text-gray-600"> · {{ nuance }}</span>
      </p>
      <p class="type-small text-gray-600">{{ niveau }}</p>
    </div>
  </div>
</template>
