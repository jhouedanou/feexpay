<script setup lang="ts">
/**
 * P11 — confirmation. Cadres 390 et 1440. « Célébration sobre : une icône, aucune
 * animation festive. » L'envoi par email (Resend) n'est pas encore branché : l'écran
 * affiche l'état réel avec le composant Feedback ambre de la planche Components,
 * pas le bandeau vert « Email envoyé » de la maquette.
 */
import type { DiagType } from '~/composables/useParticipation'

definePageMeta({ layout: 'bare' })

const route = useRoute()
const token = route.params.token as string

/** Contexte laissé par P10 : type, jeton de participation, email et nom du rapport. */
const ctx = ref<{ type: DiagType; token: string; email: string; rapport: string } | null>(null)
const type = computed<DiagType | null>(() => ctx.value?.type ?? null)
const { etat: autre, charger: chargerAutre } = useAutreDiagnostic('dirigeant')

onMounted(() => {
  try {
    const raw = localStorage.getItem(`radar:rapport:${token}`)
    if (raw) ctx.value = JSON.parse(raw)
  } catch {}
  if (ctx.value?.type === 'dirigeant') chargerAutre()
})

const autreType = computed<DiagType>(() => (type.value === 'rayonnement' ? 'dirigeant' : 'rayonnement'))
const second = computed(() =>
  autreType.value === 'rayonnement'
    ? {
        titre: 'Ajoutez la lecture du rayonnement',
        texte: 'Sept questions supplémentaires suffisent pour comparer vos fondations internes et ce que votre marché perçoit.',
      }
    : {
        titre: 'Ajoutez la lecture de votre pilotage',
        texte: 'Quatorze questions supplémentaires suffisent pour comparer ce que votre marché perçoit et vos fondations internes.',
      },
)
const rapport = computed(() => ctx.value?.rapport ?? 'Votre rapport complet')

useSeoMeta({ title: 'Votre analyse est prête — Radar by FeexPay' })
</script>

<template>
  <div class="flex flex-1 flex-col">
    <header class="hidden border-b border-gray-200 bg-white lg:block">
      <div class="wrap flex h-[76px] items-center justify-between lg:!px-6">
        <NuxtLink to="/" aria-label="Radar by FeexPay, accueil"><img src="/brand/logo-feexpay.svg" alt="FeexPay" class="h-6 w-auto" ></NuxtLink>
        <span v-if="ctx?.email" class="text-sm leading-none text-gray-500">{{ ctx.email }}</span>
      </div>
    </header>

    <section class="px-5 pt-10 pb-8 text-center md:px-10 lg:px-0 lg:pt-20 lg:pb-16" style="background: linear-gradient(180deg, #eef3f9 0%, #ffffff 80%)">
      <div class="mx-auto max-w-[720px]">
        <span class="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-[20px] bg-green-100 text-green-600 lg:mb-[26px] lg:h-20 lg:w-20 lg:rounded-3xl">
          <UiIcon name="check-decagram" class="!h-[34px] !w-[34px] lg:!h-[42px] lg:!w-[42px]" />
        </span>
        <h1 class="mb-3 text-[28px] leading-[1.22] font-semibold tracking-[-0.015em] text-navy-600 lg:mb-4 lg:text-[44px] lg:leading-[1.1] lg:tracking-[-0.025em]">Votre analyse est prête</h1>
        <p class="text-base leading-[1.6] text-gray-600 lg:mb-8 lg:text-lg lg:leading-[1.65]" style="text-wrap: pretty">
          {{ rapport }} est constitué dès maintenant et reste accessible depuis ce lien.
        </p>

        <div class="mt-5 hidden lg:block">
          <div class="mb-8 flex items-center gap-3.5 rounded-xl bg-amber-100 px-[22px] py-[18px] text-left">
            <UiIcon name="clock-outline" :size="24" class="shrink-0 text-amber-600" />
            <div>
              <p class="text-[15px] leading-[1.35] font-semibold text-amber-600">Envoi par email en préparation</p>
              <p class="mt-0.5 text-sm leading-[1.5] text-gray-700">La transmission du rapport par email et son PDF sont en cours de mise en service. Conservez ce lien.</p>
            </div>
          </div>
          <div class="flex justify-center gap-3.5">
            <NuxtLink v-if="ctx" :to="`/resultat/${ctx.type}/${ctx.token}`" class="btn btn-primary h-14 px-[30px] text-base"><UiIcon name="file-document-outline" :size="18" />Consulter mon rapport</NuxtLink>
            <NuxtLink v-if="ctx" :to="`/partager/${ctx.type}/${ctx.token}`" class="btn btn-outline h-14 px-6 text-base"><UiIcon name="share-variant-outline" :size="18" />Partager</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <div class="px-5 pb-2 md:mx-auto md:w-full md:max-w-[520px] md:px-0 lg:hidden">
      <div class="mb-5 flex items-center gap-3 rounded-xl bg-amber-100 p-4">
        <UiIcon name="clock-outline" :size="22" class="shrink-0 text-amber-600" />
        <div>
          <p class="text-sm leading-[1.35] font-semibold text-amber-600">Envoi par email en préparation</p>
          <p class="mt-0.5 text-[13px] leading-[1.45] text-gray-700">La transmission du rapport par email et son PDF sont en cours de mise en service. Conservez ce lien.</p>
        </div>
      </div>
      <div v-if="ctx" class="flex flex-col gap-3">
        <NuxtLink :to="`/resultat/${ctx.type}/${ctx.token}`" class="btn btn-primary h-[52px] text-base"><UiIcon name="file-document-outline" :size="18" />Consulter mon rapport</NuxtLink>
        <NuxtLink :to="`/partager/${ctx.type}/${ctx.token}`" class="btn btn-outline h-[52px] text-base"><UiIcon name="share-variant-outline" :size="18" />Partager mon résultat</NuxtLink>
      </div>
    </div>

    <section v-if="!(type === 'dirigeant' && autre.termine)" class="px-5 pt-6 pb-7 md:mx-auto md:w-full md:max-w-[520px] md:px-0 lg:max-w-none lg:px-0 lg:pt-0 lg:pb-[72px]">
      <div class="wrap lg:!px-6">
        <div class="rounded-2xl bg-navy-600 px-5 py-[22px] lg:flex lg:items-center lg:justify-between lg:gap-12 lg:rounded-[14px] lg:px-10 lg:py-9">
          <div>
            <p class="eyebrow mb-2 text-orange-300 lg:mb-2.5">Deuxième diagnostic</p>
            <p class="mb-2 text-[19px] leading-[1.3] font-semibold text-white lg:mb-2.5 lg:text-[28px] lg:leading-[1.2] lg:tracking-[-0.02em]">{{ second.titre }}</p>
            <p class="mb-[18px] text-sm leading-[1.55] text-navy-200 lg:mb-0 lg:max-w-[640px] lg:text-base lg:leading-[1.6]">{{ second.texte }}</p>
          </div>
          <NuxtLink :to="`/diagnostic/${autreType}/introduction`" class="btn btn-white h-12 w-full text-[15px] lg:h-14 lg:w-auto lg:shrink-0 lg:px-7 lg:text-base">Commencer le second diagnostic</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
