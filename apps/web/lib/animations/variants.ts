/**
 * Animation Utilities and Variants
 * Reusable animation definitions for the game UI
 */

import { Variants } from 'framer-motion';

// Attack animation: Unit slides toward opponent
export const attackAnimation: Variants = {
  initial: { x: 0, opacity: 1 },
  attack: {
    x: 150,
    opacity: 0.5,
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
  rest: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// Damage float: Numbers float up and fade
export const damageFloatAnimation: Variants = {
  initial: { y: 0, opacity: 1 },
  animate: {
    y: -50,
    opacity: 0,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
};

// Shield break: Scale down and fade
export const shieldBreakAnimation: Variants = {
  initial: { scale: 1, opacity: 1 },
  break: {
    scale: 0,
    opacity: 0,
    transition: { duration: 0.5, ease: 'backIn' },
  },
};

// Unit destruction: Fade out and scale
export const unitDestructionAnimation: Variants = {
  initial: { scale: 1, opacity: 1 },
  destroy: {
    scale: 0.5,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
    },
  },
};

// Phase transition: Fade in/out
export const phaseTransitionAnimation: Variants = {
  initial: { opacity: 0 },
  enter: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Card appearance: Slide in from bottom
export const cardAppearAnimation: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: (index: number) => ({
    y: 0,
    opacity: 1,
    transition: {
      delay: index * 0.05,
      duration: 0.3,
    },
  }),
};

// Pulse effect: Scale slightly
export const pulseAnimation: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
};

// Glow effect: Opacity pulse for highlights
export const glowAnimation: Variants = {
  animate: {
    boxShadow: [
      '0 0 0 0 rgba(168, 85, 247, 0.4)',
      '0 0 0 10px rgba(168, 85, 247, 0)',
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
};

// Bounce effect: For buttons or highlights
export const bounceAnimation: Variants = {
  animate: {
    y: [0, -5, 0],
    transition: {
      duration: 0.4,
      repeat: Infinity,
      repeatType: 'loop',
    },
  },
};

// Slide in left: For menus/modals
export const slideInLeftAnimation: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    x: -100,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Slide in right: For modals
export const slideInRightAnimation: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    x: 100,
    opacity: 0,
    transition: { duration: 0.2 },
  },
};

// Scale bounce: Entrance effect
export const scaleBounceAnimation: Variants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 20,
    },
  },
};

// Shake effect: For errors or warnings
export const shakeAnimation: Variants = {
  animate: {
    x: [-5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
    },
  },
};
