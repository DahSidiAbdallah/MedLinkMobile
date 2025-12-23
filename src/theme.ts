export const colors = {
  // Primary - Modern blue with depth
  primary: '#2563EB',
  primary700: '#1D4ED8',
  primary600: '#2563EB',
  primary500: '#3B82F6',
  primary400: '#60A5FA',
  primary300: '#93C5FD',
  primary200: '#DBEAFE',
  primary100: '#EFF6FF',
  primary50: '#F8FAFF',
  
  // Accent colors - Vibrant and engaging
  accent: '#10B981',
  accentDark: '#059669',
  secondary: '#8B5CF6',
  secondary100: '#F3F4F6',
  
  // Status colors - Clear and accessible
  warn: '#F59E0B',
  warnLight: '#FEF3C7',
  warn100: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FECACA',
  danger100: '#FEF2F2',
  success: '#10B981',
  successLight: '#D1FAE5',
  success100: '#ECFDF5',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  info100: '#EFF6FF',
  
  // Backgrounds - Layered depth
  bg: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#F3F4F6',
  card: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceElevated: '#FFFFFF',
  
  // Text - Enhanced hierarchy
  text: '#111827',
  textSecondary: '#374151',
  textTertiary: '#6B7280',
  muted: '#9CA3AF',
  mutedLight: '#D1D5DB',
  placeholder: '#9CA3AF',
  
  // Lines and borders - Refined
  line: '#E5E7EB',
  lineDark: '#D1D5DB',
  border: '#E5E7EB',
  borderFocus: '#3B82F6',
  
  // Interactive states
  hover: '#F3F4F6',
  pressed: '#E5E7EB',
  focus: '#DBEAFE',
  
  // Overlays - Enhanced depth
  overlay: 'rgba(17, 24, 39, 0.75)',
  overlayLight: 'rgba(17, 24, 39, 0.1)',
  glass: 'rgba(255, 255, 255, 0.95)',
  glassLight: 'rgba(255, 255, 255, 0.8)',
  glassDark: 'rgba(17, 24, 39, 0.8)',
  
  // Chips - Enhanced contrast
  chipBg: '#F3F4F6',
  chipText: '#374151',
  chipBgActive: '#DBEAFE',
  chipTextActive: '#1D4ED8',
  chipBorder: '#E5E7EB',
  
  // Progress - Smooth gradients
  progressTrack: '#E5E7EB',
  progressFill: '#3B82F6',
  
  // Skeleton - Subtle animation
  skeleton: '#F3F4F6',
  skeletonHighlight: '#FFFFFF',
  
  // Enhanced gradients - More sophisticated
  primaryGradient: ['#3B82F6', '#1D4ED8'] as const,
  accentGradient: ['#10B981', '#059669'] as const,
  cardGradient: ['#FFFFFF', '#F9FAFB'] as const,
  subtleGradient: ['#F9FAFB', '#F3F4F6'] as const,
  warmGradient: ['#F59E0B', '#D97706'] as const,
  coolGradient: ['#10B981', '#3B82F6'] as const,
  heroGradient: ['#1E40AF', '#3B82F6', '#60A5FA'] as const,
  dangerGradient: ['#EF4444', '#DC2626'] as const,
  successGradient: ['#10B981', '#059669'] as const,
};

export const radius = { 
  xs: 6, 
  sm: 8, 
  md: 12, 
  lg: 16, 
  xl: 20, 
  xxl: 24,
  pill: 999 
};

// compatibility: some files expect radius.xl
(radius as any).xl = radius.xl;

export const spacing = { 
  xs: 4,
  sm: 8, 
  md: 12, 
  lg: 16, 
  xl: 20, 
  xxl: 24,
  xxxl: 32
};

export const shadow = {
  // Enhanced shadows for modern depth
  none: {
    elevation: 0,
    shadowOpacity: 0,
  },
  sm: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  card: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  lg: {
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  xl: {
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
  },
  // Colored shadows for special elements
  primary: {
    elevation: 8,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  success: {
    elevation: 8,
    shadowColor: '#10B981',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  danger: {
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
};

// Typography scale
export const typography = {
  // Display
  display: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 40,
  },
  // Headings
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  // Body text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodySemibold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  // Small text
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  smallMedium: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  smallSemibold: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  // Captions
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  captionMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
  captionSemibold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
  // Labels
  label: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};

// Animation durations
export const animation = {
  fast: 150,
  normal: 250,
  slow: 350,
  slower: 500,
};

// Breakpoints for responsive design
export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
};

// Legacy type export for backward compatibility
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