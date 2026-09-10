<script setup lang="ts">
// File des demandes de suppression de données (RGPD article 17). Seules les demandes
// confirmées par leur auteur y figurent : tant que le lien envoyé à l'adresse n'a pas été
// ouvert, rien ne prouve que la personne visée est bien à l'origine de la demande.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'admin', section: 'Suppressions' })
useSeoMeta({ title: 'Suppressions de données — Administration Radar by FeexPay', robots: 'noindex' })

const { data, refresh } = await useFetch<{ demandes: any[] }>('/api/admin/suppressions', {
  headers: useRequestHeaders(['cookie']),
})

const enCours = ref<string | null>(null)
const info = ref<string | null>(null)
const erreur = ref<string | null>(null)
const motifs = reactive<Record<string, string>>({})

const attente = computed(() => (data.value?.demandes ?? []).filter((d) => d.status === 'verified'))
const traitees = computed(() => (data.value?.demandes ?? []).filter((d) => d.status !== 'verified'))

const STATUT: Record<string, { label: string; classe: string }> = {
  verified: { label: 'À traiter', classe: 'bg-amber-100 text-amber-600' },
  done: { label: 'Supprimé', classe: 'bg-green-100 text-green-600' },
  rejected: { label: 'Refusé', classe: 'bg-gray-100 text-gray-500' },
}

const date = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

async function traiter(id: string, action: 'supprimer' | 'rejeter') {
  if (enCours.value) return
  if (action === 'supprimer' && !confirm('Supprimer définitivement les données de ce contact ? Ses rapports cesseront d’être consultables.')) return
  enCours.value = id
  info.value = null
  erreur.value = null
  try {
    const r = await apiAdmin<{ action: string; rapports?: number }>(`/api/admin/suppressions/${id}/traiter`, {
      method: 'POST',
      body: { action, motif: motifs[id] },
    })
    info.value = r.action === 'supprimer' ? `Données supprimées · ${r.rapports ?? 0} rapport(s) révoqué(s).` : 'Demande refusée, motif enregistré.'
    await refresh()
  } catch (e) {
    erreur.value = messageErreur(e)
  } finally {
    enCours.value = null
  }
}
</script>

<template>
  <div>
    <AdminHeader titre="Suppressions de données" sous-titre="Demandes confirmées par leur auteur · article 17 du RGPD" />

    <div class="px-8 pt-7 pb-9">
      <p v-if="info" class="mb-5 rounded-[10px] bg-green-100 px-4 py-3 text-[13px] text-green-600" role="status">{{ info }}</p>
      <p v-if="erreur" class="mb-5 rounded-[10px] bg-red-100 px-4 py-3 text-[13px] text-red-600" role="alert">{{ erreur }}</p>

      <h3 class="mb-3.5 text-[17px] font-semibold text-navy-600">À traiter <span class="ml-1 text-gray-400">{{ attente.length }}</span></h3>

      <AdminVide v-if="!attente.length" titre="Aucune demande en attente" texte="Les demandes confirmées par leur auteur apparaissent ici." />

      <div v-else class="mb-10 flex flex-col gap-3">
        <div v-for="d in attente" :key="d.id" class="card p-6">
          <div class="mb-3.5 flex flex-wrap items-center gap-3">
            <span class="font-mono text-[15px] font-medium text-navy-600">{{ d.email }}</span>
            <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="STATUT[d.status]?.classe">{{ STATUT[d.status]?.label }}</span>
            <span class="text-[13px] text-gray-500">Demandé le {{ date(d.created_at) }} · confirmé le {{ date(d.verified_at) }}</span>
          </div>
          <p class="mb-4 text-[13px] leading-[1.55] text-gray-600">
            <template v-if="d.contact_id">
              Ce contact porte {{ d.participations }} participation(s) et {{ d.rapports }} rapport(s).
              La suppression efface son identité, révoque ses rapports et retire ses notes internes ; les réponses restent, sans lien avec lui.
            </template>
            <template v-else>Aucun contact ne correspond plus à cette adresse : la suppression n’aura rien à effacer.</template>
          </p>
          <div class="flex flex-wrap items-end gap-3">
            <button type="button" :disabled="enCours === d.id" class="btn btn-primary h-11 rounded-[10px] px-5 text-sm" @click="traiter(d.id, 'supprimer')">
              <UiIcon name="delete-outline" :size="17" />{{ enCours === d.id ? 'Traitement…' : 'Supprimer les données' }}
            </button>
            <div class="min-w-[260px] flex-1">
              <label :for="`motif-${d.id}`" class="mb-1.5 block text-xs font-semibold text-navy-600">Motif du refus</label>
              <input :id="`motif-${d.id}`" v-model="motifs[d.id]" class="field h-11 text-sm" placeholder="Obligation légale de conservation, litige en cours…" >
            </div>
            <button type="button" :disabled="enCours === d.id || !motifs[d.id]" class="btn btn-outline h-11 rounded-[10px] px-5 text-sm" @click="traiter(d.id, 'rejeter')">Refuser</button>
          </div>
        </div>
      </div>

      <h3 class="mb-3.5 text-[17px] font-semibold text-navy-600">Historique</h3>
      <AdminVide v-if="!traitees.length" titre="Rien encore" texte="Les demandes traitées resteront listées ici." />
      <div v-else class="card overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-100 text-left">
              <th class="eyebrow px-5 py-3 text-[11px] text-gray-500">Adresse</th>
              <th class="eyebrow px-5 py-3 text-[11px] text-gray-500">État</th>
              <th class="eyebrow px-5 py-3 text-[11px] text-gray-500">Traité le</th>
              <th class="eyebrow px-5 py-3 text-[11px] text-gray-500">Par</th>
              <th class="eyebrow px-5 py-3 text-[11px] text-gray-500">Motif</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in traitees" :key="d.id" class="border-b border-gray-50 last:border-0">
              <td class="px-5 py-3 font-mono text-[13px] text-gray-700">{{ d.email }}</td>
              <td class="px-5 py-3"><span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="STATUT[d.status]?.classe">{{ STATUT[d.status]?.label }}</span></td>
              <td class="px-5 py-3 text-gray-600">{{ date(d.handled_at) }}</td>
              <td class="px-5 py-3 text-gray-600">{{ d.traite_par ?? '—' }}</td>
              <td class="px-5 py-3 text-gray-500">{{ d.motif ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
