<script setup lang="ts">
// L02 — mentions légales (maquette V1.2). Texte provisoire de maquettage : la version
// validée par FeexPay (annexe 05) remplacera ces contenus. La mise en page est validée.
useSeoMeta({ title: 'Mentions légales — Radar by FeexPay', robots: 'noindex' })
</script>

<template>
  <div>
    <div class="px-5 pt-7 pb-6 md:px-10 lg:px-0 lg:pt-14 lg:pb-10" style="background: linear-gradient(180deg, #eef3f9 0%, #ffffff 100%)">
      <div class="wrap lg:!px-6">
        <p class="mb-3 text-[13px] leading-[1.3] text-gray-500"><NuxtLink to="/" class="hover:text-navy-600">Accueil</NuxtLink> <span class="text-gray-300">/</span> Mentions légales</p>
        <h1 class="mb-3.5 text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-navy-600 lg:text-[40px]">Mentions légales</h1>
        <p class="max-w-[760px] text-base leading-[1.65] text-gray-600">Informations relatives à l’éditeur du service Radar by FeexPay, à son hébergement et aux conditions d’utilisation du site.</p>
      </div>
    </div>

    <div class="wrap pb-14 lg:!px-6">
      <div class="grid gap-8 text-[15px] leading-[1.7] text-gray-700 md:grid-cols-2 lg:max-w-[1120px] [&_a]:text-orange-600 [&_a:hover]:underline [&_h2]:mb-2.5 [&_h2]:text-[21px] [&_h2]:leading-[1.3] [&_h2]:font-semibold [&_h2]:text-navy-600">
        <section>
          <h2>Éditeur du service</h2>
          <p class="mb-2.5">Radar by FeexPay est un service édité et exploité par FeexPay, agrégateur de paiement présent au Bénin, au Burkina Faso, au Congo Brazzaville, en Côte d’Ivoire, au Mali, au Sénégal et au Togo.</p>
          <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm leading-[1.6]">
            <dt class="text-[13px] font-semibold text-gray-500">Dénomination</dt><dd>FeexPay</dd>
            <dt class="text-[13px] font-semibold text-gray-500">Forme juridique</dt><dd>À confirmer par FeexPay</dd>
            <dt class="text-[13px] font-semibold text-gray-500">Immatriculation</dt><dd>RCCM à confirmer par FeexPay</dd>
            <dt class="text-[13px] font-semibold text-gray-500">Siège social</dt><dd>Adresse à confirmer par FeexPay</dd>
            <dt class="text-[13px] font-semibold text-gray-500">Contact</dt><dd><a href="mailto:contact@feexpay.me">contact@feexpay.me</a></dd>
          </dl>
        </section>
        <section>
          <h2>Responsable de la publication</h2>
          <p class="mb-5">La direction de FeexPay est responsable de la publication du service. Nom et fonction à confirmer par FeexPay avant mise en ligne.</p>
          <h2>Hébergement</h2>
          <p>Le service est hébergé par le prestataire d’infrastructure retenu par FeexPay. Raison sociale, adresse et téléphone de l’hébergeur à confirmer avant mise en ligne.</p>
        </section>
        <section>
          <h2>Propriété intellectuelle</h2>
          <p>La marque FeexPay, le nom Radar by FeexPay, les logos, les emblèmes d’archétypes, les textes, les visuels, la méthode de scoring et les interfaces du service sont protégés. Toute reproduction, adaptation ou réutilisation, totale ou partielle, sans autorisation écrite préalable est interdite. Les cartes de résultat et les rapports produits par le service peuvent être librement partagés par leur destinataire, sans modification.</p>
        </section>
        <section>
          <h2>Nature du diagnostic</h2>
          <p>Radar by FeexPay fournit une analyse indicative fondée sur les réponses déclaratives de l’utilisateur. Il ne constitue ni un audit, ni un conseil juridique, comptable ou financier, et n’engage pas la responsabilité de FeexPay quant aux décisions prises sur cette base.</p>
        </section>
        <section>
          <h2>Données personnelles</h2>
          <p>Le traitement des données personnelles est décrit dans la <NuxtLink to="/politique-de-confidentialite">politique de confidentialité</NuxtLink>. Vos choix en matière de cookies sont modifiables à tout moment depuis le lien « Gérer mes cookies » du pied de page.</p>
        </section>
        <section>
          <h2>Droit applicable</h2>
          <p>Le service est soumis au droit du pays du siège social de FeexPay. En cas de litige, les tribunaux compétents de ce ressort sont seuls saisis, après tentative de résolution amiable.</p>
        </section>
      </div>
    </div>
  </div>
</template>
