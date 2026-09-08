<script setup lang="ts">
// A03 — liste des prospects (docs/maquette/frames/admin-1440-A03.html) : recherche, filtres
// serveur, tableau à sept colonnes, pagination. États A08 : liste vide, aucun résultat, erreur.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Prospects' })
useSeoMeta({ title: 'Prospects — Administration Radar by FeexPay', robots: 'noindex' })

const { me } = useAdmin()
const route = useRoute()
const router = useRouter()

const filtres = reactive({
  q: String(route.query.q ?? ''),
  gravite: String(route.query.gravite ?? ''),
  deux: String(route.query.deux ?? ''),
  profil: String(route.query.profil ?? ''),
  pilotage: String(route.query.pilotage ?? ''),
  rayonnement: String(route.query.rayonnement ?? ''),
  theme: String(route.query.theme ?? ''),
  secteur: String(route.query.secteur ?? ''),
  source: String(route.query.source ?? ''),
})
const page = ref(Number(route.query.page ?? 1) || 1)
const taille = 20
const query = computed(() => {
  const q: Record<string, string | number> = { page: page.value, taille }
  for (const [k, v] of Object.entries(filtres)) if (v) q[k] = v
  return q
})
watch(query, (q) => router.replace({ query: q as any }), { deep: true })
watch(
  () => ({ ...filtres }),
  () => (page.value = 1),
  { deep: true },
)

const { data, error, pending, refresh } = await useFetch<any>('/api/admin/prospects', { query, headers: useRequestHeaders(['cookie']) })
const { data: leviersData } = await useFetch<any>('/api/admin/leviers', { headers: useRequestHeaders(['cookie']) })
const themes = computed<string[]>(() => leviersData.value?.dimensions ?? [])

const actifs = computed(() => Object.entries(filtres).filter(([k, v]) => v && k !== 'q').length)
const reinitialiser = () => {
  for (const k of Object.keys(filtres)) (filtres as any)[k] = ''
}
const resume = computed(() => {
  if (!data.value) return ''
  const n = data.value.total
  return actifs.value ? `${n} résultat${n > 1 ? 's' : ''} correspondant aux filtres actifs` : `${n} contact${n > 1 ? 's' : ''}`
})
const exportErreur = ref<string | null>(null)
async function exporter() {
  exportErreur.value = null
  try {
    const p = new URLSearchParams(Object.entries(filtres).filter(([, v]) => v) as [string, string][])
    await telecharger(`/api/admin/prospects/export?${p}`)
  } catch (e) {
    exportErreur.value = (e as Error).message
  }
}
const ouvrir = (id: string) => navigateTo(`/admin/prospects/${id}`)
const SELECTS = computed(() => [
  { cle: 'profil', label: 'Profil', options: ARCHETYPES },
  { cle: 'pilotage', label: 'Pilotage', options: NIVEAUX_PILOTAGE },
  { cle: 'rayonnement', label: 'Rayonnement', options: NIVEAUX_RAYONNEMENT },
  { cle: 'theme', label: 'Thème de difficulté', options: themes.value },
  { cle: 'secteur', label: 'Secteur', options: data.value?.secteurs ?? [] },
  { cle: 'source', label: 'Source', options: data.value?.sources ?? [] },
])
</script>

