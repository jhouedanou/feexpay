/**
 * Extrait chaque écran de la maquette normative (Annexe 02) dans un fichier lisible.
 *
 *   node scripts/extract-maquette.mjs
 *
 * La maquette est un « design canvas » : aucune classe réutilisable, tout est en style
 * inline. On ne peut donc pas la porter telle quelle — mais on peut en extraire, écran
 * par écran, les textes exacts et la hiérarchie typographique, ce qui est la seule chose
 * qui fasse foi pour l'intégration.
 *
 * Sortie : docs/maquette/<planche>-<Pxx>.md
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const racine = join(here, '..')
const SRC = join(
  racine,
  'MarketingBS/Annexe_02_Maquettes_UI_Radar_by_FeexPay/Radar by FeexPay - Maquette V1.dc.html',
)
const OUT = join(racine, 'docs/maquette')

const html = readFileSync(SRC, 'utf8')

// --- 1. Planches ------------------------------------------------------------
const planches = [...html.matchAll(/<section id="(p\d\d)"[^>]*>/g)].map((m) => ({
  id: m[1],
  debut: m.index,
}))
planches.forEach((p, i) => {
  p.fin = i + 1 < planches.length ? planches[i + 1].debut : html.length
})

const NOMS = {
  p03: 'mobile-390',
  p04: 'tablette-834',
  p05: 'desktop-1440',
  p06: 'admin-1440',
  p07: 'comptes-admin',
}

// --- 2. Écrans dans chaque planche ------------------------------------------
const MARQUEUR =
  /<span style="[^"]*font-mono[^"]*">(P\d\d|A\d\d|T\d\d)<\/span><span style="[^"]*">([^<]*)<\/span>/g

/** Texte visible d'un fragment, avec la spécification de police du bloc porteur. */
function lignes(fragment) {
  const out = []
  const re = /<(\w+)([^>]*)>([^<]*)/g
  let m
  while ((m = re.exec(fragment))) {
    const [, balise, attrs, texte] = m
    const t = decode(texte).trim()
    if (!t) continue
    const font = /font:\s*([^;"']+)/.exec(attrs)?.[1]?.trim() ?? ''
    const couleur = /color:\s*(#[0-9A-Fa-f]{3,8})/.exec(attrs)?.[1] ?? ''
    out.push({ balise, font, couleur, texte: t })
  }
  return out
}

function decode(s) {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&rsquo;/g, '’')
    .replace(/&nbsp/g, ' ')
}

/** Taille en px déclarée dans une spécification `font:` abrégée. */
function taille(font) {
  const m = /(\d+(?:\.\d+)?)px/.exec(font)
  return m ? Number(m[1]) : 0
}
function graisse(font) {
  const m = /^\s*(\d{3})\b/.exec(font)
  return m ? Number(m[1]) : 400
}

mkdirSync(OUT, { recursive: true })
const index = []

for (const planche of planches) {
  const nom = NOMS[planche.id]
  if (!nom) continue
  const corps = html.slice(planche.debut, planche.fin)

  const marques = [...corps.matchAll(MARQUEUR)].map((m) => ({
    code: m[1],
    libelle: decode(m[2]),
    debut: m.index,
  }))
  marques.forEach((x, i) => {
    x.fin = i + 1 < marques.length ? marques[i + 1].debut : corps.length
  })

  for (const marque of marques) {
    const contenu = lignes(corps.slice(marque.debut, marque.fin)).filter(
      (l) => l.texte !== marque.code && l.texte !== marque.libelle,
    )

    const md = [`# ${marque.code} — ${marque.libelle}`, ``, `Planche : ${nom}`, ``, `---`, ``]
    for (const l of contenu) {
      const px = taille(l.font)
      const w = graisse(l.font)
      let prefixe = ''
      if (px >= 28) prefixe = '# '
      else if (px >= 20) prefixe = '## '
      else if (px >= 17) prefixe = '### '
      else if (w >= 600 && px <= 13) prefixe = '**eyebrow** '
      else if (w >= 600) prefixe = '**' // libellés et boutons
      const suffixe = prefixe === '**' ? '**' : ''
      const meta = l.font ? `  <!-- ${l.font}${l.couleur ? ' · ' + l.couleur : ''} -->` : ''
      md.push(`${prefixe}${l.texte}${suffixe}${meta}`)
      md.push('')
    }

    const fichier = `${nom}-${marque.code}.md`
    writeFileSync(join(OUT, fichier), md.join('\n'))
    index.push(`- [${marque.code} · ${marque.libelle}](${fichier}) — ${nom}, ${contenu.length} blocs`)
  }
}

writeFileSync(
  join(OUT, 'README.md'),
  [
    '# Maquette normative — extraction par écran',
    '',
    'Généré par `node scripts/extract-maquette.mjs` depuis',
    '`MarketingBS/Annexe_02_…/Radar by FeexPay - Maquette V1.dc.html`.',
    '',
    'Les textes sont repris **sans modification**. Les commentaires HTML en fin de ligne',
    'portent la spécification de police du bloc d’origine (graisse, taille, interligne, couleur),',
    'qui donne la hiérarchie à respecter.',
    '',
    ...index,
    '',
  ].join('\n'),
)

console.log(`${index.length} écrans extraits dans docs/maquette/`)
