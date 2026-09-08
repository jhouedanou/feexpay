import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Clients Supabase côté serveur. Le client « admin » porte la clé service et sert à
 * créer les utilisateurs, poser leur mot de passe et couper leurs sessions. Le client
 * « utilisateur » porte le jeton d'accès de l'admin connecté et sert aux opérations
 * MFA (enrôlement, challenge, vérification) qui exigent sa propre session.
 * Aucune session n'est persistée : chaque requête HTTP reconstruit son client.
 */
let admin: SupabaseClient | null = null

export function supabaseAdmin(): SupabaseClient {
  if (admin) return admin
  const { supabaseUrl, supabaseServiceKey } = useRuntimeConfig()
  if (!supabaseUrl || !supabaseServiceKey) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_KEY manquant')
  admin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
  return admin
}

export function supabaseAnon(): SupabaseClient {
  const config = useRuntimeConfig()
  return createClient(config.supabaseUrl, config.public.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

export function supabaseAs(accessToken: string): SupabaseClient {
  const config = useRuntimeConfig()
  return createClient(config.supabaseUrl, config.public.supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}
