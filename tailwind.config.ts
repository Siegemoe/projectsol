import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-1': 'var(--bg-elev-1)',
        'bg-2': 'var(--bg-elev-2)',
        text: 'var(--text)',
        'text-dim': 'var(--text-dim)',
        accent: 'var(--accent)',
        orange: 'var(--neon-orange)',
        cyan: 'var(--neon-cyan)',
        magenta: 'var(--neon-magenta)',
        purple: 'var(--neon-purple)',
      },
      boxShadow: {
        glow: 'var(--glow-soft)',
        'glow-strong': 'var(--glow-strong)',
        hairline: 'inset 0 0 0 1px rgba(255,255,255,0.03)',
      },
      borderRadius: {
        xxl: '1rem',
        '2xl': '1rem',
        xl: '14px',
      },
      backdropBlur: {
        xs: '2px',
      },
    }
  },
  plugins: []
};

export default config;
