<script setup lang="ts">
// A06 — détail d'une participation (docs/maquette/frames/admin-1440-A06.html) : réponses dans
// l'ordre du parcours, résultat calculé, contexte technique.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Participations' })
const route = useRoute()
const { me } = useAdmin()
const { data: p, error, pending, refresh } = await useFetch<any>(`/api/admin/participations/${route.params.id}`, { headers: useRequestHeaders(['cookie']) })
useSeoMeta({ title: () => `${p.value?.identifiant ?? 'Participation'} — Administration Radar by FeexPay`, robots: 'noindex' })
const TYPE: Record<string, string> = { dirigeant: 'Profil du dirigeant', rayonnement: 'Rayonnement de l’entreprise' }
const STATUT: Record<string, [string, string]> = { completed: ['Terminée', 'bg-green-100 text-green-600'], in_progress: ['En cours', 'bg-amber-100 text-amber-600'], abandoned: ['Abandonnée', 'bg-gray-100 text-gray-500'] }
const meta = computed(() => {
  if (!p.value) return ''
  const parts = [`Commencée le ${dateHeure(p.value.startedAt)}`]
  if (p.value.completedAt) parts.push(`terminée à ${heure(p.value.completedAt)}`, `durée ${duree(p.value.dureeS)}`)
  parts.push(`moteur de scoring ${p.value.version}`)
  return parts.join(' · ')
})
const theme = (code: string) => THEMES[p.value.type as 'dirigeant' | 'rayonnement'].find((t) => t.questions.includes(code))?.nom ?? ''
const tout = ref(false)
const reponses = computed(() => {
  const r = p.value?.reponses ?? []
  if (tout.value || r.length <= 6) return r
  // Les réponses qui déclenchent un constat restent visibles, complétées par les premières.
  const vis = new Set(r.filter((x: any) => x.declenche).map((x: any) => x.code))
  for (const x of r) {
    if (vis.size >= 6) break
    vis.add(x.code)
  }
  return r.filter((x: any) => vis.has(x.code))
})
const restantes = computed(() => (p.value?.reponses.length ?? 0) - reponses.value.length)
const repondu = computed(() => p.value?.reponses.filter((r: any) => r.reponse).length ?? 0)
const affinites = computed(() => (p.value?.resultat?.affinities ?? []).slice(0, 4))
const exportErreur = ref<string | null>(null)
async function exporter() {
  exportErreur.value = null
  try {
    await telecharger(`/api/admin/participations/${p.value.id}/export`)
  } catch (e) {
    exportErreur.value = (e as Error).message
  }
}
const numero = (code: string) => code.replace(/\D/g, '').padStart(2, '0')
</script>

