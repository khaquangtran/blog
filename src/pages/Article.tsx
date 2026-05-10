import { Link, useParams } from 'react-router'
import { getArticle } from '../lib/articles.ts'

function Article() {
  const { year, slug } = useParams()

  const article = getArticle(year!, slug!)

  if (!article) return null

  const Content = article.default

  const meta = article.frontmatter

  return (
    <>
      <header className={'mx-auto max-w-2xl px-4'}>
        <div className={'border-b border-dashed border-zinc-400 py-8 mb-1'}>
          <Link to={'/'} className={"hover:underline tracking-tight"}>/back</Link>
          <h1 className={"mb-3"}>{meta.title}</h1>
          <p className={'mb-3'}>
            {meta.date} - {meta.label} - {meta.minRead}
          </p>
          <p>{meta.description}</p>
        </div>
      </header>
      <section id={'article'} className={"mx-auto max-w-2xl px-4"}>
          <article className={"py-8"}>
              <Content />
          </article>
      </section>
    </>
  )
}

export default Article
