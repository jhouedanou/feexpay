# Brouillon — email au chef de projet

> À relire et à envoyer depuis votre messagerie. Rien n'est envoyé automatiquement.
>
> Rédigé le 8 septembre 2026. Note importante : l'échéance fixée dans votre email du
> 5 septembre est le **18 septembre**. Les éléments demandés ne sont donc **pas en retard** à
> ce jour. Le texte ci-dessous ne le reproche pas — il notifie une décision technique prise
> pour ne plus dépendre de ces éléments. C'est une position plus solide qu'une relance : elle
> montre que le projet avance et déplace la charge de la preuve.

---

**Objet :** Radar by FeexPay — parcours de diagnostic livré, et décisions techniques prises pour tenir le calendrier

Bonjour,

Le parcours public de Radar by FeexPay est fonctionnel. Vous pouvez le tester dès maintenant :
les deux diagnostics se déroulent de bout en bout, du choix jusqu'à l'affichage du résultat.

**Ce qui est livré**

- Les deux diagnostics complets : profil du dirigeant (14 questions, 8 archétypes) et
  rayonnement de l'entreprise (7 questions, score sur 100, niveau et météo).
- Le moteur de scoring en version 2.1, conforme à la matrice normative. Les cas de contrôle de
  l'annexe 01 sont vérifiés automatiquement : `BCBADBADDBCADA` donne bien Stratège,
  `CCCCCCC` donne bien 67 « Challenger fort », les bornes 0 et 100 sont exactes. Ces
  vérifications tournent à chaque modification du code.
- Le résultat s'affiche **avant tout formulaire**, conformément au cahier des charges.
- Le parcours reprend là où il s'est arrêté pendant 7 jours, y compris après fermeture du
  navigateur.
- L'interface suit le kit graphique : palette, typographie Poppins, iconographie, composants
  et états repris de la maquette de l'annexe 02.

**Décisions techniques prises pour ne pas dépendre d'éléments extérieurs**

Trois choix initiaux faisaient dépendre la livraison d'éléments qui ne sont pas encore
arrivés. Je les ai remplacés :

| Choix initial | Remplacé par | Ce que cela évite |
|---|---|---|
| Génération du PDF par navigateur sans interface | Génération en JavaScript, sans navigateur | N'exige plus un second serveur dédié, ni son budget |
| File d'attente pour les emails | Envoi direct, journalisé en base | Idem, et le renvoi manuel depuis l'administration reste possible |
| Envoi depuis `@feexpay.me` en dur | Adresse d'expédition en paramètre de configuration | Ne dépend plus des accès DNS du domaine |

Conséquence : le projet peut être mis en ligne et testé **sans attendre aucun des sept
éléments** demandés dans mon message du 5 septembre.

**Ce que ces éléments conditionnent malgré tout**

Ils ne bloquent plus le développement, mais chacun a un effet précis sur ce qui pourra être
mis en service :

1. **Accès DNS ou domaine d'expédition** — Tant qu'aucun domaine n'est vérifié auprès du
   prestataire d'emailing, les rapports ne peuvent être envoyés qu'à des adresses de test.
   *Aucun email ne partira vers un prospect réel.* Un domaine autre que `feexpay.me` peut
   convenir si cela va plus vite ; dites-moi lequel et c'est réglé en une configuration.
2. **Titulaire et budget des comptes** (hébergement, base de données, emailing) — Aujourd'hui
   sur des comptes de développement. À transférer avant la mise en production, sinon le
   service dépend de comptes personnels.
3. **Adresses des administrateurs** — Sans elles, le back-office ne peut pas être ouvert : les
   inscriptions publiques sont désactivées par conception, l'accès se fait sur invitation
   nominative.
4. **Identifiants GA4 et Meta** — Sans eux, aucune mesure d'acquisition. Les diagnostics
   réalisés pendant cette période ne seront pas attribuables à une source de trafic, et cette
   donnée est définitivement perdue : elle ne se rattrape pas rétroactivement.
5. **Mentions légales et politique de confidentialité** — Deux pages d'attente sont en ligne.
   En l'état, une mise en production collectant des données personnelles serait irrégulière.
   C'est le seul point qui empêche formellement une ouverture au public.
6. **Règle de départage des archétypes** (et le document `TDR_Radar_by_FeexPay_V1_Valide.docx`,
   cité dans la matrice mais absent du pack) — Le moteur applique aujourd'hui une règle par
   défaut, documentée. Elle concerne environ un cas sur six cents. Si la règle définitive
   diffère, les diagnostics déjà réalisés devront être recalculés — d'où l'intérêt de trancher
   avant l'ouverture, pas après.
7. **Confirmation des logos et de l'illustration** — Les logos vectoriels livrés comportaient
   une anomalie : les couleurs n'étaient définies nulle part, le logo s'affichait entièrement
   en noir. Je l'ai corrigée à partir d'un relevé des versions PNG du même artwork, sans
   recoloration. Les couleurs du logotype livré diffèrent de celles de la palette d'interface :
   à confirmer.

**Ce qu'il me faut, et quand**

Pour tenir la suite, j'ai besoin des points **1, 5 et 6** en priorité. L'échéance du
18 septembre reste valable de mon côté. Passé cette date, je continuerai avec les options par
défaut décrites ci-dessus, et les conséquences listées s'appliqueront — notamment
l'impossibilité d'ouvrir le service au public et la perte des données d'acquisition.

Je reste disponible pour en parler de vive voix si c'est plus rapide.

Bien à vous,
Jean-Luc Houédanou
