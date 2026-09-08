<script setup lang="ts">
// A02 — dashboard (docs/maquette/frames/admin-1440-A02.html) : quatre indicateurs comparés à
// la période précédente, entonnoir, archétypes, niveaux, lecture croisée, acquisition.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Dashboard' })
useSeoMeta({ title: 'Dashboard — Administration Radar by FeexPay', robots: 'noindex' })

const { me } = useAdmin()
const jours = ref(18)
const { data, error, pending, refresh } = await useFetch<any>('/api/admin/dashboard', {
  query: { jours },
  headers: useRequestHeaders(['cookie']),
  watch: [jours],
})
const periode = computed(() => {
  if (!data.value) return ''
  const d = new Date(data.value.periode.debut)
  const f = new Date(data.value.periode.fin)
  const j = (x: Date) => (x.getDate() === 1 ? '1er' : String(x.getDate()))
  const mois = (x: Date) => x.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  return `Période du ${j(d)}${d.getMonth() !== f.getMonth() ? ' ' + mois(d) : ''} au ${j(f)} ${mois(f)} · comparée à la période précédente`
})
const delta = (a: number, b: number, unite: 'pct' | 'points') => {
  const d = unite === 'pct' ? (b ? Math.round(((a - b) / b) * 100) : a ? 100 : 0) : a - b
  const signe = d > 0 ? '+' : d < 0 ? '−' : ''
  const texte = unite === 'pct' ? `${signe}${Math.abs(d)} % sur la période` : `${signe}${Math.abs(d)} point${Math.abs(d) > 1 ? 's' : ''}`
  return { texte, classe: d > 0 ? 'text-green-600' : d < 0 ? 'text-red-600' : 'text-gray-500' }
}
const kpis = computed(() => {
  const k = data.value?.kpi
  if (!k) return []
  return [
    { label: 'Participants uniques', valeur: nombre(k.actuel.participants), ...delta(k.actuel.participants, k.precedent.participants, 'pct'), navy: false },
    { label: 'Taux de complétion', valeur: `${k.actuel.completion} %`, ...delta(k.actuel.completion, k.precedent.completion, 'points'), navy: false },
    { label: 'Conversion résultat vers prospect', valeur: `${k.actuel.conversion} %`, ...delta(k.actuel.conversion, k.precedent.conversion, 'points'), navy: false },
    { label: 'Deux diagnostics réalisés', valeur: `${k.actuel.deuxPct} %`, ...delta(k.actuel.deuxPct, k.precedent.deuxPct, 'points'), navy: true },
  ]
})
const maxEntonnoir = computed(() => Math.max(1, ...(data.value?.entonnoir ?? []).map((e: any) => e.n)))
const maxArch = computed(() => Math.max(1, ...(data.value?.archetypes ?? []).map((a: any) => a.n)))
const archMax = computed(() => data.value?.archetypes?.[0]?.code)
const NIVEAU_COULEUR: Record<string, string> = { Dominant: '#112C56', 'Challenger fort': '#23477E', 'Acteur silencieux': '#7E97BF', 'Marque fragile': '#E5762A', 'Zone de disparition': '#B5372A' }
const exportErreur = ref<string | null>(null)
async function exporter() {
  exportErreur.value = null
  try {
    await telecharger(`/api/admin/dashboard/export?jours=${jours.value}`)
  } catch (e) {
    exportErreur.value = (e as Error).message
  }
}
</script>

