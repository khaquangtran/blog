---
title: 'How Uber built its real-time data infrastructure'
description: 'A detailed reading guide to Uber’s SIGMOD paper: Kafka for durable event movement, Flink for computation, Pinot for live analytics, and the trade-offs that connect them.'
date: '2026-10-31'
category: 'Distributed systems / Data platforms'
read: '22 min read'
author: 'Kha Trần'
keywords:
  [Uber, real-time data, Kafka, Flink, Apache Pinot, stream processing, OLAP, distributed systems]
image: /assets/uber-realtime-data-infrastructure/cover.svg
darkImage: /assets/uber-realtime-data-infrastructure/cover-dark.svg
imageAlt: A stream of events moving through a real-time data platform into analytical storage
imageCaption: A simplified view of the platform described in Fu and Soman’s 2021 paper. The diagram is an editorial illustration, not Uber’s production topology.
featuredImage: /assets/uber-realtime-data-infrastructure/featured.svg
featuredDarkImage: /assets/uber-realtime-data-infrastructure/featured-dark.svg
featuredImageAlt: Three regional event streams enter a federated Kafka platform and flow through Flink into Pinot, with an archive branch to HDFS
facts:
  [
    'THE PAPER|SIGMOD ’21',
    'THE STACK|Kafka · Flink · Pinot',
    'THE SCALE|Trillions of messages / day*',
  ]
---

In a ride-hailing marketplace, data loses value quickly. A driver changes location, a restaurant accepts an order, a payment is authorized, or demand shifts across a neighborhood. The platform needs to move these events, calculate useful signals, and make the results queryable while they still describe the present.

Yupeng Fu and Chinmay Soman’s paper, _Real-time Data Infrastructure at Uber_, is a tour of the systems Uber assembled for that job. Its central lesson is architectural: a real-time data platform is not one fast database. It is a chain of systems for moving events, computing state, serving queries, and recovering from failure. Each link has different guarantees and bottlenecks.

This article walks through that chain and the paper’s examples. I’ll distinguish the paper’s reported design from explanatory SQL and diagrams added here. The paper describes Uber’s systems as they stood around 2020–2021; its volume figures and implementation details are historical snapshots, not claims about Uber today.

## The problem: fresh data for many kinds of work

The paper starts from three sources of pressure:

- **Data grows.** Thousands of services produce logs, state changes, and business events. The paper says that, as of October 2020, Uber generated trillions of messages and petabytes of data per day across its regions.
- **Use cases disagree.** Dynamic pricing wants fresh signals and continued operation during partial failure. Financial reporting values completeness, de-duplication, and consistency across regions. A restaurant dashboard needs a query to finish before a page feels slow.
- **Users need different interfaces.** Engineers build long-running pipelines; analysts want SQL; operations teams need dashboards and alerts without becoming stream-processing specialists.

These requirements pull in different directions. Strong cross-region consistency can increase latency or reduce availability during a network partition. Keeping every raw event in memory makes queries fast but expensive. Runtime flexibility can make a query slower than a precomputed answer. The platform’s job is to offer shared building blocks while allowing each workload to choose its trade-offs explicitly.

The authors group the requirements as consistency, availability, freshness, query latency, scalability, cost, and flexibility. A “real-time” platform therefore has no single latency target: a pricing pipeline may care that an aggregate is only seconds old, while an interactive OLAP query may have a sub-second p99 target. Those are different measures at different points in the system.

## The shape of the platform

The main data path in the paper has three core systems:

1. **Kafka** accepts and distributes events between producers and consumers.
2. **Flink** applies stateful or stateless computation to those streams.
3. **Pinot** indexes recent data so users can run low-latency analytical queries.

Raw streams are also archived to **HDFS**, compacted into columnar files such as Parquet, and used for historical analysis and replay. **Presto** provides an interactive SQL route into Pinot. Around these engines, the paper describes APIs, metadata, job management, monitoring, and operational tooling. The platform story is as much about those boundaries as it is about the engines themselves.

