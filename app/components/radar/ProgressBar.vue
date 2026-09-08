<script setup lang="ts">
const p = defineProps<{ current: number; total: number }>()
const pct = computed(() => Math.round((p.current / p.total) * 100))
</script>

<template>
  <div>
    <div class="mb-1.5 flex justify-between type-caption text-gray-500">
      <span>Question {{ current }} sur {{ total }}</span>
      <span class="font-semibold text-navy-600">{{ pct }} %</span>
    </div>
    <div
      class="h-1.5 w-full overflow-hidden rounded-full bg-gray-100"
      role="progressbar"
      :aria-valuenow="current"
      :aria-valuemin="0"
      :aria-valuemax="total"
      :aria-label="`Progression : question ${current} sur ${total}`"
    >
      <div
        class="h-full rounded-full bg-orange-600"
        :style="{ width: pct + '%', transition: 'width var(--dur-card) var(--ease-standard)' }"
      />
    </div>
  </div>
</template>
