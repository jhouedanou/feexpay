<script setup lang="ts">
// A09 — création d'un compte admin (docs/maquette/frames/comptes-admin-A09.html).
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'admin', section: 'Comptes admin' })
useSeoMeta({ title: 'Créer un compte administrateur — Administration Radar by FeexPay', robots: 'noindex' })

const form = reactive({ prenom: '', nom: '', email: '', team: '', role: 'commercial' as 'lecture' | 'commercial' | 'analyste' | 'admin', mfa_required: false, geo_restricted: false, export_allowed: false })
const erreur = ref<string | null>(null)
const envoi = ref(false)
const resultat = ref<{ lien: string; email: { sent: boolean; error?: string } } | null>(null)

const ROLES = [
  { code: 'lecture', nom: 'Lecture seule', texte: 'Consultation du dashboard et des listes. Aucun export, aucun envoi.' },
  { code: 'commercial', nom: 'Commercial', texte: 'Fiches prospects, diagnostic commercial, renvoi de rapport et export de sa propre sélection.' },
  { code: 'analyste', nom: 'Analyste', texte: 'Tout le périmètre commercial, plus les exports complets, les modèles d’email et les versions du moteur.' },
  { code: 'admin', nom: 'Administrateur', texte: 'Tout le périmètre analyste, plus la gestion des comptes admin et la suppression de données.' },
] as const
const mfaImposee = computed(() => form.role === 'analyste' || form.role === 'admin')
const emailValide = computed(() => /@(feexpay\.me|bigfiveabidjan\.com)$/i.test(form.email.trim()))
const perimetre = computed(() => {
  const r = ['lecture', 'commercial', 'analyste', 'admin'].indexOf(form.role)
  return [
    ['Dashboard et listes', true],
    ['Fiches prospects et diagnostic commercial', r >= 1],
    ['Renvoi d’un rapport à un contact', r >= 1],
    ['Modèles d’email et versions du moteur', r >= 2],
    ['Gestion des comptes admin', r >= 3],
    ['Suppression de données', r >= 3],
  ] as [string, boolean][]
})

async function envoyer() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    resultat.value = await apiAdmin('/api/admin/invitations', {
      method: 'POST',
      body: { ...form, email: form.email.trim().toLowerCase(), team: form.team.trim() || null, mfa_required: form.mfa_required || mfaImposee.value },
    })
  } catch (e) {
    erreur.value = messageErreur(e)
  } finally {
    envoi.value = false
  }
}
async function copier() {
  if (!resultat.value) return
  await navigator.clipboard.writeText(resultat.value.lien).catch(() => null)
}
</script>

