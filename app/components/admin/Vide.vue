<script setup lang="ts">
/**
 * État vide ou erreur (A08) : ce qui est attendu, pourquoi rien ne s'affiche, la seule action
 * qui débloque. Aucune illustration, aucun spinner : le chargement est une pulsation d'opacité.
 */
defineProps<{ titre: string; texte: string; icone?: string; erreur?: boolean }>()
</script>

<template>
  <div class="card flex flex-col items-start gap-3 p-7">
    <span class="inline-flex h-10 w-10 items-center justify-center rounded-full" :class="erreur ? 'bg-red-100 text-red-600' : 'bg-navy-50 text-navy-600'">
      <UiIcon :name="icone ?? (erreur ? 'alert-circle-outline' : 'clipboard-list-outline')" :size="22" />
    </span>
    <p class="text-[17px] leading-[1.3] font-semibold text-navy-600">{{ titre }}</p>
    <p class="max-w-[520px] text-sm leading-[1.5] text-gray-600">{{ texte }}</p>
    <div v-if="$slots.default" class="mt-1 flex gap-2.5"><slot /></div>
  </div>
</template>
