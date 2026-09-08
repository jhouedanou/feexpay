<script setup lang="ts">
/** En-tête commun des onglets de la fiche prospect (A04/A05) : identité, badges, actions, onglets. */
const props = defineProps<{ fiche: any; onglet: 'synthese' | 'diagnostic' | 'participations' | 'rapports' | 'historique' }>()
const emit = defineEmits<{ message: [texte: string, erreur?: boolean] }>()
const { me } = useAdmin()
const c = computed(() => props.fiche.contact)
const base = computed(() => `/admin/prospects/${c.value.id}`)
const onglets = computed(() => [
  { cle: 'synthese', label: 'Synthèse', to: base.value },
  { cle: 'diagnostic', label: 'Diagnostic commercial', to: `${base.value}/diagnostic` },
  { cle: 'participations', label: 'Participations', to: `${base.value}/participations`, n: props.fiche.participations.length },
  { cle: 'rapports', label: 'Rapports et emails', to: `${base.value}/rapports` },
  { cle: 'historique', label: 'Historique', to: `${base.value}/historique` },
])
const ligne = computed(() => [c.value.entreprise, c.value.secteur, c.value.taille ? `${c.value.taille} personnes` : null, c.value.pays].filter(Boolean).join(' · '))
const occupe = ref(false)
async function exporter(vue: 'synthese' | 'entretien') {
  try {
    await telecharger(`/api/admin/prospects/${c.value.id}/fiche?vue=${vue}`)
  } catch (e) {
    emit('message', (e as Error).message, true)
  }
}
async function renvoyer() {
  if (occupe.value) return
  occupe.value = true
  try {
    const r = await apiAdmin(`/api/admin/prospects/${c.value.id}/rapport`, { method: 'POST' })
    emit('message', r.email.sent ? `Rapport renvoyé à ${r.email.to}.` : `Envoi non remis : ${r.email.error ?? 'fournisseur indisponible'}.`, !r.email.sent)
  } catch (e) {
    emit('message', messageErreur(e), true)
  } finally {
    occupe.value = false
  }
}
async function copier() {
  const d = props.fiche
  const lignes = [
    `${c.value.prenom} ${c.value.nom} · ${ligne.value}`,
    `Priorité ${d.priorite.niveau.toLowerCase()} · ${d.priorite.justification}`,
    '',
    'Constats retenus',
    ...d.constats.map((k: any) => `- ${k.code} (gravité ${k.gravite}) ${k.difficulte} — ${k.factuel} Relance : ${k.relance}`),
    '',
    'Leviers FeexPay',
    ...d.leviers.map((l: any) => `- ${l.levier.nom} : ${l.levier.description}`),
    '',
    'Angle d’entretien',
    ...(d.angle ?? []),
  ]
  try {
    await navigator.clipboard.writeText(lignes.join('\n'))
    emit('message', 'Argumentaire copié.')
  } catch {
    emit('message', 'Copie impossible dans ce navigateur.', true)
  }
}
defineExpose({ copier, exporter, renvoyer })
</script>

<template>
  <div class="border-b border-gray-200 bg-white px-8 pt-5">
    <div class="mb-2 flex items-center gap-2 text-[13px] leading-none">
      <NuxtLink to="/admin/prospects" class="text-gray-500 hover:text-navy-600">Prospects</NuxtLink><span class="text-gray-300">/</span><span class="font-medium text-navy-600">{{ c.prenom }} {{ c.nom }}</span>
    </div>
    <div class="flex items-start justify-between gap-6">
      <div class="flex gap-4">
        <span class="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-navy-50 text-xl leading-none font-semibold text-navy-600">{{ initiales(c.prenom, c.nom) }}</span>
        <div>
          <div class="mb-1 flex flex-wrap items-center gap-2.5">
            <h1 v-if="onglet === 'diagnostic'" class="whitespace-nowrap text-[26px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">{{ c.prenom }} {{ c.nom }} · diagnostic commercial</h1>
            <h1 v-else class="text-[26px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">{{ c.prenom }} {{ c.nom }}</h1>
            <span class="inline-flex items-center rounded-full border px-2.5 py-[5px] text-xs leading-[1.3] font-semibold" :class="fiche.priorite.niveau === 'Élevée' ? 'border-orange-200 bg-orange-50 text-orange-700' : fiche.priorite.niveau === 'Moyenne' ? 'border-amber-100 bg-amber-100 text-amber-600' : 'border-gray-200 bg-gray-50 text-gray-500'">Priorité {{ fiche.priorite.niveau.toLowerCase() }}</span>
            <span v-if="fiche.deux" class="inline-flex items-center gap-[5px] rounded-full bg-green-100 px-2.5 py-[5px] text-xs leading-[1.3] font-medium text-green-600"><UiIcon name="check-decagram" :size="13" />Deux diagnostics</span>
            <span v-else class="inline-flex items-center gap-[5px] rounded-full bg-gray-100 px-2.5 py-[5px] text-xs leading-[1.3] font-medium text-gray-500">Un seul diagnostic</span>
          </div>
          <p class="text-sm leading-[1.4] text-gray-600">{{ ligne || c.email }}</p>
        </div>
      </div>
      <div class="flex shrink-0 gap-2.5">
        <template v-if="onglet === 'diagnostic'">
          <button type="button" class="btn btn-outline h-10 gap-2 rounded-[10px] px-3.5 text-sm" @click="copier"><UiIcon name="content-copy" :size="18" class="text-gray-500" />Copier l’argumentaire</button>
          <button v-if="me?.user.export_allowed" type="button" class="btn btn-primary h-10 gap-2 rounded-[10px] px-4 text-sm" @click="exporter('entretien')"><UiIcon name="file-pdf-box" :size="18" />Exporter la fiche entretien</button>
        </template>
        <template v-else>
          <button v-if="me?.user.export_allowed" type="button" class="btn btn-outline h-10 gap-2 rounded-[10px] px-3.5 text-sm" @click="exporter('synthese')"><UiIcon name="download-outline" :size="18" class="text-gray-500" />Exporter la fiche</button>
          <button v-if="fiche.rapports.length && (me?.user.role !== 'lecture')" type="button" class="btn btn-primary h-10 gap-2 rounded-[10px] px-4 text-sm" :disabled="occupe" @click="renvoyer"><UiIcon name="email-fast-outline" :size="18" />Renvoyer le rapport</button>
        </template>
      </div>
    </div>
    <nav class="mt-6 flex gap-7">
      <NuxtLink v-for="o in onglets" :key="o.cle" :to="o.to" class="flex items-center gap-2 border-b-2 pb-3 text-[15px] leading-none" :class="o.cle === onglet ? 'border-orange-600 font-semibold text-navy-600' : 'border-transparent text-gray-500 hover:text-navy-600'">
        {{ o.label }}<span v-if="o.n !== undefined" class="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold" :class="o.cle === onglet ? 'bg-orange-50 text-orange-700' : 'bg-gray-100 text-gray-600'">{{ o.n }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