<template>
  <div>
    <AdminHeader titre="Créer un compte administrateur" sous-titre="Une invitation est envoyée à l’adresse renseignée. Le mot de passe est défini par la personne invitée, jamais ici." :fil="[{ label: 'Comptes admin', to: '/admin/comptes' }, { label: 'Nouveau compte' }]" />

    <div v-if="resultat" class="px-8 pt-7 pb-9">
      <div class="card mx-auto max-w-[640px] p-8">
        <span class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-green-100 text-green-600"><UiIcon name="check-decagram" :size="28" /></span>
        <h2 class="mb-2 text-[22px] font-semibold text-navy-600">Invitation créée pour {{ form.prenom }} {{ form.nom }}</h2>
        <p class="mb-5 text-[15px] leading-[1.6] text-gray-600">
          <template v-if="resultat.email.sent">L’email est parti vers {{ form.email }}. Le lien est à usage unique et expire dans sept jours.</template>
          <template v-else>L’email n’a pas pu être remis (domaine d’envoi non vérifié). Transmettez ce lien à usage unique, valable sept jours :</template>
        </p>
        <div class="mb-6 flex items-center gap-3 rounded-[10px] bg-gray-50 px-4 py-3">
          <code class="min-w-0 flex-1 truncate text-[13px] text-navy-600">{{ resultat.lien }}</code>
          <button type="button" class="btn btn-navy h-9 rounded-lg px-3 text-xs" @click="copier"><UiIcon name="content-copy" :size="15" />Copier</button>
        </div>
        <div class="flex gap-2.5">
          <NuxtLink to="/admin/comptes" class="btn btn-primary h-11 rounded-[10px] px-5 text-sm">Voir les comptes</NuxtLink>
          <button type="button" class="btn btn-outline h-11 rounded-[10px] px-5 text-sm" @click="resultat = null; form.prenom = ''; form.nom = ''; form.email = ''">Inviter une autre personne</button>
        </div>
      </div>
    </div>

    <form v-else class="flex items-start gap-5 px-8 pt-7 pb-9" novalidate @submit.prevent="envoyer">
      <div class="flex min-w-0 flex-1 flex-col gap-5">
        <div class="card p-7">
          <h3 class="mb-[22px] text-[17px] font-semibold text-navy-600">Identité</h3>
          <div class="mb-5 grid grid-cols-2 gap-5">
            <div><label class="mb-2 block text-sm font-semibold text-navy-600">Prénom</label><input v-model="form.prenom" class="field h-11 text-[15px]" required ></div>
            <div><label class="mb-2 block text-sm font-semibold text-navy-600">Nom</label><input v-model="form.nom" class="field h-11 text-[15px]" required ></div>
          </div>
          <div class="grid grid-cols-[1.4fr_1fr] gap-5">
            <div>
              <label class="mb-2 block text-sm font-semibold text-navy-600">Adresse email professionnelle</label>
              <div class="relative">
                <input v-model="form.email" type="email" class="field h-11 pr-11 text-[15px]" placeholder="prenom.nom@feexpay.me" required >
                <UiIcon v-if="emailValide" name="check-circle-outline" :size="18" class="absolute top-1/2 right-3.5 -translate-y-1/2 text-green-600" />
              </div>
              <p class="mt-2 text-[13px] leading-[1.4] text-gray-500">Seuls les domaines feexpay.me et bigfiveabidjan.com sont acceptés.</p>
            </div>
            <div><label class="mb-2 block text-sm font-semibold text-navy-600">Équipe</label><input v-model="form.team" class="field h-11 text-[15px]" placeholder="Commerciale — Côte d’Ivoire" ></div>
          </div>
        </div>

        <div class="card p-7">
          <h3 class="mb-1.5 text-[17px] font-semibold text-navy-600">Rôle</h3>
          <p class="mb-5 text-sm leading-[1.5] text-gray-500">Un seul rôle par compte. Le périmètre s’affiche sous la sélection et ne se modifie pas au cas par cas.</p>
          <div class="flex flex-col gap-3">
            <label v-for="r in ROLES" :key="r.code" class="flex cursor-pointer items-start gap-4 rounded-xl border-[1.5px] px-5 py-[18px]" :class="form.role === r.code ? 'border-orange-600 bg-orange-50 shadow-[0_0_0_3px_#FDEBDE]' : 'border-gray-200 hover:border-navy-300'">
              <input v-model="form.role" type="radio" name="role" :value="r.code" class="sr-only" >
              <span class="mt-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full" :class="form.role === r.code ? 'bg-orange-600 text-white' : 'border-[1.5px] border-gray-300'"><UiIcon v-if="form.role === r.code" name="check" :size="14" /></span>
              <span><span class="mb-1 block text-[15px] font-semibold text-navy-600">{{ r.nom }}</span><span class="block text-sm leading-[1.5] text-gray-600">{{ r.texte }}</span></span>
            </label>
          </div>
        </div>

        <div class="card p-7">
          <h3 class="mb-5 text-[17px] font-semibold text-navy-600">Réglages du compte</h3>
          <label class="flex items-center gap-5 border-b border-gray-100 py-4">
            <span class="flex-1"><span class="block text-[15px] font-medium text-navy-600">Double authentification obligatoire</span><span class="block text-[13px] leading-[1.45] text-gray-500">Imposée pour les rôles Analyste et Administrateur, activable pour les autres.</span></span>
            <input v-model="form.mfa_required" type="checkbox" class="sr-only" :disabled="mfaImposee" >
            <span class="inline-flex h-[26px] w-11 shrink-0 items-center rounded-full px-[3px] transition-colors" :class="form.mfa_required || mfaImposee ? 'justify-end bg-green-600' : 'bg-gray-300'"><span class="h-5 w-5 rounded-full bg-white" /></span>
          </label>
          <label class="flex items-center gap-5 border-b border-gray-100 py-4">
            <span class="flex-1"><span class="block text-[15px] font-medium text-navy-600">Restreindre au périmètre géographique de l’équipe</span><span class="block text-[13px] leading-[1.45] text-gray-500">Ce compte ne verra que les participations rattachées à son pays.</span></span>
            <input v-model="form.geo_restricted" type="checkbox" class="sr-only" >
            <span class="inline-flex h-[26px] w-11 shrink-0 items-center rounded-full px-[3px] transition-colors" :class="form.geo_restricted ? 'justify-end bg-green-600' : 'bg-gray-300'"><span class="h-5 w-5 rounded-full bg-white" /></span>
          </label>
          <label class="flex items-center gap-5 border-b border-gray-100 py-4">
            <span class="flex-1"><span class="block text-[15px] font-medium text-navy-600">Autoriser l’export de données personnelles</span><span class="block text-[13px] leading-[1.45] text-gray-500">Chaque export est journalisé avec le nom du compte et l’horodatage.</span></span>
            <input v-model="form.export_allowed" type="checkbox" class="sr-only" >
            <span class="inline-flex h-[26px] w-11 shrink-0 items-center rounded-full px-[3px] transition-colors" :class="form.export_allowed ? 'justify-end bg-green-600' : 'bg-gray-300'"><span class="h-5 w-5 rounded-full bg-white" /></span>
          </label>
          <div class="flex items-center gap-5 py-4">
            <span class="flex-1"><span class="block text-[15px] font-medium text-navy-600">Expiration de l’invitation</span><span class="block text-[13px] leading-[1.45] text-gray-500">Passé ce délai, le lien devient inutilisable et l’invitation doit être renvoyée.</span></span>
            <span class="flex h-11 w-[150px] items-center rounded-[10px] border-[1.5px] border-gray-300 px-3.5 text-sm font-medium text-navy-600">7 jours</span>
          </div>
        </div>
      </div>

      <div class="flex w-[360px] shrink-0 flex-col gap-5">
        <div class="card p-6">
          <p class="eyebrow mb-4 text-gray-500">Périmètre accordé</p>
          <ul class="flex flex-col gap-[11px]">
            <li v-for="[nom, ok] in perimetre" :key="nom" class="flex items-start gap-2.5"><UiIcon :name="ok ? 'check' : 'close'" :size="18" class="shrink-0" :class="ok ? 'text-green-600' : 'text-red-600'" /><span class="text-sm leading-[1.5]" :class="ok ? 'text-gray-700' : 'text-gray-400'">{{ nom }}</span></li>
          </ul>
        </div>
        <div class="rounded-[14px] border border-navy-100 bg-navy-50 p-6">
          <p class="eyebrow mb-3 text-navy-600">Ce qui se passe ensuite</p>
          <ol class="flex flex-col gap-3.5">
            <li v-for="(t, i) in ['Un email d’invitation part immédiatement.', 'La personne définit son mot de passe et sa double authentification.', 'Le compte apparaît comme actif dans la liste, avec la trace de qui l’a invité.']" :key="t" class="flex gap-3"><span class="inline-flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-white text-[13px] font-semibold text-navy-600">{{ i + 1 }}</span><span class="text-sm leading-[1.5] text-gray-700">{{ t }}</span></li>
          </ol>
        </div>
        <div class="card flex flex-col gap-2.5 p-6">
          <p v-if="erreur" class="rounded-[10px] bg-red-100 px-3.5 py-3 text-[13px] text-red-600" role="alert">{{ erreur }}</p>
          <button type="submit" :disabled="envoi || !emailValide || !form.prenom || !form.nom" class="btn btn-primary h-12 rounded-[10px] text-[15px]"><UiIcon name="email-fast-outline" :size="18" />{{ envoi ? 'Envoi…' : 'Envoyer l’invitation' }}</button>
          <NuxtLink to="/admin/comptes" class="btn btn-outline h-12 rounded-[10px] text-[15px]">Annuler</NuxtLink>
          <p class="mt-1.5 text-xs leading-[1.5] text-gray-500">Le lien d’invitation vous est aussi affiché après l’envoi, pour le transmettre vous-même si l’email n’aboutit pas.</p>
        </div>
      </div>
    </form>
  </div>
</template>