<template>
  <div>
    <AdminHeader titre="Dashboard" :sous-titre="periode || `Bienvenue ${me?.user.prenom ?? ''}`">
      <label class="flex h-10 items-center gap-2 rounded-[10px] border-[1.5px] border-gray-300 bg-white px-3.5">
        <UiIcon name="calendar-range" :size="18" class="text-gray-500" />
        <select v-model.number="jours" class="appearance-none bg-transparent pr-1 text-sm leading-none font-medium text-navy-600 outline-none" aria-label="Période">
          <option v-for="j in [7, 18, 30, 90]" :key="j" :value="j">{{ j }} derniers jours</option>
        </select>
        <UiIcon name="chevron-down" :size="18" class="-ml-1 text-gray-500" />
      </label>
      <button v-if="me?.user.export_allowed" type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="exporter"><UiIcon name="download-outline" :size="18" />Exporter</button>
    </AdminHeader>

    <div class="px-8 pt-7 pb-9">
      <p v-if="exportErreur" class="field-error mb-4">{{ exportErreur }}</p>
      <AdminVide v-if="error" erreur titre="Les données n’ont pas pu être chargées" texte="Le tableau de bord n’a pas répondu. Vos filtres et votre sélection sont conservés.">
        <button type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="refresh()"><UiIcon name="refresh" :size="18" />Réessayer</button>
      </AdminVide>
      <div v-else-if="pending && !data" class="grid grid-cols-4 gap-4"><AdminSquelette v-for="i in 4" :key="i" :lignes="2" /></div>
      <template v-else-if="data">
        <div class="mb-6 grid grid-cols-4 gap-4">
          <div v-for="k in kpis" :key="k.label" class="rounded-[14px] border p-[22px]" :class="k.navy ? 'border-navy-600 bg-navy-600' : 'border-gray-200 bg-white'">
            <p class="mb-2 text-[13px] leading-[1.3]" :class="k.navy ? 'text-navy-200' : 'text-gray-500'">{{ k.label }}</p>
            <p class="mb-1.5 text-[32px] leading-none font-bold tracking-[-0.02em]" :class="k.navy ? 'text-white' : 'text-navy-600'">{{ k.valeur }}</p>
            <p class="text-[13px] leading-[1.3] font-medium" :class="k.navy ? 'text-orange-300' : k.classe">{{ k.texte }}</p>
          </div>
        </div>

        <div class="mb-4 grid grid-cols-[1.25fr_1fr] gap-4">
          <div class="card p-6">
            <h3 class="mb-5 text-[17px] leading-[1.3] font-semibold text-navy-600">Entonnoir de participation</h3>
            <div class="flex flex-col gap-3.5">
              <div v-for="(e, i) in data.entonnoir" :key="e.label">
                <div class="mb-1.5 flex justify-between"><span class="text-sm leading-[1.2] text-gray-700">{{ e.label }}</span><span class="font-mono text-sm leading-[1.2] font-medium text-navy-600">{{ nombre(e.n) }}</span></div>
                <div class="h-[26px] overflow-hidden rounded-md bg-gray-100"><div class="h-full" :class="i === data.entonnoir.length - 1 ? 'bg-orange-600' : 'bg-navy-500'" :style="{ width: `${Math.max(e.n ? 2 : 0, Math.round((e.n / maxEntonnoir) * 100))}%` }" /></div>
              </div>
            </div>
          </div>
          <div class="card p-6">
            <h3 class="mb-5 text-[17px] leading-[1.3] font-semibold text-navy-600">Répartition par archétype</h3>
            <div class="flex flex-col gap-[11px]">
              <div v-for="a in data.archetypes" :key="a.code" class="flex items-center gap-3">
                <img :src="`/brand/emb-${slugArchetype(a.code)}-64.png`" :alt="`Emblème du profil ${a.code}`" class="h-[22px] w-[22px] shrink-0" >
                <span class="w-[84px] shrink-0 text-[13px] leading-[1.2] text-gray-700">{{ a.code }}</span>
                <div class="h-3.5 flex-1 overflow-hidden rounded bg-gray-100"><div class="h-full" :class="a.code === archMax && a.n ? 'bg-orange-600' : 'bg-navy-500'" :style="{ width: `${Math.round((a.n / maxArch) * 100)}%` }" /></div>
                <span class="w-[34px] text-right font-mono text-[13px] leading-[1.2] font-medium text-navy-600">{{ a.n }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-[1fr_1fr_1.1fr] gap-4">
          <div class="card p-6">
            <h3 class="mb-[18px] text-[17px] leading-[1.3] font-semibold text-navy-600">Niveaux de rayonnement</h3>
            <div class="flex flex-col gap-3">
              <div v-for="n in data.niveaux" :key="n.niveau" class="flex items-center gap-2.5">
                <span class="h-2 w-2 shrink-0 rounded-sm" :style="{ background: NIVEAU_COULEUR[n.niveau] }" />
                <span class="flex-1 text-[13px] leading-[1.3] text-gray-700">{{ n.niveau }}</span>
                <span class="font-mono text-[13px] leading-[1.3] text-navy-600">{{ n.pct }} %</span>
              </div>
            </div>
          </div>
          <div class="card p-6">
            <h3 class="mb-[18px] text-[17px] leading-[1.3] font-semibold text-navy-600">Lecture croisée</h3>
            <div class="flex flex-col gap-3">
              <div v-for="c in data.croisees" :key="c.code" class="flex items-center gap-2.5">
                <span class="w-7 shrink-0 font-mono text-xs leading-[1.3] font-semibold text-navy-500">{{ c.code }}</span>
                <span class="flex-1 text-[13px] leading-[1.3] text-gray-700">{{ c.label }}</span>
                <span class="font-mono text-[13px] leading-[1.3] text-navy-600">{{ c.pct }} %</span>
              </div>
            </div>
            <p class="mt-4 text-xs leading-[1.4] text-gray-500">Calculée uniquement lorsque les deux diagnostics sont rattachés au même contact.</p>
          </div>
          <div class="card p-6">
            <h3 class="mb-[18px] text-[17px] leading-[1.3] font-semibold text-navy-600">Acquisition</h3>
            <div class="grid grid-cols-[1.4fr_1fr_1fr] gap-x-3 gap-y-2">
              <span class="text-xs leading-[1.2] font-semibold text-gray-500">Source</span><span class="text-right text-xs leading-[1.2] font-semibold text-gray-500">Démarrages</span><span class="text-right text-xs leading-[1.2] font-semibold text-gray-500">Conversion</span>
              <template v-for="s in data.acquisition" :key="s.source">
                <span class="text-[13px] leading-[1.4]" :class="s.source === 'non renseigné' ? 'text-gray-400' : 'text-gray-700'">{{ s.source }}</span>
                <span class="text-right font-mono text-[13px] leading-[1.4] text-navy-600">{{ nombre(s.demarrages) }}</span>
                <span class="text-right font-mono text-[13px] leading-[1.4] text-navy-600">{{ s.conversion }} %</span>
              </template>
              <span v-if="!data.acquisition.length" class="col-span-3 text-[13px] text-gray-500">Aucun démarrage sur la période.</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
