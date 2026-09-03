import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt([
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 3 },
        multiline: { max: 1 },
      }],
      'vue/html-closing-bracket-newline': ['error', {
        singleline: 'never',
        multiline: 'always',
      }],
      'vue/first-attribute-linebreak': ['error', {
        singleline: 'ignore',
        multiline: 'below',
      }],
      'vue/html-indent': ['error', 2],
      indent: ['error', 2],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      indent: 'off',
      'vue/script-indent': ['error', 2, { baseIndent: 0 }],
    },
  },
])