![A simplified Uber real-time data path: Kafka feeds Flink and Pinot, with HDFS archival and Presto queries](/assets/uber-realtime-data-infrastructure/architecture.svg 'Kafka moves events; Flink computes; Pinot serves low-latency analytics; HDFS preserves history.' dark=/assets/uber-realtime-data-infrastructure/architecture-dark.svg)

The layers separate different responsibilities. Kafka is the handoff and retention boundary; it should not need to know every downstream business calculation. Flink owns continuous computation and its state. Pinot turns selected records or aggregates into an index optimized for analytical reads. HDFS keeps a durable historical copy that is more economical for large-scale batch work.

That separation also contains change. A stream job can evolve without each producer understanding its query plan. A dashboard can change its query without making the application service publish a new event format. Metadata and schemas provide the contracts that keep these independently moving parts understandable.

## Kafka: make event movement scale without hiding failure

At Uber’s scale, a single Kafka cluster becomes an operational and scaling boundary. The paper describes a **federated Kafka architecture**: users see a logical messaging platform, while metadata and routing distribute topics across multiple physical Kafka clusters. The paper reports that their experience favored keeping clusters below roughly 150 nodes, then scaling the overall service by adding clusters. Treat that as an observed operating point in their environment, not a universal Kafka limit.

This federation lets the platform move topics between clusters while they are live and grow capacity without asking every producer to understand cluster placement. It also creates a control-plane problem: clients need to discover where a topic lives, and moving a topic must not silently interrupt the event stream.

![Kafka federation places a logical messaging service over physical clusters, with proxy clients, replication, and auditing](/assets/uber-realtime-data-infrastructure/kafka-federation.svg 'Logical routing and operational tools sit around the Kafka brokers.' dark=/assets/uber-realtime-data-infrastructure/kafka-federation-dark.svg)

### Thin clients and push-based consumption

The **Consumer Proxy** moves consumer-library complexity into a platform service. A generated, thin gRPC client connects to the proxy, which dispatches messages to consumers. The paper argues that this push-oriented design helps with concurrency and gives the platform one place to handle retries and client compatibility. Applications need less Kafka-specific code, while the platform can roll out client behavior centrally.

The trade is another service on the data path. A proxy can standardize access and improve operability, but it needs its own capacity planning, monitoring, and failure handling. Abstraction reduces the number of ways every application can make a mistake; it does not make the underlying failure modes disappear.

### Poison messages, replication, and auditing

Repeatedly retrying one malformed record can block useful work behind it. Uber’s **dead-letter queue (DLQ)** path sends a message aside after a configured retry budget, allowing the live stream to progress while operators investigate the bad record. A DLQ is useful only if it is visible and actionable: otherwise it becomes an unmonitored place where data goes missing from the main path.

For cross-cluster replication, **uReplicator** adapts replication work to load and rebalances it to reduce the number of affected partitions during changes. **Chaperone** audits replication by comparing unique message counts over tumbling time windows at successive stages. A mismatch can reveal loss or duplication that ordinary service health metrics would miss.

These tools address distinct failure classes: retries and DLQs isolate bad records; adaptive replication moves data between clusters; auditing checks whether the movement actually preserved the expected records. “Kafka is healthy” is not enough evidence that a downstream consumer saw every event.

## Flink: compute continuous results and manage the jobs

Kafka moves events, but business logic needs state. A stream processor may count orders per region, join events from different topics, or maintain a rolling view of supply and demand. Such jobs must recover their state after a process or machine failure without producing arbitrary gaps or duplicates.

Uber selected **Apache Flink** for stateful streaming. Checkpoints capture job state and source positions so a job can recover from a consistent point. Backpressure is also visible in a streaming pipeline: if a downstream operator cannot keep up, upstream work must slow down or buffers grow. Recovery time, checkpoint behavior, memory use, and operational control matter as much as the speed of one operator.

The paper describes an earlier internal comparison among Storm, Spark Streaming, Samza, and Flink. In that test, Storm recovery took hours while Flink recovered in about 20 minutes; Spark used five to ten times as much memory for the evaluated workload; and Samza’s state was coupled to Kafka. Those figures belong to that comparison and workload. They explain the team’s selection, but they are not a general benchmark of current versions.

