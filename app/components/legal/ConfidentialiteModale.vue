<script setup lang="ts">
/**
 * La politique de confidentialité, ouverte par-dessus la page courante. Montée une seule fois
 * dans `app.vue` : elle couvre ainsi tous les layouts, l'espace admin et la page d'erreur.
 */
const { ouverte } = useConfidentialiteModale()
</script>

<template>
  <UiModale v-model="ouverte" titre="Politique de confidentialité" :sous-titre="`Dernière mise à jour : ${MAJ_CONFIDENTIALITE}`">
    <LegalConfidentialiteTexte :ancres="false" />
    <template #pied>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <NuxtLink to="/politique-de-confidentialite" target="_blank" class="text-[13px] text-gray-500 hover:text-navy-600 hover:underline" @click="ouverte = false">Ouvrir dans un onglet</NuxtLink>
        <button type="button" class="btn btn-primary h-11 rounded-[10px] px-6 text-sm" @click="ouverte = false">J’ai compris</button>
      </div>
    </template>
  </UiModale>
</template>
