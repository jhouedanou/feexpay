<script setup lang="ts">
/** Pastilles de rôle et de statut (cadre A10). */
const props = defineProps<{ role?: string; status?: string }>()
const ROLES: Record<string, [string, string]> = {
  admin: ['Administrateur', 'bg-orange-50 border border-orange-200 text-orange-700 font-semibold'],
  analyste: ['Analyste', 'bg-navy-50 text-navy-600 font-medium'],
  commercial: ['Commercial', 'bg-navy-50 text-navy-600 font-medium'],
  lecture: ['Lecture seule', 'bg-gray-50 text-gray-500 font-medium'],
}
const STATUTS: Record<string, [string, string, string]> = {
  active: ['Actif', 'bg-green-100 text-green-600', 'check'],
  invited: ['Invité', 'bg-amber-100 text-amber-600', 'email-outline'],
  suspended: ['Suspendu', 'bg-red-100 text-red-600', 'pause'],
  revoked: ['Révoqué', 'bg-gray-100 text-gray-500', 'close'],
}
const r = computed(() => (props.role ? ROLES[props.role] : null))
const s = computed(() => (props.status ? STATUTS[props.status] : null))
</script>

<template>
  <span v-if="r" class="inline-flex rounded-full px-2.5 py-1 text-xs leading-[1.4]" :class="r[1]">{{ r[0] }}</span>
  <span v-else-if="s" class="inline-flex items-center gap-[5px] rounded-full px-[9px] py-1 text-xs leading-[1.4] font-medium" :class="s[1]"><UiIcon :name="s[2]" :size="13" />{{ s[0] }}</span>
</template>
