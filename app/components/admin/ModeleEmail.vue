<script setup lang="ts">
/**
 * Éditeur d'un modèle d'email de rapport (A07). Formulaire à gauche, aperçu à droite.
 *
 * L'aperçu est rendu par le serveur, avec le même gabarit que l'envoi et le cas de contrôle
 * principal : ce que l'administrateur voit est ce qui partira. Les variables entre doubles
 * accolades sont remplacées dans l'aperçu comme à l'envoi.
 *
 * Lire et prévisualiser est ouvert au rôle Commercial ; enregistrer exige Administrateur,
 * c'est un texte qui part chez des prospects au nom de FeexPay.
 */
import { apiAdmin, messageErreur } from '~/composables/useAdmin'

type Champs = Record<string, string>
interface Modele {
  cle: string
  nom: string
  detail: string
  champs: Champs
  defauts: Champs
  personnalise: boolean
  modifieLe: string | null
  modifiePar: string | null
}
interface Catalogue {
  modeles: Modele[]
  champs: { cle: string; libelle: string; aide: string; long: boolean }[]
  variables: { cle: string; description: string }[]
}

const props = defineProps<{ cle: string }>()
const emit = defineEmits<{ close: []; enregistre: [] }>()

const { peut } = useAdmin()
const peutEnregistrer = computed(() => peut('admin'))

const catalogue = ref<Catalogue | null>(null)
const modele = computed(() => catalogue.value?.modeles.find((m) => m.cle === props.cle) ?? null)
const form = reactive<Champs>({})
const erreur = ref<string | null>(null)
const message = ref<string | null>(null)
const occupe = ref<'enregistrer' | 'retablir' | null>(null)
const confirmeRetablir = ref(false)

const sujet = ref('')
const html = ref('')
const apercuEnCours = ref(false)

const modifie = computed(() => Boolean(modele.value && Object.keys(form).some((c) => form[c] !== modele.value!.champs[c])))
const differeDeLOrigine = computed(() => Boolean(modele.value && Object.keys(form).some((c) => form[c] !== modele.value!.defauts[c])))

async function charger() {
  erreur.value = null
  try {
    catalogue.value = await apiAdmin<Catalogue>('/api/admin/rapports/modeles')
    if (!modele.value) throw new Error('Modèle inconnu')
    for (const c of catalogue.value.champs) form[c.cle] = modele.value.champs[c.cle] ?? ''
    await rafraichirApercu()
  } catch (e) {
    erreur.value = messageErreur(e, 'Le modèle n’a pas pu être chargé.')
  }
}
onMounted(charger)

let minuterie: ReturnType<typeof setTimeout> | undefined
watch(form, () => {
  clearTimeout(minuterie)
  minuterie = setTimeout(() => void rafraichirApercu(), 400)
})
onUnmounted(() => clearTimeout(minuterie))

async function rafraichirApercu() {
  apercuEnCours.value = true
  try {
    const r = await apiAdmin<{ sujet: string; html: string }>('/api/admin/rapports/apercu', { method: 'POST', body: { modele: props.cle, champs: { ...form } } })
    sujet.value = r.sujet
    html.value = r.html
  } catch (e) {
    erreur.value = messageErreur(e, 'L’aperçu n’a pas pu être rendu.')
  } finally {
    apercuEnCours.value = false
  }
}

async function enregistrer() {
  occupe.value = 'enregistrer'
  erreur.value = null
  message.value = null
  try {
    const r = await apiAdmin<Modele>(`/api/admin/rapports/modeles/${props.cle}`, { method: 'PUT', body: { ...form } })
    if (modele.value) Object.assign(modele.value, { champs: r.champs, personnalise: r.personnalise, modifieLe: r.modifieLe, modifiePar: r.modifiePar })
    message.value = r.personnalise ? 'Modèle enregistré. Les prochains envois l’utilisent.' : 'Modèle enregistré : il est identique au texte d’origine.'
    emit('enregistre')
  } catch (e) {
    erreur.value = messageErreur(e, 'Le modèle n’a pas pu être enregistré.')
  } finally {
    occupe.value = null
  }
}

async function retablir() {
  if (!confirmeRetablir.value) {
    confirmeRetablir.value = true
    return
  }
  occupe.value = 'retablir'
  erreur.value = null
  message.value = null
  try {
    const r = await apiAdmin<Modele>(`/api/admin/rapports/modeles/${props.cle}`, { method: 'DELETE' })
    if (modele.value) Object.assign(modele.value, { champs: r.champs, personnalise: r.personnalise, modifieLe: r.modifieLe, modifiePar: r.modifiePar })
    for (const c of Object.keys(form)) form[c] = r.champs[c] ?? ''
    message.value = 'Texte d’origine rétabli.'
    emit('enregistre')
  } catch (e) {
    erreur.value = messageErreur(e, 'Le texte d’origine n’a pas pu être rétabli.')
  } finally {
    occupe.value = null
    confirmeRetablir.value = false
  }
}

/** Une variable telle qu'on l'écrit dans un champ. Écrite ici : les accolades fermantes clôturent une interpolation Vue dans le gabarit. */
const accolades = (c: string) => `{{${c}}}`

/** Remet un seul champ à son texte d'origine, sans enregistrer. */
function origineDuChamp(c: string) {
  if (modele.value) form[c] = modele.value.defauts[c] ?? ''
}

const dateCourte = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''

