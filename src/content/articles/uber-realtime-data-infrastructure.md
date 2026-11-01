---
title: 'How Uber built its real-time data infrastructure'
description: 'A plain-language guide to Uber’s 2021 paper on moving live events, calculating updates, and answering data questions quickly across regions.'
date: '2026-10-31'
category: 'Distributed systems / Data platforms'
read: '22 min read'
author: 'Kha Trần'
keywords:
  [Uber, real-time data, Kafka, Flink, Apache Pinot, stream processing, OLAP, distributed systems]
image: /assets/uber-realtime-data-infrastructure/cover.svg
darkImage: /assets/uber-realtime-data-infrastructure/cover-dark.svg
imageAlt: 'An abstract network of live data events moving through Uber’s systems'
imageCaption: 'An abstract illustration of live data moving through connected systems.'
featuredImage: /assets/uber-realtime-data-infrastructure/featured.svg
featuredDarkImage: /assets/uber-realtime-data-infrastructure/featured-dark.svg
featuredImageAlt: Live events move through Kafka and Flink, then reach Pinot for quick reports and HDFS for long-term storage
facts:
  [
    'THE PAPER|SIGMOD ’21',
    'THE STACK|Kafka · Flink · Pinot',
    'THE SCALE|Trillions of messages / day*',
  ]
---

In a ride-hailing marketplace, information can become old in minutes. A driver changes location, a restaurant accepts an order, a payment is approved, or demand shifts across a neighborhood. Each update is an **event**: a record that something happened. Uber needs to move those records, calculate what they mean, and make the results available while they are still useful.

Yupeng Fu and Chinmay Soman’s paper, _Real-time Data Infrastructure at Uber_, explains the systems Uber built for this work. Its main lesson is that one fast database cannot do everything. Uber links several systems: one moves events, one keeps calculations up to date, and another answers questions about the data. Each part has a different job and different ways it can fail.

This article walks through those systems and the examples in the paper. The SQL and diagrams here are teaching examples, not copies of Uber’s production code. The paper describes Uber around 2020–2021, so its numbers and system details are historical snapshots, not a description of Uber today.

## The problem: fresh data for many kinds of work

The paper starts with three practical problems:

- **There is a lot of data.** Thousands of services produce logs, status changes, and business events. The paper says Uber generated trillions of messages and petabytes of data a day across its regions in October 2020.
- **Different jobs need different things.** Surge pricing needs fresh data and should keep working during a problem. Financial reports must avoid missing or counting records twice. A restaurant dashboard needs to load quickly.
- **People need different tools.** Engineers build the data jobs, analysts ask questions with SQL, and operations teams use dashboards and alerts.

These needs can conflict. For example, making every region wait until it agrees on an update can make the system slower, or stop it from responding when regions cannot communicate. Keeping all raw data in memory can make answers faster, but it costs more. A pre-calculated answer is quick to show, but it cannot answer every new question. Uber’s platform provides shared building blocks and lets each job choose which trade-offs matter most.

The authors group these needs as **consistency** (regions agree on the result), **availability** (the service can still respond), **freshness** (how recently the data was updated), speed, cost, and flexibility. “Real time” does not mean one fixed speed: a pricing job may need data that is only a few seconds old, while an interactive report may need to finish in under a second. Those measure different parts of the system.

## The shape of the platform

The paper’s main data path uses three systems:

- **Kafka** carries event records from the services that create them to the systems that use them.
- **Flink** continuously processes those records and updates calculations, such as order counts or supply-and-demand estimates.
- **Pinot** organizes recent data so dashboards and analysts can get answers quickly.

Uber also stores a long-term copy in **HDFS**, a file system for large data sets. The data can be saved in **Parquet**, a format that stores similar kinds of values together to make large scans more efficient. **Presto** lets people use SQL to ask questions of Pinot. The paper also describes tools for defining data, launching jobs, and checking whether the systems are healthy. These supporting tools are part of the platform too.

