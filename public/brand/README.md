# Actifs de marque — Radar by FeexPay

Assets consommés par l'app (servis tels quels par Nuxt sous `/brand/…`).
La source normative reste le pack `MarketingBS/` : **il ne doit jamais être modifié**, son intégrité
est couverte par `MANIFESTE_SHA256_Radar_by_FeexPay_V1.1.txt`. Toute correction se fait ici, en copie.

## Correction appliquée aux logotypes SVG

Les deux SVG livrés (`Logo_FeexPay_bicolore_fond_clair.svg` = `assets/logo-feexpay.svg`,
`Logo_FeexPay_blanc.svg` = `assets/logo-feexpay-white.svg`) référencent des classes `cls-1`,
`cls-2`, `cls-3` mais leur bloc `<defs>` est **vide** : aucune règle ne définit ces classes.
Les navigateurs appliquent donc le `fill` par défaut, `black` — le logo s'affichait entièrement noir
(voir `docs/brand/verification-logos.png`).

Correction : les `fill` sont posés en attributs de présentation sur chaque forme (surchargeables en CSS,
sans `<style>` global qui entrerait en collision si le logo est inliné plusieurs fois).

| Fichier | `cls-1` | `cls-2` | `cls-3` |
|---|---|---|---|
| `logo-feexpay.svg` | `#D35E14` (orange — carré haut-gauche + « Pay ») | `#173154` (bleu nuit — carré bas-droite + « Feex ») | `none` (encoche) |
| `logo-feexpay-white.svg` | `#FFFFFF` (tout le logotype) | `none` (encoche) | — |

**Aucune recoloration** : les valeurs proviennent d'un relevé pixel des PNG livrés du même artwork
(`Logo_FeexPay_bicolore_fond_clair.png`, `Symbole_FeexPay.png`), conformément au kit graphique
(« Aucun logo ne doit être déformé, recoloré, recadré ou recomposé »).

L'encoche du symbole est `fill="none"` et non blanche : le kit précise qu'elle « reste transparente
et laisse apparaître le fond ». Le logo reste ainsi utilisable sur bleu nuit et sur orange.

Autres modifications, sans effet visuel :
- `id="Calque_1"` retiré (collision d'`id` si le logo est inliné deux fois) ;
- `role="img"` + `<title>FeexPay</title>` ajoutés (nom accessible, WCAG 2.2 AA).

## À noter

La palette d'**interface** Radar (`README_Actifs_graphiques.txt`) est bleu nuit `#112C56` /
orange `#D45D00`. Le **logotype** livré, lui, est dessiné en `#173154` / `#D35E14` (= tokens
`--fx-navy-600` / `--fx-orange-600` du design system embarqué). L'écart est assumé : les SVG
reproduisent l'artwork livré, les tokens `--fx-*` de l'UI suivent la palette normative.
À confirmer avec Morel KOUADIO en même temps que le point 7 de PLAN.md §10b
(« logos + illustration définitifs »).
