import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'nuxt/nuxt-config-keys-order': 'off',
    'vue/no-multiple-template-root': 'off',
    'vue/html-self-closing': 'off',
  },
})
