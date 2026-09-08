<script setup lang="ts">
/** Champ de formulaire : libellé, astérisque orange si requis, aide et erreur. */
defineProps<{ label: string; required?: boolean; error?: string; hint?: string }>()
const id = useId()
</script>

<template>
  <div>
    <label :for="id" class="block type-small font-semibold text-navy-700">
      {{ label }}<span v-if="required" class="text-orange-600"> *</span>
    </label>
    <p v-if="hint" class="mt-1 type-caption text-gray-500">{{ hint }}</p>
    <div class="mt-2" :class="error ? 'fx-field--error' : undefined">
      <slot :id="id" />
    </div>
    <p v-if="error" class="mt-1.5 type-caption text-red-600" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
/* L'erreur ne repose pas sur la seule couleur : le message texte l'accompagne toujours. */
.fx-field--error :deep(input),
.fx-field--error :deep(select) {
  border-color: var(--color-red-600);
}
</style>
