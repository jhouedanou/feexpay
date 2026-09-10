<script setup lang="ts">
/**
 * Raccourci vers le rapport complet dans l'en-tête du site.
 *
 * Il n'apparaît qu'une fois l'analyse demandée : le jeton de rapport est posé par P10 dans le
 * navigateur. Avant cela, le visiteur n'a rien à consulter et l'en-tête reste nu.
 */
const { etat, resoudre } = useLectureCroisee()
onMounted(() => {
  if (!etat.value.charge) resoudre()
})
</script>

<template>
  <NuxtLink
    v-if="etat.rapportToken"
    :to="`/rapport/${etat.rapportToken}`"
    class="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 px-3.5 text-[15px] leading-none font-medium text-navy-600 hover:border-navy-300"
    aria-label="Mon rapport complet"
    :title="'Mon rapport complet'"
  >
    <UiIcon name="file-document-outline" :size="19" class="text-orange-600" />
    <span class="hidden xl:inline">Mon rapport</span>
  </NuxtLink>
</template>
