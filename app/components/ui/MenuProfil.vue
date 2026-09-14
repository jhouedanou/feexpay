<script setup lang="ts">
/**
 * Menu de compte dans l'en-tête du site public. Un administrateur qui navigue sur le site
 * n'avait aucun repère : ni indication qu'il est connecté, ni moyen de rejoindre
 * l'administration, de changer son mot de passe ou de se déconnecter.
 *
 * Rien n'est affiché à un visiteur : le site public ne propose pas de connexion, l'espace
 * interne se rejoint par son adresse.
 *
 * L'état de session est demandé après hydratation seulement. L'accueil est la seule page
 * indexée du produit : elle ne doit pas payer une requête d'authentification au premier octet,
 * ni voir son rendu serveur dépendre d'un cookie.
 */
const { me, charge, charger, initiales, deconnecter } = useAdmin()
const ouvert = ref(false)
const racine = ref<HTMLElement | null>(null)

onMounted(() => {
  if (!charge.value) charger()
  document.addEventListener('click', auClicExterieur)
  document.addEventListener('keydown', auClavier)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', auClicExterieur)
  document.removeEventListener('keydown', auClavier)
})

function auClicExterieur(e: MouseEvent) {
  if (ouvert.value && racine.value && !racine.value.contains(e.target as Node)) ouvert.value = false
}
function auClavier(e: KeyboardEvent) {
  if (e.key === 'Escape') ouvert.value = false
}

const route = useRoute()
watch(() => route.fullPath, () => (ouvert.value = false))
</script>

<template>
  <!-- Rien tant que la session n'est pas connue : pas de scintillement au chargement. -->
  <div v-if="charge && me" ref="racine" class="relative">
    <button
      type="button"
      class="inline-flex h-10 items-center gap-2.5 rounded-full border border-gray-200 py-0 pr-3.5 pl-1 text-[15px] leading-none font-medium text-navy-600 hover:border-navy-300"
      :aria-expanded="ouvert"
      aria-haspopup="menu"
      @click="ouvert = !ouvert"
    >
      <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-navy-600 text-[13px] font-semibold text-white">{{ initiales }}</span>
      <span class="hidden lg:inline">{{ me.user.prenom }}</span>
      <UiIcon name="chevron-down" :size="18" class="text-gray-500" />
    </button>

    <div
      v-if="ouvert"
      class="absolute right-0 z-40 mt-2 w-[248px] overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5"
      style="box-shadow: 0 14px 36px rgba(6, 20, 43, 0.18)"
      role="menu"
    >
      <div class="border-b border-gray-100 px-4 pt-2 pb-3">
        <p class="text-sm leading-[1.3] font-semibold text-navy-600">{{ me.user.prenom }} {{ me.user.nom }}</p>
        <p class="mt-0.5 truncate text-xs leading-[1.4] text-gray-500">{{ me.user.email }}</p>
        <p class="mt-1.5 text-xs leading-none font-medium text-orange-600">{{ me.user.roleLabel }}</p>
      </div>
      <NuxtLink to="/admin" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">
        <UiIcon name="view-dashboard-outline" :size="18" class="text-gray-500" />Administration
      </NuxtLink>
      <NuxtLink to="/admin/mot-de-passe" class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">
        <UiIcon name="lock-outline" :size="18" class="text-gray-500" />Changer mon mot de passe
      </NuxtLink>
      <button type="button" class="flex w-full items-center gap-2.5 border-t border-gray-100 px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50" role="menuitem" @click="deconnecter">
        <UiIcon name="logout" :size="18" class="text-gray-500" />Se déconnecter
      </button>
    </div>
  </div>
</template>
