function Blog() {
  const articles = [
    {
      year: 2026,
      items: [
        {
          day: '14',
          month: 'May',
          title: '#2. Go Slices and the Trap of Shared Memory',
          slug: 'go-slices-and-the-cost-of-shared-memory',
        },
        {
          day: '10',
          month: 'May',
          title: '#1. Go Slices: A Deep Dive',
          slug: 'go-slices-a-deep-dive',
        },
      ],
    },
  ]

  return (
    <>
      <header className={'mx-auto max-w-2xl px-4'}>
        <div className={'border-b border-dashed border-zinc-600 py-8'}>
          <h1 className={'font-bold'}>Blog</h1>
          <div className={'mt-4 max-w-lg'}>
            <p className={'tracking-tight'}>
              Thoughts on software engineering, systems, and infrastructure —
              from abstractions to what really happens underneath.
            </p>
          </div>
          <div className={'mt-4'}>
            <a
              href={'mailto:kha.tran.swe@gmail.com'}
              className={'tracking-tight hover:underline'}
            >
              kha.tran.swe@gmail.com
            </a>
          </div>
        </div>
      </header>
      <section id={'articles'} className={'mx-auto max-w-2xl px-4'}>
        <div className={'py-8'}>
          {articles.map((article, index) => (
            <div key={index}>
              <h2 className={'mb-4 font-bold'}>{article.year}</h2>
              <div>
                {article.items.map((item, index) => (
                  <div key={`item-${index}`}>
                    <div
                      className={'mb-4 grid grid-cols-[55px_60px_1fr] gap-2'}
                    >
                      <div
                        className={
                          'font-geist-mono flex items-start justify-between'
                        }
                      >
                        <span>{item.month}</span>
                        <span>{item.day}</span>
                      </div>
                      <div className={'flex items-start justify-center'}>
                        <span>--</span>
                      </div>
                      <a
                        href={`/${article.year}/${item.slug}`}
                        className={'hover:underline'}
                      >
                        <p>{item.title}</p>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

export default Blog
