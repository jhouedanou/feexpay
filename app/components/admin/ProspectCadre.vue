<script setup lang="ts">
/** Chargement, erreur et introuvable communs aux onglets de la fiche prospect. */
defineProps<{ fiche: any; error: any; pending: boolean; refresh: () => Promise<unknown> | undefined }>()
</script>

<template>
  <div class="px-8 py-7">
    <AdminVide v-if="error && (error as any).statusCode === 404" titre="Prospect introuvable" texte="Ce contact n’existe pas ou a été supprimé." icone="account-outline">
      <NuxtLink to="/admin/prospects" class="btn btn-navy h-10 rounded-[10px] px-4 text-sm">Retour aux prospects</NuxtLink>
    </AdminVide>
    <AdminVide v-else-if="error" erreur titre="Les données n’ont pas pu être chargées" texte="La fiche n’a pas répondu. Vos filtres et votre sélection sont conservés.">
      <button type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="refresh()"><UiIcon name="refresh" :size="18" />Réessayer</button>
    </AdminVide>
    <AdminSquelette v-else-if="pending && !fiche" :lignes="8" />
  </div>
</template>
