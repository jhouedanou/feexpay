export interface AdminMe {
  user: { id: string; prenom: string; nom: string; email: string; role: 'lecture' | 'commercial' | 'analyste' | 'admin'; roleLabel: string; team: string | null; status: string; export_allowed: boolean }
  aal: 'aal1' | 'aal2'
  mfa: { requise: boolean; enrolee: boolean; verifiee: boolean }
}

export const ROLE_RANK = { lecture: 0, commercial: 1, analyste: 2, admin: 3 } as const

/** Contexte de l'admin connecté, partagé entre le layout, le middleware et les pages. */
export function useAdmin() {
  const me = useState<AdminMe | null>('admin-me', () => null)
  const charge = useState<boolean>('admin-me-charge', () => false)

  const charger = async () => {
    try {
      me.value = await $fetch<AdminMe>('/api/admin/auth/me', { headers: useRequestHeaders(['cookie']) })
    } catch {
      me.value = null
    } finally {
      charge.value = true
    }
  }

  const peut = (role: keyof typeof ROLE_RANK) =>
    Boolean(me.value && ROLE_RANK[me.value.user.role] >= ROLE_RANK[role])

  const initiales = computed(() =>
    me.value ? `${me.value.user.prenom[0] ?? ''}${me.value.user.nom[0] ?? ''}`.toUpperCase() : '',
  )

  const deconnecter = async () => {
    await $fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => null)
    me.value = null
    await navigateTo('/admin/connexion')
  }

  return { me, charge, charger, peut, initiales, deconnecter }
}

/** Message d'erreur d'une réponse API. */
export function messageErreur(e: unknown, defaut = 'Une erreur est survenue.'): string {
  const err = e as { data?: { data?: { message?: string }; message?: string } }
  return err?.data?.data?.message ?? err?.data?.message ?? defaut
}
