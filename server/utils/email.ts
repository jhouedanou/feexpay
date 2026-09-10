import { Resend } from 'resend'
import { nomRapport, type RapportPublic } from './report'
import { nomFichierPdf, rapportPdf } from './pdf'
import { journalEnvoi } from './rapports'
import { envoyerGa4 } from './ga4'
import { chargerModele, cleDuRapport, rendreTexte, variablesDuRapport, type ChampsModele } from './modeles-email'

/**
 * Envoi du rapport par email (Resend), PDF en pièce jointe. Chaque envoi laisse une ligne
 * dans `notification` : `accepted` quand Resend a pris le message, `failed` sinon, avec
 * l'erreur. Sans clé API, rien ne part et la notification est marquée `failed`.
 *
 * Sans domaine vérifié, l'expéditeur `onboarding@resend.dev` ne délivre qu'à l'adresse du
 * titulaire du compte Resend : les autres destinataires sont refusés par le fournisseur.
 */
export async function envoyerRapport(
  rapport: RapportPublic,
  reportToken: string,
  reportId: string,
): Promise<{ sent: boolean; to: string; error?: string }> {
  const config = useRuntimeConfig()
  const to = rapport.contact.email
  const base = config.public.appBaseUrl
  const lien = `${base}/rapport/${reportToken}`
  const template = 'rapport'

  const notif = await db().query<{ id: string }>(
    `insert into notification (report_id, template, recipient, status, attempts)
     values ($1, $2, $3, 'queued', 1) returning id`,
    [reportId, template, to],
  )
  const notifId = notif.rows[0]!.id
  await journalEnvoi(notifId, 'generated', `moteur ${rapport.dirigeant?.version ?? rapport.rayonnement?.version ?? ''}`.trim())

  const echec = async (message: string) => {
    await db().query(`update notification set status = 'failed', last_error = $2, updated_at = now() where id = $1`, [
      notifId,
      message.slice(0, 500),
    ])
    await journalEnvoi(notifId, 'failed', message.slice(0, 200))
    return { sent: false, to, error: message }
  }

  if (!config.resendApiKey) return echec('RESEND_API_KEY absente')

  try {
    const pdf = rapportPdf(rapport, base)
    // Textes du modèle, réécrits ou non depuis l'admin ; les variables sont remplacées ici.
    const { champs } = await chargerModele(cleDuRapport(rapport))
    const resend = new Resend(config.resendApiKey)
    const { data, error } = await resend.emails.send({
      from: config.resendFrom,
      to,
      subject: rendreTexte(champs.sujet, variablesDuRapport(rapport, lien)),
      html: htmlRapport(rapport, lien, champs),
      text: texteRapport(rapport, lien, champs),
      attachments: [{ filename: nomFichierPdf(rapport), content: pdf.toString('base64') }],
    })
    if (error) return echec(`${error.name}: ${error.message}`)
    await db().query(
      `update notification set status = 'accepted', provider_id = $2, updated_at = now() where id = $1`,
      [notifId, data?.id ?? null],
    )
    await journalEnvoi(notifId, 'accepted')
    await db().query(`update report set status = 'ready', updated_at = now() where id = $1`, [reportId])
    // `report_sent` : GA4 Measurement Protocol seulement (PLAN.md §8). L'identifiant de la
    // notification sert d'`event_id` — un renvoi crée une nouvelle notification, donc un
    // nouvel événement, ce qui est le comportement attendu.
    await envoyerGa4(null, 'report_sent', notifId, { template }, reportId)
    return { sent: true, to }
  } catch (e) {
    return echec(e instanceof Error ? e.message : String(e))
  }
}

function lignesResume(r: RapportPublic): string[] {
  return [
    r.dirigeant ? `Profil de dirigeant : ${r.dirigeant.archetype.code}` : null,
    r.rayonnement ? `Rayonnement : ${r.rayonnement.score} / 100 · ${r.rayonnement.niveauAffiche}` : null,
    r.croisement ? `Lecture croisée : ${r.croisement.lecture}` : null,
  ].filter(Boolean) as string[]
}

/** Version texte de l'email, mêmes champs que le HTML ; le lien suit l'introduction. */
export function texteRapport(r: RapportPublic, lien: string, champs: ChampsModele): string {
  const v = variablesDuRapport(r, lien)
  const t = (champ: keyof ChampsModele) => rendreTexte(champs[champ], v)
  return [
    t('salutation'),
    '',
    t('introduction'),
    lien,
    '',
    ...lignesResume(r),
    '',
    t('mention'),
    '',
    t('pied'),
  ].join('\n')
}

/**
 * Gabarit HTML du rapport. Tout est en tables et en styles à la ligne : c'est la seule mise en
 * forme que les clients email honorent tous.
 *
 * Le bouton mérite une explication. Il portait `height` et `line-height` sur un `<a>` en
 * `inline-block` ; le raccourci `font:` déclaré ensuite réinitialisait `line-height` à `normal`,
 * et le texte se collait en haut du pavé orange. Il est désormais dans une cellule de table, sa
 * hauteur vient du `padding`, et `mso-line-height-rule:exactly` empêche Word d'arrondir
 * l'interligne à sa façon — Outlook Windows ignorant `height`, `inline-block` et `border-radius`.
 */
export function htmlRapport(r: RapportPublic, lien: string, champs: ChampsModele): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const v = variablesDuRapport(r, lien)
  // Texte d'un champ, variables remplacées puis échappé : un modèle ne porte jamais de HTML.
  const t = (champ: keyof ChampsModele) => esc(rendreTexte(champs[champ], v))
  const resume = lignesResume(r)
    .map((l) => `<li style="margin:0 0 6px;font:400 15px/1.5 Poppins,'Segoe UI',sans-serif;color:#373E4B">${esc(l)}</li>`)
    .join('')
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(nomRapport(r))}</title></head><body style="margin:0;padding:0;background:#F6F7F9">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F7F9;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #E0E4EB;border-radius:14px;overflow:hidden">
<tr><td style="background:#112C56;padding:28px 32px">
  <p style="margin:0 0 8px;font:600 12px/1 Poppins,'Segoe UI',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#F6B684">Radar by FeexPay</p>
  <p style="margin:0;font:600 24px/1.25 Poppins,'Segoe UI',sans-serif;color:#fff">${t('titre')}</p>
</td></tr>
<tr><td style="padding:28px 32px">
  <p style="margin:0 0 16px;font:400 16px/1.6 Poppins,'Segoe UI',sans-serif;color:#373E4B">${t('salutation')}</p>
  <p style="margin:0 0 20px;font:400 16px/1.6 Poppins,'Segoe UI',sans-serif;color:#373E4B">${t('introduction')}</p>
  <ul style="margin:0 0 24px;padding:0 0 0 18px">${resume}</ul>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td bgcolor="#D45D00" style="background:#D45D00;border-radius:12px">
      <a href="${esc(lien)}" style="display:block;padding:17px 28px;font:600 16px/18px Poppins,'Segoe UI',sans-serif;mso-line-height-rule:exactly;color:#ffffff;text-decoration:none">${t('bouton')}</a>
    </td>
  </tr></table>
  <p style="margin:24px 0 0;font:400 13px/1.55 Poppins,'Segoe UI',sans-serif;color:#6C7686">${t('mention')}</p>
</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #E0E4EB"><p style="margin:0;font:400 12px/1.5 Poppins,'Segoe UI',sans-serif;color:#7E97BF">${t('pied')}</p></td></tr>
</table></td></tr></table></body></html>`
}
