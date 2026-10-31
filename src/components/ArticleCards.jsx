import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Art } from './Art.jsx'
import { ArticleImage } from './ArticleBlocks.jsx'
import { articles } from '../data/articles.js'
import { getArticleDocument } from '../data/articleContent.js'

export function ArticleRow({ article, index }) {
  return (
    <Link to={`/article/${article.id}`} className="article-row">
      <div className={`article-thumb ${article.art}`}>
        <Art type={article.art} />
        <span className="thumb-index">{String(index + 1).padStart(2, '0')}</span>
      </div>
      <div className="article-copy">
        <div className="eyebrow">
          <i className={`dot ${article.accent}`} />
          {article.category}
        </div>
        <h3>{article.title}</h3>
        <p>{article.desc}</p>
        <div className="article-meta">
          {article.date}
          <span>·</span>
          {article.read}
        </div>
      </div>
      <ArrowRight className="row-arrow" size={20} />
    </Link>
  )
}

function FeatureArtwork({ article }) {
  const { metadata } = getArticleDocument(article.content)
  const image = metadata.featuredImage || `/assets/${article.content}/cover.svg`
  const darkImage = metadata.featuredDarkImage || `/assets/${article.content}/cover-dark.svg`

  return (
    <ArticleImage
      className="feature-illustration"
      src={image}
      darkSrc={darkImage}
      alt={metadata.featuredImageAlt || `${article.title} illustration`}
    />
  )
}

export function FeaturedArticle({ article }) {
  return (
    <Link to={`/article/${article.id}`} className={`featured-card ${article.art}`}>
      <FeatureArtwork article={article} />
      <div className="featured-copy">
        <div className="featured-label">
          <span className="eyebrow">
            <i className={`dot ${article.accent}`} />
            EDITOR’S PICK
          </span>
          <span className="eyebrow mono">01 / {String(articles.length).padStart(2, '0')}</span>
        </div>
        <div className="eyebrow featured-topic">{article.category}</div>
        <h3>{article.title}</h3>
        <p>{article.desc}</p>
        <div className="featured-bottom">
          <span className="article-meta">
            {article.date}
            <span>·</span>
            {article.read}
          </span>
          <span className="featured-read">
            READ STORY <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  )
}
