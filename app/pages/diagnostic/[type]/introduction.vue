<script setup lang="ts">
import type { DiagType } from '~/composables/useParticipation'

const route = useRoute()
const type = route.params.type as DiagType
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })

const copy = {
  dirigeant: { titre: 'Profil du dirigeant', intro: '14 situations concrètes. Choisissez la réponse la plus proche de votre façon de faire. Il n’y a pas de bonne réponse.', n: 14 },
  rayonnement: { titre: "Rayonnement de l'entreprise", intro: '7 questions sur la manière dont votre entreprise est perçue. Répondez selon la situation actuelle.', n: 7 },
}[type]

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
  <section class="mx-auto max-w-2xl px-4 py-10">
    <p class="text-xs uppercase tracking-wide text-orange-600">Diagnostic</p>
    <h1 class="mt-1 text-2xl font-semibold text-navy-800 md:text-3xl">{{ copy.titre }}</h1>
    <p class="mt-4 text-gray-700">{{ copy.intro }}</p>
    <ul class="mt-4 space-y-1 text-sm text-gray-600">
      <li>{{ copy.n }} questions, une par écran</li>
      <li>Retour possible sans perdre vos réponses</li>
      <li>Résultat affiché immédiatement, sans formulaire</li>
    </ul>
    <p v-if="type === 'rayonnement' && other.token.value" class="mt-4 rounded-lg bg-navy-50 p-3 text-sm text-navy-700">
      Vous avez déjà commencé le profil du dirigeant : les deux lectures seront croisées dans votre rapport.
    </p>
    <p v-if="error" class="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-600">{{ error }}</p>
    <div class="mt-8 flex flex-wrap gap-3">
      <button v-if="resumeIndex" type="button" :disabled="loading" class="min-h-12 rounded-xl bg-orange-500 px-6 font-semibold text-white disabled:opacity-50" @click="go(true)">
        Reprendre à la question {{ resumeIndex }}
      </button>
      <button type="button" :disabled="loading" class="min-h-12 rounded-xl px-6 font-semibold" :class="resumeIndex ? 'border-2 border-gray-300 text-gray-700' : 'bg-orange-500 text-white'" @click="go(false)">
        {{ resumeIndex ? 'Recommencer' : 'Commencer' }}
      </button>
    </div>
  </section>
</template>
