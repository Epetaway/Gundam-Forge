export const motion = {
  duration: {
    instant: '80ms',
    fast: '140ms',
    normal: '220ms',
    slow: '320ms',
  },
  easing: {
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;
