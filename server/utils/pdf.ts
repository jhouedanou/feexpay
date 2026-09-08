import { jsPDF } from 'jspdf'
import type { RapportPublic } from './report'

/**
 * Rapport PDF (P12 imprimable), dessiné avec jsPDF en pur JavaScript : aucun navigateur
 * sans interface, compatible avec les fonctions Vercel. Police Helvetica (standard PDF,
 * codage WinAnsi : accents, apostrophe typographique et tiret cadratin passent).
 * Couleurs et hiérarchie de la maquette : bleu nuit 112C56, orange D45D00, gris.
 */
const NAVY: [number, number, number] = [17, 44, 86]
const ORANGE: [number, number, number] = [212, 93, 0]
const GRAY: [number, number, number] = [76, 86, 101]
const GRAY_LIGHT: [number, number, number] = [238, 240, 244]
const NAVY_50: [number, number, number] = [238, 243, 249]
const NAVY_500: [number, number, number] = [35, 71, 126]
const ORANGE_50: [number, number, number] = [255, 246, 240]
const ORANGE_700: [number, number, number] = [173, 75, 0]

const A4 = { w: 210, h: 297 }
const M = 18 // marge
const W = A4.w - 2 * M

export function nomFichierPdf(r: RapportPublic): string {
  const base = r.dirigeant ? `profil-${slug(r.dirigeant.archetype.code)}` : 'rayonnement'
  return `radar-feexpay-${base}.pdf`
}

