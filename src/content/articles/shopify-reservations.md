---
title: 'How Shopify moved inventory reservations from Redis to MySQL'
description: 'A visual walkthrough of Shopify’s reservation redesign: unit rows, SKIP LOCKED, shadow-mode cutover, and the connection bottleneck they found.'
date: '2026-05-12'
category: 'System design / Databases'
read: '9 min read'
author: 'Kha Trần'
keywords: [Shopify, inventory reservations, Redis, MySQL, SKIP LOCKED, database transactions]
image: /assets/shopify-reservations/cover.svg
darkImage: /assets/shopify-reservations/cover-dark.svg
imageAlt: Inventory reservations moving from a Redis counter to a MySQL pool of locked unit rows
imageCaption: From a shared quantity counter to a bounded pool of individually lockable units.
facts: ['THE MOVE|Redis → MySQL', 'THE PRIMITIVE|SKIP LOCKED', 'THE REAL FIND|Connection time']
---

A checkout reservation is a short promise: hold these units while payment finishes, then claim them if payment succeeds or release them if it does not. Shopify moved this workflow from Redis into MySQL so reservation state and the inventory ledger could share a transaction boundary.

> Replace a hot quantity counter with a bounded pool of individual unit rows. A transaction locks available rows, skips rows another checkout already holds, and moves the selected units into a reservation.

## The real problem was split ownership

The previous design stored a quantity key in Redis. Reserving inventory decremented that counter; releasing it incremented the counter again:

```pseudocode|label=SIMPLIFIED REDIS COUNTER
# Reserve one unit
DECR inventory:item-42

# Release one unit
INCR inventory:item-42
```

Redis handled concurrency. The difficult edge was the later claim: after payment, MySQL had to update the inventory ledger while Redis removed the reservation. Those writes could not commit atomically across both systems. A failure between them could leave the ledger and reservation disagreeing: an item might be sold but not deducted, or deducted while still appearing reserved.

:::figure
{
  "variant": "comparison",
  "eyebrow": "01 / DATA OWNERSHIP",
  "label": "BEFORE → AFTER",
  "panels": [
    {
      "label": "BEFORE",
      "title": "Two systems",
      "items": [
        { "title": "Redis", "description": "short-lived reservation", "tone": "accent" },
        { "title": "MySQL", "description": "inventory ledger", "tone": "blue", "connector": { "symbol": "×", "label": "separate atomic boundary" } }
      ],
      "note": "Payment claim had to update MySQL and clean up Redis. Those operations could not commit atomically together."
    },
    {
      "label": "AFTER",
      "title": "One transaction boundary",
      "items": [
        { "title": "MySQL", "details": ["reservation units", "inventory ledger"], "description": "reserve + claim under ACID", "tone": "blue" }
      ],
      "note": "Reservations and the ledger share a database, so reserve and claim can use transactional guarantees."
    }
  ],
  "caption": "The change was about making inventory state and its ledger agree safely—not a claim that Redis cannot be durable."
}
:::

Putting reservation state beside the ledger gave Shopify one place to coordinate those transitions with ACID transactions. It also made it possible to model which inventory location can fulfill a reservation and removed the operational cost of a separate Redis cluster for this particular workflow. This is a workload-specific trade: Redis was not failing at atomic counter operations; the challenge was coordinating that counter with MySQL state.

## Reservation lifecycle: hold, claim, or release

A reservation is temporary. When payment starts, the system holds units so another checkout cannot take them. A successful payment claims the reserved quantity against the inventory ledger. An unsuccessful or expired payment releases the hold back into the available pool.

:::figure
{
  "variant": "flow",
  "steps": [
    { "label": "01 / CHECKOUT", "title": "Reserve", "description": "Hold units for a short window" },
    { "label": "02 / PAYMENT", "title": "Claim", "description": "Commit the sale to inventory" },
    { "label": "02 / PAYMENT FAILS", "title": "Release", "description": "Return units to availability" }
  ],
  "connectors": ["→", "↘"]
}
:::

The SQL below is a teaching sketch of the reservation selection pattern. It is not Shopify’s production query or complete schema: it leaves out application-specific columns, validation, and the surrounding transaction handling.

## Why represent each unit as a row?

An earlier shape—one row per item with a quantity column—concentrated concurrent updates on the same record. Shopify instead modeled each sellable unit as a row. To reserve two units, the transaction selects two rows for the correct shop, item, and inventory group.

