/**
 * Axon Fire — Typography Scale
 * Uses Inter exclusively, with tight tracking for the editorial tactical feel.
 */

export const Typography = {
  displayLg: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  displayMd: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 36,
  },
  displaySm: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 30,
  },
  headlineLg: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  headlineMd: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.15,
    lineHeight: 26,
  },
  headlineSm: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  titleLg: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0,
    lineHeight: 24,
  },
  titleMd: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0,
    lineHeight: 22,
  },
  titleSm: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 20,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.15,
    lineHeight: 24,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.4,
    lineHeight: 16,
  },
  labelLg: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    lineHeight: 20,
    textTransform: 'uppercase',
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    lineHeight: 16,
    textTransform: 'uppercase',
  },
  labelSm: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    lineHeight: 14,
    textTransform: 'uppercase',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export default { Typography, Spacing, Radius };