<template>
  <div>
    <AdminHeader titre="Prospects" :sous-titre="data ? `${nombre(data.contacts)} contacts · ${nombre(data.participations)} participations rattachées` : undefined">
      <label class="flex h-10 w-[300px] items-center gap-2 rounded-[10px] border-[1.5px] border-gray-300 bg-white px-3">
        <UiIcon name="magnify" :size="18" class="text-gray-500" />
        <input v-model.lazy="filtres.q" type="search" placeholder="Nom, entreprise, email, téléphone" class="w-full bg-transparent text-sm leading-none text-navy-600 outline-none placeholder:text-gray-400" >
      </label>
      <button v-if="me?.user.export_allowed" type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="exporter"><UiIcon name="download-outline" :size="18" />Exporter la sélection</button>
    </AdminHeader>

    <div class="flex flex-wrap items-center gap-2.5 border-b border-gray-200 bg-white px-8 py-4">
      <span class="mr-1 text-xs leading-none font-semibold tracking-[0.06em] text-gray-500 uppercase">Filtres</span>
      <button type="button" class="inline-flex h-[34px] items-center gap-1.5 rounded-full border-[1.5px] px-3 text-[13px] leading-none" :class="filtres.gravite ? 'border-orange-600 bg-orange-50 font-medium text-navy-600' : 'border-gray-300 text-gray-600'" @click="filtres.gravite = filtres.gravite ? '' : '3'">Gravité : élevée<UiIcon :name="filtres.gravite ? 'close' : 'plus'" :size="15" :class="filtres.gravite ? 'text-orange-700' : ''" /></button>
      <button type="button" class="inline-flex h-[34px] items-center gap-1.5 rounded-full border-[1.5px] px-3 text-[13px] leading-none" :class="filtres.deux ? 'border-orange-600 bg-orange-50 font-medium text-navy-600' : 'border-gray-300 text-gray-600'" @click="filtres.deux = filtres.deux ? '' : '1'">Deux diagnostics<UiIcon :name="filtres.deux ? 'close' : 'plus'" :size="15" :class="filtres.deux ? 'text-orange-700' : ''" /></button>
      <label v-for="s in SELECTS" :key="s.cle" class="relative inline-flex h-[34px] items-center gap-1.5 rounded-full border-[1.5px] pr-2.5 pl-3 text-[13px] leading-none" :class="(filtres as any)[s.cle] ? 'border-orange-600 bg-orange-50 font-medium text-navy-600' : 'border-gray-300 text-gray-600'">
        <select v-model="(filtres as any)[s.cle]" class="appearance-none bg-transparent pr-4 outline-none" :style="{ width: `calc(${((filtres as any)[s.cle] || s.label).length}ch + 18px)` }" :aria-label="s.label">
          <option value="">{{ s.label }}</option>
          <option v-for="o in s.options" :key="o" :value="o">{{ o }}</option>
        </select>
        <UiIcon name="chevron-down" :size="15" class="pointer-events-none absolute right-2.5" />
      </label>
      <button v-if="actifs" type="button" class="ml-auto text-[13px] leading-none font-medium text-navy-600 underline-offset-2 hover:underline" @click="reinitialiser">Réinitialiser les filtres</button>
    </div>

    <div class="px-8 pt-5">
      <p v-if="exportErreur" class="field-error mb-4">{{ exportErreur }}</p>
      <AdminVide v-if="error" erreur titre="Les données n’ont pas pu être chargées" texte="La liste n’a pas répondu. Vos filtres et votre sélection sont conservés.">
        <button type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="refresh()"><UiIcon name="refresh" :size="18" />Réessayer</button>
      </AdminVide>
      <AdminSquelette v-else-if="pending && !data" :lignes="6" />
      <AdminVide v-else-if="data && !data.contacts" titre="Aucun prospect pour le moment" texte="Les contacts apparaissent ici dès qu’un participant demande son analyse complète." icone="account-multiple-outline">
        <a href="/" target="_blank" rel="noopener" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm"><UiIcon name="open-in-new" :size="18" />Voir le lien public</a>
      </AdminVide>
      <AdminVide v-else-if="data && !data.total" titre="Aucun prospect ne correspond" :texte="`${actifs} filtre${actifs > 1 ? 's' : ''} actif${actifs > 1 ? 's' : ''}${filtres.q ? ' et une recherche' : ''}. Élargissez la sélection pour retrouver des contacts.`" icone="filter-variant">
        <button type="button" class="btn btn-navy h-10 rounded-[10px] px-4 text-sm" @click="reinitialiser(); filtres.q = ''">Réinitialiser les filtres</button>
      </AdminVide>
      <template v-else-if="data">
        <div class="mb-3.5 flex items-center justify-between">
          <p class="text-sm leading-[1.3] font-medium text-navy-600">{{ resume }}</p>
          <p class="text-xs leading-[1.3] text-gray-500">Colonnes prioritaires affichées · les colonnes secondaires défilent horizontalement</p>
        </div>
        <div class="card overflow-x-auto" :class="{ 'opacity-60': pending }">
          <div class="min-w-[1080px]">
            <div class="grid grille-prospects border-b border-gray-200 bg-gray-50">
              <span v-for="c in ['Contact', 'Entreprise', 'Profil', 'Pilotage', 'Rayonnement', 'Difficulté prioritaire', 'Rapport']" :key="c" class="px-4 py-[13px] text-xs leading-[1.2] font-semibold text-gray-600">{{ c }}</span>
            </div>
            <button
              v-for="p in data.items"
              :key="p.id"
              type="button"
              class="grid w-full grille-prospects border-b border-gray-100 text-left hover:bg-orange-50 focus-visible:bg-orange-50"
              @click="ouvrir(p.id)"
            >
              <div class="px-4 py-3.5"><p class="text-sm leading-[1.3] font-medium text-navy-600">{{ p.prenom }} {{ p.nom }}</p><p class="mt-0.5 text-xs leading-[1.3] text-gray-500">{{ p.email }}</p></div>
              <div class="px-4 py-3.5"><p class="text-sm leading-[1.3] text-gray-700">{{ p.entreprise ?? '—' }}</p><p class="mt-0.5 text-xs leading-[1.3] text-gray-500">{{ [p.secteur, p.taille].filter(Boolean).join(' · ') }}</p></div>
              <div class="flex items-center px-4 py-3.5">
                <span v-if="p.profil" class="inline-flex items-center gap-1.5 rounded-full bg-navy-50 py-1 pr-2.5 pl-[5px] text-xs leading-[1.4] font-medium text-navy-600"><img :src="`/brand/emb-${slugArchetype(p.profil)}-64.png`" alt="" class="h-[18px] w-[18px]" >{{ p.profil }}</span>
                <span v-else class="text-xs text-gray-400">Non réalisé</span>
              </div>
              <div class="flex items-center px-4 py-3.5"><span class="font-mono text-sm leading-[1.3] font-medium text-navy-600">{{ p.pilotage ?? '—' }}</span></div>
              <div class="flex items-center gap-1.5 px-4 py-3.5">
                <template v-if="p.rayonnement !== null"><span class="font-mono text-sm leading-[1.3] font-medium text-navy-600">{{ p.rayonnement }}</span><span class="text-xs leading-[1.3] text-gray-500">{{ niveauCourt(p.rayonnementNiveau) }}</span></template>
                <span v-else class="text-xs leading-[1.3] text-gray-400">Non applicable</span>
              </div>
              <div class="flex items-center gap-2.5 px-4 py-3.5">
                <template v-if="p.difficulte"><AdminGravite :gravite="p.difficulte.gravite" /><span class="text-[13px] leading-[1.35] text-gray-700">{{ p.difficulte.texte }}</span></template>
                <span v-else class="text-[13px] leading-[1.35] text-gray-400">Aucune difficulté déclarée</span>
              </div>
              <div class="flex items-center px-4 py-3.5">
                <span class="inline-flex items-center gap-[5px] rounded-full px-[9px] py-1 text-xs leading-[1.4] font-medium" :class="RAPPORT_STATUT[p.rapport]!.classe"><UiIcon :name="RAPPORT_STATUT[p.rapport]!.icone" :size="13" />{{ RAPPORT_STATUT[p.rapport]!.label }}</span>
              </div>
            </button>
          </div>
        </div>
        <AdminPagination :page="data.page" :taille="data.taille" :total="data.total" @change="page = $event" />
      </template>
    </div>
  </div>
</template>
