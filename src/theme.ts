export const colors = {
  // Primary — Medical Blue
  primary:    '#0066CC',
  primary700: '#0052A3',
  primary600: '#005BB8',
  primary500: '#0066CC',
  primary400: '#1A75D6',
  primary300: '#3385E0',
  primary200: '#66A3F0',
  primary100: '#B3D1F7',
  primary50:  '#E6F2FF',   // primary at ~15% opacity — chips / highlights

  // Accent
  accent:      '#FF8C00',
  accentDark:  '#E67E00',
  secondary:   '#7C6FE0',
  secondary100:'#EDEBFA',

  // Status — spec-compliant values
  success:      '#22C55E',
  successLight: '#DCFCE7',
  success100:   '#F0FDF4',
  warn:         '#F59E0B',
  warnLight:    '#FEF3C7',
  warn100:      '#FFFBEB',
  danger:       '#EF4444',
  dangerLight:  '#FEE2E2',
  danger100:    '#FFF1F1',
  info:         '#3B82F6',
  infoLight:    '#EFF6FF',
  info100:      '#F0F7FF',

  // Backgrounds — warm off-white base
  bg:              '#FAFAFA',   // off-white — never pure white for screens
  bgSecondary:     '#F0F0F0',   // inactive chips, icon wraps, input fills
  bgTertiary:      '#E8E8E8',
  card:            '#FFFFFF',   // cards float on #FAFAFA
  surface:         '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text — 3-level hierarchy
  text:          '#1A1A1A',   // primary
  textSecondary: '#666666',   // secondary
  textTertiary:  '#999999',   // muted / labels
  muted:         '#999999',
  mutedLight:    '#CCCCCC',
  placeholder:   '#999999',

  // Lines & borders — used sparingly
  line:        '#EBEBEB',
  lineDark:    '#D4D4D4',
  border:      '#EBEBEB',
  borderFocus: '#0066CC',

  // Interactive states
  hover:   '#F5F5F5',
  pressed: '#EBEBEB',
  focus:   '#E6F2FF',

  // Overlays
  overlay:      'rgba(0, 0, 0, 0.45)',
  overlayLight: 'rgba(0, 0, 0, 0.06)',
  glass:        'rgba(255, 255, 255, 0.96)',
  glassLight:   'rgba(255, 255, 255, 0.82)',
  glassDark:    'rgba(0, 0, 0, 0.04)',

  // Chips
  chipBg:        '#F0F0F0',
  chipText:      '#1A1A1A',
  chipBgActive:  '#E6F2FF',
  chipTextActive:'#0066CC',
  chipBorder:    '#EBEBEB',

  // Progress
  progressTrack: '#F0F0F0',
  progressFill:  '#0066CC',

  // Skeleton
  skeleton:          '#F0F0F0',
  skeletonHighlight: '#FAFAFA',

  // Gradients
  primaryGradient: ['#0066CC', '#0052A3'] as const,
  accentGradient:  ['#FF8C00', '#E67E00'] as const,
  cardGradient:    ['#FFFFFF', '#FAFAFA'] as const,
  subtleGradient:  ['#FAFAFA', '#F0F0F0'] as const,
  warmGradient:    ['#FF8C00', '#E67E00'] as const,
  coolGradient:    ['#0066CC', '#7C6FE0'] as const,
  heroGradient:    ['#0066CC', '#005BB8'] as const,
  dangerGradient:  ['#EF4444', '#DC2626'] as const,
  successGradient: ['#22C55E', '#16A34A'] as const,
};

export const radius = {
  xs:   4,
  sm:   6,
  md:   8,
  lg:   10,   // buttons — height 44, radius 10
  xl:   12,   // cards — radius 12
  xxl:  16,   // banners / hero blocks — radius 16
  xxxl: 20,   // chips / badges / pills — radius 20
  xxxx: 28,   // large modals / bottom sheets
  pill: 999,
};

export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,   // screen horizontal padding
  xxl:  24,
  xxxl:  32,
  xxxxl: 40,
};

// Shadows — elevation 2, shadowOpacity 0.06–0.08, shadowRadius 4 (spec)
export const shadow = {
  none: { elevation: 0, shadowOpacity: 0 },
  sm: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  soft: {
    elevation: 1,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  card: {
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  lg: {
    elevation: 3,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  xl: {
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.10,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  primary: {
    elevation: 3,
    shadowColor: '#0066CC',
    shadowOpacity: 0.20,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  success: {
    elevation: 2,
    shadowColor: '#22C55E',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  danger: {
    elevation: 2,
    shadowColor: '#EF4444',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
};

export const typography = {
  display:       { fontSize: 36, fontWeight: '800' as const, lineHeight: 44 },
  h1:            { fontSize: 22, fontWeight: '700' as const, lineHeight: 30 },  // screen titles
  h2:            { fontSize: 18, fontWeight: '700' as const, lineHeight: 26 },  // section headers
  h3:            { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },  // card titles
  h4:            { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
  body:          { fontSize: 14, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium:    { fontSize: 14, fontWeight: '500' as const, lineHeight: 22 },
  bodySemibold:  { fontSize: 14, fontWeight: '600' as const, lineHeight: 22 },
  small:         { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
  smallMedium:   { fontSize: 13, fontWeight: '500' as const, lineHeight: 20 },
  smallSemibold: { fontSize: 13, fontWeight: '600' as const, lineHeight: 20 },
  caption:         { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  captionMedium:   { fontSize: 12, fontWeight: '500' as const, lineHeight: 18 },
  captionSemibold: { fontSize: 12, fontWeight: '600' as const, lineHeight: 18 },
  label: { fontSize: 11, fontWeight: '500' as const, lineHeight: 16, letterSpacing: 0.3 },
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
  h1:        { fontSize: 22, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 } as const,
  h2:        { fontSize: 18, fontWeight: '700', color: '#1A1A1A' } as const,
  h3:        { fontSize: 16, fontWeight: '600', color: '#1A1A1A' } as const,
  body:      { fontSize: 14, color: '#1A1A1A', lineHeight: 22 } as const,
  bodySmall: { fontSize: 13, color: '#666666', lineHeight: 20 } as const,
  meta:      { fontSize: 12, fontWeight: '500', color: '#999999' } as const,
  label:     { fontSize: 13, fontWeight: '600', color: '#1A1A1A' } as const,
  caption:   { fontSize: 11, fontWeight: '500', color: '#999999', letterSpacing: 0.3 } as const,
};
