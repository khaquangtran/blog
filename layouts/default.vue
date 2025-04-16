<script setup lang="ts">
// import { ref } from 'vue'

const items = ref([
  { key: 'home', value: 'Home', url: '/' },
  { key: 'blog', value: 'Blog', url: '/blog' },
  { key: 'goal', value: 'Goals', url: '/goals' },
])

const socials = ref([
  { url: 'https://github.com/khaquangtran', name: 'uil:github' },
  { url: 'https://x.com/CheGuangKa', name: 'line-md:twitter-x' },
])

useSeoMeta({
  title: 'Kha Quang Trần',
  ogTitle: 'Kha Quang Trần',
  description: 'Welcome to my blog, I hope you could find my post useful',
  ogDescription: 'Welcome to my blog, I hope you could find my post useful',
  ogImage:
    'https://raw.githubusercontent.com/khaquangtran/blog/refs/heads/main/public/images/lady-of-la-vang_large.webp',
})
</script>

<template>
  <nav class="fixed w-full z-10">
    <div
      class="mx-auto max-w-2xl flex items-center justify-between bg-gray-100 px-2 py-2 md:px-0"
    >
      <ul class="flex flex-row items-center justify-center gap-3">
        <li v-for="item in items" :key="item.key">
          <NuxtLink
            :to="item.url"
            class="text-sm px-2 hover:underline hover:underline-offset-2"
          >
            <span>{{ item.value }}</span>
          </NuxtLink>
        </li>
      </ul>
      <ul class="flex flex-row items-center justify-center gap-3">
        <li v-for="social in socials" :key="social.name">
          <NuxtLink :to="social.url">
            <Icon :name="social.name" class="icon" size="1.2em" />
          </NuxtLink>
        </li>
      </ul>
    </div>
  </nav>
  <div class="min-h-dvh flex flex-col justify-between">
    <header>
      <div class="mx-auto max-w-2xl flex items-center flex-col justify-center">
        <div class="pt-20 pb-12">
          <h1 class="text-3xl font-bold text-center tracking-tighter">
            Kha Quang Trần
          </h1>
          <h2 class="text-center mt-1 tracking-tighter">
            <span class="bg-black text-orange-400 px-1">Novice</span> Software
            Engineer
          </h2>
        </div>
      </div>
    </header>
    <div class="mx-auto max-w-2xl flex-1">
      <slot />
    </div>
    <footer class="mt-10 pt-16 pb-36 border-t border-t-gray-200 bg-gray-200">
      <div class="mx-auto max-w-2xl px-2 sm:px-0">
        <div class="grid grid-cols-2">
          <div>
            <h2 class="tracking-tighter">
              <span class="bg-black text-orange-400 px-1">Novice</span> Software
              Engineer
            </h2>
            <p class="text-xs">© 2025 Kha Quang Tran</p>
          </div>
          <div>
            <div>
              <h1 class="font-bold">Social Networks</h1>
              <ul class="mt-1 flex flex-row items-center gap-3">
                <li v-for="social in socials" :key="social.name">
                  <NuxtLink :to="social.url">
                    <Icon :name="social.name" class="icon" size="1.2em" />
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
