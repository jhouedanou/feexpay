<script setup lang="ts">
/**
 * Coquille admin (cadres A02 à A10) : rail latéral bleu nuit de 240 px, six entrées masquées
 * selon le rôle (les permissions restent vérifiées côté API), bloc utilisateur en bas.
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
    { to: '/admin/reglages', label: 'Réglages', icone: 'cog-outline', role: 'admin' as const },
  ].filter((e) => peut(e.role)),
)
const actif = (to: string) => (to === '/admin' ? route.path === '/admin' : route.path.startsWith(to))
</script>

<template>
  <div class="flex min-h-dvh bg-gray-50">
    <aside class="flex w-60 shrink-0 flex-col bg-navy-600 py-6">
      <div class="px-5 pb-7"><NuxtLink to="/admin"><img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="h-[22px] w-auto" ></NuxtLink></div>
      <nav class="flex flex-col gap-0.5 px-3">
        <NuxtLink
          v-for="e in entrees"
          :key="e.to"
          :to="e.to"
          class="flex items-center gap-3 rounded-[10px] px-3 py-[11px] text-sm leading-none"
          :class="actif(e.to) ? 'bg-white/10 font-semibold text-white' : 'text-navy-100 hover:bg-white/5'"
        >
          <UiIcon :name="e.icone" :size="20" :class="actif(e.to) ? 'text-orange-600' : 'text-navy-200'" />
          {{ e.label }}
        </NuxtLink>
      </nav>
      <div v-if="me" class="mt-auto border-t border-white/15 px-5 pt-5">
        <div class="flex items-center gap-2.5">
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
