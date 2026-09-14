import { reglagesPublics } from '../../utils/settings'

/** Identifiants de tracking non secrets, pour le chargement conditionnel côté client. */
export default defineEventHandler(async () => reglagesPublics())
