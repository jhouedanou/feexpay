<script setup lang="ts">
// P03 / P05 — introduction. Cadres 390 et 1440 (docs/maquette/frames/*-P03.html, *-P05.html).
// Le texte d'introduction est plus court en mobile ; le panneau de droite n'existe qu'en desktop.
import type { DiagType } from '~/composables/useParticipation'

definePageMeta({ layout: 'bare' })

const route = useRoute()
const type = route.params.type as DiagType
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })

const PROFILS = ['Stratège', 'Bâtisseur', 'Gestionnaire', 'Fédérateur', 'Conquérant', 'Résilient', 'Visionnaire', 'Réformateur']
// La maquette nomme ici « Maîtrise financière, Relation client, Délégation ». La matrice
// V2.1 prime pour les contenus normatifs (notice des maquettes §6) : on reprend ses
// dimensions, celles-là mêmes qu'affiche la page de résultat.
const DIMENSIONS = ['Vision', 'Stratégie', 'Exécution', 'Organisation', 'Influence', 'Audace', 'Adaptabilité', 'Transformation']
const NIVEAUX = [
  ['80+', 'Dominant'],
  ['65–79', 'Challenger fort'],
  ['45–64', 'Acteur silencieux'],
  ['25–44', 'Marque fragile'],
  ['0–24', 'Zone de disparition'],
]

type Meta = { icone: string; texte: string; mobile?: string; desktopSeul?: boolean }

const copy = {
  dirigeant: {
    kicker: 'Profil du dirigeant',
    icone: 'compass-outline',
    titre: 'Votre manière de diriger, mise en mots',
    intro: 'Quatorze situations concrètes, tirées du quotidien d’un dirigeant.',
    introDesktop: 'Il n’y a pas de bonne réponse : choisissez celle qui ressemble le plus à ce que vous faites réellement.',
    introMobile: 'Choisissez celle qui ressemble le plus à ce que vous faites réellement.',
    meta: [
      { icone: 'format-list-numbered', texte: '14 questions, une par écran', mobile: '14 questions' },
      { icone: 'clock-outline', texte: '4 à 6 minutes' },
      { icone: 'arrow-u-left-top', texte: 'Retour arrière à tout moment', desktopSeul: true },
      { icone: 'eye-outline', texte: 'Résultat automatique' },
    ] as Meta[],
    portee:
      'Portée indicative : ce diagnostic est un outil de restitution et de prise de recul. Il ne constitue pas un test psychométrique et ne porte aucun jugement sur votre entreprise.',
  },
  rayonnement: {
    kicker: 'Rayonnement de l’entreprise',
    icone: 'broadcast',
    titre: 'Ce que votre marché perçoit de votre entreprise',
    intro: 'Sept questions sur la notoriété, la différenciation, la présence numérique et l’empreinte de votre activité.',
    introDesktop: 'Répondez d’après ce que vous observez, pas d’après ce que vous visez.',
    introMobile: 'Répondez d’après vos réalités.',
    meta: [
      { icone: 'format-list-numbered', texte: '7 questions, une par écran' },
      { icone: 'clock-outline', texte: '2 à 4 minutes' },
      { icone: 'chart-box-outline', texte: 'Score sur 100, niveau et météo' },
      { icone: 'vector-intersection', texte: 'Débloque votre lecture croisée', desktopSeul: true },
    ] as Meta[],
    portee:
      'Portée indicative : le rayonnement décrit ce qui est observable aujourd’hui. Il ne mesure ni la qualité de votre offre, ni votre potentiel.',
  },
}[type]

useSeoMeta({ title: `${copy.kicker} — Radar by FeexPay` })

const { etat: autre, charger: chargerAutre } = useAutreDiagnostic(type)
const part = useParticipation(type)
const loading = ref(false)
const error = ref<string | null>(null)
const resumeIndex = ref<number | null>(null)

onMounted(async () => {
  chargerAutre()
  part.load()
  if (part.token.value) {
    try {
      const s = await part.state()
      if (s.status === 'in_progress' && s.current_index > 1) resumeIndex.value = s.current_index
      if (s.status === 'completed') part.save(null)
    } catch {
      part.save(null)
    }
  }
})

