<script setup lang="ts">
/** Pagination A03 : « 1 à 5 sur 62 », boutons 36 px. */
const props = defineProps<{ page: number; taille: number; total: number }>()
const emit = defineEmits<{ change: [page: number] }>()
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.taille)))
const visibles = computed(() => {
  const p = props.page
  const set = new Set([1, pages.value, p - 1, p, p + 1].filter((x) => x >= 1 && x <= pages.value))
  return [...set].sort((a, b) => a - b)
})
const de = computed(() => (props.total ? (props.page - 1) * props.taille + 1 : 0))
const a = computed(() => Math.min(props.total, props.page * props.taille))
</script>

<template>
  <div class="flex items-center justify-between pt-[18px] pb-7">
    <span class="text-[13px] leading-[1.3] text-gray-500">{{ de }} à {{ a }} sur {{ total }}</span>
    <div class="flex gap-1.5">
      <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border-[1.5px] border-gray-300 text-navy-600 disabled:text-gray-400" :disabled="page <= 1" aria-label="Page précédente" @click="emit('change', page - 1)"><UiIcon name="chevron-left" :size="18" /></button>
      <template v-for="(n, i) in visibles" :key="n">
        <span v-if="i > 0 && n - visibles[i - 1]! > 1" class="inline-flex h-9 w-9 items-center justify-center text-gray-400">…</span>
        <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-sm leading-none" :class="n === page ? 'bg-navy-600 font-semibold text-white' : 'border-[1.5px] border-gray-300 text-navy-600 hover:bg-gray-50'" @click="emit('change', n)">{{ n }}</button>
      </template>
      <button type="button" class="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border-[1.5px] border-gray-300 text-navy-600 disabled:text-gray-400" :disabled="page >= pages" aria-label="Page suivante" @click="emit('change', page + 1)"><UiIcon name="chevron-right" :size="18" /></button>
    </div>
  </div>
</template>
