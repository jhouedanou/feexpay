<script setup lang="ts">
/**
 * P10 — la seule page qui demande une saisie. Cadres 390 et 1440. Le résultat est déjà
 * acquis et affiché : ce formulaire ne conditionne que l'analyse complète. L'ordre des
 * champs diffère entre mobile (Nom en premier) et desktop (Prénom en premier), comme
 * sur la maquette.
 */
import type { DiagType } from '~/composables/useParticipation'

definePageMeta({ layout: 'bare' })

const route = useRoute()
const token = route.params.token as string

// La politique s'ouvre par-dessus le formulaire : la page n'est pas quittée et la saisie
// est conservée. La fenêtre est celle de `app.vue`, commune à tout le produit.
const { ouvrir: ouvrirConfidentialite } = useConfidentialiteModale()

const { data: resultat } = await useFetch<any>(`/api/public/results/${token}`)
const type = computed<DiagType>(() => resultat.value?.type ?? 'dirigeant')
const r = computed(() => resultat.value?.result)
const { etat: autre, charger: chargerAutre } = useAutreDiagnostic(type.value)
onMounted(chargerAutre)

const rapportNom = computed(() =>
  type.value === 'dirigeant' ? `Votre rapport ${r.value?.archetype?.code ?? ''} complet` : 'Votre rapport Rayonnement complet',
)
const detail = computed(() =>
  type.value === 'dirigeant' ? 'Le détail de vos huit dimensions' : 'Le détail de vos cinq dimensions',
)
const detailLong = computed(() =>
  type.value === 'dirigeant' ? 'Le détail de vos huit dimensions de direction' : 'Le détail de vos cinq dimensions de rayonnement',
)

/** Lignes « Votre résultat, déjà acquis » : le diagnostic courant, puis l'autre s'il est terminé. */
const acquis = computed(() => {
  const lignes: { libelle: string; valeur: string }[] = []
  const ligne = (t: DiagType, res: any) =>
    t === 'dirigeant'
      ? { libelle: 'Profil de dirigeant', valeur: res?.archetype?.code ?? '' }
      : { libelle: 'Rayonnement', valeur: `${res?.score ?? ''} · ${res?.niveauAffiche ?? ''}` }
  if (r.value) lignes.push(ligne(type.value, r.value))
  if (autre.value.termine && autre.value.resultat) lignes.push(ligne(autre.value.type, autre.value.resultat))
  return lignes
})

const SECTEURS = [
  'Commerce de détail', 'Restauration', 'Services aux entreprises', 'Artisanat', 'Santé et bien-être',
  'Éducation et formation', 'Transport et logistique', 'Agriculture et agroalimentaire', 'Technologie', 'Autre',
]
const TAILLES = ['Seul', '2 à 5', '6 à 20', '21 à 50', 'Plus de 50'] as const

const form = reactive({
  prenom: '', nom: '', email: '', phone: '', entreprise: '', secteur: '', secteurAutre: '',
  taille: '' as (typeof TAILLES)[number] | '',
})
const consent = ref(false)
const contactOk = ref(false)
const { $track } = useNuxtApp()
const formCommence = ref(false)
function debutSaisie() {
  if (formCommence.value) return
  formCommence.value = true
  $track('form_start', { form: 'p10' })
}
const envoi = ref(false)
const erreur = ref<string | null>(null)
const erreurs = reactive<Record<string, string>>({})

/** Une clé par montage de page : un double clic ne crée pas deux rapports. */
const idempotencyKey = useState(`lead-key-${token}`, () => crypto.randomUUID())

useSeoMeta({ title: 'Où souhaitez-vous recevoir votre rapport ? — Radar by FeexPay' })

function valider() {
  Object.keys(erreurs).forEach((k) => Reflect.deleteProperty(erreurs, k))
  if (!form.prenom.trim()) erreurs.prenom = 'Champ requis.'
  if (!form.nom.trim()) erreurs.nom = 'Champ requis.'
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) erreurs.email = 'Veuillez saisir une adresse email valide.'
  if (!/^\+[1-9][0-9]{6,14}$/.test(form.phone.replace(/\s/g, ''))) erreurs.phone = 'Numéro au format international, par exemple +225 07 00 00 00 00.'
  if (!form.entreprise.trim()) erreurs.entreprise = 'Champ requis.'
  if (!form.secteur) erreurs.secteur = 'Champ requis.'
  if (form.secteur === 'Autre' && !form.secteurAutre.trim()) erreurs.secteurAutre = 'Précisez votre secteur.'
  if (!form.taille) erreurs.taille = 'Champ requis.'
  if (!consent.value) erreurs.consent = 'La première case est obligatoire pour envoyer le formulaire. La seconde ne bloque jamais le parcours.'
  return Object.keys(erreurs).length === 0
}

