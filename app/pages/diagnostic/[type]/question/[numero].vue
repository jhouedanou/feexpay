<script setup lang="ts">
// P04 / P06 — question. Cadres 390, 834 et 1440 (docs/maquette/frames/*-P04.html, *-P06.html).
// Desktop : rail de progression bleu nuit de 320 px à gauche, colonne de réponses de 640 px.
// Tablette : colonne unique de 600 px. Mobile : barre de progression compacte.
import { THEMES, type DiagType } from '~/composables/useParticipation'

definePageMeta({ layout: 'bare' })

const route = useRoute()
const type = route.params.type as DiagType
if (type !== 'dirigeant' && type !== 'rayonnement') throw createError({ statusCode: 404 })
const numero = computed(() => Number(route.params.numero))

const { data } = await useQuestions(type)
const questions = computed(() => data.value?.questions ?? [])
const total = computed(() => questions.value.length)
const q = computed(() => questions.value[numero.value - 1])
if (!q.value) throw createError({ statusCode: 404 })

const titre = type === 'dirigeant' ? 'Profil du dirigeant' : 'Rayonnement de l’entreprise'
useSeoMeta({ title: () => `Question ${numero.value} sur ${total.value} — ${titre}` })

const pct = computed(() => Math.round((numero.value / total.value) * 100))
const themes = THEMES[type]
const themeCourant = computed(() => themes.find((t) => t.questions.includes(q.value!.code))?.nom ?? '')

const part = useParticipation(type)
const answers = useState<Record<string, string>>(`answers-${type}`, () => ({}))
const selected = ref<string | null>(null)
const dejaRepondue = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)

/** État d'un thème du rail : terminé, en cours, à venir. */
function etatTheme(t: { questions: string[] }) {
  if (t.questions.includes(q.value!.code)) return 'courant'
  return t.questions.every((code) => answers.value[code]) ? 'fait' : 'avenir'
}

onMounted(async () => {
  part.load()
  if (!part.token.value) return navigateTo(`/diagnostic/${type}/introduction`)
  try {
    const s = await part.state()
    if (s.status !== 'in_progress') return navigateTo(`/diagnostic/${type}/introduction`)
    answers.value = Object.fromEntries(Object.entries(s.answers).map(([qc, l]) => [qc, `${qc}${l}`]))
    // Interdit de sauter une question non répondue.
    const first = questions.value.findIndex((qq) => !answers.value[qq.code]) + 1
    if (first > 0 && numero.value > first) return navigateTo(`/diagnostic/${type}/question/${first}`)
    // La réponse enregistrée s'affiche dans l'état « validée », pas en sélection orange :
    // `selected` ne porte que le choix courant de l'internaute.
    dejaRepondue.value = Boolean(answers.value[q.value!.code])
    selected.value = null
  } catch {
    part.save(null)
    return navigateTo(`/diagnostic/${type}/introduction`)
  }
})
watch(numero, () => {
  selected.value = null
  dejaRepondue.value = Boolean(answers.value[q.value?.code ?? ''])
})

/** Réponse qui partira au serveur : le choix courant, ou celle déjà enregistrée. */
const reponse = computed(() => selected.value ?? answers.value[q.value?.code ?? ''] ?? null)

/**
 * « Suivant » n'apparaît qu'une fois la réponse partie de l'appareil, quand l'indicateur
 * affiche « Enregistré ». Un choix encore en attente ou en cours d'envoi ne suffit pas. Une
 * réponse venue du serveur au chargement compte comme enregistrée, de même qu'une réponse
 * mise en file hors ligne : l'internaute ne doit pas rester bloqué sans réseau.
 */
const enregistree = computed(() => Boolean(reponse.value) && !saving.value && answers.value[q.value?.code ?? ''] === reponse.value)

const precedent = computed(() =>
  numero.value > 1 ? `/diagnostic/${type}/question/${numero.value - 1}` : `/diagnostic/${type}/introduction`,
)

// --- Indicateur d'enregistrement -------------------------------------------
// Il ne s'agit pas d'un ornement : c'est la seule preuve visible que la réponse a quitté
// l'appareil. Il porte donc un instant réel, et distingue l'envoi abouti de la mise en file
// locale quand le réseau manque.
const enregistreLe = ref<number | null>(null)
const differee = ref(false)
/** Rafraîchi à la minute pour que « à l'instant » vieillisse tout seul. */
const maintenant = ref(Date.now())
let horloge: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  horloge = setInterval(() => (maintenant.value = Date.now()), 30_000)
})
onUnmounted(() => clearInterval(horloge))

