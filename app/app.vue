<template>
  <!-- Barre de progression de navigation, aux couleurs du kit. Elle couvre
       l'attente réseau réelle du parcours, là où une transition ne fait que l'habiller. -->
  <NuxtLoadingIndicator color="#d45d00" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
/* Transition de page — fondu court, sans déplacement ni rebond.
   « Aucun rebond, aucun parallaxe » (design system). */
.page-enter-active,
.page-leave-active {
  transition:
    opacity var(--dur-card) var(--ease-standard),
    transform var(--dur-card) var(--ease-standard);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.page-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .page-enter-active,
  .page-leave-active {
    transition: none;
  }
  .page-enter-from {
    transform: none;
  }
}
</style>
