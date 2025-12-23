export const colors = {
  // Primary - Ultra modern blue system
  primary: '#0066FF',
  primary700: '#0052CC',
  primary600: '#0066FF',
  primary500: '#1A7FFF',
  primary400: '#4D9FFF',
  primary300: '#80BFFF',
  primary200: '#B3DFFF',
  primary100: '#E6F3FF',
  primary50: '#F0F7FF',
  
  // Accent colors - Modern and vibrant
  accent: '#00D9FF',
  accentDark: '#00B8D4',
  secondary: '#6366F1',
  secondary100: '#E0E7FF',
  
  // Status colors - Flat and clear
  warn: '#FFB800',
  warnLight: '#FFF4CC',
  warn100: '#FFFAEB',
  danger: '#FF3B30',
  dangerLight: '#FFE5E5',
  danger100: '#FFF0F0',
  success: '#00C896',
  successLight: '#E6FFF9',
  success100: '#F0FFFC',
  info: '#007AFF',
  infoLight: '#E3F2FD',
  info100: '#F0F8FF',
  
  // Backgrounds - Ultra clean flat design
  bg: '#FFFFFF',
  bgSecondary: '#F8F9FA',
  bgTertiary: '#F0F0F0',
  card: '#FFFFFF',
  surface: '#FAFAFA',
  surfaceElevated: '#FFFFFF',
  
  // Text - Modern hierarchy
  text: '#1A1A1A',
  textSecondary: '#666666',
  textTertiary: '#999999',
  muted: '#CCCCCC',
  mutedLight: '#E0E0E0',
  placeholder: '#CCCCCC',
  
  // Lines and borders - Minimal
  line: '#F0F0F0',
  lineDark: '#E0E0E0',
  border: '#F0F0F0',
  borderFocus: '#0066FF',
  
  // Interactive states - Subtle
  hover: '#F5F5F5',
  pressed: '#EEEEEE',
  focus: '#E6F3FF',
  
  // Overlays - Clean
  overlay: 'rgba(0, 0, 0, 0.4)',
  overlayLight: 'rgba(0, 0, 0, 0.1)',
  glass: 'rgba(255, 255, 255, 0.95)',
  glassLight: 'rgba(255, 255, 255, 0.8)',
  glassDark: 'rgba(0, 0, 0, 0.05)',
  
  // Chips - Clean flat design
  chipBg: '#F5F5F5',
  chipText: '#333333',
  chipBgActive: '#E6F3FF',
  chipTextActive: '#0066FF',
  chipBorder: '#F0F0F0',
  
  // Progress - Flat
  progressTrack: '#F0F0F0',
  progressFill: '#0066FF',
  
  // Skeleton - Subtle
  skeleton: '#F5F5F5',
  skeletonHighlight: '#FFFFFF',
  
  // Modern gradients - Subtle and sophisticated
  primaryGradient: ['#0066FF', '#0052CC'] as const,
  accentGradient: ['#00D9FF', '#00B8D4'] as const,
  cardGradient: ['#FFFFFF', '#FAFAFA'] as const,
  subtleGradient: ['#FAFAFA', '#F5F5F5'] as const,
  warmGradient: ['#FFB800', '#FF9500'] as const,
  coolGradient: ['#00C896', '#0066FF'] as const,
  heroGradient: ['#0066FF', '#00D9FF'] as const,
  dangerGradient: ['#FF3B30', '#FF2D20'] as const,
  successGradient: ['#00C896', '#00B386'] as const,
};

export const radius = { 
  xs: 4, 
  sm: 6, 
  md: 8, 
  lg: 12, 
  xl: 16, 
  xxl: 20,
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
  // Flat design - minimal shadows
  none: {
    elevation: 0,
    shadowOpacity: 0,
  },
  sm: {
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  card: {
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  lg: {
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  xl: {
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  // Colored shadows for special elements - more subtle
  primary: {
    elevation: 4,
    shadowColor: '#0066FF',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  success: {
    elevation: 4,
    shadowColor: '#00C896',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  danger: {
    elevation: 4,
    shadowColor: '#FF3B30',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
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