async function go(resume = false) {
  loading.value = true
  error.value = null
  try {
    if (!resume || !part.token.value) await part.start()
    const s = await part.state()
    await navigateTo(`/diagnostic/${type}/question/${resume ? s.current_index : 1}`)
  } catch {
    error.value = 'Impossible de démarrer. Vérifiez votre connexion et réessayez.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <RadarTopBar back="/diagnostic" :label="copy.kicker">
      <template #right>
        <span v-if="autre.termine" class="hidden items-center gap-[7px] text-green-600 lg:inline-flex">
          <UiIcon name="check-circle" :size="17" />
          Diagnostic {{ autre.type === 'dirigeant' ? 'Dirigeant' : 'Rayonnement' }} déjà terminé
        </span>
        <span v-else class="hidden lg:inline">Étape 2 sur 3 · avant de commencer</span>
      </template>
    </RadarTopBar>

    <section class="flex-1 px-5 pt-8 pb-9 md:px-10 md:pt-11 md:pb-12 lg:px-0 lg:pt-[72px] lg:pb-20">
      <div class="wrap flex items-start gap-16 lg:!px-6">
        <div class="min-w-0 flex-1 lg:max-w-[640px]">
          <span class="mb-[22px] inline-flex h-[72px] w-[72px] items-center justify-center rounded-[20px] bg-navy-50 text-navy-600 lg:mb-7 lg:h-20 lg:w-20 lg:rounded-[22px]">
            <UiIcon :name="copy.icone" class="!h-9 !w-9 lg:!h-10 lg:!w-10" />
          </span>
          <h1
            class="mb-3.5 text-[32px] leading-[1.18] font-semibold tracking-[-0.015em] text-navy-600 md:text-[38px] lg:mb-[18px] lg:text-[44px] lg:leading-[1.1] lg:tracking-[-0.025em]"
            style="text-wrap: pretty"
          >
            {{ copy.titre }}
          </h1>
          <p class="mb-6 text-base leading-[1.62] text-gray-600 md:text-[17px] lg:mb-8 lg:text-lg lg:leading-[1.65]" style="text-wrap: pretty">
            {{ copy.intro }} <span class="lg:hidden">{{ copy.introMobile }}</span><span class="hidden lg:inline">{{ copy.introDesktop }}</span>
          </p>

          <div class="mb-6 flex flex-col gap-px overflow-hidden rounded-xl bg-gray-200 md:grid md:grid-cols-2 lg:mb-7 lg:rounded-[14px]">
            <div
              v-for="m in copy.meta"
              :key="m.texte"
              class="flex items-center gap-3 bg-gray-50 p-4 lg:gap-3.5 lg:p-5"
              :class="m.desktopSeul ? 'hidden md:flex' : undefined"
            >
              <UiIcon :name="m.icone" class="shrink-0 text-navy-600 !h-5 !w-5 lg:!h-[22px] lg:!w-[22px]" />
              <span class="flex-1 text-[15px] leading-[1.4] text-gray-700">
                <span v-if="m.mobile" class="md:hidden">{{ m.mobile }}</span>
                <span :class="m.mobile ? 'hidden md:inline' : undefined">{{ m.texte }}</span>
              </span>
            </div>
          </div>

          <div class="mb-6 rounded-xl bg-navy-50 p-4 lg:mb-8 lg:rounded-[14px] lg:px-[22px] lg:py-5">
            <p class="text-sm leading-[1.55] text-gray-700 lg:text-[15px] lg:leading-[1.6]">{{ copy.portee }}</p>
          </div>

          <p v-if="error" class="mb-4 rounded-[10px] bg-red-100 p-4 text-sm text-red-600" role="alert">{{ error }}</p>

          <div class="flex flex-col gap-3 md:flex-row md:gap-3.5">
            <button
              v-if="resumeIndex"
              type="button"
              :disabled="loading"
              class="btn btn-primary h-[52px] text-base md:px-8 lg:h-14"
              @click="go(true)"
            >
              Reprendre à la question {{ resumeIndex }}
            </button>
            <button
              type="button"
              :disabled="loading"
              class="btn h-[52px] text-base lg:h-14"
              :class="resumeIndex ? 'btn-outline md:px-6' : 'btn-primary md:px-8'"
              @click="go(false)"
            >
              {{ resumeIndex ? 'Recommencer' : 'Répondre à la première question' }}
            </button>
            <NuxtLink v-if="type === 'dirigeant'" to="/diagnostic" class="btn btn-outline hidden h-14 px-6 text-base lg:inline-flex">
              Revenir au choix
            </NuxtLink>
          </div>
        </div>

        <!-- Panneau de contexte : desktop seulement. -->
        <aside class="hidden w-[400px] shrink-0 rounded-[14px] border border-gray-200 bg-gray-50 p-7 lg:block">
          <template v-if="type === 'dirigeant'">
            <p class="eyebrow mb-5 text-gray-500">Les huit profils possibles</p>
            <div class="mb-6 grid grid-cols-2 gap-2.5">
              <span v-for="p in PROFILS" :key="p" class="flex items-center gap-2.5 rounded-[10px] border border-gray-200 bg-white px-3 py-[9px]">
                <img :src="`/brand/emb-${slugArchetype(p)}-64.png`" :alt="`Emblème du profil ${p}`" class="h-[26px] w-[26px] shrink-0" width="26" height="26" >
                <span class="text-sm leading-[1.3] font-medium text-navy-600">{{ p }}</span>
              </span>
            </div>
            <div class="mb-5 h-px bg-gray-200" />
            <p class="eyebrow mb-3 text-gray-500">Les dimensions évaluées</p>
            <div class="flex flex-wrap gap-2">
              <span v-for="d in DIMENSIONS" :key="d" class="chip px-3 py-1.5 text-[13px]">{{ d }}</span>
            </div>
          </template>
          <template v-else>
            <p class="eyebrow mb-5 text-gray-500">Les cinq niveaux de lecture</p>
            <div class="mb-6 flex flex-col gap-2.5">
              <div v-for="[plage, nom] in NIVEAUX" :key="nom" class="flex items-center gap-3 rounded-[10px] border border-gray-200 bg-white px-4 py-3.5">
                <span class="w-11 shrink-0 font-mono text-xs leading-none font-semibold text-gray-400">{{ plage }}</span>
                <span class="text-sm leading-[1.3] font-medium text-navy-600">{{ nom }}</span>
              </div>
            </div>
            <div class="mb-5 h-px bg-gray-200" />
            <p class="text-[13px] leading-[1.6] text-gray-500">
              Le niveau n’est pas un classement entre entreprises. Il situe ce que votre marché peut observer de vous aujourd’hui.
            </p>
          </template>
        </aside>
      </div>
    </section>
  </div>
</template>