export function rapportPdf(r: RapportPublic, baseUrl: string): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = 0
  const date = new Date(r.etabliLe).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const page = () => {
    doc.addPage()
    y = M
  }
  const need = (h: number) => {
    if (y + h > A4.h - M - 8) page()
  }
  const text = (s: string, size: number, color: [number, number, number], opts: { bold?: boolean; lh?: number; width?: number; x?: number } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(s, opts.width ?? W) as string[]
    const lh = (opts.lh ?? 1.45) * size * 0.3528
    need(lines.length * lh)
    doc.text(lines, opts.x ?? M, y + size * 0.3528 * 0.8)
    y += lines.length * lh
  }
  const eyebrow = (s: string, color: [number, number, number] = ORANGE) => {
    text(s.toUpperCase(), 8, color, { bold: true, lh: 1.2 })
    y += 1.5
  }
  const h1 = (s: string) => text(s, 22, NAVY, { bold: true, lh: 1.15 })
  const h2 = (numero: string, s: string) => {
    need(24)
    y += 4
    text(numero, 8, [152, 163, 180], { bold: true, lh: 1.2 })
    text(s, 16, NAVY, { bold: true, lh: 1.2 })
    y += 2
  }
  const body = (s: string) => {
    text(s, 10.5, GRAY, { lh: 1.55 })
    y += 2
  }
  const space = (n: number) => (y += n)
  const rule = () => {
    need(6)
    doc.setDrawColor(224, 228, 235)
    doc.line(M, y, M + W, y)
    y += 5
  }
  const barre = (nom: string, score: number, accent: boolean) => {
    need(10)
    doc.setFont('helvetica', accent ? 'bold' : 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...(accent ? NAVY : GRAY))
    doc.text(nom, M, y + 3)
    doc.setTextColor(...(accent ? ORANGE : NAVY))
    doc.text(String(Math.round(score)), M + W, y + 3, { align: 'right' })
    doc.setFillColor(...GRAY_LIGHT)
    doc.roundedRect(M, y + 4.5, W, 2.4, 1.2, 1.2, 'F')
    doc.setFillColor(...(accent ? ORANGE : NAVY_500))
    doc.roundedRect(M, y + 4.5, Math.max(2.4, (W * Math.max(0, Math.min(100, score))) / 100), 2.4, 1.2, 1.2, 'F')
    y += 10
  }
  const encart = (titre: string, contenu: string, fond: [number, number, number] = NAVY_50) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(contenu, W - 12) as string[]
    const h = 10 + lines.length * 5.2 + 4
    need(h)
    doc.setFillColor(...fond)
    doc.roundedRect(M, y, W, h, 2.5, 2.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...NAVY)
    doc.text(titre.toUpperCase(), M + 6, y + 6.5)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(55, 62, 75)
    doc.text(lines, M + 6, y + 12.5)
    y += h + 4
  }
  const pied = () => {
    const n = doc.getNumberOfPages()
    for (let i = 1; i <= n; i++) {
      doc.setPage(i)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(108, 118, 134)
      doc.text('Radar by FeexPay · Powered by FeexPay', M, A4.h - 10)
      doc.text(`${i} / ${n}`, M + W, A4.h - 10, { align: 'right' })
    }
  }

  // --- Couverture ------------------------------------------------------------
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, A4.w, 118, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(246, 182, 132)
  doc.text('RADAR BY FEEXPAY', M, 24)
  doc.setFontSize(8)
  doc.setTextColor(181, 197, 220)
  doc.text('RAPPORT COMPLET', M, 32)
  doc.setFontSize(26)
  doc.setTextColor(255, 255, 255)
  const titre = r.dirigeant
    ? `${r.contact.prenom} ${r.contact.nom} · ${r.dirigeant.archetype.code}`
    : `${r.contact.prenom} ${r.contact.nom}`
  doc.text(doc.splitTextToSize(titre, W) as string[], M, 56)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(221, 229, 240)
  const sous = [
    r.dirigeant ? `Profil de dirigeant : ${r.dirigeant.archetype.code}` : null,
    r.rayonnement ? `Rayonnement de l’entreprise : ${r.rayonnement.score} / 100 · ${r.rayonnement.niveauAffiche}` : null,
    r.croisement ? `Lecture croisée : ${r.croisement.lecture}` : null,
  ].filter(Boolean) as string[]
  doc.text(sous, M, 82)
  doc.setFontSize(9)
  doc.setTextColor(126, 151, 191)
  doc.text(`Établi le ${date} · moteur version ${r.version}`, M, 108)
  y = 132
  text('Ce rapport reprend les résultats affichés à la fin de vos diagnostics. Il reste consultable avec son instantané d’origine.', 10.5, GRAY, { lh: 1.55 })
  space(3)
  eyebrow('Sommaire', [108, 118, 134])
  const sommaire = [
    r.dirigeant ? '01  Votre profil de dirigeant' : null,
    r.dirigeant ? '02  Vos huit dimensions' : null,
    r.rayonnement ? '03  Rayonnement de votre entreprise' : null,
    r.croisement ? '04  Lecture croisée' : null,
    '05  Synthèse et suites possibles',
  ].filter(Boolean) as string[]
  for (const s of sommaire) text(s, 10.5, NAVY, { lh: 1.7 })

  // --- 01 · Profil ------------------------------------------------------------
  if (r.dirigeant) {
    const d = r.dirigeant
    page()
    h2('01', 'Votre profil de dirigeant')
    eyebrow('Profil de dirigeant')
    h1(d.archetype.code)
    text(`Inspiré par ${d.archetype.inspirePar}`, 10, GRAY, { lh: 1.5 })
    space(4)
    text(`${d.archetype.traits}.`, 11, [55, 62, 75], { lh: 1.55 })
    space(4)
    eyebrow('Ce que ce profil dit de votre pilotage', [108, 118, 134])
    body(`${d.pilotage.niveau}. ${d.pilotage.lecture}`)
    eyebrow('Vos forces', [15, 122, 72])
    body(`${d.archetype.forces}.`)
    eyebrow('Point de vigilance', [166, 106, 0])
    body(`${d.archetype.risque}.`)
    if (d.secondaire) {
      eyebrow('Profil secondaire', [108, 118, 134])
      text(d.secondaire.code, 13, NAVY, { bold: true, lh: 1.3 })
      body(`Une seconde tendance nette : ${minuscule(d.secondaire.forces)}. Elle nuance votre profil principal sans le remplacer.`)
    }

    // --- 02 · Dimensions ------------------------------------------------------
    h2('02', 'Vos huit dimensions')
    body('Chaque dimension est exprimée sur 100. La plus présente est mise en avant.')
    const dims = [...d.dimensions].sort((a, b) => b.score - a.score)
    dims.forEach((dim, i) => barre(dim.nom, dim.score, i === 0))
    space(2)
    for (const dim of dims) text(`${dim.nom} — ${dim.definition}`, 9, GRAY, { lh: 1.5 })
  }

  // --- 03 · Rayonnement ------------------------------------------------------
  if (r.rayonnement) {
    const ray = r.rayonnement
    page()
    h2('03', 'Rayonnement de votre entreprise')
    text(`${ray.score} / 100`, 30, NAVY, { bold: true, lh: 1.1 })
    text(`${ray.niveauAffiche} · Météo : ${minuscule(ray.meteo)}`, 12, NAVY, { bold: true, lh: 1.4 })
    space(2)
    body(ray.lecture)
    eyebrow('Vos cinq dimensions', [108, 118, 134])
    const min = ray.dimensions.reduce((a, b) => (b.score < a.score ? b : a), ray.dimensions[0]!)
    for (const dim of ray.dimensions) barre(dim.nom, dim.score, dim === min)
    space(2)
    if (ray.porte) {
      eyebrow('Ce qui vous porte', [15, 122, 72])
      body(ray.porte)
    }
    if (ray.freine) {
      eyebrow('Ce qui vous freine', [173, 75, 0])
      body(ray.freine)
    }
    eyebrow('Votre différenciation déclarée', [108, 118, 134])
    text(ray.differenciation.valeur, 12, NAVY, { bold: true, lh: 1.4 })
    body('Prix, proximité, qualité et avantage distinctif sont quatre natures de différenciation, sans hiérarchie entre elles.')
  }

  // --- 04 · Lecture croisée --------------------------------------------------
  if (r.croisement) {
    const c = r.croisement
    page()
    h2('04', 'Lecture croisée')
    body('Ce que la mise en regard de vos deux diagnostics fait apparaître.')
    need(30)
    doc.setFillColor(...GRAY_LIGHT)
    doc.roundedRect(M, y, W / 2 - 1, 26, 2.5, 2.5, 'F')
    doc.setFillColor(255, 246, 240)
    doc.roundedRect(M + W / 2 + 1, y, W / 2 - 1, 26, 2.5, 2.5, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(108, 118, 134)
    doc.text('PILOTAGE INTERNE', M + 6, y + 7)
    doc.setTextColor(173, 75, 0)
    doc.text('RAYONNEMENT EXTERNE', M + W / 2 + 7, y + 7)
    doc.setFontSize(20)
    doc.setTextColor(...NAVY)
    doc.text(String(c.pilotage), M + 6, y + 17)
    doc.setTextColor(...ORANGE)
    doc.text(String(c.rayonnement), M + W / 2 + 7, y + 17)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...GRAY)
    doc.text(r.dirigeant?.pilotage.niveau ?? '', M + 6, y + 23)
    doc.text(r.rayonnement?.niveauAffiche ?? '', M + W / 2 + 7, y + 23)
    y += 32
    text(c.lecture, 15, NAVY, { bold: true, lh: 1.3 })
    space(2)
    body(c.formulation)
    body(c.interpretation)
    encart(c.qualificatif, `${c.ecartLecture} ${c.ecartAction}`)
    encart('La zone à traiter en premier', c.prioriteMarketing, [255, 246, 240])
  }

  // --- 05 · Synthèse ---------------------------------------------------------
  h2('05', 'Synthèse et suites possibles')
  const suites: [string, string][] = []
  if (r.croisement) suites.push([c05(r.croisement.prioriteMarketing), r.croisement.ecartAction])
  if (r.rayonnement?.freine) suites.push(['Lever ce qui vous freine', r.rayonnement.freine])
  if (r.dirigeant) suites.push(['Garder votre point de vigilance en vue', `${r.dirigeant.archetype.risque}.`])
  suites.push(['Refaire le diagnostic dans trois mois', 'Le rayonnement bouge plus vite que le pilotage. Un second passage vous dira si l’effort a porté.'])
  suites.slice(0, 3).forEach(([t, s], i) => {
    need(20)
    doc.setFillColor(...(i === 0 ? ORANGE_50 : NAVY_50))
    doc.roundedRect(M, y, 9, 9, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...(i === 0 ? ORANGE_700 : NAVY))
    doc.text(String(i + 1), M + 4.5, y + 6.2, { align: 'center' })
    const x = M + 13
    doc.setFontSize(11)
    doc.setTextColor(...NAVY)
    doc.text(t, x, y + 6.2)
    y += 9
    text(s, 10, GRAY, { lh: 1.5, x, width: W - 13 })
    space(3)
  })
  space(4)
  encart('Envie d’en discuter ?', `Échangez avec un conseiller FeexPay sur ce que ces résultats impliquent pour votre activité : contact.ci@feexpay.me. Votre rapport en ligne : ${baseUrl}`)

  pied()
  return Buffer.from(doc.output('arraybuffer'))
}

