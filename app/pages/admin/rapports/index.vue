<script setup lang="ts">
// A07 — rapports et emails (docs/maquette/frames/admin-1440-A07.html) : indicateurs de remise,
// journal des envois filtrable, renvoi et correction d'adresse, relance des échecs, modèles
// actifs, journal du dernier envoi.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'commercial', section: 'Rapports et emails' })
useSeoMeta({ title: 'Rapports et emails — Administration Radar by FeexPay', robots: 'noindex' })

const route = useRoute()
const filtres = reactive({ statut: String(route.query.statut ?? ''), modele: String(route.query.modele ?? ''), jours: Number(route.query.jours ?? 7) || 7 })
const page = ref(1)
watch(filtres, () => (page.value = 1))
const query = computed(() => ({ ...filtres, page: page.value, taille: 20 }))
const { data, error, pending, refresh } = await useFetch<any>('/api/admin/rapports', { query, headers: useRequestHeaders(['cookie']) })

const STATUTS: Record<string, { label: string; classe: string; icone: string }> = {
  queued: { label: 'En attente', classe: 'bg-amber-100 text-amber-600', icone: 'clock-outline' },
  generated: { label: 'En attente', classe: 'bg-amber-100 text-amber-600', icone: 'clock-outline' },
  accepted: { label: 'Accepté', classe: 'bg-navy-50 text-navy-600', icone: 'email-fast-outline' },
  delivered: { label: 'Remis', classe: 'bg-green-100 text-green-600', icone: 'check' },
  opened: { label: 'Ouvert', classe: 'bg-green-100 text-green-600', icone: 'email-check-outline' },
  bounced: { label: 'Échec', classe: 'bg-red-100 text-red-600', icone: 'alert-circle-outline' },
  failed: { label: 'Échec', classe: 'bg-red-100 text-red-600', icone: 'alert-circle-outline' },
  cancelled: { label: 'Annulé', classe: 'bg-gray-100 text-gray-500', icone: 'close' },
}
const echec = (s: string) => s === 'failed' || s === 'bounced'
const sousTitre = computed(() => {
  const t = data.value?.totaux
  return t ? `${nombre(t.generes)} rapports générés · ${nombre(t.envoyes)} envoyés · ${t.attente} en attente · ${t.echecs} en échec` : undefined
})
const delta = (a: number, b: number, unite: 'point' | 'points') => {
  const d = Math.round((a - b) * 10) / 10
  const signe = d > 0 ? '+' : d < 0 ? '−' : ''
  return { texte: `${signe}${Math.abs(d)} point${Math.abs(d) > 1 ? 's' : ''}`, classe: d > 0 ? 'text-green-600' : d < 0 ? 'text-amber-600' : 'text-gray-500' }
}
const kpis = computed(() => {
  const k = data.value?.kpi
  if (!k) return []
  return [
    { label: 'Taux de remise', valeur: `${String(k.actuel.remise).replace('.', ',')} %`, ...delta(k.actuel.remise, k.precedent.remise, 'point') },
    { label: 'Taux d’ouverture', valeur: `${k.actuel.ouverture} %`, ...delta(k.actuel.ouverture, k.precedent.ouverture, 'points') },
    { label: 'Rapport ouvert en ligne', valeur: `${k.actuel.enLigne} %`, ...delta(k.actuel.enLigne, k.precedent.enLigne, 'points') },
  ]
})
const quand = (d: string) => `${new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} · ${heure(d)}`
const hms = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).replace(/:(\d\d):(\d\d)$/, ' h $1 min $2 s')
const EVENEMENTS: Record<string, string> = { generated: 'Rapport généré', accepted: 'Email accepté par le relais', sent: 'Email transmis', delivered: 'Remis', opened: 'Ouvert', delivery_delayed: 'Remise retardée', bounced: 'Adresse rejetée', complained: 'Signalé comme indésirable', failed: 'Envoi refusé' }
const journal = computed(() => {
  const d = data.value?.dernier
  if (!d) return []
  const e = [...d.events].map((x: any) => ({ ...x, ok: !['bounced', 'failed', 'complained', 'delivery_delayed'].includes(x.type) }))
  if (d.ouvertEnLigne) e.push({ type: 'en_ligne', at: d.ouvertEnLigne, detail: null, ok: true })
  return e.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
})

