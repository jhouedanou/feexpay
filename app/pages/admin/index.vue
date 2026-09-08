<script setup lang="ts">
// A02 — dashboard. Lot 5 : indicateurs réels. Pour l'instant, l'accueil de l'espace admin.
definePageMeta({ layout: 'admin', middleware: 'admin', role: 'lecture' })
useSeoMeta({ title: 'Dashboard — Administration Radar by FeexPay', robots: 'noindex' })
const { me } = useAdmin()
</script>

<template>
  <div>
    <AdminHeader titre="Dashboard" :sous-titre="`Bienvenue ${me?.user.prenom ?? ''} · les indicateurs arrivent avec le lot 5`" />
    <div class="px-8 py-7">
      <div class="card p-6">
        <p class="eyebrow mb-3 text-gray-500">Espace interne</p>
        <p class="text-base leading-[1.6] text-gray-700">Les participations, les résultats et les rapports seront consultables ici. Les comptes admin et les réglages sont déjà actifs dans le rail latéral.</p>
      </div>
    </div>
  </div>
</template>
