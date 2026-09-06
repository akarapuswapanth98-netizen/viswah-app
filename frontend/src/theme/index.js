export const COLORS = {
  primary: '#7C3AED',
  primaryDark: '#6D28D9',
  primaryLight: '#A78BFA',
  secondary: '#06B6D4',
  secondaryDark: '#0891B2',
  secondaryLight: '#22D3EE',
  accent: '#10B981',
  accentDark: '#059669',
  accentLight: '#34D399',
  neon: '#7C3AED',
  neonCyan: '#06B6D4',
  neonGreen: '#10B981',
  white: '#FFFFFF',
  black: '#090A0F',
  background: '#090A0F',
  bg: '#090A0F',
  bgElevated: '#0E111A',
  bgCard: '#12151F',
  bgCardHover: '#1A1E2E',
  surface: 'rgba(255,255,255,0.04)',
  surfaceHover: 'rgba(255,255,255,0.07)',
  surfaceActive: 'rgba(255,255,255,0.10)',
  surfaceBorder: 'rgba(255,255,255,0.06)',
  surfaceBorderHover: 'rgba(255,255,255,0.12)',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#090A0F',
  gray100: '#1E293B',
  gray200: '#1A202E',
  gray300: '#151822',
  gray400: '#11141C',
  gray500: '#0D0F16',
  gray600: '#0A0C12',
  gray700: '#08090E',
  gray800: '#06070B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',
  stage1: '#7C3AED',
  stage2: '#EC4899',
  stage3: '#F59E0B',
  stage4: '#EF4444',
  gradient: {
    primary: ['#7C3AED', '#A78BFA'],
    sunset: ['#EC4899', '#F43F5E'],
    ocean: ['#06B6D4', '#10B981'],
    royal: ['#7C3AED', '#EC4899'],
    dark: ['#090A0F', '#0E111A'],
    neon: ['#7C3AED', '#06B6D4'],
  },
  glass: {
    bg: 'rgba(15,18,30,0.72)',
    bgLight: 'rgba(255,255,255,0.03)',
    border: 'rgba(255,255,255,0.06)',
    borderHover: 'rgba(255,255,255,0.12)',
    shadow: 'rgba(0,0,0,0.5)',
  },
};

export const TYPOGRAPHY = {
  fonts: { regular: 'Inter, system-ui, sans-serif', medium: 'Inter, system-ui, sans-serif', bold: 'Inter, system-ui, sans-serif' },
  sizes: { xs: 11, sm: 13, md: 14, lg: 16, xl: 18, xxl: 24, xxxl: 30, display: 38, hero: 48 },
  weights: { light: '300', regular: '400', medium: '500', semibold: '600', bold: '700', extrabold: '800' },
};

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, xxxxl: 40 };

export const BORDER_RADIUS = { sm: 6, md: 10, lg: 14, xl: 18, xxl: 24, full: 9999 };

export const SHADOWS = {
  subtle: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 1 },
  small: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 3 },
  medium: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 6 },
  large: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.6, shadowRadius: 32, elevation: 10 },
  primary: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 6 },
  neon: { shadowColor: COLORS.neonCyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 8 },
  glass: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 40, elevation: 8 },
};

export const GLASS = {
  card: { backgroundColor: COLORS.glass.bg, borderRadius: BORDER_RADIUS.xl, borderWidth: 1, borderColor: COLORS.glass.border, overflow: 'hidden' },
  sidebar: { backgroundColor: 'rgba(9,10,15,0.95)', borderRightWidth: 1, borderRightColor: COLORS.surfaceBorder },
  topbar: { backgroundColor: 'rgba(9,10,15,0.80)', borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder },
};

export const LAYOUT = {
  screenPadding: SPACING.lg,
  cardPadding: SPACING.xl,
  headerHeight: 60,
  sidebarWidth: 220,
  maxContentWidth: 1400,
};

export const createGradient = (colors) => ({ colors, start: { x: 0, y: 0 }, end: { x: 1, y: 1 } });
