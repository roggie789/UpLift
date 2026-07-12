export const colors = {
  // Clash Royale-inspired palette
  background: '#1B4DB1',
  backgroundDeep: '#123577',
  surface: '#2B63D9',
  card: '#3E74E8',
  outline: '#0E2A5C',
  gold: '#FFC93C',
  goldDeep: '#E0A800',
  success: '#3EDC81',
  danger: '#FF5A5A',
  rare: '#B980FF',
  text: '#FFFFFF',
  textMuted: '#BBD0F5',
  xp: '#FFC93C',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radii = {
  card: 20,
  button: 16,
  pill: 999,
} as const;

export const borders = {
  // Thick cartoon outlines
  width: 3,
} as const;

export const typography = {
  // Swap in Lilita One / Baloo 2 via expo-font later
  display: { fontSize: 32, fontWeight: '900' as const },
  heading: { fontSize: 22, fontWeight: '800' as const },
  body: { fontSize: 16, fontWeight: '500' as const },
  bigNumber: { fontSize: 40, fontWeight: '900' as const },
} as const;
