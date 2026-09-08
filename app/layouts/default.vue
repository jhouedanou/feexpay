<template>
  <div class="flex min-h-dvh flex-col">
    <!-- En-tête 76 px, collant, voile blanc 92 % + flou (maquette planche 05). -->
    <header class="sticky top-0 z-30 border-b border-gray-200 backdrop-blur-[10px]" style="background: rgba(255, 255, 255, 0.92)">
      <div
        class="mx-auto flex max-w-[1200px] items-center justify-between px-5 md:px-8"
        style="height: var(--header-h)"
      >
        <NuxtLink to="/" class="flex items-center gap-2.5">
          <img src="/brand/logo-feexpay.svg" alt="FeexPay" class="h-7 w-auto" >
          <span class="text-sm font-semibold text-navy-700">Radar</span>
        </NuxtLink>

        <nav class="hidden items-center gap-7 type-small text-gray-600 md:flex">
          <NuxtLink to="/diagnostic" class="hover:text-navy-700">Le diagnostic</NuxtLink>
          <NuxtLink to="/confidentialite" class="hover:text-navy-700">Confidentialité</NuxtLink>
          <a href="https://feexpay.me" rel="noopener noreferrer" class="hover:text-navy-700">
            feexpay.me
          </a>
          <NuxtLink
            to="/diagnostic"
            class="inline-flex items-center bg-orange-600 px-5 font-semibold text-white hover:bg-orange-700 active:bg-orange-800"
            style="height: var(--control-h); border-radius: var(--radius-control)"
          >
            Commencer
          </NuxtLink>
        </nav>

        <span class="type-caption text-gray-500 md:hidden">Gratuit · sans compte</span>
      </div>
    </header>

    <main class="flex-1"><slot /></main>

    <footer class="border-t border-gray-200 bg-gray-50">
      <div class="mx-auto max-w-[1200px] px-5 py-10 md:px-8">
        <div class="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <img src="/brand/logo-feexpay.svg" alt="FeexPay" class="h-6 w-auto" >
            <p class="mt-3 type-caption text-gray-500">
              Radar by FeexPay · Powered by FeexPay
            </p>
          </div>
          <div>
            <p class="type-eyebrow">Le diagnostic</p>
            <ul class="mt-3 space-y-2 type-small text-gray-600">
              <li>
                <NuxtLink to="/diagnostic/dirigeant/introduction" class="hover:text-navy-700">
                  Profil du dirigeant
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/diagnostic/rayonnement/introduction" class="hover:text-navy-700">
                  Rayonnement de l’entreprise
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <p class="type-eyebrow">Cadre</p>
            <ul class="mt-3 space-y-2 type-small text-gray-600">
              <li>
                <NuxtLink to="/mentions-legales" class="hover:text-navy-700">
                  Mentions légales
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/confidentialite" class="hover:text-navy-700">
                  Confidentialité
                </NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <p class="type-eyebrow">FeexPay</p>
            <p class="mt-3 type-small text-gray-600">Rapidité — Sécurité — Fiabilité.</p>
          </div>
        </div>
        <p class="mt-8 border-t border-gray-200 pt-5 type-caption text-gray-500">© FeexPay</p>
      </div>
    </footer>
  </div>
</template>
