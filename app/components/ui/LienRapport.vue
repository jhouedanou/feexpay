<script setup lang="ts">
import { slugArchetype } from '~/composables/useParticipation'

/**
 * Raccourci vers le rapport complet dans l'en-tête du site.
 *
 * Il n'apparaît qu'une fois l'analyse demandée : le jeton de rapport est posé par P10 dans le
 * navigateur. Avant cela, le visiteur n'a rien à consulter et l'en-tête reste nu.
 *
 * Quand le rapport porte le diagnostic Dirigeant, le lien montre l'emblème de l'archétype et
 * son nom : c'est le résultat que le visiteur reconnaît, plus qu'un document. Sans ce
 * diagnostic, l'icône de document et « Mon rapport » restent.
 */
const { etat, resoudre } = useLectureCroisee()

/** Archétype du rapport courant, partagé entre les trois emplacements du composant. */
const archetype = useState<{ token: string; code: string | null } | null>('lien-rapport-archetype', () => null)

async function chargerArchetype(token: string) {
  if (archetype.value?.token === token) return
  try {
    const r = await $fetch<{ dirigeant?: { archetype?: { code?: string } } }>(`/api/public/reports/${token}`)
    archetype.value = { token, code: r.dirigeant?.archetype?.code ?? null }
  } catch {
    archetype.value = { token, code: null }
  }
}

onMounted(async () => {
  if (!etat.value.charge) await resoudre()
  if (etat.value.rapportToken) void chargerArchetype(etat.value.rapportToken)
})
watch(
  () => etat.value.rapportToken,
  (token) => {
    if (token) void chargerArchetype(token)
  },
)

const code = computed(() =>
  archetype.value && archetype.value.token === etat.value.rapportToken ? archetype.value.code : null,
)
const libelle = computed(() => (code.value ? `Mon profil : ${code.value}` : 'Mon rapport complet'))
</script>

<template>
  <NuxtLink
    v-if="etat.rapportToken"
    :to="`/rapport/${etat.rapportToken}`"
    class="inline-flex h-10 items-center gap-2 rounded-full border border-gray-200 py-0 pr-3.5 text-[15px] leading-none font-medium text-navy-600 hover:border-navy-300"
    :class="code ? 'pl-1' : 'pl-3.5'"
    :aria-label="libelle"
    :title="libelle"
  >
    <span v-if="code" class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-gray-200">
      <img :src="`/brand/emb-${slugArchetype(code)}-64.png`" :alt="`Emblème du profil ${code}`" class="h-6 w-6" width="24" height="24" >
    </span>
    <UiIcon v-else name="file-document-outline" :size="19" class="text-orange-600" />
    <span class="hidden xl:inline">{{ code ?? 'Mon rapport' }}</span>
  </NuxtLink>
</template>
