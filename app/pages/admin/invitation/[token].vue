<script setup lang="ts">
// Acceptation d'une invitation (CDC E.1) : lien à usage unique de sept jours, mot de passe
// défini par l'invité (12 caractères, contrôle HIBP côté serveur), puis second facteur.
definePageMeta({ layout: false })
useSeoMeta({ title: 'Invitation — Administration Radar by FeexPay', robots: 'noindex' })

const route = useRoute()
const token = route.params.token as string
const { data: inv, error } = await useFetch<any>('/api/admin/invitations/preview', { query: { token } })
const { charger } = useAdmin()

const prenom = ref(inv.value?.prenom ?? '')
const nom = ref(inv.value?.nom ?? '')
const password = ref('')
const confirmation = ref('')
const erreur = ref<string | null>(null)
const envoi = ref(false)

const expire = computed(() => (inv.value ? new Date(inv.value.expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : ''))

async function accepter() {
  if (envoi.value) return
  erreur.value = null
  if (password.value !== confirmation.value) return (erreur.value = 'Les deux mots de passe diffèrent.')
  if (password.value.length < 12) return (erreur.value = 'Le mot de passe doit compter au moins 12 caractères.')
  envoi.value = true
  try {
    await $fetch('/api/admin/invitations/accept', { method: 'POST', body: { token, prenom: prenom.value.trim(), nom: nom.value.trim(), password: password.value } })
    await charger()
    await navigateTo(inv.value?.mfa_required ? '/admin/2fa' : '/admin')
  } catch (e) {
    erreur.value = messageErreur(e)
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh bg-white">
    <aside class="hidden w-[520px] shrink-0 flex-col justify-between bg-navy-600 px-12 py-14 lg:flex">
      <img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="h-7 w-auto self-start" >
      <div>
        <p class="eyebrow mb-3 text-orange-300">Espace interne</p>
        <p class="mb-3.5 text-[32px] leading-[1.2] font-semibold tracking-[-0.02em] text-white">Administration Radar by FeexPay</p>
        <p class="max-w-[340px] text-[15px] leading-[1.6] text-navy-200">Consultation des participations, des résultats et des rapports. Accès réservé aux équipes FeexPay.</p>
      </div>
      <p class="text-xs leading-[1.5] text-navy-300">Powered by FeexPay · moteur version 2.1</p>
    </aside>
    <main class="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div class="w-full max-w-[420px]">
        <template v-if="error || !inv">
          <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Invitation expirée</h1>
          <p class="mb-6 text-[15px] leading-[1.55] text-gray-500">{{ messageErreur(error, 'Ce lien n’est plus valable.') }}</p>
          <p class="text-[13px] leading-[1.5] text-gray-500">Demandez une nouvelle invitation à <a href="mailto:amedeel@feexpay.me" class="text-orange-600 hover:underline">l’administrateur</a>.</p>
        </template>
        <form v-else novalidate @submit.prevent="accepter">
          <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Créer votre accès</h1>
          <p class="mb-6 text-[15px] leading-[1.55] text-gray-500">{{ inv.invitant }} vous ouvre un accès <strong class="font-semibold text-navy-600">{{ inv.roleLabel }}</strong> pour {{ inv.email }}. Ce lien expire le {{ expire }}.</p>
          <div class="mb-5 grid grid-cols-2 gap-4">
            <div><label class="mb-2 block text-sm font-semibold text-navy-600">Prénom</label><input v-model="prenom" class="field h-11 text-[15px]" required ></div>
            <div><label class="mb-2 block text-sm font-semibold text-navy-600">Nom</label><input v-model="nom" class="field h-11 text-[15px]" required ></div>
          </div>
          <div class="mb-4">
            <label class="mb-2 block text-sm font-semibold text-navy-600">Mot de passe</label>
            <input v-model="password" type="password" autocomplete="new-password" class="field h-11 text-[15px]" required >
            <p class="mt-2 text-[13px] leading-[1.4] text-gray-500">12 caractères minimum. Les mots de passe figurant dans des fuites connues sont refusés.</p>
          </div>
          <div class="mb-5">
            <label class="mb-2 block text-sm font-semibold text-navy-600">Confirmer le mot de passe</label>
            <input v-model="confirmation" type="password" autocomplete="new-password" class="field h-11 text-[15px]" :class="{ 'field-error': erreur }" required >
            <p v-if="erreur" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
          </div>
          <div v-if="inv.mfa_required" class="mb-5 flex gap-3 rounded-[10px] bg-navy-50 px-4 py-3.5 text-[13px] leading-[1.5] text-gray-700">
            <UiIcon name="shield-check-outline" :size="18" class="shrink-0 text-navy-600" />
            La double authentification est obligatoire pour ce rôle : elle s’active juste après.
          </div>
          <button type="submit" :disabled="envoi" class="btn btn-primary h-11 w-full rounded-[10px] text-[15px]">{{ envoi ? 'Création…' : 'Créer mon accès' }}</button>
        </form>
      </div>
    </main>
  </div>
</template>
