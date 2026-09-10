<script setup lang="ts">
/**
 * Corps de la politique de confidentialité (L01), sans en-tête ni sommaire : la page
 * `/politique-de-confidentialite` et la fenêtre modale de P10 l'affichent toutes deux.
 *
 * `ancres` pose les identifiants de section utilisés par le sommaire de la page. La
 * modale les désactive : deux jeux d'identifiants identiques dans le même document
 * casseraient les liens du sommaire quand la modale est ouverte.
 */
const props = withDefaults(defineProps<{ ancres?: boolean }>(), { ancres: true })
const idSection = (n: number) => (props.ancres ? `l01-${n}` : undefined)

const { ouvrir } = useConsent()
</script>

<template>
  <article
    class="flex max-w-[760px] flex-col gap-8 text-[15px] leading-[1.7] text-gray-700 [&_a]:text-orange-600 [&_a:hover]:underline [&_h2]:mb-2.5 [&_h2]:text-[21px] [&_h2]:leading-[1.3] [&_h2]:font-semibold [&_h2]:text-navy-600 [&_strong]:font-semibold [&_strong]:text-navy-600"
  >
    <section :id="idSection(1)" class="scroll-mt-6">
      <h2>1. Responsable du traitement</h2>
      <p class="mb-2.5">Radar by FeexPay est un service édité par FeexPay, agrégateur de paiement, dont les coordonnées complètes figurent dans les <NuxtLink to="/mentions-legales">mentions légales</NuxtLink>. FeexPay agit en qualité de responsable du traitement pour l’ensemble des données décrites ci-dessous.</p>
      <p>Pour toute question relative à vos données, vous pouvez écrire à <a href="mailto:donnees@feexpay.me">donnees@feexpay.me</a>.</p>
    </section>
    <section :id="idSection(2)" class="scroll-mt-6">
      <h2>2. Données collectées</h2>
      <p class="mb-3">Nous collectons uniquement ce qui est nécessaire au diagnostic et à sa remise.</p>
      <div class="flex flex-col gap-2.5">
        <p><strong>Réponses au questionnaire.</strong> Vos choix aux questions du diagnostic dirigeant et du diagnostic de rayonnement, ainsi que les scores, l’archétype et les constats calculés à partir de ces réponses.</p>
        <p><strong>Données d’identification.</strong> Prénom, nom, nom de l’entreprise, adresse email, et numéro de téléphone si vous le renseignez. Ces données ne sont demandées qu’après l’affichage de votre résultat.</p>
        <p><strong>Données techniques.</strong> Adresse IP tronquée, type d’appareil, navigateur, pages consultées, pays et horodatage, aux seules fins de sécurité et de mesure d’audience.</p>
      </div>
      <p class="mt-3">Aucune donnée bancaire, aucune donnée sensible et aucune donnée relative à des mineurs n’est collectée par Radar by FeexPay.</p>
    </section>
    <section :id="idSection(3)" class="scroll-mt-6">
      <h2>3. Finalités et bases légales</h2>
      <div class="grid grid-cols-[1.3fr_1fr] gap-px overflow-hidden rounded-[10px] border border-gray-200 bg-gray-200 text-sm">
        <span class="eyebrow bg-gray-50 px-3.5 py-3 text-[11px] tracking-[0.06em] text-gray-500">Finalité</span><span class="eyebrow bg-gray-50 px-3.5 py-3 text-[11px] tracking-[0.06em] text-gray-500">Base légale</span>
        <template v-for="[f, b] in FINALITES_CONFIDENTIALITE" :key="f"><span class="bg-white px-3.5 py-3 leading-[1.5] text-gray-700">{{ f }}</span><span class="bg-white px-3.5 py-3 leading-[1.5] text-gray-600">{{ b }}</span></template>
      </div>
      <p class="mt-3">Le refus de la case facultative n’a aucune conséquence : votre diagnostic vous est remis dans les mêmes conditions.</p>
    </section>
    <section :id="idSection(4)" class="scroll-mt-6">
      <h2>4. Cookies et traceurs</h2>
      <p class="mb-3">À votre première visite, une fenêtre vous demande votre choix avant tout dépôt de traceur non nécessaire. Trois catégories existent.</p>
      <div class="flex flex-col gap-2.5">
        <p><strong>Cookies nécessaires.</strong> Sécurité, conservation de vos réponses pendant le diagnostic et mémorisation de votre choix de cookies. Ils sont toujours actifs, car le service ne peut pas fonctionner sans eux.</p>
        <p><strong>Mesure d’audience.</strong> Google Analytics, activable et désactivable. Si vous refusez, nous conservons une mesure limitée, agrégée et sans cookie, qui ne permet pas de vous identifier.</p>
        <p><strong>Publicité.</strong> Meta Pixel, activable et désactivable. Il mesure l’efficacité de nos campagnes et permet l’affichage de publicités adaptées sur les services Meta.</p>
      </div>
      <p class="mt-3">Votre choix est conservé six mois. Vous pouvez le modifier à tout moment depuis le lien « Gérer mes cookies » présent dans le pied de page de toutes nos interfaces.</p>
    </section>
    <section :id="idSection(5)" class="scroll-mt-6">
      <h2>5. Modifier ou retirer votre choix</h2>
      <p class="mb-2.5">Le lien « Gérer mes cookies », présent dans le pied de page de toutes nos interfaces, rouvre la fenêtre de personnalisation. Vous pouvez y activer ou désactiver la mesure d’audience et la publicité, catégorie par catégorie.</p>
      <p>Le retrait d’une catégorie prend effet immédiatement et n’affecte pas l’accès au diagnostic. Il ne remet pas en cause les mesures déjà réalisées avant votre changement de choix.</p>
      <!-- Sur la page, le sommaire porte déjà ce bouton à partir de lg : on ne le répète pas. -->
      <button type="button" class="btn btn-outline mt-4 h-11 rounded-[10px] px-5 text-[13px]" :class="{ 'lg:hidden': ancres }" @click="ouvrir">Gérer mes cookies</button>
    </section>
    <section :id="idSection(6)" class="scroll-mt-6">
      <h2>6. Destinataires</h2>
      <p class="mb-3">Vos données sont accessibles aux seules équipes FeexPay habilitées, selon la matrice de rôles du back-office, et à nos sous-traitants techniques : hébergement du service, envoi des emails de rapport, mesure d’audience et mesure publicitaire.</p>
      <p>Certains de ces prestataires opèrent hors de votre pays de résidence. Ces transferts sont encadrés par les clauses contractuelles types et par des mesures techniques complémentaires. Vos données ne sont jamais vendues.</p>
    </section>
    <section :id="idSection(7)" class="scroll-mt-6">
      <h2>7. Durées de conservation</h2>
      <div class="grid grid-cols-[1.3fr_1fr] gap-px overflow-hidden rounded-[10px] border border-gray-200 bg-gray-200 text-sm">
        <span class="eyebrow bg-gray-50 px-3.5 py-3 text-[11px] tracking-[0.06em] text-gray-500">Donnée</span><span class="eyebrow bg-gray-50 px-3.5 py-3 text-[11px] tracking-[0.06em] text-gray-500">Durée</span>
        <template v-for="[d, n] in DUREES_CONFIDENTIALITE" :key="d"><span class="bg-white px-3.5 py-3 leading-[1.5] text-gray-700">{{ d }}</span><span class="bg-white px-3.5 py-3 leading-[1.5] text-gray-600">{{ n }}</span></template>
      </div>
    </section>
    <section :id="idSection(8)" class="scroll-mt-6">
      <h2>8. Sécurité</h2>
      <p>Les échanges sont chiffrés en transit, l’accès au back-office est nominatif, sur invitation, avec authentification renforcée et journalisation des actions. Les habilitations suivent le principe du moindre privilège : la lecture des fiches prospects, le renvoi de rapport, l’export et la suppression de données relèvent de rôles distincts.</p>
    </section>
    <section :id="idSection(9)" class="scroll-mt-6">
      <h2>9. Vos droits</h2>
      <p class="mb-3">Vous disposez d’un droit d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité, ainsi que du droit de retirer votre consentement à tout moment.</p>
      <p>Le retrait du consentement ne remet pas en cause les traitements déjà effectués. Pour exercer vos droits, écrivez à <a href="mailto:donnees@feexpay.me">donnees@feexpay.me</a> : nous répondons dans un délai maximum d’un mois.</p>
    </section>
    <section :id="idSection(10)" class="scroll-mt-6">
      <h2>10. Contact et réclamation</h2>
      <p class="mb-3">Pour toute demande relative à cette politique : <a href="mailto:donnees@feexpay.me">donnees@feexpay.me</a>. Si la réponse ne vous satisfait pas, vous pouvez saisir l’autorité de protection des données personnelles de votre pays de résidence.</p>
      <p>Cette politique peut évoluer. Toute modification substantielle est signalée sur cette page et, le cas échéant, par une nouvelle demande de consentement.</p>
    </section>
  </article>
</template>
