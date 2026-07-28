import postcss from 'postcss'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

const tailwindThemeCompat = {
  postcssPlugin: 'tailwind-theme-compat',
  AtRule: {
    theme(atRule) {
      atRule.replaceWith(
        postcss.rule({
          selector: ':root',
          nodes: atRule.nodes,
        }),
      )
    },
  },
}

export default {
  plugins: [tailwindThemeCompat, tailwindcss, autoprefixer],
}
