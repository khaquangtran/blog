import { lazy, Suspense, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { articles, topics } from '../data/articles.js'
import { ArticleRow, FeaturedArticle } from '../components/ArticleCards.jsx'
import { Seo } from '../components/Seo.jsx'

const AsciiAnimation = lazy(() =>
  import('../components/AsciiAnimation.jsx').then((module) => ({ default: module.AsciiAnimation })),
)

export function Home() {
  const [topic, setTopic] = useState('All')
  const visible =
    topic === 'All'
      ? articles.slice(1, 4)
      : articles
          .filter((article) => article.category.toLowerCase().includes(topic.toLowerCase()))
          .slice(0, 4)
  return (
    <main>
      <Seo
        title="Engineering notes on reliable systems"
        description="Practical field notes from Kha Trần on databases, distributed systems, and the trade-offs behind reliable software."
        keywords={['software engineering', 'databases', 'distributed systems', 'infrastructure']}
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'Kha Trần — Engineering Notes',
          description: 'Field notes on databases, distributed systems, and reliable software.',
          author: { '@type': 'Person', name: 'Kha Trần' },
          inLanguage: 'en',
        }}
      />
{/*      <section className="hero hero-journal hero-network">
        <div className="hero-network-topline">
          <div className="hero-kicker">
            <span className="kicker-line" />
            KHA.TRAN / ENGINEERING JOURNAL
          </div>
          <span className="hero-edition">INDEPENDENT · VOL. 01</span>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-overline">DATABASES · DISTRIBUTED SYSTEMS · INFRASTRUCTURE</p>
            <h1>
              <span>Field notes on</span>
              <em>reliable systems.</em>
            </h1>
            <p className="hero-intro">
              Practical writing on data, distributed systems, and the trade-offs behind reliable
              software.
            </p>
            <div className="hero-links">
              <Link to={`/article/${articles[0].id}`} className="primary-button">
                READ THE FEATURED ESSAY <ArrowRight size={17} />
              </Link>
              <Link to="/articles" className="hero-secondary">
                ALL ARTICLES <ArrowRight size={15} />
              </Link>
            </div>
          </div>
          <aside
            className="hero-map-panel"
            aria-label="Interactive five-shard database visualization"
          >
            <Suspense
              fallback={<div className="ascii-showcase ascii-loading">Loading network map…</div>}
            >
              <AsciiAnimation />
            </Suspense>
          </aside>
        </div>
        <div className="hero-bottomline">
          <span>NOTES FOR CURIOUS BUILDERS</span>
          <span>
            THINK CLEARLY · BUILD THINGS THAT LAST <b>↘</b>
          </span>
        </div>
      </section>*/}
      <section className="featured-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow mono">01 / START HERE</span>
            <h2>
              Featured article<span className="accent-period">.</span>
            </h2>
          </div>
          <Link className="featured-note" to="/articles">
            All articles <ArrowRight size={14} />
          </Link>
        </div>
        <FeaturedArticle article={articles[0]} />
      </section>
      <section className="latest" id="latest">
        <div className="section-heading">
          <div>
            <span className="eyebrow mono">02 / RECENT NOTES</span>
            <h2>
              Latest writing<span className="accent-period">.</span>
            </h2>
          </div>
          <Link className="archive-count" to="/archive">
            VIEW ARCHIVE ↗
          </Link>
        </div>
        <div className="filter-bar" aria-label="Filter articles by topic">
          {topics.map((topicName) => (
            <button
              key={topicName}
              type="button"
              className={topic === topicName ? 'selected' : ''}
              onClick={() => setTopic(topicName)}
            >
              {topicName}
              <span>
                {topicName === 'All'
                  ? articles.length
                  : articles.filter((article) =>
                      article.category.toLowerCase().includes(topicName.toLowerCase()),
                    ).length}
              </span>
            </button>
          ))}
        </div>
        <div className="article-list">
          {visible.map((article, index) => (
            <ArticleRow key={article.id} article={article} index={index} />
          ))}
        </div>
        <div className="home-bottom home-bottom-cheatsheets">
          <aside className="topic-card">
            <span className="eyebrow mono">FIELD REFERENCES</span>
            <p>Quick commands and notes for the tools I use while building.</p>
            <Link className="browse-archive" to="/cheatsheets">
              Browse the cheatsheets <ArrowRight size={15} />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  )
}
