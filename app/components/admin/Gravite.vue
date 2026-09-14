<script setup lang="ts">
/** Trois barres 4×14 px (A03/A04/A05) : gravité 3 rouge, 2 ambre, 1 gris, 0 gris clair. */
const props = withDefaults(defineProps<{ gravite: number; hauteur?: number }>(), { hauteur: 14 })
const couleur = computed(() => (props.gravite >= 3 ? 'bg-red-600' : props.gravite === 2 ? 'bg-amber-600' : props.gravite === 1 ? 'bg-gray-400' : 'bg-gray-200'))
</script>

<template>
  <span class="flex shrink-0 gap-0.5" :aria-label="`Gravité ${gravite}`">
    <span v-for="i in 3" :key="i" class="w-1 rounded-sm" :style="{ height: hauteur + 'px' }" :class="i <= gravite ? couleur : 'bg-gray-200'" />
  </span>
</template>
