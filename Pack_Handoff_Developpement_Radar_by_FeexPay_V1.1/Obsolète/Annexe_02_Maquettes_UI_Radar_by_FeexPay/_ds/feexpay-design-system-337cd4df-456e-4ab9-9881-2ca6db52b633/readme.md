# FeexPay Design System

FeexPay is a West/Central African **payment aggregator** ("agrégateur de paiement"). Merchants
open one account and collect from every local mobile-money network and card scheme through a
single integration — MTN Mobile Money, MOOV Money, Celtiis, Coris, Wave, Orange Money, Airtel,
Free Money, T-Money, plus Visa / Mastercard / American Express. Live in Bénin, Burkina Faso,
Congo Brazzaville, Côte d'Ivoire, Mali, Sénégal and Togo.

The brand promise is three words, and they appear in the logo lockup itself:
**Rapidité – Sécurité – Fiabilité.**

## Products represented

| Product | What it is |
| --- | --- |
| **FeexLink** | One-click payment links, shared over WhatsApp, Messenger, Facebook, email, SMS. |
| **FeexCorporate** | Mass payouts to employees, clients and suppliers. |
| **FeexPage** | Customisable hosted payment pages / instant online shop. |
| **Payout API** | Programmatic, scheduled and automated bulk payouts. |
| **SEND** | Wallet-to-wallet and shop-to-shop transfers inside FeexPay. |
| **FeexPay Business** | The merchant application (marketed at /download). |

Surfaces: the marketing site (feexpay.me), the developer documentation (docs.feexpay.me), the
merchant dashboard and the FeexPay Business app.

## Sources used to build this system

- **Brand artwork supplied by the user** (`uploads/`): `Refonte logo feexpay.svg`,
  `Refonte logo blanc feexpay.svg`, `Refonte logo blanc 2 feexpay.svg` and their PNG exports,
  `Logo sans écrit.png` (symbol only), `FAVICON.png`, `Icône-App.jpg`, `Face.png`, `Dos.png`
  (tagline lockup). Copied into `assets/`.
- **`Déclinaisons.psd`, `Logo FeexPay.ai`, `Refonte logo et déclinaisons.ai`** were listed in the
  brief but did not arrive in the project — nothing was read from them.
- **https://feexpay.me** — home, `/solutions`, `/pricing` read live for copy, information
  architecture and the product inventory. The site is a compiled Next.js bundle, so its exact
  CSS values could not be read; colour values here are sampled from the supplied logo artwork.
- **https://docs.feexpay.me** — developer documentation (referenced, not recreated).

---

## CONTENT FUNDAMENTALS

**Language.** French first, English second (the site has an FR/EN switch, FR is default). Write
French copy by default. Keep accents and French typographic conventions: `1,7%` with a comma,
`15 000 FCFA` with a thin space, `«` guillemets when quoting.