### SQL as a front end, not the execution engine

Not every user should have to write a low-level streaming program. Uber’s SQL layer uses Apache Calcite to parse and optimize SQL, then translates the result through logical and physical plans into Flink jobs. A declarative query expresses _what_ should be computed; the planner and platform determine _how_ to run it and manage its lifecycle.

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

The query describes a keyed windowed aggregate. The engine must still decide how to assign events to windows, how to represent the aggregate state, when a window is complete enough to emit, and what happens when events arrive late. The paper’s Surge example deliberately favors freshness and availability and ignores late events. A financial reconciliation job would likely make a different choice and accept more delay or correction work.

SQL does not remove those semantics. It makes them easier to express and gives the platform a place to validate, compile, estimate resources, and deploy the work consistently. The authors describe estimating job needs and scaling from runtime signals such as load and garbage-collection behavior. Stateless CPU-heavy jobs and stateful memory-heavy joins need different resource models; one global “CPU utilization” rule is not enough.

### A platform has to operate jobs after submission

Uber describes a unified Flink platform with three broad pieces: infrastructure, job management, and the platform layer. The job-management system owns deployment and lifecycle; monitoring rules detect unhealthy jobs and can recover, restart, or scale them. This turns a collection of manually operated Flink applications into a service users can depend on.

The paper reports thousands of Flink jobs and 30% year-over-year growth at the time. That growth makes self-service and automation part of correctness. If deploying a job requires an expert operator each time, operational capacity becomes the bottleneck before the compute cluster does.

![Calcite turns a declarative SQL query into a managed Flink job with checkpointed state and monitored execution](/assets/uber-realtime-data-infrastructure/flink-runtime.svg 'Planning, execution, checkpoints, and operations form one service.' dark=/assets/uber-realtime-data-infrastructure/flink-runtime-dark.svg)

## Pinot: trade general-purpose storage for predictable analytical reads

**Apache Pinot** is the serving layer for low-latency OLAP. It combines real-time ingestion with historical segments and uses a distributed scatter-gather-merge query path: broker nodes route a query to the servers holding relevant segments, collect partial results, then merge them for the caller.

Pinot’s column-oriented layout and indexes target common analytical filters and aggregates. The paper discusses inverted, range, and sorted indexes, along with **star-tree** indexes for pre-aggregating selected dimensions. A sorted index can help when values cluster in a useful order; an inverted index maps values to matching documents; a range index narrows numeric intervals; a star-tree stores summaries that can answer some grouped queries without scanning every row.

Every index spends storage and ingestion work to save query work. A star-tree can make a known dashboard query much faster, but it is not a free speedup for every possible grouping. Index selection should follow actual query patterns and cardinality. The paper compares Pinot with Elasticsearch and Druid on selected workloads and describes trade-offs in memory, disk, and latency. Those results are tied to its test setup; they should not be read as a blanket ranking of these systems.

![A Pinot broker scatters a query to segment servers, uses indexes to scan and aggregate, then merges partial results](/assets/uber-realtime-data-infrastructure/pinot-query.svg 'The broker coordinates fan-out and merges the servers’ partial answers.' dark=/assets/uber-realtime-data-infrastructure/pinot-query-dark.svg)

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

The useful optimization question is not just “Can this SQL run?” It is “Can the system answer it from a small set of recent segments and the right indexes, without scanning or transferring unnecessary columns?” Pinot’s index and segment design are how the serving layer aims to make that shape predictable.

### Upserts and ownership by primary key

The paper also discusses upserts. If multiple copies of a key can be updated on different servers, a query may see conflicting versions or require broad coordination. Uber partitions input by primary key so updates for a given key land on the same owner node, and queries for that partition route to that owner. This is a **shared-nothing** approach: partition ownership limits coordination to the server responsible for the key.

The simplicity depends on routing being consistent. Partitioning, query routing, and recovery all need to agree about ownership. If the partition map is stale or one node is missing, the system needs a way to recover data and direct reads without turning every query into a global lockstep operation.

