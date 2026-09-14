<script setup lang="ts">
// A05 — fiche prospect, diagnostic commercial (docs/maquette/frames/admin-1440-A05.html) :
// constats retenus, leviers FeexPay associés (table constat → produit, maquette qui prime),
// priorité commerciale, angle d'entretien, garde-fous.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Prospects' })
const { fiche, error, pending, refresh } = useProspect()
useSeoMeta({ title: () => `${fiche.value ? fiche.value.contact.prenom + ' ' + fiche.value.contact.nom + ' · diagnostic commercial' : 'Prospect'} — Administration Radar by FeexPay`, robots: 'noindex' })
const message = ref<{ texte: string; erreur: boolean } | null>(null)
const poser = (texte: string, erreur = false) => (message.value = { texte, erreur })
const totalConstats = computed(() => {
  const f = fiche.value
  if (!f) return 0
  return (f.dirigeant?.insights?.facts?.length ?? 0) + (f.rayonnement?.insights?.facts?.length ?? 0)
})
const version = computed(() => fiche.value?.dirigeant?.version ?? fiche.value?.rayonnement?.version ?? '')
const themes = (k: any) => [k.dimension, k.diagnostic === 'rayonnement' ? 'Rayonnement' : null].filter(Boolean)
const badge = (l: any) => {
  const t = l.traite.map((c: any) => c.code)
  const s = l.support.map((c: any) => c.code)
  const liste = (x: string[]) => (x.length > 1 ? x.slice(0, -1).join(', ') + ' et ' + x.at(-1) : x[0])
  return t.length ? { texte: `Traite ${liste(t)}`, classe: 'bg-red-100 text-red-600' } : { texte: `Support de ${liste(s)}`, classe: 'bg-gray-100 text-gray-600' }
}
const GARDE_FOUS = ['Aucun jugement sur la gestion de l’entreprise.', 'Aucun score interne cité au prospect : les scores restent des outils de priorisation.', 'Aucune promesse de résultat chiffré.']
</script>

