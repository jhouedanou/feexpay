<script setup lang="ts">
// Page d'erreur à la charte (état A08 « ce qui est attendu, pourquoi rien ne s'affiche, la
// seule action qui débloque ») : résultat expiré, rapport introuvable, page absente, panne.
import type { NuxtError } from '#app'
const props = defineProps<{ error: NuxtError }>()
const code = computed(() => props.error.statusCode ?? 500)
const { horsLigne } = useHorsLigne()
onMounted(() => {
  horsLigne.value = !navigator.onLine
  window.addEventListener('online', () => (horsLigne.value = false))
  window.addEventListener('offline', () => (horsLigne.value = true))
})
const titre = computed(() => {
  if (horsLigne.value) return 'Vous êtes hors ligne'
  if (code.value === 404) return props.error.statusMessage && !/^page not found/i.test(props.error.statusMessage) ? props.error.statusMessage : 'Cette page n’existe pas'
  return 'Une erreur est survenue'
})
const texte = computed(() => {
  const m = props.error.statusMessage ?? ''
  // Coupure réseau : rien n'est perdu, les réponses attendent sur l'appareil.
  if (horsLigne.value || m === 'REPONSES_EN_ATTENTE') {
    return 'Votre appareil est hors ligne. Vos réponses sont conservées ici et seront envoyées dès le retour du réseau : reprenez là où vous en étiez.'
  }
  if (/expir/i.test(m)) return 'Le lien de résultat n’est plus valide : la session expire après sept jours sans activité. Vous pouvez refaire le diagnostic en quelques minutes.'
  if (/rapport/i.test(m)) return 'Ce lien de rapport n’est plus actif. Si un rapport vous a été renvoyé, utilisez le lien du dernier email reçu.'
  if (code.value === 404) return 'L’adresse demandée ne correspond à aucun écran de Radar by FeexPay.'
  return 'Nos serveurs n’ont pas répondu. Vos réponses déjà enregistrées sont conservées : réessayez dans un instant.'
})
useSeoMeta({ title: () => `${titre.value} — Radar by FeexPay`, robots: 'noindex' })
const retour = () => clearError({ redirect: '/' })
const refaire = () => clearError({ redirect: '/diagnostic' })
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-white">
    <RadarTopBar back="/" />
    <main class="flex flex-1 flex-col items-center justify-center px-5 py-12 text-center md:px-10">
      <span class="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-navy-50 text-navy-600"><UiIcon :name="code === 404 ? 'compass-outline' : 'alert-circle-outline'" :size="32" /></span>
      <p class="eyebrow mb-3 text-orange-600">{{ code === 404 ? 'Lien introuvable' : `Erreur ${code}` }}</p>
      <h1 class="mb-3 max-w-[560px] text-[28px] leading-[1.2] font-semibold text-navy-600 md:text-[34px]">{{ titre }}</h1>
      <p class="mb-8 max-w-[520px] text-base leading-[1.6] text-gray-600">{{ texte }}</p>
      <div class="flex w-full max-w-[420px] flex-col gap-3 md:flex-row md:justify-center">
        <button type="button" class="btn btn-primary h-[52px] flex-1 rounded-xl text-base" @click="refaire">{{ code === 404 ? 'Commencer un diagnostic' : 'Réessayer' }}</button>
        <button type="button" class="btn btn-outline h-[52px] flex-1 rounded-xl text-base" @click="retour">Retour à l’accueil</button>
      </div>
    </main>
    <footer class="bg-navy-600 px-5 py-5">
      <div class="wrap flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="h-5 w-auto" >
        <div class="flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-navy-100">
          <NuxtLink to="/politique-de-confidentialite" class="hover:text-white">Politique de confidentialité</NuxtLink>
          <NuxtLink to="/mentions-legales" class="hover:text-white">Mentions légales</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
