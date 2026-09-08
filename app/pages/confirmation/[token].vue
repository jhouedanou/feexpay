<script setup lang="ts">
/**
 * P11 — confirmation. Structure de la maquette (docs/maquette/desktop-1440-P11.md),
 * mais l'état affiché est l'état réel : l'envoi Resend n'est pas encore branché, donc
 * l'écran ne prétend pas qu'un email est parti. « Célébration sobre : une icône,
 * aucune animation festive. »
 */
const route = useRoute()
const token = route.params.token as string

useSeoMeta({ title: 'Votre analyse est prête — Radar by FeexPay' })
</script>

<template>
  <section class="mx-auto max-w-[760px] px-5 py-14 md:px-8 md:py-20">
    <UiIcon name="check-circle-outline" :size="48" class="text-green-600" />
    <h1 class="mt-5 type-h1">Votre analyse est prête</h1>
    <p class="mt-4 text-[17px] leading-[1.6] text-gray-600">
      Vos informations sont enregistrées et votre rapport est constitué. Il reste accessible
      depuis ce lien.
    </p>

    <div
      class="mt-8 flex items-start gap-3 border border-amber-600/20 bg-amber-100 p-4"
      style="border-radius: var(--radius-control)"
    >
      <UiIcon name="clock-outline" :size="20" class="mt-0.5 shrink-0 text-amber-600" />
      <div>
        <p class="text-[15px] font-semibold text-amber-600">Envoi par email en préparation</p>
        <p class="mt-1 text-[15px] leading-[1.6] text-gray-700">
          La transmission du rapport par email et son PDF sont en cours de mise en service.
          Conservez ce lien : il vous donnera accès au rapport dès qu’il sera disponible.
        </p>
      </div>
    </div>

    <div
      class="mt-9 border border-gray-200 p-6"
      style="border-radius: var(--radius-card); box-shadow: var(--shadow-sm)"
    >
      <p class="type-eyebrow">Deuxième diagnostic</p>
      <h2 class="mt-2 type-h2">Ajoutez la lecture du rayonnement</h2>
      <p class="mt-3 text-[15px] leading-[1.6] text-gray-600">
        Sept questions supplémentaires suffisent pour comparer vos fondations internes et ce que
        votre marché perçoit.
      </p>
      <NuxtLink
        to="/diagnostic"
        class="mt-6 inline-flex items-center justify-center bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700 active:bg-orange-800"
        style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
      >
        Commencer le second diagnostic
      </NuxtLink>
    </div>

    <p class="mt-8 type-caption text-gray-500">Référence de votre rapport : {{ token.slice(0, 8) }}…</p>
  </section>
</template>
