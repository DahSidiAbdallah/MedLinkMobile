export const colors = {
  // Primary - Clean blue
  primary: '#0066FF',
  primary700: '#0052CC',
  primary600: '#005CE6',
  primary500: '#0066FF',
  primary400: '#3385FF',
  primary100: '#E6F0FF',
  
  // Accent colors - Flat and modern
  accent: '#00C48C',
  secondary: '#6B4EFF',
  secondary100: '#F0EDFF',
  
  // Status colors - Flat
  warn: '#FFB020',
  warn100: '#FFF4E0',
  danger: '#FF4757',
  danger100: '#FFE8EA',
  success: '#00C48C',
  success100: '#E0FFF6',
  
  // Backgrounds - Clean whites and grays
  bg: '#FAFBFC',
  card: '#FFFFFF',
  surface: '#F4F5F7',
  
  // Text - High contrast (WCAG AA compliant)
  text: '#0F172A',
  textSecondary: '#334155',
  muted: '#475569',
  mutedLight: '#64748B',
  
  // Lines and borders
  line: '#EBECF0',
  lineDark: '#DFE1E6',
  
  // Overlays
  overlay: 'rgba(9,30,66,0.54)',
  overlayLight: 'rgba(9,30,66,0.08)',
  glass: 'rgba(255,255,255,0.95)',
  glassLight: 'rgba(255,255,255,0.8)',
  
  // Chips - Better contrast
  chipBg: '#F1F5F9',
  chipText: '#334155',
  chipBgActive: '#E6F0FF',
  chipTextActive: '#0066FF',
  
  // Progress
  progressTrack: '#EBECF0',
  progressFill: '#0066FF',
  
  // Skeleton
  skeleton: '#F4F5F7',
  skeletonHighlight: '#FAFBFC',
  
  // Gradients - Subtle, not flashy
  primaryGradient: ['#0066FF', '#0052CC'] as const,
  accentGradient: ['#00C48C', '#00A878'] as const,
  cardGradient: ['#FFFFFF', '#FAFBFC'] as const,
  subtleGradient: ['#FFFFFF', '#FAFBFC'] as const,
  warmGradient: ['#FFB020', '#FF8B00'] as const,
  coolGradient: ['#00C48C', '#0066FF'] as const,
};

export const radius = { xs: 8, md: 12, lg: 16, xl: 22, pill: 999 };

// compatibility: some files expect radius.xl
(radius as any).xl = radius.xl;

export const spacing = { xs: 6, sm: 8, md: 12, lg: 16, xl: 22, xxl: 30 };

export const shadow = {
  // Flat, subtle shadows for modern look
  card: {
    elevation: 2,
    shadowColor: 'rgba(9,30,66,0.08)',
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
  },
  soft: {
    elevation: 1,
    shadowColor: 'rgba(9,30,66,0.06)',
    shadowOpacity: 1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  glow: {
    elevation: 4,
    shadowColor: '#0066FF',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  subtle: {
    elevation: 1,
    shadowColor: 'rgba(9,30,66,0.04)',
    shadowOpacity: 1,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  none: {
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
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
