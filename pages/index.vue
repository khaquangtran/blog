<script setup lang="ts">
import { ref } from 'vue'

const works = ref([
  {
    date: 'May. 2024 — Feb. 2025',
    company: 'EATLAB.AI',
    role: 'Software Engineer II',
    description:
      'Collaborated with AI team to provide the best AI product for customers.',
  },
  {
    date: 'May. 2024 — Feb. 2025',
    company: 'Peeba Wholesaler',
    role: 'Software Engineer I && II',
    description:
      'Worked with many talent SWEs. I achieved a lot of skills from this place.',
  },
  {
    date: 'Jan. 2022 — March. 2022',
    company: 'DXC Technology',
    role: 'Software Engineer Intern && I',
    description:
      "Worked with extreme old legacy codebase, Java? No it's COBOL.",
  },
])

const educations = ref([
  {
    date: 'July. 2018 — 2022',
    uni: 'National University of IT (UIT)',
    study: 'Computer Science',
    description:
      'Studied Information Security, but switched back to Software Engineering.',
  },
  {
    date: 'July. 2018 — 2022',
    uni: 'National University of Science',
    study: 'Master of ???',
    description:
      "I'm considering whether I should start studying Master in advance.",
  },
])

const projects = ref([
  {
    title: 'CQRS Bank API',
    subtitle: 'CQRS Paradigm in Banking Service',
    description:
      'CQRS (Command Query Responsibility Segregation) is a system architecture pattern that separates read and write operations into distinct services.',
    stacks: 'Spring Boot, Maven, Postgres, MongoDB',
    links: [
      {
        link: 'https://github.com/khaquangtran/event-driven-tech-bank',
        name: 'code',
      },
    ],
  },
  {
    title: 'Simple Manning API',
    subtitle: 'Minial Manning Backend',
    description:
      'CQRS (Command Query Responsibility Segregation) is a system architecture pattern that separates read and write operations into distinct services.',
    stacks:
      'Github Actions, AWS, Docker, TypeScript, Express, Prisma, Postgres',
    links: [
      {
        link: 'https://github.com/khaquangtran/simple-manning-api',
        name: 'code',
      },
      {
        link: 'http://ec2-3-27-248-71.ap-southeast-2.compute.amazonaws.com/books',
        name: 'server',
      },
    ],
  },
])
</script>

