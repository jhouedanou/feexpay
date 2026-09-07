<script setup lang="ts">
const p = defineProps<{ current: number; total: number }>()
const pct = computed(() => Math.round((p.current / p.total) * 100))
</script>

<template>
  <div>
    <div class="mb-1 flex justify-between text-xs text-gray-500">
      <span>Question {{ current }} sur {{ total }}</span>
      <span>{{ pct }} %</span>
    </div>
    <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100" role="progressbar" :aria-valuenow="current" :aria-valuemin="0" :aria-valuemax="total">
      <div class="h-full rounded-full bg-orange-500 transition-all" :style="{ width: pct + '%' }" />
    </div>
  </div>
</template>