const minuscule = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : '')
const c05 = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const slug = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// --- Fiche prospect (A04 synthèse, A05 entretien) -------------------------------

type FicheData = {
  contact: { prenom: string; nom: string; email: string; telephone: string | null; entreprise: string | null; secteur: string | null; taille: string | null; pays: string | null }
  activite: { source: string; premiere: string | Date; derniere: string | Date }
  priorite: { niveau: string; justification: string }
  deux: boolean
  dirigeant: { public: { archetype: { code: string; inspirePar: string }; secondaire: { code: string } | null; dimensions: { nom: string; score: number }[] }; pilotage: { score: number; niveau: string }; version: string } | null
  rayonnement: { public: { score: number; niveauAffiche: string; meteo: string; dimensions: { nom: string; score: number }[] } } | null
  croisement: { code: string; lecture: string; interpretation: string; pilotage: number; rayonnement: number } | null
  constats: { code: string; questionCode: string; gravite: number; difficulte: string; factuel: string; relance: string; dimension: string; diagnostic: string }[]
  leviers: { levier: { nom: string; description: string }; traite: { code: string }[]; support: { code: string }[] }[]
}

/**
 * Fiche prospect imprimable. `synthese` reprend A04 (profils, lecture croisée, difficultés) ;
 * `entretien` reprend A05 (constats retenus, leviers, angle d'entretien, garde-fous).
 * Les scores internes y figurent : document réservé à l'équipe, jamais remis au prospect.
 */
