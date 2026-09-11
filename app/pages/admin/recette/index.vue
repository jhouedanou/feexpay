<script setup lang="ts">
// Recette fonctionnelle partagée : quarante contrôles, chaque testeur marque les siens
// (OK, KO, passé, note), tout le monde voit ceux des autres. Ouvert à tous les rôles.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Recette' })
useSeoMeta({ title: 'Recette — Administration Radar by FeexPay', robots: 'noindex' })

interface Controle { k: string; etape: string; attendu: string }
interface Section { num: string; titre: string; contexte: string; controles: Controle[] }
interface Resultat { controle: string; testeur_id: string; testeur: string; statut: 'ok' | 'ko' | 'passe'; note: string; updated_at: string }
interface Recette { version: string; adresse: string; sections: Section[]; resultats: Resultat[] }

import { telecharger } from '~/composables/useAdminMetier'
const { me } = useAdmin()
const erreur = ref<string | null>(null)
/** Vue : tous les résultats, ou seulement les miens (les pastilles des autres disparaissent). */
const vue = ref<'equipe' | 'moi'>('equipe')
const exportEnCours = ref(false)
async function exporter() {
  if (exportEnCours.value) return
  exportEnCours.value = true
  erreur.value = null
  try {
    await telecharger('/api/admin/recette/rapport')
  } catch (e) {
    erreur.value = messageErreur(e)
  } finally {
    exportEnCours.value = false
  }
}
const { data, refresh, error } = await useFetch<Recette>('/api/admin/recette', { headers: useRequestHeaders(['cookie']) })

const controles = computed(() => data.value?.sections.flatMap((s) => s.controles) ?? [])
const parControle = computed(() => {
  const m: Record<string, Resultat[]> = {}
  for (const r of data.value?.resultats ?? []) (m[r.controle] ??= []).push(r)
  return m
})
const mien = (k: string) => parControle.value[k]?.find((r) => r.testeur_id === me.value?.user.id) ?? null
const autres = (k: string) => (vue.value === 'moi' ? [] : (parControle.value[k] ?? []).filter((r) => r.testeur_id !== me.value?.user.id))

const faits = computed(() => controles.value.filter((c) => mien(c.k)).length)
const totaux = computed(() => {
  const t = { ok: 0, ko: 0, passe: 0, testeurs: new Set<string>() }
  for (const r of data.value?.resultats ?? []) {
    t[r.statut] += 1
    t.testeurs.add(r.testeur_id)
  }
  return t
})
const anomalies = computed(() => (data.value?.resultats ?? []).filter((r) => r.statut === 'ko' && (vue.value === 'equipe' || r.testeur_id === me.value?.user.id)))

const LIBELLE: Record<string, string> = { ok: 'OK', ko: 'KO', passe: 'Passé' }
const CLASSE: Record<string, string> = { ok: 'bg-green-100 text-green-600', ko: 'bg-red-100 text-red-600', passe: 'bg-gray-100 text-gray-500' }

const notes = reactive<Record<string, string>>({})
const occupe = ref<string | null>(null)

