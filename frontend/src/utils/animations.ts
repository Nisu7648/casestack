/**
 * Animation utilities and variants for consistent animations
 * Can be used with Framer Motion or CSS animations
 */

// ============================================
// FRAMER MOTION VARIANTS
// ============================================

/**
 * Fade in animation
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

/**
 * Slide in from bottom
 */
export const slideInFromBottom = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
}

/**
 * Slide in from top
 */
export const slideInFromTop = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

/**
 * Slide in from left
 */
export const slideInFromLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

/**
 * Slide in from right
 */
export const slideInFromRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
}

/**
 * Scale in (zoom)
 */
export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
}

/**
 * Stagger children animation
 */
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

/**
 * Stagger item animation
 */
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

/**
 * Page transition
 */
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
}

/**
 * Modal backdrop animation
 */
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

/**
 * Modal content animation
 */
export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: 20,
    transition: {
      duration: 0.2,
    },
  },
}

/**
 * Dropdown animation
 */
export const dropdown = {
  initial: { opacity: 0, scale: 0.95, y: -10 },
  animate: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      duration: 0.15,
      ease: 'easeOut',
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.95, 
    y: -10,
    transition: {
      duration: 0.1,
      ease: 'easeIn',
    },
  },
}

/**
 * Toast notification animation
 */
export const toast = {
  initial: { opacity: 0, x: 100 },
  animate: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
  exit: { 
    opacity: 0, 
    x: 100,
    transition: {
      duration: 0.2,
    },
  },
}

// ============================================
// TRANSITION CONFIGS
// ============================================

export const transitions = {
  fast: {
    duration: 0.15,
    ease: 'easeOut',
  },
  base: {
    duration: 0.2,
    ease: 'easeOut',
  },
  slow: {
    duration: 0.3,
    ease: 'easeOut',
  },
  spring: {
    type: 'spring',
    damping: 25,
    stiffness: 300,
  },
  bounce: {
    type: 'spring',
    damping: 15,
    stiffness: 400,
  },
}

// ============================================
// CSS ANIMATION CLASSES
// ============================================

/**
 * CSS animation class names for Tailwind
 */
export const cssAnimations = {
  // Fade
  fadeIn: 'animate-in fade-in duration-200',
  fadeOut: 'animate-out fade-out duration-200',
  
  // Slide
  slideInFromBottom: 'animate-in slide-in-from-bottom-4 duration-200',
  slideInFromTop: 'animate-in slide-in-from-top-4 duration-200',
  slideInFromLeft: 'animate-in slide-in-from-left-4 duration-200',
  slideInFromRight: 'animate-in slide-in-from-right-4 duration-200',
  
  // Zoom
  zoomIn: 'animate-in zoom-in-95 duration-200',
  zoomOut: 'animate-out zoom-out-95 duration-200',
  
  // Spin
  spin: 'animate-spin',
  
  // Pulse
  pulse: 'animate-pulse',
  
  // Bounce
  bounce: 'animate-bounce',
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Combine multiple animation classes
 */
export function combineAnimations(...animations: string[]): string {
  return animations.join(' ')
}

/**
 * Get animation delay class
 */
export function getAnimationDelay(index: number, baseDelay = 50): string {
  return `delay-[${index * baseDelay}ms]`
}

/**
 * Stagger animation helper
 */
export function getStaggerDelay(index: number): React.CSSProperties {
  return {
    animationDelay: `${index * 50}ms`,
  }
}

export default {
  // Variants
  fadeIn,
  slideInFromBottom,
  slideInFromTop,
  slideInFromLeft,
  slideInFromRight,
  scaleIn,
  staggerContainer,
  staggerItem,
  pageTransition,
  modalBackdrop,
  modalContent,
  dropdown,
  toast,
  
  // Transitions
  transitions,
  
  // CSS
  cssAnimations,
  
  // Helpers
  combineAnimations,
  getAnimationDelay,
  getStaggerDelay,
}
