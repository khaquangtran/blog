<script setup lang="ts">
import { ref } from 'vue'

const items = ref([
  { key: 'home', value: 'Home', url: '/' },
  { key: 'about', value: 'About', url: '/about' },
  { key: 'works', value: 'Works', url: '/works' },
  { key: 'projects', value: 'Projects', url: '/projects' },
])
</script>

<template>
  <header>
    <div class="mx-auto max-w-2xl flex items-center flex-col justify-center">
      <ul class="flex flex-row items-center justify-center gap-4">
        <li v-for="item in items" :key="item.key">
          <NuxtLink :to="item.url" class="px-2 py-1">
            <span class="font-serif">{{ item.value }}</span>
          </NuxtLink>
        </li>
      </ul>
      <div class="py-20">
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
  <div class="mx-auto max-w-2xl mt-10 pb-10">
    <slot />
  </div>
</template>
