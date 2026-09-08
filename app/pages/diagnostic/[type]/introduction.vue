<script setup lang="ts">
import type { DiagType } from '~/composables/useParticipation'

const route = useRoute()
const type = route.params.type as DiagType
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })

const copy = {
  dirigeant: {
    kicker: 'Profil du dirigeant',
    titre: 'Votre manière de diriger, mise en mots',
    intro:
      'Quatorze situations concrètes, tirées du quotidien d’un dirigeant. Il n’y a pas de bonne réponse : choisissez celle qui ressemble le plus à ce que vous faites réellement.',
    meta: [
      '14 questions, une par écran',
      '4 à 6 minutes',
      'Retour arrière à tout moment',
      'Résultat automatique',
    ],
    portee:
      'Portée indicative : ce diagnostic est un outil de restitution et de prise de recul. Il ne constitue pas un test psychométrique et ne porte aucun jugement sur votre entreprise.',
    listeTitre: 'Les huit profils possibles',
    liste: [
      'Stratège', 'Bâtisseur', 'Gestionnaire', 'Fédérateur',
      'Conquérant', 'Résilient', 'Visionnaire', 'Réformateur',
    ],
    // La maquette nomme ici « Maîtrise financière, Relation client, Délégation ».
    // La matrice V2.1 prime pour les contenus normatifs (notice des maquettes §6) :
    // on reprend ses libellés, ceux-là mêmes qu'affiche la page de résultat.
    liste2Titre: 'Les dimensions évaluées',
    liste2: [
      'Vision', 'Stratégie', 'Exécution', 'Organisation',
      'Influence', 'Audace', 'Adaptabilité', 'Transformation',
    ],
    note: null,
  },
  rayonnement: {
    kicker: 'Rayonnement de l’entreprise',
    titre: 'Ce que votre marché perçoit de votre entreprise',
    intro:
      'Sept questions sur la notoriété, la différenciation, la présence numérique et l’empreinte de votre activité. Répondez d’après ce que vous observez, pas d’après ce que vous visez.',
    meta: [
      '7 questions, une par écran',
      '2 à 4 minutes',
      'Score sur 100, niveau et météo',
      'Débloque votre lecture croisée',
    ],
    portee:
      'Portée indicative : le rayonnement décrit ce qui est observable aujourd’hui. Il ne mesure ni la qualité de votre offre, ni votre potentiel.',
    listeTitre: 'Les cinq niveaux de lecture',
    liste: [
      '80+ · Dominant',
      '65–79 · Challenger fort',
      '45–64 · Acteur silencieux',
      '25–44 · Marque fragile',
      '0–24 · Zone de disparition',
    ],
    liste2Titre: null,
    liste2: [],
    note: 'Le niveau n’est pas un classement entre entreprises. Il situe ce que votre marché peut observer de vous aujourd’hui.',
  },
}[type]

useSeoMeta({ title: `${copy.kicker} — Radar by FeexPay` })

const other = useParticipation(type === 'dirigeant' ? 'rayonnement' : 'dirigeant')
const part = useParticipation(type)
const loading = ref(false)
const error = ref<string | null>(null)
const resumeIndex = ref<number | null>(null)

onMounted(async () => {
  other.load()
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
  } catch (e) {
    error.value = 'Impossible de démarrer. Vérifiez votre connexion et réessayez.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16">
    <p class="type-eyebrow">{{ copy.kicker }}</p>
    <p class="mt-2 type-caption text-gray-500">Étape 2 sur 3 · avant de commencer</p>
    <h1 class="mt-3 type-h1">{{ copy.titre }}</h1>
    <p class="mt-5 text-[17px] leading-[1.6] text-gray-600">{{ copy.intro }}</p>

    <ul class="mt-7 grid gap-2.5 sm:grid-cols-2">
      <li v-for="m in copy.meta" :key="m" class="flex items-start gap-2.5 text-[15px] text-gray-600">
        <UiIcon name="check" :size="18" class="mt-0.5 shrink-0 text-orange-600" />
        <span>{{ m }}</span>
      </li>
    </ul>

    <p
      class="mt-7 border border-navy-100 bg-navy-50 p-4 text-[15px] leading-[1.6] text-navy-700"
      style="border-radius: var(--radius-control)"
    >
      {{ copy.portee }}
    </p>

    <p
      v-if="type === 'rayonnement' && other.token.value"
      class="mt-4 border border-orange-200 bg-orange-50 p-4 text-[15px] leading-[1.6] text-navy-700"
      style="border-radius: var(--radius-control)"
    >
      Vous avez déjà commencé le profil du dirigeant : les deux lectures seront croisées.
    </p>

    <p
      v-if="error"
      class="mt-4 bg-red-100 p-4 type-small text-red-600"
      style="border-radius: var(--radius-control)"
      role="alert"
    >
      {{ error }}
    </p>

    <div class="mt-9 flex flex-col gap-3 sm:flex-row">
      <button
        v-if="resumeIndex"
        type="button"
        :disabled="loading"
        class="inline-flex items-center justify-center bg-orange-600 px-7 font-semibold text-white hover:bg-orange-700 active:bg-orange-800 disabled:opacity-50"
        style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        @click="go(true)"
      >
        Reprendre à la question {{ resumeIndex }}
      </button>
      <button
        type="button"
        :disabled="loading"
        class="inline-flex items-center justify-center px-7 font-semibold"
        :class="
          resumeIndex
            ? 'border border-gray-300 text-gray-700 hover:border-navy-300'
            : 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800'
        "
        style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        @click="go(false)"
      >
        {{ resumeIndex ? 'Recommencer' : 'Répondre à la première question' }}
      </button>
      <NuxtLink
        to="/diagnostic"
        class="inline-flex items-center justify-center border border-gray-300 px-6 text-[15px] font-semibold text-navy-600 hover:border-navy-300"
        style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
      >
        Revenir au choix
      </NuxtLink>
    </div>

    <!-- Listes de contexte : desktop seulement dans la maquette. -->
    <div class="mt-14 hidden border-t border-gray-200 pt-9 md:block">
      <p class="type-eyebrow">{{ copy.listeTitre }}</p>
      <ul class="mt-4 grid grid-cols-2 gap-x-8 gap-y-2.5 lg:grid-cols-4">
        <li v-for="item in copy.liste" :key="item" class="text-[15px] text-gray-600">
          {{ item }}
        </li>
      </ul>

      <template v-if="copy.liste2Titre">
        <p class="mt-9 type-eyebrow">{{ copy.liste2Titre }}</p>
        <ul class="mt-4 grid grid-cols-2 gap-x-8 gap-y-2.5 lg:grid-cols-4">
          <li v-for="item in copy.liste2" :key="item" class="text-[15px] text-gray-600">
            {{ item }}
          </li>
        </ul>
      </template>

      <p v-if="copy.note" class="mt-8 text-[15px] leading-[1.6] text-gray-500">{{ copy.note }}</p>
    </div>
  </section>
</template>
