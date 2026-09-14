/**
 * Extrait chaque cadre d'écran de la maquette normative (Annexe 02) en page HTML autonome.
 *
 *   node scripts/extract-maquette-frames.mjs
 *
 * Complète extract-maquette.mjs (textes seuls) : ici on garde le markup complet — icônes,
 * fonds, puces, espacements — pour un contrôle visuel écran par écran. Les cadres sont
 * servis depuis la racine du projet, les images pointent sur le dossier assets/ de l'annexe.
 *
 * Sortie : docs/maquette/frames/<planche>-<Pxx>.html + index.html
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const racine = join(here, '..')
const ANNEXE = 'MarketingBS/Annexe_02_Maquettes_UI_Radar_by_FeexPay'
const SRC = join(racine, ANNEXE, 'Radar by FeexPay - Maquette V1.dc.html')
const OUT = join(racine, 'docs/maquette/frames')

const html = readFileSync(SRC, 'utf8')

const head = /<style>([\s\S]*?)<\/style>/.exec(html)[1]

const PLANCHES = {
  p03: 'mobile-390',
  p04: 'tablette-834',
  p05: 'desktop-1440',
  p06: 'admin-1440',
  p07: 'comptes-admin',
}

const sections = [...html.matchAll(/<section id="(p\d\d)"[^>]*>/g)].map((m) => ({
  id: m[1],
  debut: m.index,
}))
sections.forEach((s, i) => {
  s.fin = i + 1 < sections.length ? sections[i + 1].debut : html.length
})

const DELIM = /<div style="(?:flex:none;)?width:(1440|834|390)px">/g
const MARQUEUR =
  /<span style="[^"]*font-mono[^"]*">(P\d\d|A\d\d|T\d\d)<\/span><span style="[^"]*">([^<]*)<\/span>/

/** Fin du bloc <div> ouvert à `debut` (balises équilibrées). */
function finDuDiv(texte, debut) {
  const re = /<div\b|<\/div>/g
  re.lastIndex = debut
  let profondeur = 0
  let m
  while ((m = re.exec(texte))) {
    profondeur += m[0] === '</div>' ? -1 : 1
    if (profondeur === 0) return re.lastIndex
  }
  return texte.length
}

mkdirSync(OUT, { recursive: true })
const index = []

for (const s of sections) {
  const planche = PLANCHES[s.id]
  if (!planche) continue
  const corps = html.slice(s.debut, s.fin)
  DELIM.lastIndex = 0
  let d
  const compteur = {}
  while ((d = DELIM.exec(corps))) {
    const debut = d.index
    // Certains cadres de la maquette ont une div non fermée (P08 desktop) : on borne
    // toujours au délimiteur de cadre suivant.
    const prochain = new RegExp(DELIM.source, 'g')
    prochain.lastIndex = debut + 10
    const p = prochain.exec(corps)
    const fin = Math.min(finDuDiv(corps, debut), p ? p.index : corps.length)
    const bloc = corps.slice(debut, fin)
    const m = MARQUEUR.exec(bloc.slice(0, 600))
    if (!m) continue
    const code = m[1]
    compteur[code] = (compteur[code] ?? 0) + 1
    const suffixe = compteur[code] > 1 ? `-${compteur[code]}` : ''
    const nom = `${planche}-${code}${suffixe}`
    const largeur = d[1]
    const page = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${code} · ${m[2]} · ${planche}</title>
<link href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>${head}
:root{--font-mono:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
body{padding:24px;display:flex;justify-content:center}
</style>
</head>
<body>
${bloc.replace(/src="assets\//g, `src="/${ANNEXE}/assets/`)}
</body>
</html>
`
    writeFileSync(join(OUT, `${nom}.html`), page)
    index.push({ nom, code, titre: m[2], planche, largeur, lignes: bloc.split('\n').length })
  }
}

const liste = index
  .map(
    (f) =>
      `<li><a href="${f.nom}.html">${f.code} · ${f.titre}</a> <small>${f.planche} · ${f.largeur} px · ${f.lignes} lignes</small></li>`,
  )
  .join('\n')
writeFileSync(
  join(OUT, 'index.html'),
  `<!DOCTYPE html><meta charset="utf-8"><title>Cadres de la maquette</title><ul>${liste}</ul>`,
)
console.log(`${index.length} cadres écrits dans docs/maquette/frames/`)
