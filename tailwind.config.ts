import { readFileSync } from 'node:fs'
import type { Config } from 'tailwindcss'

const themeFiles = [
  'src/lib/design-system/theme.generated.css',
  'src/lib/design-system/theme.overrides.css',
]

const themeVariableNames = new Set(
  themeFiles.flatMap((file) =>
    Array.from(
      readFileSync(file, 'utf8').matchAll(/--([a-z0-9-]+)\s*:/g),
      (match) => match[1],
    ),
  ),
)

function mapThemeNamespace(namespace: string) {
  const prefix = `${namespace}-`

  return Object.fromEntries(
    Array.from(themeVariableNames)
      .filter(
        (variableName) =>
          variableName.startsWith(prefix) &&
          !variableName.endsWith('--line-height'),
      )
      .map((variableName) => [
        variableName.slice(prefix.length),
        `var(--${variableName})`,
      ]),
  )
}

const fontSize = Object.fromEntries(
  Array.from(themeVariableNames)
    .filter(
      (variableName) =>
        variableName.startsWith('text-') &&
        !variableName.endsWith('--line-height'),
    )
    .map((variableName) => {
      const key = variableName.slice('text-'.length)
      const lineHeightVariable = `${variableName}--line-height`
      const value = `var(--${variableName})`

      return [
        key,
        themeVariableNames.has(lineHeightVariable)
          ? [value, { lineHeight: `var(--${lineHeightVariable})` }]
          : value,
      ]
    }),
)

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      backgroundImage: mapThemeNamespace('background-image'),
      borderRadius: mapThemeNamespace('radius'),
      borderWidth: mapThemeNamespace('border-width'),
      boxShadow: mapThemeNamespace('shadow'),
      colors: mapThemeNamespace('color'),
      fontFamily: mapThemeNamespace('font'),
      fontSize,
      fontWeight: mapThemeNamespace('font-weight'),
      letterSpacing: mapThemeNamespace('tracking'),
      lineHeight: mapThemeNamespace('leading'),
      ringWidth: mapThemeNamespace('ring-width'),
      spacing: mapThemeNamespace('spacing'),
    },
  },
  plugins: [],
} satisfies Config
