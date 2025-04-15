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
          />
        </div>
        <NuxtPicture format="webp" />
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
  <section id="about-me" class="px-2 sm:px-0 mt-10">
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
          <a
            href="mailto:khatran.swe.persona@gmail.com"
            class="mt-2 link font-bold"
          >
            khatran.swe.persona@gmail.com
          </a>
        </p>
      </div>
    </div>
  </section>
  <section id="experience" class="px-2 sm:px-0 mt-10">
    <h1 class="title"><span class="link-active px-2">3.</span> Education</h1>
    <div class="grid grid-rows-2 gap-y-4 mt-8">
      <div class="grid grid-cols-3 gap-x-4">
        <p class="italic">July. 2018 — 2022</p>
        <div class="col-span-2 sm:col-span-1">
          <h1 class="font-bold">National University of IT (UIT)</h1>
          <h2 class="text-xs font-serif">Computer Science</h2>
          <p class="block sm:hidden mt-2 description">
            Studied Information Security, but switched back to Software
            Engineering.
          </p>
        </div>
        <p class="hidden sm:block description">
          Studied Information Security, but switched back to Software
          Engineering.
        </p>
      </div>
      <div class="grid grid-cols-3 gap-x-2">
        <p class="italic">???? — ????</p>
        <div class="col-span-2 sm:col-span-1">
          <h1 class="font-bold">National University of Science</h1>
          <h2 class="text-xs font-serif">Master of ???</h2>
          <p class="block sm:hidden description">
            I'm considering whether I should start studying Master in advance.
          </p>
        </div>
        <p class="hidden sm:block description">
          I'm considering whether I should start studying Master in advance.
        </p>
      </div>
    </div>
  </section>
  <section id="works" class="px-2 sm:px-0 mt-10">
    <h1 class="title"><span class="link-active px-2">4.</span> Works</h1>
    <div class="mt-8 grid grid-rows-3 gap-y-4">
      <div class="grid grid-cols-3 gap-x-4">
        <p class="italic">May. 2024 — Feb. 2025</p>
        <div class="col-span-2 sm:col-span-1">
          <h1 class="font-bold">EATLAB.AI</h1>
          <h2 class="text-xs font-serif">Software Engineer II</h2>
          <p class="block sm:hidden mt-2 description">
            Collaborated with AI team to provide the best AI product for
            customers.
          </p>
        </div>
        <p class="hidden sm:block description">
          Collaborated with AI team to provide the best AI product for
          customers.
        </p>
      </div>
      <div class="grid grid-cols-3 gap-x-2">
        <div>July. 2022 — Jan. 2024</div>
        <div class="col-span-2 sm:col-span-1">
          <h1 class="font-bold">Peeba Wholesaler</h1>
          <h2 class="text-xs font-serif">Software Engineer I && II</h2>
          <p class="block sm:hidden mt-2 description">
            Worked with many talent SWEs. I achieved a lot of skills from this
            place.
          </p>
        </div>
        <p class="hidden sm:block description">
          Worked with many talent SWEs. I achieved a lot of skills from this
          place.
        </p>
      </div>
      <div class="grid grid-cols-3 gap-x-2">
        <div>Jan. 2022 — March. 2022</div>
        <div class="col-span-2 sm:col-span-1">
          <h1 class="font-bold">DXC Technology</h1>
          <h2 class="text-xs font-serif">Software Engineer Intern</h2>
          <p class="block sm:hidden mt-2 description">
            Worked with extreme old legacy codebase, Java? No it's COBOL.
          </p>
        </div>
        <p class="hidden sm:block description">
          Worked with extreme old legacy codebase, Java? No it's COBOL.
        </p>
      </div>
    </div>
  </section>
  <section id="projects" class="px-2 sm:px-0 mt-10">
    <h1 class="title"><span class="link-active px-2">5.</span> Projects</h1>
    <div class="flex flex-col gap-y-4 mt-8">
      <div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
          <div>
            <h1 class="font-satoshi font-bold tracking-tighter">
              CQRS Bank API
            </h1>
            <h2 class="text-xs font-serif">CQRS Paradigm in Banking Service</h2>
          </div>
          <p class="description">
            CQRS (Command Query Responsibility Segregation) is a system
            architecture pattern that separates read and write operations into
            distinct services.
          </p>
        </div>
        <div
          class="flex flex-col-reverse sm:flex-row justify-between items-center mt-2"
        >
          <ul class="flex gap-2">
            <li>
              <a
                href="https://github.com/khaquangtran/event-driven-tech-bank"
                class="link"
                target="_blank"
              >
                [code]
              </a>
            </li>
          </ul>
          <p class="description italic">
            Spring Boot, Maven, Postgres, MongoDB
          </p>
        </div>
      </div>
      <div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
          <div>
            <h1 class="font-satoshi font-bold tracking-tighter">
              Simple Manning API
            </h1>
            <h2 class="text-xs font-serif">Minial Manning Backend</h2>
          </div>
          <p class="description">
            CQRS (Command Query Responsibility Segregation) is a system
            architecture pattern that separates read and write operations into
            distinct services.
          </p>
        </div>
        <div
          class="flex flex-col-reverse sm:flex-row sm:justify-between items-center mt-2"
        >
          <ul class="flex gap-2">
            <li>
              <a
                href="https://github.com/khaquangtran/simple-manning-api"
                class="link"
                target="_blank"
              >
                [code]
              </a>
            </li>
            <li>
              <a
                href="http://ec2-3-27-248-71.ap-southeast-2.compute.amazonaws.com/books"
                class="link"
                target="_blank"
              >
                [server]
              </a>
            </li>
          </ul>
          <p class="description italic">
            Github Actions, AWS, Docker, TypeScript, Express, Prisma, Postgres
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
