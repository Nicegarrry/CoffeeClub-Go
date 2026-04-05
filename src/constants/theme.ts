export const Colors = {
  light: {
    bg: '#FAF6EE',
    bgCard: '#FFFFFF',
    bgCard2: '#F7F1E6',
    border: 'rgba(180,118,46,0.13)',
    accent: '#B8762E',
    accentSoft: 'rgba(184,118,46,0.09)',
    text: '#2C1A08',
    textSub: '#7A5A38',
    textFaint: '#C4AE96',
    glass: 'rgba(250,246,238,0.92)',
    tabBg: 'rgba(250,246,238,0.92)',
    machBg: '#EBF3FB',
    grindBg: '#FBF0ED',
    storyRing: ['#E0963A', '#F4D060'] as [string, string],
    storyRingSeen: 'rgba(0,0,0,0.12)',
    shadow: 'rgba(100,60,20,0.10)',
  },
  dark: {
    bg: '#0F1923',
    bgCard: '#192535',
    bgCard2: '#1E2E42',
    border: 'rgba(212,160,80,0.14)',
    accent: '#D4A050',
    accentSoft: 'rgba(212,160,80,0.11)',
    text: '#F2EBDD',
    textSub: '#8A9BB0',
    textFaint: '#3E5068',
    glass: 'rgba(15,25,35,0.90)',
    tabBg: 'rgba(15,25,35,0.90)',
    machBg: '#172840',
    grindBg: '#1E2032',
    storyRing: ['#D4A050', '#F0D070'] as [string, string],
    storyRingSeen: 'rgba(255,255,255,0.14)',
    shadow: 'rgba(0,0,0,0.35)',
  },
} as const;

export type ThemeColors = typeof Colors.light | typeof Colors.dark;

export const Radius = {
  card: 20,
  pill: 10,
  avatar: 999,
} as const;

export const Fonts = {
  display: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_400Regular_Italic',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemiBold: 'DMSans_600SemiBold',
} as const;