:::figure
{
  "variant": "states",
  "eyebrow": "02 / RESERVE TWO UNITS",
  "label": "MYSQL 8 · SKIP LOCKED",
  "items": [
    { "label": "UNIT 01", "value": "IN USE", "tone": "accent" },
    { "label": "UNIT 02", "value": "READY", "tone": "mint" },
    { "label": "UNIT 03", "value": "IN USE", "tone": "accent" },
    { "label": "UNIT 04", "value": "RESERVED", "tone": "blue" },
    { "label": "UNIT 05", "value": "READY", "tone": "mint" },
    { "label": "UNIT 06", "value": "RESERVED", "tone": "blue" }
  ],
  "note": "Skip the rows another checkout holds. The query can take other available units instead of waiting on the same locked rows.",
  "footer": ["SELECT … FOR UPDATE SKIP LOCKED", "LOCK ONLY WHAT YOU CLAIM"],
  "caption": "Illustrative example. Shopify describes one reservation row per sellable unit and a bounded pool of available rows."
}
:::

```sql|label=SIMPLIFIED RESERVATION SELECTION
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;

SELECT id
FROM reservation_units
WHERE shop_id = ?
  AND inventory_item_id = ?
  AND inventory_group_id = ?
ORDER BY id
LIMIT 2
FOR UPDATE SKIP LOCKED;

-- The application checks that two rows were found,
-- then removes those unit rows and records the hold.
COMMIT;
```

`FOR UPDATE` locks the selected rows until the transaction completes. `SKIP LOCKED` tells MySQL not to wait for rows another checkout has locked; it can return different available units instead. That lets independent checkouts make progress without all queuing behind one hot counter.

The production flow moves the selected unit rows out of the available pool and records the reservation. The order matters: Shopify changed reserve to delete from the unit pool first, then insert into `reserved_quantities`. Claim operates on the reservation record. Keeping this work transactional is what makes the state transition reliable.

```sql|label=THE IMPORTANT WRITE ORDER
BEGIN;
  SELECT available unit rows
    FOR UPDATE SKIP LOCKED;

  DELETE selected rows FROM reservation_units;
  INSERT reservation record INTO reserved_quantities;
COMMIT;
```

## Keep the row pool bounded

One row per unit everywhere would make the table proportional to all stock. For an item with 50,000 units stocked at 10 locations, that could mean 500,000 rows to scan and maintain. Shopify keeps a bounded pool—up to 1,000 available rows per item and location combination—and replenishes it from the inventory ledger.

:::figure
{
  "variant": "capacity",
  "title": "AVAILABLE UNIT POOL",
  "summary": "CAP: 1,000 / ITEM / LOCATION",
  "segments": [
    { "tone": "mint" }, { "tone": "mint" }, { "tone": "accent" }, { "tone": "mint" }, { "tone": "mint" },
    { "tone": "accent" }, { "tone": "mint" }, { "tone": "mint" }, { "tone": "accent" }, { "tone": "mint" }
  ],
  "legend": [
    { "tone": "mint", "label": "Available row" },
    { "tone": "accent", "label": "Reserved / consumed" },
    { "tone": "blue", "label": "Replenish from ledger ↗" }
  ]
}
:::

The cap is large enough to absorb bursts, but small enough to keep the table and lock scan manageable. If a hot item exhausts its pool, the reserve path replenishes inline. A lock makes one transaction do the refill while other reservations for that item wait, avoiding a thundering herd of refill attempts. That path can add latency, but it avoids incorrectly telling a buyer that available stock is sold out.

## Indexes and isolation change lock behavior

The first prototype used an auto-increment primary key. InnoDB then needed to lock the secondary index used by the filter and the clustered primary-key record. Shopify observed two row locks per reservation. The composite key placed the filter dimensions in the primary key itself:

```sql|label=COMPOSITE PRIMARY KEY
PRIMARY KEY (
  shop_id,
  inventory_item_id,
  inventory_group_id,
  id
)
```

That brought the observed lock count down to one row lock per reservation row. At high concurrency, a key definition changes how much lock work the database does for every checkout.

They also found a less obvious issue when the pool was empty. Under MySQL’s default `REPEATABLE READ`, a locking read could take gap locks—including the supremum pseudo-record—which blocked replenishment inserts and contributed to deadlocks. For these transactions, Shopify switched to `READ COMMITTED`:

```sql|label=TRANSACTION-SCOPED ISOLATION
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
START TRANSACTION;

SELECT id
FROM reservation_units
WHERE shop_id = ? AND inventory_item_id = ?
FOR UPDATE SKIP LOCKED;

COMMIT;
```

This was a targeted choice for the reservation path, not a blanket setting for every transaction in the application.

## Consistent lock order and fewer round trips

