<script setup lang="ts">
// Journal des accès (A10) : le journal d'audit, filtrable par compte, famille d'actions et
// période. Lecture seule, la base refuse toute modification ou suppression.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'admin', section: 'Journal des accès' })
useSeoMeta({ title: 'Journal des accès — Administration Radar by FeexPay', robots: 'noindex' })

interface Ligne { id: number; ts: string; action: string; target_type: string; target_id: string | null; payload_min: Record<string, unknown> | null; ip: string | null; acteur: string | null; acteur_email: string | null; cible: string | null }
interface Journal { lignes: Ligne[]; total: number; page: number; taille: number; comptes: { id: string; nom: string }[]; familles: { cle: string; label: string }[] }

const route = useRoute()
const filtres = reactive({ compte: String(route.query.compte ?? ''), famille: String(route.query.famille ?? ''), jours: Number(route.query.jours ?? 30) || 30 })
const page = ref(1)
watch(filtres, () => (page.value = 1))
const query = computed(() => ({ ...filtres, page: page.value, taille: 50 }))
const { data, pending, error, refresh } = await useFetch<Journal>('/api/admin/journal', { query, headers: useRequestHeaders(['cookie']) })

const LIBELLES: Record<string, string> = {
  'login.success': 'Connexion réussie', 'login.failed': 'Connexion refusée, mot de passe faux', 'login.locked': 'Connexion refusée, compte verrouillé', 'login.refused': 'Connexion refusée, compte inactif', 'logout': 'Déconnexion',
  'mfa.enroll.start': 'Enrôlement du second facteur commencé', 'mfa.enroll.done': 'Second facteur activé', 'mfa.verify.success': 'Second facteur vérifié', 'mfa.verify.failed': 'Second facteur refusé', 'mfa.recovery.used': 'Code de récupération utilisé', 'mfa.recovery.failed': 'Code de récupération refusé',
  'password.reset.requested': 'Réinitialisation demandée', 'password.reset.done': 'Mot de passe réinitialisé', 'password.change.done': 'Mot de passe changé', 'password.change.failed': 'Changement de mot de passe refusé', 'password.change.unverified': 'Changement de mot de passe sans second facteur',
  'invitation.sent': 'Invitation envoyée', 'invitation.accepted': 'Invitation acceptée', 'invitation.cancelled': 'Invitation annulée', 'user.updated': 'Compte modifié', 'seed.admins': 'Comptes amorcés', 'seed.admins.direct': 'Compte créé directement',
  'export.create': 'Export', 'deletion.requested': 'Suppression demandée', 'deletion.verified': 'Suppression confirmée par l’auteur', 'deletion.done': 'Données supprimées', 'deletion.rejected': 'Suppression refusée', 'contact.email': 'Adresse d’un contact corrigée',
  'prospect.suivi': 'Suivi d’un prospect modifié', 'prospect.note': 'Note interne ajoutée', 'report.resend': 'Rapport renvoyé', 'report.retry_failed': 'Échecs d’envoi relancés', 'settings.updated': 'Réglages modifiés', 'leviers.update': 'Leviers modifiés', 'email_template.updated': 'Modèle d’email modifié', 'email_template.reset': 'Modèle d’email rétabli', 'email_template.enabled': 'Modèle d’email activé', 'email_template.disabled': 'Modèle d’email désactivé',
}
const libelle = (a: string) => LIBELLES[a] ?? a
const refus = (a: string) => /failed|refused|locked|unverified|rejected/.test(a)
const quand = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
/** Détail lisible : les clés utiles du payload, sans identifiants techniques. */
const detail = (l: Ligne) => {
  const p = l.payload_min ?? {}
  return Object.entries(p)
    .filter(([k, v]) => v !== null && v !== '' && !['invitation', 'champs'].includes(k) && typeof v !== 'object')
    .map(([k, v]) => `${k} : ${String(v)}`)
    .join(' · ')
}
</script>