![A simplified Uber data path: Kafka moves events to Flink and Pinot, while HDFS stores older data](/assets/uber-realtime-data-infrastructure/architecture.svg 'Kafka moves updates, Flink calculates, Pinot answers questions about recent data, and HDFS keeps older records.' dark=/assets/uber-realtime-data-infrastructure/architecture-dark.svg)

Each layer has a clear job. Kafka hands events to the next system. Flink keeps calculations up to date. Pinot arranges selected data so common questions are quick to answer. HDFS keeps older data for large reports and for rerunning calculations later.

This separation also makes changes easier. A change to a calculation does not require every service that sends events to change too. A dashboard can ask a new question without changing how an application records an event. Shared data definitions help each part agree on what the records mean.

## Kafka: move events between services

At Uber’s scale, one Kafka cluster would be difficult to grow and operate. The paper describes one shared Kafka service built from several clusters. Applications use it as one service, while Uber spreads topics across the clusters behind the scenes. A **topic** is a named stream of related events. Uber’s experience at the time suggested keeping each cluster below about 150 machines and adding clusters as the service grew. That was their operating experience, not a limit that applies to every Kafka system.

This setup lets Uber move a live topic between clusters and add capacity without asking every application to know where the topic lives. The platform tracks each topic’s location and routes applications to it without interrupting the flow of events.

![Uber spreads one Kafka service across several clusters and adds tools for routing, copying, and checking messages](/assets/uber-realtime-data-infrastructure/kafka-federation.svg 'Applications see one Kafka service; the platform routes messages across the clusters behind it.' dark=/assets/uber-realtime-data-infrastructure/kafka-federation-dark.svg)

### Kafka’s Consumer Proxy: simpler apps, more workers

Kafka’s usual client library contains code for batching, compression, and other details. At a large company, updating that library in thousands of applications can take a long time. Uber built the **Consumer Proxy** to handle much of that work in one shared service. Each application uses a small, generated **gRPC client**—a lightweight way for one service to call another—and tells the proxy which topics it wants to receive.

The proxy reads messages from Kafka and pushes them to application workers. A topic is divided into ordered slices called **partitions**. In a consumer group, Kafka can assign each slice to only one consumer at a time, so adding more consumers than partitions would normally leave some idle. The proxy can spread messages across more application workers when those messages can be handled independently.

The cost is another service that every message passes through. The proxy needs enough capacity, monitoring, and a recovery plan of its own. A shared service can make applications simpler, but it also becomes something operators must keep healthy.

### Bad messages, copying data, and checking the copies

One broken message can hold up the messages behind it if the system retries it forever. Uber’s **dead-letter queue (DLQ)** sends a message to a separate stream after a set number of failed attempts. The main stream can continue while an operator investigates the bad message. The DLQ must be monitored and have a way to retry or clear messages; otherwise, data can sit there unnoticed.

Uber’s **uReplicator** copies messages between Kafka clusters and can move copying work when traffic changes or the cluster layout changes. **Chaperone** checks whether the copies arrived: it counts unique messages in short time periods at different points in the copying path and compares the counts. A mismatch can reveal missing or duplicated messages even if the services appear to be running.

Each tool catches a different problem. Retries and DLQs keep a broken message from blocking the stream. uReplicator moves messages between clusters. Chaperone checks that the copy is complete. A healthy Kafka service does not by itself prove that every later system received every message.

## Flink: keep calculations running as data arrives

Kafka moves events, but Uber also needs to calculate what those events mean. **Flink** runs programs, called **jobs**, that can keep a running count of orders in each region, combine related events, or track changing supply and demand. The values a job remembers between events are called its **state**. If a machine fails, Flink needs to restore that state and continue without skipping or repeating too much work.

