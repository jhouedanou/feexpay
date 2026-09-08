<script setup lang="ts">
/**
 * Carte de réponse (maquette P04/P06 et planche Components).
 * Repos : bordure 1,5 px gris 200, pastille vide 26 px. Sélection : fond orange 50,
 * bordure orange, pastille orange avec coche ; en desktop, halo orange 100 de 3 px.
 * « Jamais dépendant de la couleur seule » : la coche et, en cas de retour arrière,
 * le libellé d'état accompagnent toujours la couleur.
 */
const props = withDefaults(
  defineProps<{
    texte: string
    selected: boolean
    /** Réponse déjà enregistrée côté serveur pour cette question. */
    enregistree?: boolean
    /** L'utilisateur revient sur une réponse déjà donnée et en choisit une autre. */
    modification?: boolean
  }>(),
  { enregistree: false, modification: false },
)

const etat = computed(() => {
  if (props.modification) return 'modification'
  if (props.selected) return 'selected'
  if (props.enregistree) return 'validee'
  return 'repos'
})
</script>

<template>
  <button type="button" class="answer-card" :class="`answer-card--${etat}`" :aria-pressed="selected">
    <span class="answer-card__pastille" aria-hidden="true">
      <UiIcon v-if="selected || enregistree" name="check" :size="16" />
    </span>
    <span class="min-w-0">
      <span class="block text-base leading-[1.5] lg:leading-[1.55]" style="text-wrap: pretty">{{ texte }}</span>
      <span v-if="enregistree && !selected" class="mt-1 block text-xs font-semibold text-navy-600">Réponse enregistrée</span>
      <span v-if="modification" class="mt-1 block text-xs font-semibold text-orange-700">Modification d’une réponse déjà donnée</span>
    </span>
  </button>
</template>

<style scoped>
.answer-card {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 14px;
  padding: 18px;
  border-radius: 12px;
  border: 1.5px solid var(--color-gray-200);
  background: #fff;
  text-align: left;
  color: var(--color-gray-700);
  transition:
    border-color var(--dur-state) var(--ease-standard),
    background-color var(--dur-state) var(--ease-standard),
    box-shadow var(--dur-state) var(--ease-standard);
}
@media (min-width: 768px) {
  .answer-card {
    padding: 18px 20px;
  }
}
@media (min-width: 1024px) {
  .answer-card {
    gap: 16px;
    padding: 20px 22px;
  }
}

.answer-card__pastille {
  display: flex;
  height: 26px;
  width: 26px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid var(--color-gray-300);
  color: #fff;
}

.answer-card:hover {
  border-color: var(--color-navy-300);
}

.answer-card--selected {
  background: var(--color-orange-50);
  border-color: var(--color-orange-600);
  color: var(--color-navy-600);
  font-weight: 500;
}
@media (min-width: 1024px) {
  .answer-card--selected {
    box-shadow: 0 0 0 3px var(--color-orange-100);
  }
}
.answer-card--selected .answer-card__pastille {
  background: var(--color-orange-600);
  border-color: var(--color-orange-600);
}

.answer-card--validee {
  background: var(--color-gray-50);
  color: var(--color-gray-600);
}
.answer-card--validee .answer-card__pastille {
  background: var(--color-navy-600);
  border-color: var(--color-navy-600);
}

.answer-card--modification {
  border-style: dashed;
  border-color: var(--color-orange-600);
}
</style>
