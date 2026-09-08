<script setup lang="ts">
// P07 — écran de transition, jamais bloquant. Cadres 390 et 1440. « Pas de spinner nu » :
// symbole dans sa tuile, barre de progression, liste d'étapes en desktop.
import type { DiagType } from '~/composables/useParticipation'

definePageMeta({ layout: 'bare' })

const route = useRoute()
const type = route.params.type as DiagType
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })
const part = useParticipation(type)
const slow = ref(false)
const error = ref<string | null>(null)
const etape = ref(0)

const ETAPES = [
  'Réponses enregistrées',
  'Dimensions pondérées',
  type === 'dirigeant' ? 'Archétype principal en cours de détermination' : 'Niveau et météo en cours de détermination',
  'Rédaction de votre restitution',
]
const pct = computed(() => Math.round(((etape.value + 0.5) / ETAPES.length) * 100))

useSeoMeta({ title: 'Nous assemblons votre lecture — Radar by FeexPay' })

let cadence: ReturnType<typeof setInterval> | undefined

onMounted(async () => {
  part.load()
  if (!part.token.value) return navigateTo(`/diagnostic/${type}/introduction`)

  // Progression indicative : le calcul serveur est plus rapide que la lecture de la liste.
  // Elle s'arrête à l'avant-dernière étape et n'atteint la dernière qu'à la réponse réelle.
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
  <div class="flex flex-1 flex-col">
    <section
      class="flex flex-1 flex-col items-center justify-center px-7 py-10 text-center lg:min-h-[620px]"
      style="background: linear-gradient(180deg, #eef3f9 0%, #ffffff 72%)"
    >
      <template v-if="!error">
        <div
          class="respiration mb-[26px] flex h-24 w-24 items-center justify-center rounded-3xl border border-gray-200 bg-white lg:mb-[34px] lg:h-[120px] lg:w-[120px] lg:rounded-[28px]"
          style="box-shadow: 0 4px 16px rgba(17, 44, 86, 0.08)"
        >
          <img src="/brand/logo-mark-2026.png" alt="Symbole FeexPay" class="h-11 w-auto lg:h-14" width="56" height="56" >
        </div>
        <h1 class="mb-3 text-[26px] leading-[1.28] font-semibold text-navy-600 lg:mb-3.5 lg:text-4xl lg:leading-[1.2] lg:tracking-[-0.02em]">
          Nous assemblons votre lecture
        </h1>
        <p class="mb-[26px] max-w-[520px] text-base leading-[1.6] text-gray-600 lg:mb-10 lg:text-[17px] lg:leading-[1.65]" style="text-wrap: pretty">
          <span class="lg:hidden">
            {{
              type === 'dirigeant'
                ? 'Vos quatorze réponses sont comparées aux huit dimensions de direction, puis rapprochées des huit archétypes.'
                : 'Vos sept réponses sont comparées aux cinq dimensions de rayonnement, puis rapprochées des cinq niveaux de lecture.'
            }}
          </span>
          <span class="hidden lg:inline">
            {{
              type === 'dirigeant'
                ? 'Vos quatorze réponses sont mises en regard des huit dimensions de direction. Quelques secondes suffisent.'
                : 'Vos sept réponses sont mises en regard des cinq dimensions de rayonnement. Quelques secondes suffisent.'
            }}
          </span>
        </p>
        <div class="mb-[18px] h-1.5 w-[180px] overflow-hidden rounded-full bg-gray-100 lg:mb-8 lg:w-[420px] lg:bg-navy-100" role="progressbar" :aria-valuenow="pct" :aria-valuemin="0" :aria-valuemax="100" aria-label="Calcul en cours">
          <div class="h-full rounded-full bg-orange-600" :style="{ width: pct + '%', transition: 'width 600ms var(--ease-standard)' }" />
        </div>
        <p class="text-[13px] leading-[1.5] text-gray-500 lg:hidden">Quelques secondes suffisent. Ne fermez pas cette page.</p>

        <ul class="hidden w-[420px] flex-col gap-3 text-left lg:flex" aria-live="polite">
          <li v-for="(e, i) in ETAPES" :key="e" class="flex items-center gap-3">
            <UiIcon
              :name="i < etape ? 'check-circle' : i === etape ? 'circle-slice-4' : 'circle-outline'"
              :size="20"
              class="shrink-0"
              :class="i < etape ? 'text-green-600' : i === etape ? 'text-orange-600' : 'text-gray-300'"
            />
            <span class="text-[15px] leading-[1.4]" :class="i < etape ? 'text-gray-700' : i === etape ? 'font-medium text-navy-600' : 'text-gray-400'">{{ e }}</span>
          </li>
        </ul>

        <p v-if="slow" class="mt-7 max-w-[420px] text-sm leading-[1.5] text-gray-500">
          Cela prend un peu plus de temps que prévu. Votre parcours est enregistré, rien n’est perdu.
        </p>
      </template>

      <template v-else>
        <p class="text-base text-red-600" role="alert">{{ error }}</p>
        <div class="mt-5 flex flex-col gap-3 sm:flex-row">
          <button type="button" class="btn btn-primary h-[52px] px-7 text-base" @click="reloadNuxtApp()">
            <UiIcon name="refresh" :size="18" />
            Réessayer
          </button>
          <NuxtLink :to="`/diagnostic/${type}/question/1`" class="btn btn-outline h-[52px] px-6 text-base">Revoir mes réponses</NuxtLink>
          <NuxtLink :to="`/diagnostic/${type}/introduction`" class="btn btn-outline h-[52px] px-6 text-base">Revenir à l’introduction</NuxtLink>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
/* « Légère respiration du symbole, 220 ms », désactivée avec prefers-reduced-motion. */
.respiration {
  animation: respiration 2.2s var(--ease-standard) infinite;
}
@keyframes respiration {
  0%,
  100% {
    transform: scale(0.97);
  }
  50% {
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .respiration {
    animation: none;
  }
}
</style>
