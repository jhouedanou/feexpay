/**
 * File de sortie du tracking (PLAN.md §4 et §8). Chaque événement envoyé côté serveur —
 * Meta CAPI et GA4 Measurement Protocol — laisse une ligne dans `tracking_event_outbox`
 * avant la tentative d'envoi. L'unicité de `event_id` porte l'idempotence : deux appels
 * pour le même événement ne produisent qu'un envoi, ce qui vaut aussi bien pour un rejeu
 * réseau que pour une relance manuelle.
 *
 * Rien n'est bloquant ici : une file indisponible ne doit pas faire échouer un parcours ni
 * l'envoi d'un rapport. Les erreurs sont journalisées, jamais remontées à l'appelant.
 */

export type CibleTracking = 'ga4_mp' | 'meta_capi'

/**
 * Réserve la ligne d'un événement et renvoie son identifiant, ou `null` si l'événement a
 * déjà été journalisé (donc déjà traité) ou si la base est injoignable. Un `null` doit
 * faire renoncer l'appelant à l'envoi.
 */
export async function journaliserEvenement(
  nom: string,
  eventId: string,
  payload: Record<string, unknown>,
  cibles: CibleTracking[],
): Promise<string | null> {
  try {
    const { rows } = await db().query<{ id: string }>(
      `insert into tracking_event_outbox (event_name, event_id, payload, targets)
       values ($1, $2, $3, $4)
       on conflict (event_id) do nothing
       returning id`,
      [nom, eventId, JSON.stringify(payload), cibles],
    )
    return rows[0]?.id ?? null
  } catch (e) {
    console.warn('[outbox] journalisation', nom, e instanceof Error ? e.message : e)
    return null
  }
}

/** L'événement a été accepté par le fournisseur. */
export async function marquerEnvoye(id: string) {
  await db()
    .query(
      `update tracking_event_outbox
          set sent_at = now(), attempts = attempts + 1, last_error = null
        where id = $1`,
      [id],
    )
    .catch((e) => console.warn('[outbox] marquerEnvoye', e instanceof Error ? e.message : e))
}

/**
 * L'envoi a échoué ou n'a pas eu lieu. La ligne reste sans `sent_at` : elle sort dans
 * l'index des événements en attente et documente la raison.
 */
export async function marquerEchec(id: string, erreur: string) {
  await db()
    .query(
      `update tracking_event_outbox
          set attempts = attempts + 1, last_error = $2
        where id = $1`,
      [id, erreur.slice(0, 500)],
    )
    .catch((e) => console.warn('[outbox] marquerEchec', e instanceof Error ? e.message : e))
}