Uber chose **Apache Flink** for these ongoing calculations. Flink periodically saves a **checkpoint**: a copy of the job’s current values and how far it has read in each input stream. After a failure, the job can resume from that saved point. Flink also has to handle **backpressure**: when one step cannot process data as fast as the previous step sends it, a backlog starts to grow. Recovery time, saved state, memory use, and day-to-day management all matter, not only the speed of the calculation itself.

The paper reports an earlier test of Storm, Spark Streaming, Samza, and Flink. In that test, Storm took hours to recover while Flink took about 20 minutes. Spark used five to ten times more memory for the workload they tested, and Samza depended on Kafka to store its job state. These results explain Uber’s choice for that workload at that time; they are not a general comparison of today’s versions.

### SQL: describe the result, let the platform run it

Not everyone who needs a calculation should have to write a program that runs continuously as new events arrive. Uber’s SQL layer uses Apache Calcite to read and improve a query, then turns it into a Flink job. SQL lets a user say **what result they want**. The platform works out the steps to produce it, launches the job, and manages it while it runs.

Here is an illustrative Flink-style query for a one-minute order count. It is a teaching example, not SQL copied from the paper or Uber’s production code:

```sql|label=ILLUSTRATIVE STREAMING AGGREGATION
SELECT
  region_id,
  TUMBLE_END(event_time, INTERVAL '1' MINUTE) AS window_end,
  COUNT(*) AS order_count
FROM orders
GROUP BY
  region_id,
  TUMBLE(event_time, INTERVAL '1' MINUTE);
```

This query groups orders by region and by one-minute time windows, then counts them. The system still needs rules for which window an event belongs in, when to publish a count, and what to do with an event that arrives late. Uber’s Surge example puts fresh results first and ignores late events. A financial report might wait longer or correct earlier results so it can include more data.

SQL does not decide what a late event should mean; the user still needs to choose that rule. SQL makes the calculation easier to describe, while the platform checks it, estimates the resources it needs, and starts it. Different jobs need different resources. A calculation that uses a lot of memory may need a different setup from one that mostly uses the processor, so one simple rule cannot manage every job well.

### Keep jobs healthy after they launch

Uber describes a shared Flink platform that provides machines for the jobs, tools to launch and manage them, and checks to notice problems. If a job gets stuck or a machine fails, the platform can restart or resize the job. That makes Flink a service teams can use without managing every detail themselves.

At the time of the paper, Uber ran thousands of Flink jobs, with the number growing by about 30% each year. Automating launches and routine recovery helps the platform keep up. If every new job needs a specialist to set it up and watch it, the team running the platform can become the limit before the computers do.

![A SQL query becomes a Flink job that the platform launches, saves, and monitors](/assets/uber-realtime-data-infrastructure/flink-runtime.svg 'The platform turns a query into a running job, saves its progress, and watches for problems.' dark=/assets/uber-realtime-data-infrastructure/flink-runtime-dark.svg)

## Pinot: get quick answers from recent data

**Apache Pinot** stores recent data in a form that can answer reports and dashboard questions quickly. It combines new data with older stored data. When a question comes in, a **broker** (a request router) splits the work among machines that hold the needed data. Those machines return partial answers, and the broker combines them into one result.

Pinot groups data by column—for example, it can keep all the `status` values together—and builds **indexes** to find useful rows quickly. An index is an extra structure that helps the system locate data without checking every record. The paper discusses several kinds: an **inverted index** lists which records have a given value; a **range index** helps find values between two numbers; a **sorted index** keeps values in order; and a **star-tree index** stores selected totals ahead of time so some grouped questions can be answered without reading every row.

Indexes take extra storage and time to maintain, so they are a trade: Pinot spends more effort when data arrives to make some questions faster later. A star-tree can speed up a dashboard that asks the same kinds of questions often, but it cannot speed up every possible question. The right indexes depend on what people actually ask. The paper compares Pinot with Elasticsearch and Druid on selected tests; those results depend on the test setup and do not rank the systems for every use.

