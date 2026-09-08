<template>
  <!-- Écrans du parcours : pas de navigation de site ni de pied de page (maquette P02 à P14).
       Chaque page pose sa propre barre supérieure avec RadarTopBar. -->
  <div class="flex min-h-dvh flex-col bg-white">
    <main class="flex flex-1 flex-col"><slot /></main>
  </div>
</template>
