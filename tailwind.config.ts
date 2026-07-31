import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Identidade visual PNAB Irecê — Bandeira de Irecê (verde + dourado).
        // Cada stop lê de uma CSS custom property com a paleta atual como
        // fallback — permite escopos locais (ex.: .tema-secult) sobrescreverem
        // a paleta só numa área da página sem duplicar o design system nem
        // afetar Button/Badge/Card em outras rotas.
        //
        // Os valores são canais RGB (não hex) porque só assim o Tailwind
        // consegue aplicar `<alpha-value>`: com hex dentro da var, sufixos de
        // opacidade como `bg-brand-50/40` são silenciosamente descartados e a
        // cor cai para a herdada.
        brand: {
          50:  'rgb(var(--brand-50, 236 253 245) / <alpha-value>)',
          100: 'rgb(var(--brand-100, 209 250 229) / <alpha-value>)',
          200: 'rgb(var(--brand-200, 167 243 208) / <alpha-value>)',
          300: 'rgb(var(--brand-300, 110 231 183) / <alpha-value>)',
          400: 'rgb(var(--brand-400, 52 211 153) / <alpha-value>)',
          500: 'rgb(var(--brand-500, 16 185 129) / <alpha-value>)',
          600: 'rgb(var(--brand-600, 5 150 105) / <alpha-value>)',
          700: 'rgb(var(--brand-700, 4 120 87) / <alpha-value>)',
          800: 'rgb(var(--brand-800, 6 95 70) / <alpha-value>)',
          900: 'rgb(var(--brand-900, 6 78 59) / <alpha-value>)',
          950: 'rgb(var(--brand-950, 2 44 34) / <alpha-value>)',
        },
        // Dourado/âmbar (accent — amarelo da bandeira, tom sofisticado)
        accent: {
          50:  'rgb(var(--accent-50, 255 251 235) / <alpha-value>)',
          100: 'rgb(var(--accent-100, 254 243 199) / <alpha-value>)',
          200: 'rgb(var(--accent-200, 253 230 138) / <alpha-value>)',
          300: 'rgb(var(--accent-300, 252 211 77) / <alpha-value>)',
          400: 'rgb(var(--accent-400, 251 191 36) / <alpha-value>)',
          500: 'rgb(var(--accent-500, 245 158 11) / <alpha-value>)',
          600: 'rgb(var(--accent-600, 217 119 6) / <alpha-value>)',
          700: 'rgb(var(--accent-700, 180 83 9) / <alpha-value>)',
          800: 'rgb(var(--accent-800, 146 64 14) / <alpha-value>)',
          900: 'rgb(var(--accent-900, 120 53 15) / <alpha-value>)',
          950: 'rgb(var(--accent-950, 69 26 3) / <alpha-value>)',
        },
        // Identidade visual SECULT 2025 — tokens aditivos (não substituem
        // brand/accent), usados hoje só na home dentro de .tema-secult.
        oliva: {
          50: '#bad87b', 100: '#b5d570', 200: '#a9cf5b', 300: '#9ac63d', 400: '#7da230',
          500: '#688728', 600: '#587221', 700: '#475c1b', 800: '#364615', 900: '#26310e', 950: '#171e09',
        },
        ameixa: {
          50: '#e3dde3', 100: '#dbd2da', 200: '#cbbec9', 300: '#b4a2b2', 400: '#977e94',
          500: '#80677d', 600: '#6b5669', 700: '#574655', 800: '#433641', 900: '#2e252d', 950: '#1c171b',
        },
        agua: {
          50: '#75eaf0', 100: '#68e8ef', 200: '#4de4ec', 300: '#29dfe8', 400: '#16bfc7',
          500: '#129fa6', 600: '#0f868b', 700: '#0c6c71', 800: '#095356', 900: '#06393c', 950: '#042325',
        },
        tinta: {
          50: '#ce7f4a', 100: '#cc7841', 200: '#c26d34', 300: '#a95f2d', 400: '#894d25',
          500: '#72401f', 600: '#60361a', 700: '#4d2b15', 800: '#3b2110', 900: '#29170b', 950: '#190e07',
        },
        // Cores institucionais restantes da SECULT 2025. Cada uma carrega um
        // conceito atribuído pela identidade, então são usadas por significado
        // e não por decoração: oliva = esperança e agricultura, turquesa =
        // conhecimento e acolhimento, ameixa = criatividade e diversidade.
        oliva: {
          50: '#f2f4ea', 100: '#e2e7d0', 200: '#c6d1a3', 300: '#a3b673', 400: '#7f9a49',
          500: '#647c31', 600: '#556a26', 700: '#475c1b', 800: '#374716', 900: '#293511', 950: '#161d09',
        },
        turquesa: {
          50: '#eafafb', 100: '#c9f1f3', 200: '#93e3e8', 300: '#57ced6', 400: '#26b3bd',
          500: '#129fa6', 600: '#0d7f86', 700: '#0e666c', 800: '#115257', 900: '#12454a', 950: '#052c30',
        },
        ameixa: {
          50: '#f6f3f6', 100: '#eae4ea', 200: '#d6cbd6', 300: '#b8a8b8', 400: '#948094',
          500: '#786578', 600: '#635163', 700: '#574655', 800: '#483b47', 900: '#3d343d', 950: '#241e24',
        },
        papel: {
          50: '#f0e9d7', 100: '#ebe2c9', 200: '#e1d3ae', 300: '#d3bf88', 400: '#c1a558',
          500: '#ab8f3f', 600: '#907835', 700: '#74612b', 800: '#594a21', 900: '#3e3317', 950: '#261f0e',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // Tipografia SECULT 2025, usada dentro de .tema-secult.
        display: ['var(--font-display)', 'Impact', 'sans-serif'],
        questrial: ['var(--font-questrial)', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.3s cubic-bezier(0.87, 0, 0.13, 1)',
        'accordion-up': 'accordion-up 0.3s cubic-bezier(0.87, 0, 0.13, 1)',
      },
    },
  },
  plugins: [],
}

export default config
