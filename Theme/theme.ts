const paper = '#FAF6EF';
const surface = '#FFFFFF';
const ink = '#22261F';
const inkSecondary = '#6B6459';
const amber = '#D97B2E';
const amberDark = '#B8611D';
const steelBlue = '#33526B';
const steelSoft = '#E7EEF2';
const success = '#3F7A5B';
const border = '#E7E0D2';

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

  amberSurface: '#F6E3CE',
  amberBorder: '#EBC89C',
  successSurface: '#E1EFE7',
  danger: '#C1473C',
  dangerSurface: '#F8E7E3',
  borderStrong: '#D6CBB0',
  textTertiary: '#A39C8C',
  placeholder: '#A39C8C',
  white: '#FFFFFF',

  uploadBorder: '#C9BFA6',
  uploadBackground: '#F2EDE1',

  primary: amber,
  primaryDark: amberDark,
  primarySurface: '#F6E3CE',
  primaryBorder: '#EBC89C',
  navy: ink,
  textPrimary: ink,
  textStrong: ink,
  textSecondary: inkSecondary,
  background: paper,
  warning: amber,
  warningSurface: '#F6E3CE',
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
