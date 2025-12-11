export const colors = {
  primary: '#2563EB',
  primary700: '#1E3A8A',
  primary600: '#1D4ED8',
  primary500: '#3B82F6',
  primary400: '#60A5FA',
  primary100: '#DBEAFE',
  accent: '#2DD4BF',
  secondary: '#7C3AED',
  secondary100: '#EDE9FE',
  warn: '#F59E0B',
  warn100: '#FEF3C7',
  danger: '#EF4444',
  danger100: '#FEE2E2',
  success: '#16A34A',
  success100: '#DCFCE7',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  surface: '#F1F5F9',
  text: '#0F172A',
  textSecondary: '#334155',
  muted: '#64748B',
  mutedLight: '#94A3B8',
  line: '#E2E8F0',
  lineDark: '#CBD5E1',
  overlay: 'rgba(15,23,42,0.4)',
  overlayLight: 'rgba(15,23,42,0.12)',
  glass: 'rgba(255,255,255,0.85)',
  glassLight: 'rgba(255,255,255,0.6)',
  chipBg: '#EFF6FF',
  chipText: '#1E40AF',
  progressTrack: '#E2E8F0',
  progressFill: '#2563EB',
  skeleton: '#E2E8F0',
  skeletonHighlight: '#F1F5F9',
  primaryGradient: ['#2563EB', '#7C3AED'] as const,
  accentGradient: ['#10B981', '#06B6D4'] as const,
  cardGradient: ['rgba(37,99,235,0.08)', 'rgba(124,58,237,0.05)'] as const,
  subtleGradient: ['#FFFFFF', '#F8FAFC'] as const,
  warmGradient: ['#F59E0B', '#EF4444'] as const,
  coolGradient: ['#06B6D4', '#8B5CF6'] as const,
};

export const radius = { xs: 8, md: 12, lg: 16, xl: 22, pill: 999 };

// compatibility: some files expect radius.xl
(radius as any).xl = radius.xl;

export const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

export const shadow = {
  card: {
    elevation: 8,
    shadowColor: 'rgba(15,23,42,0.15)',
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  soft: {
    elevation: 4,
    shadowColor: 'rgba(15,23,42,0.1)',
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  glow: {
    elevation: 12,
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  subtle: {
    elevation: 2,
    shadowColor: 'rgba(15,23,42,0.08)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
};

export const type = {
  h1: { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.5 } as const,
  h2: { fontSize: 22, fontWeight: '600', color: colors.text, letterSpacing: -0.3 } as const,
  h3: { fontSize: 18, fontWeight: '600', color: colors.text } as const,
  body: { fontSize: 16, color: colors.text, lineHeight: 24 } as const,
  bodySmall: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 } as const,
  meta: { fontSize: 12, fontWeight: '500', color: colors.muted } as const,
  label: { fontSize: 14, fontWeight: '600', color: colors.text } as const,
  caption: { fontSize: 11, fontWeight: '500', color: colors.mutedLight, letterSpacing: 0.3 } as const,
};

export const animation = {
  fast: 150,
  normal: 250,
  slow: 400,
  spring: { damping: 15, stiffness: 150 },
};