![Pinot sends parts of a question to machines with the needed data, then combines their answers](/assets/uber-realtime-data-infrastructure/pinot-query.svg 'A router sends the question to the right machines and combines their answers.' dark=/assets/uber-realtime-data-infrastructure/pinot-query-dark.svg)

For example, a dashboard might ask a Pinot-like store for orders by region over the last few minutes:

```sql|label=ILLUSTRATIVE ANALYTICAL QUERY
SELECT region_id, COUNT(*) AS orders
FROM orders_realtime
WHERE event_time >= ago('5m')
  AND status = 'accepted'
GROUP BY region_id
ORDER BY orders DESC
LIMIT 20;
```

The important question is not only whether Pinot can run the SQL. It is whether it can find the recent records it needs without reading or moving lots of unrelated data. Its indexes and stored data chunks are designed to make common questions faster.

### Keep each record’s updates with one owner

The paper also describes **upserts**: inserting a new record or replacing an older record with the same ID. If different machines can update the same ID, they may end up with conflicting copies. Uber sends each ID to one designated machine, and sends questions about that ID to the same machine. This limits how many machines need to coordinate about one update.

This only works if every part of the system agrees which machine owns each ID. If a machine is missing or the ownership map is out of date, Pinot needs to restore the data and route questions correctly without making every machine wait on every request.

### Restore data without waiting on one central service

Pinot stores data in **segments**, or chunks that are built and then treated as read-only. It keeps copies on different machines so it can restore a missing chunk. The paper describes moving from a central service that had to copy each chunk before work continued to a method where machines copy chunks from one another in the background. This removes some waiting on the central service.

This approach still needs careful checks. Copying in the background can help the system keep running, but operators need to know which copies are ready and how long recovery takes. A fast copy is useful only if the system can tell a complete copy from one that is old or missing.

![Pinot sends each record ID to one owner machine and restores missing data by copying it from another machine](/assets/uber-realtime-data-infrastructure/pinot-ownership.svg 'One machine owns updates for each ID; other machines can help restore its data.' dark=/assets/uber-realtime-data-infrastructure/pinot-ownership-dark.svg)

## Four workloads, four different answers

One of the paper’s strongest sections shows that “real time” does not imply one universal consistency or query model.

:::figure
{
"variant": "case-grid",
"eyebrow": "06 / WORKLOAD EXAMPLES",
"label": "FOUR DIFFERENT CONTRACTS",
"items": [
{
"label": "01 / DYNAMIC PRICING",
"title": "Surge",
"summary": "Flink compares driver supply with ride demand in small map areas. Because prices depend on this result, the job uses the events it has instead of waiting for late ones.",
"priority": "Quick updates, even if some data arrives late"
},
{
"label": "02 / RESTAURANT DASHBOARD",
"title": "Restaurant Manager",
"summary": "Flink calculates common totals ahead of time, and Pinot stores them for the dashboard. Pages load faster, but people have fewer options for asking new questions.",
"priority": "Fast answers to known questions"
},
{
"label": "03 / MODEL MONITORING",
"title": "Prediction health",
"summary": "Flink summarizes hundreds of thousands of changing measurements and millions of data points per second before Pinot stores them. Keeping summaries costs less than keeping every detail ready for every query.",
"priority": "Summaries that use less storage"
},
{
"label": "04 / EATS OPERATIONS",
"title": "Live query to action",
"summary": "Analysts use Presto to explore live Pinot data, then turn useful answers into rules and alerts. The paper describes using this during COVID-19 to set local limits for restaurants and couriers.",
"priority": "Turn findings into action"
}
],
"caption": "One platform supports different needs: quick updates, fast reports, useful summaries, and alerts that help teams act."
}
:::

## Multi-region: choose how work continues after an outage

