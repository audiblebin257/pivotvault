import { useTheme } from '../context/ThemeContext';

export const useDesignSystem = () => {
  const { theme } = useTheme();

  const isBeige = theme === 'beige' || theme === 'apple';
  const isBlue = theme === 'blue' || theme === 'cursor';

  const colors = {
    // Primary
    primary: 'bg-accent text-accent-contrast',
    primaryText: 'text-text-primary',
    // Surface
    canvas: 'bg-bg',
    surface: 'bg-surface',
    surface2: 'bg-surface-2',
    // Text
    text: 'text-text-primary',
    textSecondary: 'text-text-secondary',
    // Border
    border: 'border-border',
    // Timeline colors
    timelineThinking: 'bg-surface-3 text-text-muted',
    timelineGrep: 'bg-surface-3 text-text-muted',
    timelineRead: 'bg-surface-3 text-text-muted',
    timelineEdit: 'bg-surface-3 text-text-muted',
    timelineDone: 'bg-accent text-accent-contrast',
  };

  const typography = {
    // Headings
    heroDisplay: isBeige ? 'font-apple-display text-apple-hero-display' : 'font-cursor-display text-cursor-display-mega',
    displayLg: isBeige ? 'font-apple-display text-apple-display-lg' : 'font-cursor-display text-cursor-display-lg',
    displayMd: isBeige ? 'font-apple-display text-apple-display-md' : 'font-cursor-display text-cursor-display-md',
    displaySm: isBeige ? 'font-apple-display text-apple-lead' : 'font-cursor-display text-cursor-display-sm',
    // Body
    body: isBeige ? 'font-apple-body text-apple-body' : 'font-cursor-body text-cursor-body-md',
    bodyStrong: isBeige ? 'font-apple-body text-apple-body-strong' : 'font-cursor-body text-cursor-body-strong',
    caption: isBeige ? 'font-apple-body text-apple-caption' : 'font-cursor-body text-cursor-caption',
    // Buttons
    button: isBeige ? 'font-apple-body text-apple-body' : 'font-cursor-body text-cursor-button',
    buttonUtility: isBeige ? 'font-apple-body text-apple-button-utility' : 'font-cursor-body text-cursor-button',
  };

  const radius = {
    pill: isBeige ? 'rounded-apple-pill' : 'rounded-cursor-pill',
    button: isBeige ? 'rounded-apple-pill' : 'rounded-cursor-md',
    card: isBeige ? 'rounded-apple-lg' : 'rounded-cursor-lg',
    none: isBeige ? 'rounded-apple-none' : 'rounded-none',
  };

  const spacing = {
    section: isBeige ? 'py-apple-section' : 'py-cursor-section',
    lg: isBeige ? 'p-apple-lg' : 'p-cursor-lg',
  };

  return {
    isApple: isBeige, // Backward compatibility
    isBeige,
    isCursor: isBlue, // Backward compatibility
    isBlue,
    colors,
    typography,
    radius,
    spacing,
  };
};
