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

const toRecord = (dims: any[] = []) =>
  Object.fromEntries(dims.map((d) => [d.code ?? d.cle, d.score])) as Record<string, number>

/**
 * P08 montre « les dimensions les plus présentes » — les trois premières, pas les huit
 * (maquette planches 03 et 05). P09 affiche bien ses cinq dimensions.
 */
const dimsTop3 = computed(() => {
  const all = [...(r.value?.dimensions ?? [])].sort((a: any, b: any) => b.score - a.score)
  return toRecord(all.slice(0, 3))
})
const dimsToutes = computed(() => toRecord(r.value?.dimensions))

const otherType = type === 'dirigeant' ? 'rayonnement' : 'dirigeant'

useSeoMeta({
  title:
    type === 'dirigeant'
      ? () => `Votre profil de dirigeant : ${r.value?.archetype?.code ?? ''}`
      : () => `Rayonnement de votre entreprise : ${r.value?.score ?? ''}/100`,
})
</script>

<template>
  <section class="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 md:px-8 lg:grid-cols-[1fr_320px]">
    <div class="max-w-[760px]">
      <template v-if="type === 'dirigeant'">
        <p class="type-eyebrow">Votre profil de dirigeant</p>
        <div class="mt-4 flex items-center gap-5">
          <img
            :src="`/brand/emb-${slug(r.archetype.code)}-256.png`"
            :alt="`Emblème ${r.archetype.code}`"
            class="h-24 w-24"
            width="96"
            height="96"
          >
          <div>
            <h1 class="type-h1">{{ r.archetype.code }}</h1>
            <p class="mt-1 type-small text-gray-600">Inspiré par {{ r.archetype.inspirePar }}</p>
          </div>
        </div>

        <dl class="mt-8 space-y-5">
          <div>
            <dt class="type-small font-semibold text-navy-700">
              Ce que ce profil dit de votre façon de diriger
            </dt>
            <dd class="mt-1 type-body text-gray-700">{{ r.archetype.traits }}</dd>
          </div>
          <div>
            <dt class="type-small font-semibold text-navy-700">Vos forces</dt>
            <dd class="mt-1 type-body text-gray-700">{{ r.archetype.forces }}</dd>
          </div>
          <div>
            <dt class="type-small font-semibold text-navy-700">Point de vigilance</dt>
            <dd class="mt-1 type-body text-gray-700">{{ r.archetype.risque }}</dd>
          </div>
        </dl>

        <p
          v-if="r.secondaire"
          class="mt-6 border border-navy-100 bg-navy-50 p-4 type-small text-navy-700"
          style="border-radius: var(--radius-control)"
        >
          Profil secondaire : <strong>{{ r.secondaire.code }}</strong>
          (inspiré par {{ r.secondaire.inspirePar }})
        </p>

        <h2 class="mt-10 type-h3">Vos dimensions les plus présentes</h2>
        <RadarDimensionBars class="mt-4" :dims="dimsTop3" />

        <details class="mt-4">
          <summary class="cursor-pointer type-small font-medium text-navy-600">
            Voir les huit dimensions
          </summary>
          <RadarDimensionBars class="mt-4" :dims="dimsToutes" />
        </details>
      </template>

      <template v-else>
        <p class="type-eyebrow">Rayonnement de votre entreprise</p>
        <div class="mt-4 flex items-end gap-3">
          <span class="type-figure text-6xl leading-none">{{ r.score }}</span>
          <span class="pb-1.5 type-body text-gray-500">/ 100</span>
        </div>
        <h1 class="mt-2 type-h3">{{ r.niveauAffiche }}</h1>

        <RadarWeatherCard
          class="mt-5"
          :meteo="r.meteo"
          :niveau="r.niveau"
          :nuance="r.nuance ? 'avec potentiel d’éclaircie' : null"
        />

        <p class="mt-5 type-body text-gray-700">{{ r.lecture }}</p>

        <h2 class="mt-10 type-h3">Vos cinq dimensions</h2>
        <RadarDimensionBars class="mt-4" :dims="dimsToutes" />

        <p class="mt-6 type-small text-gray-600">
          Différenciation déclarée : <strong>{{ r.differenciation.valeur }}</strong>
        </p>
      </template>
    </div>

    <!-- Panneau d'action : persistant au défilement en desktop (maquette planche 05).
         Aucun champ n'est demandé ici — la saisie a lieu une seule fois, en P10. -->
    <aside class="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
      <div
        class="border border-orange-200 bg-orange-50 p-5"
        style="border-radius: var(--radius-card)"
      >
        <p class="font-semibold text-navy-800">Recevez votre analyse complète</p>
        <p class="mt-1.5 type-small text-gray-700">
          Rapport en ligne et PDF, avec la lecture détaillée de votre résultat.
        </p>
        <NuxtLink
          :to="`/recevoir-mon-analyse/${token}`"
          class="mt-4 inline-flex w-full items-center justify-center bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700 active:bg-orange-800"
          style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        >
          Recevoir mon analyse
        </NuxtLink>
      </div>

      <NuxtLink
        :to="`/diagnostic/${otherType}/introduction`"
        class="mt-4 inline-flex w-full items-center justify-center gap-1.5 border border-gray-300 px-6 type-small font-semibold text-navy-700 hover:border-navy-300"
        style="min-height: var(--control-h); border-radius: var(--radius-control)"
      >
        Faire le diagnostic {{ otherType === 'dirigeant' ? 'du dirigeant' : 'de l’entreprise' }}
        <UiIcon name="arrow-right" :size="16" />
      </NuxtLink>
    </aside>
  </section>
</template>
