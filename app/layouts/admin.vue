<script setup lang="ts">
/**
 * Coquille admin (cadres A02 à A10) : rail latéral bleu nuit de 240 px, repliable à 72 px
 * (icônes seules), entrées masquées selon le rôle (les permissions restent vérifiées côté
 * API), bloc utilisateur en bas.
 */
const { me, initiales, peut, deconnecter } = useAdmin()
const route = useRoute()

const entrees = computed(() =>
  [
    { to: '/admin', label: 'Dashboard', icone: 'view-dashboard-outline', role: 'lecture' as const },
    { to: '/admin/prospects', label: 'Prospects', icone: 'account-multiple-outline', role: 'lecture' as const },
    { to: '/admin/participations', label: 'Participations', icone: 'clipboard-list-outline', role: 'lecture' as const },
    { to: '/admin/rapports', label: 'Rapports et emails', icone: 'file-document-outline', role: 'commercial' as const },
    { to: '/admin/comptes', label: 'Comptes admin', icone: 'shield-account-outline', role: 'admin' as const },
    { to: '/admin/versions', label: 'Versions', icone: 'source-branch', role: 'analyste' as const },
    { to: '/admin/suppressions', label: 'Suppressions', icone: 'delete-outline', role: 'admin' as const },
    { to: '/admin/reglages', label: 'Réglages', icone: 'cog-outline', role: 'admin' as const },
  ].filter((e) => peut(e.role)),
)
const actif = (to: string) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))

/** Rail replié : icônes seules, 72 px. Le choix est retenu dans le navigateur. */
const replie = ref(false)
onMounted(() => {
  try {
    replie.value = localStorage.getItem('admin.rail') === 'replie'
  } catch {
    /* stockage indisponible : rail déplié */
  }
})
function basculerRail() {
  replie.value = !replie.value
  try {
    localStorage.setItem('admin.rail', replie.value ? 'replie' : 'deplie')
  } catch {
    /* stockage indisponible : le choix ne survit pas au rechargement */
  }
}
</script>

<template>
  <div class="flex min-h-dvh bg-gray-50">
    <aside class="flex shrink-0 flex-col bg-navy-600 py-6 transition-[width] duration-200" :class="replie ? 'w-[72px]' : 'w-60'">
      <div class="flex items-center pb-7" :class="replie ? 'justify-center px-0' : 'justify-between px-5'">
        <NuxtLink v-if="!replie" to="/admin"><img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="h-[22px] w-auto" ></NuxtLink>
        <button type="button" class="rounded-md p-1 text-navy-300 hover:bg-white/10 hover:text-white" :aria-label="replie ? 'Déplier le menu' : 'Replier le menu'" :title="replie ? 'Déplier le menu' : 'Replier le menu'" @click="basculerRail">
          <UiIcon :name="replie ? 'chevron-double-right' : 'chevron-double-left'" :size="18" />
        </button>
      </div>
      <nav class="flex flex-col gap-0.5 px-3">
        <NuxtLink
          v-for="e in entrees"
          :key="e.to"
          :to="e.to"
          class="flex items-center gap-3 rounded-[10px] py-[11px] text-sm leading-none"
          :class="[actif(e.to) ? 'bg-white/10 font-semibold text-white' : 'text-navy-100 hover:bg-white/5', replie ? 'justify-center px-0' : 'px-3']"
          :title="replie ? e.label : undefined"
          :aria-label="replie ? e.label : undefined"
        >
          <UiIcon :name="e.icone" :size="20" :class="actif(e.to) ? 'text-orange-600' : 'text-navy-200'" />
          <span v-if="!replie">{{ e.label }}</span>
        </NuxtLink>
      </nav>
      <div v-if="me" class="mt-auto border-t border-white/15 pt-5" :class="replie ? 'px-0' : 'px-5'">
        <div v-if="replie" class="flex flex-col items-center gap-3">
          <span class="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-navy-500 text-[13px] leading-none font-semibold text-white" :title="`${me.user.prenom} ${me.user.nom}`">{{ initiales }}</span>
          <button type="button" class="text-navy-300 hover:text-white" aria-label="Se déconnecter" title="Se déconnecter" @click="deconnecter"><UiIcon name="logout" :size="18" /></button>
        </div>
        <div v-else class="flex items-center gap-2.5">
          <span class="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-navy-500 text-[13px] leading-none font-semibold text-white">{{ initiales }}</span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] leading-[1.2] font-medium text-white">{{ me.user.prenom }} {{ me.user.nom }}</p>
            <p class="mt-0.5 truncate text-[11px] leading-[1.2] text-navy-300">{{ me.user.team ?? me.user.roleLabel }}</p>
          </div>
          <button type="button" class="text-navy-300 hover:text-white" aria-label="Se déconnecter" @click="deconnecter"><UiIcon name="logout" :size="18" /></button>
        </div>
      </div>
    </aside>
    <main class="min-w-0 flex-1"><slot /></main>
  </div>
</template>
