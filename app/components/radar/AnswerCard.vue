<script setup lang="ts">
/**
 * Carte de réponse (maquette P04/P06 et planche Components, six états).
 *
 * Repos, survol, focus clavier, sélectionnée, validée (réponse déjà enregistrée, revue au
 * retour arrière) et modification en cours. « Jamais dépendant de la couleur seule » : la
 * pastille et un libellé accompagnent toujours la couleur.
 *
 * L'ordre des états compte. `modification` passe avant `selected` : une option nouvellement
 * choisie en remplacement d'une réponse déjà donnée doit se lire comme une modification, pas
 * comme une simple sélection. Et `validee` ne peut apparaître que si la carte n'est pas
 * sélectionnée — c'est le cas au retour sur une question, tant que rien n'a été recliqué.
 */
const props = withDefaults(
  defineProps<{
    texte: string
    /** Choix courant de l'internaute. */
    selected: boolean
    /** Réponse déjà enregistrée côté serveur pour cette question. */
    enregistree?: boolean
    /** Choix courant qui remplace une réponse déjà donnée. */
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

// En modification, la pastille reste vide et cerclée d'orange (maquette) : afficher la coche
// la rendrait blanche sur fond blanc, donc invisible.
const coche = computed(() => (props.selected || props.enregistree) && !props.modification)
</script>

<template>
  <button type="button" class="answer-card" :class="`answer-card--${etat}`" :aria-pressed="selected">
    <span class="answer-card__pastille" aria-hidden="true">
      <UiIcon v-if="coche" name="check" :size="16" />
    </span>
    <span class="min-w-0">
      <span class="answer-card__texte block" style="text-wrap: pretty">{{ texte }}</span>
      <span v-if="enregistree && !selected" class="answer-card__mention mt-1.5 block text-navy-600">Réponse enregistrée</span>
      <span v-if="modification" class="answer-card__mention mt-1.5 block text-orange-700">Modification d’une réponse déjà donnée</span>
    </span>
  </button>
</template>

<style scoped>
.answer-card {
  display: flex;
  width: 100%;
  min-height: 96px;
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

.answer-card__texte {
  font-size: 15px;
  line-height: 1.5;
}
@media (min-width: 1024px) {
  .answer-card__texte {
    font-size: 16px;
    line-height: 1.55;
  }
}
.answer-card__mention {
  font-size: 12px;
  line-height: 1;
  font-weight: 600;
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
  transition: border-color var(--dur-state) var(--ease-standard);
}

/* Survol : bordure, ombre portée et pastille plus soutenue (planche Components).
   Chaque état repose le raccourci `border` en entier — un `border-color` seul se fait
   écraser par le raccourci de `.answer-card`, à spécificité égale. Le survol ne vise que
   l'état de repos : une carte déjà sélectionnée ou en modification garde sa bordure. */
.answer-card--repos:hover {
  border: 1.5px solid var(--color-navy-300);
  box-shadow: 0 4px 12px rgba(17, 44, 86, 0.09);
}
.answer-card--repos:hover .answer-card__pastille {
  border: 1.5px solid var(--color-navy-400);
}

/* Focus clavier. Déclaré ici et non laissé au `:focus-visible` global : la règle scopée de
   l'état sélectionné a une spécificité supérieure et effaçait l'anneau sur les cartes
   choisies à partir de 1024 px. Le rayon suit celui de la carte, 12 px et non 10. */
.answer-card:focus-visible {
  outline: none;
  border-radius: 12px;
  box-shadow: 0 0 0 3px var(--color-orange-300);
}

.answer-card--selected {
  background: var(--color-orange-50);
  border: 1.5px solid var(--color-orange-600);
  color: var(--color-navy-600);
  font-weight: 500;
}
.answer-card--selected .answer-card__pastille {
  background: var(--color-orange-600);
  border: 1.5px solid var(--color-orange-600);
}
.answer-card--selected:focus-visible {
  box-shadow: 0 0 0 3px var(--color-orange-300);
}

.answer-card--validee {
  background: var(--color-gray-50);
  border: 1.5px solid var(--color-gray-200);
  color: var(--color-gray-600);
}
.answer-card--validee .answer-card__pastille {
  background: var(--color-navy-600);
  border: 1.5px solid var(--color-navy-600);
}

.answer-card--modification {
  border: 1.5px dashed var(--color-orange-600);
}
.answer-card--modification .answer-card__pastille {
  background: transparent;
  border: 1.5px solid var(--color-orange-600);
}
</style>
