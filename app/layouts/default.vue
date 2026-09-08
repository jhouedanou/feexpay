<template>
  <div class="min-h-dvh flex flex-col">
    <header class="border-b border-gray-200 bg-white">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="flex items-center gap-2">
          <img src="/brand/logo-feexpay.svg" alt="FeexPay" class="h-7 w-auto" />
          <span class="text-sm font-semibold text-navy-700">Radar</span>
        </NuxtLink>
        <span class="text-xs text-gray-500">Diagnostic gratuit · sans compte</span>
      </div>
    </header>
    <main class="flex-1">
      <slot />
    </main>
    <footer class="border-t border-gray-200 bg-gray-50">
      <div class="mx-auto flex max-w-6xl flex-wrap gap-4 px-4 py-4 text-xs text-gray-500">
        <span>© FeexPay</span>
        <NuxtLink to="/mentions-legales">Mentions légales</NuxtLink>
        <NuxtLink to="/confidentialite">Confidentialité</NuxtLink>
      </div>
    </footer>
  </div>
</template>
