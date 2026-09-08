<script setup lang="ts">
import type { DiagType } from '~/composables/useParticipation'

const route = useRoute()
const type = route.params.type as DiagType
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })

const copy = {
  dirigeant: {
    titre: 'Profil du dirigeant',
    intro:
      '14 situations concrètes. Choisissez la réponse la plus proche de votre façon de faire. Il n’y a pas de bonne réponse.',
    meta: [
      '14 questions, une par écran',
      '4 à 6 minutes',
      'Retour arrière à tout moment',
      'Résultat automatique',
    ],
    // Les libellés des dimensions viennent de la matrice V2.1, qui prime sur la
    // maquette pour les contenus normatifs (notice des maquettes §6).
    listeTitre: 'Les huit profils',
    liste: [
      'Stratège', 'Bâtisseur', 'Gestionnaire', 'Fédérateur',
      'Conquérant', 'Résilient', 'Visionnaire', 'Réformateur',
    ],
  },
  rayonnement: {
    titre: 'Rayonnement de l’entreprise',
    intro:
      '7 questions sur la manière dont votre entreprise est perçue. Répondez selon la situation actuelle.',
    meta: ['7 questions, une par écran', '2 à 4 minutes', 'Score sur 100, niveau et météo'],
    listeTitre: 'Les cinq niveaux',
    liste: [
      'Dominant', 'Challenger fort', 'Acteur silencieux',
      'Marque fragile', 'Zone de disparition',
    ],
  },
}[type]

useSeoMeta({ title: `${copy.titre} — Radar by FeexPay` })

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
  <section class="mx-auto max-w-[760px] px-5 py-12 md:px-8">
    <p class="type-eyebrow">Étape 2 sur 3 · avant de commencer</p>
    <h1 class="mt-2 type-h1">{{ copy.titre }}</h1>
    <p class="mt-4 type-body text-gray-700">{{ copy.intro }}</p>

    <ul class="mt-6 grid gap-2 sm:grid-cols-2">
      <li
        v-for="m in copy.meta"
        :key="m"
        class="flex items-start gap-2 type-small text-gray-600"
      >
        <UiIcon name="check" :size="18" class="mt-0.5 shrink-0 text-orange-600" />
        <span>{{ m }}</span>
      </li>
    </ul>

    <p
      class="mt-6 border border-navy-100 bg-navy-50 p-4 type-small text-navy-700"
      style="border-radius: var(--radius-control)"
    >
      Portée indicative : ce diagnostic éclaire une situation déclarée. Il ne constitue pas un
      test psychométrique.
    </p>

    <p
      v-if="type === 'rayonnement' && other.token.value"
      class="mt-4 border border-navy-100 bg-navy-50 p-4 type-small text-navy-700"
      style="border-radius: var(--radius-control)"
    >
      Vous avez déjà commencé le profil du dirigeant : les deux lectures seront croisées dans
      votre rapport.
    </p>

    <p
      v-if="error"
      class="mt-4 bg-red-100 p-4 type-small text-red-600"
      style="border-radius: var(--radius-control)"
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
        class="inline-flex items-center justify-center px-5 type-small font-medium text-gray-600 hover:text-navy-700"
        style="min-height: var(--control-h)"
      >
        Revenir au choix
      </NuxtLink>
    </div>

    <!-- Listes de contexte : desktop seulement dans la maquette. -->
    <div class="mt-12 hidden border-t border-gray-200 pt-8 md:block">
      <h2 class="type-h3">{{ copy.listeTitre }}</h2>
      <ul class="mt-4 grid grid-cols-2 gap-x-8 gap-y-2 lg:grid-cols-4">
        <li v-for="item in copy.liste" :key="item" class="type-small text-gray-600">{{ item }}</li>
      </ul>
    </div>
  </section>
</template>
