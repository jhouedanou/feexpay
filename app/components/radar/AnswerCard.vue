<script setup lang="ts">
defineProps<{ lettre: string; texte: string; selected: boolean }>()
</script>

<template>
  <button
    type="button"
    class="flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition min-h-12 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
    :class="selected ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-navy-300'"
    :aria-pressed="selected"
  >
    <span
      class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
      :class="selected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-700'"
      >{{ lettre }}</span
    >
    <span class="text-base leading-snug text-gray-900">{{ texte }}</span>
  </button>
</template>
