<script setup lang="ts">
// Réglages → Leviers FeexPay : table constat → produit affichée en A05. Rôle Administrateur.
// Chaque levier traite ou soutient des dimensions de constat (colonne « qualification » de la matrice).
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'admin', section: 'Réglages' })
useSeoMeta({ title: 'Leviers FeexPay — Administration Radar by FeexPay', robots: 'noindex' })
const { data, refresh } = await useFetch<any>('/api/admin/leviers', { headers: useRequestHeaders(['cookie']) })
const leviers = ref<any[]>([])
watch(data, (d) => (leviers.value = JSON.parse(JSON.stringify(d?.leviers ?? []))), { immediate: true })
const dimensions = computed<string[]>(() => data.value?.dimensions ?? [])
const ICONES = ['storefront-outline', 'link-variant', 'cash-fast', 'cellphone', 'chart-box-outline', 'shield-check-outline', 'file-document-outline', 'account-multiple-outline']
const info = ref<string | null>(null)
const erreur = ref<string | null>(null)
const envoi = ref(false)
const role = (l: any, d: string) => l.dimensions.find((x: any) => x.dimension === d)?.role ?? ''
const setRole = (l: any, d: string, r: string) => {
  l.dimensions = l.dimensions.filter((x: any) => x.dimension !== d)
  if (r) l.dimensions.push({ dimension: d, role: r })
}
const ajouter = () => leviers.value.push({ code: '', nom: '', icone: 'link-variant', description: '', actif: true, dimensions: [] })
const retirer = (i: number) => leviers.value.splice(i, 1)
async function enregistrer() {
  if (envoi.value) return
  envoi.value = true
  info.value = null
  erreur.value = null
  try {
    await apiAdmin('/api/admin/leviers', { method: 'PUT', body: { leviers: leviers.value } })
    await refresh()
    info.value = 'Leviers enregistrés. Visible immédiatement sur les fiches.'
  } catch (e) {
    erreur.value = messageErreur(e)
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <div>
    <AdminHeader titre="Leviers FeexPay" sous-titre="Rattachement constat → produit affiché dans le diagnostic commercial (A05)" :fil="[{ label: 'Réglages', to: '/admin/reglages' }, { label: 'Leviers FeexPay' }]">
      <button type="button" class="btn btn-outline h-10 gap-2 rounded-[10px] px-3.5 text-sm" @click="ajouter"><UiIcon name="plus" :size="18" />Ajouter un levier</button>
      <button type="button" class="btn btn-navy h-10 rounded-[10px] px-4 text-sm" :disabled="envoi" @click="enregistrer">Enregistrer</button>
    </AdminHeader>
    <div class="flex flex-col gap-5 px-8 pt-7 pb-9">
      <p v-if="info" class="rounded-[10px] bg-green-100 px-4 py-3 text-sm text-green-600">{{ info }}</p>
      <p v-if="erreur" class="field-error">{{ erreur }}</p>
      <div v-for="(l, i) in leviers" :key="i" class="card p-6">
        <div class="mb-4 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-4">
          <label class="block"><span class="mb-1 block text-xs font-medium text-gray-600">Nom</span><input v-model="l.nom" class="field w-full" ></label>
          <label class="block"><span class="mb-1 block text-xs font-medium text-gray-600">Code (a-z, 0-9, tirets)</span><input v-model="l.code" class="field w-full font-mono" pattern="[a-z0-9-]+" ></label>
          <label class="block"><span class="mb-1 block text-xs font-medium text-gray-600">Icône</span><select v-model="l.icone" class="field w-full"><option v-for="ic in ICONES" :key="ic" :value="ic">{{ ic }}</option></select></label>
          <div class="flex items-center gap-3 pb-2">
            <label class="flex items-center gap-2 text-sm text-gray-700"><input v-model="l.actif" type="checkbox" >Actif</label>
            <button type="button" class="text-gray-400 hover:text-red-600" aria-label="Retirer" @click="retirer(i)"><UiIcon name="delete-outline" :size="20" /></button>
          </div>
        </div>
        <label class="mb-4 block"><span class="mb-1 block text-xs font-medium text-gray-600">Description affichée</span><textarea v-model="l.description" rows="2" class="field w-full" /></label>
        <p class="mb-2 text-xs font-medium text-gray-600">Dimensions de constat : « Traite » pour un manque couvert directement, « Support » pour une aide indirecte.</p>
        <div class="grid grid-cols-3 gap-x-4 gap-y-1.5">
          <div v-for="d in dimensions" :key="d" class="flex items-center justify-between gap-2 rounded-lg border border-gray-100 px-2.5 py-1.5">
            <span class="truncate text-[13px] text-gray-700">{{ d }}</span>
            <select :value="role(l, d)" class="rounded-md border border-gray-200 bg-white px-1.5 py-1 text-xs text-navy-600" @change="setRole(l, d, ($event.target as HTMLSelectElement).value)"><option value="">—</option><option value="traite">Traite</option><option value="support">Support</option></select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
