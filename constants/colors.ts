/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#2b1d26',
    tint: '#9a1c49',

    // Core surfaces
    background: '#fcfbfa',
    foreground: '#2b1d26',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#2b1d26',

    // Primary action color (buttons, links, active states)
    primary: '#9a1c49',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#f4edf1',
    secondaryForeground: '#6e2847',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#f1f0f3',
    mutedForeground: '#827983',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#f2d9e2',
    accentForeground: '#8e1743',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#e5e1e5',
    input: '#e5e1e5',

    // Brand-specific semantic tokens
    deepInk: '#102f43',
    wine: '#9a1c49',
    rose: '#d9a9bc',
    cream: '#fffaf6',
    success: '#e8f4ea',
    successText: '#3e8a55',
    sky: '#e6f3fa',
    skyText: '#4080a7',
    authorAction: '#7a4325',
    writerGreen: '#2f7055',
    monetizationAccent: '#ee5c10',
    monetizationSoft: '#fff3e8',
    monetizationButtonText: '#ffffff',
    incompleteSurface: '#fde3e3',
    supportGreen: '#18ca67',
    supportGreenText: '#13874f',
    supportButtonText: '#ffffff',
    supportBlue: '#5145d8',
    supportOrange: '#e45b20',
    socialBlue: '#1977e8',
    modalOverlay: 'rgba(22, 18, 20, 0.62)',
  },

  dark: {
    text: '#fbf7f8',
    tint: '#e7a2bc',
    background: '#171216',
    foreground: '#fbf7f8',
    card: '#241a21',
    cardForeground: '#fbf7f8',
    primary: '#d66d93',
    primaryForeground: '#24121a',
    secondary: '#382632',
    secondaryForeground: '#f1c8d8',
    muted: '#30262d',
    mutedForeground: '#bfaab4',
    accent: '#4a2638',
    accentForeground: '#f3b1ca',
    destructive: '#ef7373',
    destructiveForeground: '#24121a',
    border: '#46353f',
    input: '#46353f',
    deepInk: '#0d2638',
    wine: '#d66d93',
    rose: '#9e657d',
    cream: '#2a1c22',
    success: '#1d3b29',
    successText: '#9fdaad',
    sky: '#203b4b',
    skyText: '#9ac9e3',
    authorAction: '#a86b47',
    writerGreen: '#315b49',
    monetizationAccent: '#f07835',
    monetizationSoft: '#40291c',
    monetizationButtonText: '#ffffff',
    incompleteSurface: '#49272c',
    supportGreen: '#20b963',
    supportGreenText: '#80d7a6',
    supportButtonText: '#ffffff',
    supportBlue: '#a69bff',
    supportOrange: '#ff976d',
    socialBlue: '#78aef1',
    modalOverlay: 'rgba(0, 0, 0, 0.68)',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export type ThemeChoice = 'default-light' | 'deep-night' | 'sepia' | 'cartoon' | 'forest' | 'lavender';

export type Palette = typeof colors.light;

const deepNight: Palette = {
  ...colors.dark,
  text: '#eef2ff',
  tint: '#9db4ff',
  background: '#0e1420',
  foreground: '#eef2ff',
  card: '#182234',
  cardForeground: '#eef2ff',
  primary: '#6f8dff',
  primaryForeground: '#0e1420',
  secondary: '#1f2c47',
  secondaryForeground: '#c3d2f5',
  muted: '#1a2438',
  mutedForeground: '#8b9bb8',
  accent: '#2a3a5f',
  accentForeground: '#bcd0ff',
  destructive: '#f07878',
  destructiveForeground: '#1a0e0e',
  border: '#2b3a57',
  input: '#2b3a57',
  deepInk: '#0a0f1c',
  wine: '#6f8dff',
  rose: '#5a6f9e',
  cream: '#182234',
  modalOverlay: 'rgba(0, 0, 0, 0.7)',
};

const sepia: Palette = {
  ...colors.light,
  text: '#4a3b28',
  tint: '#8a5a2b',
  background: '#f4ecdd',
  foreground: '#4a3b28',
  card: '#faf5e9',
  cardForeground: '#4a3b28',
  primary: '#8a5a2b',
  primaryForeground: '#fffaf0',
  secondary: '#e9dcc3',
  secondaryForeground: '#6b4e2e',
  muted: '#ece2cc',
  mutedForeground: '#8a7660',
  accent: '#e0cda6',
  accentForeground: '#7a4f1f',
  destructive: '#c04545',
  destructiveForeground: '#ffffff',
  border: '#ddd0b4',
  input: '#ddd0b4',
  wine: '#8a5a2b',
  rose: '#c9a87c',
  cream: '#fffaf0',
  success: '#e2eeda',
  successText: '#4e7a45',
  sky: '#d9e8ef',
  skyText: '#3e6f8a',
  writerGreen: '#3d6b4f',
  monetizationAccent: '#d95f0e',
  monetizationSoft: '#f7e8d2',
  incompleteSurface: '#f3d5d5',
  supportGreenText: '#0f7a44',
  supportBlue: '#5a4fd0',
  supportOrange: '#d9531e',
  socialBlue: '#2f6fd0',
  modalOverlay: 'rgba(40, 30, 18, 0.6)',
};

const cartoon: Palette = {
  ...colors.light,
  text: '#3a2350',
  tint: '#e0447c',
  background: '#fff9f0',
  foreground: '#3a2350',
  card: '#ffffff',
  cardForeground: '#3a2350',
  primary: '#e0447c',
  primaryForeground: '#ffffff',
  secondary: '#ffe8f1',
  secondaryForeground: '#a12553',
  muted: '#f3eef7',
  mutedForeground: '#8d7fa3',
  accent: '#ffd9e7',
  accentForeground: '#c2265f',
  destructive: '#f43f5e',
  destructiveForeground: '#ffffff',
  border: '#ecd9e6',
  input: '#ecd9e6',
  wine: '#e0447c',
  rose: '#f5a8c4',
  success: '#dcf5e3',
  successText: '#2c8a4e',
  sky: '#d9eefb',
  skyText: '#2f7ab5',
  authorAction: '#b05a2a',
  writerGreen: '#2f9e6e',
  monetizationAccent: '#ff7a1a',
  monetizationSoft: '#ffeddc',
  incompleteSurface: '#ffdada',
  supportBlue: '#6d5ef0',
  supportOrange: '#fb6f1e',
  socialBlue: '#2f86f0',
  modalOverlay: 'rgba(40, 20, 40, 0.6)',
};

const forest: Palette = {
  ...colors.light,
  text: '#1f3327',
  tint: '#2f7d4f',
  background: '#f0f6f0',
  foreground: '#1f3327',
  card: '#ffffff',
  cardForeground: '#1f3327',
  primary: '#2f7d4f',
  primaryForeground: '#ffffff',
  secondary: '#ddeede',
  secondaryForeground: '#275e3d',
  muted: '#e8efe8',
  mutedForeground: '#6f8577',
  accent: '#c4e2c9',
  accentForeground: '#256b41',
  destructive: '#d9534f',
  destructiveForeground: '#ffffff',
  border: '#d4e2d4',
  input: '#d4e2d4',
  wine: '#2f7d4f',
  rose: '#9cc3a5',
  cream: '#fafdf6',
  success: '#d8efdc',
  successText: '#2e7d43',
  sky: '#d7e9f2',
  skyText: '#35708f',
  authorAction: '#8a5a2b',
  writerGreen: '#256b41',
  monetizationAccent: '#e06a10',
  monetizationSoft: '#f6e8d4',
  incompleteSurface: '#f2d2d2',
  supportGreenText: '#15803d',
  supportBlue: '#5b5bd6',
  supportOrange: '#ea5f1c',
  socialBlue: '#2b7cd3',
  modalOverlay: 'rgba(20, 35, 25, 0.62)',
};

const lavender: Palette = {
  ...colors.light,
  text: '#352a4e',
  tint: '#7c5cbf',
  background: '#f5f2fb',
  foreground: '#352a4e',
  card: '#ffffff',
  cardForeground: '#352a4e',
  primary: '#7c5cbf',
  primaryForeground: '#ffffff',
  secondary: '#e7e0f5',
  secondaryForeground: '#5a4390',
  muted: '#ede9f5',
  mutedForeground: '#84789e',
  accent: '#d7c9f2',
  accentForeground: '#6847b8',
  destructive: '#e05260',
  destructiveForeground: '#ffffff',
  border: '#ddd3ec',
  input: '#ddd3ec',
  wine: '#7c5cbf',
  rose: '#b89fdd',
  cream: '#fbf9ff',
  success: '#ddf0e0',
  successText: '#35854c',
  sky: '#dbe9f7',
  skyText: '#3d7ca8',
  authorAction: '#96602f',
  writerGreen: '#3a7d5c',
  monetizationAccent: '#ef6c12',
  monetizationSoft: '#f9e7d4',
  incompleteSurface: '#f4d2d8',
  supportBlue: '#6a63f0',
  supportOrange: '#ef7d22',
  socialBlue: '#3f8ae0',
  modalOverlay: 'rgba(35, 25, 55, 0.62)',
};

export const palettes: Record<ThemeChoice, Palette> = {
  'default-light': colors.light,
  'deep-night': deepNight,
  sepia,
  cartoon,
  forest,
  lavender,
};

export default colors;