<template>
  <div>
    <div v-if="p" class="border-b border-gray-200 bg-white px-8 py-5">
      <div class="mb-2 flex items-center gap-2 text-[13px] leading-none">
        <NuxtLink to="/admin/participations" class="text-gray-500 hover:text-navy-600">Participations</NuxtLink><span class="text-gray-300">/</span><span class="font-mono font-medium text-navy-600">{{ p.identifiant }}</span>
      </div>
      <div class="flex items-start justify-between gap-6">
        <div>
          <div class="mb-1 flex items-center gap-2.5">
            <h1 class="text-2xl leading-[1.2] font-semibold text-navy-600">{{ TYPE[p.type] }}<template v-if="p.contact"> · {{ p.contact.prenom }} {{ p.contact.nom }}</template><template v-else> · participant anonyme</template></h1>
            <span class="rounded-full px-[9px] py-1 text-xs leading-[1.4] font-medium" :class="STATUT[p.status]?.[1]">{{ STATUT[p.status]?.[0] }}</span>
          </div>
          <p class="text-[13px] leading-[1.3] text-gray-500">{{ meta }}</p>
        </div>
        <div class="flex shrink-0 gap-2.5">
          <NuxtLink v-if="p.contact" :to="`/admin/prospects/${p.contact.id}`" class="btn btn-outline h-10 gap-2 rounded-[10px] px-3.5 text-sm"><UiIcon name="account-outline" :size="18" class="text-gray-500" />Ouvrir la fiche prospect</NuxtLink>
          <button v-if="me?.user.export_allowed" type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="exporter"><UiIcon name="code-json" :size="18" />Exporter les réponses</button>
        </div>
      </div>
    </div>
    <div class="px-8 pt-7 pb-9">
      <p v-if="exportErreur" class="field-error mb-4">{{ exportErreur }}</p>
      <AdminVide v-if="error && (error as any).statusCode === 404" titre="Participation introuvable" texte="Cet identifiant ne correspond à aucune participation." icone="clipboard-list-outline">
        <NuxtLink to="/admin/participations" class="btn btn-navy h-10 rounded-[10px] px-4 text-sm">Retour aux participations</NuxtLink>
      </AdminVide>
      <AdminVide v-else-if="error" erreur titre="Les données n’ont pas pu être chargées" texte="La participation n’a pas répondu. Vos filtres et votre sélection sont conservés.">
        <button type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="refresh()"><UiIcon name="refresh" :size="18" />Réessayer</button>
      </AdminVide>
      <AdminSquelette v-else-if="pending && !p" :lignes="8" />
      <div v-else-if="p" class="flex items-start gap-5">
        <div class="card min-w-0 flex-1 overflow-hidden">
          <div class="flex items-center justify-between border-b border-gray-100 px-6 py-[18px]">
            <h3 class="text-[17px] leading-[1.3] font-semibold text-navy-600">Réponses, dans l’ordre du parcours</h3>
            <span class="text-[13px] text-gray-500">{{ p.reponses.length }} questions · {{ repondu }} réponse{{ repondu > 1 ? 's' : '' }}</span>
          </div>
          <div v-for="r in reponses" :key="r.code" class="border-b border-gray-100 px-6 py-5" :class="{ 'bg-orange-50': r.declenche }">
            <div class="mb-2 flex items-center gap-2.5">
              <span class="font-mono text-[11px] leading-none font-semibold" :class="r.declenche ? 'text-orange-700' : 'text-gray-400'">{{ r.code[0] }}{{ numero(r.code) }}</span>
              <span class="rounded-full border px-2 py-[3px] text-[11px] leading-[1.3] font-medium" :class="r.declenche ? 'border-orange-200 bg-white text-orange-700' : 'border-gray-200 bg-gray-50 text-gray-600'">{{ theme(r.code) }}</span>
              <span v-if="r.declenche" class="rounded-full bg-red-100 px-2 py-[3px] text-[11px] leading-[1.3] font-semibold text-red-600">Déclenche le constat {{ r.constat.code }}</span>
              <span v-if="r.revisedAt" class="ml-auto text-[11px] text-gray-400">réponse modifiée</span>
            </div>
            <p class="mb-2 text-[15px] leading-[1.45] font-medium text-navy-600">{{ r.question }}</p>
            <p v-if="r.reponse" class="text-[15px] leading-[1.55] text-gray-700">{{ r.reponse }}</p>
            <p v-else class="text-[15px] leading-[1.55] text-gray-400 italic">Sans réponse</p>
            <p v-if="r.technique" class="mt-2 font-mono text-xs leading-[1.3]" :class="r.declenche ? 'text-orange-700' : 'text-gray-400'">{{ r.technique }}</p>
          </div>
          <button v-if="restantes > 0" type="button" class="flex w-full items-center justify-center gap-2 px-6 py-[18px] text-sm leading-none font-medium text-orange-600 hover:bg-orange-50" @click="tout = true">Afficher les {{ restantes }} réponses restantes<UiIcon name="chevron-down" :size="18" /></button>
        </div>

        <div class="flex w-[360px] shrink-0 flex-col gap-5">
          <div class="card p-6">
            <p class="mb-4 text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Résultat calculé</p>
            <template v-if="p.resultat?.type === 'dirigeant'">
              <div class="mb-1.5 flex items-center gap-3"><img :src="`/brand/emb-${slugArchetype(p.resultat.archetype.code)}-64.png`" :alt="`Emblème du profil ${p.resultat.archetype.code}`" class="h-10 w-10 shrink-0" ><p class="text-2xl leading-[1.2] font-semibold text-navy-600">{{ p.resultat.archetype.code }}</p></div>
              <p class="mb-[18px] text-[13px] leading-[1.4] text-gray-500">{{ p.resultat.phrase }}</p>
              <div class="flex flex-col gap-[9px]">
                <div v-for="(a, i) in affinites" :key="a.code" class="flex items-center gap-2.5">
                  <span class="w-[92px] shrink-0 text-[13px] leading-[1.2]" :class="i === 0 ? 'font-medium text-navy-600' : 'text-gray-700'">{{ a.code }}</span>
                  <div class="h-3 flex-1 overflow-hidden rounded bg-gray-100"><div class="h-full" :class="i === 0 ? 'bg-orange-600' : 'bg-navy-500'" :style="{ width: `${Math.round(a.value)}%` }" /></div>
                  <span class="w-6 text-right font-mono text-[13px] leading-[1.2]" :class="i === 0 ? 'font-semibold text-orange-600' : 'font-medium text-navy-600'">{{ Math.round(a.value) }}</span>
                </div>
              </div>
              <p class="mt-4 border-t border-gray-100 pt-3 text-xs leading-[1.4] text-gray-500">Pilotage {{ Math.round(p.resultat.pilotage.score) }} · {{ p.resultat.pilotage.niveau }}</p>
            </template>
            <template v-else-if="p.resultat?.type === 'rayonnement'">
              <div class="mb-1.5 flex items-baseline gap-1.5"><span class="text-2xl leading-[1.2] font-semibold text-navy-600">{{ p.resultat.public.score }}</span><span class="text-sm text-gray-500">/ 100</span></div>
              <p class="mb-[18px] text-[13px] leading-[1.4] text-gray-500">{{ p.resultat.public.niveauAffiche }} · météo « {{ p.resultat.public.meteo.toLowerCase() }} »</p>
              <div class="flex flex-col gap-[9px]">
                <div v-for="d in p.resultat.public.dimensions" :key="d.cle" class="flex items-center gap-2.5">
                  <span class="w-[92px] shrink-0 truncate text-[13px] leading-[1.2] text-gray-700">{{ d.nom }}</span>
                  <div class="h-3 flex-1 overflow-hidden rounded bg-gray-100"><div class="h-full bg-navy-500" :style="{ width: `${Math.round(d.score)}%` }" /></div>
                  <span class="w-6 text-right font-mono text-[13px] leading-[1.2] font-medium text-navy-600">{{ Math.round(d.score) }}</span>
                </div>
              </div>
            </template>
            <p v-else class="text-sm leading-[1.5] text-gray-500">Aucun résultat : la participation n’est pas terminée.</p>
          </div>
          <div class="card p-6">
            <p class="mb-4 text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Contexte technique</p>
            <div class="flex flex-col gap-3">
              <div class="flex justify-between gap-3"><span class="text-[13px] leading-[1.4] text-gray-500">Identifiant</span><span class="font-mono text-[13px] leading-[1.4] font-medium text-navy-600">{{ p.identifiant }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-[13px] leading-[1.4] text-gray-500">Version du moteur</span><span class="font-mono text-[13px] leading-[1.4] font-medium text-navy-600">{{ p.version }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-[13px] leading-[1.4] text-gray-500">Source</span><span class="text-[13px] leading-[1.4] font-medium text-navy-600">{{ p.source }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-[13px] leading-[1.4] text-gray-500">Appareil</span><span class="text-[13px] leading-[1.4] font-medium text-navy-600 capitalize">{{ p.appareil ?? 'non renseigné' }}</span></div>
              <div class="flex justify-between gap-3"><span class="text-[13px] leading-[1.4] text-gray-500">Retours en arrière</span><span class="font-mono text-[13px] leading-[1.4] font-medium text-navy-600">{{ p.retours }}</span></div>
            </div>
            <p class="mt-4 border-t border-gray-100 pt-3.5 text-xs leading-[1.5] text-gray-500">Les résultats restent attachés à la version du moteur qui les a produits. Un recalcul crée une nouvelle participation, il ne remplace pas celle-ci.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
