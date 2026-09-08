<template>
  <div class="flex min-h-dvh flex-col">
    <!-- En-tête 76 px, collant, voile blanc 92 % + flou (maquette planche 05). -->
    <header
      class="sticky top-0 z-30 border-b border-gray-200 backdrop-blur-[10px]"
      style="background: rgba(255, 255, 255, 0.92)"
    >
      <div
        class="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-5 md:px-8"
        style="height: var(--header-h)"
      >
        <NuxtLink to="/" class="shrink-0">
          <img src="/brand/logo-feexpay.svg" alt="Radar by FeexPay" class="h-7 w-auto" >
        </NuxtLink>

        <nav class="hidden flex-1 items-center gap-7 text-[15px] font-medium text-gray-700 md:flex">
          <NuxtLink to="/diagnostic" class="hover:text-navy-600">Le diagnostic</NuxtLink>
          <NuxtLink to="/#fonctionnement" class="hover:text-navy-600">Fonctionnement</NuxtLink>
          <NuxtLink to="/confidentialite" class="hover:text-navy-600">Confidentialité</NuxtLink>
        </nav>

        <div class="hidden items-center gap-5 md:flex">
          <a
            href="https://feexpay.me"
            rel="noopener noreferrer"
            class="text-[15px] font-medium text-navy-600 hover:underline"
          >
            feexpay.me
          </a>
          <NuxtLink
            to="/diagnostic"
            class="inline-flex items-center bg-orange-600 px-5 text-[15px] font-semibold text-white hover:bg-orange-700 active:bg-orange-800"
            style="height: var(--control-h); border-radius: var(--radius-control)"
          >
            Commencer un diagnostic
          </NuxtLink>
        </div>

        <NuxtLink
          to="/diagnostic"
          class="inline-flex items-center bg-orange-600 px-4 text-sm font-semibold text-white md:hidden"
          style="height: 40px; border-radius: var(--radius-control)"
        >
          Commencer
        </NuxtLink>
      </div>
    </header>

    <main class="flex-1"><slot /></main>

    <!-- Pied de page en bleu nuit (maquette planche 05). -->
    <footer class="bg-navy-700 px-5 py-12 md:px-8">
      <div class="mx-auto max-w-[1200px]">
        <div class="grid gap-9 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <img src="/brand/logo-feexpay-white.svg" alt="FeexPay" class="h-6 w-auto" >
            <p class="mt-4 text-[13px] leading-[1.6] text-navy-300">
              Radar by FeexPay · Powered by FeexPay. Rapidité — Sécurité — Fiabilité.
            </p>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-navy-300">
              Le diagnostic
            </p>
            <ul class="mt-4 space-y-2.5 text-sm leading-[1.4] text-navy-100">
              <li>
                <NuxtLink to="/diagnostic/dirigeant/introduction" class="hover:text-white">
                  Profil du dirigeant
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/diagnostic/rayonnement/introduction" class="hover:text-white">
                  Rayonnement de l'entreprise
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/diagnostic" class="hover:text-white">Lecture croisée</NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-navy-300">Cadre</p>
            <ul class="mt-4 space-y-2.5 text-sm leading-[1.4] text-navy-100">
              <li>
                <NuxtLink to="/confidentialite" class="hover:text-white">
                  Politique de confidentialité
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/mentions-legales" class="hover:text-white">
                  Mentions légales
                </NuxtLink>
              </li>
            </ul>
          </div>

          <div>
            <p class="text-xs font-semibold uppercase tracking-[0.08em] text-navy-300">FeexPay</p>
            <ul class="mt-4 space-y-2.5 text-sm leading-[1.4] text-navy-100">
              <li>
                <a href="mailto:contact.ci@feexpay.me" class="hover:text-white">Nous écrire</a>
              </li>
              <li>
                <a href="https://feexpay.me" rel="noopener noreferrer" class="hover:text-white">
                  feexpay.me
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
