<script setup lang="ts">
// Changement de mot de passe par un administrateur connecté. Le mot de passe actuel est
// exigé : une session ouverte ne suffit pas. Les sessions des autres appareils tombent,
// celle-ci est rouverte par le serveur — le second facteur sera redemandé.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Mon compte' })
useSeoMeta({ title: 'Changer mon mot de passe — Administration Radar by FeexPay', robots: 'noindex' })

const { me } = useAdmin()
const actuel = ref('')
const nouveau = ref('')
const confirmation = ref('')
const voir = ref(false)
const erreur = ref<string | null>(null)
const envoi = ref(false)
const fait = ref(false)

async function valider() {
  if (envoi.value) return
  erreur.value = null
  if (nouveau.value !== confirmation.value) return (erreur.value = 'Les deux mots de passe diffèrent.')
  if (nouveau.value.length < 12) return (erreur.value = 'Le mot de passe doit compter au moins 12 caractères.')
  envoi.value = true
  try {
    await apiAdmin('/api/admin/auth/password', { method: 'POST', body: { actuel: actuel.value, nouveau: nouveau.value } })
    fait.value = true
    actuel.value = nouveau.value = confirmation.value = ''
  } catch (e) {
    erreur.value = messageErreur(e)
  } finally {
    envoi.value = false
  }
}
</script>

<template>
  <div>
    <AdminHeader titre="Mon compte" sous-titre="Mot de passe et sécurité de votre accès" />
    <div class="flex items-start gap-5 px-8 pt-7 pb-9">
      <form class="card min-w-0 flex-1 p-7" novalidate @submit.prevent="valider">
        <h3 class="mb-1.5 text-[17px] font-semibold text-navy-600">Changer mon mot de passe</h3>
        <p class="mb-[22px] text-[13px] leading-[1.5] text-gray-500">
          Connecté en tant que {{ me?.user.email }}. Au moins 12 caractères, et un mot de passe qui ne figure pas dans les fuites de données connues.
        </p>

        <p v-if="fait" class="mb-5 rounded-[10px] bg-green-100 px-3.5 py-3 text-[13px] text-green-600" role="status">
          Mot de passe modifié. Vos sessions sur les autres appareils ont été fermées.
        </p>

        <div class="flex max-w-[420px] flex-col gap-5">
          <div>
            <label for="actuel" class="mb-2 block text-sm font-semibold text-navy-600">Mot de passe actuel</label>
            <input id="actuel" v-model="actuel" type="password" autocomplete="current-password" class="field h-11 text-[15px]" required >
          </div>
          <div>
            <label for="nouveau" class="mb-2 block text-sm font-semibold text-navy-600">Nouveau mot de passe</label>
            <div class="relative">
              <input id="nouveau" v-model="nouveau" :type="voir ? 'text' : 'password'" autocomplete="new-password" class="field h-11 pr-11 text-[15px]" :class="{ 'field-error': erreur }" required >
              <button type="button" class="absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" :aria-label="voir ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" @click="voir = !voir">
                <UiIcon :name="voir ? 'eye-outline' : 'eye-off-outline'" :size="20" />
              </button>
            </div>
          </div>
          <div>
            <label for="confirmation" class="mb-2 block text-sm font-semibold text-navy-600">Confirmer le nouveau mot de passe</label>
            <input id="confirmation" v-model="confirmation" :type="voir ? 'text' : 'password'" autocomplete="new-password" class="field h-11 text-[15px]" :class="{ 'field-error': erreur }" required >
            <p v-if="erreur" class="mt-2 text-[13px] leading-[1.4] text-red-600" role="alert">{{ erreur }}</p>
          </div>
          <button type="submit" :disabled="envoi" class="btn btn-primary h-12 self-start rounded-[10px] px-6 text-[15px]">{{ envoi ? 'Enregistrement…' : 'Changer le mot de passe' }}</button>
        </div>
      </form>

      <div class="w-[360px] shrink-0 rounded-[14px] border border-navy-100 bg-navy-50 p-6">
        <p class="eyebrow mb-3 text-navy-600">Ce qui se passe ensuite</p>
        <ul class="flex flex-col gap-2.5 text-[13px] leading-[1.55] text-gray-700">
          <li>Les sessions ouvertes sur vos autres appareils sont fermées.</li>
          <li>Cet appareil reste connecté ; votre double authentification vous sera redemandée.</li>
          <li>Le changement est inscrit au journal d’audit.</li>
        </ul>
      </div>
    </div>
  </div>
</template>