async function marquer(k: string, statut: 'ok' | 'ko' | 'passe') {
  if (occupe.value) return
  const actuel = mien(k)
  const nouveau = actuel?.statut === statut ? null : statut
  occupe.value = k
  erreur.value = null
  try {
    await apiAdmin(`/api/admin/recette/${k}`, { method: 'PUT', body: { statut: nouveau, note: notes[k] ?? actuel?.note ?? '' } })
    await refresh()
  } catch (e) {
    erreur.value = messageErreur(e)
  } finally {
    occupe.value = null
  }
}
async function noter(k: string) {
  const actuel = mien(k)
  if (!actuel || (notes[k] ?? '') === actuel.note) return
  try {
    await apiAdmin(`/api/admin/recette/${k}`, { method: 'PUT', body: { statut: actuel.statut, note: notes[k] ?? '' } })
    await refresh()
  } catch (e) {
    erreur.value = messageErreur(e)
  }
}
/** Texte avec les segments entre accents graves rendus en police à chasse fixe. */
const segments = (t: string) => t.split(/`([^`]+)`/).map((s, i) => ({ mono: i % 2 === 1, texte: s }))
const quand = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

// Les résultats des autres arrivent au rechargement : rafraîchissement discret toutes les 30 s.
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => { timer = setInterval(() => refresh(), 30000) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div>
    <AdminHeader titre="Recette fonctionnelle" :sous-titre="data ? `Version du ${data.version} · ${controles.length} contrôles · ${totaux.testeurs.size} testeur${totaux.testeurs.size > 1 ? 's' : ''}` : 'Chargement'">
      <div class="inline-flex overflow-hidden rounded-[10px] border border-gray-200 text-sm" role="group" aria-label="Vue">
        <button type="button" class="h-10 px-3.5 font-medium" :class="vue === 'equipe' ? 'bg-navy-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'" @click="vue = 'equipe'">Toute l’équipe</button>
        <button type="button" class="h-10 border-l border-gray-200 px-3.5 font-medium" :class="vue === 'moi' ? 'bg-navy-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'" @click="vue = 'moi'">Mes résultats</button>
      </div>
      <button type="button" class="btn btn-outline h-10 gap-2 rounded-[10px] px-3.5 text-sm" :disabled="exportEnCours" @click="exporter"><UiIcon name="file-pdf-box" :size="18" class="text-gray-500" />{{ exportEnCours ? 'Préparation…' : 'Mon rapport PDF' }}</button>
    </AdminHeader>
    <div class="px-8 pt-7 pb-9">
      <AdminVide v-if="error" erreur titre="La recette n’a pas pu être chargée" texte="Réessayez dans un instant.">
        <button type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="refresh()"><UiIcon name="refresh" :size="18" />Réessayer</button>
      </AdminVide>
      <template v-else-if="data">
        <p v-if="erreur" class="mb-5 rounded-[10px] bg-red-100 px-4 py-3 text-sm text-red-600" role="alert">{{ erreur }}</p>

        <div class="mb-6 grid grid-cols-4 gap-4">
          <div class="card p-5">
            <p class="mb-2 text-[13px] leading-[1.3] text-gray-500">Votre avancement</p>
            <p class="mb-1 text-[28px] leading-none font-bold tracking-[-0.02em] text-navy-600">{{ faits }} <span class="text-lg font-medium text-gray-400">/ {{ controles.length }}</span></p>
            <div class="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200"><div class="h-full rounded-full bg-green-600 transition-[width]" :style="{ width: `${controles.length ? Math.round((faits / controles.length) * 100) : 0}%` }" /></div>
          </div>
          <div class="card p-5"><p class="mb-2 text-[13px] leading-[1.3] text-gray-500">OK, toute l’équipe</p><p class="text-[28px] leading-none font-bold tracking-[-0.02em] text-green-600">{{ totaux.ok }}</p></div>
          <div class="rounded-[14px] border border-orange-200 bg-white p-5"><p class="mb-2 text-[13px] leading-[1.3] text-orange-700">KO à traiter</p><p class="text-[28px] leading-none font-bold tracking-[-0.02em] text-orange-600">{{ totaux.ko }}</p></div>
          <div class="card p-5"><p class="mb-2 text-[13px] leading-[1.3] text-gray-500">Passés</p><p class="text-[28px] leading-none font-bold tracking-[-0.02em] text-navy-600">{{ totaux.passe }}</p></div>
        </div>

        <div class="mb-6 rounded-[14px] border border-orange-200 bg-orange-50 px-5 py-4 text-sm leading-[1.55] text-gray-600">
          Adresse de test : <a :href="data.adresse" target="_blank" rel="noopener" class="font-mono text-navy-600 hover:underline">{{ data.adresse }}</a>. Le domaine radar.feexpay.me ne répond pas encore. Un contrôle se marque OK, KO ou Passé ; cliquer à nouveau efface votre résultat. Un KO attend une note : ce qui s’est passé, l’appareil, l’heure.
        </div>

        <section v-for="s in data.sections" :key="s.num" class="mb-8">
          <h3 class="mb-3.5 text-[17px] font-semibold text-navy-600">{{ s.num }}. {{ s.titre }} <span class="ml-1 text-sm font-normal text-gray-400">{{ s.contexte }}</span></h3>
          <div class="card overflow-hidden">
            <table class="w-full text-sm">
              <thead><tr class="border-b border-gray-200 bg-gray-50 text-left text-xs font-semibold tracking-[0.06em] text-gray-500 uppercase"><th class="w-14 px-4 py-2.5">#</th><th class="px-4 py-2.5">Étape</th><th class="px-4 py-2.5">Résultat attendu</th><th class="w-[230px] px-4 py-2.5">Résultat</th></tr></thead>
              <tbody>
                <tr v-for="c in s.controles" :key="c.k" class="border-b border-gray-100 align-top last:border-0" :class="{ 'bg-gray-50': mien(c.k)?.statut === 'ok' }">
                  <td class="px-4 py-3 font-mono text-xs text-gray-400">{{ c.k }}</td>
                  <td class="px-4 py-3 text-navy-600" :class="{ 'text-gray-400 line-through decoration-gray-300': mien(c.k)?.statut === 'ok' }"><template v-for="(seg, i) in segments(c.etape)" :key="i"><code v-if="seg.mono" class="rounded bg-navy-50 px-1 font-mono text-[12.5px] text-navy-600 no-underline">{{ seg.texte }}</code><template v-else>{{ seg.texte }}</template></template></td>
                  <td class="px-4 py-3 text-gray-500"><template v-for="(seg, i) in segments(c.attendu)" :key="i"><code v-if="seg.mono" class="rounded bg-navy-50 px-1 font-mono text-[12.5px] text-navy-600">{{ seg.texte }}</code><template v-else>{{ seg.texte }}</template></template></td>
                  <td class="px-4 py-3">
                    <div class="inline-flex overflow-hidden rounded-lg border border-gray-200" role="group" :aria-label="`Résultat du contrôle ${c.k}`">
                      <button v-for="st in (['ok', 'ko', 'passe'] as const)" :key="st" type="button" :disabled="occupe === c.k" class="px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 [&+&]:border-l [&+&]:border-gray-200" :class="mien(c.k)?.statut === st ? CLASSE[st] : 'bg-white text-gray-500'" :aria-pressed="mien(c.k)?.statut === st" @click="marquer(c.k, st)">{{ LIBELLE[st] }}</button>
                    </div>
                    <textarea v-if="mien(c.k) && (mien(c.k)!.statut === 'ko' || mien(c.k)!.note)" v-model="notes[c.k]" :placeholder="mien(c.k)!.note || 'Ce qui s’est passé, appareil, heure'" class="field mt-2 min-h-[56px] text-[13px]" @focus="notes[c.k] ??= mien(c.k)!.note" @blur="noter(c.k)" />
                    <div v-if="autres(c.k).length" class="mt-2 flex flex-wrap gap-1">
                      <span v-for="r in autres(c.k)" :key="r.testeur_id" class="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="CLASSE[r.statut]" :title="r.note || quand(r.updated_at)">{{ r.testeur }} · {{ LIBELLE[r.statut] }}</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="card p-6">
          <p class="mb-4 text-xs leading-none font-semibold tracking-[0.08em] text-gray-500 uppercase">Anomalies signalées</p>
          <p v-if="!anomalies.length" class="text-sm text-gray-500">Aucune pour l’instant.</p>
          <ul v-else class="flex flex-col divide-y divide-gray-100">
            <li v-for="r in anomalies" :key="r.controle + r.testeur_id" class="flex gap-3 py-3 text-sm">
              <span class="w-10 shrink-0 font-mono text-xs text-gray-400">{{ r.controle }}</span>
              <span class="flex-1 text-navy-600"><strong>{{ r.testeur }}</strong> — {{ r.note || 'sans détail' }}</span>
              <span class="shrink-0 text-xs text-gray-400">{{ quand(r.updated_at) }}</span>
            </li>
          </ul>
        </section>
      </template>
    </div>
  </div>
</template>
