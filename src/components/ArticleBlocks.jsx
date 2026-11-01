import { useEffect, useState } from 'react'
import { CopyCommand } from './CopyCommand.jsx'

export function InlineCode({ children, className = '' }) {
  return <code className={`article-inline-code ${className}`.trim()}>{children}</code>
}

export function CodeBlock({ code, language = 'TEXT', label = 'CODE' }) {
  return (
    <figure className="article-code">
      <figcaption>
        <span>{label}</span>
        <div className="article-code-tools">
          <span>{language}</span>
          <CopyCommand code={code} label="code" />
        </div>
      </figcaption>
      <pre>
        <code>{code}</code>
      </pre>
    </figure>
  )
}

export function ArticleImage({ src, darkSrc, alt = '', caption, className = '' }) {
  const [darkMode, setDarkMode] = useState(
    () => typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark',
  )

  useEffect(() => {
    if (!darkSrc) return undefined
    const root = document.documentElement
    const updateTheme = () => setDarkMode(root.dataset.theme === 'dark')
    const observer = new MutationObserver(updateTheme)
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] })
    updateTheme()
    return () => observer.disconnect()
  }, [darkSrc])

  const isDiagram = src.endsWith('.svg')

  return (
    <figure
      className={`article-image ${isDiagram ? 'article-image--diagram' : ''} ${className}`.trim()}
    >
      <img src={darkMode && darkSrc ? darkSrc : src} alt={alt} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}

export function ArticleCallout({ title = 'NOTE', children }) {
  return (
    <aside className="article-callout">
      <span>{title}</span>
      <p>{children}</p>
    </aside>
  )
}

function FigureHeader({ eyebrow, label }) {
  if (!eyebrow && !label) return null
  return (
    <div className="figure-header">
      {eyebrow && <span>{eyebrow}</span>}
      {label && <span>{label}</span>}
    </div>
  )
}