For Uber, a failure in one region should not stop every real-time service. A **region** is a geographically separate data center. A power outage, network failure, or serious software problem can make one unavailable, so Uber keeps copies of data in more than one region. Its **uReplicator** service copies event streams between Kafka clusters. This gives each region a view of events from elsewhere and a copy to use if another region goes down.

Different jobs still need different recovery plans. Surge pricing compares recent driver supply with rider demand in small areas, so fresh results and keeping the service available matter most. Payment processing and auditing must avoid missing or duplicated work, so they need one clear owner for processing. Uber uses two patterns to meet these needs.

### Active-active: keep both regions calculating

Trip events first go to Kafka clusters in their local regions. The events are then shared so each region can see activity from across Uber. Both regions run their own Flink job to calculate prices. A job’s **state** is the information it remembers as new events arrive, such as its current totals. Uber does not copy this large state between regions; each job builds its own copy by reading the same shared events. A coordinating service chooses one price-update service as the **primary**, meaning it is the only service allowed to write prices. That service saves each price under an area ID in a replicated lookup database so other services can find it quickly.

![Both regions calculate Surge prices, but only one update service writes the result](/assets/uber-realtime-data-infrastructure/active-active.svg 'Both regions keep calculating; only one writes the price, and the other can take over during an outage.' dark=/assets/uber-realtime-data-infrastructure/active-active-dark.svg)

**What it solves.** If the main region fails, the coordinating service can make the other region the writer. Its Flink job is already running, so Uber does not have to restart the calculation from scratch. Because both jobs read the same shared events, their price results can catch up with each other as they process updates. Only one service writes prices at a time, which avoids two services overwriting each other’s results.

**Trade-off.** Keeping both regions ready uses more computers and memory because both price calculations run all the time. This design favors having a fresh answer over waiting for every region to agree. It also depends on both jobs receiving the same events. The paper says late events are left out of the Surge calculation so new prices can be produced quickly.

### Active-passive: let one region process at a time

Payment processing and auditing need a different setup. Only one named **consumer**—a service that reads events—processes the Kafka stream in the main region. The other region has a copy of the data and a waiting service, called the **standby**. It does not process the same events at the same time.

![One region processes messages while a standby region keeps a copied stream and a saved restart position](/assets/uber-realtime-data-infrastructure/active-passive.svg 'The copy and its saved position let the standby continue from the right place after an outage.' dark=/assets/uber-realtime-data-infrastructure/active-passive-dark.svg)

**What it solves.** Having one active consumer avoids two services trying to process the same payment or audit event. When the main region fails, the standby needs to know where to continue. Kafka tracks reading progress with an **offset**, a number that points to a place in a stream—like a bookmark. The same number can point to different events in two Kafka clusters, so Uber keeps a map between the source cluster’s position and the copied cluster’s position. As uReplicator copies messages, it saves this map in a shared database. A separate job regularly updates the standby’s bookmark. During an outage, the standby uses the latest saved position instead of skipping ahead or starting over from the oldest event.

**Trade-off.** Only one region does the processing, but failover depends on several extra pieces: copying the data, saving the position map, and updating the standby. These updates happen periodically, so the standby may need to read some events that arrived since the last update. The service must keep both the copied data and the saved positions in good shape.

Both patterns help a service continue after a region fails while its recent events are still available. But what if the job changes after Kafka has deleted the old events? That leads to **backfill**: rerunning a calculation over older, archived data without keeping two different versions of the calculation in sync.

## Backfill: rerun old data without maintaining two programs

Data jobs change over time. A bug is fixed, a machine-learning model is retrained, or a team asks for a new historical measure. If Kafka keeps events for only a few days, those older events may already be gone. The paper says Uber kept Kafka retention short because it handled so much data and had to replace cluster machines.

One common design, the **Lambda architecture**, uses one program for live data and a separate program for old data. Keeping both programs correct is hard: a filter or rule may change in one but not the other, so the old results can disagree with the live ones.

