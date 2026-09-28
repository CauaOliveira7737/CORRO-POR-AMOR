import { COLORS, SPACING, RADIUS, TYPOGRAPHY } from '@corro-por-amor/shared';

export const theme = {
  colors: {
    ...COLORS,
    background: '#F8FAFC',
    cardBackground: '#FFFFFF',
    cardDark: '#012A4A',
    cardDarkSurface: '#063A63',
    dockBackground: '#0B132B',
    dockActive: '#014F86',
    dockActiveGlow: 'rgba(1, 79, 134, 0.4)',
    accentCyan: '#0284C7',
    accentEnergy: '#FF5722',
    accentEnergyLight: '#FFF3EE',
    accentGreen: '#10B981',
    accentGreenLight: '#ECFDF5',
    subtleGray: '#F1F5F9',
    borderLight: '#EDF2F7',
    borderSubtle: '#E2E8F0',
    textDark: '#0B132B',
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
