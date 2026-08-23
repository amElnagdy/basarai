import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        // shadcn's `accent` = subtle hover surface, NOT the brand accent.
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',

        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        'surface-sunken': 'hsl(var(--surface-sunken))',
        'border-subtle': 'hsl(var(--border-subtle))',

        /**
         * Per-workspace brand accent. Raw vars — --brand is a hex from the
         * kit, do NOT wrap in hsl(). Accent only: never a large surface.
         */
        brand: {
          DEFAULT: 'var(--brand)',
          hover: 'var(--brand-hover)',
          active: 'var(--brand-active)',
          weak: 'var(--brand-weak)',
          weaker: 'var(--brand-weaker)',
          border: 'var(--brand-border)',
          ring: 'var(--brand-ring)',
          foreground: 'var(--on-brand)',
        },

        chart: {
          '1': 'hsl(var(--chart-1))', '2': 'hsl(var(--chart-2))', '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))', '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'Menlo', 'monospace'],
      },
      fontSize: {
        display: ['3.375rem', { lineHeight: '1.02', letterSpacing: '-0.015em' }],
        micro: ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.09em' }],
      },
      borderRadius: {
        lg: 'var(--radius)',                 // 12px — cards
        md: 'calc(var(--radius) - 2px)',     // 10px — controls
        sm: 'calc(var(--radius) - 4px)',     // 8px
        xl: 'calc(var(--radius) + 8px)',     // 20px — canvas stage
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 23, 42, 0.05)',
        sm: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        md: '0 4px 12px -2px rgba(15, 23, 42, 0.08), 0 2px 6px -3px rgba(15, 23, 42, 0.05)',
        lg: '0 12px 32px -8px rgba(15, 23, 42, 0.12), 0 4px 12px -6px rgba(15, 23, 42, 0.07)',
        art: '0 28px 64px -18px rgba(15, 23, 42, 0.24), 0 10px 22px -10px rgba(15, 23, 42, 0.13)',
      },
      transitionDuration: {
        fast: '150ms',
        slow: '400ms',
        reveal: '640ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.2, 0, 0, 1)',
        lift: 'cubic-bezier(0.34, 1.28, 0.64, 1)',
      },
      keyframes: {
        'basar-shimmer': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(100%)' } },
        'basar-reveal': {
          from: { opacity: '0', transform: 'scale(.985) translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
      },
      animation: {
        'basar-shimmer': 'basar-shimmer 1.35s cubic-bezier(0.65,0,0.35,1) infinite',
        'basar-reveal': 'basar-reveal 640ms cubic-bezier(0.34,1.28,0.64,1) both',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
