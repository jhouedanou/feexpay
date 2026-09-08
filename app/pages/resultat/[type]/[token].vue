<script setup lang="ts">
// P08 / P09 — restitution. Cadres 390, 834 et 1440 (docs/maquette/frames/*-P08.html, *-P09.html).
// Aucun champ ici : la saisie de l'adresse a lieu une seule fois, en P10.
import { METEO_ICONE, slugArchetype, type DiagType } from '~/composables/useParticipation'

definePageMeta({ layout: 'bare' })

const route = useRoute()
const type = route.params.type as DiagType
const token = route.params.token as string
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })

const { data, error } = await useFetch<any>(`/api/public/results/${token}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Résultat introuvable ou expiré' })
const r = computed(() => data.value?.result)

const { etat: autre, charger: chargerAutre } = useAutreDiagnostic(type)
onMounted(chargerAutre)

/** Traits en pastilles séparées : « Analytique, patient, observateur et anticipateur ». */
const traits = computed<string[]>(() =>
  String(r.value?.archetype?.traits ?? '')
    .split(/,| et /)
    .map((t: string) => t.trim())
    .filter(Boolean)
    .map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)),
)
const phrase = (s: string) => (s ? s.replace(/\.?$/, '.') : '')
const minuscule = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '')

const dimsTriees = computed(() =>
  [...(r.value?.dimensions ?? [])].sort((a: any, b: any) => b.score - a.score) as { nom: string; score: number }[],
)
const dimsTop3 = computed(() => dimsTriees.value.slice(0, 3))
const dimsRayonnement = computed(() => (r.value?.dimensions ?? []) as { nom: string; score: number }[])

const meteoIcone = computed(() => METEO_ICONE[r.value?.meteo] ?? 'weather-cloudy')
const autreType: DiagType = type === 'dirigeant' ? 'rayonnement' : 'dirigeant'
const partager = `/partager/${type}/${token}`
const recevoir = `/recevoir-mon-analyse/${token}`

useSeoMeta({
  title: () =>
    type === 'dirigeant'
      ? `Votre profil de dirigeant : ${r.value?.archetype?.code ?? ''} — Radar by FeexPay`
      : `Rayonnement de votre entreprise : ${r.value?.score ?? ''} / 100 — Radar by FeexPay`,
})
</script>

<template>
  <div class="flex flex-1 flex-col">
    <!-- Barre supérieure : desktop seulement. -->
    <header class="hidden border-b border-gray-200 bg-white lg:block">
      <div class="wrap flex h-[76px] items-center justify-between lg:!px-6">
        <NuxtLink to="/" aria-label="Radar by FeexPay, accueil"><img src="/brand/logo-feexpay.svg" alt="FeexPay" class="h-6 w-auto" ></NuxtLink>
        <div class="flex items-center gap-3">
          <NuxtLink :to="partager" class="btn btn-outline h-11 rounded-[10px] px-4 text-sm">
            <UiIcon name="share-variant-outline" :size="17" />
            {{ type === 'dirigeant' ? 'Partager mon profil' : 'Partager mon résultat' }}
          </NuxtLink>
          <NuxtLink :to="recevoir" class="btn btn-primary h-11 rounded-[10px] px-[18px] text-sm">Recevoir mon analyse complète</NuxtLink>
        </div>
      </div>
    </header>

    <!-- ============================== P08 ============================== -->
    <template v-if="type === 'dirigeant'">
      <section class="bg-navy-600 px-5 pt-8 pb-7 md:px-10 md:pt-11 md:pb-10 lg:px-0 lg:py-14">
        <div class="wrap flex items-end justify-between gap-8 lg:gap-12 lg:!px-6">
          <div>
            <div class="mb-[18px] md:mb-5 lg:mb-6">
              <span class="inline-flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white md:h-24 md:w-24 lg:h-[120px] lg:w-[120px]">
                <img :src="`/brand/emb-${slugArchetype(r.archetype.code)}-256.png`" :alt="`Emblème du profil ${r.archetype.code}`" class="block h-[60px] w-[60px] md:h-[76px] md:w-[76px] lg:h-24 lg:w-24" width="96" height="96" >
              </span>
            </div>
            <p class="eyebrow mb-2.5 text-orange-300 md:mb-3 lg:mb-3.5 lg:text-[13px]">Votre profil de dirigeant</p>
            <h1 class="mb-2 text-[40px] leading-[1.1] font-semibold tracking-[-0.02em] text-white md:text-5xl md:leading-[1.06] lg:mb-2.5 lg:text-[64px] lg:leading-[1.02] lg:tracking-[-0.03em]">{{ r.archetype.code }}</h1>
            <p class="mb-5 text-sm leading-[1.5] text-navy-200 md:mb-[22px] md:text-[15px] lg:mb-6 lg:text-base">Inspiré par {{ r.archetype.inspirePar }}</p>
            <ul class="flex flex-wrap gap-2">
              <li v-for="t in traits" :key="t" class="rounded-full border px-3 py-1.5 text-[13px] leading-[1.3] font-medium text-white lg:px-3.5 lg:py-[7px] lg:text-sm" style="border-color: rgba(255, 255, 255, 0.28)">{{ t }}</li>
            </ul>
          </div>
          <!-- Tablette : actions en contour. -->
          <div class="hidden shrink-0 gap-2 md:flex lg:hidden">
            <NuxtLink :to="partager" class="btn btn-ghost h-11 rounded-[10px] px-4 text-sm"><UiIcon name="share-variant-outline" :size="17" />Partager</NuxtLink>
          </div>
          <!-- Desktop : dimensions les plus présentes. -->
          <div class="hidden w-[340px] shrink-0 rounded-[14px] border p-6 lg:block" style="background: rgba(255, 255, 255, 0.08); border-color: rgba(255, 255, 255, 0.18)">
            <p class="eyebrow mb-4 text-orange-300">Dimensions les plus présentes</p>
            <RadarDimensionBars :dims="dimsTop3" sombre :epaisseur="8" :libelle="14" />
          </div>
        </div>
      </section>

      <section class="lg:bg-gray-50 lg:py-14 lg:pb-16">
        <div class="wrap lg:flex lg:items-start lg:gap-8 lg:!px-6">
          <div class="flex flex-col gap-3.5 pt-[26px] pb-2 md:grid md:grid-cols-2 md:gap-5 md:py-8 lg:flex lg:flex-1 lg:gap-5 lg:py-0">
            <div class="card p-5 md:col-span-2 md:p-6 lg:p-7">
              <h2 class="mb-2.5 text-xl leading-[1.3] font-semibold text-navy-600 md:text-[22px] lg:mb-3 lg:text-2xl lg:leading-[1.28]">Ce que ce profil dit de votre pilotage</h2>
              <p class="text-base leading-[1.6] text-gray-700 md:max-w-[640px] md:leading-[1.65] lg:max-w-none lg:text-[17px]" style="text-wrap: pretty">{{ phrase(r.archetype.traits) }}</p>
            </div>
            <div class="grid gap-3.5 md:contents lg:grid lg:grid-cols-2 lg:gap-5">
              <div class="card p-5 md:p-[22px] lg:p-6">
                <div class="mb-2.5 flex items-center gap-2.5 lg:mb-3"><UiIcon name="arm-flex-outline" :size="20" class="text-green-600" /><p class="eyebrow tracking-[0.06em] text-green-600">Vos forces</p></div>
                <p class="text-base leading-[1.55] text-gray-700 lg:leading-[1.6]">{{ phrase(r.archetype.forces) }}</p>
              </div>
              <div class="card p-5 md:p-[22px] lg:p-6">
                <div class="mb-2.5 flex items-center gap-2.5 lg:mb-3"><UiIcon name="alert-outline" :size="20" class="text-amber-600" /><p class="eyebrow tracking-[0.06em] text-amber-600">Point de vigilance</p></div>
                <p class="text-base leading-[1.55] text-gray-700 lg:leading-[1.6]">{{ phrase(r.archetype.risque) }}</p>
              </div>
            </div>
            <div class="card p-5 md:p-[22px] lg:hidden">
              <p class="eyebrow mb-3 tracking-[0.06em] text-gray-500 md:mb-4">Dimensions les plus présentes</p>
              <RadarDimensionBars :dims="dimsTop3" :epaisseur="8" :libelle="14" />
            </div>
            <div v-if="r.secondaire" class="card bg-gray-50 p-5 md:p-[22px] lg:bg-white lg:p-7">
              <p class="eyebrow mb-1.5 tracking-[0.06em] text-gray-500 lg:mb-2">Profil secondaire</p>
              <div class="mb-2 flex items-center gap-3 md:mb-2.5 lg:mb-3 lg:gap-3.5">
                <img :src="`/brand/emb-${slugArchetype(r.secondaire.code)}-64.png`" :alt="`Emblème du profil ${r.secondaire.code}`" class="h-10 w-10 shrink-0 lg:h-12 lg:w-12" width="48" height="48" >
                <p class="text-lg leading-[1.3] font-semibold text-navy-600 md:text-[19px] lg:text-[22px] lg:leading-[1.28]">{{ r.secondaire.code }}</p>
              </div>
              <p class="text-sm leading-[1.55] text-gray-600 lg:max-w-[640px] lg:text-base lg:leading-[1.65]">
                Une seconde tendance nette : {{ minuscule(r.secondaire.forces) }}. Elle nuance votre profil principal sans le remplacer.
              </p>
            </div>
            <div class="rounded-[14px] bg-navy-600 p-5 md:col-span-2 md:p-6 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-7">
              <div>
                <p class="eyebrow mb-2 text-orange-300">{{ autre.termine ? 'Lecture croisée disponible' : 'Lecture croisée' }}</p>
                <p class="mb-2 text-[19px] leading-[1.3] font-semibold text-white md:text-[22px] md:leading-[1.28]">
                  {{ autre.termine ? 'Vos deux diagnostics sont terminés' : 'Il vous manque un diagnostic' }}
                </p>
                <p class="text-[15px] leading-[1.6] text-navy-200 md:max-w-[640px] lg:max-w-[560px]">
                  {{
                    autre.termine
                      ? 'Mis en regard, ils désignent la zone à traiter en premier ; elle figure dans votre analyse complète.'
                      : 'Le diagnostic Rayonnement prend deux à quatre minutes. Réalisé maintenant, il ajoute la mise en regard de votre pilotage et de ce que perçoit votre marché.'
                  }}
                </p>
              </div>
              <NuxtLink v-if="autre.termine" :to="recevoir" class="btn btn-primary mt-4 h-[52px] shrink-0 px-6 text-[15px] lg:mt-0">Voir ma lecture croisée</NuxtLink>
            </div>
          </div>

          <!-- Analyse complète : bande en mobile et tablette, panneau collant en desktop. -->
          <aside class="mt-[18px] border-t border-gray-200 bg-navy-50 px-5 py-[26px] md:flex md:gap-8 md:px-10 md:py-9 lg:sticky lg:top-6 lg:mt-0 lg:block lg:w-[360px] lg:shrink-0 lg:rounded-[14px] lg:border lg:bg-white lg:p-7" style="box-shadow: var(--shadow-sm)">
            <div class="md:flex-1">
              <h2 class="mb-2 text-[22px] leading-[1.3] font-semibold text-navy-600 md:text-2xl md:leading-[1.28] lg:mb-3 lg:text-[22px]">Votre analyse complète</h2>
              <p class="mb-4 text-[15px] leading-[1.6] text-gray-600 md:max-w-[520px] lg:mb-5">Envoyée par email, disponible en ligne et en PDF.</p>
              <ul class="mb-5 flex flex-col gap-2 md:mb-0 lg:mb-6 lg:gap-2.5">
                <li v-for="p in ['Le détail de vos huit dimensions de direction', 'Ce que votre profil implique au quotidien', 'La lecture croisée si vous réalisez aussi le diagnostic Rayonnement']" :key="p" class="flex items-start gap-2.5">
                  <UiIcon name="check" :size="18" class="shrink-0 text-orange-600" />
                  <span class="text-[15px] leading-[1.5] text-gray-700">{{ p }}</span>
                </li>
              </ul>
            </div>
            <div class="flex flex-col gap-2.5 md:w-[300px] md:shrink-0 md:justify-center md:gap-2 lg:w-auto">
              <NuxtLink :to="recevoir" class="btn btn-primary h-[52px] text-base">Recevoir mon analyse complète</NuxtLink>
              <NuxtLink v-if="!autre.termine" :to="`/diagnostic/${autreType}/introduction`" class="btn btn-outline h-[52px] text-base"><UiIcon name="broadcast" :size="18" />Faire le second diagnostic</NuxtLink>
              <NuxtLink :to="partager" class="btn btn-outline h-[52px] text-base"><UiIcon name="share-variant-outline" :size="18" />Partager mon profil</NuxtLink>
            </div>
          </aside>
        </div>
      </section>
    </template>

    <!-- ============================== P09 ============================== -->
    <template v-else>
      <section class="px-5 pt-8 pb-7 md:px-10 md:pt-11 md:pb-10 lg:px-0 lg:pt-16 lg:pb-14" style="background: linear-gradient(180deg, #eef3f9 0%, #ffffff 82%)">
        <div class="wrap lg:flex lg:items-start lg:gap-14 lg:!px-6">
          <div class="min-w-0 lg:flex-1">
            <p class="eyebrow mb-3.5 text-orange-600 lg:mb-[18px] lg:text-[13px]">Rayonnement de votre entreprise</p>
            <div class="mb-1.5 flex items-end gap-2.5 lg:mb-3.5 lg:gap-3">
              <span class="text-[64px] leading-none font-bold tracking-[-0.03em] text-navy-600 lg:text-[86px] lg:leading-[0.9] lg:tracking-[-0.04em]">{{ r.score }}</span>
              <span class="text-xl leading-[1.6] text-gray-500 lg:text-2xl lg:leading-[1.8]">/ 100</span>
            </div>
            <div class="mb-[18px] h-2.5 overflow-hidden rounded-full bg-gray-100 lg:mb-7 lg:h-3 lg:max-w-[560px]" role="img" :aria-label="`Score ${r.score} sur 100`">
              <div class="h-full rounded-full bg-orange-600" :style="{ width: r.score + '%' }" />
            </div>
            <p class="hidden text-lg leading-[1.65] text-gray-700 lg:block lg:max-w-[560px]" style="text-wrap: pretty">{{ r.lecture }}</p>
            <!-- Mobile et tablette : météo dans le hero. -->
            <div class="card flex items-center gap-3.5 p-4 lg:hidden">
              <UiIcon :name="meteoIcone" :size="40" class="shrink-0 text-navy-600" />
              <div>
                <p class="text-[19px] leading-[1.25] font-semibold text-navy-600">{{ r.niveauAffiche }}</p>
                <p class="mt-[3px] text-sm leading-[1.4] text-gray-600">Météo : {{ minuscule(r.meteo) }}</p>
              </div>
            </div>
          </div>
          <div class="card hidden w-[400px] shrink-0 p-7 lg:block" style="box-shadow: var(--shadow-sm)">
            <div class="mb-[22px] flex items-center gap-[18px] border-b border-gray-100 pb-[22px]">
              <UiIcon :name="meteoIcone" :size="52" class="shrink-0 text-navy-600" />
              <div>
                <p class="text-2xl leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">{{ r.niveauAffiche }}</p>
                <p class="mt-1 text-[15px] leading-[1.4] text-gray-600">Météo : {{ minuscule(r.meteo) }}</p>
              </div>
            </div>
            <p class="eyebrow mb-2 tracking-[0.06em] text-gray-500">Votre différenciation déclarée</p>
            <p class="mb-2 text-[19px] leading-[1.3] font-semibold text-navy-600">{{ r.differenciation.valeur }}</p>
            <p class="text-sm leading-[1.6] text-gray-600">Prix, proximité, qualité et avantage distinctif sont quatre natures de différenciation, sans hiérarchie entre elles.</p>
          </div>
        </div>
      </section>

      <section class="lg:border-t lg:border-gray-200 lg:bg-gray-50 lg:py-14 lg:pb-16">
        <div class="wrap lg:!px-6">
          <div class="pt-6 pb-2 md:pt-8 lg:py-0">
            <p class="mb-5 text-base leading-[1.6] text-gray-700 lg:hidden" style="text-wrap: pretty">{{ r.lecture }}</p>
            <h2 class="mb-7 hidden text-[30px] leading-[1.2] font-semibold tracking-[-0.02em] text-navy-600 lg:block">Vos cinq dimensions</h2>
            <div class="flex flex-col gap-3.5 md:grid md:grid-cols-2 md:gap-5 lg:mb-5">
              <div class="card p-5 lg:p-[26px]">
                <p class="eyebrow mb-3.5 tracking-[0.06em] text-gray-500 lg:hidden">Vos cinq dimensions</p>
                <RadarDimensionBars :dims="dimsRayonnement" surligne="min" class="lg:hidden" :epaisseur="8" :libelle="14" />
                <RadarDimensionBars :dims="dimsRayonnement" surligne="min" class="hidden lg:flex" :epaisseur="10" :libelle="16" />
              </div>
              <div class="flex flex-col gap-3.5 md:gap-5">
                <div class="card bg-gray-50 p-5 lg:hidden">
                  <p class="eyebrow mb-1.5 tracking-[0.06em] text-gray-500">Votre différenciation</p>
                  <p class="mb-1.5 text-[17px] leading-[1.3] font-semibold text-navy-600">{{ r.differenciation.valeur }}</p>
                  <p class="text-sm leading-[1.55] text-gray-600">Prix, proximité, qualité et avantage distinctif sont quatre natures de différenciation, sans hiérarchie entre elles.</p>
                </div>
                <div class="card hidden p-[26px] lg:block">
                  <h3 class="mb-3 text-[22px] leading-[1.28] font-semibold text-navy-600">Votre analyse complète</h3>
                  <p class="mb-5 text-[15px] leading-[1.6] text-gray-600">Envoyée par email, disponible en ligne et en PDF.</p>
                  <ul class="flex flex-col gap-2.5">
                    <li v-for="p in ['Le détail de vos cinq dimensions de rayonnement', 'Ce qui vous porte et ce qui vous freine', 'La lecture croisée si vous réalisez aussi le diagnostic Dirigeant']" :key="p" class="flex items-start gap-2.5">
                      <UiIcon name="check" :size="18" class="shrink-0 text-orange-600" />
                      <span class="text-[15px] leading-[1.5] text-gray-700">{{ p }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div class="mt-3.5 rounded-[14px] bg-navy-600 p-5 md:mt-5 md:p-6 lg:mt-0 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:p-7">
              <div>
                <p class="eyebrow mb-2 text-orange-300">{{ autre.termine ? 'Lecture croisée disponible' : 'Lecture croisée' }}</p>
                <p class="mb-2 text-[19px] leading-[1.3] font-semibold text-white md:text-[22px] md:leading-[1.28]">
                  {{ autre.termine ? 'Vos deux diagnostics sont terminés' : 'Il vous manque un diagnostic' }}
                </p>
                <p class="text-[15px] leading-[1.6] text-navy-200 lg:max-w-[640px]">
                  {{
                    autre.termine
                      ? 'Mis en regard, ils désignent la zone à traiter en premier ; elle figure dans votre analyse complète.'
                      : 'Le diagnostic Dirigeant prend quatre à six minutes. Réalisé maintenant, il ajoute la mise en regard de votre pilotage et de ce que perçoit votre marché.'
                  }}
                </p>
              </div>
              <NuxtLink v-if="autre.termine" :to="recevoir" class="btn btn-primary mt-4 h-[52px] shrink-0 px-6 text-[15px] lg:mt-0">Voir ma lecture croisée</NuxtLink>
              <NuxtLink v-else :to="`/diagnostic/${autreType}/introduction`" class="btn btn-white mt-4 hidden h-[52px] shrink-0 px-6 text-[15px] lg:mt-0 lg:inline-flex"><UiIcon name="compass-outline" :size="18" />Faire le second diagnostic</NuxtLink>
            </div>
          </div>
        </div>
        <div class="mt-[18px] border-t border-gray-200 bg-navy-50 px-5 py-[26px] md:px-10 lg:hidden">
          <div class="flex flex-col gap-2.5 md:mx-auto md:max-w-[520px]">
            <NuxtLink :to="recevoir" class="btn btn-primary h-[52px] text-base">Recevoir mon analyse complète</NuxtLink>
            <NuxtLink :to="partager" class="btn btn-outline h-[52px] text-base"><UiIcon name="share-variant-outline" :size="18" />Partager mon résultat</NuxtLink>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
