/**
 * Cas de contrôle obligatoires — PLAN §5.5 (repris de la matrice normative V2.1).
 * Toute divergence ici est une régression du moteur, pas un test à ajuster.
 */
import { describe, expect, it } from 'vitest'
import {
  answersFromLetters,
  executerControles,
  crossReading,
  getVersion,
  listVersions,
  scoreDirigeant,
  scoreRayonnement,
  ScoringError,
  round2,
  type Answers,
} from '../src/index'

const dirigeant = (letters: string) => scoreDirigeant(answersFromLetters('dirigeant', letters))
const rayonnement = (letters: string) => scoreRayonnement(answersFromLetters('rayonnement', letters))

describe('cas de contrôle §5.5', () => {
  const cases = [
    {
      nom: 'Principal',
      dir: 'BCBADBADDBCADA',
      ray: 'CCCCCCC',
      archetype: 'Stratège',
      affinite: 61.67,
      pilotage: 62.96,
      rayonnement: 66.67,
      niveau: 'Challenger fort',
      meteo: 'Éclaircies',
      cross: 'CC',
    },
    {
      nom: 'Contrôle A',
      dir: 'AAAAAAAAAAAAAA',
      ray: 'AAAAAAA',
      archetype: 'Réformateur',
      affinite: 66.78,
      pilotage: 100,
      rayonnement: 0,
      niveau: 'Zone de disparition',
      meteo: 'Tempête',
      cross: 'PS',
    },
    {
      nom: 'Contrôle B',
      dir: 'BBBBBBBBBBBBBB',
      ray: 'BBBBBBB',
      archetype: 'Gestionnaire',
      affinite: 51.24,
      pilotage: 66.67,
      rayonnement: 33.33,
      niveau: 'Marque fragile',
      meteo: 'Pluie',
      cross: 'PS',
    },
    {
      nom: 'Contrôle C',
      dir: 'CCCCCCCCCCCCCC',
      ray: 'CCCCCCC',
      archetype: 'Fédérateur',
      affinite: 63.86,
      pilotage: 33.33,
      rayonnement: 66.67,
      niveau: 'Challenger fort',
      meteo: 'Éclaircies',
      cross: 'RT',
    },
    {
      nom: 'Contrôle D',
      dir: 'DDDDDDDDDDDDDD',
      ray: 'DDDDDDD',
      archetype: 'Conquérant',
      affinite: 63.21,
      pilotage: 0,
      rayonnement: 100,
      niveau: 'Dominant',
      meteo: 'Soleil',
      cross: 'RT',
    },
  ] as const

  it.each(cases)('$nom', (c) => {
    const d = dirigeant(c.dir)
    const r = rayonnement(c.ray)

    expect(d.principal.code).toBe(c.archetype)
    expect(d.principal.affinite).toBe(c.affinite)
    expect(round2(d.pilotage.score)).toBe(c.pilotage)

    expect(round2(r.score)).toBe(c.rayonnement)
    expect(r.niveau).toBe(c.niveau)
    expect(r.meteo).toBe(c.meteo)

    expect(crossReading(d, r).code).toBe(c.cross)
  })

  it('Q9D est exclu du dénominateur du pilotage (Contrôle D)', () => {
    const d = dirigeant('DDDDDDDDDDDDDD')
    expect(d.pilotage.denominateur).toBe(90)
    expect(d.pilotage.exclues).toEqual(['Q9D'])
    expect(d.pilotage.score).toBe(0)
    expect(d.pilotage.niveau).toBe('Pilotage informel')
  })

  it('le dénominateur vaut 100 quand Q9D n’est pas retenu (Contrôle A)', () => {
    const d = dirigeant('AAAAAAAAAAAAAA')
    expect(d.pilotage.denominateur).toBe(100)
    expect(d.pilotage.exclues).toEqual([])
    expect(d.pilotage.score).toBe(100)
    expect(d.pilotage.niveau).toBe('Pilotage structuré')
  })
})

