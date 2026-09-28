export const COLORS = {
  // Official Palette from Prompt:
  primaryDark: '#012A4A', // Very dark navy - titles and prominent elements
  navy: '#013A63',        // Dark blue
  deepBlue: '#01497C',    // Deep blue
  brandBlue: '#014F86',   // Main brand blue
  primary: '#2A6F97',     // Main buttons, active progress, indicators
  mediumBlue: '#2C7DA0',  // Secondary states, supporting highlights
  skyBlue: '#468FAF',     // Graphs, supporting badges
  softBlue: '#61A5C2',    // Informational backgrounds
  lightBlue: '#89C2D9',   // Light badges, subtle backgrounds

  // Neutrals & semantic
  white: '#FFFFFF',
  background: '#FFFFFF',
  surfaceLight: '#F8FAFC',
  surfaceBorder: '#E2E8F0',
  surfaceCard: '#FFFFFF',
  textPrimary: '#012A4A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textOnPrimary: '#FFFFFF',

  // Status & semantic colors
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  gold: '#D97706',
  silver: '#94A3B8',
  bronze: '#B45309',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    displaySmall: 32,
    displayLarge: 48,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
} as const;
