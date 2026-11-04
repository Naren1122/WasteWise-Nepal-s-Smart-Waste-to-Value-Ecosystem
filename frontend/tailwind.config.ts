import type { Config } from 'tailwindcss';

const config: Config = {
    darkMode: ['class'],
    content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Segoe UI',
  				'Tahoma',
  				'Geneva',
  				'Verdana',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			caption: [
  				'0.8125rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'0.9375rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			md: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			h3: [
  				'1.125rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			h2: [
  				'1.375rem',
  				{
  					lineHeight: '1.875rem'
  				}
  			],
  			h1: [
  				'1.75rem',
  				{
  					lineHeight: '2.125rem'
  				}
  			],
  			display: [
  				'2.25rem',
  				{
  					lineHeight: '2.5rem'
  				}
  			]
  		},
  		colors: {
  			brand: {
  				'50': '#f0fdf4',
  				'100': '#dcfce7',
  				'500': '#22c55e',
  				'600': '#16a34a',
  				'700': '#15803d',
  				'800': '#166534',
  				'900': '#14532d'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
};

export default config;

