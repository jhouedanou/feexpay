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
  <section class="mx-auto max-w-[640px] px-4 py-8">
    <RadarProgressBar :current="numero" :total="total" />
    <h1 class="mt-6 text-xl font-semibold leading-snug text-navy-800 md:text-2xl">{{ q!.texte }}</h1>
    <div class="mt-6 space-y-3">
      <RadarAnswerCard
        v-for="o in q!.options"
        :key="o.code"
        :lettre="o.lettre"
        :texte="o.texte"
        :selected="selected === o.code"
        @click="selected = o.code"
      />
    </div>
    <p v-if="error" class="mt-4 text-sm text-red-600">{{ error }}</p>
    <div class="mt-8 flex items-center justify-between">
      <NuxtLink v-if="numero > 1" :to="`/diagnostic/${type}/question/${numero - 1}`" class="min-h-12 px-4 py-3 text-sm font-medium text-gray-600">← Retour</NuxtLink>
      <span v-else />
      <button type="button" :disabled="!selected || saving" class="min-h-12 rounded-xl bg-orange-500 px-6 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40" @click="next">
        {{ numero < total ? 'Suivant' : 'Voir mon résultat' }}
      </button>
    </div>
  </section>
</template>
