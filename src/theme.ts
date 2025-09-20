export const colors = {
  primary: '#2563EB',
  primary700: '#1E3A8A',
  // compatibility alias used across the codebase
  primary600: '#1D4ED8',
  accent: '#2DD4BF',
  secondary: '#7C3AED',
  warn: '#F59E0B',
  danger: '#EF4444',
  success: '#16A34A',
  // slightly cooler background for depth
  bg: '#F1F5FF',
  card: '#FFFFFF',
  surface: '#F8FBFF',
  text: '#0F172A',
  // a hair darker for contrast
  muted: '#5B6B8C',
  // lighter lines
  line: '#E0E7FF',
  // translucent overlays and accents
  overlay: 'rgba(15,23,42,0.12)',
  glass: 'rgba(255,255,255,0.72)',
  // new tokens for chips/progress
  chipBg: '#EFF4FF',
  chipText: '#1F2937',
  progressTrack: '#E2E8FF',
  progressFill: '#2563EB',
  // gradients
  primaryGradient: ['#2563EB', '#7C3AED'] as const,
  accentGradient: ['#34D399', '#22D3EE'] as const,
  cardGradient: ['rgba(37,99,235,0.12)', 'rgba(124,58,237,0.08)'] as const,
  subtleGradient: ['rgba(255,255,255,0.86)', 'rgba(241,245,255,0.92)'] as const,
};

export const radius = { xs: 8, md: 12, lg: 16, xl: 22, pill: 999 };

// compatibility: some files expect radius.xl
(radius as any).xl = radius.xl;

export const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

export const shadow = {
  card: {
    elevation: 6,
    shadowColor: 'rgba(15,23,42,0.22)',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  soft: {
    elevation: 3,
    shadowColor: 'rgba(15,23,42,0.18)',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
};

export const type = {
  h1: { fontSize: 30, fontWeight: '700', color: colors.text } as const,
  h2: { fontSize: 22, fontWeight: '600', color: colors.text } as const,
  body: { fontSize: 16, color: colors.text } as const,
  meta: { fontSize: 12, fontWeight: '500', color: colors.muted } as const,
};