describe('accessibilité des 8 archétypes §5.5', () => {
  const cases = [
    { code: 'Visionnaire', dir: 'ADCBCCAAADADAD', affinite: 63.48, marge: 23.5 },
    { code: 'Bâtisseur', dir: 'CADBCCBCBADCBB', affinite: 58.78, marge: 15.73 },
    { code: 'Conquérant', dir: 'DDADCCDBDCDABC', affinite: 70.15, marge: 25.36 },
    { code: 'Fédérateur', dir: 'CCCCCDADBBCBCA', affinite: 71.41, marge: 27.1 },
    { code: 'Résilient', dir: 'BADCDDCCCBCCBD', affinite: 65.44, marge: 21.15 },
    { code: 'Gestionnaire', dir: 'DABBABBBADADDC', affinite: 61.38, marge: 11.45 },
    { code: 'Réformateur', dir: 'DBDADACADABADA', affinite: 67.51, marge: 26.68 },
    { code: 'Stratège', dir: 'BCBADBADDBCADA', affinite: 61.67, marge: 26.7 },
  ] as const

  it.each(cases)('$code est atteignable', (c) => {
    const d = dirigeant(c.dir)
    expect(d.principal.code).toBe(c.code)
    expect(d.principal.affinite).toBe(c.affinite)
    // La marge de la matrice est calculée sur les affinités exactes, avant arrondi d'affichage.
    expect(round2(d.affinities[0]!.exact - d.affinities[1]!.exact)).toBe(c.marge)
  })

  it('les 8 archétypes sont couverts par le jeu de contrôle', () => {
    expect(new Set(cases.map((c) => c.code)).size).toBe(8)
  })
})

describe('départage §5.1', () => {
  const TIE = 'DBBCBABBDABDBA'

  it('Réformateur et Bâtisseur sont à égalité à 41.14', () => {
    const d = dirigeant(TIE)
    const exAequo = d.affinities.filter((a) => a.value === 41.14).map((a) => a.code)
    expect(exAequo.sort()).toEqual(['Bâtisseur', 'Réformateur'])
  })

  it('la dimension centrale départage en faveur du Réformateur', () => {
    const d = dirigeant(TIE)
    expect(d.principal.code).toBe('Réformateur')
    expect(d.tieBreak).not.toBeNull()
    expect(d.tieBreak!.affinite).toBe(41.14)
    expect(d.tieBreak!.exAequo.sort()).toEqual(['Bâtisseur', 'Réformateur'])
    // TRA (52.94) devance EXE (41.18) : réglé dès la première étape.
    expect(d.tieBreak!.etapes[0]!.regle).toBe('normCentrale')
    expect(d.tieBreak!.etapes[0]!.gagnant).toBe('Réformateur')
    expect(d.tieBreak!.etapes).toHaveLength(1)
  })

  it('le secondaire n’est jamais égal au principal', () => {
    const d = dirigeant(TIE)
    expect(d.secondaire?.code).not.toBe(d.principal.code)
    // 41.14 < 55 : aucun secondaire éligible ici.
    expect(d.secondaire).toBeNull()
  })

  it('aucun tie_break n’est journalisé sans ex aequo', () => {
    expect(dirigeant('BCBADBADDBCADA').tieBreak).toBeNull()
  })
})

describe('archétype secondaire §5.1', () => {
  it('Contrôle A : Visionnaire retenu comme secondaire', () => {
    const d = dirigeant('AAAAAAAAAAAAAA')
    expect(d.principal.code).toBe('Réformateur')
    expect(d.secondaire?.code).toBe('Visionnaire')
    expect(d.secondaire?.affinite).toBe(62.84)
  })

  it('Principal : écart trop grand, aucun secondaire', () => {
    const d = dirigeant('BCBADBADDBCADA')
    expect(d.affinities[1]!.value).toBeLessThan(55)
    expect(d.secondaire).toBeNull()
  })

  it('les trois conditions sont cumulatives', () => {
    const { minAffinite, ratioMin, ecartMax } = getVersion().constants.dirigeant.secondaire
    for (const letters of ['AAAAAAAAAAAAAA', 'BBBBBBBBBBBBBB', 'CCCCCCCCCCCCCC', 'DDDDDDDDDDDDDD']) {
      const d = dirigeant(letters)
      const [a1, a2] = [d.affinities[0]!.value, d.affinities[1]!.value]
      const attendu = a2 >= minAffinite && a2 >= ratioMin * a1 && a1 - a2 <= ecartMax
      expect(d.secondaire !== null).toBe(attendu)
    }
  })
})