function fermer() {
  if (modifie.value && !window.confirm('Des modifications ne sont pas enregistrées. Fermer quand même ?')) return
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-stretch justify-center bg-navy-600/60 p-0 lg:items-center lg:p-8" role="dialog" aria-modal="true" :aria-label="`Modifier le modèle ${modele?.nom ?? ''}`">
    <div class="flex w-full max-w-[1240px] flex-col bg-white lg:h-[min(860px,100%)] lg:rounded-2xl lg:shadow-xl">
      <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
        <div>
          <p class="text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Modèle d’email</p>
          <h2 class="mt-1.5 text-lg leading-[1.25] font-semibold text-navy-600">{{ modele?.nom ?? '…' }}</h2>
          <p v-if="modele" class="mt-1 text-xs leading-[1.4] text-gray-500">
            <template v-if="modele.personnalise">Texte modifié<template v-if="modele.modifiePar"> par {{ modele.modifiePar }}</template><template v-if="modele.modifieLe"> le {{ dateCourte(modele.modifieLe) }}</template>.</template>
            <template v-else>Texte d’origine, versionné avec le code.</template>
          </p>
        </div>
        <button type="button" class="-m-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-navy-600" aria-label="Fermer" @click="fermer"><UiIcon name="close" :size="22" /></button>
      </div>

      <div class="flex min-h-0 flex-1 flex-col lg:flex-row">
        <form class="flex min-h-0 w-full flex-col lg:w-[440px] lg:shrink-0 lg:border-r lg:border-gray-200" @submit.prevent="enregistrer">
          <div class="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <p v-if="erreur" class="mb-4 rounded-[10px] bg-red-100 px-4 py-3 text-sm text-red-600" role="alert">{{ erreur }}</p>
            <p v-if="message" class="mb-4 rounded-[10px] bg-green-100 px-4 py-3 text-sm text-green-600" role="status">{{ message }}</p>
            <p v-if="!peutEnregistrer" class="mb-4 rounded-[10px] bg-navy-50 px-4 py-3 text-[13px] leading-[1.45] text-navy-600">Vous pouvez modifier le texte et voir l’aperçu, mais l’enregistrement est réservé au rôle Administrateur.</p>

            <template v-if="catalogue && modele">
              <div v-for="c in catalogue.champs" :key="c.cle" class="mb-5">
                <div class="mb-1.5 flex items-baseline justify-between gap-3">
                  <label :for="`champ-${c.cle}`" class="text-sm leading-[1.3] font-medium text-navy-600">{{ c.libelle }}</label>
                  <button v-if="form[c.cle] !== modele.defauts[c.cle]" type="button" class="text-xs leading-none font-semibold text-orange-600 hover:underline" @click="origineDuChamp(c.cle)">Texte d’origine</button>
                </div>
                <textarea v-if="c.long" :id="`champ-${c.cle}`" v-model="form[c.cle]" rows="4" class="field w-full resize-y py-2.5 text-sm leading-[1.5]" maxlength="1000" />
                <input v-else :id="`champ-${c.cle}`" v-model="form[c.cle]" type="text" class="field h-10 w-full text-sm" :maxlength="c.cle === 'sujet' ? 200 : c.cle === 'bouton' ? 60 : 1000" >
                <p class="mt-1 text-xs leading-[1.4] text-gray-500">{{ c.aide }}</p>
              </div>

              <details class="rounded-xl border border-gray-200 px-4 py-3">
                <summary class="cursor-pointer text-sm font-medium text-navy-600">Variables disponibles</summary>
                <ul class="mt-2 flex flex-col gap-1.5">
                  <li v-for="v in catalogue.variables" :key="v.cle" class="text-xs leading-[1.45] text-gray-600"><code class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[11px] text-navy-600">{{ accolades(v.cle) }}</code> {{ v.description }}</li>
                </ul>
                <p class="mt-2 text-xs leading-[1.4] text-gray-500">Le résumé des résultats sous l’introduction est calculé à l’envoi et ne se modifie pas.</p>
              </details>
            </template>
            <AdminSquelette v-else-if="!erreur" />
          </div>

          <div class="flex flex-wrap items-center gap-2.5 border-t border-gray-200 px-6 py-4">
            <button type="submit" class="btn btn-primary h-10 rounded-[10px] px-4 text-sm" :disabled="!peutEnregistrer || !modifie || occupe !== null">{{ occupe === 'enregistrer' ? 'Enregistrement…' : 'Enregistrer' }}</button>
            <button v-if="modele?.personnalise || differeDeLOrigine" type="button" class="btn btn-outline h-10 rounded-[10px] px-4 text-sm" :class="confirmeRetablir ? 'border-red-600 text-red-600' : ''" :disabled="!peutEnregistrer || occupe !== null" @click="retablir">
              {{ confirmeRetablir ? 'Confirmer le retour au texte d’origine' : 'Rétablir le texte d’origine' }}
            </button>
            <a :href="`/api/admin/rapports/apercu?modele=${cle}`" target="_blank" rel="noopener" class="btn btn-ghost ml-auto h-10 px-3 text-sm">Ouvrir l’aperçu enregistré</a>
          </div>
        </form>

        <div class="flex min-h-[360px] flex-1 flex-col bg-gray-50">
          <div class="flex items-center gap-3 border-b border-gray-200 bg-white px-5 py-3">
            <span class="text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Aperçu</span>
            <span class="min-w-0 flex-1 truncate text-sm leading-[1.3] text-navy-600" :title="sujet"><span class="text-gray-500">Sujet :</span> {{ sujet || '…' }}</span>
            <span v-if="apercuEnCours" class="text-xs leading-none text-gray-400">Rendu…</span>
          </div>
          <iframe :srcdoc="html" title="Aperçu de l’email" class="min-h-0 w-full flex-1 border-0" sandbox="" />
        </div>
      </div>
    </div>
  </div>
</template>
