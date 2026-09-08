<script setup lang="ts">
import type { DiagType } from '~/composables/useParticipation'

const route = useRoute()
const type = route.params.type as DiagType
const part = useParticipation(type)
const slow = ref(false)
const error = ref<string | null>(null)

onMounted(async () => {
  part.load()
  if (!part.token.value) return navigateTo(`/diagnostic/${type}/introduction`)
  const t = setTimeout(() => (slow.value = true), 10_000)
  try {
    await part.complete()
    const token = part.token.value
    await navigateTo(`/resultat/${type}/${token}`, { replace: true })
  } catch (e: any) {
    const code = e?.data?.data?.code ?? e?.data?.code
    if (code === 'INCOMPLETE_PARTICIPATION') return navigateTo(`/diagnostic/${type}/question/1`)
    error.value = 'Le calcul a échoué. Réessayez dans un instant.'
  } finally {
    clearTimeout(t)
  }
})
</script>

<template>
  <section class="mx-auto max-w-md px-4 py-20 text-center">
    <template v-if="!error">
      <div class="mx-auto h-12 w-12 animate-pulse rounded-full bg-orange-200 motion-reduce:animate-none" aria-hidden="true" />
      <h1 class="mt-6 text-xl font-semibold text-navy-800">Analyse de vos réponses…</h1>
      <p class="mt-2 text-gray-600">Nous préparons votre résultat.</p>
      <p v-if="slow" class="mt-4 text-sm text-gray-500">Cela prend un peu plus de temps que prévu. Merci de patienter.</p>
    </template>
    <template v-else>
      <p class="text-red-600">{{ error }}</p>
      <button type="button" class="mt-4 min-h-12 rounded-xl bg-orange-500 px-6 font-semibold text-white" @click="reloadNuxtApp()">Réessayer</button>
    </template>
  </section>
</template>
