<script setup lang="ts">
/**
 * Fenêtre modale accessible : `role="dialog"`, `aria-modal`, titre annoncé, fermeture par
 * Échap et par clic sur le fond, focus piégé pendant l'ouverture et rendu au déclencheur à
 * la fermeture, défilement de la page bloqué.
 *
 * Le contenu est projeté dans la fente par défaut ; seul le cadre est ici.
 */
const ouvert = defineModel<boolean>({ required: true })
const props = defineProps<{ titre: string; sousTitre?: string }>()

const dialogue = ref<HTMLElement | null>(null)
const declencheur = ref<HTMLElement | null>(null)
const titreId = useId()

const SELECTEUR_FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables(): HTMLElement[] {
  return Array.from(dialogue.value?.querySelectorAll<HTMLElement>(SELECTEUR_FOCUSABLE) ?? [])
}

/** Tab et Maj+Tab bouclent à l'intérieur du dialogue tant qu'il est ouvert. */
function auClavier(e: KeyboardEvent) {
  if (e.key === 'Escape') return fermer()
  if (e.key !== 'Tab') return
  const cibles = focusables()
  if (!cibles.length) return
  const premier = cibles[0]!
  const dernier = cibles[cibles.length - 1]!
  const actif = document.activeElement
  if (e.shiftKey && (actif === premier || actif === dialogue.value)) {
    e.preventDefault()
    dernier.focus()
  } else if (!e.shiftKey && actif === dernier) {
    e.preventDefault()
    premier.focus()
  }
}

function fermer() {
  ouvert.value = false
}

watch(ouvert, async (o) => {
  if (o) {
    declencheur.value = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    await nextTick()
    // Le conteneur reçoit le focus plutôt que le premier bouton : le lecteur d'écran
    // annonce alors le titre du dialogue avant les actions.
    dialogue.value?.focus()
  } else {
    document.body.style.overflow = ''
    declencheur.value?.focus()
  }
})

// Une navigation ou un démontage pendant l'ouverture laisserait le défilement bloqué.
onBeforeUnmount(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modale">
      <div
        v-if="ouvert"
        class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
        @click.self="fermer"
      >
        <div class="absolute inset-0 bg-navy-600/45 backdrop-blur-[2px]" aria-hidden="true" @click="fermer" />
        <div
          ref="dialogue"
          class="relative flex max-h-[92dvh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-[18px] bg-white sm:max-h-[86dvh] sm:rounded-[18px]"
          style="box-shadow: 0 24px 60px rgba(6, 20, 43, 0.28)"
          role="dialog"
          aria-modal="true"
          :aria-labelledby="titreId"
          tabindex="-1"
          @keydown="auClavier"
        >
          <div class="flex items-start gap-4 border-b border-gray-100 px-5 py-4 lg:px-7 lg:py-5">
            <div class="min-w-0 flex-1">
              <h2 :id="titreId" class="text-[19px] leading-[1.25] font-bold tracking-[-0.01em] text-navy-600 lg:text-[22px]">{{ props.titre }}</h2>
              <p v-if="props.sousTitre" class="mt-1 text-xs leading-[1.5] text-gray-500 lg:text-[13px]">{{ props.sousTitre }}</p>
            </div>
            <button
              type="button"
              class="-mt-1 -mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-gray-500 hover:bg-gray-50 hover:text-navy-600"
              aria-label="Fermer"
              @click="fermer"
            >
              <UiIcon name="close" :size="20" />
            </button>
          </div>

          <div class="min-h-0 flex-1 overflow-y-auto px-5 py-5 lg:px-7 lg:py-6">
            <slot />
          </div>

          <div v-if="$slots.pied" class="border-t border-gray-100 px-5 py-3.5 lg:px-7 lg:py-4">
            <slot name="pied" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Durées de la planche Foundations, neutralisées par prefers-reduced-motion. */
.modale-enter-active,
.modale-leave-active {
  transition: opacity 220ms cubic-bezier(0.2, 0, 0, 1);
}
.modale-enter-from,
.modale-leave-to {
  opacity: 0;
}
@media (prefers-reduced-motion: reduce) {
  .modale-enter-active,
  .modale-leave-active {
    transition: none;
  }
}
</style>
