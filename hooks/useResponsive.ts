import { useWindowDimensions } from 'react-native';

// Baseline: iPhone 12/13/14 width (390). Scale factors are clamped so the
// design stays identical on regular phones and only adapts on very small
// phones (<360) and tablets (>=768).
const BASELINE_WIDTH = 390;

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const isTablet = width >= 768;
  const scale = Math.min(Math.max(width / BASELINE_WIDTH, 0.86), 1.18);

  // Responsive size: same value on regular phones, shrinks on small phones,
  // grows slightly on tablets.
  const rs = (size: number, opts?: { min?: number; max?: number }) => {
    const v = Math.round(size * scale);
    if (opts?.min !== undefined && v < opts.min) return opts.min;
    if (opts?.max !== undefined && v > opts.max) return opts.max;
    return v;
  };

  return { width, height, isSmallPhone, isTablet, scale, rs };
}
