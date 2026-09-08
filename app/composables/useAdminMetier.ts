/** Aides d'affichage partagées par les pages admin métier (lot 5). */

export const nombre = (n: number | null | undefined) => (n === null || n === undefined ? '—' : new Intl.NumberFormat('fr-FR').format(n))

export const dateLongue = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

export const dateCourte = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export const heure = (d: string | Date | null | undefined) =>
  d ? new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', ' h ') : '—'

export const dateHeure = (d: string | Date | null | undefined) => (d ? `${dateLongue(d)} à ${heure(d)}` : '—')

export const duree = (s: number | null | undefined) => {
  if (s === null || s === undefined) return '—'
  const m = Math.floor(s / 60)
  const r = s % 60
  return m ? `${m} min ${String(r).padStart(2, '0')} s` : `${r} s`
}

export const initiales = (prenom?: string | null, nom?: string | null) => `${prenom?.[0] ?? ''}${nom?.[0] ?? ''}`.toUpperCase()

/** Niveau court du rayonnement (« Challenger fort » → « Challenger »). */
export const niveauCourt = (n: string | null | undefined) => (n ? n.replace(/ fort$/, '').replace(/^Zone de disparition$/, 'Disparition') : '')

export const RAPPORT_STATUT: Record<string, { label: string; classe: string; icone: string }> = {
  envoye: { label: 'Envoyé', classe: 'bg-green-100 text-green-600', icone: 'check' },
  attente: { label: 'En attente', classe: 'bg-amber-100 text-amber-600', icone: 'clock-outline' },
  echec: { label: 'Échec', classe: 'bg-red-100 text-red-600', icone: 'alert-circle-outline' },
  aucun: { label: 'Aucun', classe: 'bg-gray-100 text-gray-500', icone: 'minus' },
}

export const ARCHETYPES = ['Stratège', 'Visionnaire', 'Bâtisseur', 'Conquérant', 'Fédérateur', 'Résilient', 'Gestionnaire', 'Réformateur']
export const NIVEAUX_PILOTAGE = ['Pilotage structuré', 'Pilotage partiellement structuré', 'Pilotage réactif', 'Pilotage informel']
export const NIVEAUX_RAYONNEMENT = ['Dominant', 'Challenger fort', 'Acteur silencieux', 'Marque fragile', 'Zone de disparition']

/** Téléchargement d'un export authentifié (cookie httpOnly) : on passe par fetch puis un lien objet. */
export async function telecharger(url: string, nom?: string) {
  const r = await fetch(url, { credentials: 'include' })
  if (!r.ok) {
    let message = 'Export refusé.'
    try {
      const j = await r.json()
      message = j?.data?.message ?? j?.message ?? message
    } catch {}
    throw new Error(message)
  }
  const blob = await r.blob()
  const cd = r.headers.get('content-disposition') ?? ''
  const m = /filename="([^"]+)"/.exec(cd)
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = nom ?? m?.[1] ?? 'export'
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
