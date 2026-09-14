<script setup lang="ts">
/** En-tête de page admin : fil d'Ariane facultatif, titre, sous-titre, actions à droite. */
defineProps<{ titre: string; sousTitre?: string; fil?: { label: string; to?: string }[] }>()
</script>

<template>
  <div class="flex items-center justify-between gap-6 border-b border-gray-200 bg-white px-8 py-5">
    <div class="min-w-0">
      <div v-if="fil?.length" class="mb-2 flex items-center gap-2 text-[13px] leading-none">
        <template v-for="(f, i) in fil" :key="f.label">
          <span v-if="i > 0" class="text-gray-300">/</span>
          <NuxtLink v-if="f.to" :to="f.to" class="text-gray-500 hover:text-navy-600">{{ f.label }}</NuxtLink>
          <span v-else class="font-medium text-navy-600">{{ f.label }}</span>
        </template>
      </div>
      <h1 class="text-2xl leading-[1.2] font-semibold text-navy-600">{{ titre }}</h1>
      <p v-if="sousTitre" class="mt-1 text-[13px] leading-[1.3] text-gray-500">{{ sousTitre }}</p>
    </div>
    <div class="flex shrink-0 gap-2.5"><slot /></div>
  </div>
</template>