<template>
  <div>
    <AdminHeader titre="Journal des accès" :sous-titre="data ? `${data.total} entrée${data.total > 1 ? 's' : ''} · journal d’audit, ni modifiable ni effaçable` : 'Chargement'">
      <NuxtLink to="/admin/comptes" class="btn btn-outline h-10 gap-2 rounded-[10px] px-3.5 text-sm"><UiIcon name="shield-account-outline" :size="18" class="text-gray-500" />Comptes admin</NuxtLink>
    </AdminHeader>
    <div class="px-8 pt-7 pb-9">
      <AdminVide v-if="error" erreur titre="Le journal n’a pas pu être chargé" texte="Réessayez dans un instant.">
        <button type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="refresh()"><UiIcon name="refresh" :size="18" />Réessayer</button>
      </AdminVide>
      <AdminSquelette v-else-if="pending && !data" :lignes="8" />
      <div v-else-if="data" class="card overflow-hidden">
        <div class="flex flex-wrap items-center gap-2.5 border-b border-gray-200 px-5 py-4">
          <label class="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-gray-200 px-3 text-sm text-navy-600">
            <select v-model="filtres.compte" class="appearance-none bg-transparent pr-5 outline-none" aria-label="Compte"><option value="">Tous les comptes</option><option v-for="c in data.comptes" :key="c.id" :value="c.id">{{ c.nom }}</option></select><UiIcon name="chevron-down" :size="16" class="-ml-5 pointer-events-none text-gray-500" />
          </label>
          <label class="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-gray-200 px-3 text-sm text-navy-600">
            <select v-model="filtres.famille" class="appearance-none bg-transparent pr-5 outline-none" aria-label="Type d’action"><option value="">Toutes les actions</option><option v-for="f in data.familles" :key="f.cle" :value="f.cle">{{ f.label }}</option></select><UiIcon name="chevron-down" :size="16" class="-ml-5 pointer-events-none text-gray-500" />
          </label>
          <label class="inline-flex h-9 items-center gap-1.5 rounded-[10px] border border-gray-200 px-3 text-sm text-navy-600">
            <select v-model.number="filtres.jours" class="appearance-none bg-transparent pr-5 outline-none" aria-label="Période"><option :value="1">Dernières 24 heures</option><option :value="7">7 derniers jours</option><option :value="30">30 derniers jours</option><option :value="90">90 derniers jours</option><option :value="0">Tout</option></select><UiIcon name="chevron-down" :size="16" class="-ml-5 pointer-events-none text-gray-500" />
          </label>
        </div>
        <AdminVide v-if="!data.lignes.length" titre="Aucune entrée" texte="Rien ne correspond à ces filtres sur la période." />
        <template v-else>
          <table class="w-full text-sm">
            <thead><tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold tracking-[0.06em] text-gray-500 uppercase"><th class="px-5 py-2.5">Quand</th><th class="px-4 py-2.5">Action</th><th class="px-4 py-2.5">Par</th><th class="px-4 py-2.5">Détail</th><th class="px-4 py-2.5">IP</th></tr></thead>
            <tbody>
              <tr v-for="l in data.lignes" :key="l.id" class="border-b border-gray-100 align-top last:border-0">
                <td class="px-5 py-3 font-mono text-xs whitespace-nowrap text-gray-500">{{ quand(l.ts) }}</td>
                <td class="px-4 py-3">
                  <span class="font-medium" :class="refus(l.action) ? 'text-red-600' : 'text-navy-600'">{{ libelle(l.action) }}</span>
                  <span v-if="l.cible && l.cible !== l.acteur" class="block text-xs text-gray-500">sur le compte de {{ l.cible }}</span>
                </td>
                <td class="px-4 py-3 text-navy-600">{{ l.acteur ?? l.cible ?? '—' }}<span v-if="l.acteur_email" class="block truncate text-xs text-gray-400">{{ l.acteur_email }}</span></td>
                <td class="max-w-[320px] px-4 py-3 text-xs text-gray-500">{{ detail(l) || '—' }}</td>
                <td class="px-4 py-3 font-mono text-xs text-gray-400">{{ l.ip ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
          <AdminPagination class="px-5" :page="data.page" :taille="data.taille" :total="data.total" @change="page = $event" />
        </template>
      </div>
    </div>
  </div>
</template>
