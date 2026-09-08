<script setup lang="ts">
/**
 * Carte de réponse — 6 états spécifiés par la maquette (planche 02 Components).
 * Gabarit commun : padding 18, rayon 12, hauteur mini 96, bordure 1.5, pastille 26.
 * Règle : « jamais dépendant de la couleur seule pour signaler la sélection » —
 * d'où le check, le libellé d'état et la bordure pointillée en modification.
 */
const props = withDefaults(
  defineProps<{
    lettre: string
    texte: string
    selected: boolean
    /** Réponse déjà enregistrée côté serveur pour cette question. */
    enregistree?: boolean
    /** L'utilisateur revient sur une réponse déjà donnée. */
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
  <button
    type="button"
    class="answer-card"
    :class="`answer-card--${etat}`"
    :aria-pressed="selected"
  >
    <span class="answer-card__pastille" aria-hidden="true">
      <UiIcon v-if="selected || enregistree" name="check" :size="16" />
      <template v-else>{{ lettre }}</template>
    </span>
    <span class="min-w-0">
      <span class="block text-[15px] leading-[1.5]">{{ texte }}</span>
      <span v-if="enregistree && !selected" class="mt-1 block text-xs font-semibold text-navy-600">
        Réponse enregistrée
      </span>
      <span v-if="modification" class="mt-1 block text-xs font-semibold text-orange-700">
        Modification d’une réponse déjà donnée
      </span>
    </span>
  </button>
</template>

<style scoped>
.answer-card {
  display: flex;
  width: 100%;
  align-items: flex-start;
  gap: 14px;
  min-height: 96px;
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

.answer-card__pastille {
  display: flex;
  height: 26px;
  width: 26px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 1.5px solid var(--color-gray-300);
  font-size: 13px;
  font-weight: 600;
  color: var(--color-gray-600);
}

.answer-card:hover {
  border-color: var(--color-navy-300);
  box-shadow: var(--shadow-md);
}
.answer-card:hover .answer-card__pastille {
  border-color: var(--color-navy-400);
}

.answer-card--selected {
  background: var(--color-orange-50);
  border-color: var(--color-orange-600);
  color: var(--color-navy-600);
  font-weight: 500;
}
.answer-card--selected .answer-card__pastille {
  background: var(--color-orange-600);
  border-color: var(--color-orange-600);
  color: #fff;
}

.answer-card--validee {
  background: var(--color-gray-50);
  color: var(--color-gray-600);
}
.answer-card--validee .answer-card__pastille {
  background: var(--color-navy-600);
  border-color: var(--color-navy-600);
  color: #fff;
}

.answer-card--modification {
  border-style: dashed;
  border-color: var(--color-orange-600);
}
.answer-card--modification .answer-card__pastille {
  border-color: var(--color-orange-600);
  color: var(--color-orange-700);
}
</style>