### Recover segments without a central blocking bottleneck

Pinot’s immutable segments can be replicated and recovered when servers change. The paper describes replacing a centralized, synchronous segment archive path with peer-to-peer, asynchronous segment recovery. This reduces the archive controller’s role as a bottleneck and avoids making a server wait on a synchronous backup step before progressing.

That move shifts responsibility toward replication and recovery coordination. Asynchronous recovery can improve availability and throughput, but operators still need to know which replicas are complete, how long recovery is taking, and what durability guarantees apply during the interval. Fast recovery is useful only if the system can tell a healthy replica from a missing or stale one.

![Pinot routes each primary-key update to one owning partition and restores a missing segment through asynchronous peer copy](/assets/uber-realtime-data-infrastructure/pinot-ownership.svg 'Ownership keeps reads and updates aligned; peer recovery avoids a central synchronous archive step.' dark=/assets/uber-realtime-data-infrastructure/pinot-ownership-dark.svg)

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
"summary": "Flink aggregates supply and demand by geographic hexagon. Because the result feeds live price decisions, the pipeline moves forward with events it has instead of waiting for late arrivals.",
"priority": "Freshness and availability"
},
{
"label": "02 / RESTAURANT DASHBOARD",
"title": "Restaurant Manager",
"summary": "Known page queries can be pre-aggregated in Flink and indexed in Pinot. That makes dashboard responses predictable, while limiting the freedom of ad-hoc query shapes.",
"priority": "Low latency over query flexibility"
},
{
"label": "03 / MODEL MONITORING",
"title": "Prediction health",
"summary": "Hundreds of thousands of time series and millions of points per second are aggregated in Flink before Pinot serves them. Summarizing early controls storage and query cost.",
"priority": "Useful rollups over every raw point"
},
{
"label": "04 / EATS OPERATIONS",
"title": "Live query to action",
"summary": "Analysts explore live Pinot data through Presto, then turn useful queries into rules and alerts. The paper cites per-region operating limits during COVID-19 response.",
"priority": "Operational action with owned thresholds"
}
],
"caption": "The same platform supports different freshness, flexibility, and completeness contracts instead of forcing one consistency model on every team."
}
:::

## Multi-region: active-active and active-passive solve different problems

Regional redundancy sounds simple until events, state, and writes must converge after a failure. The paper describes two patterns because its workloads have different consistency requirements.

![Active-active processing keeps pricing available in regions while active-passive processing uses synchronized offsets for a single active consumer](/assets/uber-realtime-data-infrastructure/regions.svg 'The region strategy follows the workload’s consistency needs.' dark=/assets/uber-realtime-data-infrastructure/regions-dark.svg)

### Active-active for Surge

For Surge, each region can consume replicated input and run its own Flink pipeline. Independent processing avoids relying on one remote region for every price update. The outputs converge through an aggregated stream, while one designated update service acts as primary for writing the pricing result.

This keeps the decision path available, but it duplicates Flink work and compute cost. The paper notes that Uber does not replicate the large Flink state across regions in this pattern; each region recomputes from the stream. That only works if the inputs and computations can produce compatible outputs and the update boundary avoids conflicting writes.

### Active-passive for strong-consistency workloads

Payment or audit processing may require one uniquely identified consumer to be active. A passive region is ready to take over, but it must know which source offset has already been processed. uReplicator checkpoints and an offset synchronization job map progress from the source cluster to the destination cluster.

After failover, the new active consumer starts from the latest synchronized offset. Without that mapping, it may replay a backlog or skip events. The offset is therefore part of the failover protocol, not just bookkeeping. The system trades some independent regional work for a clearer single-writer history.

These modes answer different questions. Active-active asks, “Can regions keep calculating through a regional failure?” Active-passive asks, “Can one ordered consumer resume at a known point without double-processing or losing data?” Availability alone does not settle which answer a business workflow needs.

## Backfill: replay history without maintaining two different programs