async function envoyer() {
  if (envoi.value || !valider()) return
  envoi.value = true
  erreur.value = null
  try {
    const eventId = crypto.randomUUID()
    const res = await $fetch<{ reportToken: string; email: { sent: boolean; to: string } }>('/api/public/leads', {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey.value },
      body: {
        consentTraitement: consent.value,
        consentContact: contactOk.value,
        eventId,
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
    $track('generate_lead', { event_id: eventId, diagnostic: type.value })
    // Contexte de la confirmation (P11) : email saisi, diagnostic et nom du rapport.
    try {
      localStorage.setItem(
        `radar:rapport:${res.reportToken}`,
        // `at` sert à retrouver le rapport le plus récent quand plusieurs ont été émis
        // depuis cet appareil (composable useLectureCroisee).
        JSON.stringify({ type: type.value, token, email: form.email.trim(), rapport: rapportNom.value, envoye: res.email?.sent === true, at: Date.now() }),
      )
    } catch {}
    await navigateTo(`/confirmation/${res.reportToken}`)
  } catch (e: unknown) {
    const err = e as { data?: { data?: { message?: string } } }
    erreur.value = err?.data?.data?.message ?? 'L’envoi a échoué. Réessayez dans un instant.'
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <RadarTopBar :back="`/resultat/${type}/${token}`" label="Recevoir mon analyse">
      <template #right><span class="hidden lg:inline">Dernière étape</span></template>
    </RadarTopBar>

    <!-- Mobile et tablette : ce que vous recevez, en bandeau. -->
    <div class="border-b border-gray-200 bg-navy-50 px-5 pt-6 pb-5 md:px-10 lg:hidden">
      <p class="eyebrow mb-2 tracking-[0.06em] text-gray-500">Ce que vous recevez</p>
      <p class="mb-3 text-[19px] leading-[1.3] font-semibold text-navy-600">{{ rapportNom }}</p>
      <ul class="flex flex-col gap-[7px]">
        <li v-for="p in ['Le rapport en ligne et son PDF', detail, 'Un envoi par email à conserver']" :key="p" class="flex items-start gap-2.5">
          <UiIcon name="check" :size="17" class="shrink-0 text-orange-600" />
          <span class="text-sm leading-[1.5] text-gray-700">{{ p }}</span>
        </li>
      </ul>
    </div>

    <section class="flex-1 lg:bg-gray-50 lg:py-14 lg:pb-[72px]">
      <div class="wrap lg:flex lg:items-start lg:gap-8 lg:!px-6">
        <form class="min-w-0 flex-1 pt-6 pb-7 md:pt-8 md:pb-10 lg:card lg:p-9" novalidate @submit.prevent="envoyer" @focusin.once="debutSaisie">
          <h1 class="mb-2.5 hidden text-[32px] leading-[1.18] font-semibold tracking-[-0.02em] text-navy-600 lg:block">Où souhaitez-vous recevoir votre rapport ?</h1>
          <p class="mb-8 hidden text-base leading-[1.6] text-gray-600 lg:block">Six champs, une minute. Votre rapport part immédiatement après l’envoi.</p>

          <div class="grid gap-[18px] md:grid-cols-2 md:gap-5">
            <div class="order-2 md:order-1">
              <label for="prenom" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Prénom <span class="text-orange-600">*</span></label>
              <input id="prenom" v-model="form.prenom" type="text" autocomplete="given-name" class="field" :class="{ 'field-error': erreurs.prenom }" >
              <p v-if="erreurs.prenom" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreurs.prenom }}</p>
            </div>
            <div class="order-1 md:order-2">
              <label for="nom" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Nom <span class="text-orange-600">*</span></label>
              <input id="nom" v-model="form.nom" type="text" autocomplete="family-name" class="field" :class="{ 'field-error': erreurs.nom }" >
              <p v-if="erreurs.nom" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreurs.nom }}</p>
            </div>
            <div class="order-5 md:order-3 md:col-span-2">
              <label for="email" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Email <span class="text-orange-600">*</span></label>
              <div class="relative">
                <input id="email" v-model="form.email" type="email" autocomplete="email" inputmode="email" class="field" :class="{ 'field-error pr-11': erreurs.email }" >
                <UiIcon v-if="erreurs.email" name="alert-circle-outline" :size="20" class="pointer-events-none absolute top-1/2 right-3.5 hidden -translate-y-1/2 text-red-600 lg:block" />
              </div>
              <p v-if="erreurs.email" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreurs.email }}</p>
            </div>
            <div class="order-4 md:order-4">
              <label for="phone" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Téléphone ou WhatsApp <span class="text-orange-600">*</span></label>
              <input id="phone" v-model="form.phone" type="tel" autocomplete="tel" placeholder="+225 07 00 00 00 00" class="field" :class="{ 'field-error': erreurs.phone }" >
              <p v-if="erreurs.phone" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreurs.phone }}</p>
            </div>
            <div class="order-3 md:order-5">
              <label for="entreprise" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Entreprise ou activité <span class="text-orange-600">*</span></label>
              <input id="entreprise" v-model="form.entreprise" type="text" autocomplete="organization" placeholder="Nom de votre activité" class="field" :class="{ 'field-error': erreurs.entreprise }" >
              <p v-if="erreurs.entreprise" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreurs.entreprise }}</p>
              <p v-else class="mt-2 text-[13px] leading-[1.4] text-gray-500 lg:hidden">Une activité individuelle est acceptée.</p>
            </div>
            <div class="order-6 md:order-6">
              <label for="secteur" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Secteur d’activité <span class="text-orange-600">*</span></label>
              <div class="relative">
                <select id="secteur" v-model="form.secteur" class="field appearance-none pr-11" :class="{ 'field-error': erreurs.secteur, 'text-gray-400': !form.secteur }">
                  <option value="" disabled>Sélectionner</option>
                  <option v-for="s in SECTEURS" :key="s" :value="s">{{ s }}</option>
                </select>
                <UiIcon name="chevron-down" :size="20" class="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-gray-500" />
              </div>
              <p v-if="erreurs.secteur" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreurs.secteur }}</p>
              <div v-if="form.secteur === 'Autre'" class="mt-3">
                <label for="secteurAutre" class="mb-2 block text-sm leading-[1.3] font-semibold text-navy-600">Précisez <span class="text-orange-600">*</span></label>
                <input id="secteurAutre" v-model="form.secteurAutre" type="text" class="field" :class="{ 'field-error': erreurs.secteurAutre }" >
                <p v-if="erreurs.secteurAutre" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreurs.secteurAutre }}</p>
              </div>
            </div>
            <fieldset class="order-7 md:order-7">
              <legend class="mb-2.5 block text-sm leading-[1.3] font-semibold text-navy-600">Taille de l’activité <span class="text-orange-600">*</span></legend>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="t in TAILLES"
                  :key="t"
                  class="cursor-pointer rounded-full border-[1.5px] px-3.5 py-[11px] text-sm leading-none"
                  :class="form.taille === t ? 'border-orange-600 bg-orange-50 font-medium text-navy-600' : 'border-gray-300 text-gray-600 hover:border-navy-300'"
                >
                  <input v-model="form.taille" type="radio" name="taille" :value="t" class="sr-only" >
                  {{ t }}
                </label>
              </div>
              <p v-if="erreurs.taille" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreurs.taille }}</p>
            </fieldset>
          </div>

          <div class="my-[22px] h-px bg-gray-100 lg:mt-6 lg:mb-6" />

          <!-- CMP01 · consentement au traitement des données (maquette V1.2) -->
          <div class="mb-[22px] rounded-xl border border-gray-200 bg-gray-50 px-5 py-5 lg:mb-7 lg:px-[26px] lg:py-6">
            <p class="eyebrow mb-3.5 text-[11px] text-gray-500 lg:mb-4">Consentement au traitement des données</p>
            <label class="mb-2 flex cursor-pointer items-start gap-3">
              <input v-model="consent" type="checkbox" class="sr-only" >
              <span class="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px]" :class="consent ? 'border-navy-600 bg-navy-600 text-white' : 'border-gray-400 bg-white'" aria-hidden="true"><UiIcon v-if="consent" name="check" :size="16" /></span>
              <span class="text-[13px] leading-[1.55] text-gray-700 lg:text-[15px]">J’accepte le traitement de mes données pour recevoir mon diagnostic. <span class="text-red-600">*</span></span>
            </label>
            <p class="mb-[18px] pl-[34px] text-xs leading-[1.5] text-gray-500 lg:mb-5 lg:text-[13px]">
              Voir la
              <!-- Ouverte en fenêtre modale : quitter la page ferait perdre la saisie en cours. -->
              <button type="button" class="text-orange-600 underline-offset-2 hover:underline" @click="ouvrirConfidentialite">politique de confidentialité</button>.
            </p>
            <label class="flex cursor-pointer items-start gap-3">
              <input v-model="contactOk" type="checkbox" class="sr-only" >
              <span class="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px]" :class="contactOk ? 'border-navy-600 bg-navy-600 text-white' : 'border-gray-400 bg-white'" aria-hidden="true"><UiIcon v-if="contactOk" name="check" :size="16" /></span>
              <span class="text-[13px] leading-[1.55] text-gray-700 lg:text-[15px]">J’accepte d’être contacté(e) par FeexPay. <span class="text-gray-500">(facultatif)</span></span>
            </label>
            <p v-if="erreurs.consent" class="mt-3 text-xs leading-[1.5] text-red-600 lg:text-[13px]" role="alert">{{ erreurs.consent }}</p>
          </div>

          <p v-if="erreur" class="mb-4 flex gap-3 rounded-[10px] bg-red-100 px-4 py-3.5 text-sm leading-[1.5] text-gray-700" role="alert">
            <UiIcon name="alert-circle-outline" :size="20" class="shrink-0 text-red-600" />
            <span><span class="block font-semibold text-red-600">Envoi impossible</span>{{ erreur }}</span>
          </p>

          <button type="submit" :disabled="envoi || !consent" class="btn btn-primary h-[52px] w-full text-base lg:h-14 lg:w-[320px]">
            {{ envoi ? 'Envoi en cours…' : 'Recevoir mon analyse complète' }}
          </button>
        </form>

        <!-- Desktop : colonne de droite. -->
        <aside class="hidden w-[380px] shrink-0 flex-col gap-5 lg:flex">
          <div class="rounded-[14px] bg-navy-600 p-7">
            <p class="eyebrow mb-2.5 text-orange-300">Ce que vous recevez</p>
            <p class="mb-[22px] text-2xl leading-[1.22] font-semibold tracking-[-0.015em] text-white">{{ rapportNom }}</p>
            <ul class="flex flex-col gap-3">
              <li v-for="p in ['Le rapport en ligne et son PDF', detailLong, 'Votre lecture croisée pilotage / rayonnement', 'Un envoi par email à conserver']" :key="p" class="flex items-start gap-3">
                <UiIcon name="check" :size="18" class="shrink-0 text-orange-300" />
                <span class="text-[15px] leading-[1.55] text-navy-100">{{ p }}</span>
              </li>
            </ul>
          </div>
          <div class="card p-6">
            <p class="eyebrow mb-4 text-gray-500">Votre résultat, déjà acquis</p>
            <div class="flex flex-col gap-3">
              <div v-for="l in acquis" :key="l.libelle" class="flex items-center justify-between rounded-[10px] bg-gray-50 px-4 py-3.5">
                <span class="text-sm leading-[1.3] text-gray-600">{{ l.libelle }}</span>
                <span class="text-[15px] leading-[1.3] font-semibold text-navy-600">{{ l.valeur }}</span>
              </div>
            </div>
            <p class="mt-4 text-[13px] leading-[1.55] text-gray-500">Ces résultats vous sont déjà affichés. Le formulaire sert uniquement à vous envoyer l’analyse détaillée.</p>
          </div>
          <div class="flex items-start gap-3.5 rounded-[14px] border border-navy-100 bg-navy-50 p-6">
            <UiIcon name="shield-check-outline" :size="24" class="shrink-0 text-navy-600" />
            <div>
              <p class="mb-1 text-[15px] leading-[1.35] font-semibold text-navy-600">Vos données sont protégées</p>
              <p class="text-[13px] leading-[1.55] text-gray-600">Vos réponses servent à produire votre rapport, rien d’autre. Vous pouvez en <NuxtLink to="/supprimer-mes-donnees" class="underline underline-offset-2 hover:no-underline">demander la suppression</NuxtLink> à tout moment.</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>