const message = ref<{ texte: string; erreur: boolean } | null>(null)
const occupe = ref<string | null>(null)
const correction = ref<{ reportId: string; email: string } | null>(null)
async function renvoyer(l: any, email?: string) {
  if (occupe.value) return
  occupe.value = l.reportId
  message.value = null
  try {
    const r = await apiAdmin(`/api/admin/rapports/${l.reportId}/renvoyer`, { method: 'POST', body: email ? { email } : {} })
    message.value = r.email.sent ? { texte: `Rapport renvoyé à ${r.email.to}.`, erreur: false } : { texte: `Envoi non remis à ${r.email.to} : ${r.email.error}`, erreur: true }
    correction.value = null
    await refresh()
  } catch (e) {
    message.value = { texte: messageErreur(e), erreur: true }
  } finally {
    occupe.value = null
  }
}
async function relancer() {
  if (occupe.value) return
  occupe.value = 'relance'
  message.value = null
  try {
    const r = await apiAdmin('/api/admin/rapports/relancer', { method: 'POST' })
    message.value = { texte: `${r.envoyes} envoi${r.envoyes > 1 ? 's' : ''} remis sur ${r.total} relancé${r.total > 1 ? 's' : ''}.`, erreur: r.envoyes < r.total }
    await refresh()
  } catch (e) {
    message.value = { texte: messageErreur(e), erreur: true }
  } finally {
    occupe.value = null
  }
}
const MODELES = [
  { cle: 'dirigeant', nom: 'Rapport Dirigeant', detail: '8 variantes d’archétype', icone: 'compass-outline', actif: true },
  { cle: 'rayonnement', nom: 'Rapport Rayonnement', detail: '5 niveaux', icone: 'chart-box-outline', actif: true },
  { cle: 'croise', nom: 'Rapport croisé complet', detail: '4 lectures croisées', icone: 'vector-intersection', actif: true },
  { cle: 'relance', nom: 'Relance à 7 jours', detail: 'Désactivé · en attente de validation', icone: 'email-sync-outline', actif: false },
]
const apercu = (cle: string) => window.open(`/api/admin/rapports/apercu?modele=${cle}`, '_blank', 'noopener')
</script>

