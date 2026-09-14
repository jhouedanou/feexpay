<script setup lang="ts">
// A08 — accès refusé : la section est masquée et le rôle requis expliqué, aucune donnée partielle.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture' })
useSeoMeta({ title: 'Accès refusé — Administration Radar by FeexPay', robots: 'noindex' })
const { me } = useAdmin()
</script>

<template>
  <div>
    <AdminHeader titre="Accès refusé" />
    <div class="px-8 py-7">
      <div class="card mx-auto max-w-[520px] p-8 text-center">
        <span class="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-[14px] bg-red-100 text-red-600"><UiIcon name="lock-outline" :size="28" /></span>
        <p class="mb-2 text-lg font-semibold text-navy-600">Le rôle {{ me?.user.roleLabel }} ne donne pas accès à cette section</p>
        <p class="mb-5 text-[15px] leading-[1.6] text-gray-600">Les permissions sont vérifiées côté API : aucune donnée partielle n’est affichée.</p>
        <a href="mailto:amedeel@feexpay.me" class="btn btn-outline h-11 rounded-[10px] px-5 text-sm">Demander l’accès</a>
      </div>
    </div>
  </div>
</template>