<template>
  <div>
    <AdminProspectEntete v-if="fiche" :fiche="fiche" onglet="diagnostic" @message="poser" />
    <AdminProspectCadre :fiche="fiche" :error="error" :pending="pending" :refresh="refresh" />
    <div v-if="fiche" class="flex items-start gap-5 px-8 pt-7 pb-9">
      <div class="flex min-w-0 flex-1 flex-col gap-5">
        <p v-if="message" class="rounded-[10px] px-4 py-3 text-sm" :class="message.erreur ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'">{{ message.texte }}</p>
        <div class="card overflow-hidden">
          <div class="flex items-center gap-3 border-b border-gray-100 px-6 py-[18px]">
            <h3 class="text-[17px] leading-[1.3] font-semibold text-navy-600">Constats retenus</h3>
            <span class="rounded-full bg-navy-50 px-2.5 py-1 text-xs leading-[1.3] font-medium text-navy-600">{{ fiche.constats.length }} sur {{ totalConstats }}</span>
            <span class="ml-auto font-mono text-xs leading-none text-gray-400">matrice V{{ version }}</span>
          </div>
          <div v-if="fiche.constats.length" class="flex flex-col">
            <div v-for="(k, i) in fiche.constats" :key="k.code" class="flex gap-[18px] border-b border-gray-100 px-6 py-5" :class="{ 'bg-orange-50': i === 0 }">
              <div class="w-14 shrink-0"><p class="mb-1.5 font-mono text-[11px] leading-none font-semibold" :class="i === 0 ? 'text-orange-700' : 'text-gray-400'">{{ k.code }}</p><AdminGravite :gravite="k.gravite" /></div>
              <div class="min-w-0 flex-1">
                <p class="mb-1.5 text-base leading-[1.4] font-semibold text-navy-600">{{ k.difficulte }}</p>
                <p class="mb-2.5 text-sm leading-[1.55] text-gray-600">{{ k.factuel }} {{ k.hypothese ?? '' }}</p>
                <p class="mb-2.5 text-[13px] leading-[1.5] text-gray-500"><span class="font-medium text-navy-600">Relance :</span> {{ k.relance }}</p>
                <div class="flex flex-wrap gap-1.5"><span v-for="t in themes(k)" :key="t" class="rounded-full border border-gray-200 px-2 py-[3px] text-[11px] leading-[1.3] text-gray-600">{{ t }}</span></div>
              </div>
            </div>
          </div>
          <p v-else class="px-6 py-5 text-sm leading-[1.5] text-gray-500">Aucune difficulté déclarée : les réponses ne déclenchent aucun constat de gravité. L’entretien part des forces déclarées.</p>
        </div>

        <div v-if="fiche.forces.length" class="card p-6">
          <h3 class="mb-1 text-[17px] leading-[1.3] font-semibold text-navy-600">Forces déclarées</h3>
          <p class="mb-4 text-[13px] leading-[1.4] text-gray-500">À reprendre avec les mots du dirigeant pour ouvrir l’entretien.</p>
          <div class="flex flex-col gap-2.5">
            <div v-for="f in fiche.forces" :key="f.code" class="flex items-start gap-3 rounded-xl bg-green-100/60 p-3.5"><UiIcon name="check-circle-outline" :size="18" class="mt-0.5 shrink-0 text-green-600" /><div><p class="text-sm leading-[1.5] font-medium text-navy-600">{{ f.factuel }}</p><p class="text-xs leading-[1.4] text-gray-500">{{ f.code }} · {{ f.dimension }} · {{ f.usage }}</p></div></div>
          </div>
        </div>

        <div class="card p-6">
          <h3 class="mb-1 text-[17px] leading-[1.3] font-semibold text-navy-600">Leviers FeexPay associés</h3>
          <p class="mb-4 text-[13px] leading-[1.4] text-gray-500">Rattachement automatique constat → produit. Ordonné par gravité du constat traité.</p>
          <div v-if="fiche.leviers.length" class="flex flex-col gap-3">
            <div v-for="(l, i) in fiche.leviers" :key="l.levier.id" class="flex items-start gap-4 rounded-xl border border-gray-200 p-[18px]">
              <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" :class="i === 0 ? 'bg-orange-50 text-orange-600' : 'bg-navy-50 text-navy-600'"><UiIcon :name="l.levier.icone" :size="24" /></span>
              <div class="min-w-0 flex-1">
                <div class="mb-1 flex items-center gap-2.5"><p class="text-base leading-[1.3] font-semibold text-navy-600">{{ l.levier.nom }}</p><span class="rounded-full px-2 py-[3px] text-[11px] leading-[1.3] font-semibold" :class="badge(l).classe">{{ badge(l).texte }}</span></div>
                <p class="text-sm leading-[1.55] text-gray-600">{{ l.levier.description }}</p>
              </div>
            </div>
          </div>
          <p v-else class="text-sm leading-[1.5] text-gray-500">Aucun levier rattaché aux constats retenus. La table de correspondance se règle dans Réglages → Leviers FeexPay.</p>
        </div>
      </div>

      <div class="flex w-[360px] shrink-0 flex-col gap-5">
        <div class="rounded-[14px] bg-navy-600 p-6">
          <p class="mb-3 text-xs leading-none font-semibold tracking-[0.08em] text-orange-300 uppercase">Priorité commerciale</p>
          <p class="mb-1.5 text-[26px] leading-[1.16] font-semibold tracking-[-0.02em] text-white">{{ fiche.priorite.niveau }}</p>
          <p class="mb-5 text-sm leading-[1.55] text-navy-200">{{ fiche.priorite.justification }}</p>
          <div class="flex flex-col gap-2.5 border-t border-white/20 pt-[18px]">
            <div class="flex justify-between"><span class="text-[13px] leading-[1.4] text-navy-200">Score de pilotage</span><span class="font-mono text-[13px] leading-[1.4] font-semibold text-white">{{ fiche.dirigeant ? Math.round(fiche.dirigeant.pilotage.score) : '—' }}</span></div>
            <div class="flex justify-between"><span class="text-[13px] leading-[1.4] text-navy-200">Score de rayonnement</span><span class="font-mono text-[13px] leading-[1.4] font-semibold text-white">{{ fiche.rayonnement ? fiche.rayonnement.public.score : '—' }}</span></div>
            <div class="flex justify-between"><span class="text-[13px] leading-[1.4] text-navy-200">Règle appliquée</span><span class="font-mono text-[13px] leading-[1.4] font-semibold text-orange-300">{{ fiche.croisement ? fiche.croisement.code : 'Lecture croisée indisponible' }}</span></div>
          </div>
        </div>
        <div class="card p-6">
          <p class="mb-3.5 text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Angle d’entretien proposé</p>
          <p class="mb-4 text-[15px] leading-[1.65] text-gray-700">{{ fiche.angle[0] }}</p>
          <div class="flex flex-col gap-2.5">
            <div v-for="(p, i) in fiche.angle.slice(1)" :key="i" class="flex items-start gap-2.5"><span class="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-orange-600 text-[10px] leading-none font-semibold text-orange-600">{{ i + 1 }}</span><p class="text-sm leading-[1.5] text-gray-600">{{ p }}</p></div>
          </div>
        </div>
        <div class="card p-6">
          <p class="mb-3.5 text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Ce qu’il ne faut pas dire</p>
          <div class="flex flex-col gap-2.5">
            <div v-for="g in GARDE_FOUS" :key="g" class="flex items-start gap-2.5"><UiIcon name="close-circle-outline" :size="18" class="shrink-0 text-red-600" /><p class="text-sm leading-[1.5] text-gray-600">{{ g }}</p></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
