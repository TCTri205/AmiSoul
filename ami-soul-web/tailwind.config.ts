import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'var(--background)',
  			foreground: 'var(--foreground)',
  			card: {
  				DEFAULT: 'var(--card)',
  				foreground: 'var(--card-foreground)'
  			},
  			popover: {
  				DEFAULT: 'var(--popover)',
  				foreground: 'var(--popover-foreground)'
  			},
  			primary: {
  				DEFAULT: 'var(--primary)',
  				foreground: 'var(--primary-foreground)'
  			},
  			secondary: {
  				DEFAULT: 'var(--secondary)',
  				foreground: 'var(--secondary-foreground)'
  			},
  			muted: {
  				DEFAULT: 'var(--muted)',
  				foreground: 'var(--muted-foreground)'
  			},
  			accent: {
  				DEFAULT: 'var(--accent)',
  				foreground: 'var(--accent-foreground)'
  			},
  			destructive: {
  				DEFAULT: 'var(--destructive)',
  				foreground: 'var(--destructive-foreground)'
  			},
  			border: 'var(--border)',
  			input: 'var(--input)',
  			ring: 'var(--ring)',
  			chart: {
  				'1': 'var(--chart-1)',
  				'2': 'var(--chart-2)',
  				'3': 'var(--chart-3)',
  				'4': 'var(--chart-4)',
  				'5': 'var(--chart-5)'
  			},
        // Custom Pastel Palette using HSL variables
        'pastel-pink': 'hsl(var(--pastel-pink))',
        'pastel-lavender': 'hsl(var(--pastel-lavender))',
        'pastel-peach': 'hsl(var(--pastel-peach))',
        'pastel-blue': 'hsl(var(--pastel-blue))',
        'pastel-slate': 'hsl(var(--pastel-slate))',
        'pastel-cream': 'hsl(var(--pastel-cream))',
        'pastel-violet': 'hsl(var(--pastel-violet))',
        'dusty-blue': 'hsl(var(--dusty-blue))',
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      backgroundImage: {
        'vibe-positive': 'linear-gradient(to right, hsl(var(--pastel-pink)), hsl(var(--pastel-lavender)), hsl(var(--pastel-peach)))',
        'vibe-neutral': 'linear-gradient(to right, hsl(var(--pastel-blue)), hsl(var(--pastel-cream)), hsl(var(--pastel-lavender)))',
        'vibe-stressed': 'linear-gradient(to right, hsl(var(--pastel-violet)), hsl(var(--pastel-slate)), hsl(var(--dusty-blue)))',
        'vibe-crisis': 'linear-gradient(to right, hsl(var(--pastel-blue)), hsl(var(--pastel-slate)))',
        'vibe-offline': 'linear-gradient(to right, hsl(var(--pastel-slate)), hsl(var(--pastel-lavender)))',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(2%, 2%) scale(1.05)' },
        }
      },
      animation: {
        drift: 'drift 20s ease-in-out infinite',
      }
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};
export default config;