const etatEnregistrement = computed(() => {
  if (saving.value) return 'Enregistrement…'
  if (differee.value) return 'Hors ligne · conservé sur cet appareil'
  if (enregistreLe.value) {
    const s = Math.round((maintenant.value - enregistreLe.value) / 1000)
    if (s < 45) return 'Enregistré · à l’instant'
    const m = Math.round(s / 60)
    return `Enregistré · il y a ${m} minute${m > 1 ? 's' : ''}`
  }
  // Réponse venue du serveur au chargement : enregistrée, sans instant connu.
  return answers.value[q.value?.code ?? ''] ? 'Réponse enregistrée' : null
})

/**
 * La réponse part dès qu'elle est choisie, sans attendre « Suivant » : c'est ce qui rend
 * l'indicateur ci-dessus utile, et ce qui met le parcours à l'abri d'un onglet fermé. Un court
 * délai évite d'envoyer autant de requêtes que d'hésitations.
 */
let differe: ReturnType<typeof setTimeout> | undefined
function choisir(code: string) {
  selected.value = code
  clearTimeout(differe)
  differe = setTimeout(() => void enregistrer().catch(() => {}), 400)
}
onUnmounted(() => clearTimeout(differe))

/** Envoie le choix courant s'il diffère de ce qui est déjà enregistré. */
async function enregistrer(): Promise<boolean> {
  const code = selected.value
  if (!code || code === answers.value[q.value!.code]) return true
  saving.value = true
  error.value = null
  try {
    const r = (await part.answer(q.value!.code, code)) as { differee?: boolean } | undefined
    answers.value[q.value!.code] = code
    differee.value = r?.differee === true
    enregistreLe.value = differee.value ? null : Date.now()
    maintenant.value = Date.now()
    return true
  } finally {
    saving.value = false
  }
}

async function next() {
  if (!reponse.value) return
  clearTimeout(differe)
  try {
    await enregistrer()
    if (numero.value < total.value) await navigateTo(`/diagnostic/${type}/question/${numero.value + 1}`)
    else await navigateTo(`/diagnostic/${type}/calcul`)
  } catch {
    error.value = 'Réponse non enregistrée. Réessayez.'
  }
}

/** Revenir en arrière ne doit pas perdre une modification en cours. */
async function allerPrecedent() {
  clearTimeout(differe)
  try {
    await enregistrer()
  } catch {
    // Le réseau manque : la file locale a déjà pris la réponse, on continue.
  }
  await navigateTo(precedent.value)
}
</script>

