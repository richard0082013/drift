/**
 * Drift Mobile Design Tokens
 *
 * Matches the web app's warm palette (coral/cream/amber/rose/sage).
 * Source of truth: web `src/app/globals.css` @theme block.
 */

export const colors = {
  cream: {
    50: "#FFFBF5",
    100: "#FFF5E9",
    200: "#FFECD4",
  },
  coral: {
    50: "#FFF1EC",
    100: "#FFD9CE",
    200: "#FFB8A6",
    300: "#F9997E",
    400: "#F08C6A",
    500: "#E87350",
    600: "#D45D3A",
    700: "#B84A2D",
  },
  amber: {
    50: "#FFF8EB",
    100: "#FFECC5",
    200: "#FFD98A",
    300: "#F5C050",
    400: "#F5B041",
    500: "#E8A020",
    600: "#C4850A",
  },
  rose: {
    50: "#FFF1F1",
    100: "#FFDADA",
    200: "#FFB5B5",
    300: "#F08080",
    400: "#E86060",
    500: "#E05050",
    600: "#C43A3A",
  },
  sage: {
    50: "#F0F7F0",
    100: "#D4EBD4",
    200: "#B0D8B0",
    300: "#8AC08A",
    400: "#7AB47A",
    500: "#6A9A6A",
    600: "#558055",
  },
  slate: {
    50: "#F8F8FA",
    100: "#EBEBF0",
    200: "#D0D0DA",
    300: "#B0B0BE",
    400: "#8A8A9A",
    500: "#6A6A7A",
    600: "#4A4A5A",
    700: "#34344A",
    800: "#22223A",
    900: "#14142A",
  },
  white: "#FFFFFF",
  black: "#000000",
} as const;

export const fonts = {
  heading: "Lora",
  body: "Raleway",
} as const;

export const fontWeights = {
  light: "300" as const,
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const radii = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  full: 9999,
} as const;

export const shadows = {
  card: {
    shadowColor: "#4A4A5A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHover: {
    shadowColor: "#4A4A5A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: "#E87350",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
} as const;

/** Minimum touch target size per Apple/Google HIG and PRD §4 rule 3 */
export const TOUCH_TARGET_MIN = 44;