Reserve and claim initially touched two tables in different orders. Reserve inserted into `reserved_quantities` before deleting from `reservation_units`; claim deleted from `reserved_quantities`. Concurrent transactions could form a cycle while waiting on each other. Shopify standardized the reserve order to delete units first, then insert the reservation record.

:::figure
{
  "variant": "comparison",
  "eyebrow": "LOCK ORDER",
  "panels": [
    {
      "label": "BEFORE",
      "items": [
        { "title": "RESERVE", "rows": ["reserved_quantities → reservation_units"] },
        { "title": "CLAIM", "rows": ["reserved_quantities"] }
      ],
      "note": "Conflicting acquisition order"
    },
    {
      "label": "AFTER",
      "items": [
        { "title": "RESERVE", "rows": ["reservation_units → reserved_quantities"] },
        { "title": "CLAIM", "rows": ["reserved_quantities"] }
      ],
      "note": "Consistent order breaks the cycle"
    }
  ]
}
:::

For carts with multiple line items, the team also used `UNION ALL` to batch reservation reads into one database round trip. This is a schematic illustration of the batching idea, not production SQL:

```sql|label=BATCH LINE-ITEM LOOKUPS
(SELECT item_id, unit_id
 FROM available_units
 WHERE item_id = ?
 LIMIT ?)

UNION ALL

(SELECT item_id, unit_id
 FROM available_units
 WHERE item_id = ?
 LIMIT ?);
```

## The bottleneck was connection time—not query speed

After the database design and queries looked healthy, throughput still hit a ceiling below target. Reservation latency was acceptable and CPU was not maxed out. Load tests showed MySQL threads queuing and backend connections exhausting at the ProxySQL layer. The team had optimized the reservation query, but had not yet identified which business processes were holding connections for how long.

They tagged SQL statements with the calling process, then aggregated connection hold time through ProxySQL. The comment tag made usage attributable instead of treating the connection pool as one opaque total:

```sql|label=TAG THE CALLER, MEASURE THE HOLD
/* conn_tag:checkout_completion */
SELECT ...;

-- Aggregate connection hold time by conn_tag
-- at the ProxySQL layer.
```

That visibility showed other checkout code was holding connections longer than necessary. Reservations were the last pressure on a pool that was already close to depletion—not the only slow query. Cleaning up the broader checkout path removed half of primary-database reads and a third of primary-database transactions. Revisiting MySQL thread-concurrency settings also helped remove the ceiling.

:::figure
{
  "variant": "metrics",
  "items": [
    { "value": "−50%", "label": "primary reads after checkout-path cleanup" },
    { "value": "−33%", "label": "primary transactions after cleanup" }
  ],
  "caption": "Production results reported by Shopify Engineering."
}
:::

The diagnostic lesson is useful: low CPU plus queuing can point toward connection pressure or time spent holding connections, even when individual queries look fast. Measure connection occupancy and caller behavior alongside query latency and CPU.

## Shadow mode made the migration reversible

Shopify ran Redis and MySQL in parallel. Every reservation was written to both systems while Redis remained the source of truth. The team compared business outcomes and performance against real production traffic; there were no in-flight reservations to migrate because both systems were live and building state.

:::figure
{
  "variant": "flow",
  "eyebrow": "03 / THE CUTOVER",
  "label": "GRADUAL · REVERSIBLE",
  "steps": [
    { "label": "01", "title": "Dual write", "description": "Redis stays source of truth" },
    { "label": "02", "title": "Shadow compare", "description": "Validate outcomes + performance" },
    { "label": "03", "title": "Switch gradually", "description": "Pod by pod, kill switch ready" }
  ],
  "caption": "Because both systems were live during shadow mode, Shopify says there were no in-flight reservations to migrate."
}
:::

After confidence in correctness and performance, the source of truth moved to MySQL gradually, pod by pod, from lower-traffic environments toward the largest merchants. The dual-write path and kill switch preserved a way back to Redis during rollout.

## What I’m taking away

- Keep reservation state and its ledger together when correctness depends on changing both atomically.
- Use a row-level data shape and `SKIP LOCKED` to let concurrent checkouts claim different units.
- Bound the pool so the per-unit model stays operationally manageable.
- Inspect real lock behavior, isolation, and lock ordering; small schema choices change concurrency costs.
- When a throughput ceiling does not match CPU or query latency, measure connection hold time across the full checkout path.
- Use shadow traffic and gradual rollout to validate outcomes before changing the source of truth.

:::source-note
This is an explanatory walkthrough, not Shopify’s production SQL or schema. The mechanics, migration decisions, and reported figures are summarized from the original engineering post.

:::source-link
[Read the original on Shopify Engineering](https://shopify.engineering/scaling-inventory-reservations)

:::signature
— Kha
