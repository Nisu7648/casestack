// Professional Color Palette - Black & White Modes Only
export const colors = {
  // Black Mode (Default Professional)
  black: {
    background: '#000000',
    surface: '#0A0A0A',
    card: '#141414',
    border: '#1F1F1F',
    text: {
      primary: '#FFFFFF',
      secondary: '#A3A3A3',
      tertiary: '#737373',
    },
    accent: '#FFFFFF',
    hover: '#1A1A1A',
    active: '#262626',
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },

  // White Mode (Professional Clean)
  white: {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    card: '#FFFFFF',
    border: '#E5E5E5',
    text: {
      primary: '#000000',
      secondary: '#525252',
      tertiary: '#A3A3A3',
    },
    accent: '#000000',
    hover: '#F5F5F5',
    active: '#E5E5E5',
    success: '#16A34A',
    warning: '#D97706',
    error: '#DC2626',
    info: '#2563EB',
  },
};

// Professional Typography
export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
  },
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Professional Spacing
export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

// Professional Borders
export const borders = {
  radius: {
    none: '0',
    sm: '0.125rem',  // 2px
    md: '0.25rem',   // 4px
    lg: '0.5rem',    // 8px
  },
  width: {
    thin: '1px',
    medium: '2px',
    thick: '3px',
  },
};

// Professional Shadows (Minimal)
export const shadows = {
  black: {
    sm: '0 1px 2px 0 rgba(255, 255, 255, 0.05)',
    md: '0 4px 6px -1px rgba(255, 255, 255, 0.1)',
    lg: '0 10px 15px -3px rgba(255, 255, 255, 0.1)',
  },
  white: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  },
};

// Professional Transitions
export const transitions = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export default {
  colors,
  typography,
  spacing,
  borders,
  shadows,
  transitions,
};
