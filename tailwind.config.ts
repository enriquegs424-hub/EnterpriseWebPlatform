import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f8f9f4',
          100: '#f0f2e6',
          200: '#dde1c7',
          300: '#c4cba0',
          400: '#a3ad71',
          500: '#7c8f3b',
          600: '#6b7d32',
          700: '#596a2a',
          800: '#4a5724',
          900: '#3d4a1e',
        },
        neutral: {
          50: '#ffffff',
          100: '#f9fafb',
          200: '#f3f4f6',
          300: '#e5e7eb',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
        success: {
          50: '#f0f9f0',
          500: '#10b981',
          700: '#047857',
        },
        warning: {
          50: '#fefce8',
          500: '#f59e0b',
          700: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#dc2626',
        },
        info: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
export default config;
