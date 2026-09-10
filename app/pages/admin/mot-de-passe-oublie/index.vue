<script setup lang="ts">
// Demande de réinitialisation. Même gabarit que A01 : bandeau bleu nuit à gauche,
// formulaire de 380 px à droite. La réponse est volontairement la même que l'adresse
// existe ou non — l'écran ne doit pas révéler qui a un accès.
definePageMeta({ layout: false })
useSeoMeta({ title: 'Mot de passe oublié — Administration Radar by FeexPay', robots: 'noindex' })

const email = ref('')
const envoi = ref(false)
const envoye = ref(false)
const erreur = ref<string | null>(null)

async function demander() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    await apiAdmin('/api/admin/auth/reset', { method: 'POST', body: { email: email.value.trim() } })
    envoye.value = true
  } catch (e) {
    erreur.value = messageErreur(e, 'Demande impossible pour le moment. Réessayez dans un instant.')
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
        <p class="mb-3.5 text-[32px] leading-[1.2] font-semibold tracking-[-0.02em] text-white">Reprendre la main sur votre accès</p>
        <p class="max-w-[340px] text-[15px] leading-[1.6] text-navy-200">Le lien reçu par email vous permet de choisir un nouveau mot de passe. Votre double authentification, elle, reste en place.</p>
      </div>
      <p class="text-xs leading-[1.5] text-navy-300">Powered by FeexPay</p>
    </aside>

    <main class="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div v-if="envoye" class="w-full max-w-[380px]">
        <span class="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"><UiIcon name="email-check-outline" :size="24" /></span>
        <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Vérifiez votre boîte mail</h1>
        <p class="mb-7 text-[15px] leading-[1.55] text-gray-500">Si un compte correspond à cette adresse, un lien de réinitialisation vient d’être envoyé. Il est valable une heure et ne sert qu’une fois.</p>
        <NuxtLink to="/admin/connexion" class="btn btn-outline h-11 w-full rounded-[10px] text-[15px]">Retour à la connexion</NuxtLink>
      </div>

      <form v-else class="w-full max-w-[380px]" novalidate @submit.prevent="demander">
        <img src="/brand/logo-feexpay.svg" alt="FeexPay" class="mb-8 h-6 w-auto lg:hidden" >
        <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Mot de passe oublié</h1>
        <p class="mb-7 text-[15px] leading-[1.55] text-gray-500">Indiquez votre adresse professionnelle FeexPay : vous recevrez un lien pour choisir un nouveau mot de passe.</p>
        <div class="mb-6">
          <label for="email" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Adresse email</label>
          <input id="email" v-model="email" type="email" autocomplete="username" placeholder="prenom.nom@feexpay.me" class="field h-11 text-[15px]" :class="{ 'field-error': erreur }" required >
          <p v-if="erreur" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
        </div>
        <button type="submit" :disabled="envoi" class="btn btn-primary mb-[18px] h-11 w-full rounded-[10px] text-[15px]">{{ envoi ? 'Envoi…' : 'Envoyer le lien' }}</button>
        <p class="text-center text-[13px] leading-[1.5] text-gray-500"><NuxtLink to="/admin/connexion" class="text-orange-600 hover:underline">Retour à la connexion</NuxtLink></p>
      </form>
    </main>
  </div>
</template>
