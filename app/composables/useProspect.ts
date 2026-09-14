/** Fiche prospect (A04/A05 et onglets) : une seule lecture partagée entre les onglets. */
export function useProspect() {
  const route = useRoute()
  const id = computed(() => String(route.params.id))
  const { data, error, pending, refresh } = useFetch<any>(() => `/api/admin/prospects/${id.value}`, {
    key: `prospect-${id.value}`,
    headers: useRequestHeaders(['cookie']),
  })
  return { id, fiche: data, error, pending, refresh }
}