describe('rayonnement §5.2', () => {
  it('R3 n’est pas scoré mais reste exposé comme tag', () => {
    const base = rayonnement('CCACCCC')
    const autre = rayonnement('CCDCCCC')
    expect(base.score).toBe(autre.score)
    expect(base.differenciationDeclaree.valeur).toBe('Prix')
    expect(autre.differenciationDeclaree.valeur).toBe('Avantage distinctif')
  })

  it('pondère les 5 dimensions, digital = R5×0,6 + R6×0,4', () => {
    const r = rayonnement('DAACADB')
    const digital = r.dimensions.find((d) => d.cle === 'digital')!
    // R5=A (0), R6=D (100) -> 0×0,6 + 100×0,4
    expect(round2(digital.score)).toBe(40)
    expect(digital.sources).toEqual(['R5A', 'R6D'])
    const attendu = r.dimensions.reduce((s, d) => s + d.score * d.poids, 0)
    expect(r.score).toBeCloseTo(attendu, 10)
  })

  it('les bornes de niveau sont inclusives et évaluées sur le score exact', () => {
    // 80 exactement -> Dominant ; 79,x -> Challenger fort.
    expect(rayonnement('CCCCDDD').niveau).toBe('Dominant')
    expect(round2(rayonnement('CCCCDDD').score)).toBe(80)
    expect(rayonnement('CDCCDBD').niveau).toBe('Challenger fort')
    expect(round2(rayonnement('CDCCDBD').score)).toBe(79.67)
  })

  it('applique la nuance « avec potentiel d’éclaircie »', () => {
    const r = rayonnement('BBCCCBD')
    expect(round2(r.score)).toBe(59)
    expect(r.niveau).toBe('Acteur silencieux')
    expect(r.nuance).toBe(true)
    expect(r.niveauAffiche).toBe('Acteur silencieux avec potentiel d’éclaircie')
  })

  it('refuse la nuance si une dimension est sous 20', () => {
    const r = rayonnement('ABCDBBD')
    expect(round2(r.score)).toBe(56.67)
    expect(Math.min(...r.dimensions.map((d) => d.score))).toBeLessThan(20)
    expect(r.nuance).toBe(false)
    expect(r.niveauAffiche).toBe('Acteur silencieux')
  })

  it('affiche un entier et conserve le score exact', () => {
    const r = rayonnement('CCCCCCC')
    expect(r.scoreAffiche).toBe(67)
    expect(r.score).toBeCloseTo(66.6666, 3)
  })
})

describe('lecture croisée §5.3', () => {
  const quadrants = [
    { dir: 'BCBADBADDBCADA', ray: 'CCCCCCC', code: 'CC', lecture: 'Cohérence consolidée' },
    { dir: 'AAAAAAAAAAAAAA', ray: 'AAAAAAA', code: 'PS', lecture: 'Potentiel sous-exploité' },
    { dir: 'CCCCCCCCCCCCCC', ray: 'CCCCCCC', code: 'RT', lecture: 'Rayonnement sous tension' },
    { dir: 'CCCCCCCCCCCCCC', ray: 'BBBBBBB', code: 'FR', lecture: 'Fondations à renforcer' },
  ] as const

  it.each(quadrants)('$code', (q) => {
    const c = crossReading(dirigeant(q.dir), rayonnement(q.ray))
    expect(c.code).toBe(q.code)
    expect(c.lecture).toBe(q.lecture)
  })

  it('qualifie l’écart rayonnement − pilotage', () => {
    const expose = crossReading(dirigeant('CCCCCCCCCCCCCC'), rayonnement('DDDDDDD'))
    expect(round2(expose.ecart)).toBe(66.67)
    expect(expose.qualificatif).toBe('Rayonnement exposé')

    const sousExploitees = crossReading(dirigeant('AAAAAAAAAAAAAA'), rayonnement('AAAAAAA'))
    expect(sousExploitees.ecart).toBe(-100)
    expect(sousExploitees.qualificatif).toBe('Fondations sous-exploitées')

    const coherente = crossReading(dirigeant('BBBBBBBBBBBBBB'), rayonnement('CCCCCCC'))
    expect(Math.abs(coherente.ecart)).toBeLessThanOrEqual(15)
    expect(coherente.qualificatif).toBe('Cohérence relative')
  })

  it('utilise les scores exacts, pas les valeurs affichées', () => {
    const c = crossReading(dirigeant('BCBADBADDBCADA'), rayonnement('CCCCCCC'))
    expect(c.pilotage).toBeCloseTo(62.9629, 3)
    expect(c.rayonnement).toBeCloseTo(66.6666, 3)
  })
})

describe('participation incomplète §5.5', () => {
  it('refuse un diagnostic dirigeant partiel', () => {
    const answers: Answers = answersFromLetters('dirigeant', 'BCBADBADDBCADA')
    delete answers.Q7
    expect(() => scoreDirigeant(answers)).toThrow(ScoringError)
    try {
      scoreDirigeant(answers)
    } catch (e) {
      expect((e as ScoringError).code).toBe('INCOMPLETE_PARTICIPATION')
      expect((e as ScoringError).details.missing).toEqual(['Q7'])
    }
  })

  it('refuse un diagnostic rayonnement partiel', () => {
    const answers: Answers = answersFromLetters('rayonnement', 'CCCCCCC')
    delete answers.R1
    expect(() => scoreRayonnement(answers)).toThrow(ScoringError)
  })

  it('refuse une option qui n’appartient pas à la question', () => {
    const answers: Answers = answersFromLetters('dirigeant', 'BCBADBADDBCADA')
    answers.Q3 = 'Q4A'
    try {
      scoreDirigeant(answers)
      throw new Error('aurait dû échouer')
    } catch (e) {
      expect((e as ScoringError).code).toBe('INVALID_ANSWER')
    }
  })

  it('refuse une question hors diagnostic', () => {
    const answers: Answers = { ...answersFromLetters('rayonnement', 'CCCCCCC'), Q1: 'Q1A' }
    try {
      scoreRayonnement(answers)
      throw new Error('aurait dû échouer')
    } catch (e) {
      expect((e as ScoringError).code).toBe('INVALID_ANSWER')
    }
  })
})

