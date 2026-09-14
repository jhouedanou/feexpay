<script setup lang="ts">
/**
 * Barres horizontales de dimensions. « Aucun graphique radar » malgré le nom du produit.
 * Une dimension est mise en avant en orange : la plus haute (profil du dirigeant, P08)
 * ou la plus basse (rayonnement, P09 — la zone à travailler). Sur fond bleu nuit, les
 * autres barres passent en bleu 200 et les valeurs en blanc.
 */
const props = withDefaults(
  defineProps<{
    dims: { nom: string; score: number }[]
    surligne?: 'max' | 'min'
    sombre?: boolean
    /** Épaisseur de la piste en px. */
    epaisseur?: number
    /** Taille du libellé en px. */
    libelle?: number
  }>(),
  { surligne: 'max', sombre: false, epaisseur: 8, libelle: 14 },
)

const cible = computed(() => {
  if (!props.dims.length) return -1
  let i = 0
  props.dims.forEach((d, k) => {
    const better = props.surligne === 'max' ? d.score > props.dims[i]!.score : d.score < props.dims[i]!.score
    if (better) i = k
  })
  return i
})
</script>

<template>
  <ul class="flex flex-col" :style="{ gap: epaisseur >= 10 ? '18px' : '13px' }">
    <li v-for="(d, i) in dims" :key="d.nom">
      <div class="mb-1.5 flex items-center justify-between leading-[1.2]">
        <span
          :style="{ fontSize: libelle + 'px' }"
          :class="
            i === cible
              ? sombre ? 'font-medium text-white' : 'font-medium text-navy-600'
              : sombre ? 'text-navy-100' : 'text-gray-700'
          "
        >
          {{ d.nom }}
        </span>
        <span
          class="font-mono"
          :style="{ fontSize: libelle - 1 + 'px' }"
          :class="
            i === cible
              ? sombre ? 'font-semibold text-orange-300' : 'font-semibold text-orange-600'
              : sombre ? 'font-medium text-white' : 'font-medium text-navy-600'
          "
        >
          {{ Math.round(d.score) }}
        </span>
      </div>
      <div
        class="overflow-hidden rounded-full"
        :style="{ height: epaisseur + 'px', background: sombre ? 'rgba(255,255,255,.16)' : '#EEF0F4' }"
        role="img"
        :aria-label="`${d.nom} : ${Math.round(d.score)} sur 100`"
      >
        <div
          class="h-full rounded-full"
          :style="{
            width: Math.max(0, Math.min(100, d.score)) + '%',
            background: i === cible ? '#D45D00' : sombre ? '#B5C5DC' : '#23477E',
            transition: 'width var(--dur-card) var(--ease-standard)',
          }"
        />
      </div>
    </li>
  </ul>
</template>
