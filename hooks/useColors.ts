import colors, { palettes } from '@/constants/colors';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Returns the design tokens for the currently selected app theme.
 *
 * The theme is chosen from the theme picker (default-light, deep-night,
 * sepia, cartoon, forest, lavender) and persisted across restarts.
 */
export function useColors() {
  const { choice } = useAppTheme();
  const palette = palettes[choice] ?? colors.light;
  return { ...palette, radius: colors.radius };
}
