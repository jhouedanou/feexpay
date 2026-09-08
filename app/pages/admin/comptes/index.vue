<script setup lang="ts">
// A10 — gestion des comptes admin (docs/maquette/frames/comptes-admin-A10.html) : filtres,
// tableau, panneau « Compte sélectionné », périmètre par rôle.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'admin', section: 'Comptes admin' })
useSeoMeta({ title: 'Comptes admin — Administration Radar by FeexPay', robots: 'noindex' })

const { me } = useAdmin()
const { data, refresh } = await useFetch<any>('/api/admin/users', { headers: useRequestHeaders(['cookie']) })
const recherche = ref('')
const filtreRole = ref('')
const filtreStatut = ref('')
const filtreEquipe = ref('')
const selection = ref<any | null>(null)
const info = ref<string | null>(null)
const erreur = ref<string | null>(null)
const occupe = ref(false)

const lignes = computed(() => {
  const comptes = (data.value?.comptes ?? []).map((c: any) => ({ ...c, kind: 'compte' }))
  const invitations = (data.value?.invitations ?? []).map((i: any) => ({ ...i, kind: 'invitation', status: 'invited' }))
  const q = recherche.value.trim().toLowerCase()
  return [...comptes, ...invitations].filter(
    (l: any) =>
      (!q || `${l.prenom ?? ''} ${l.nom ?? ''} ${l.email}`.toLowerCase().includes(q)) &&
      (!filtreRole.value || l.role === filtreRole.value) &&
      (!filtreStatut.value || l.status === filtreStatut.value) &&
      (!filtreEquipe.value || l.team === filtreEquipe.value),
  )
})
const equipes = computed(() => [...new Set(lignes.value.map((l: any) => l.team).filter(Boolean))] as string[])
const stats = computed(() => {
  const c = data.value?.comptes ?? []
  const n = (s: string) => c.filter((x: any) => x.status === s).length
  const inv = data.value?.invitations?.length ?? 0
  return `${c.length + inv} comptes · ${n('active')} actifs · ${inv} invitation${inv > 1 ? 's' : ''} en attente · ${n('suspended')} suspendu${n('suspended') > 1 ? 's' : ''}`
})
const initiales = (l: any) => `${(l.prenom ?? l.email)[0] ?? ''}${l.nom?.[0] ?? ''}`.toUpperCase()
const quand = (d: string | null) => {
  if (!d) return 'Jamais'
  const x = new Date(d)
  const jour = x.toDateString() === new Date().toDateString() ? 'Aujourd’hui' : x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return `${jour} · ${x.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ')}`
}
const dernierAdmin = computed(() => (data.value?.comptes ?? []).filter((c: any) => c.role === 'admin' && c.status === 'active').length <= 1)

async function agir(fn: () => Promise<unknown>, message: string) {
  if (occupe.value) return
  occupe.value = true
  erreur.value = null
  info.value = null
  try {
    await fn()
    info.value = message
    await refresh()
    selection.value = lignes.value.find((l: any) => l.id === selection.value?.id) ?? null
  } catch (e) {
    erreur.value = messageErreur(e)
  } finally {
    occupe.value = false
  }
}
const patch = (id: string, body: Record<string, unknown>, message: string) =>
  agir(async () => {
    await apiAdmin(`/api/admin/users/${id}`, { method: 'PATCH', body })
  }, message)
const renvoyer = (id: string) =>
  agir(async () => {
    const r = (await apiAdmin(`/api/admin/invitations/${id}/resend`, { method: 'POST' })) as { lien: string; email: { sent: boolean } }
    lienInvitation.value = r.lien
    if (!r.email.sent) info.value = 'Email non remis : copiez le lien et transmettez-le.'
  }, 'Invitation renvoyée, l’ancien lien est invalidé.')
const annuler = (id: string) =>
  agir(async () => {
    await apiAdmin(`/api/admin/invitations/${id}/cancel`, { method: 'POST' })
  }, 'Invitation annulée.')
