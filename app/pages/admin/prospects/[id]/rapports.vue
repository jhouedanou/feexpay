<script setup lang="ts">
// Onglet « Rapports et emails » : rapports du contact et journal d'envoi (notification).
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Prospects' })
const { fiche, error, pending, refresh } = useProspect()
useSeoMeta({ title: 'Rapports du prospect — Administration Radar by FeexPay', robots: 'noindex' })
const message = ref<{ texte: string; erreur: boolean } | null>(null)
const poser = (texte: string, erreur = false) => {
  message.value = { texte, erreur }
  refresh()
}
const NOTIF: Record<string, [string, string]> = {
  queued: ['En file', 'bg-gray-100 text-gray-500'],
  generated: ['Généré', 'bg-gray-100 text-gray-500'],
  accepted: ['Accepté par le fournisseur', 'bg-green-100 text-green-600'],
  delivered: ['Remis', 'bg-green-100 text-green-600'],
  opened: ['Ouvert', 'bg-green-100 text-green-600'],
  bounced: ['Rejeté', 'bg-red-100 text-red-600'],
  failed: ['Échec', 'bg-red-100 text-red-600'],
  cancelled: ['Annulé', 'bg-gray-100 text-gray-500'],
}
const RAPPORT: Record<string, [string, string]> = { pending: ['En préparation', 'bg-amber-100 text-amber-600'], ready: ['Disponible', 'bg-green-100 text-green-600'], revoked: ['Révoqué', 'bg-gray-100 text-gray-500'] }
</script>

<template>
  <div>
    <AdminProspectEntete v-if="fiche" :fiche="fiche" onglet="rapports" @message="poser" />
    <AdminProspectCadre :fiche="fiche" :error="error" :pending="pending" :refresh="refresh" />
    <div v-if="fiche" class="flex flex-col gap-5 px-8 pt-7 pb-9">
      <p v-if="message" class="rounded-[10px] px-4 py-3 text-sm" :class="message.erreur ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'">{{ message.texte }}</p>
      <AdminVide v-if="!fiche.rapports.length" titre="Aucun rapport demandé" texte="Le rapport est créé quand le participant laisse ses coordonnées en fin de diagnostic (P10)." icone="file-document-outline" />
      <div v-for="r in fiche.rapports" :key="r.id" class="card p-6">
        <div class="mb-4 flex items-center gap-3">
          <UiIcon name="file-document-outline" :size="20" class="text-orange-600" />
          <h3 class="text-[17px] leading-[1.3] font-semibold text-navy-600">Rapport du {{ dateLongue(r.created_at) }}</h3>
          <span class="rounded-full px-[9px] py-1 text-xs leading-[1.4] font-medium" :class="RAPPORT[r.status]?.[1]">{{ RAPPORT[r.status]?.[0] }}</span>
          <span class="ml-auto font-mono text-xs text-gray-400">édition {{ r.editorial_version }} · {{ (r.snapshot_refs?.score_snapshot_ids ?? []).length }} diagnostic{{ (r.snapshot_refs?.score_snapshot_ids ?? []).length > 1 ? 's' : '' }}</span>
        </div>
        <p class="mb-4 text-[13px] leading-[1.5] text-gray-500">Le lien du rapport n’est pas conservé en clair : « Renvoyer le rapport » émet un nouveau lien vers la même version et invalide l’ancien.</p>
        <div v-if="r.notifications.length" class="overflow-hidden rounded-xl border border-gray-200">
          <div class="grid grille-notifications border-b border-gray-200 bg-gray-50">
            <span v-for="c in ['Envoyé le', 'Destinataire', 'Statut', 'Tentatives', 'Détail']" :key="c" class="px-4 py-2.5 text-xs font-semibold text-gray-600">{{ c }}</span>
          </div>
          <div v-for="n in r.notifications" :key="n.id" class="grid grille-notifications border-b border-gray-100 last:border-0">
            <span class="px-4 py-3 text-[13px] text-gray-700">{{ dateHeure(n.created_at) }}</span>
            <span class="truncate px-4 py-3 text-[13px] text-gray-700">{{ n.recipient }}</span>
            <span class="flex items-center px-4 py-3"><span class="rounded-full px-[9px] py-1 text-xs font-medium" :class="NOTIF[n.status]?.[1]">{{ NOTIF[n.status]?.[0] ?? n.status }}</span></span>
            <span class="px-4 py-3 font-mono text-[13px] text-navy-600">{{ n.attempts }}</span>
            <span class="px-4 py-3 text-xs leading-[1.4] text-gray-500">{{ n.last_error ?? n.template }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-500">Aucun envoi enregistré pour ce rapport.</p>
      </div>
    </div>
  </div>
</template>