<template>
  <div>
    <AdminHeader titre="Rapports et emails" :sous-titre="sousTitre">
      <button type="button" class="btn btn-outline h-10 gap-2 rounded-[10px] px-3.5 text-sm" @click="apercu('croise')"><UiIcon name="cog-outline" :size="18" class="text-gray-500" />Modèles d’email</button>
      <button v-if="data?.totaux.echecs" type="button" class="btn btn-primary h-10 gap-2 rounded-[10px] px-4 text-sm" :disabled="occupe === 'relance'" @click="relancer"><UiIcon name="refresh" :size="18" />Relancer les {{ data.totaux.echecs }} échec{{ data.totaux.echecs > 1 ? 's' : '' }}</button>
    </AdminHeader>
    <div class="px-8 pt-7 pb-9">
      <p v-if="message" class="mb-5 rounded-[10px] px-4 py-3 text-sm" :class="message.erreur ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'">{{ message.texte }}</p>
      <AdminVide v-if="error" erreur titre="Les données n’ont pas pu être chargées" texte="Le journal des envois n’a pas répondu. Vos filtres et votre sélection sont conservés.">
        <button type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="refresh()"><UiIcon name="refresh" :size="18" />Réessayer</button>
      </AdminVide>
      <AdminSquelette v-else-if="pending && !data" :lignes="6" />
      <template v-else-if="data">
        <div class="mb-6 grid grid-cols-4 gap-4">
          <div v-for="k in kpis" :key="k.label" class="card p-5">
            <p class="mb-2 text-[13px] leading-[1.3] text-gray-500">{{ k.label }}</p>
            <p class="mb-1 text-[28px] leading-none font-bold tracking-[-0.02em] text-navy-600">{{ k.valeur }}</p>
            <p class="text-[13px] leading-[1.3] font-medium" :class="k.classe">{{ k.texte }}</p>
          </div>
          <div class="rounded-[14px] border border-orange-200 bg-white p-5">
            <p class="mb-2 text-[13px] leading-[1.3] text-orange-700">Échecs à traiter</p>
            <p class="mb-1 text-[28px] leading-none font-bold tracking-[-0.02em] text-orange-600">{{ data.totaux.echecs }}</p>
            <p class="text-[13px] leading-[1.3] font-medium text-gray-500">dont {{ data.totaux.invalides }} adresse{{ data.totaux.invalides > 1 ? 's' : '' }} invalide{{ data.totaux.invalides > 1 ? 's' : '' }}</p>
          </div>
        </div>

        <div class="flex items-start gap-5">
          <div class="card min-w-0 flex-1 overflow-hidden">
            <div class="flex flex-wrap items-center gap-2.5 border-b border-gray-200 px-5 py-4">
              <label class="relative inline-flex h-[34px] items-center rounded-full border-[1.5px] pr-2.5 pl-3 text-[13px] leading-none" :class="filtres.statut ? 'border-orange-600 bg-orange-50 font-medium text-navy-600' : 'border-gray-300 text-gray-600'">
                <select v-model="filtres.statut" class="appearance-none bg-transparent pr-5 outline-none" aria-label="Statut"><option value="">Statut</option><option value="echec">Statut : échec</option><option value="attente">Statut : en attente</option><option value="remis">Statut : remis</option><option value="ouvert">Statut : ouvert</option></select>
                <UiIcon name="chevron-down" :size="15" class="pointer-events-none absolute right-2.5" />
              </label>
              <label class="relative inline-flex h-[34px] items-center rounded-full border-[1.5px] pr-2.5 pl-3 text-[13px] leading-none" :class="filtres.modele ? 'border-orange-600 bg-orange-50 font-medium text-navy-600' : 'border-gray-300 text-gray-600'">
                <select v-model="filtres.modele" class="appearance-none bg-transparent pr-5 outline-none" aria-label="Modèle"><option value="">Modèle</option><option v-for="m in data.modeles" :key="m" :value="m">{{ m }}</option></select>
                <UiIcon name="chevron-down" :size="15" class="pointer-events-none absolute right-2.5" />
              </label>
              <label class="relative inline-flex h-[34px] items-center rounded-full border-[1.5px] border-gray-300 pr-2.5 pl-3 text-[13px] leading-none text-gray-600">
                <select v-model.number="filtres.jours" class="appearance-none bg-transparent pr-5 outline-none" aria-label="Période"><option v-for="j in [7, 30, 90, 365]" :key="j" :value="j">{{ j }} derniers jours</option></select>
                <UiIcon name="chevron-down" :size="15" class="pointer-events-none absolute right-2.5" />
              </label>
              <span class="ml-auto text-[13px] leading-none text-gray-500">{{ data.total }} envoi{{ data.total > 1 ? 's' : '' }} affiché{{ data.total > 1 ? 's' : '' }}</span>
            </div>
            <AdminVide v-if="!data.total" titre="Aucun envoi sur la période" texte="Les envois apparaissent ici dès qu’un rapport part par email. Élargissez la période ou retirez le filtre de statut." icone="email-outline" class="m-5">
              <button type="button" class="btn btn-navy h-10 rounded-[10px] px-4 text-sm" @click="filtres.statut = ''; filtres.modele = ''; filtres.jours = 365">Réinitialiser les filtres</button>
            </AdminVide>
            <template v-else>
              <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,.9fr)_minmax(0,1.3fr)] border-b border-gray-200 bg-gray-50">
                <span class="px-5 py-[13px] text-xs font-semibold text-gray-600">Destinataire</span>
                <span v-for="c in ['Modèle', 'Envoyé le', 'Statut']" :key="c" class="px-4 py-[13px] text-xs font-semibold text-gray-600">{{ c }}</span>
                <span class="px-4 py-[13px] text-right text-xs font-semibold text-gray-600">Action</span>
              </div>
              <div v-for="l in data.items" :key="l.id" class="border-b border-gray-100" :class="{ 'bg-orange-50': echec(l.statut) }">
                <div class="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,.9fr)_minmax(0,1.3fr)]">
                  <div class="px-5 py-3.5"><NuxtLink :to="`/admin/prospects/${l.contact.id}`" class="text-sm leading-[1.3] font-medium text-navy-600 hover:underline">{{ l.contact.prenom }} {{ l.contact.nom }}</NuxtLink><p class="mt-0.5 truncate text-xs leading-[1.3]" :class="l.statut === 'bounced' ? 'text-red-600' : 'text-gray-500'">{{ l.destinataire }}<template v-if="l.statut === 'bounced'"> · adresse rejetée</template></p></div>
                  <div class="flex items-center px-4 py-3.5 text-[13px] leading-[1.4] text-gray-700">{{ l.modele }}</div>
                  <div class="flex items-center px-4 py-3.5 text-[13px] leading-[1.4] whitespace-nowrap text-gray-600">{{ quand(l.envoyeLe) }}</div>
                  <div class="flex items-center px-4 py-3.5"><span class="inline-flex items-center gap-[5px] rounded-full px-[9px] py-1 text-xs leading-[1.4] font-medium" :class="STATUTS[l.statut]?.classe"><UiIcon :name="STATUTS[l.statut]?.icone ?? 'minus'" :size="13" />{{ STATUTS[l.statut]?.label ?? l.statut }}</span></div>
                  <div class="flex items-center justify-end px-4 py-3.5">
                    <button v-if="l.statut === 'bounced' || (l.statut === 'failed' && /invalid `?to`?|not a valid|adresse/i.test(l.erreur ?? ''))" type="button" class="text-[13px] leading-none font-semibold whitespace-nowrap text-orange-600 hover:underline" @click="correction = { reportId: l.reportId, email: l.destinataire }">Corriger et renvoyer</button>
                    <NuxtLink v-else-if="l.statut === 'queued' || l.statut === 'generated'" :to="`/admin/prospects/${l.contact.id}/rapports`" class="text-[13px] leading-none font-medium text-gray-500 hover:text-navy-600">Voir le journal</NuxtLink>
                    <button v-else type="button" class="text-[13px] leading-none font-medium hover:underline" :class="echec(l.statut) ? 'font-semibold text-orange-600' : 'text-gray-500'" :disabled="occupe === l.reportId" @click="renvoyer(l)">Renvoyer</button>
                  </div>
                </div>
                <div v-if="correction && correction.reportId === l.reportId" class="flex items-center gap-2.5 border-t border-orange-200 bg-white px-5 py-3">
                  <input v-model="correction.email" type="email" class="field h-10 flex-1 text-sm" placeholder="Nouvelle adresse" >
                  <button type="button" class="btn btn-primary h-10 rounded-[10px] px-4 text-sm" :disabled="occupe === l.reportId" @click="renvoyer(l, correction.email)">Renvoyer</button>
                  <button type="button" class="btn btn-ghost h-10 px-3 text-sm" @click="correction = null">Annuler</button>
                </div>
                <p v-if="echec(l.statut) && l.erreur && l.statut !== 'bounced'" class="truncate px-5 pb-3 text-xs leading-[1.4] text-red-600">{{ l.erreur }}</p>
              </div>
              <AdminPagination class="px-5" :page="data.page" :taille="data.taille" :total="data.total" @change="page = $event" />
            </template>
          </div>

          <div class="flex w-[380px] shrink-0 flex-col gap-5">
            <div class="card p-6">
              <p class="mb-4 text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Modèles actifs</p>
              <div class="flex flex-col gap-3">
                <button v-for="m in MODELES" :key="m.cle" type="button" class="flex items-start gap-3 rounded-xl border border-gray-200 p-4 text-left" :class="m.actif ? 'hover:bg-gray-50' : 'cursor-default bg-gray-50'" :disabled="!m.actif" @click="apercu(m.cle)">
                  <UiIcon :name="m.icone" :size="20" class="shrink-0" :class="m.actif ? 'text-navy-600' : 'text-gray-400'" />
                  <div class="flex-1"><p class="mb-0.5 text-sm leading-[1.35] font-medium" :class="m.actif ? 'text-navy-600' : 'text-gray-500'">{{ m.nom }}</p><p class="text-xs leading-[1.4]" :class="m.actif ? 'text-gray-500' : 'text-gray-400'">{{ m.detail }}</p></div>
                  <span class="inline-flex h-5 w-[34px] shrink-0 items-center rounded-full px-[3px]" :class="m.actif ? 'justify-end bg-green-600' : 'bg-gray-300'"><span class="h-3.5 w-3.5 rounded-full bg-white" /></span>
                </button>
              </div>
              <p class="mt-3 text-xs leading-[1.4] text-gray-500">Les modèles sont versionnés avec le code. Cliquer ouvre l’aperçu avec le cas de contrôle principal.</p>
            </div>
            <div class="card p-6">
              <p class="mb-4 text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Journal du dernier envoi</p>
              <p v-if="data.dernier" class="mb-3 text-[13px] leading-[1.4] text-gray-600">{{ data.dernier.contact.prenom }} {{ data.dernier.contact.nom }} · {{ data.dernier.modele }} · {{ dateCourte(data.dernier.envoyeLe) }}</p>
              <div v-if="journal.length" class="flex flex-col">
                <div v-for="(e, i) in journal" :key="i" class="flex gap-3">
                  <span class="flex shrink-0 flex-col items-center"><span class="mt-[5px] h-[9px] w-[9px] rounded-full" :class="e.ok ? 'bg-green-600' : 'bg-red-600'" /><span v-if="i < journal.length - 1" class="w-px flex-1 bg-gray-200" /></span>
                  <div class="pb-4"><p class="text-[13px] leading-[1.4] font-medium text-navy-600">{{ e.type === 'en_ligne' ? 'Ouvert, rapport consulté en ligne' : (EVENEMENTS[e.type] ?? e.type) }}</p><p class="mt-0.5 line-clamp-2 font-mono text-xs leading-[1.4] text-gray-500">{{ hms(e.at) }}<template v-if="e.detail"> · {{ e.detail }}</template></p></div>
                </div>
              </div>
              <p v-else class="text-sm leading-[1.5] text-gray-500">Aucun envoi sur la période.</p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
