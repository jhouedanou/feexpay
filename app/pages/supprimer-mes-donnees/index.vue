<script setup lang="ts">
// Demande de suppression des données (RGPD article 17). La réponse est volontairement la
// même que l'adresse figure dans nos données ou non : ce formulaire est public, il ne doit
// pas permettre de découvrir qui a fait le diagnostic.
useSeoMeta({ title: 'Supprimer mes données — Radar by FeexPay', robots: 'noindex' })

const email = ref('')
const envoi = ref(false)
const envoye = ref(false)
const erreur = ref<string | null>(null)

async function demander() {
  if (envoi.value) return
  envoi.value = true
  erreur.value = null
  try {
    await $fetch('/api/public/deletions', { method: 'POST', body: { email: email.value.trim() } })
    envoye.value = true
  } catch (e) {
    const err = e as { data?: { data?: { message?: string } } }
    erreur.value = err?.data?.data?.message ?? 'Demande impossible pour le moment. Réessayez dans un instant.'
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <div class="wrap py-10 lg:!px-6 lg:py-16">
    <div class="mx-auto max-w-[640px]">
      <p class="mb-3 text-[13px] leading-[1.3] text-gray-500"><NuxtLink to="/" class="hover:text-navy-600">Accueil</NuxtLink> <span class="text-gray-300">/</span> Supprimer mes données</p>

      <template v-if="envoye">
        <span class="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600"><UiIcon name="email-check-outline" :size="24" /></span>
        <h1 class="mb-3 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-navy-600 lg:text-[38px]">Vérifiez votre boîte mail</h1>
        <p class="mb-7 text-base leading-[1.65] text-gray-600">
          Si cette adresse figure dans nos données, un lien de confirmation vient d’être envoyé. Il est valable vingt-quatre heures et ne sert qu’une fois.
          Tant qu’il n’est pas ouvert, rien n’est supprimé — c’est ce qui empêche qu’une demande soit faite à votre place.
        </p>
        <NuxtLink to="/" class="btn btn-outline h-12 rounded-[10px] px-6 text-[15px]">Retour à l’accueil</NuxtLink>
      </template>

      <template v-else>
        <h1 class="mb-3.5 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-navy-600 lg:text-[40px]">Supprimer mes données</h1>
        <p class="mb-7 text-base leading-[1.65] text-gray-600">
          Indiquez l’adresse email avec laquelle vous avez reçu votre analyse. Vous recevrez un lien de confirmation : la suppression n’est engagée qu’une fois ce lien ouvert.
        </p>

        <div class="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-5 lg:p-6">
          <p class="eyebrow mb-3.5 text-gray-500">Ce qui est supprimé</p>
          <ul class="mb-4 flex flex-col gap-2.5">
            <li v-for="t in ['Votre prénom, votre nom, votre adresse email et votre téléphone', 'Le nom de votre entreprise, son secteur et sa taille', 'Vos rapports, qui cessent d’être consultables', 'Les notes internes vous concernant']" :key="t" class="flex items-start gap-2.5">
              <UiIcon name="check" :size="18" class="shrink-0 text-orange-600" />
              <span class="text-[15px] leading-[1.5] text-gray-700">{{ t }}</span>
            </li>
          </ul>
          <p class="eyebrow mb-2.5 text-gray-500">Ce qui reste</p>
          <p class="text-[15px] leading-[1.55] text-gray-600">
            Vos réponses au questionnaire et les résultats calculés, sans aucun lien avec vous, pour la mesure du service. Ainsi que la trace de la demande elle-même, que la réglementation nous impose de conserver.
          </p>
        </div>

        <form novalidate @submit.prevent="demander">
          <label for="email" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Adresse email</label>
          <input id="email" v-model="email" type="email" autocomplete="email" placeholder="vous@exemple.ci" class="field mb-2 h-12 text-base" :class="{ 'field-error': erreur }" required >
          <p v-if="erreur" class="mb-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
          <button type="submit" :disabled="envoi" class="btn btn-primary mt-3 h-[52px] px-7 text-base">{{ envoi ? 'Envoi…' : 'Demander la suppression' }}</button>
        </form>

        <p class="mt-7 text-[13px] leading-[1.55] text-gray-500">
          Une question sur vos données ? Écrivez à <a href="mailto:donnees@feexpay.me" class="text-orange-600 hover:underline">donnees@feexpay.me</a>.
          Le détail des traitements figure dans la <NuxtLink to="/politique-de-confidentialite" class="text-orange-600 hover:underline">politique de confidentialité</NuxtLink>.
        </p>
      </template>
    </div>
  </div>
</template>
