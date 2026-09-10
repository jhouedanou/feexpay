<script setup lang="ts">
// Confirmation d'une demande de suppression. C'est ici que la demande devient réelle : tant
// que ce lien n'est pas ouvert, rien n'est engagé.
useSeoMeta({ title: 'Confirmer la suppression — Radar by FeexPay', robots: 'noindex' })

const route = useRoute()
const token = route.params.token as string
const { data: demande, error } = await useFetch<any>(`/api/public/deletions/${token}`)

const envoi = ref(false)
const fait = ref(false)
const erreur = ref<string | null>(null)

async function confirmer() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    await $fetch(`/api/public/deletions/${token}/confirmer`, { method: 'POST' })
    fait.value = true
  } catch (e) {
    const err = e as { data?: { data?: { message?: string } } }
    erreur.value = err?.data?.data?.message ?? 'Confirmation impossible. Réessayez dans un instant.'
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <div class="wrap py-10 lg:!px-6 lg:py-16">
    <div class="mx-auto max-w-[640px]">
      <!-- Lien expiré, déjà utilisé ou introuvable -->
      <template v-if="error">
        <span class="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600"><UiIcon name="alert-circle-outline" :size="24" /></span>
        <h1 class="mb-3 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-navy-600 lg:text-[38px]">Ce lien n’est plus valable</h1>
        <p class="mb-7 text-base leading-[1.65] text-gray-600">
          Les liens de confirmation valent vingt-quatre heures et ne servent qu’une fois. Faites une nouvelle demande si vous souhaitez toujours supprimer vos données.
        </p>
        <NuxtLink to="/supprimer-mes-donnees" class="btn btn-primary h-12 rounded-[10px] px-6 text-[15px]">Faire une nouvelle demande</NuxtLink>
      </template>

      <template v-else-if="fait">
        <span class="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"><UiIcon name="check" :size="24" /></span>
        <h1 class="mb-3 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-navy-600 lg:text-[38px]">Demande confirmée</h1>
        <p class="mb-7 text-base leading-[1.65] text-gray-600">
          Elle est transmise à l’équipe FeexPay, qui la traite sous un mois au plus, comme la réglementation l’exige. Vos rapports cesseront alors d’être consultables.
          Pour toute question : <a href="mailto:donnees@feexpay.me" class="text-orange-600 hover:underline">donnees@feexpay.me</a>.
        </p>
        <NuxtLink to="/" class="btn btn-outline h-12 rounded-[10px] px-6 text-[15px]">Retour à l’accueil</NuxtLink>
      </template>

      <template v-else>
        <h1 class="mb-3.5 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-navy-600 lg:text-[38px]">Confirmer la suppression</h1>
        <p class="mb-6 text-base leading-[1.65] text-gray-600">
          Vous êtes sur le point de demander la suppression des données rattachées à <strong class="font-semibold text-navy-600">{{ demande?.email }}</strong>.
        </p>
        <div class="mb-7 flex items-start gap-3.5 rounded-xl border border-amber-600/25 bg-amber-100 px-5 py-4">
          <UiIcon name="alert-outline" :size="20" class="shrink-0 text-amber-600" />
          <p class="text-sm leading-[1.6] text-gray-700">
            L’opération est définitive. Vos rapports ne seront plus consultables, et les liens déjà reçus par email cesseront de fonctionner.
          </p>
        </div>
        <p v-if="erreur" class="mb-4 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
        <div class="flex flex-col gap-3 sm:flex-row">
          <button type="button" :disabled="envoi" class="btn btn-primary h-[52px] px-7 text-base" @click="confirmer">{{ envoi ? 'Confirmation…' : 'Confirmer la suppression' }}</button>
          <NuxtLink to="/" class="btn btn-outline h-[52px] px-6 text-base">Annuler</NuxtLink>
        </div>
      </template>
    </div>
  </div>
</template>
