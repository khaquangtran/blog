import { Link, useParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { articles } from '../data/articles.js'
import { ArticleImage } from '../components/ArticleBlocks.jsx'
import { PageIntro } from '../components/PageIntro.jsx'
import { ArticleMarkdown, getMarkdownHeadings } from '../components/ArticleMarkdown.jsx'
import { ArticleToc } from '../components/ArticleToc.jsx'
import { getArticleDocument } from '../data/articleContent.js'
import { Seo } from '../components/Seo.jsx'

export function ArticlePage() {
  const { id } = useParams()
  const articleIndex = articles.findIndex((item) => item.id === id)
  const article = articles[articleIndex]

  if (!article)
    return (
      <main className="content-page">
        <Seo
          title="Page not found"
          description="This page could not be found."
          robots="noindex,follow"
        />
        <PageIntro
          index="404"
          eyebrow="NOT FOUND"
          title="This note isn’t here."
          description="The link may be old or mistyped."
        />
        <Link className="primary-button" to="/articles">
          BACK TO ARTICLES <ArrowRight size={16} />
        </Link>
      </main>
    )

  const document = getArticleDocument(article.content)
  const articleDetails = { ...article, ...document.metadata }
  const markdown = document.content
  const headings = getMarkdownHeadings(markdown)
  const articleNumber = String(articleIndex + 1).padStart(2, '0')
  const nextArticle = articles[(articleIndex + 1) % articles.length]
  const publishedDate = articleDetails.date ? new Date(`${articleDetails.date}T12:00:00Z`) : null
  const formattedDate =
    publishedDate && !Number.isNaN(publishedDate.valueOf())
      ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(
          publishedDate,
        )
      : articleDetails.date
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: articleDetails.title,
    description: articleDetails.desc,
    datePublished: articleDetails.date,
    author: { '@type': 'Person', name: articleDetails.author || 'Kha Trần' },
    publisher: { '@type': 'Person', name: articleDetails.author || 'Kha Trần' },
    articleSection: articleDetails.category,
    keywords: articleDetails.keywords,
    inLanguage: 'en',
  }

  return (
    <main className="article-page article-page-v2">
      <Seo
        title={articleDetails.title}
        description={articleDetails.desc}
        type="article"
        keywords={articleDetails.keywords}
        image={articleDetails.image}
        schema={articleSchema}
      />
      <div className="article-detail article-redesign">
        <div className="article-topbar">
          <Link to="/articles" className="back-link">
            <ArrowRight size={14} /> ALL FIELD NOTES
          </Link>
          <span>JOURNAL / {articleNumber}</span>
        </div>

        <header className="article-header">
          <div className="article-heading">
            <div className="eyebrow article-category">
              <i className={`dot ${article.accent}`} />
              {articleDetails.category}
            </div>
            <h1>{articleDetails.title}</h1>
            <p className="article-dek">{articleDetails.desc}</p>
          </div>
          <aside className="article-meta-panel" aria-label="Article details">
            <div>
              <span>PUBLISHED</span>
              <b>{formattedDate}</b>
            </div>
            <div>
              <span>READING TIME</span>
              <b>{articleDetails.read}</b>
            </div>
            <div>
              <span>FIELD NOTE</span>
              <b>
                {articleNumber} / {article.year}
              </b>
            </div>
          </aside>
        </header>

        {articleDetails.facts?.length > 0 && (
          <div className="article-facts">
            {articleDetails.facts.map((fact, index) => {
              const [label, ...valueParts] = fact.split('|')
              return (
                <div key={`${label}-${index}`}>
                  <span>{label}</span>
                  <b>{valueParts.join('|')}</b>
                </div>
              )
            })}
          </div>
        )}

        {articleDetails.image && (
          <ArticleImage
            className={`detail-art article-cover ${article.art}`}
            src={articleDetails.image}
            darkSrc={articleDetails.darkImage}
            alt={articleDetails.imageAlt}
            caption={articleDetails.imageCaption}
          />
        )}

        <div className="article-reading">
          <aside className="article-side-rail">
            {headings.length ? (
              <ArticleToc headings={headings} />
            ) : (
              <div className="article-topic-rail">
                <span className="eyebrow mono">SUBJECT</span>
                <b>{articleDetails.category}</b>
                <p>Part of the engineering field notes.</p>
                <Link to="/articles">
                  Browse all notes <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </aside>

          <article className="prose-section">
            <ArticleMarkdown markdown={markdown} />
          </article>
        </div>

        <nav className="article-pagination" aria-label="Continue reading">
          <Link to="/articles" className="article-pagination-back">
            <span>JOURNAL INDEX</span>
            <b>All field notes</b>
          </Link>
          <Link to={`/article/${nextArticle.id}`} className="article-pagination-next">
            <span>NEXT FIELD NOTE · {nextArticle.category}</span>
            <b>{nextArticle.title}</b>
            <ArrowRight size={18} />
          </Link>
        </nav>
      </div>
    </main>
  )
}
