const paper = '#F7F3EF';
const surface = '#FFFFFF';
const ink = '#17110E';
const inkSecondary = '#6E6459';
const amber = '#E4572E';
const amberDark = '#CE3B11';
const steelBlue = '#33526B';
const steelSoft = '#E7EEF2';
const success = '#3F7A5B';
const border = '#E3DAD1';

export const colors = {
  paper,
  surface,
  ink,
  inkSecondary,
  amber,
  amberDark,
  steelBlue,
  steelSoft,
  success,
  border,

  amberSurface: '#F4DED7',
  amberBorder: '#EBB3A2',
  successSurface: '#E1EFE7',
  danger: '#C1473C',
  dangerSurface: '#F8E7E3',
  borderStrong: '#D1C2B1',
  textTertiary: '#9A9086',
  placeholder: '#9A9086',
  white: '#FFFFFF',

  uploadBorder: '#C3B6A7',
  uploadBackground: '#EDE9E3',

  primary: amber,
  primaryDark: amberDark,
  primarySurface: '#F4DED7',
  primaryBorder: '#EBB3A2',
  navy: ink,
  textPrimary: ink,
  textStrong: ink,
  textSecondary: inkSecondary,
  background: paper,
  warning: amber,
  warningSurface: '#F4DED7',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 12,
  base: 13,
  md: 14,
  lg: 15,
  xl: 16,
  xxl: 18,
  display: 22,
  hero: 32,
} as const;

export const fontFamily = {
  headingRegular: 'SpaceGrotesk_400Regular',
  headingMedium: 'SpaceGrotesk_500Medium',
  headingSemiBold: 'SpaceGrotesk_600SemiBold',
  headingBold: 'SpaceGrotesk_700Bold',
  bodyRegular: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
} as const;

export const shadow = {
  card: {
    shadowColor: colors.ink,
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  ticket: {
    shadowColor: colors.ink,
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const minTouchTarget = 44;
