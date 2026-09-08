<script setup lang="ts">
/**
 * Barre supérieure des écrans du parcours (P02 à P14).
 * Mobile : 14 px de marge verticale, bouton de retour 44 px débordant de 10 px à gauche.
 * Tablette : marges 40 px. Desktop : 76 px de haut, contenu sur 1200 px.
 */
defineProps<{
  /** Route du retour. Absent : pas de bouton à gauche. */
  back?: string
  /** Croix au lieu de la flèche (cartes partageables). */
  close?: boolean
  /** Libellé à côté du retour. */
  label?: string
  /** Logotype à côté du retour, ou seul. */
  logo?: boolean
  /** Libellé réservé aux petits écrans, quand il diffère. */
  labelMobile?: string
}>()
</script>

<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="wrap flex items-center gap-3 py-3.5 md:gap-3.5 md:py-4 lg:h-[76px] lg:py-0">
      <NuxtLink
        v-if="back"
        :to="back"
        class="-ml-2.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy-600 hover:bg-navy-50 md:-ml-3 lg:ml-0 lg:h-auto lg:w-auto lg:rounded-none lg:hover:bg-transparent"
        :aria-label="close ? 'Fermer' : 'Retour'"
      >
        <UiIcon :name="close ? 'close' : 'arrow-left'" :size="22" />
      </NuxtLink>
      <NuxtLink v-if="logo" to="/" class="shrink-0" aria-label="Radar by FeexPay, accueil">
        <img src="/brand/logo-feexpay.svg" alt="FeexPay" class="h-[18px] w-auto md:h-5 lg:h-6" >
      </NuxtLink>
      <span v-if="label" class="text-sm font-medium leading-none text-navy-600 lg:text-[15px]">
        <span v-if="labelMobile" class="lg:hidden">{{ labelMobile }}</span>
        <span :class="labelMobile ? 'hidden lg:inline' : undefined">{{ label }}</span>
      </span>
      <div class="ml-auto flex items-center gap-3 text-sm leading-none text-gray-500">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>