The paper describes two ways to reuse the same calculation. In SQL mode, a user writes one SQL query, and Flink turns it into a job for live Kafka data and another job for old data stored in Hive, Uber’s system for organizing archived data. Uber’s **Kappa+** approach reuses the same continuously running program but points it at that archive. The job needs a start and end time for the old data. It may also need to slow down so it can process the archive at a manageable pace. Older events can appear after newer ones, so the job may need extra memory while it waits to put them into the right time groups.

![Flink can run one SQL query on live Kafka events or use the same streaming code to read older data from Hive](/assets/uber-realtime-data-infrastructure/backfill.svg 'The same calculation can use live events or archived records, with some settings adjusted for older data.' dark=/assets/uber-realtime-data-infrastructure/backfill-dark.svg)

Here is a simplified SQL example showing the idea. The paper does not provide a real production query. A query that works on a continuous stream may also need changes before it can process a fixed archive:

```sql|label=ONE LOGIC, TWO INPUTS · CONCEPTUAL
SELECT
  region_id,
  window_start,
  COUNT(*) AS trips
FROM trip_events
WHERE event_time >= TIMESTAMP '2026-10-01 00:00:00'
  AND event_time <  TIMESTAMP '2026-10-08 00:00:00'
GROUP BY region_id, window_start;
```

For the live job, `trip_events` would keep receiving new records and its time windows would keep advancing. For a backfill, the job reads only the chosen dates from the archive. Both versions still need the same rules for grouping events by time, handling late records, and resetting old totals. Sharing the query helps only if it means the same thing in both jobs.

The authors say Kappa+ was still being developed. The paper does not fully test it, and some unusual cases still needed work. It is a way to reduce differences between live and historical calculations, not a guarantee that every live job can run unchanged on old data.

## Lessons from the paper

Several lessons appear across Kafka, Flink, and Pinot:

- **Open-source software is a good base.** Uber could build on mature projects, then change them to fit its size and needs.
- **Keep app code simple.** A shared client service makes updates easier than changing thousands of applications one by one.
- **Build monitoring and recovery into the platform.** Teams need to notice stuck jobs, missing copies, and full machines, then know how to recover.
- **Show the cost of speed.** More memory, indexes, copies across regions, and saved summaries all use extra resources.
- **Track what data means and where it came from.** Clear definitions, owners, and independent checks help people trust the results.
- **Give people tools that fit their work.** Analysts can use SQL, engineers can use programming tools, and operations teams can use dashboards and alerts.

The authors’ future plans in 2021 included making live and historical jobs work together more easily, improving support across regions and data centers, working across cloud providers, and moving older data to cheaper storage. These were plans described in the paper, not a current Uber roadmap.

## My takeaway

I read this paper as a guide to giving each part of the system one clear job. Kafka moves events between services. Flink keeps calculations up to date and can restart them after a failure. Pinot answers common questions about recent data. HDFS keeps older data, and Presto lets analysts ask questions with SQL. Shared definitions and management tools help people use all of these parts together.

The main idea is to choose how each job should behave when trade-offs appear. Surge can ignore late events to show a fresh price. A payment job can use one active reader and a saved restart position. A dashboard can answer a few common questions quickly by calculating totals ahead of time. A backfill can reuse the live calculation while still handling old data differently.

The deeper lesson is that a real-time platform is a set of choices about who owns each update, what happens during an outage, how complete the data must be, how quickly an answer is needed, and what it costs. Making those choices clear helps teams use the right tools for each job instead of forcing every problem into one database.

:::source-note
This article explains Yupeng Fu and Chinmay Soman’s 2021 SIGMOD paper. Reported volumes, benchmarks, deployments, and road-map statements are historical snapshots from the paper. Diagrams and SQL are explanatory illustrations, not production Uber assets or queries.

:::source-link
[Read the paper: Real-time Data Infrastructure at Uber](https://doi.org/10.1145/3448016.3457552)

:::signature
— Kha
