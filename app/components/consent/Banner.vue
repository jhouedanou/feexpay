<script setup lang="ts">
/**
 * C01 bandeau de consentement et C02 panneau de personnalisation (maquette V1.2, cadres
 * 390 et 1440). Ancré en bas d'écran, non bloquant : la page reste lisible et cliquable.
 * Deux actions en C01 ; « Continuer avec les cookies nécessaires uniquement » vit en C02.
 */
// La politique s'ouvre par-dessus la page : quitter l'écran ferait perdre une saisie ou
// la place dans un parcours.
const { ouvrir: ouvrirConfidentialite } = useConfidentialiteModale()
const { choix, panneau, lire, enregistrer } = useConsent()
const ga = ref(true)
const meta = ref(true)

onMounted(lire)
watch(panneau, (p) => {
  if (p === 'c02') {
    ga.value = choix.value?.analytics ?? true
    meta.value = choix.value?.ads ?? true
  }
})
</script>

<template>
  <Teleport to="body">
    <div v-if="panneau" class="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-end p-3 lg:px-6 lg:pb-6" role="region" aria-label="Cookies">
      <!-- C01 -->
      <div
        v-if="panneau === 'c01'"
        class="pointer-events-auto w-full rounded-[14px] border border-navy-100 bg-white px-4 pt-3.5 pb-4 lg:flex lg:items-center lg:gap-7 lg:px-6 lg:py-[18px]"
        style="box-shadow: 0 14px 36px rgba(6, 20, 43, 0.18)"
      >
        <div class="mb-1.5 flex items-center gap-2 lg:mb-0 lg:contents">
          <UiIcon name="cookie-outline" class="shrink-0 text-orange-600 !h-[18px] !w-[18px] lg:!h-[22px] lg:!w-[22px]" />
          <p class="text-sm leading-[1.3] font-semibold text-navy-600 lg:hidden">Nous utilisons des cookies</p>
        </div>
        <div class="mb-3 min-w-0 lg:mb-0 lg:flex-1">
          <p class="mb-[3px] hidden text-sm leading-[1.35] font-semibold text-navy-600 lg:block">Nous utilisons des cookies</p>
          <p class="text-xs leading-[1.5] text-gray-600 lg:text-[13px]" style="text-wrap: pretty">
            <span class="hidden lg:inline">Les cookies nécessaires font fonctionner le diagnostic. </span>Les cookies analytiques et publicitaires ne sont déposés qu’avec votre accord.
            <button type="button" class="text-orange-600 hover:underline" @click="ouvrirConfidentialite">En savoir plus</button>
          </p>
        </div>
        <div class="flex gap-2 lg:shrink-0 lg:gap-2.5">
          <button type="button" class="btn btn-outline min-h-11 flex-1 rounded-[10px] px-2.5 text-sm lg:flex-none lg:px-[18px]" @click="panneau = 'c02'">Personnaliser</button>
          <button type="button" class="btn btn-primary min-h-11 flex-1 rounded-[10px] px-2.5 text-sm lg:flex-none lg:px-[22px]" @click="enregistrer(true, true, 'c01')">Tout accepter</button>
        </div>
      </div>

      <!-- C02 -->
      <div
        v-else
        class="pointer-events-auto w-full overflow-hidden rounded-[14px] border border-navy-100 bg-white lg:w-[470px]"
        style="box-shadow: 0 18px 44px rgba(6, 20, 43, 0.22)"
      >
        <div class="border-b border-gray-100 px-4 pt-3.5 pb-2.5 lg:px-5 lg:pt-4 lg:pb-3">
          <p class="mb-0.5 text-sm leading-[1.3] font-semibold text-navy-600 lg:text-[15px]">Personnaliser mes cookies</p>
          <p class="text-xs leading-[1.5] text-gray-500">Choix enregistré pour six mois<span class="hidden lg:inline"> · <button type="button" class="text-orange-600 hover:underline" @click="ouvrirConfidentialite">politique de confidentialité</button></span>.</p>
        </div>
        <div class="flex items-center gap-3 border-b border-gray-100 px-4 py-2.5 lg:gap-4 lg:px-5 lg:py-3">
          <div class="min-w-0 flex-1">
            <p class="mb-0.5 text-[13px] leading-[1.3] font-semibold text-navy-600">Cookies nécessaires</p>
            <p class="text-[11px] leading-[1.45] text-gray-500 lg:text-xs"><span class="lg:hidden">Non désactivables</span><span class="hidden lg:inline">Sécurité, réponses en cours, mémorisation du choix.</span></p>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <span class="hidden text-[11px] font-semibold text-gray-500 lg:inline">Toujours actifs</span>
            <span class="flex h-6 w-10 items-center justify-end rounded-full bg-navy-200 p-[3px]" aria-hidden="true"><span class="h-[18px] w-[18px] rounded-full bg-white" /></span>
          </div>
        </div>
        <label class="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 lg:gap-4 lg:px-5 lg:py-3">
          <div class="min-w-0 flex-1">
            <p class="mb-0.5 text-[13px] leading-[1.3] font-semibold text-navy-600">Cookies analytiques</p>
            <p class="text-[11px] leading-[1.45] text-gray-500 lg:text-xs"><span class="lg:hidden">Google Analytics</span><span class="hidden lg:inline">Google Analytics · visites et achèvement, quatorze mois.</span></p>
          </div>
          <input v-model="ga" type="checkbox" class="sr-only" >
          <span class="flex h-6 w-10 shrink-0 items-center rounded-full p-[3px] transition-colors" :class="ga ? 'justify-end bg-green-600' : 'bg-gray-300'"><span class="h-[18px] w-[18px] rounded-full bg-white" /></span>
        </label>
        <label class="flex cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-2.5 lg:gap-4 lg:px-5 lg:py-3">
          <div class="min-w-0 flex-1">
            <p class="mb-0.5 text-[13px] leading-[1.3] font-semibold text-navy-600">Cookies publicitaires</p>
            <p class="text-[11px] leading-[1.45] text-gray-500 lg:text-xs"><span class="lg:hidden">Meta Pixel et Conversions API</span><span class="hidden lg:inline">Meta Pixel et Meta Conversions API · mesure des campagnes.</span></p>
          </div>
          <input v-model="meta" type="checkbox" class="sr-only" >
          <span class="flex h-6 w-10 shrink-0 items-center rounded-full p-[3px] transition-colors" :class="meta ? 'justify-end bg-green-600' : 'bg-gray-300'"><span class="h-[18px] w-[18px] rounded-full bg-white" /></span>
        </label>
        <div class="flex flex-col gap-1.5 border-t border-gray-200 bg-gray-50 px-4 py-3 lg:gap-2 lg:px-5 lg:py-3.5">
          <button type="button" class="btn btn-primary min-h-11 w-full rounded-[10px] text-sm" @click="enregistrer(ga, meta, 'c02')">Enregistrer mes choix</button>
          <button type="button" class="min-h-10 text-xs leading-[1.4] font-medium text-gray-600 underline underline-offset-[3px] lg:text-[13px]" @click="enregistrer(false, false, 'c02')">Continuer avec les cookies nécessaires uniquement</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
