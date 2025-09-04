export const colors = {
  primary: '#2563EB',
  primary700: '#1E40AF',
  // compatibility alias used across the codebase
  primary600: '#1E40AF',
  accent: '#22C55E',
  warn: '#F59E0B',
  danger: '#EF4444',
  bg: '#F6F8FF',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  line: '#E6E9F0',
  overlay: 'rgba(15,23,42,0.06)'
};

export const radius = { xs: 8, md: 12, lg: 16, xl: 20, pill: 999 };

// compatibility: some files expect radius.xl
(radius as any).xl = radius.xl;

export const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 };

export const shadow = {
  card: { elevation: 4, shadowColor: '#09122a', shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  soft: { elevation: 2, shadowColor: '#09122a', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } }
};

export const type = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text } as const,
  h2: { fontSize: 20, fontWeight: '600', color: colors.text } as const,
  body: { fontSize: 15, color: colors.text } as const,
  meta: { fontSize: 12, fontWeight: '500', color: colors.muted } as const,
};
