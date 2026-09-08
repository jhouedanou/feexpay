<script setup lang="ts">
import type { DiagType } from '~/composables/useParticipation'

// P07 — écran de transition, jamais bloquant. La maquette interdit le spinner nu :
// on montre les étapes du calcul, et un message si l'attente dépasse dix secondes.
const route = useRoute()
const type = route.params.type as DiagType
const part = useParticipation(type)
const slow = ref(false)
const error = ref<string | null>(null)
const etape = ref(0)

const ETAPES = [
  'Réponses enregistrées',
  'Dimensions pondérées',
  type === 'dirigeant' ? 'Archétype principal en cours de détermination' : 'Niveau et météo calculés',
  'Rédaction de votre restitution',
]

useSeoMeta({ title: 'Analyse en cours — Radar by FeexPay' })

let cadence: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  part.load()
  if (!part.token.value) return navigateTo(`/diagnostic/${type}/introduction`)

  // La progression visuelle est indicative : le calcul serveur est bien plus rapide
  // que la lecture de la liste. Elle s'arrête à l'avant-dernière étape et n'atteint
  // la dernière que quand la réponse est réellement arrivée.
  etape.value = 1
  cadence = setInterval(() => {
    if (etape.value < ETAPES.length - 1) etape.value += 1
  }, 700)

  const t = setTimeout(() => (slow.value = true), 10_000)
  try {
    await part.complete()
    etape.value = ETAPES.length
    await navigateTo(`/resultat/${type}/${part.token.value}`, { replace: true })
  } catch (e: unknown) {
    const err = e as { data?: { data?: { code?: string }; code?: string } }
    const code = err?.data?.data?.code ?? err?.data?.code
    if (code === 'INCOMPLETE_PARTICIPATION') return navigateTo(`/diagnostic/${type}/question/1`)
    error.value = 'Le calcul a échoué. Réessayez dans un instant.'
  } finally {
    clearTimeout(t)
    clearInterval(cadence)
  }
})

onUnmounted(() => clearInterval(cadence))
</script>

<template>
  <section class="mx-auto max-w-[640px] px-5 py-20 text-center">
    <template v-if="!error">
      <!-- « Légère respiration du symbole, 220 ms », pas de spinner générique. -->
      <img
        src="/brand/logo-mark-2026.png"
        alt=""
        class="mx-auto h-16 w-16 respiration"
        width="64"
        height="64"
      >
      <h1 class="mt-7 type-h2">Nous assemblons votre lecture</h1>
      <p class="mt-2 type-body text-gray-600">
        Quelques secondes suffisent. Ne fermez pas cette page.
      </p>

      <ul class="mx-auto mt-9 max-w-sm space-y-3 text-left">
        <li
          v-for="(e, i) in ETAPES"
          :key="e"
          class="flex items-start gap-2.5 type-small"
          :class="i < etape ? 'text-gray-700' : 'text-gray-400'"
        >
          <UiIcon
            :name="i < etape ? 'check-circle-outline' : i === etape ? 'circle-slice-4' : 'circle-outline'"
            :size="20"
            class="mt-px shrink-0"
            :class="i < etape ? 'text-green-600' : i === etape ? 'text-orange-600' : 'text-gray-300'"
          />
          <span>{{ e }}</span>
        </li>
      </ul>

      <p v-if="slow" class="mt-7 type-small text-gray-500">
        Cela prend un peu plus de temps que prévu. Votre parcours est enregistré, rien n’est
        perdu.
      </p>
    </template>

    <template v-else>
      <p class="type-body text-red-600">{{ error }}</p>
      <button
        type="button"
        class="mt-5 inline-flex items-center justify-center bg-orange-600 px-7 font-semibold text-white hover:bg-orange-700"
        style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        @click="reloadNuxtApp()"
      >
        Réessayer
      </button>
    </template>
  </section>
</template>

<style scoped>
.respiration {
  animation: respiration 2.2s var(--ease-standard) infinite;
}
@keyframes respiration {
  0%,
  100% {
    opacity: 0.65;
    transform: scale(0.97);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .respiration {
    animation: none;
    opacity: 1;
  }
}
</style>
