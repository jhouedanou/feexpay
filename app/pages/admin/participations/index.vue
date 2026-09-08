<script setup lang="ts">
// Liste des participations (entrée « Participations » du rail) : recherche, type, statut, pagination.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture', section: 'Participations' })
useSeoMeta({ title: 'Participations — Administration Radar by FeexPay', robots: 'noindex' })
const route = useRoute()
const filtres = reactive({ q: String(route.query.q ?? ''), type: String(route.query.type ?? ''), status: String(route.query.status ?? '') })
const page = ref(Number(route.query.page ?? 1) || 1)
watch(filtres, () => (page.value = 1))
const query = computed(() => ({ ...filtres, page: page.value, taille: 20 }))
const { data, error, pending, refresh } = await useFetch<any>('/api/admin/participations', { query, headers: useRequestHeaders(['cookie']) })
const TYPE: Record<string, string> = { dirigeant: 'Profil du dirigeant', rayonnement: 'Rayonnement' }
const STATUT: Record<string, [string, string]> = { completed: ['Terminée', 'bg-green-100 text-green-600'], in_progress: ['En cours', 'bg-amber-100 text-amber-600'], abandoned: ['Abandonnée', 'bg-gray-100 text-gray-500'] }
const actifs = computed(() => [filtres.type, filtres.status, filtres.q].filter(Boolean).length)
</script>

<template>
  <div>
    <AdminHeader titre="Participations" :sous-titre="data ? `${nombre(data.total)} participation${data.total > 1 ? 's' : ''}` : undefined">
      <label class="flex h-10 w-[300px] items-center gap-2 rounded-[10px] border-[1.5px] border-gray-300 bg-white px-3">
        <UiIcon name="magnify" :size="18" class="text-gray-500" />
        <input v-model.lazy="filtres.q" type="search" placeholder="Nom, entreprise, identifiant" class="w-full bg-transparent text-sm leading-none text-navy-600 outline-none placeholder:text-gray-400" >
      </label>
    </AdminHeader>
    <div class="flex flex-wrap items-center gap-2.5 border-b border-gray-200 bg-white px-8 py-4">
      <span class="mr-1 text-xs leading-none font-semibold tracking-[0.06em] text-gray-500 uppercase">Filtres</span>
      <label v-for="s in [{ cle: 'type', label: 'Diagnostic', options: [['dirigeant', 'Profil du dirigeant'], ['rayonnement', 'Rayonnement']] }, { cle: 'status', label: 'Statut', options: [['completed', 'Terminée'], ['in_progress', 'En cours'], ['abandoned', 'Abandonnée']] }]" :key="s.cle" class="relative inline-flex h-[34px] items-center rounded-full border-[1.5px] pr-2.5 pl-3 text-[13px] leading-none" :class="(filtres as any)[s.cle] ? 'border-orange-600 bg-orange-50 font-medium text-navy-600' : 'border-gray-300 text-gray-600'">
        <select v-model="(filtres as any)[s.cle]" class="appearance-none bg-transparent pr-5 outline-none" :style="{ width: `calc(${(s.options.find((o) => o[0] === (filtres as any)[s.cle])?.[1] ?? s.label).length}ch + 18px)` }" :aria-label="s.label"><option value="">{{ s.label }}</option><option v-for="o in s.options" :key="o[0]" :value="o[0]">{{ o[1] }}</option></select>
        <UiIcon name="chevron-down" :size="15" class="pointer-events-none absolute right-2.5" />
      </label>
      <button v-if="actifs" type="button" class="ml-auto text-[13px] leading-none font-medium text-navy-600 hover:underline" @click="filtres.q = ''; filtres.type = ''; filtres.status = ''">Réinitialiser les filtres</button>
    </div>
    <div class="px-8 pt-5">
      <AdminVide v-if="error" erreur titre="Les données n’ont pas pu être chargées" texte="La liste n’a pas répondu. Vos filtres et votre sélection sont conservés.">
        <button type="button" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm" @click="refresh()"><UiIcon name="refresh" :size="18" />Réessayer</button>
      </AdminVide>
      <AdminSquelette v-else-if="pending && !data" :lignes="6" />
      <AdminVide v-else-if="data && !data.total" :titre="actifs ? 'Aucune participation ne correspond' : 'Aucune participation pour le moment'" :texte="actifs ? 'Élargissez la sélection pour retrouver des participations.' : 'Les participations apparaissent ici dès qu’un visiteur commence un diagnostic.'" icone="clipboard-list-outline">
        <button v-if="actifs" type="button" class="btn btn-navy h-10 rounded-[10px] px-4 text-sm" @click="filtres.q = ''; filtres.type = ''; filtres.status = ''">Réinitialiser les filtres</button>
        <a v-else href="/" target="_blank" rel="noopener" class="btn btn-navy h-10 gap-2 rounded-[10px] px-4 text-sm"><UiIcon name="open-in-new" :size="18" />Voir le lien public</a>
      </AdminVide>
      <template v-else-if="data">
        <div class="card overflow-hidden" :class="{ 'opacity-60': pending }">
          <div class="grid grille-participations border-b border-gray-200 bg-gray-50">
            <span v-for="c in ['Identifiant', 'Diagnostic', 'Contact', 'Statut', 'Résultat', 'Commencée', 'Moteur']" :key="c" class="px-4 py-[13px] text-xs leading-[1.2] font-semibold text-gray-600">{{ c }}</span>
          </div>
          <NuxtLink v-for="p in data.items" :key="p.id" :to="`/admin/participations/${p.id}`" class="grid grille-participations border-b border-gray-100 hover:bg-orange-50">
            <span class="px-4 py-3.5 font-mono text-[13px] leading-[1.3] font-medium text-navy-600">{{ p.identifiant }}</span>
            <span class="px-4 py-3.5 text-sm leading-[1.3] text-gray-700">{{ TYPE[p.diagnostic_type] }}</span>
            <span class="px-4 py-3.5"><template v-if="p.contact_id"><span class="block text-sm leading-[1.3] font-medium text-navy-600">{{ p.prenom }} {{ p.nom }}</span><span class="block text-xs text-gray-500">{{ p.entreprise ?? '' }}</span></template><span v-else class="text-sm text-gray-400">Anonyme</span></span>
            <span class="flex items-center px-4 py-3.5"><span class="rounded-full px-[9px] py-1 text-xs leading-[1.4] font-medium" :class="STATUT[p.status]?.[1]">{{ STATUT[p.status]?.[0] ?? p.status }}</span></span>
            <span class="flex items-center px-4 py-3.5 text-[13px] leading-[1.3] text-gray-700"><template v-if="p.profil"><img :src="`/brand/emb-${slugArchetype(p.profil)}-64.png`" alt="" class="mr-1.5 h-[18px] w-[18px]" >{{ p.profil }}</template><template v-else-if="p.score !== null">{{ p.score }} · {{ niveauCourt(p.niveau) }}</template><span v-else class="text-gray-400">—</span></span>
            <span class="px-4 py-3.5 text-[13px] leading-[1.3] whitespace-nowrap text-gray-700">{{ dateHeure(p.started_at) }}</span>
            <span class="px-4 py-3.5 font-mono text-[13px] leading-[1.3] text-navy-600">{{ p.version }}</span>
          </NuxtLink>
        </div>
        <AdminPagination :page="data.page" :taille="data.taille" :total="data.total" @change="page = $event" />
      </template>
    </div>
  </div>
</template>