export function fichePdf(d: FicheData, vue: 'synthese' | 'entretien'): Buffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  let y = M
  const need = (h: number) => {
    if (y + h > A4.h - M - 8) {
      doc.addPage()
      y = M
    }
  }
  const text = (s: string, size: number, color: [number, number, number], opts: { bold?: boolean; lh?: number; width?: number; x?: number } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal')
    doc.setFontSize(size)
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(s, opts.width ?? W) as string[]
    const lh = (opts.lh ?? 1.45) * size * 0.3528
    need(lines.length * lh)
    doc.text(lines, opts.x ?? M, y + size * 0.3528 * 0.8)
    y += lines.length * lh
  }
  const eyebrow = (s: string) => {
    y += 4
    text(s.toUpperCase(), 8, ORANGE, { bold: true, lh: 1.2 })
    y += 1.5
  }
  const ligne = () => {
    need(4)
    doc.setDrawColor(...GRAY_LIGHT)
    doc.line(M, y + 1, M + W, y + 1)
    y += 4
  }
  const date = (v: string | Date) => new Date(v).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const c = d.contact

  text('Radar by FeexPay · document interne', 8, GRAY, { bold: true, lh: 1.2 })
  y += 2
  text(vue === 'entretien' ? `${c.prenom} ${c.nom} · diagnostic commercial` : `${c.prenom} ${c.nom}`, 20, NAVY, { bold: true, lh: 1.15 })
  text([c.entreprise, c.secteur, c.taille ? `${c.taille} personnes` : null, c.pays].filter(Boolean).join(' · '), 10, GRAY)
  text(`${c.email}${c.telephone ? ' · ' + c.telephone : ''} · source ${d.activite.source} · première participation le ${date(d.activite.premiere)}`, 9, GRAY)
  y += 2
  text(`Priorité ${d.priorite.niveau.toLowerCase()} · ${d.priorite.justification}`, 9.5, ORANGE_700, { bold: true })
  ligne()

  if (vue === 'synthese') {
    if (d.dirigeant) {
      eyebrow('Profil de dirigeant')
      text(d.dirigeant.public.archetype.code, 15, NAVY, { bold: true, lh: 1.2 })
      text(`${d.dirigeant.public.secondaire ? `Profil secondaire : ${d.dirigeant.public.secondaire.code} · ` : ''}inspiré par ${d.dirigeant.public.archetype.inspirePar} · pilotage ${Math.round(d.dirigeant.pilotage.score)} (${d.dirigeant.pilotage.niveau.toLowerCase()}) · moteur ${d.dirigeant.version}`, 9.5, GRAY)
      for (const dim of [...d.dirigeant.public.dimensions].sort((a, b) => b.score - a.score).slice(0, 3)) text(`${dim.nom} · ${Math.round(dim.score)}`, 9.5, GRAY)
    }
    if (d.rayonnement) {
      eyebrow('Rayonnement')
      text(`${d.rayonnement.public.score} / 100`, 15, NAVY, { bold: true, lh: 1.2 })
      text(`${d.rayonnement.public.niveauAffiche} · météo « ${d.rayonnement.public.meteo.toLowerCase()} »`, 9.5, GRAY)
      for (const dim of d.rayonnement.public.dimensions) text(`${dim.nom} · ${Math.round(dim.score)}`, 9.5, GRAY)
    }
    eyebrow('Lecture croisée')
    if (d.croisement) {
      text(`${d.croisement.lecture} · règle ${d.croisement.code}`, 11, NAVY, { bold: true })
      text(d.croisement.interpretation, 9.5, GRAY)
      text(`Pilotage interne ${d.croisement.pilotage} · rayonnement externe ${d.croisement.rayonnement}`, 9.5, GRAY)
    } else {
      text('Indisponible : la lecture croisée exige les deux diagnostics.', 9.5, GRAY)
    }
    eyebrow('Difficultés déclarées, par gravité')
    if (!d.constats.length) text('Aucune difficulté déclarée.', 9.5, GRAY)
    for (const k of d.constats) {
      text(`${k.difficulte} (gravité ${k.gravite})`, 10, NAVY, { bold: true })
      text(`Constat ${k.code} · déclaré à la question ${k.questionCode.replace(/\D/g, '')}${k.diagnostic === 'rayonnement' ? ' du Rayonnement' : ''}`, 8.5, GRAY)
      y += 1
    }
  } else {
    eyebrow(`Constats retenus · ${d.constats.length}`)
    if (!d.constats.length) text('Aucune difficulté déclarée.', 9.5, GRAY)
    for (const k of d.constats) {
      text(`${k.code} · ${k.difficulte} (gravité ${k.gravite})`, 10, NAVY, { bold: true })
      text(k.factuel, 9.5, GRAY)
      text(`Relance : ${k.relance} · ${k.dimension}`, 8.5, GRAY)
      y += 1
    }
    eyebrow('Leviers FeexPay associés')
    if (!d.leviers.length) text('Aucun levier rattaché aux constats retenus.', 9.5, GRAY)
    for (const l of d.leviers) {
      const traite = l.traite.map((t) => t.code)
      const support = l.support.map((t) => t.code)
      text(`${l.levier.nom} · ${traite.length ? 'Traite ' + traite.join(' et ') : 'Support de ' + support.join(' et ')}`, 10, NAVY, { bold: true })
      text(l.levier.description, 9.5, GRAY)
      y += 1
    }
    eyebrow('Angle d’entretien proposé')
    for (const p of angleEntretien(d)) text(`• ${p}`, 9.5, GRAY)
    eyebrow('Ce qu’il ne faut pas dire')
    for (const p of GARDE_FOUS) text(`• ${p}`, 9.5, GRAY)
  }

  y = A4.h - M
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.text('Support de préparation d’entretien. Les constats reprennent les déclarations du dirigeant, sans interprétation ajoutée. Les scores internes ne sont jamais cités au prospect.', M, y)

  return Buffer.from(doc.output('arraybuffer'))
}