const lienInvitation = ref<string | null>(null)
async function copierLien() {
  if (!lienInvitation.value) return
  try {
    await navigator.clipboard.writeText(lienInvitation.value)
    info.value = 'Lien d’invitation copié.'
  } catch {
    erreur.value = 'Copie impossible.'
  }
}
const changerRole = (l: any) => {
  const roles = ['lecture', 'commercial', 'analyste', 'admin']
  const choix = window.prompt('Nouveau rôle : lecture, commercial, analyste ou admin', l.role)
  if (choix && roles.includes(choix) && choix !== l.role) patch(l.id, { role: choix }, 'Rôle modifié, sessions invalidées.')
}

const PERIMETRE = [
  ['Dashboard', 1, 1, 1, 1],
  ['Fiches prospects', 2, 1, 1, 1],
  ['Renvoi de rapport', 0, 1, 1, 1],
  ['Export complet', 0, 0, 1, 1],
  ['Modèles d’email', 0, 0, 1, 1],
  ['Comptes admin', 0, 0, 0, 1],
  ['Suppression de données', 0, 0, 0, 1],
] as const
</script>

<template>
  <div>
    <AdminHeader titre="Comptes admin" :sous-titre="stats">
      <NuxtLink to="/admin/journal" class="btn btn-outline h-10 rounded-[10px] px-3.5 text-sm"><UiIcon name="history" :size="18" class="text-gray-500" />Journal des accès</NuxtLink>
      <NuxtLink to="/admin/comptes/nouveau" class="btn btn-primary h-10 rounded-[10px] px-4 text-sm"><UiIcon name="account-plus-outline" :size="18" />Créer un compte</NuxtLink>
    </AdminHeader>

    <div class="px-8 pt-7 pb-9">
      <div class="mb-5 flex flex-wrap items-center gap-2.5">
        <label class="flex h-10 w-[280px] items-center gap-2.5 rounded-[10px] border-[1.5px] border-gray-300 bg-white px-3.5">
          <UiIcon name="magnify" :size="18" class="text-gray-500" />
          <input v-model="recherche" class="w-full text-sm outline-none placeholder:text-gray-400" placeholder="Nom ou adresse email" >
        </label>
        <select v-model="filtreRole" class="h-10 rounded-full border-[1.5px] border-gray-300 bg-white px-3.5 text-sm text-gray-600"><option value="">Rôle</option><option value="lecture">Lecture seule</option><option value="commercial">Commercial</option><option value="analyste">Analyste</option><option value="admin">Administrateur</option></select>
        <select v-model="filtreStatut" class="h-10 rounded-full border-[1.5px] border-gray-300 bg-white px-3.5 text-sm text-gray-600"><option value="">Statut</option><option value="active">Actif</option><option value="invited">Invité</option><option value="suspended">Suspendu</option><option value="revoked">Révoqué</option></select>
        <select v-model="filtreEquipe" class="h-10 rounded-full border-[1.5px] border-gray-300 bg-white px-3.5 text-sm text-gray-600"><option value="">Équipe</option><option v-for="e in equipes" :key="e" :value="e">{{ e }}</option></select>
      </div>

      <p v-if="info" class="mb-4 flex items-center gap-3 rounded-[10px] bg-navy-600 px-4 py-3 text-[13px] font-medium text-white"><UiIcon name="check-circle-outline" :size="18" class="text-orange-300" />{{ info }}<button v-if="lienInvitation" type="button" class="ml-auto text-xs font-semibold text-orange-300" @click="copierLien">Copier le lien</button></p>
      <p v-if="erreur" class="mb-4 flex items-center gap-3 rounded-[10px] bg-red-100 px-4 py-3 text-[13px] text-red-600" role="alert"><UiIcon name="alert-circle-outline" :size="18" />{{ erreur }}</p>

      <div class="flex items-start gap-5">
        <div class="card min-w-0 flex-1 overflow-hidden">
          <div class="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,.9fr)_44px] border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600">
            <span class="px-5 py-3">Compte</span><span class="px-4 py-3">Rôle</span><span class="px-4 py-3">Équipe</span><span class="px-4 py-3">Dernière connexion</span><span class="px-4 py-3">Statut</span><span />
          </div>
          <p v-if="!lignes.length" class="px-5 py-10 text-center text-sm text-gray-500">Aucun compte ne correspond aux filtres actifs.</p>
          <button
            v-for="l in lignes"
            :key="l.id"
            type="button"
            class="grid w-full grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,.9fr)_44px] border-b border-gray-100 text-left last:border-0 hover:bg-gray-50"
            :class="{ 'bg-orange-50': selection?.id === l.id, 'opacity-70': l.status === 'suspended' || l.status === 'revoked' }"
            @click="selection = l"
          >
            <span class="flex min-w-0 items-center gap-3 px-5 py-3.5">
              <span class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] leading-none font-semibold" :class="l.status === 'invited' ? 'border-[1.5px] border-dashed border-gray-300 text-gray-400' : l.role === 'admin' ? 'bg-navy-600 text-white' : l.status === 'active' ? 'bg-navy-500 text-white' : 'bg-gray-400 text-white'">{{ initiales(l) }}</span>
              <span class="min-w-0"><span class="block truncate text-sm font-medium text-navy-600">{{ l.prenom }} {{ l.nom }}</span><span class="block truncate text-xs text-gray-500">{{ l.email }}</span></span>
            </span>
            <span class="flex items-center px-4 py-3.5"><AdminBadge :role="l.role" /></span>
            <span class="flex items-center px-4 py-3.5 text-[13px] text-gray-700">{{ l.team ?? '—' }}</span>
            <span class="flex items-center px-4 py-3.5 text-[13px]" :class="l.last_login_at ? 'text-gray-600' : 'text-gray-400'">{{ quand(l.last_login_at ?? null) }}</span>
            <span class="flex items-center px-4 py-3.5"><AdminBadge :status="l.status" /></span>
            <span class="flex items-center justify-center py-3.5 text-gray-400"><UiIcon name="dots-vertical" :size="20" /></span>
          </button>
        </div>

        <div class="flex w-[380px] shrink-0 flex-col gap-5">
          <div class="card p-6">
            <div class="mb-[18px] flex items-center justify-between">
              <p class="eyebrow text-gray-500">Compte sélectionné</p>
              <AdminBadge v-if="selection" :status="selection.status" />
            </div>
            <p v-if="!selection" class="text-sm leading-[1.55] text-gray-500">Sélectionnez une ligne pour voir le détail et les actions possibles.</p>
            <template v-else>
              <div class="mb-5 flex items-center gap-3">
                <span class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold" :class="selection.status === 'invited' ? 'border-[1.5px] border-dashed border-gray-300 text-gray-400' : 'bg-navy-600 text-white'">{{ initiales(selection) }}</span>
                <div><p class="text-base font-semibold text-navy-600">{{ selection.prenom }} {{ selection.nom }}</p><p class="mt-0.5 text-[13px] text-gray-500">{{ selection.roleLabel }}<span v-if="selection.team"> · {{ selection.team }}</span></p></div>
              </div>
              <dl class="mb-[18px] flex flex-col gap-3 border-y border-gray-100 py-[18px] text-[13px] leading-[1.4]">
                <div class="flex justify-between gap-3"><dt class="text-gray-500">Adresse</dt><dd class="font-medium text-navy-600">{{ selection.email }}</dd></div>
                <div v-if="selection.kind === 'invitation'" class="flex justify-between gap-3"><dt class="text-gray-500">Invité par</dt><dd class="font-medium text-navy-600">{{ selection.inviter_name }}</dd></div>
                <div v-if="selection.kind === 'invitation'" class="flex justify-between gap-3"><dt class="text-gray-500">Invitation envoyée</dt><dd class="font-medium text-navy-600">{{ quand(selection.created_at) }}</dd></div>
                <div v-if="selection.kind === 'invitation'" class="flex justify-between gap-3"><dt class="text-gray-500">Expire le</dt><dd class="font-medium text-orange-700">{{ new Date(selection.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) }}</dd></div>
                <div v-if="selection.kind === 'compte' && selection.invited_by_name" class="flex justify-between gap-3"><dt class="text-gray-500">Invité par</dt><dd class="font-medium text-navy-600">{{ selection.invited_by_name }}</dd></div>
                <div class="flex justify-between gap-3"><dt class="text-gray-500">Double authentification</dt><dd class="font-medium text-navy-600">{{ selection.mfa_enrolled_at ? 'Active' : selection.mfa_required || ['analyste', 'admin'].includes(selection.role) ? 'Requise' : 'Facultative' }}</dd></div>
              </dl>
              <div class="flex flex-col gap-2.5">
                <template v-if="selection.kind === 'invitation'">
                  <button type="button" :disabled="occupe" class="btn btn-navy h-11 rounded-[10px] text-sm" @click="renvoyer(selection.id)"><UiIcon name="email-sync-outline" :size="17" />Renvoyer l’invitation</button>
                  <button type="button" :disabled="occupe" class="btn h-11 rounded-[10px] border-[1.5px] border-orange-200 bg-orange-50 text-sm text-red-600" @click="annuler(selection.id)">Annuler l’invitation</button>
                </template>
                <template v-else>
                  <button v-if="selection.id !== me?.user.id" type="button" :disabled="occupe" class="btn btn-outline h-11 rounded-[10px] text-sm" @click="changerRole(selection)">Changer le rôle</button>
                  <button v-if="selection.status === 'active' && selection.id !== me?.user.id && !(selection.role === 'admin' && dernierAdmin)" type="button" :disabled="occupe" class="btn btn-outline h-11 rounded-[10px] text-sm" @click="patch(selection.id, { status: 'suspended' }, 'Compte suspendu, sessions coupées.')">Suspendre</button>
                  <button v-if="selection.status === 'suspended'" type="button" :disabled="occupe" class="btn btn-navy h-11 rounded-[10px] text-sm" @click="patch(selection.id, { status: 'active' }, 'Compte réactivé.')">Réactiver</button>
                  <button v-if="selection.status !== 'revoked' && selection.id !== me?.user.id && !(selection.role === 'admin' && dernierAdmin)" type="button" :disabled="occupe" class="btn h-11 rounded-[10px] border-[1.5px] border-orange-200 bg-orange-50 text-sm text-red-600" @click="patch(selection.id, { status: 'revoked' }, 'Compte révoqué.')">Révoquer l’accès</button>
                  <p v-if="selection.id === me?.user.id" class="text-xs leading-[1.5] text-gray-500">Vous ne pouvez ni retirer votre propre rôle, ni vous suspendre.</p>
                </template>
              </div>
            </template>
          </div>

          <div class="card p-6">
            <p class="eyebrow mb-4 text-gray-500">Périmètre par rôle</p>
            <div class="grid grid-cols-[1.5fr_repeat(4,1fr)] items-center gap-x-1.5 gap-y-2.5">
              <span /><span v-for="h in ['Lect.', 'Com.', 'Anal.', 'Admin']" :key="h" class="text-center text-[11px] font-semibold text-gray-500">{{ h }}</span>
              <template v-for="[nom, ...cols] in PERIMETRE" :key="nom">
                <span class="text-[13px] leading-[1.35] text-gray-700">{{ nom }}</span>
                <span v-for="(c, i) in cols" :key="i" class="text-center">
                  <UiIcon v-if="c === 1" name="check" :size="17" class="text-green-600" />
                  <UiIcon v-else-if="c === 2" name="eye-outline" :size="16" class="text-gray-400" />
                  <UiIcon v-else name="minus" :size="16" class="text-gray-300" />
                </span>
              </template>
            </div>
            <p class="mt-[18px] text-xs leading-[1.5] text-gray-500">L’œil signifie consultation sans action. Le tiret signifie section masquée, pas bouton désactivé.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
