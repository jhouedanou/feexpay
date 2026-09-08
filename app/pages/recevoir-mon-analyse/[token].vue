<script setup lang="ts">
/**
 * P10 — la seule page qui demande une saisie. Le résultat est déjà acquis et affiché :
 * ce formulaire ne conditionne que l'analyse complète.
 * Vocabulaire : la maquette proscrit les mots « collecte » et « coordonnées ».
 */
const route = useRoute()
const token = route.params.token as string

const SECTEURS = [
  'Commerce de détail',
  'Restauration',
  'Services aux entreprises',
  'Artisanat',
  'Santé et bien-être',
  'Éducation et formation',
  'Transport et logistique',
  'Agriculture et agroalimentaire',
  'Technologie',
  'Autre',
]
const TAILLES = ['Seul', '2 à 5', '6 à 20', '21 à 50', 'Plus de 50'] as const

const form = reactive({
  prenom: '',
  nom: '',
  email: '',
  phone: '',
  entreprise: '',
  secteur: '',
  secteurAutre: '',
  taille: '' as (typeof TAILLES)[number] | '',
})
const consent = ref(false)
const envoi = ref(false)
const erreur = ref<string | null>(null)
const erreurs = reactive<Record<string, string>>({})

/** Une clé par montage de page : un double clic ne crée pas deux rapports. */
const idempotencyKey = useState(`lead-key-${token}`, () => crypto.randomUUID())

useSeoMeta({ title: 'Recevoir mon analyse — Radar by FeexPay' })

function valider() {
  for (const k of Object.keys(erreurs)) delete erreurs[k]
  if (!form.prenom.trim()) erreurs.prenom = 'Champ requis.'
  if (!form.nom.trim()) erreurs.nom = 'Champ requis.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    erreurs.email = 'Veuillez saisir une adresse email valide.'
  }
  if (!/^\+[1-9][0-9]{6,14}$/.test(form.phone.trim())) {
    erreurs.phone = 'Numéro au format international, par exemple +225 07 00 00 00 00.'
  }
  if (!form.entreprise.trim()) erreurs.entreprise = 'Champ requis.'
  if (!form.secteur) erreurs.secteur = 'Champ requis.'
  if (form.secteur === 'Autre' && !form.secteurAutre.trim()) {
    erreurs.secteurAutre = 'Précisez votre secteur.'
  }
  if (!form.taille) erreurs.taille = 'Champ requis.'
  if (!consent.value) erreurs.consent = 'Votre accord est nécessaire pour vous envoyer l’analyse.'
  return Object.keys(erreurs).length === 0
}

