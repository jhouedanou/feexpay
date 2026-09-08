<script setup lang="ts">
// Onglet « Participations » de la fiche prospect : chaque participation, vers A06.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Prospects' })
const { fiche, error, pending, refresh } = useProspect()
useSeoMeta({ title: 'Participations du prospect — Administration Radar by FeexPay', robots: 'noindex' })
const message = ref<{ texte: string; erreur: boolean } | null>(null)
const poser = (texte: string, erreur = false) => (message.value = { texte, erreur })
const TYPE: Record<string, string> = { dirigeant: 'Profil du dirigeant', rayonnement: 'Rayonnement de l’entreprise' }
const STATUT: Record<string, [string, string]> = { completed: ['Terminée', 'bg-green-100 text-green-600'], in_progress: ['En cours', 'bg-amber-100 text-amber-600'], abandoned: ['Abandonnée', 'bg-gray-100 text-gray-500'] }
</script>

<template>
  <div>
    <AdminProspectEntete v-if="fiche" :fiche="fiche" onglet="participations" @message="poser" />
    <AdminProspectCadre :fiche="fiche" :error="error" :pending="pending" :refresh="refresh" />
    <div v-if="fiche" class="px-8 pt-7 pb-9">
      <p v-if="message" class="mb-5 rounded-[10px] px-4 py-3 text-sm" :class="message.erreur ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'">{{ message.texte }}</p>
      <div class="card overflow-hidden">
        <div class="grid grille-fiche-participations border-b border-gray-200 bg-gray-50">
          <span v-for="c in ['Identifiant', 'Diagnostic', 'Statut', 'Commencée', 'Durée', 'Moteur']" :key="c" class="px-4 py-[13px] text-xs leading-[1.2] font-semibold text-gray-600">{{ c }}</span>
        </div>
        <NuxtLink v-for="p in fiche.participations" :key="p.id" :to="`/admin/participations/${p.id}`" class="grid grille-fiche-participations border-b border-gray-100 hover:bg-orange-50">
          <span class="px-4 py-3.5 font-mono text-[13px] leading-[1.3] font-medium text-navy-600">{{ p.identifiant }}</span>
          <span class="px-4 py-3.5 text-sm leading-[1.3] text-gray-700">{{ TYPE[p.diagnostic_type] }}</span>
          <span class="flex items-center px-4 py-3.5"><span class="rounded-full px-[9px] py-1 text-xs leading-[1.4] font-medium" :class="STATUT[p.status]?.[1]">{{ STATUT[p.status]?.[0] ?? p.status }}</span></span>
          <span class="px-4 py-3.5 text-[13px] leading-[1.3] text-gray-700">{{ dateHeure(p.started_at) }}</span>
          <span class="px-4 py-3.5 text-[13px] leading-[1.3] text-gray-700">{{ duree(p.duration_s) }}</span>
          <span class="px-4 py-3.5 font-mono text-[13px] leading-[1.3] text-navy-600">{{ p.version }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
