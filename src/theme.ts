export const colors = {
  primary: '#2563EB',
  primary700: '#1E40AF',
  // compatibility alias used across the codebase
  primary600: '#1E40AF',
  accent: '#22C55E',
  warn: '#F59E0B',
  danger: '#EF4444',
  // slightly cooler background for depth
  bg: '#F3F6FF',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#0F172A',
  // a hair darker for contrast
  muted: '#64748B',
  // lighter lines
  line: '#EDF0F7',
  // stronger overlay for modals
  overlay: 'rgba(15,23,42,0.10)',
  // new tokens for chips/progress
  chipBg: '#F6F8FF',
  chipText: '#334155',
  progressTrack: '#E9EEFF',
  progressFill: '#2563EB'
};

export const radius = { xs: 8, md: 12, lg: 16, xl: 22, pill: 999 };

// compatibility: some files expect radius.xl
(radius as any).xl = radius.xl;

export const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

export const shadow = {
  card: { elevation: 5, shadowColor: '#0B132B', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 7 } },
  soft: { elevation: 3, shadowColor: '#0B132B', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }
};

export const type = {
  h1: { fontSize: 30, fontWeight: '700', color: colors.text } as const,
  h2: { fontSize: 22, fontWeight: '600', color: colors.text } as const,
  body: { fontSize: 16, color: colors.text } as const,
  meta: { fontSize: 12, fontWeight: '500', color: colors.muted } as const,
};