async function envoyer() {
  if (envoi.value || !valider()) return
  envoi.value = true
  erreur.value = null
  try {
    const r = await $fetch<{ reportToken: string }>('/api/public/leads', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey.value },
      body: {
        participationToken: token,
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim(),
        phone: form.phone.replace(/\s/g, ''),
        entreprise: form.entreprise.trim(),
        secteur: form.secteur,
        secteurAutre: form.secteur === 'Autre' ? form.secteurAutre.trim() : undefined,
        taille: form.taille,
      },
    })
    await navigateTo(`/confirmation/${r.reportToken}`)
  } catch (e: unknown) {
    const err = e as { data?: { data?: { message?: string } } }
    erreur.value = err?.data?.data?.message ?? 'L’envoi a échoué. Réessayez dans un instant.'
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <section class="mx-auto max-w-[760px] px-5 py-12 md:px-8">
    <p class="type-eyebrow">Recevoir mon analyse</p>
    <p class="mt-2 type-caption text-gray-500">Dernière étape</p>
    <h1 class="mt-2 type-h1">Où souhaitez-vous recevoir votre rapport ?</h1>
    <p class="mt-4 text-[17px] leading-[1.6] text-gray-600">
      Six champs, une minute. Votre rapport part immédiatement après l’envoi.
    </p>

    <form class="mt-9 space-y-5" novalidate @submit.prevent="envoyer">
      <div class="grid gap-5 sm:grid-cols-2">
        <UiField label="Prénom" required :error="erreurs.prenom">
          <input v-model="form.prenom" type="text" autocomplete="given-name" class="fx-input" >
        </UiField>
        <UiField label="Nom" required :error="erreurs.nom">
          <input v-model="form.nom" type="text" autocomplete="family-name" class="fx-input" >
        </UiField>
      </div>

      <UiField label="Email" required :error="erreurs.email">
        <input v-model="form.email" type="email" autocomplete="email" class="fx-input" >
      </UiField>

      <UiField
        label="Téléphone ou WhatsApp"
        required
        :error="erreurs.phone"
        hint="Format international, par exemple +225 07 00 00 00 00"
      >
        <input v-model="form.phone" type="tel" autocomplete="tel" class="fx-input" >
      </UiField>

      <UiField label="Entreprise ou activité" required :error="erreurs.entreprise">
        <input v-model="form.entreprise" type="text" autocomplete="organization" class="fx-input" >
      </UiField>

      <UiField label="Secteur d’activité" required :error="erreurs.secteur">
        <select v-model="form.secteur" class="fx-input">
          <option value="" disabled>Choisissez un secteur</option>
          <option v-for="s in SECTEURS" :key="s" :value="s">{{ s }}</option>
        </select>
      </UiField>

      <UiField v-if="form.secteur === 'Autre'" label="Précisez" required :error="erreurs.secteurAutre">
        <input v-model="form.secteurAutre" type="text" class="fx-input" >
      </UiField>

      <fieldset>
        <legend class="type-small font-semibold text-navy-700">
          Taille de l’activité <span class="text-orange-600">*</span>
        </legend>
        <div class="mt-3 flex flex-wrap gap-2">
          <label
            v-for="t in TAILLES"
            :key="t"
            class="cursor-pointer border px-4 py-2.5 type-small"
            :class="
              form.taille === t
                ? 'border-orange-600 bg-orange-50 font-medium text-navy-600'
                : 'border-gray-300 text-gray-700 hover:border-navy-300'
            "
            style="border-radius: var(--radius-control)"
          >
            <input v-model="form.taille" type="radio" :value="t" class="sr-only" >
            {{ t }}
          </label>
        </div>
        <p v-if="erreurs.taille" class="mt-1.5 type-caption text-red-600">{{ erreurs.taille }}</p>
      </fieldset>

      <label class="flex items-start gap-3">
        <input v-model="consent" type="checkbox" class="mt-1 h-5 w-5 accent-orange-600" >
        <span class="type-small text-gray-700">
          J’accepte que mes informations soient utilisées pour m’envoyer cette analyse,
          conformément à la
          <NuxtLink to="/confidentialite" class="text-orange-600 underline">
            politique de confidentialité </NuxtLink>. <span class="text-orange-600">*</span>
        </span>
      </label>
      <p v-if="erreurs.consent" class="type-caption text-red-600">{{ erreurs.consent }}</p>

      <p
        v-if="erreur"
        class="bg-red-100 p-4 type-small text-red-600"
        style="border-radius: var(--radius-control)"
        role="alert"
      >
        {{ erreur }}
      </p>

      <button
        type="submit"
        :disabled="envoi"
        class="inline-flex w-full items-center justify-center bg-orange-600 px-7 font-semibold text-white hover:bg-orange-700 active:bg-orange-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        style="min-height: var(--control-h-mobile); border-radius: var(--radius-control)"
      >
        {{ envoi ? 'Envoi en cours…' : 'Recevoir mon analyse' }}
      </button>
    </form>
  </section>
</template>

<style scoped>
.fx-input {
  width: 100%;
  height: var(--field-h);
  padding: 0 16px;
  border: 1.5px solid var(--color-gray-300);
  border-radius: var(--radius-answer);
  font-size: 16px; /* jamais moins : évite le zoom automatique sur iOS */
  color: var(--color-gray-900);
  background: #fff;
}
.fx-input:hover {
  border-color: var(--color-navy-300);
}
</style>
