<script setup lang="ts">
// Choix du nouveau mot de passe depuis le lien reçu par email. Même gabarit que
// l'acceptation d'invitation : la politique CDC E.1 (12 caractères, contrôle HIBP) est
// appliquée côté serveur, l'écran ne fait qu'annoncer la règle et écarter les fautes
// de frappe évidentes.
definePageMeta({ layout: false })
useSeoMeta({ title: 'Nouveau mot de passe — Administration Radar by FeexPay', robots: 'noindex' })

const route = useRoute()
const token = route.params.token as string
const { data: reset, error } = await useFetch<any>(`/api/admin/auth/reset/${token}`)

const password = ref('')
const confirmation = ref('')
const voir = ref(false)
const erreur = ref<string | null>(null)
const envoi = ref(false)
const fait = ref(false)

async function valider() {
  if (envoi.value) return
  erreur.value = null
  if (password.value !== confirmation.value) return (erreur.value = 'Les deux mots de passe diffèrent.')
  if (password.value.length < 12) return (erreur.value = 'Le mot de passe doit compter au moins 12 caractères.')
  envoi.value = true
  try {
    await apiAdmin('/api/admin/auth/reset/confirm', { method: 'POST', body: { token, password: password.value } })
    fait.value = true
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
        <p class="mb-3.5 text-[32px] leading-[1.2] font-semibold tracking-[-0.02em] text-white">Choisir un nouveau mot de passe</p>
        <p class="max-w-[340px] text-[15px] leading-[1.6] text-navy-200">Au moins 12 caractères, et un mot de passe qui ne figure pas dans les fuites de données connues. Vos sessions ouvertes seront fermées.</p>
      </div>
      <p class="text-xs leading-[1.5] text-navy-300">Powered by FeexPay</p>
    </aside>

    <main class="flex flex-1 items-center justify-center p-6 lg:p-12">
      <!-- Lien expiré, déjà utilisé ou introuvable -->
      <div v-if="error" class="w-full max-w-[380px]">
        <span class="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"><UiIcon name="alert-circle-outline" :size="24" /></span>
        <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Ce lien n’est plus valable</h1>
        <p class="mb-7 text-[15px] leading-[1.55] text-gray-500">{{ messageErreur(error, 'Le lien a expiré ou a déjà servi. Les liens de réinitialisation ne valent qu’une heure et ne servent qu’une fois.') }}</p>
        <NuxtLink to="/admin/mot-de-passe-oublie" class="btn btn-primary h-11 w-full rounded-[10px] text-[15px]">Demander un nouveau lien</NuxtLink>
      </div>

      <div v-else-if="fait" class="w-full max-w-[380px]">
        <span class="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"><UiIcon name="check" :size="24" /></span>
        <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Mot de passe modifié</h1>
        <p class="mb-7 text-[15px] leading-[1.55] text-gray-500">Toutes vos sessions ont été fermées. Connectez-vous avec votre nouveau mot de passe ; votre double authentification vous sera demandée comme d’habitude.</p>
        <NuxtLink to="/admin/connexion" class="btn btn-primary h-11 w-full rounded-[10px] text-[15px]">Se connecter</NuxtLink>
      </div>

      <form v-else class="w-full max-w-[380px]" novalidate @submit.prevent="valider">
        <img src="/brand/logo-feexpay.svg" alt="FeexPay" class="mb-8 h-6 w-auto lg:hidden" >
        <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Nouveau mot de passe</h1>
        <p class="mb-7 text-[15px] leading-[1.55] text-gray-500">Bonjour {{ reset?.prenom }}, choisissez un mot de passe d’au moins 12 caractères.</p>
        <div class="mb-6 flex flex-col gap-[18px]">
          <div>
            <label for="password" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Nouveau mot de passe</label>
            <div class="relative">
              <input id="password" v-model="password" :type="voir ? 'text' : 'password'" autocomplete="new-password" class="field h-11 pr-11 text-[15px]" :class="{ 'field-error': erreur }" required >
              <button type="button" class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" :aria-label="voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" @click="voir = !voir">
                <UiIcon :name="voir ? 'eye-outline' : 'eye-off-outline'" :size="20" />
              </button>
            </div>
          </div>
          <div>
            <label for="confirmation" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Confirmer le mot de passe</label>
            <input id="confirmation" v-model="confirmation" :type="voir ? 'text' : 'password'" autocomplete="new-password" class="field h-11 text-[15px]" :class="{ 'field-error': erreur }" required >
            <p v-if="erreur" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
          </div>
        </div>
        <button type="submit" :disabled="envoi" class="btn btn-primary mb-[18px] h-11 w-full rounded-[10px] text-[15px]">{{ envoi ? 'Enregistrement…' : 'Enregistrer le mot de passe' }}</button>
        <p class="text-center text-[13px] leading-[1.5] text-gray-500"><NuxtLink to="/admin/connexion" class="text-orange-600 hover:underline">Retour à la connexion</NuxtLink></p>
      </form>
    </main>
  </div>
</template>
