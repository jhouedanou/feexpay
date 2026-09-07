import { DIMS, archetypes, constants, resolveAnswers } from './data'
import type { Answers, Dim, DirigeantResult, TieBreak } from './types'

const round2 = (x: number) => Math.round(x * 100) / 100
const MAX = constants.dirigeant.max as Record<Dim, number>

export function scoreDirigeant(answers: Answers): DirigeantResult {
  const chosen = resolveAnswers('dirigeant', answers)

  const raw = Object.fromEntries(DIMS.map((d) => [d, 0])) as Record<Dim, number>
  const plus2 = Object.fromEntries(DIMS.map((d) => [d, 0])) as Record<Dim, number>
  for (const o of chosen) {
    raw[o.dim2!] += 2
    raw[o.dim1!] += 1
    plus2[o.dim2!] += 1
  }
  const norm = Object.fromEntries(DIMS.map((d) => [d, (raw[d] / MAX[d]) * 100])) as Record<Dim, number>

  const affinites: Record<string, number> = {}
  for (const a of archetypes) {
    affinites[a.code] = a.dims.reduce((s, d, i) => s + a.poids[i]! * norm[d], 0)
  }

  // Principal : max affinité arrondie 2 déc. ; départage §5.1
  const rounded = Object.fromEntries(Object.entries(affinites).map(([k, v]) => [k, round2(v)]))
  const best = Math.max(...Object.values(rounded))
  const order = constants.dirigeant.ordreTechnique as string[]
  let candidats = order.filter((c) => rounded[c] === best)
  let tieBreak: TieBreak | null = null

  if (candidats.length > 1) {
    const etapes: TieBreak['etapes'] = []
    const central = (c: string) => archetypes.find((a) => a.code === c)!.dims[0]
    const crit: [string, (c: string) => number][] = [
      ['norm_dim_centrale', (c) => norm[central(c)]],
      ['nb_plus2_dim_centrale', (c) => plus2[central(c)]],
      ['somme_brute_empreinte', (c) => archetypes.find((a) => a.code === c)!.dims.reduce((s, d) => s + raw[d], 0)],
    ]
    for (const [name, fn] of crit) {
      if (candidats.length === 1) break
      const valeurs = Object.fromEntries(candidats.map((c) => [c, fn(c)]))
      const top = Math.max(...Object.values(valeurs))
      candidats = candidats.filter((c) => valeurs[c] === top)
      etapes.push({ critere: name, valeurs, restants: [...candidats] })
    }
    if (candidats.length > 1) {
      etapes.push({ critere: 'ordre_technique', valeurs: {}, restants: [candidats[0]!] })
      candidats = [candidats[0]!]
    }
    tieBreak = { candidats: order.filter((c) => rounded[c] === best), etapes, retenu: candidats[0]! }
  }
  const principal = candidats[0]!

  // Secondaire
  const sec = constants.dirigeant.secondaire
  const others = order.filter((c) => c !== principal).sort((a, b) => rounded[b]! - rounded[a]! || order.indexOf(a) - order.indexOf(b))
  const cand = others[0]!
  const a1 = rounded[principal]!
  const a2 = rounded[cand]!
  const hasSec = a2 >= sec.minAffinite && a2 >= sec.ratioMin * a1 && a1 - a2 <= sec.ecartMax

  // Pilotage interne
  let num = 0
  let den = 0
  for (const o of chosen) {
    if (!o.poids) continue
    if (!o.applicable) continue // Q9D : exclu du dénominateur
    den += o.poids
    num += ((o.points ?? 0) / 3) * o.poids
  }
  const pilotage = den ? (num / den) * 100 : 0
  const niveau = [...constants.dirigeant.pilotageLevels].sort((a, b) => b.min - a.min).find((l) => pilotage >= l.min)?.niveau ?? ''

  return {
    raw,
    norm,
    affinites,
    principal,
    principalAffinite: a1,
    secondaire: hasSec ? cand : null,
    secondaireAffinite: hasSec ? a2 : null,
    tieBreak,
    pilotage: { score: pilotage, niveau, denominateur: den },
  }
}
