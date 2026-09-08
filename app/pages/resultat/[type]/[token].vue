<script setup lang="ts">
// P08 / P09 — structure et libellés repris de docs/maquette/desktop-1440-P0{8,9}.md.
const route = useRoute()
const type = route.params.type as string
const token = route.params.token as string
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })

const { data, error } = await useFetch<any>(`/api/public/results/${token}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Résultat introuvable ou expiré' })

const r = computed(() => data.value?.result)
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** La maquette présente les traits en pastilles séparées. */
const traits = computed<string[]>(() =>
  String(r.value?.archetype?.traits ?? '')
    .split(/,| et /)
    .map((t: string) => t.trim())
    .filter(Boolean)
    .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)),
)

const toRecord = (dims: any[] = []) =>
  Object.fromEntries(dims.map((d) => [d.code ?? d.cle, d.score])) as Record<string, number>

/** P08 : « Dimensions les plus présentes » — les trois premières, pas les huit. */
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
  <section class="mx-auto grid max-w-[1200px] gap-10 px-5 py-12 md:px-8 lg:grid-cols-[1fr_340px]">
    <div class="max-w-[760px]">
      <!-- ------------------------------- P08 ------------------------------- -->
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
            <p class="mt-1 text-[15px] text-gray-600">Inspiré par {{ r.archetype.inspirePar }}</p>
          </div>
        </div>

        <ul class="mt-5 flex flex-wrap gap-2">
          <li
            v-for="t in traits"
            :key="t"
            class="border border-navy-100 bg-navy-50 px-3 py-1.5 text-[13px] font-medium text-navy-700"
            style="border-radius: 999px"
          >
            {{ t }}
          </li>
        </ul>

        <p class="mt-9 type-eyebrow">Dimensions les plus présentes</p>
        <RadarDimensionBars class="mt-4" :dims="dimsTop3" />

        <h2 class="mt-10 type-h3">Ce que ce profil dit de votre pilotage</h2>
        <p class="mt-3 text-[17px] leading-[1.6] text-gray-600">{{ r.archetype.traits }}</p>

        <div class="mt-8 space-y-6">
          <div>
            <p class="type-eyebrow">Vos forces</p>
            <p class="mt-2 type-body text-gray-700">{{ r.archetype.forces }}</p>
          </div>
          <div>
            <p class="type-eyebrow">Point de vigilance</p>
            <p class="mt-2 type-body text-gray-700">{{ r.archetype.risque }}</p>
          </div>
        </div>

        <div
          v-if="r.secondaire"
          class="mt-9 border border-gray-200 p-5"
          style="border-radius: var(--radius-card); box-shadow: var(--shadow-sm)"
        >
          <p class="type-eyebrow">Profil secondaire</p>
          <h3 class="mt-2 type-h3">{{ r.secondaire.code }}</h3>
          <p class="mt-2 text-[15px] leading-[1.6] text-gray-600">
            {{ r.secondaire.traits }} Elle nuance votre profil principal sans le remplacer.
          </p>
        </div>

        <details class="mt-8">
          <summary class="cursor-pointer text-[15px] font-medium text-navy-600">
            Voir les huit dimensions
          </summary>
          <RadarDimensionBars class="mt-4" :dims="dimsToutes" />
        </details>
      </template>

      <!-- ------------------------------- P09 ------------------------------- -->
      <template v-else>
        <p class="type-eyebrow">Rayonnement de votre entreprise</p>
        <div class="mt-4 flex items-end gap-3">
          <span class="type-figure text-6xl leading-none">{{ r.score }}</span>
          <span class="pb-2 text-2xl font-semibold text-gray-400">/ 100</span>
        </div>
        <p class="mt-4 text-[17px] leading-[1.6] text-gray-600">{{ r.lecture }}</p>

        <h1 class="mt-6 type-h3">{{ r.niveauAffiche }}</h1>
        <RadarWeatherCard
          class="mt-4"
          :meteo="r.meteo"
          :niveau="r.niveau"
          :nuance="r.nuance ? 'avec potentiel d’éclaircie' : null"
        />

        <div class="mt-9">
          <p class="type-eyebrow">Votre différenciation déclarée</p>
          <p class="mt-2 type-h3">{{ r.differenciation.valeur }}</p>
          <p class="mt-2 text-[15px] leading-[1.6] text-gray-500">
            Prix, proximité, qualité et avantage distinctif sont quatre natures de
            différenciation, sans hiérarchie entre elles.
          </p>
        </div>

        <h2 class="mt-10 type-h2">Vos cinq dimensions</h2>
        <RadarDimensionBars class="mt-5" :dims="dimsToutes" />
      </template>
    </div>

    <!-- Panneau d'action persistant. Aucun champ ici : la saisie a lieu en P10. -->
    <aside class="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
      <div
        class="border border-gray-200 bg-white p-5"
        style="border-radius: var(--radius-card); box-shadow: var(--shadow-md)"
      >
        <h2 class="type-h3">Votre analyse complète</h2>
        <p class="mt-2 text-[15px] text-gray-600">
          Disponible en ligne et en PDF.
        </p>
        <ul class="mt-4 space-y-2.5">
          <li
            v-for="p in [
              type === 'dirigeant'
                ? 'Le détail de vos huit dimensions de direction'
                : 'Le détail de vos cinq dimensions de rayonnement',
              type === 'dirigeant'
                ? 'Ce que votre profil implique au quotidien'
                : 'Ce qui vous porte et ce qui vous freine',
              'La lecture croisée si vous réalisez les deux diagnostics',
            ]"
            :key="p"
            class="flex items-start gap-2.5 text-[15px] leading-[1.5] text-gray-600"
          >
            <UiIcon name="check" :size="18" class="mt-0.5 shrink-0 text-orange-600" />
            <span>{{ p }}</span>
          </li>
        </ul>
        <NuxtLink
          :to="`/recevoir-mon-analyse/${token}`"
          class="mt-6 inline-flex w-full items-center justify-center bg-orange-600 px-5 text-[15px] font-semibold text-white hover:bg-orange-700 active:bg-orange-800"
          style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
        >
          Recevoir mon analyse complète
        </NuxtLink>
      </div>

      <div
        class="mt-4 border border-navy-100 bg-navy-50 p-5"
        style="border-radius: var(--radius-card)"
      >
        <p class="type-eyebrow">Lecture croisée</p>
        <h3 class="mt-2 type-h3">Il vous manque un diagnostic</h3>
        <p class="mt-2 text-[15px] leading-[1.6] text-gray-600">
          {{
            otherType === 'rayonnement'
              ? 'Le diagnostic Rayonnement prend deux à quatre minutes. Réalisé maintenant, il ajoute la mise en regard de votre pilotage et de ce que perçoit votre marché.'
              : 'Le diagnostic Dirigeant prend quatre à six minutes. Réalisé maintenant, il ajoute la mise en regard de votre pilotage et de ce que perçoit votre marché.'
          }}
        </p>
        <NuxtLink
          :to="`/diagnostic/${otherType}/introduction`"
          class="mt-4 inline-flex w-full items-center justify-center gap-1.5 border border-gray-300 bg-white px-5 text-[15px] font-semibold text-navy-600 hover:border-navy-300"
          style="min-height: var(--control-h); border-radius: var(--radius-control)"
        >
          Faire le second diagnostic
          <UiIcon name="arrow-right" :size="16" />
        </NuxtLink>
      </div>
    </aside>
  </section>
</template>
