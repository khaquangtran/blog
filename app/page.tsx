import Link from "next/link";

export default function Home() {
    const articles = [
        {
            year: 2026,
            items: [
                {
                    day: 26,
                    month: 'Apr',
                    title: 'Designing Idempotent APIs',
                },
                {
                    day: 20,
                    month: 'Apr',
                    title: 'Kafka Exactly-Once: Myth or Reality?',
                },
                {
                    day: 10,
                    month: 'Apr',
                    title: 'Book Review: Designing Data-Intensive Applications',
                },
                {
                    day: 28,
                    month: 'Mar',
                    title: 'Handling Partial Failure in Microservices'
                },
                {
                    day: 15,
                    month: 'Mar',
                    title: 'Database Connection Pooling Deep Dive',
                },
                {
                    day: 27,
                    month: 'Feb',
                    title: 'Observability: Logs, Metrics, Traces'
                },
                {
                    day: 14,
                    month: 'Feb',
                    title: 'The Cost of Context Switching'
                }
            ]
        },
        {
            year: 2025,
            items: [
                {
                    day: 12,
                    month: 'Dec',
                    title: 'NUMA Effects in Modern CPUs'
                },
                {
                    day: 30,
                    month: 'Nov',
                    title: 'Building a Minimal Container Runtime'
                },
                {
                    day: 16,
                    month: 'Nov',
                    title: 'gRPC vs REST: Trade-offs'
                },
                {
                    day: 28,
                    month: 'Oct',
                    title: 'Practical Guide to Rate Limiting',
                },
                {
                    day: 12,
                    month: 'Oct',
                    title: 'Understanding Linux I/O Scheduler',
                },
                {
                    day: 27,
                    month: 'Sep',
                    title: 'Book Review: The Pragmatic Programmer',
                },
                {
                    day: 10,
                    month: 'Sep',
                    title: 'Zero-Downtime Deployment with Kubernetes',
                },
            ]
        }
    ]

  return (
      <div className={"font-mono"}>
        <header className={"max-w-2xl mx-auto px-4"}>
            <div className={"py-6 border-btm "}>
                <h1 className={"font-bold"}>Kha</h1>
                <div className={"max-w-lg mt-2"}>
                    <p>Thoughts and notes about Software Engineering, Backend Systems, Infrastructure, Hardware, and books.</p>
                </div>
                <Link href={"/"}>
                    <p className={"mt-1 link font-bold"}>kha.tran.swe@gmail.com</p>
                </Link>
            </div>
        </header>
          <section id={"articles"} className={"max-w-2xl mx-auto px-4 pb-6"}>
              <div>
                  {articles.map((article, index) => (
                      <div key={index} className={"mt-6"}>
                          <h1 className={"font-bold"}>{article.year}</h1>
                          <div className={"mt-1.5"}>
                              {article.items.map((item, index) => (
                                  <div key={`item-${index}`}>
                                      <div className={"grid grid-cols-[45px_30px_1fr] gap-4 py-1.5"}>
                                          <div className={"flex items-start justify-between"}>
                                              <span>{item.month}</span>
                                              <span>{item.day}</span>
                                          </div>
                                          <div className={"flex items-start justify-center"}>
                                              <span>——</span>
                                          </div>
                                          <Link href={"/"} className={"link"}>
                                              <p>{item.title}</p>
                                          </Link>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </section>
      </div>
  );
}
