import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '@corro-por-amor/shared';

export const theme = {
  colors: {
    ...COLORS,
    // Official Coolors "Corro por Amor" 10-shade palette
    palette: {
      blue1: '#012A4A', // Deepest Navy
      blue2: '#013A63', // Deep Ocean
      blue3: '#01497C', // Dark Sapphire
      blue4: '#014F86', // Classic Brand Blue
      blue5: '#2A6F97', // Vibrant Cerulean
      blue6: '#2C7DA0', // Steel Blue
      blue7: '#468FAF', // Muted Teal Blue
      blue8: '#61A5C2', // Soft Sky
      blue9: '#89C2D9', // Ice Sky
      blue10: '#A9D6E5', // Lightest Aqua Ice
    },
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    cardDark: '#012A4A',
    cardDarkSurface: '#013A63',
    dockBackground: '#012A4A',
    dockActive: '#014F86',
    dockActiveGlow: 'rgba(1, 79, 134, 0.4)',
    accentCyan: '#2C7DA0',
    accentEnergy: '#FF5722',
    accentEnergyLight: '#FFF3EE',
    accentGreen: '#10B981',
    accentGreenLight: '#ECFDF5',
    subtleGray: '#F1F5F9',
    borderLight: '#EDF2F7',
    borderSubtle: '#E2E8F0',
    textDark: '#012A4A',
    textMutedSoft: '#94A3B8',
  },
  spacing: SPACING,
  radius: {
    ...RADIUS,
    xl: 22,
    xxl: 28,
  },
  typography: TYPOGRAPHY,
  shadows: {
    card: {
      shadowColor: '#0B132B',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
    },
    floating: {
      shadowColor: '#012A4A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};

export type Theme = typeof theme;
