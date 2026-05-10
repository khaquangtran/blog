import type { ComponentType } from 'react'

type Frontmatter = {
  title: string
  description: string
  date: string
  label: string
  minRead: string
}

type MdxModule = {
  default: ComponentType
  frontmatter: Frontmatter
}

const articleModules = import.meta.glob<MdxModule>('../articles/**/*.mdx', {
  eager: true,
})

export function getArticle(year: string, slug: string) {
  const path = `../articles/${year}/${slug}.mdx`

  const importer = articleModules[path]

  if (!importer) return null

  return importer
}
