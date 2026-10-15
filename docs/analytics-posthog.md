# PostHog for usage analytics in Elody

An evaluation (2026-10-15) of PostHog for the second half of the analytics
question: not what is catalogued (the warehouse of [analytics.md](analytics.md))
but **how Elody is used**: which screens, filters, searches and operations
catalogers use, per library. Compared with Matomo, Plausible and others in the
conversation that led here; PostHog was kept because it is built for *product*
analytics (behaviour inside an application) rather than website statistics.
Nothing here has been installed or tried; it is read from PostHog's
documentation and third-party write-ups, listed at the end.

## Two ways to run it

| | Self-hosted (open source) | PostHog Cloud EU |
|---|---|---|
| Licence | MIT, except the `ee/` directory (its own licence; premium features need a PostHog licence). `posthog-foss` is the repository without `ee/` | a service |
| Where the data is | with us | Frankfurt (AWS eu-central-1), an instance separate from the US one |
| Support | none: "hobby" deployments, no recovery from data loss, no versioned releases (every commit that passes CI ships), one project per instance | PostHog's |
| Scale | about 100k events a month is the safe ceiling (PostHog's figures range 100k–300k); beyond that PostHog advises Cloud | no practical limit |
| Machine | 4 vCPU, 16 GB RAM, 30 GB+ (ClickHouse and Kafka together); the stack is Django, Celery workers, a plugin server, PostgreSQL, Redis, ClickHouse, Zookeeper, Kafka, MinIO | — |
| Cost | the machine and its upkeep | free up to 1M events, 5,000 session recordings and 1M warehouse rows a month; then per event (from $0.00005, falling with volume) |

## How much Open Vlacc would send

Open Vlacc has 89 users (local dump), about 67 of them at libraries. Assuming
50 active on a working day:

| Capture | Events per user per day (assumed) | Per month (22 days) |
|---|---|---|
| autocapture (every click and change) + page views | 300–500 | 330k–550k |
| page views + chosen events only | 50–100 | 55k–110k |

Both fit the Cloud free tier. Only the second fits a self-hosted instance, and
only just. These are assumptions to replace with a week of real measurement.

## In Elody

- **The PWA** initialises `posthog-js` once in `main.ts`. With the current
  defaults it captures single-page navigation itself
  (`capture_pageview: 'history_change'`), so the router needs no hook;
  autocapture can be switched off.
- **Events with Elody's names**: the operations, forms and filters are
  declared in the TTL. Their names (a bulk operation, a form's creation type, a
  filter's key) can be the events' names, so usage and declaration share one
  vocabulary.
- **Context on every event** as super properties: client, role, library (the
  e-mail domain or a library id), entity type. PostHog's *groups* (analyse per
  library as if the library acted) are a paid add-on, billed on every
  identified event once subscribed; a plain property is enough to break down
  and filter by library.
- **Privacy**: cookieless mode keeps PostHog's identifiers in memory for the
  page load; in a single-page app that is roughly the whole visit, until a
  reload (an inference from how the SDK stores it, not tested). Users
  are identified pseudonymously (a hash, `person_profiles: 'identified_only'`)
  or not at all. PostHog's own guide says Cloud EU alone is not enough: an
  opt-out is still needed, and the DPO decides. Discarding IP addresses is a
  project setting according to a customer's write-up; not confirmed in
  PostHog's documentation.

## Together with Elody's data

| Route | How | For |
|---|---|---|
| **PostHog → our ClickHouse** | batch exports to S3-compatible storage (MinIO, which Elody already runs) as Parquet, read by ClickHouse (`s3()`) or dlt; or to PostgreSQL. There is no ClickHouse destination | one warehouse, Superset over both, rights per library in Superset |
| **Elody → PostHog** | PostHog's data warehouse syncs sources such as MongoDB and PostgreSQL and joins them with events in HogQL | analyses inside PostHog; but Elody's catalogue then lives at PostHog too, and 4M entities exceed the free 1M rows |
| **Self-hosted, read its ClickHouse** | Superset on PostHog's own `events` table | no pipeline, but on an internal, unversioned schema of an unsupported deployment |

Whether batch exports cost extra on Cloud was not confirmed.

## Assessment

- **Open core, not free open source in practice**: the code is MIT except
  `ee/`, whose premium features need a PostHog licence even self-hosted; the
  self-hosted edition is an unsupported hobby deployment; "free" is the free
  tier of the paid cloud. If open source and self-hosting are requirements,
  PostHog drops out and Matomo (GPL-3.0, fully supported self-hosted) or
  Plausible / Rybbit (AGPL-3.0, data in ClickHouse) remain.
- **Fit**: good. PostHog answers the questions about how catalogers use Elody
  (funnels, paths, time between steps, session replay for UX) far better than
  Matomo or Plausible, which are built for websites.
- **Self-hosting is the weak spot**: unsupported, heavy (Kafka, Zookeeper,
  ClickHouse), unversioned, and near its ceiling at Open Vlacc's volume. If the
  data must stay in-house, this weighs against PostHog more than anything else.
- **Cloud EU is the practical option**: free at this volume, in Frankfurt, but
  a US company processing usage data of Flemish library staff: a decision for
  Cultuurconnect and its DPO, not a technical one.
- **The warehouse stays ours**: Elody's catalogue analytics stay in ClickHouse
  as built; PostHog's events join them through a batch export to MinIO when a
  dashboard needs both.

## Next steps, if pursued

1. Cultuurconnect and the DPO: Cloud EU acceptable, or must usage data stay
   in-house (then Matomo or Plausible self-hosted instead).
2. A trial on a PostHog Cloud EU project (created by us, not from a script):
   `posthog-js` in the PWA behind configuration (key and host), page views
   and a handful of declared operations as events, one week of real volume.
3. Only if the trial is kept: the batch export to MinIO and a usage mart next
   to the catalogue marts in ClickHouse.

## Sources

- PostHog self-host: https://posthog.com/docs/self-host, https://posthog.com/docs/self-host/deploy, https://github.com/posthog/posthog, https://archive.posthog.com/docs/self-host/open-source/disclaimer, https://cotera.co/articles/posthog-self-hosted-guide
- Licence and project structure: https://posthog.com/docs/contribute/project-structure
- Batch exports: https://posthog.com/docs/batch-exports.md, https://posthog.com/docs/cdp/batch-exports/s3, https://posthog.com/docs/data-warehouse/destinations
- Data warehouse: https://posthog.com/docs/data-warehouse/sources.md, https://posthog.com/docs/data-warehouse/start-here.md
- Pricing: https://posthog.com/pricing, https://posthog.com/product-analytics/pricing, https://posthog.com/group-analytics/pricing
- Privacy: https://posthog.com/docs/privacy/gdpr-compliance.md, https://posthog.com/blog/posthog-cloud-eu.md, https://posthog.com/docs/privacy/data-storage
- Vue: https://posthog.com/docs/libraries/vue-js, https://posthog.com/tutorials/spa, https://posthog.com/docs/web-analytics/installation/vue
