<script setup lang="ts">
import type { DiagType } from '~/composables/useParticipation'

const route = useRoute()
const type = route.params.type as DiagType
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })
const numero = computed(() => Number(route.params.numero))

const { data } = await useQuestions(type)
const questions = computed(() => data.value?.questions ?? [])
const total = computed(() => questions.value.length)
const q = computed(() => questions.value[numero.value - 1])
if (!q.value) throw createError({ statusCode: 404 })

const part = useParticipation(type)
const answers = useState<Record<string, string>>(`answers-${type}`, () => ({}))
const selected = ref<string | null>(null)
const dejaRepondue = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  part.load()
  if (!part.token.value) return navigateTo(`/diagnostic/${type}/introduction`)
  try {
    const s = await part.state()
    if (s.status !== 'in_progress') return navigateTo(`/diagnostic/${type}/introduction`)
    answers.value = Object.fromEntries(Object.entries(s.answers).map(([qc, l]) => [qc, `${qc}${l}`]))
    // Interdit de sauter une question non répondue
    const first = questions.value.findIndex((qq) => !answers.value[qq.code]) + 1
    if (first > 0 && numero.value > first) return navigateTo(`/diagnostic/${type}/question/${first}`)
    dejaRepondue.value = Boolean(answers.value[q.value!.code])
    selected.value = answers.value[q.value!.code] ?? null
  } catch {
    part.save(null)
    return navigateTo(`/diagnostic/${type}/introduction`)
  }
})
watch(numero, () => (selected.value = answers.value[q.value?.code ?? ''] ?? null))

async function next() {
  if (!selected.value || saving.value) return
  saving.value = true
  error.value = null
  try {
    await part.answer(q.value!.code, selected.value)
    answers.value[q.value!.code] = selected.value
    if (numero.value < total.value) await navigateTo(`/diagnostic/${type}/question/${numero.value + 1}`)
    else await navigateTo(`/diagnostic/${type}/calcul`)
  } catch {
    error.value = 'Réponse non enregistrée. Réessayez.'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="mx-auto grid max-w-[1200px] gap-10 px-5 py-8 md:px-8 lg:grid-cols-[240px_1fr]">
    <!-- Rail de progression, desktop seulement (maquette planche 05).
         La maquette nomme cinq thèmes (« Décision et arbitrage », « Maîtrise financière »…)
         qui n'existent ni dans questions.json ni dans les dimensions de la matrice V2.1 :
         ce découpage éditorial est absent du pack livré. On affiche donc la progression
         réelle plutôt qu'un thème inventé. À demander avec le TDR (PLAN.md §10b, point 6). -->
    <aside class="hidden lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:block lg:self-start">
      <p class="type-eyebrow">Diagnostic en cours</p>
      <h2 class="mt-2 type-h3">
        {{ type === 'dirigeant' ? 'Profil du dirigeant' : 'Rayonnement de l’entreprise' }}
      </h2>
      <p class="mt-5 flex items-baseline gap-2">
        <span class="type-figure text-4xl leading-none">{{ numero }}</span>
        <span class="text-[15px] text-gray-500">sur {{ total }}</span>
      </p>
      <ol class="mt-6 space-y-2">
        <li
          v-for="n in total"
          :key="n"
          class="h-1.5 rounded-full"
          :class="n < numero ? 'bg-orange-600' : n === numero ? 'bg-orange-300' : 'bg-gray-100'"
        />
      </ol>
      <p class="mt-6 text-[13px] leading-[1.6] text-gray-500">
        Vos réponses sont enregistrées à chaque écran. Vous pouvez fermer cette page et
        reprendre plus tard.
      </p>
    </aside>

  <!-- Colonne plafonnée : 640 px en desktop, 600 px en tablette (maquette planche 04). -->
  <section class="mx-auto w-full max-w-[600px] lg:mx-0 lg:max-w-[640px]">
    <RadarProgressBar class="lg:hidden" :current="numero" :total="total" />
    <RadarStepMeta
      class="mt-2"
      :current="numero"
      :total="total"
      :enregistre="Boolean(answers[q!.code])"
    />

    <h1 class="mt-6 type-h2">{{ q!.texte }}</h1>

    <div class="mt-6 space-y-3">
      <RadarAnswerCard
        v-for="o in q!.options"
        :key="o.code"
        :lettre="o.lettre"
        :texte="o.texte"
        :selected="selected === o.code"
        :enregistree="answers[q!.code] === o.code"
        :modification="dejaRepondue && selected === o.code && answers[q!.code] !== o.code"
        @click="selected = o.code"
      />
    </div>

    <p v-if="error" class="mt-4 type-small text-red-600">{{ error }}</p>

    <div class="mt-8 flex items-center justify-between gap-3">
      <NuxtLink
        v-if="numero > 1"
        :to="`/diagnostic/${type}/question/${numero - 1}`"
        class="inline-flex items-center gap-1.5 px-4 type-small font-medium text-gray-600 hover:text-navy-700"
        style="min-height: var(--control-h)"
      >
        <UiIcon name="arrow-left" :size="18" />
        Question précédente
      </NuxtLink>
      <span v-else />
      <button
        type="button"
        :disabled="!selected || saving"
        class="inline-flex flex-1 items-center justify-center bg-orange-600 px-7 font-semibold text-white hover:bg-orange-700 active:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
        style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        @click="next"
      >
        {{ numero < total ? 'Suivant' : 'Voir mon résultat' }}
      </button>
    </div>
    </section>
  </div>
</template>
