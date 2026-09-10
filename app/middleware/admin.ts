/**
 * Pages /admin/** : session exigée, second facteur exigé quand il s'impose, rôle vérifié.
 * Les pages libres : connexion, acceptation d'invitation, réinitialisation du mot de passe
 * — sans session, par construction. La page 2FA est accessible dès la connexion (c'est là
 * qu'on enrôle ou vérifie).
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  if (to.path === '/admin/connexion') return
  if (to.path.startsWith('/admin/invitation/') || to.path.startsWith('/admin/mot-de-passe-oublie')) return
  const { me, charger, peut } = useAdmin()
  if (!me.value) await charger()
  if (!me.value) return navigateTo(`/admin/connexion?suite=${encodeURIComponent(to.fullPath)}`)
  if (me.value.user.status !== 'active') return navigateTo('/admin/connexion?motif=inactif')
  if (me.value.mfa.requise && !me.value.mfa.verifiee && to.path !== '/admin/2fa') return navigateTo('/admin/2fa')
  const role = (to.meta.role as keyof typeof ROLE_RANK | undefined) ?? 'lecture'
  if (!peut(role)) return navigateTo('/admin/acces-refuse?section=' + encodeURIComponent(String(to.meta.section ?? '')))
})
