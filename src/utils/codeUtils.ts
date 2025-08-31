export function digitsOnly(s: string) {
  return (s || '').toString().replace(/[^0-9]/g, '');
}

export function normalizeGtinTo14(s: string) {
  const d = digitsOnly(s);
  if (!d) return '';
  return d.padStart(14, '0');
}

export function normalizeNdc(s: string) {
  // Return NDC as 10 or 11 digits (no hyphens)
  const d = digitsOnly(s);
  if (!d) return '';
  if (d.length === 10 || d.length === 11) return d;
  // If 9 or 8 maybe missing leading zero, try to pad to 10
  if (d.length < 10) return d.padStart(10, '0');
  return d;
}
