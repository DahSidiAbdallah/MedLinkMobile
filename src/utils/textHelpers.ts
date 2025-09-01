export function summarizeText(input: string | null | undefined, limit = 300) {
  const text = input || '';
  if (text.length <= limit) return { display: text, truncated: false, remainder: '' };
  const display = text.slice(0, limit).trimEnd();
  const remainder = text.slice(limit).trimStart();
  return { display, truncated: true, remainder };
}

export function safeJoinArrayField(field: any) {
  if (!field) return '';
  if (Array.isArray(field)) return field.join('\n\n');
  return String(field);
}
