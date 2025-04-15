// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  nitro: {
    preset: 'cloudflare-pages',

    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  modules: [
    'nitro-cloudflare-dev',
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/google-fonts',
    '@nuxt/image',
    '@nuxt/icon',
  ],

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  // @nuxt/google-fonts
  googleFonts: {
    families: {
      Lato: {
        wght: [400],
        ital: [400],
      },
      Merriweather: [400, 500, 600, 700],
    },
  },

  // Use global.css
  css: ['./assets/css/global.css'],
})

