// Viswah Design System - Unified Theme Constants

export const COLORS = {
  // Primary Brand
  primary: '#6C63FF',
  primaryDark: '#5A52D5',
  primaryLight: '#8B85FF',
  
  // Secondary
  secondary: '#FF6B6B',
  secondaryDark: '#E55555',
  secondaryLight: '#FF8585',
  
  // Accent
  accent: '#4ECDC4',
  accentDark: '#3DB8B0',
  accentLight: '#6ED9D2',
  
  // Neutrals
  white: '#FFFFFF',
  black: '#1A1A2E',
  gray100: '#F7F7FC',
  gray200: '#EEEEF5',
  gray300: '#E2E2EA',
  gray400: '#C4C4D4',
  gray500: '#9E9EB8',
  gray600: '#6B6B8D',
  gray700: '#4A4A6A',
  gray800: '#2D2D44',
  
  // Semantic
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  
  // Stage Colors
  stage1: '#6C63FF',
  stage2: '#9C27B0',
  stage3: '#E91E63',
  stage4: '#FF5722',
  
  // Backgrounds
  background: '#F8F9FE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  // Gradients
  gradient: {
    primary: ['#6C63FF', '#8B85FF'],
    sunset: ['#FF6B6B', '#FF8E53'],
    ocean: ['#4ECDC4', '#44A08D'],
    royal: ['#6C63FF', '#9C27B0'],
  },
};

export const TYPOGRAPHY = {
  // Font Families
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    light: 'System',
  },
  
  // Font Sizes
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    display: 34,
    hero: 40,
  },
  
  // Line Heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font Weights
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const SPACING = {
  // Base unit (4px)
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  
  // Section spacing
  sectionSmall: 16,
  sectionMedium: 24,
  sectionLarge: 32,
  sectionXLarge: 48,
};

export const BORDER_RADIUS = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  full: 9999,
};

export const SHADOWS = {
  // Subtle
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Small
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  
  // Medium
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Large
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
  
  // XL
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  
  // Colored shadows
  primary: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const ANIMATIONS = {
  // Duration
  duration: {
    fast: 150,
    normal: 250,
    slow: 350,
    verySlow: 500,
  },
  
  // Spring
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  
  // Easing
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'spring',
  },
};

export const LAYOUT = {
  // Screen padding
  screenPadding: SPACING.lg,
  
  // Card padding
  cardPadding: SPACING.lg,
  
  // Header height
  headerHeight: 60,
  
  // Bottom tab height
  tabBarHeight: 60,
  
  // Max content width
  maxContentWidth: 400,
};

export const COMPONENTS = {
  // Button heights
  buttonHeight: {
    small: 32,
    medium: 44,
    large: 56,
  },
  
  // Input heights
  inputHeight: {
    small: 36,
    medium: 44,
    large: 52,
  },
  
  // Avatar sizes
  avatarSize: {
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 96,
  },
  
  // Icon sizes
  iconSize: {
    small: 16,
    medium: 24,
    large: 32,
    xlarge: 48,
  },
};

export const createGradient = (colors) => ({
  colors: colors,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  ANIMATIONS,
  LAYOUT,
  COMPONENTS,
  createGradient,
};
