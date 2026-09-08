import { Resend } from 'resend'
import { nomRapport, type RapportPublic } from './report'
import { nomFichierPdf, rapportPdf } from './pdf'

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

  const echec = async (message: string) => {
    await db().query(`update notification set status = 'failed', last_error = $2, updated_at = now() where id = $1`, [
      notifId,
      message.slice(0, 500),
    ])
    return { sent: false, to, error: message }
  }

  if (!config.resendApiKey) return echec('RESEND_API_KEY absente')

  try {
    const pdf = rapportPdf(rapport, base)
    const resend = new Resend(config.resendApiKey)
    const { data, error } = await resend.emails.send({
      from: config.resendFrom,
      to,
      subject: `${nomRapport(rapport)} — Radar by FeexPay`,
      html: htmlRapport(rapport, lien),
      text: texteRapport(rapport, lien),
      attachments: [{ filename: nomFichierPdf(rapport), content: pdf.toString('base64') }],
    })
    if (error) return echec(`${error.name}: ${error.message}`)
    await db().query(
      `update notification set status = 'accepted', provider_id = $2, updated_at = now() where id = $1`,
      [notifId, data?.id ?? null],
    )
    await db().query(`update report set status = 'ready', updated_at = now() where id = $1`, [reportId])
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

function texteRapport(r: RapportPublic, lien: string): string {
  return [
    `Bonjour ${r.contact.prenom},`,
    '',
    `${nomRapport(r)} est prêt. Il est joint à cet email au format PDF et reste consultable en ligne :`,
    lien,
    '',
    ...lignesResume(r),
    '',
    'Vos réponses servent à produire votre rapport, rien d’autre. Vous pouvez en demander la suppression à tout moment en écrivant à contact.ci@feexpay.me.',
    '',
    'Radar by FeexPay · Powered by FeexPay',
  ].join('\n')
}

function htmlRapport(r: RapportPublic, lien: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const resume = lignesResume(r)
    .map((l) => `<li style="margin:0 0 6px;font:400 15px/1.5 Poppins,'Segoe UI',sans-serif;color:#373E4B">${esc(l)}</li>`)
    .join('')
  return `<!doctype html><html lang="fr"><body style="margin:0;padding:0;background:#F6F7F9">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F6F7F9;padding:32px 16px"><tr><td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#fff;border:1px solid #E0E4EB;border-radius:14px;overflow:hidden">
<tr><td style="background:#112C56;padding:28px 32px">
  <p style="margin:0 0 8px;font:600 12px/1 Poppins,'Segoe UI',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#F6B684">Radar by FeexPay</p>
  <p style="margin:0;font:600 24px/1.25 Poppins,'Segoe UI',sans-serif;color:#fff">${esc(nomRapport(r))}</p>
</td></tr>
<tr><td style="padding:28px 32px">
  <p style="margin:0 0 16px;font:400 16px/1.6 Poppins,'Segoe UI',sans-serif;color:#373E4B">Bonjour ${esc(r.contact.prenom)},</p>
  <p style="margin:0 0 20px;font:400 16px/1.6 Poppins,'Segoe UI',sans-serif;color:#373E4B">Votre rapport est prêt. Il est joint à cet email au format PDF et reste consultable en ligne.</p>
  <ul style="margin:0 0 24px;padding:0 0 0 18px">${resume}</ul>
  <a href="${esc(lien)}" style="display:inline-block;height:52px;line-height:52px;padding:0 28px;background:#D45D00;border-radius:12px;font:600 16px Poppins,'Segoe UI',sans-serif;color:#fff;text-decoration:none">Consulter mon rapport</a>
  <p style="margin:24px 0 0;font:400 13px/1.55 Poppins,'Segoe UI',sans-serif;color:#6C7686">Vos réponses servent à produire votre rapport, rien d’autre. Vous pouvez en demander la suppression à tout moment en écrivant à contact.ci@feexpay.me.</p>
</td></tr>
<tr><td style="padding:18px 32px;border-top:1px solid #E0E4EB"><p style="margin:0;font:400 12px/1.5 Poppins,'Segoe UI',sans-serif;color:#7E97BF">Radar by FeexPay · Powered by FeexPay</p></td></tr>
</table></td></tr></table></body></html>`
}
