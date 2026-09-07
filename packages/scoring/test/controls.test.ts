import { describe, expect, it } from 'vitest'
import { DIMS, buildInsights, crossReading, fromSequence, options, scoreDirigeant, scoreRayonnement, ScoringError } from '../src'

const d = (s: string) => scoreDirigeant(fromSequence('dirigeant', s))
const r = (s: string) => scoreRayonnement(fromSequence('rayonnement', s))
const r2 = (x: number) => Math.round(x * 100) / 100

describe('cas principal (simulateur)', () => {
  const dir = d('BCBADBADDBCADA')
  const ray = r('CCCCCCC')
  it('Stratège 61.67', () => {
    expect(dir.principal).toBe('Stratège')
    expect(dir.principalAffinite).toBe(61.67)
  })
  it('pilotage 62.96', () => expect(r2(dir.pilotage.score)).toBe(62.96))
  it('rayonnement 66.67 Challenger fort', () => {
    expect(r2(ray.score)).toBe(66.67)
    expect(ray.niveau).toBe('Challenger fort')
    expect(ray.meteo).toBe('Éclaircies')
  })
  it('lecture croisée CC', () => expect(crossReading(dir.pilotage.score, ray.score).code).toBe('CC'))
})

describe('cas limites', () => {
  const cases: [string, string, number, number, string][] = [
    ['AAAAAAAAAAAAAA', 'AAAAAAA', 100, 0, 'PS'],
    ['BBBBBBBBBBBBBB', 'BBBBBBB', 66.67, 33.33, 'PS'],
    ['CCCCCCCCCCCCCC', 'CCCCCCC', 33.33, 66.67, 'RT'],
    ['DDDDDDDDDDDDDD', 'DDDDDDD', 0, 100, 'RT'],
  ]
  for (const [ds, rs, p, ray, code] of cases) {
    it(`${ds[0]} → pilotage ${p}, rayonnement ${ray}, ${code}`, () => {
      const dir = d(ds)
      const rr = r(rs)
      expect(r2(dir.pilotage.score)).toBe(p)
      expect(r2(rr.score)).toBe(ray)
      expect(crossReading(dir.pilotage.score, rr.score).code).toBe(code)
    })
  }
  it('Q9D non applicable : dénominateur 90', () => expect(d('DDDDDDDDDDDDDD').pilotage.denominateur).toBe(90))
  it('Q9 autre : dénominateur 100', () => expect(d('AAAAAAAAAAAAAA').pilotage.denominateur).toBe(100))
})

describe('accessibilité des 8 archétypes', () => {
  const cases: [string, string, number][] = [
    ['Visionnaire', 'ADCBCCAAADADAD', 63.48],
    ['Bâtisseur', 'CADBCCBCBADCBB', 58.78],
    ['Conquérant', 'DDADCCDBDCDABC', 70.15],
    ['Fédérateur', 'CCCCCDADBBCBCA', 71.41],
    ['Résilient', 'BADCDDCCCBCCBD', 65.44],
    ['Gestionnaire', 'DABBABBBADADDC', 61.38],
    ['Réformateur', 'DBDADACADABADA', 67.51],
  ]
  for (const [arch, seq, aff] of cases) {
    it(`${arch} ${aff}`, () => {
      const res = d(seq)
      expect(res.principal).toBe(arch)
      expect(res.principalAffinite).toBe(aff)
    })
  }
})

describe('égalité', () => {
  const res = d('DBBCBABBDABDBA')
  it('Réformateur = Bâtisseur 41.14, départage tracé', () => {
    expect(r2(res.affinites['Réformateur']!)).toBe(41.14)
    expect(r2(res.affinites['Bâtisseur']!)).toBe(41.14)
    expect(res.tieBreak).not.toBeNull()
    expect(res.tieBreak!.candidats).toEqual(['Bâtisseur', 'Réformateur'])
    expect(['Bâtisseur', 'Réformateur']).toContain(res.principal)
  })
  it('secondaire ≠ principal', () => {
    if (res.secondaire) expect(res.secondaire).not.toBe(res.principal)
  })
})

describe('invariants matrice', () => {
  it('chaque dim 7× en +2 et 7× en +1', () => {
    const dir = options.filter((o) => o.questionCode.startsWith('Q'))
    expect(dir).toHaveLength(56)
    for (const dim of DIMS) {
      expect(dir.filter((o) => o.dim2 === dim)).toHaveLength(7)
      expect(dir.filter((o) => o.dim1 === dim)).toHaveLength(7)
    }
  })
  it('aucun tag produit exporté', () => {
    expect(JSON.stringify(options)).not.toContain('Produit FeexPay')
  })
})

describe('erreurs', () => {
  it('participation incomplète → INCOMPLETE_PARTICIPATION', () => {
    expect(() => scoreDirigeant({ Q1: 'A' })).toThrow(ScoringError)
    try {
      scoreDirigeant({ Q1: 'A' })
    } catch (e) {
      expect((e as ScoringError).code).toBe('INCOMPLETE_PARTICIPATION')
    }
  })
})

describe('insights', () => {
  const ins = buildInsights(fromSequence('dirigeant', 'DDDDDDDDDDDDDD'), fromSequence('rayonnement', 'AAAAAAA'))
  it('bornes 6/4/6', () => {
    expect(ins.difficulties.length).toBeLessThanOrEqual(6)
    expect(ins.forces.length).toBeLessThanOrEqual(4)
    expect(ins.hypotheses.length).toBeLessThanOrEqual(6)
  })
  it('difficultés triées gravité desc', () => {
    const g = ins.difficulties.map((x) => x.gravite)
    expect([...g].sort((a, b) => b - a)).toEqual(g)
  })
  it('preuves exhaustives (21)', () => expect(ins.proofs).toHaveLength(21))
  it('RC04 déclenchée (Q10D + Q11D ? non) / RC08 (Q8D+Q4D) oui', () => {
    expect(ins.hypotheses.map((h) => h.id)).toContain('RC08')
    expect(ins.hypotheses.map((h) => h.id)).not.toContain('RC04')
  })
})
