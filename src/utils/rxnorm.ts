export async function findRxcuiByName(name: string) {
  if (!name) return null
  const url = `https://rxnav.nlm.nih.gov/REST/rxcui.json?name=${encodeURIComponent(name)}`
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const j = await resp.json()
    return j.idGroup?.rxnormId?.[0] ?? null
  } catch (e) {
  // eslint-disable-next-line no-console
  console.debug('rxnorm.findRxcuiByName error', (e as any)?.message ?? e)
  return null
  }
}