<template>
  <section id="activities" class="px-2 sm:px-0">
    <div class="flex justify-between">
      <h1 class="title"><span class="link-active px-2">1.</span> Activity</h1>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
      <figure>
        <div class="w-full aspect-square bg-gray relative">
          <NuxtPicture
            format="webp"
            src="/images/homelab_pc.webp"
            :img-attrs="{
              class: 'absolute top-0 left-0 w-full h-full object-contain',
            }"
            alt="customized-my-homelab"
          />
        </div>
        <figcaption class="mt-2 px-2">
          <div class="flex items-center justify-between">
            <h1 class="font-bold text-center">Customized my Homelab</h1>
            <h2>Feb. 2025</h2>
          </div>
        </figcaption>
      </figure>
      <figure>
        <div class="w-full aspect-square bg-gray relative">
          <NuxtPicture
            format="webp"
            src="/images/homelab_raspberry.webp"
            :img-attrs="{
              class: 'absolute top-0 left-0 w-full h-full object-contain',
            }"
            alt="customized-my-raspberry"
          />
        </div>
        <figcaption class="mt-2 px-2">
          <div class="flex items-center justify-between">
            <h1 class="font-bold text-center">Played with Raspberry</h1>
            <h2>Feb. 2025</h2>
          </div>
        </figcaption>
      </figure>
    </div>
  </section>
  <section id="about-me" class="px-2 sm:px-0 mt-6">
    <h1 class="title"><span class="link-active px-2">2.</span> Introduction</h1>
    <div
      class="mt-8 grid grid-rows-0 grid-cols-1 sm:grid-rows-2 sm:grid-cols-2 gap-x-4 gap-y-4 sm:gap-y-6"
    >
      <div>
        <h1 class="news-title">1. About Me — Về Bản Thân Tôi</h1>
        <p class="mt-2 news-description">
          Howdy, I'm a Software Engineer with a passion for building a
          full-scale product. With almost 3 yoe, I'm confident with my ability
          to produce the best outcome not only for the company but for the team.
        </p>
      </div>
      <div>
        <h1 class="news-title">2. Expertise — Chuyên Về</h1>
        <p class="mt-2 news-description">
          I have a strong passion for backend and of course it's not the only
          thing in development but I do believe backend is the backbone for all
          of the projects nowaday. And of course, a mindset of a product owner.
        </p>
      </div>
      <div>
        <h1 class="news-title">3. Free Time — Lúc Rãnh Rỗi</h1>
        <p class="mt-2 news-description">
          I like to read Tech books && blogs. I'm able to read the doc for hours
          just for researching. Recently, I took a liking to Homelab, servers
          and networks in order to expand my knowledge.
        </p>
      </div>
      <div>
        <h1 class="news-title">4. Contact Me — Hãy Liên Hệ Tôi</h1>
        <p class="mt-2 news-description">
          I like to read Tech books && blogs. I'm able to read the doc for hours
          I'm currently available at any time, please reach me at ◝(ᵔᗜᵔ)◜
          <NuxtLink
            to="mailto:khatran.swe.persona@gmail.com"
            class="mt-2 link font-bold link-active"
          >
            khatran.swe.persona@gmail.com
          </NuxtLink>
        </p>
      </div>
    </div>
  </section>
  <section id="experience" class="px-2 sm:px-0 mt-6">
    <h1 class="title"><span class="link-active px-2">3.</span> Education</h1>
    <div class="grid grid-rows-2 gap-y-4 mt-8">
      <div
        v-for="education in educations"
        :key="education.uni"
        class="grid grid-cols-3 gap-x-4"
      >
        <p class="italic">{{ education.date }}</p>
        <div class="col-span-2 sm:col-span-1">
          <h1 class="font-bold">{{ education.uni }}</h1>
          <h2 class="text-xs font-serif">{{ education.study }}</h2>
          <p class="block sm:hidden mt-2 description">
            {{ education.description }}
          </p>
        </div>
        <p class="hidden sm:block description">
          {{ education.description }}
        </p>
      </div>
    </div>
  </section>
  <section id="works" class="px-2 sm:px-0 mt-6">
    <h1 class="title"><span class="link-active px-2">4.</span> Works</h1>
    <div class="mt-8 grid grid-rows-3 gap-y-4">
      <div
        v-for="work in works"
        :key="work.company"
        class="grid grid-cols-3 gap-x-4"
      >
        <p class="italic">{{ work.date }}</p>
        <div class="col-span-2 sm:col-span-1">
          <h1 class="font-bold">{{ work.company }}</h1>
          <h2 class="text-xs font-serif">{{ work.role }}</h2>
          <p class="block sm:hidden mt-2 description">
            {{ work.description }}
          </p>
        </div>
        <p class="hidden sm:block description">
          {{ work.description }}
        </p>
      </div>
    </div>
  </section>
  <section id="projects" class="px-2 sm:px-0 mt-6">
    <h1 class="title"><span class="link-active px-2">5.</span> Projects</h1>
    <div class="flex flex-col gap-y-4 mt-8">
      <div v-for="project in projects" :key="project.title">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
          <div>
            <h1 class="font-bold">
              {{ project.title }}
            </h1>
            <h2 class="text-xs">{{ project.subtitle }}</h2>
          </div>
          <p class="description">
            {{ project.description }}
          </p>
        </div>
        <div
          class="flex flex-col-reverse sm:flex-row justify-between items-center mt-2"
        >
          <ul class="flex gap-2">
            <li v-for="link in project.links" :key="link.link">
              <NuxtLink
                :href="link.link"
                class="hover:link-active"
                target="_blank"
              >
                [{{ link.name }}]
              </NuxtLink>
            </li>
          </ul>
          <p class="description italic">
            {{ project.stacks }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