Streaming logic changes. A bug gets fixed, a model is retrained, or a new metric is requested for historical data. If the only input is a short-retention Kafka stream, the old events may already be gone. Uber retained only a few days in Kafka in the described environment because of the data volume and cluster replacement constraints.

The familiar **Lambda architecture** solves this by maintaining separate streaming and batch implementations. But two implementations can drift: one uses a slightly different filter or late-event rule, and the historical result no longer matches the live one.

The paper describes two approaches toward reusing logic. In SQL mode, the same SQL is compiled for a Kafka-backed Flink DataStream job and a Hive-backed batch DataSet job. Their **Kappa+** API reuses the streaming computation code while reading archived data from Hive. It must handle bounded start and end times, throughput throttling, out-of-order windows, and memory behavior that differ from an unbounded live stream.

![Uber’s SQL mode compiles SQL for live and batch Flink jobs, while Kappa+ reuses streaming API code against archived Hive data](/assets/uber-realtime-data-infrastructure/backfill.svg 'The two reuse paths share intent, but have different execution constraints.' dark=/assets/uber-realtime-data-infrastructure/backfill-dark.svg)

Here is a simplified SQL sketch showing the conceptual goal. The paper does not publish a production query or claim that every streaming construct maps directly to batch execution:

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

For the live job, `trip_events` would represent an ongoing stream and windows would continue to advance. For a backfill, the input is bounded to an archived time range. The implementation still has to define event-time windows, late records, and state cleanup consistently. Reusing the text of a query is valuable only when the two execution modes preserve the same meaning.

The authors describe Kappa+ as work in progress, with edge cases still under investigation and no complete evaluation in the paper. That caveat matters: it is a direction for reducing semantic drift, not evidence that arbitrary streaming jobs can be replayed as batch jobs without changes.

## What the paper teaches about building data platforms

Several lessons recur across Kafka, Flink, and Pinot:

- **Open source is a starting point.** Mature projects accelerate development, but integration, scale, and operations require platform-specific changes.
- **Keep application clients thin.** Centralized client behavior makes upgrades and policy changes easier to roll out across many services.
- **Treat monitoring and recovery as product features.** A platform must detect stuck jobs, replication gaps, overload, and unhealthy segments, then make recovery routine.
- **Make cost visible.** Memory, indexes, cross-region duplication, and pre-aggregation all spend resources to improve some other property.
- **Invest in metadata and auditing.** Schemas, ownership, lineage, and independent data checks help users trust results that move through many systems.
- **Offer multiple levels of control.** SQL supports declarative users; APIs support engineers; dashboards and alerts make results usable by operations teams.

The authors close with future work as of 2021: more unified batch and streaming execution, stronger multi-region and multi-zone support, cloud-agnostic infrastructure, and tiered storage. These are statements of direction in that paper, not a current Uber roadmap.

## My takeaway

The most useful way to read this paper is as a set of boundary decisions. Kafka owns event movement and replication. Flink owns ongoing computation and state recovery. Pinot owns a narrow, fast analytical serving path. HDFS preserves a cheaper historical record. Presto gives analysts a familiar query surface. Metadata and management tools make the engines usable by a large organization.

The architecture works by accepting that different workloads need different guarantees. Surge can ignore late data to stay fresh. A payment consumer can require one active owner and synchronized offsets. A dashboard can trade open-ended query freedom for precomputation. A backfill can reuse logic while still acknowledging that bounded historical execution has different edge cases.

That is the deeper lesson: a real-time platform is a collection of explicit contracts. The engines matter, but so do the choices about ownership, failure, data completeness, query shape, replay, and cost. When those choices are visible, teams can select the right path for each workload instead of forcing every problem into one database or one consistency model.

:::source-note
This article explains Yupeng Fu and Chinmay Soman’s 2021 SIGMOD paper. Reported volumes, benchmarks, deployments, and road-map statements are historical snapshots from the paper. Diagrams and SQL are explanatory illustrations, not production Uber assets or queries.

:::source-link
[Read the paper: Real-time Data Infrastructure at Uber](https://doi.org/10.1145/3448016.3457552)

:::signature
— Kha
