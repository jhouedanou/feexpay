RADAR BY FEEXPAY — PACK DE HANDOFF DÉVELOPPEMENT
Version 1.2 consolidée — 8 septembre 2026

Produit : Radar by FeexPay
Domaine cible : radar.feexpay.me
Chef de projet : Cossi CODJIA
Suivi opérationnel : Morel KOUADIO
Développement : Jean-Luc HOUÉDANOU
Mise en ligne cible : vendredi 25 septembre 2026
Volumétrie de référence : 1 000 participations par mois


1. CONTENU DU PACK

1) CDC_Fonctionnel_Technique_Radar_by_FeexPay_V1.2.docx
   Référence fonctionnelle et technique générale.

2) Annexe_01_Matrice_scoring_Radar_by_FeexPay_V2.2_Normative.xlsx
   Référence normative du scoring, du départage et des tests de contrôle.

3) Annexe_02_Maquettes_UI_Radar_by_FeexPay/
   Maquette principale et arborescence corrigées, toutes deux en V1.2.

4) Annexe_03_Kit_graphique_Radar_by_FeexPay/
   Charte, logos, illustrations et actifs de marque.

5) Annexe_04_Plan_Tracking_Radar_by_FeexPay_V1.2.docx
   Plan GA4, Meta Pixel et Meta Conversions API, sans Google Tag Manager.

6) Annexe_05_Textes_juridiques_Radar_by_FeexPay_V1.0_Valides.docx
   Politique de confidentialité et mentions légales validées par FeexPay.
   Ce fichier est le seul document restant à insérer avant l’envoi final.

7) NOTE_Arbitrages_et_Prerequis_Radar_by_FeexPay_V1.2.txt
   Décisions actées et dépendances externes restantes.

8) JOURNAL_Corrections_Handoff_Radar_by_FeexPay_V1.2.txt
   Synthèse des modifications de la consolidation.

9) MANIFESTE_SHA256_Radar_by_FeexPay_V1.2.txt
   Contrôle d’intégrité du contenu livré et signalement de l’Annexe 05 attendue.


2. ORDRE DE PRÉVALENCE

1) Le CDC V1.2 prévaut pour le périmètre et les règles fonctionnelles.
2) La matrice V2.2 prévaut pour le scoring et le départage.
3) Le plan de tracking V1.2 prévaut pour les événements, paramètres, consentements et tests analytics.
4) Les maquettes V1.2 prévalent pour l’apparence, les états d’interface et le responsive.
5) L’Annexe 05 validée par FeexPay prévaudra pour les textes juridiques publiés.


3. CONSIGNES ESSENTIELLES

- Conserver support.js, _ds/ et assets/ à côté des deux fichiers HTML de l’Annexe 02.
- Le bandeau cookies est compact, fixé en bas et non bloquant.
- Son premier niveau propose uniquement « Tout accepter » et « Personnaliser ».
- Le choix « cookies nécessaires uniquement » se trouve dans « Personnaliser ».
- GA4 et Meta Pixel ne sont activés qu’après le consentement correspondant.
- Meta CAPI est transmis côté serveur conformément au plan de tracking.
- Le jeton CAPI doit être inséré avant transmission du pack ; le Test Event Code est utilisé seulement pendant la recette.
- Le formulaire distingue le consentement obligatoire nécessaire au diagnostic du consentement commercial facultatif.
- Cossi CODJIA pilote la recette fonctionnelle et signale les anomalies ; Jean-Luc HOUÉDANOU réalise les corrections et le débogage.
- Big Five prend en charge les frais récurrents d’hébergement et de services retenus.
- La demande DNS et domaine d’envoi a été transmise à FeexPay ; la délégation reste attendue.


4. DERNIÈRE OPÉRATION AVANT ENVOI

Insérer le document juridique validé à la racine du pack sous le nom exact :

Annexe_05_Textes_juridiques_Radar_by_FeexPay_V1.0_Valides.docx

Puis supprimer le fichier ANNEXE_05_A_INSERER_AVANT_ENVOI_FINAL.txt. Aucun autre fichier ne doit être renommé.

