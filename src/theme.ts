export const colors = {
  // Primary — Mint teal
  primary:    '#26C9A8',
  primary700: '#1BA88C',
  primary600: '#22BA9A',
  primary500: '#2ED4B2',
  primary400: '#54DCC2',
  primary300: '#82E8D6',
  primary200: '#B4F2EA',
  primary100: '#D8FAF4',
  primary50:  '#EDFDF9',

  // Accent / secondary
  accent:      '#26C9A8',
  accentDark:  '#1BA88C',
  secondary:   '#7C6FE0',
  secondary100:'#EDEBFA',

  // Status
  warn:         '#F59E0B',
  warnLight:    '#FEF3C7',
  warn100:      '#FFFBEB',
  danger:       '#EF4444',
  dangerLight:  '#FEE2E2',
  danger100:    '#FFF1F1',
  success:      '#22C55E',
  successLight: '#DCFCE7',
  success100:   '#F0FDF4',
  info:         '#26C9A8',
  infoLight:    '#D8FAF4',
  info100:      '#EDFDF9',

  // Backgrounds — light airy feel matching screenshots
  bg:          '#F7F8FA',       // page bg — very light gray
  bgSecondary: '#ECEEF2',
  bgTertiary:  '#E4E6EB',
  card:        '#FFFFFF',       // cards sit on gray bg
  surface:     '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text — precise hierarchy
  text:          '#111827',
  textSecondary: '#6B7280',
  textTertiary:  '#9CA3AF',
  muted:         '#C4C9D4',
  mutedLight:    '#E5E7EB',
  placeholder:   '#B0B7C3',

  // Lines & borders
  line:        '#EAECF0',
  lineDark:    '#D1D5DB',
  border:      '#EAECF0',
  borderFocus: '#26C9A8',

  // Interactive
  hover:   '#F5FBF9',
  pressed: '#EDFDF9',
  focus:   '#D8FAF4',

  // Overlays
  overlay:      'rgba(0, 0, 0, 0.42)',
  overlayLight: 'rgba(0, 0, 0, 0.07)',
  glass:        'rgba(255, 255, 255, 0.96)',
  glassLight:   'rgba(255, 255, 255, 0.82)',
  glassDark:    'rgba(0, 0, 0, 0.04)',

  // Chips
  chipBg:        '#F0F2F5',
  chipText:      '#374151',
  chipBgActive:  '#D8FAF4',
  chipTextActive:'#26C9A8',
  chipBorder:    '#E4E6EB',

  // Progress
  progressTrack: '#EAECF0',
  progressFill:  '#26C9A8',

  // Skeleton
  skeleton:          '#ECEEF2',
  skeletonHighlight: '#F7F8FA',

  // Gradients
  primaryGradient: ['#26C9A8', '#1BA88C'] as const,
  accentGradient:  ['#26C9A8', '#1BA88C'] as const,
  cardGradient:    ['#FFFFFF', '#F8FAF9'] as const,
  subtleGradient:  ['#F8FAF9', '#F2F4F7'] as const,
  warmGradient:    ['#F59E0B', '#D97706'] as const,
  coolGradient:    ['#26C9A8', '#7C6FE0'] as const,
  heroGradient:    ['#26C9A8', '#1DC9A4'] as const,
  dangerGradient:  ['#EF4444', '#DC2626'] as const,
  successGradient: ['#22C55E', '#16A34A'] as const,
};

export const radius = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  pill: 999,
};

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

// Shadows — very subtle, matching the minimal screenshot aesthetic
export const shadow = {
  none: { elevation: 0, shadowOpacity: 0 },
  sm: {
    elevation: 1,
    shadowColor: '#101828',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  soft: {
    elevation: 2,
    shadowColor: '#101828',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  card: {
    elevation: 2,
    shadowColor: '#101828',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  lg: {
    elevation: 4,
    shadowColor: '#101828',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  xl: {
    elevation: 6,
    shadowColor: '#101828',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 6 },
  },
  primary: {
    elevation: 4,
    shadowColor: '#26C9A8',
    shadowOpacity: 0.30,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
  },
  success: {
    elevation: 3,
    shadowColor: '#22C55E',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  danger: {
    elevation: 3,
    shadowColor: '#EF4444',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
};

export const typography = {
  display:       { fontSize: 36, fontWeight: '800' as const, lineHeight: 44 },
  h1:            { fontSize: 30, fontWeight: '700' as const, lineHeight: 38 },
  h2:            { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  h3:            { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  h4:            { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body:          { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium:    { fontSize: 16, fontWeight: '500' as const, lineHeight: 24 },
  bodySemibold:  { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  small:         { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  smallMedium:   { fontSize: 14, fontWeight: '500' as const, lineHeight: 20 },
  smallSemibold: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  caption:         { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  captionMedium:   { fontSize: 12, fontWeight: '500' as const, lineHeight: 16 },
  captionSemibold: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  label: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.5 },
};

export default typography;

export const animation = {
  fast:   150,
  normal: 250,
  slow:   350,
  slower: 500,
};

export const breakpoints = {
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
};

export const type = {
  h1:        { fontSize: 30, fontWeight: '700', color: '#111827', letterSpacing: -0.5 } as const,
  h2:        { fontSize: 24, fontWeight: '600', color: '#111827', letterSpacing: -0.3 } as const,
  h3:        { fontSize: 20, fontWeight: '600', color: '#111827' } as const,
  body:      { fontSize: 16, color: '#111827', lineHeight: 24 } as const,
  bodySmall: { fontSize: 14, color: '#6B7280', lineHeight: 20 } as const,
  meta:      { fontSize: 12, fontWeight: '500', color: '#9CA3AF' } as const,
  label:     { fontSize: 14, fontWeight: '600', color: '#111827' } as const,
  caption:   { fontSize: 11, fontWeight: '500', color: '#C4C9D4', letterSpacing: 0.3 } as const,
};
