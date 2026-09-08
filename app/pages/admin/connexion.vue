<script setup lang="ts">
// A01 — connexion (docs/maquette/frames/admin-1440-A01.html). Deux colonnes : bleu nuit à
// gauche, formulaire de 380 px à droite. Après le mot de passe, redirection vers /admin/2fa
// si le second facteur s'impose.
definePageMeta({ layout: false })
useSeoMeta({ title: 'Connexion — Administration Radar by FeexPay', robots: 'noindex' })

const route = useRoute()
const { charger } = useAdmin()
const email = ref('')
const password = ref('')
const voir = ref(false)
const erreur = ref<string | null>(route.query.motif === 'inactif' ? 'Ce compte est suspendu ou révoqué. Contactez l’administrateur.' : null)
const envoi = ref(false)

async function connecter() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    const r = await $fetch<{ mfa: { requise: boolean; verifiee: boolean } }>('/api/admin/auth/login', {
      method: 'POST',
      body: { email: email.value.trim(), password: password.value },
    })
    await charger()
    const suite = typeof route.query.suite === 'string' && route.query.suite.startsWith('/admin') ? route.query.suite : '/admin'
    await navigateTo(r.mfa.requise && !r.mfa.verifiee ? '/admin/2fa' : suite)
  } catch (e) {
    erreur.value = messageErreur(e, 'Email ou mot de passe incorrect.')
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
      <form class="w-full max-w-[380px]" novalidate @submit.prevent="connecter">
        <img src="/brand/logo-feexpay.svg" alt="FeexPay" class="mb-8 h-6 w-auto lg:hidden" >
        <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Se connecter</h1>
        <p class="mb-7 text-[15px] leading-[1.55] text-gray-500">Utilisez votre adresse professionnelle FeexPay.</p>
        <div class="mb-6 flex flex-col gap-[18px]">
          <div>
            <label for="email" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Adresse email</label>
            <input id="email" v-model="email" type="email" autocomplete="username" placeholder="prenom.nom@feexpay.me" class="field h-11 text-[15px]" required >
          </div>
          <div>
            <label for="password" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Mot de passe</label>
            <div class="relative">
              <input id="password" v-model="password" :type="voir ? 'text' : 'password'" autocomplete="current-password" class="field h-11 pr-11 text-[15px]" :class="{ 'field-error': erreur }" required >
              <button type="button" class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" :aria-label="voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" @click="voir = !voir">
                <UiIcon :name="voir ? 'eye-outline' : 'eye-off-outline'" :size="20" />
              </button>
            </div>
            <p v-if="erreur" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
          </div>
        </div>
        <button type="submit" :disabled="envoi" class="btn btn-primary mb-[18px] h-11 w-full rounded-[10px] text-[15px]">{{ envoi ? 'Connexion…' : 'Se connecter' }}</button>
        <p class="text-center text-[13px] leading-[1.5] text-gray-500">Accès oublié ? <a href="mailto:amedeel@feexpay.me" class="text-orange-600 hover:underline">Contactez l’administrateur</a></p>
      </form>
    </main>
  </div>
</template>
