<script setup lang="ts">
const route = useRoute()
const type = route.params.type as string
const token = route.params.token as string
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })

const { data, error } = await useFetch<any>(`/api/public/results/${token}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Résultat introuvable ou expiré' })

// L'API renvoie la projection publique du moteur (packages/scoring/src/public.ts).
const r = computed(() => data.value?.result)

const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** DimensionBars attend un Record<code, score> ; la projection donne un tableau. */
const dims = computed<Record<string, number>>(() =>
  Object.fromEntries((r.value?.dimensions ?? []).map((d: any) => [d.code ?? d.cle, d.score])),
)

const otherType = type === 'dirigeant' ? 'rayonnement' : 'dirigeant'

useSeoMeta({
  title:
    type === 'dirigeant'
      ? () => `Votre profil de dirigeant : ${r.value?.archetype?.code ?? ''}`
      : () => `Rayonnement de votre entreprise : ${r.value?.score ?? ''}/100`,
})
</script>

<template>
  <section class="mx-auto max-w-2xl px-4 py-10">
    <template v-if="type === 'dirigeant'">
      <p class="text-xs uppercase tracking-wide text-orange-600">Votre profil de dirigeant</p>
      <div class="mt-3 flex items-center gap-4">
        <img
          :src="`/brand/emb-${slug(r.archetype.code)}-256.png`"
          :alt="`Emblème ${r.archetype.code}`"
          class="h-24 w-24"
          width="96"
          height="96"
        >
        <div>
          <h1 class="text-3xl font-semibold text-navy-800">{{ r.archetype.code }}</h1>
          <p class="text-sm text-gray-600">Inspiré par {{ r.archetype.inspirePar }}</p>
        </div>
      </div>
      <dl class="mt-6 space-y-4">
        <div>
          <dt class="text-sm font-semibold text-navy-700">Traits dominants</dt>
          <dd class="text-gray-700">{{ r.archetype.traits }}</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-navy-700">Forces</dt>
          <dd class="text-gray-700">{{ r.archetype.forces }}</dd>
        </div>
        <div>
          <dt class="text-sm font-semibold text-navy-700">Point de vigilance</dt>
          <dd class="text-gray-700">{{ r.archetype.risque }}</dd>
        </div>
      </dl>
      <p v-if="r.secondaire" class="mt-6 rounded-lg bg-navy-50 p-3 text-sm text-navy-700">
        Profil secondaire : <strong>{{ r.secondaire.code }}</strong>
        (inspiré par {{ r.secondaire.inspirePar }})
      </p>
      <h2 class="mt-8 text-lg font-semibold text-navy-800">Vos 8 dimensions</h2>
      <RadarDimensionBars class="mt-4" :dims="dims" />
    </template>

    <template v-else>
      <p class="text-xs uppercase tracking-wide text-orange-600">Rayonnement de votre entreprise</p>
      <div class="mt-3 flex items-end gap-3">
        <span class="text-6xl font-semibold text-navy-800">{{ r.score }}</span>
        <span class="pb-2 text-gray-500">/ 100</span>
      </div>
      <p class="text-lg font-medium text-navy-700">{{ r.niveauAffiche }}</p>
      <RadarWeatherCard
        class="mt-4"
        :meteo="r.meteo"
        :niveau="r.niveau"
        :nuance="r.nuance ? 'avec potentiel d\'éclaircie' : null"
      />
      <p class="mt-4 text-gray-700">{{ r.lecture }}</p>
      <h2 class="mt-8 text-lg font-semibold text-navy-800">Vos 5 dimensions</h2>
      <RadarDimensionBars class="mt-4" :dims="dims" />
      <p class="mt-6 text-sm text-gray-600">
        Différenciation déclarée : <strong>{{ r.differenciation.valeur }}</strong>
      </p>
    </template>

    <div class="mt-10 space-y-3 rounded-2xl border border-orange-200 bg-orange-50 p-5">
      <p class="font-semibold text-navy-800">Recevez votre analyse complète</p>
      <p class="text-sm text-gray-700">
        Rapport en ligne et PDF, avec la lecture détaillée de votre résultat.
      </p>
      <NuxtLink
        :to="`/recevoir-mon-analyse/${token}`"
        class="inline-flex min-h-12 items-center rounded-xl bg-orange-500 px-6 font-semibold text-white"
      >
        Recevoir mon analyse
      </NuxtLink>
    </div>
    <NuxtLink
      :to="`/diagnostic/${otherType}/introduction`"
      class="mt-6 inline-block text-sm font-medium text-navy-600 underline"
    >
      Faire le diagnostic {{ otherType === 'dirigeant' ? 'du dirigeant' : "de l'entreprise" }} →
    </NuxtLink>
  </section>
</template>
