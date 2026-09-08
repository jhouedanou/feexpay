<script setup lang="ts">
// Double authentification (CDC E.1) : enrôlement TOTP au premier passage, vérification
// ensuite, code de récupération en secours. Même composition que A01.
definePageMeta({ layout: false, middleware: 'admin' })
useSeoMeta({ title: 'Double authentification — Administration Radar by FeexPay', robots: 'noindex' })

const { me, charger } = useAdmin()
const mode = ref<'verifier' | 'enroler' | 'recuperation' | 'codes'>('verifier')
const enrolement = ref<{ factorId: string; secret: string; qr: string } | null>(null)
const code = ref('')
const recup = ref('')
const codes = ref<string[]>([])
const erreur = ref<string | null>(null)
const envoi = ref(false)

onMounted(async () => {
  if (!me.value) await charger()
  if (me.value && !me.value.mfa.enrolee) await demarrerEnrolement()
})

async function demarrerEnrolement() {
  erreur.value = null
  try {
    enrolement.value = await apiAdmin<{ factorId: string; secret: string; qr: string }>('/api/admin/auth/2fa/enroll', { method: 'POST' })
    mode.value = 'enroler'
  } catch (e) {
    erreur.value = messageErreur(e)
  }
}

async function verifier() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    const r = await apiAdmin<{ codesRecuperation: string[] | null }>('/api/admin/auth/2fa/verify', {
      method: 'POST',
      body: { code: code.value.trim(), factorId: mode.value === 'enroler' ? enrolement.value?.factorId : undefined },
    })
    await charger()
    if (r.codesRecuperation) {
      codes.value = r.codesRecuperation
      mode.value = 'codes'
    } else {
      await navigateTo('/admin')
    }
  } catch (e) {
    erreur.value = messageErreur(e, 'Code incorrect.')
  } finally {
    envoi.value = false
  }
}

async function recuperer() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    await apiAdmin('/api/admin/auth/2fa/recovery', { method: 'POST', body: { code: recup.value.trim() } })
    await charger()
    await demarrerEnrolement()
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
        <p class="mb-3.5 text-[32px] leading-[1.2] font-semibold tracking-[-0.02em] text-white">Double authentification</p>
        <p class="max-w-[340px] text-[15px] leading-[1.6] text-navy-200">Obligatoire pour les rôles Analyste et Administrateur. Une application d’authentification (Google Authenticator, Authy, 1Password) génère le code.</p>
      </div>
      <p class="text-xs leading-[1.5] text-navy-300">Powered by FeexPay · moteur version 2.1</p>
    </aside>
    <main class="flex flex-1 items-center justify-center p-6 lg:p-12">
      <div class="w-full max-w-[420px]">
        <!-- Enrôlement -->
        <template v-if="mode === 'enroler' && enrolement">
          <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Activer votre second facteur</h1>
          <p class="mb-6 text-[15px] leading-[1.55] text-gray-500">Scannez ce code avec votre application d’authentification, puis saisissez le code à six chiffres qu’elle affiche.</p>
          <div class="mb-5 flex items-start gap-5 rounded-[14px] border border-gray-200 p-5">
            <img :src="enrolement.qr" alt="Code à scanner" class="h-40 w-40 shrink-0" >
            <div class="min-w-0">
              <p class="eyebrow mb-2 text-gray-500">Clé manuelle</p>
              <p class="font-mono text-sm break-all text-navy-600">{{ enrolement.secret }}</p>
            </div>
          </div>
          <form novalidate @submit.prevent="verifier">
            <label for="code" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Code à six chiffres</label>
            <input id="code" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" class="field mb-2 h-11 font-mono text-lg tracking-[0.3em]" :class="{ 'field-error': erreur }" >
            <p v-if="erreur" class="mb-3 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
            <button type="submit" :disabled="envoi || code.length !== 6" class="btn btn-primary mt-3 h-11 w-full rounded-[10px] text-[15px]">Activer et continuer</button>
          </form>
        </template>

        <!-- Codes de récupération, remis une seule fois -->
        <template v-else-if="mode === 'codes'">
          <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Vos codes de récupération</h1>
          <p class="mb-5 text-[15px] leading-[1.55] text-gray-500">Chaque code n’est utilisable qu’une fois, si vous perdez l’accès à votre application. Ils ne seront plus affichés : conservez-les en lieu sûr.</p>
          <div class="mb-6 grid grid-cols-2 gap-2 rounded-[14px] border border-gray-200 bg-gray-50 p-5 font-mono text-sm text-navy-600">
            <span v-for="c in codes" :key="c">{{ c }}</span>
          </div>
          <NuxtLink to="/admin" class="btn btn-primary h-11 w-full rounded-[10px] text-[15px]">J’ai enregistré mes codes</NuxtLink>
        </template>

        <!-- Code de récupération -->
        <template v-else-if="mode === 'recuperation'">
          <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Code de récupération</h1>
          <p class="mb-6 text-[15px] leading-[1.55] text-gray-500">Saisissez l’un de vos dix codes. Votre second facteur sera réinitialisé et vous le réenrôlerez juste après.</p>
          <form novalidate @submit.prevent="recuperer">
            <input v-model="recup" class="field mb-2 h-11 font-mono" placeholder="xxxxx-xxxxx" :class="{ 'field-error': erreur }" >
            <p v-if="erreur" class="mb-3 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
            <button type="submit" :disabled="envoi" class="btn btn-primary mt-3 mb-4 h-11 w-full rounded-[10px] text-[15px]">Utiliser ce code</button>
          </form>
          <button type="button" class="text-[13px] text-orange-600 hover:underline" @click="mode = 'verifier'">Revenir à la saisie du code</button>
        </template>

        <!-- Vérification -->
        <template v-else>
          <h1 class="mb-2 text-[28px] leading-[1.2] font-semibold tracking-[-0.015em] text-navy-600">Second facteur</h1>
          <p class="mb-6 text-[15px] leading-[1.55] text-gray-500">Saisissez le code affiché par votre application d’authentification.</p>
          <form novalidate @submit.prevent="verifier">
            <label for="code2" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Code à six chiffres</label>
            <input id="code2" v-model="code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" class="field mb-2 h-11 font-mono text-lg tracking-[0.3em]" :class="{ 'field-error': erreur }" >
            <p v-if="erreur" class="mb-3 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
            <button type="submit" :disabled="envoi || code.length !== 6" class="btn btn-primary mt-3 mb-4 h-11 w-full rounded-[10px] text-[15px]">Vérifier</button>
          </form>
          <p class="text-center text-[13px] leading-[1.5] text-gray-500">Application indisponible ? <button type="button" class="text-orange-600 hover:underline" @click="mode = 'recuperation'">Utiliser un code de récupération</button></p>
        </template>
      </div>
    </main>
  </div>
</template>
