import { Resend } from 'resend'
import { createTransport, type Transporter } from 'nodemailer'

/**
 * Sortie email, deux transports pour un seul appelant.
 *
 * `resend` est le transport de production : une API HTTPS, aucun serveur de courrier à
 * tenir. `smtp` sert à la pile Docker, où Mailpit reçoit tout et ne délivre rien à
 * l'extérieur — utile pour lire un rapport, une invitation ou une réinitialisation sans
 * domaine vérifié ni clé API. Le choix se fait par `MAIL_TRANSPORT` ; le reste du code
 * n'appelle que `expedier` et ne sait pas lequel est actif.
 *
 * L'expéditeur est posé ici, pas par les appelants : c'est le seul endroit qui connaît le
 * transport, donc le seul qui doit connaître l'adresse d'envoi.
 */

export interface PieceJointe {
  filename: string
  contenu: Buffer
}

export interface Message {
  to: string
  subject: string
  text: string
  html?: string
  attachments?: PieceJointe[]
}

export interface Envoi {
  /** Identifiant rendu par le fournisseur, à ranger dans `notification.provider_id`. */
  id: string | null
  /** Renseigné si rien n'est parti ; le texte va dans `notification.last_error`. */
  error?: string
}

let smtp: Transporter | undefined

function transport(): 'resend' | 'smtp' {
  return useRuntimeConfig().mailTransport === 'smtp' ? 'smtp' : 'resend'
}

function expediteur(): string {
  const config = useRuntimeConfig()
  return config.mailFrom || config.resendFrom
}

/**
 * Message d'erreur si le transport n'est pas configuré, `null` s'il peut envoyer.
 * Les appelants s'en servent pour marquer la notification `failed` sans tenter l'envoi.
 */
export function transportIndisponible(): string | null {
  const config = useRuntimeConfig()
  if (transport() === 'smtp') return config.smtpUrl ? null : 'SMTP_URL absente'
  return config.resendApiKey ? null : 'RESEND_API_KEY absente'
}

/** Envoie le message. Ne lève pas : un échec revient dans `error`. */
export async function expedier(m: Message): Promise<Envoi> {
  const indisponible = transportIndisponible()
  if (indisponible) return { id: null, error: indisponible }
  try {
    return transport() === 'smtp' ? await parSmtp(m) : await parResend(m)
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : String(e) }
  }
}

async function parResend(m: Message): Promise<Envoi> {
  const config = useRuntimeConfig()
  const { data, error } = await new Resend(config.resendApiKey).emails.send({
    from: expediteur(),
    to: m.to,
    subject: m.subject,
    text: m.text,
    ...(m.html ? { html: m.html } : {}),
    ...(m.attachments?.length
      ? { attachments: m.attachments.map((p) => ({ filename: p.filename, content: p.contenu.toString('base64') })) }
      : {}),
  })
  // Format conservé tel quel : c'est ce que le journal des envois affiche déjà.
  if (error) return { id: null, error: `${error.name}: ${error.message}` }
  return { id: data?.id ?? null }
}

async function parSmtp(m: Message): Promise<Envoi> {
  const config = useRuntimeConfig()
  // Un seul transporteur par processus : il garde la connexion ouverte entre deux envois.
  smtp ??= createTransport(config.smtpUrl)
  const info = await smtp.sendMail({
    from: expediteur(),
    to: m.to,
    subject: m.subject,
    text: m.text,
    ...(m.html ? { html: m.html } : {}),
    ...(m.attachments?.length
      ? { attachments: m.attachments.map((p) => ({ filename: p.filename, content: p.contenu })) }
      : {}),
  })
  return { id: info.messageId ?? null }
}
