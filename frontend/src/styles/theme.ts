/**
 * LegalStack Design System
 * Comprehensive theme with colors, typography, spacing, and utilities
 */

export const theme = {
  // Color palette
  colors: {
    // Primary brand colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    
    // Semantic colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
    },
    
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
    },
    
    // Neutral colors
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
      950: '#030712',
    },
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    
    fontSize: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
      '6xl': '3.75rem',   // 60px
    },
    
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
    
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
      loose: '2',
    },
  },
  
  // Spacing scale
  spacing: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  // Border radius
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none',
  },
  
  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
}

// Reusable CSS class utilities
export const cn = {
  // Headings
  h1: 'text-4xl font-bold tracking-tight text-neutral-900',
  h2: 'text-3xl font-semibold tracking-tight text-neutral-900',
  h3: 'text-2xl font-semibold text-neutral-900',
  h4: 'text-xl font-semibold text-neutral-900',
  
  // Body text
  body: 'text-base text-neutral-700',
  small: 'text-sm text-neutral-600',
  tiny: 'text-xs text-neutral-500',
  
  // Buttons
  btn: {
    base: 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 active:scale-95',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 focus:ring-neutral-500',
    outline: 'border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus:ring-neutral-500',
    ghost: 'text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-500',
    danger: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
  
  // Inputs
  input: {
    base: 'block w-full rounded-lg border border-neutral-300 bg-white px-4 py-2 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-500 disabled:bg-neutral-50 disabled:cursor-not-allowed',
    error: 'border-error-500 focus:border-error-500 focus:ring-error-500',
    success: 'border-success-500 focus:border-success-500 focus:ring-success-500',
  },
  
  // Cards
  card: {
    base: 'bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden',
    hover: 'bg-white rounded-xl shadow-md border border-neutral-200 overflow-hidden transition-all duration-200 hover:shadow-xl hover:border-primary-300',
    header: 'px-6 py-4 border-b border-neutral-200',
    body: 'px-6 py-4',
    footer: 'px-6 py-4 border-t border-neutral-200 bg-neutral-50',
  },
  
  // Badges
  badge: {
    base: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-success-100 text-success-800',
    warning: 'bg-warning-100 text-warning-800',
    error: 'bg-error-100 text-error-800',
    neutral: 'bg-neutral-100 text-neutral-800',
  },
}

export default theme