<template>
  <div class="flex flex-1 flex-col lg:flex-row">
    <!-- Rail de progression, desktop. -->
    <aside class="hidden w-80 shrink-0 flex-col bg-navy-600 px-8 py-9 lg:flex">
      <img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="mb-11 h-[22px] w-auto self-start" >
      <p class="eyebrow mb-1.5 text-orange-300">Diagnostic en cours</p>
      <p class="mb-7 text-[22px] leading-[1.28] font-semibold text-white">{{ titre }}</p>
      <p class="mb-3 flex items-baseline gap-2">
        <span class="text-[34px] leading-none font-bold tracking-[-0.02em] text-white">{{ numero }}</span>
        <span class="text-[15px] leading-none text-navy-200">sur {{ total }}</span>
      </p>
      <div class="mb-8 h-1.5 overflow-hidden rounded-full" style="background: rgba(255, 255, 255, 0.18)" role="progressbar" :aria-valuenow="numero" :aria-valuemin="0" :aria-valuemax="total">
        <div class="h-full rounded-full bg-orange-600" :style="{ width: pct + '%', transition: 'width var(--dur-card) var(--ease-standard)' }" />
      </div>
      <ol class="flex flex-col gap-3.5">
        <li v-for="t in themes" :key="t.nom" class="flex items-center gap-2.5">
          <UiIcon
            :name="etatTheme(t) === 'fait' ? 'check-circle' : etatTheme(t) === 'courant' ? 'circle-slice-4' : 'circle-outline'"
            :size="18"
            :class="etatTheme(t) === 'fait' ? 'text-orange-300' : etatTheme(t) === 'courant' ? 'text-white' : 'text-navy-400'"
          />
          <span
            class="text-sm leading-[1.4]"
            :class="etatTheme(t) === 'fait' ? 'text-navy-100' : etatTheme(t) === 'courant' ? 'font-medium text-white' : 'text-navy-300'"
          >
            {{ t.nom }}
          </span>
        </li>
      </ol>
      <div class="mt-auto border-t pt-7" style="border-color: rgba(255, 255, 255, 0.15)">
        <p class="text-[13px] leading-[1.55] text-navy-300">
          {{
            type === 'dirigeant'
              ? 'Vos réponses sont enregistrées à chaque écran. Vous pouvez fermer cette page et reprendre plus tard.'
              : 'Répondez d’après ce que vous observez aujourd’hui. Une réponse honnête produit une lecture utile.'
          }}
        </p>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Barre compacte, mobile et tablette. -->
      <div class="px-5 pt-3.5 md:px-10 md:pt-4 lg:hidden">
        <div class="mb-3.5 flex items-center gap-3 md:gap-4">
          <button type="button" class="-ml-2.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy-600 hover:bg-navy-50 md:-ml-3" aria-label="Question précédente" @click="allerPrecedent">
            <UiIcon name="arrow-left" :size="22" />
          </button>
          <span class="hidden text-sm leading-none font-medium text-navy-600 md:inline">{{ titre }}</span>
          <span class="flex-1 text-[13px] leading-none font-medium text-gray-500 md:hidden">Question {{ numero }} sur {{ total }}</span>
          <span class="text-[13px] leading-none font-medium text-gray-500 md:hidden">{{ pct }} %</span>
          <span class="ml-auto hidden text-sm leading-none text-gray-500 md:inline">Question {{ numero }} sur {{ total }} · {{ pct }} %</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-gray-100" role="progressbar" :aria-valuenow="numero" :aria-valuemin="0" :aria-valuemax="total" :aria-label="`Progression : question ${numero} sur ${total}`">
          <div class="h-full rounded-full bg-orange-600" :style="{ width: pct + '%', transition: 'width var(--dur-card) var(--ease-standard)' }" />
        </div>
        <p v-if="etatEnregistrement" class="mt-1.5 text-right text-[12px] leading-none" :class="differee ? 'text-amber-600' : 'text-gray-500'" role="status">{{ etatEnregistrement }}</p>
      </div>

      <!-- Barre desktop. -->
      <div class="hidden items-center justify-between border-b border-gray-200 px-10 py-[22px] lg:flex">
        <button type="button" class="inline-flex items-center gap-2.5 text-[15px] leading-none font-medium text-navy-600 hover:underline" @click="allerPrecedent">
          <UiIcon name="arrow-left" :size="20" />
          Question précédente
        </button>
        <span v-if="etatEnregistrement" class="text-sm leading-none" :class="differee ? 'text-amber-600' : 'text-gray-500'">{{ etatEnregistrement }}</span>
      </div>

      <div class="flex flex-1 justify-center px-5 pt-7 pb-5 md:px-10 md:pt-12 md:pb-8 lg:pt-16 lg:pb-10">
        <div class="w-full md:max-w-[600px] lg:max-w-[640px]">
          <p class="eyebrow mb-4 hidden text-orange-600 lg:block">{{ themeCourant }}</p>
          <h1
            class="mb-6 text-[26px] leading-[1.28] font-semibold tracking-[-0.01em] text-navy-600 md:mb-7 md:text-[30px] md:leading-[1.25] md:tracking-[-0.015em] lg:mb-8 lg:text-[34px] lg:leading-[1.24] lg:tracking-[-0.018em]"
            style="text-wrap: pretty"
          >
            {{ q!.texte }}
          </h1>
          <div class="flex flex-col gap-3">
            <RadarAnswerCard
              v-for="o in q!.options"
              :key="o.code"
              :texte="o.texte"
              :selected="selected === o.code"
              :enregistree="answers[q!.code] === o.code"
              :modification="dejaRepondue && selected === o.code && answers[q!.code] !== o.code"
              @click="choisir(o.code)"
            />
          </div>
          <p v-if="error" class="mt-4 text-sm text-red-600" role="alert">{{ error }}</p>
        </div>
      </div>

      <div class="flex justify-center border-t border-gray-200 px-5 pt-4 pb-6 md:px-10 md:pt-5 md:pb-7 lg:pt-6 lg:pb-8">
        <div class="flex w-full items-center gap-3 md:max-w-[600px] lg:max-w-[640px]">
          <button type="button" class="btn btn-outline h-[52px] w-24 shrink-0 text-[15px] md:w-[120px] lg:w-[130px]" @click="allerPrecedent">Précédent</button>
          <!-- Le bouton n'apparaît qu'une fois la réponse enregistrée, voir `enregistree`. -->
          <button v-if="enregistree" type="button" class="btn btn-primary h-[52px] flex-1 text-base" @click="next">
            {{ numero < total ? 'Suivant' : 'Voir mon résultat' }}
            <UiIcon name="arrow-right" :size="18" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