export const GARDE_FOUS = [
  'Aucun jugement sur la gestion de l’entreprise.',
  'Aucun score interne cité au prospect : les scores restent des outils de priorisation.',
  'Aucune promesse de résultat chiffré.',
]

/** Angle d'entretien (A05) : citation d'ouverture puis trois points, dérivés des constats et des leviers. */
export function angleEntretien(d: Pick<FicheData, 'constats' | 'leviers' | 'dirigeant' | 'contact'>): string[] {
  const premier = d.constats[0]
  const leviers = d.leviers.map((l) => l.levier.nom)
  const pilotageBon = (d.dirigeant?.pilotage.score ?? 0) >= 50
  const citation = premier
    ? `« ${pilotageBon ? 'Vous pilotez déjà bien votre activité.' : 'Vous connaissez votre activité mieux que quiconque.'} Ce qui vous coûte aujourd’hui, c’est ${minuscule(premier.difficulte.replace(/\.$/, ''))}. »`
    : '« Vous avez décrit votre activité avec précision. Regardons ensemble ce qui peut vous faire gagner du temps. »'
  const points = [
    premier ? `Partir du constat ${premier.code}, formulé avec ses mots.` : 'Partir des forces déclarées, formulées avec ses mots.',
    d.leviers[0] ? `Montrer ${d.leviers[0].levier.nom} en usage réel, pas la liste des produits.` : 'Montrer un usage concret, pas la liste des produits.',
    leviers.length > 1 ? `Proposer ${leviers[0]} comme première étape, ${leviers[1]} ensuite.` : leviers.length === 1 ? `Proposer ${leviers[0]} comme première étape.` : 'Ne proposer aucun produit tant qu’un besoin n’est pas formulé par le prospect.',
  ]
  return [citation, ...points]
}