function FigurePanel({ panel }) {
  return (
    <section className="figure-panel">
      {(panel.label || panel.title) && (
        <header className="figure-panel-heading">
          {panel.label && <span>{panel.label}</span>}
          {panel.title && <b>{panel.title}</b>}
        </header>
      )}
      {panel.items?.length > 0 && (
        <div className="figure-entities">
          {panel.items.map((item, index) => (
            <div className="figure-entity-wrap" key={`${item.title}-${index}`}>
              {index > 0 && item.connector && (
                <div className="figure-connector">
                  <i aria-hidden="true">{item.connector.symbol || '→'}</i>
                  {item.connector.label && <span>{item.connector.label}</span>}
                </div>
              )}
              <div className={`figure-entity tone-${item.tone || 'default'}`}>
                {item.title && <b>{item.title}</b>}
                {item.details?.length > 0 && (
                  <div className="figure-entity-details">
                    {item.details.map((detail, detailIndex) => (
                      <span key={`${detail}-${detailIndex}`}>{detail}</span>
                    ))}
                  </div>
                )}
                {item.description && <small>{item.description}</small>}
                {item.rows?.length > 0 && (
                  <div className="figure-entity-rows">
                    {item.rows.map((row, rowIndex) => (
                      <p key={`${row}-${rowIndex}`}>{row}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {panel.note && <p className="figure-panel-note">{panel.note}</p>}
    </section>
  )
}

function ComparisonFigure({ figure }) {
  return (
    <div className="figure-panels">
      {figure.panels?.map((panel, index) => (
        <FigurePanel panel={panel} key={index} />
      ))}
    </div>
  )
}

function FlowFigure({ figure }) {
  return (
    <div className="figure-flow">
      {figure.steps?.map((step, index) => (
        <div className="figure-flow-item-wrap" key={`${step.title}-${index}`}>
          <div className="figure-flow-item">
            {step.label && <span>{step.label}</span>}
            {step.title && <b>{step.title}</b>}
            {step.description && <small>{step.description}</small>}
          </div>
          {index < figure.steps.length - 1 && (
            <i className="figure-flow-connector" aria-hidden="true">
              {figure.connectors?.[index] || '→'}
            </i>
          )}
        </div>
      ))}
    </div>
  )
}

function StateFigure({ figure }) {
  return (
    <>
      {figure.items?.length > 0 && (
        <div className="figure-state-grid">
          {figure.items.map((item, index) => (
            <div className={`figure-state tone-${item.tone || 'default'}`} key={index}>
              {item.label && <span>{item.label}</span>}
              {item.value && <b>{item.value}</b>}
            </div>
          ))}
        </div>
      )}
      {figure.note && <p className="figure-note">{figure.note}</p>}
      {figure.footer?.length > 0 && (
        <div className="figure-footer">
          {figure.footer.map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      )}
    </>
  )
}

function CapacityFigure({ figure }) {
  return (
    <>
      <div className="figure-capacity-label">
        <span>{figure.title}</span>
        {figure.summary && <b>{figure.summary}</b>}
      </div>
      <div className="figure-capacity-track" aria-label={figure.title}>
        {figure.segments?.map((segment, index) => (
          <i
            key={index}
            className={`tone-${segment.tone || 'default'}`}
            aria-label={segment.label || segment.tone || `Segment ${index + 1}`}
          />
        ))}
      </div>
      {figure.legend?.length > 0 && (
        <div className="figure-legend">
          {figure.legend.map((item, index) => (
            <span key={`${item.label}-${index}`}>
              <i className={`tone-${item.tone || 'default'}`} />
              {item.label}
            </span>
          ))}
        </div>
      )}
    </>
  )
}

function MetricsFigure({ figure }) {
  return (
    <div className="figure-metrics">
      {figure.items?.map((item, index) => (
        <div className="figure-metric" key={`${item.value}-${index}`}>
          <b>{item.value}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

function CaseGridFigure({ figure }) {
  return (
    <div className="figure-case-grid">
      {figure.items?.map((item) => (
        <section className="figure-case-card" key={item.label}>
          <header>
            <span>{item.label}</span>
            <i aria-hidden="true" />
          </header>
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <div className="figure-case-choice">
            <span>DESIGN PRIORITY</span>
            <b>{item.priority}</b>
          </div>
        </section>
      ))}
    </div>
  )
}

function RegionalPatternsFigure({ figure }) {
  return (
    <div className="figure-region-compare">
      {figure.patterns?.map((pattern) => (
        <section className="figure-region-column" key={pattern.label}>
          <header>
            <span>{pattern.label}</span>
            <h3>{pattern.title}</h3>
            <small>{pattern.workload}</small>
          </header>
          {pattern.kind === 'active-active' ? (
            <div className="figure-region-diagram">
              <div className="figure-region-node figure-region-node--wide">{pattern.input}</div>
              <span className="figure-region-down" aria-hidden="true">
                ↓
              </span>
              <div className="figure-region-branches">
                {pattern.regions.map((region) => (
                  <div className="figure-region-node" key={region}>
                    {region}
                  </div>
                ))}
              </div>
              <span className="figure-region-flow-note">STATE RECOMPUTED IN EACH REGION</span>
              <span className="figure-region-down" aria-hidden="true">
                ↓
              </span>
              <div className="figure-region-node figure-region-node--primary">
                {pattern.primary}
              </div>
            </div>
          ) : (
            <div className="figure-region-diagram">
              <span className="figure-region-lane-label">EVENTS</span>
              <div className="figure-region-route">
                <div className="figure-region-node">{pattern.source}</div>
                <span aria-hidden="true">→</span>
                <div className="figure-region-node">{pattern.replicator}</div>
                <span aria-hidden="true">→</span>
                <div className="figure-region-node">{pattern.destination}</div>
              </div>
              <span className="figure-region-lane-label">CONSUMER POSITION</span>
              <div className="figure-region-route figure-region-route--offsets">
                <div className="figure-region-node">{pattern.sourceOffset}</div>
                <span aria-hidden="true">→</span>
                <div className="figure-region-node">{pattern.offsetSync}</div>
                <span aria-hidden="true">→</span>
                <div className="figure-region-node">{pattern.destinationOffset}</div>
              </div>
              <p className="figure-region-failover">{pattern.failover}</p>
            </div>
          )}
          <dl>
            {pattern.details?.map((detail) => (
              <div key={detail.label}>
                <dt>{detail.label}</dt>
                <dd>{detail.text}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  )
}

const figureVariants = {
  comparison: ComparisonFigure,
  flow: FlowFigure,
  states: StateFigure,
  capacity: CapacityFigure,
  metrics: MetricsFigure,
  'case-grid': CaseGridFigure,
  'region-patterns': RegionalPatternsFigure,
}

export function ArticleFigure({ figure }) {
  if (!figure || typeof figure !== 'object') return null
  const Variant = figureVariants[figure.variant]
  if (!Variant) return null

  return (
    <figure className={`article-figure article-figure--${figure.variant}`}>
      <FigureHeader eyebrow={figure.eyebrow} label={figure.label} />
      <Variant figure={figure} />
      {figure.caption && <figcaption>{figure.caption}</figcaption>}
    </figure>
  )
}
