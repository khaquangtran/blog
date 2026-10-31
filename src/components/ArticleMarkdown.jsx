import { ArticleCallout, ArticleFigure, ArticleImage, CodeBlock } from './ArticleBlocks.jsx'
import { ArrowUpRight } from 'lucide-react'

export function headingId(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function getMarkdownHeadings(markdown = '') {
  return [...markdown.matchAll(/^##\s+(.+)$/gm)].map(([, title]) => ({
    title,
    id: headingId(title),
  }))
}

function inline(text, keyPrefix = 'inline') {
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g
  const parts = text.split(pattern)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={`${keyPrefix}-${index}`}>{part.slice(2, -2)}</strong>
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={`${keyPrefix}-${index}`}>{part.slice(1, -1)}</code>
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link)
      return (
        <a key={`${keyPrefix}-${index}`} href={link[2]}>
          {link[1]}
        </a>
      )
    return part
  })
}

function parseFenceInfo(info = '') {
  const [language, ...metadata] = info.trim().split('|')
  const label = metadata.find((item) => item.startsWith('label='))?.slice(6)
  return {
    language: language || 'TEXT',
    label: label || (language ? language.toUpperCase() : 'CODE'),
  }
}

export function ArticleMarkdown({ markdown }) {
  const lines = markdown.trim().split('\n')
  const blocks = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!line.trim()) {
      index += 1
      continue
    }

    const fence = line.match(/^```(.*)$/)
    if (fence) {
      const code = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++])
      index += 1
      blocks.push({ type: 'code', code: code.join('\n'), ...parseFenceInfo(fence[1]) })
      continue
    }

    if (line.trim() === ':::figure') {
      const figureLines = []
      index += 1
      while (index < lines.length && lines[index].trim() !== ':::') figureLines.push(lines[index++])
      index += 1
      try {
        blocks.push({ type: 'figure', figure: JSON.parse(figureLines.join('\n')) })
      } catch (error) {
        console.error('Unable to parse article figure JSON:', error)
      }
      continue
    }

    const styledBlock = line.match(/^:::(source-note|source-link|signature)$/)
    if (styledBlock) {
      const content = []
      index += 1
      while (index < lines.length && lines[index].trim()) content.push(lines[index++])
      blocks.push({ type: styledBlock[1], text: content.join(' ') })
      continue
    }

    const image = line.match(/^!\[([^\]]*)\]\((\S+?)(?:\s+(['"])(.*?)\3)?(?:\s+dark=(\S+))?\)$/)
    if (image) {
      blocks.push({
        type: 'image',
        alt: image[1],
        src: image[2],
        caption: image[4],
        darkSrc: image[5],
      })
      index += 1
      continue
    }

    if (/^>\s?/.test(line)) {
      const quote = []
      while (index < lines.length && /^>\s?/.test(lines[index]))
        quote.push(lines[index++].replace(/^>\s?/, ''))
      blocks.push({ type: 'callout', text: quote.join(' ') })
      continue
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/)
    if (heading) {
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] })
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items = []
      while (index < lines.length && /^[-*]\s+/.test(lines[index]))
        items.push(lines[index++].replace(/^[-*]\s+/, ''))
      blocks.push({ type: 'list', items })
      continue
    }

    const paragraph = [line]
    index += 1
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^(#{1,3}\s|```|:::|!\[|[-*]\s+)/.test(lines[index])
    )
      paragraph.push(lines[index++])
    blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
  }

  return blocks.map((block, i) => {
    if (block.type === 'code')
      return <CodeBlock key={i} code={block.code} language={block.language} label={block.label} />
    if (block.type === 'image') return <ArticleImage key={i} {...block} />
    if (block.type === 'source-note')
      return (
        <p key={i} className="source-note">
          {inline(block.text, `source-note${i}`)}
        </p>
      )
    if (block.type === 'source-link') {
      const link = block.text.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (!link) return null
      return (
        <a key={i} className="source-link" href={link[2]} target="_blank" rel="noreferrer">
          {link[1]} <ArrowUpRight size={15} />
        </a>
      )
    }
    if (block.type === 'signature')
      return (
        <p key={i} className="signature">
          {block.text}
        </p>
      )
    if (block.type === 'callout')
      return (
        <ArticleCallout key={i} title="THE CORE IDEA">
          {inline(block.text, `callout${i}`)}
        </ArticleCallout>
      )
    if (block.type === 'figure') return <ArticleFigure key={i} figure={block.figure} />
    if (block.type === 'heading') {
      const Tag = `h${block.level}`
      return (
        <Tag key={i} id={headingId(block.text)}>
          {inline(block.text, `h${i}`)}
        </Tag>
      )
    }
    if (block.type === 'list')
      return (
        <ul key={i} className="article-takeaways">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{inline(item, `li${i}-${itemIndex}`)}</li>
          ))}
        </ul>
      )
    return <p key={i}>{inline(block.text, `p${i}`)}</p>
  })
}