describe('invariants de la matrice V2.1', () => {
  const v = getVersion()

  it('14 questions dirigeant, 7 questions rayonnement, 84 options', () => {
    expect(v.questionCodes.dirigeant).toHaveLength(14)
    expect(v.questionCodes.rayonnement).toHaveLength(7)
    expect(v.options).toHaveLength(84)
    expect(v.archetypes).toHaveLength(8)
    expect(v.combinedRules).toHaveLength(16)
  })

  it('chaque dimension apparaît 7 fois en +2 et 7 fois en +1 sur les 56 options', () => {
    const plus2: Record<string, number> = {}
    const plus1: Record<string, number> = {}
    const dirigeantOptions = v.options.filter((o) => o.questionCode.startsWith('Q'))
    expect(dirigeantOptions).toHaveLength(56)
    for (const o of dirigeantOptions) {
      plus2[o.dim2!] = (plus2[o.dim2!] ?? 0) + 1
      plus1[o.dim1!] = (plus1[o.dim1!] ?? 0) + 1
    }
    for (const d of v.dimensions) {
      expect(plus2[d.code]).toBe(7)
      expect(plus1[d.code]).toBe(7)
    }
  })

  it('les maxima théoriques correspondent aux constantes', () => {
    const { max } = v.constants.dirigeant
    const parQuestion = new Map<string, typeof v.options>()
    for (const o of v.options.filter((x) => x.questionCode.startsWith('Q'))) {
      parQuestion.set(o.questionCode, [...(parQuestion.get(o.questionCode) ?? []), o])
    }
    for (const dim of v.dimensions) {
      const attendu = [...parQuestion.values()].reduce(
        (s, opts) => s + Math.max(...opts.map((o) => (o.dim2 === dim.code ? 2 : o.dim1 === dim.code ? 1 : 0))),
        0,
      )
      expect(max[dim.code]).toBe(attendu)
    }
  })

  it('le pilotage porte sur 8 questions et 100 points de poids', () => {
    const applicables = v.options.filter((o) => (o.poids ?? 0) > 0)
    const questions = new Set(applicables.map((o) => o.questionCode))
    expect([...questions].sort()).toEqual(['Q10', 'Q12', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9'].sort())
    const poidsParQuestion = new Map([...questions].map((q) => [q, applicables.find((o) => o.questionCode === q)!.poids!]))
    expect([...poidsParQuestion.values()].reduce((a, b) => a + b, 0)).toBe(100)
  })

  it('aucune donnée produit n’est exposée (CDC : pas de recommandation)', () => {
    const dump = JSON.stringify([v.options, v.combinedRules, v.archetypes])
    expect(dump).not.toMatch(/produit feexpay/i)
    expect(dump).not.toMatch(/product_/i)
    expect(dump).not.toMatch(/recommended_offer/i)
  })
})

describe('matrice V2.2 — contrôle du départage', () => {
  it('CCDBDACABDDACB : Visionnaire et Réformateur à 37,25, le score central tranche pour le Réformateur', () => {
    const d = scoreDirigeant(answersFromLetters('dirigeant', 'CCDBDACABDDACB', '2.2'), '2.2')
    expect(d.version).toBe('2.2')
    expect(d.principal.code).toBe('Réformateur')
    expect(d.tieBreak).not.toBeNull()
    expect(d.tieBreak!.affinite).toBe(37.25)
    expect(d.tieBreak!.exAequo.sort()).toEqual(['Réformateur', 'Visionnaire'])
    const etape = d.tieBreak!.etapes[0]!
    expect(etape.regle).toBe('normCentrale')
    expect(etape.gagnant).toBe('Réformateur')
    const valeur = (code: string) => etape.candidats.find((c) => c.code === code)!.valeur
    expect(valeur('Réformateur')).toBe(41.18)
    expect(valeur('Visionnaire')).toBe(33.33)
  })

  it('les deux versions partagent questions, options et constats', () => {
    expect(listVersions().sort()).toEqual(['2.1', '2.2'])
    expect(getVersion('2.2').options.length).toBe(getVersion('2.1').options.length)
  })
})

describe('executerControles (T01)', () => {
  it('toutes les versions embarquées passent leurs contrôles', () => {
    for (const v of listVersions()) {
      const r = executerControles(v)
      expect(r.filter((x) => !x.ok)).toEqual([])
    }
  })
})
