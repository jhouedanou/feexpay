<script setup lang="ts">
/** Ligne de méta au-dessus des questions : compteur et état d'enregistrement. */
defineProps<{ current: number; total: number; enregistre?: boolean }>()
</script>

<template>
  <p class="flex flex-wrap items-center gap-x-3 gap-y-1 type-caption text-gray-500">
    <span>Question {{ current }} sur {{ total }}</span>
    <span v-if="current === total" class="font-semibold text-navy-600">Dernière question</span>
    <span v-if="enregistre" class="inline-flex items-center gap-1 text-green-600">
      <UiIcon name="check-circle-outline" :size="14" />
      Enregistré
    </span>
  </p>
</template>