**Person.** FeexPay says **"vous"**, always — never "tu", and rarely "nous" except when the
company is the subject of a promise ("FeexPay est cet agrégateur de paiement qui vous
accompagne…"). Copy is written *to* the merchant, about *their* business:
"Gérez plusieurs méthodes de paiement en un seul endroit, **boostez vos ventes** et offrez une
expérience client fluide."

**Voice.** Confident, warm, slightly aspirational — not the clipped neutral tone of a Western
fintech. It talks about growth and nation-building, not latency and uptime:
"Le développement de la finance digitale est un catalyseur de la croissance des entreprises et
par ricochet de l'émergence de nos nations." And it is unembarrassed about enthusiasm:
"Prêt à débuter cette merveilleuse aventure ?"

**Sentence shape.**
- Headlines are a full sentence, often with an exclamation mark:
  *"L'agrégateur de paiement qui connecte votre business au monde !"*
- Product descriptions are exactly one imperative sentence starting with a verb:
  *"Générez des liens de paiement et partagez-les à vos clients via Facebook, WhatsApp,
  Messenger, Email et SMS."*
- CTAs are 2–3 words, infinitive or imperative: **Créer un compte · Se connecter ·
  Essayer FeexLink · Découvrir FeexCorporate · Contactez-nous · Vidéo démo**.
- The pattern is strict: on a card the link is **"Découvrir <Produit>"**; on a product page it is
  **"Essayer <Produit>"**.

**Casing.** Sentence case everywhere — headings, buttons, nav. Never title case, never ALL CAPS
except product names that are genuinely capitalised (**SEND**, **PAYOUT API**) and the 13px
eyebrow label. Product names are camel-cased and never split: FeexPay, FeexLink, FeexCorporate,
FeexPage — not "Feex Pay".

**Numbers.** Big claims are prefixed with `+` and left approximate: "+2 400 000 transactions
effectuées", "+7 pays d'implantation", "+3 500 marchands enregistrés". Rates are stated bare and
bold: **1,7%**, **1%**, **0,5%**, **Gratuit**. Caveats go in a 13px asterisked footnote, never in
the headline: *"* Des frais peuvent s'appliquer pour les reversements vers compte bancaire vers
des pays différents."*

**Emoji: never.** Not in product UI, not in marketing, not in the docs. Iconography does that job.

**Words to avoid:** "solution innovante" is already used enough; don't stack adjectives.
Avoid English loanwords where a French one exists ("paiement", not "payment"), with the
established exceptions the brand itself uses: *business*, *API*, *SEND*, *Payin*, *Payout*.

---

## VISUAL FOUNDATIONS

**Colour.** Two brand colours, taken straight from the mark: **navy `#173154`** and
**orange `#D35E14`**. Navy is the structure — headings, the mark, inverse bands, footers. Orange
is the *single* accent: the primary button, the active tab underline, commission rates, link
text, the active state of a chip. Rule of thumb: **one orange element per viewport-height of
page.** Orange is never used as a large background wash — the only large colour fields are white,
`--surface-alt` (#F7F8FA) and the navy gradient band. Neutrals are cool (blue-leaning greys), not
warm. Semantic colours are used only for transaction state: green réussi, amber en attente, red
échoué, blue informational.

**Gradients.** Two, both restrained. `--gradient-hero` is a barely-there navy-50 → white vertical
wash behind hero sections. `--gradient-inverse` is a 135° navy 700 → 500 used for the CTA band and
`Card tone="inverse"`. No purple, no multi-stop rainbows, no gradient text.

**Type.** One family does everything: a geometric grotesque matching the logo wordmark (see
*Font substitution* below). Display and headings run **ExtraBold / Bold at −0.02em to −0.01em**
tracking — tight, dense, confident. Body is **Regular 16/1.6** in grey 700, never navy (navy is
reserved for headings so the hierarchy reads at a glance). Labels are SemiBold 14. The only
uppercase is the 13px eyebrow at 0.08em tracking. Monospace (JetBrains Mono) is confined to the
developer docs, API keys and transaction references.

**Spacing & layout.** 4px base scale. Content sits in a **1200px max-width container with 24px
gutters**; long-form and hero copy narrow to 760px. Vertical section rhythm is **96px** desktop,
56px compact. Cards get 24px padding and stack their contents at 16px. The header is the only
fixed element — sticky, 76px tall, white at 92% opacity with a 10px backdrop blur and a 1px
hairline bottom border. Nothing else is sticky or floating except toasts (bottom-right, 24px
inset) and modals.

**Corner radii.** The mark is built from hard-edged rectangles, so the geometry stays rectilinear
and the softening is deliberate and small: **controls 10px, cards 14px, modals and media 20px,
chips/tags/pills fully rounded, icon-only circular buttons 50%.** Nothing else is a circle.

**Cards.** White surface, **1px `#E1E5EC` hairline border**, 14px radius, and a *navy-tinted*
shadow — never neutral black: `0 2px 6px rgba(23,49,84,.07)` at rest. Interactive cards lift
`translateY(-3px)` and go to `0 16px 40px rgba(23,49,84,.12)` on hover. There is no
coloured-left-border card pattern in this brand. Inner shadows are used only for sunken inputs.

**Shadows in general.** Five steps (xs → xl), all `rgba(23,49,84,α)`, plus one accent shadow
`0 10px 24px rgba(211,94,20,.28)` used exclusively under a hovered primary button.

**Borders.** Hairlines, not rules: 1px `--border-subtle` for card and section edges, 1.5px
`--border-default` for form controls (they need to feel touchable), 2px orange only as the active
tab indicator. On navy, borders become `rgba(255,255,255,.18)`.

**Hover states.** Buttons darken one step (orange 600 → 700, navy 600 → 700) and gain a shadow —
they never lighten and never change size. Ghost/outline buttons fill with `--fx-gray-100` /
`--fx-navy-50`. Links go orange 600 → 700 and gain a 3px-offset underline. Cards lift. Arrows in
"Découvrir →" links slide 3px right. Logo-wall logos are greyscale at 60% opacity and stay that
way (the marquee never pauses on hover).

**Press states.** Darken one further step (orange 800) **and** `translateY(1px)`. No scale-down,
no ripple.

**Focus.** A 3px `--focus-ring` (orange 300) box-shadow halo, never a browser outline; on navy
surfaces it becomes a 45% white halo.

**Animation.** Restrained and fast. 140ms for control state changes, 220ms for card lifts and
appearances, 360ms for panels and modals. The signature easing is `cubic-bezier(.2,0,0,1)` —
quick out, gentle settle — with `cubic-bezier(.16,1,.3,1)` for entrances. **No bounces, no
springs, no parallax, no scroll-jacking.** The two genuinely animated things on the brand's own
site are the operator/client logo marquees (linear, infinite, ~30s per loop) and the product demo
GIFs. Everything respects `prefers-reduced-motion` (all durations collapse to 0).

**Transparency & blur.** Exactly two uses: the sticky header (white 92% + 10px blur) and modal
scrims (navy `rgba(11,27,48,.45)` + 3px blur). Never blurred cards, never frosted panels.

**Imagery.** The brand leans on **animated GIF product demos and 3D-ish illustrated globes**
rather than photography — cool-toned, navy/orange palette, flat vector rather than gradient-mesh,
no grain, no duotone photography. Product screenshots sit inside 20px-radius containers on a
`--surface-alt` background. There is no full-bleed photographic hero. *None of these GIFs were
supplied with the brand assets* — see Caveats.

**Patterns and textures.** None. No repeating patterns, no noise, no dot grids. Backgrounds are
flat colour or the two gradients above. If a section needs separation, it changes background
between white and `--surface-alt`.

**Protection / legibility.** Text over media is avoided entirely rather than solved with scrims:
the brand puts copy beside imagery, never on top of it.

### Font substitution — action needed

No font binaries were supplied. The FeexPay wordmark and the tagline lockup are set in a
geometric grotesque of the **Gilroy / Museo Sans** family (double-storey `a`, straight-leg `R`,
circular `o`, flat-cut `y` descender). This system substitutes **Figtree** (Google Fonts), the
closest free match, for everything, and **JetBrains Mono** for code.
**Please send the real licensed font files** (or name the family) and `tokens/fonts.css` can be
swapped over in one edit. Because the fonts are loaded from Google Fonts rather than declared as
`@font-face` with bundled binaries, the compiler reports 0 fonts — that is expected until real
files arrive.

---

## ICONOGRAPHY

FeexPay's live site ships **Material Design Icons** (its markup carries `mdi_*` glyph names, e.g.
`mdi_protected`, `mdi_cloud`, `mdi_web`), with a handful of Iconoir glyphs. This system therefore
standardises on **Material Design Icons, loaded from CDN**:

```html
<link href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" rel="stylesheet">
```

- Use the **outline** variant wherever one exists (`storefront-outline`, `bank-outline`,
  `account-group-outline`) — the brand's icon language is line-based, not filled.
- Default size 20px (`--icon-md`); 24px in headers, 16px inside small controls, 44px as a
  decorative product glyph inside a `--surface-brand-soft` rounded square.
- Icons inherit `currentColor`. Navy 600 for informational glyphs, orange 600 only when the icon
  *is* the accent (a check on a benefit list, a play button).
- Working set: `link-variant` (FeexLink), `account-group-outline` (FeexCorporate),
  `storefront-outline` (FeexPage), `cash-fast` (Payout API), `send` (SEND), `shield-check`,
  `flash`, `check-decagram`, `earth`, `swap-horizontal`, `credit-card-outline`, `cellphone`,
  `bank-outline`, `translate`, `play-circle-outline`, `help-circle-outline`.
- **No emoji, ever.** No Unicode characters as icons — the only exceptions are the `→` arrow in
  "Découvrir X →" links and the `/` separator in breadcrumbs, which are typographic, not iconic.
- Brand SVGs shipped in `assets/` are the logo family only. **Operator marks** (MTN, Moov,
  Celtiis, Coris, Wave, Orange, T-Money, Visa, Mastercard, Amex) and **client logos** (Sanlam,
  Croix-Rouge, AfricaKard…) are third-party artwork and were not supplied — components accept
  them via a `logo` prop and fall back to a typographic name.

*Substitution flagged:* MDI is loaded from CDN rather than from a bundled brand icon font,
because no icon font or SVG sprite was provided.

---

## Index

### Root
- `styles.css` — the single entry point consumers link. `@import` list only.
- `thumbnail.html` — homepage tile.
- `readme.md` — this file. `SKILL.md` — Claude Code / Agent Skills wrapper.

### `tokens/`
`fonts.css` · `colors.css` · `typography.css` · `spacing.css` · `radius.css` · `elevation.css` ·
`motion.css` · `base.css`

### `assets/`
`logo-feexpay.svg` / `.png` (primary) · `logo-feexpay-white.svg` / `.png` and
`logo-feexpay-white-alt.svg` / `.png` (reversed) · `logo-mark.png` (symbol only) ·
`logo-lockup-face.png` · `logo-lockup-tagline.png` (with *Rapidité – Sécurité – Fiabilité*) ·
`app-icon.jpg` · `favicon.png`

### Components
Grouped under `components/`. Each directory has one `@dsCard` HTML showing every state.

- **`core/`** — `Button`, `IconButton`, `Icon`, `Badge`, `Tag`, `Card`, `StatCard`
- **`forms/`** — `Field`, `Input`, `Select`, `Checkbox`, `Radio`, `Switch`
- **`feedback/`** — `Alert`, `Toast`, `Dialog`, `Tooltip`
- **`navigation/`** — `Tabs`, `Breadcrumb`
- **`payments/`** — `PaymentMethodTile`, `SolutionCard`, `LogoWall`

**Intentional additions.** No component library or Figma file was supplied, so the primitive set
is the standard one, sized to what the brand's surfaces actually need. Three components are
brand-specific rather than generic and are justified here: `PaymentMethodTile` (the operator +
commission tile that carries the whole Tarification page), `SolutionCard` (the FeexLink /
FeexCorporate / FeexPage / Payout API / SEND product card), and `LogoWall` (the operator and
client marquees that appear on three separate pages). `Icon` is a thin MDI wrapper.

### `guidelines/`
21 specimen cards feeding the Design System tab, grouped **Colors** (brand navy, brand orange,
neutrals, semantic status, text roles, surfaces), **Type** (display, headings, body & labels,
mono, eyebrow & caption), **Spacing** (scale, spacing in use, corner radii, elevation, motion) and
**Brand** (logo, mark & app icon, tagline lockup, iconography, interaction states).

### `ui_kits/`
- **`marketing-site/`** — recreation of feexpay.me: Accueil, Solutions, Tarification, clickable
  through the header nav. See its own `README.md` for known gaps.

---

## Caveats

1. **Merchant dashboard / FeexPay Business app have no UI kit.** No screenshots, codebase or
   Figma file for them was provided, and the app sits behind a login. Nothing was invented.
2. **Product GIFs and illustrations are missing** — the hero globe, `why_feexpay`, and the five
   product demo animations. The kit reserves their footprint with labelled placeholders.
3. **Operator and third-party client logos** are not bundled (licensing + not supplied).
4. **Real fonts are missing** — Figtree substitutes for the brand's Gilroy/Museo-family grotesque.
5. `.psd` and `.ai` source files listed in the brief never arrived in the project.
