# Tracking plan

Which usage events the PWA sends (to OpenPanel), and for each property the
values a client's UI declaration allows. The events are the platform's, the
same for every client (`src/analytics/tracking.ts`); the values come from the
declaration, so a new route, filter, view mode or form is in the plan as soon as
it is declared.

```bash
elody-ui analytics tracking ../elody-declarations/clients/vlacc/ui --out ../elody-declarations/clients/vlacc/analytics/tracking
elody-ui analytics coverage .../tracking-plan.json --observed observed.jsonl --out DIR
```

`tracking` writes `tracking-plan.json` (for tools) and `tracking-plan.md` (for
people). `coverage` holds what a usage tool saw against the plan: declared values
never seen, values and events seen that the plan does not have.

## Events

| event | status | properties | values from |
|---|---|---|---|
| `screen_view` | sent | `route` | the menu's routes; an entity's page (`/<entity type>/<id>`) per entity type |
| `search` | sent | `query_length`, `scope`, `entity_type` | `scope`: header, library; entity types |
| `filters_applied` | sent | `filters`, `count` | the document paths of the filters a user chooses (not hidden, not the type filter) |
| `mutation` | sent | `kind`, `outcome`, `entity_type` | sent under the mutation's operation name |
| `view_mode_changed` | planned | `view_mode`, `entity_type` | `elody:viewMode` |
| `sort_changed` | planned | `sort`, `entity_type` | the app's and the types' sort options |
| `bulk_operation` | planned | `operation`, `selected`, `entity_type` | every bulk operation, sub-operations included |
| `context_action` | planned | `action`, `entity_type` | the context menus' actions |
| `form_opened`, `form_submitted` | planned | `form` (`outcome`), `entity_type` | create and repetitive forms, the menu's forms |

The entity types are the menu's and those the type filters list (subtypes such
as `listening` under expressions). *sent*: the PWA sends it today; *planned*:
the PWA is to send it, with these names and properties.

What is never sent: the search query, a record's content, a user's name or
e-mail address (the user is a pseudonym, the library the group).

## Coverage

The input is one row per event, property and value with how often it was seen,
as a JSON list or JSON lines. In the local chain the view
`usage.tracking_observed` (`elody-declarations/poc/analytics/openpanel/tracking.sql`)
gives it from OpenPanel:

```bash
curl -s -u analytics:analytics localhost:18123 --data-binary \
  "SELECT event, property, value, count FROM usage.tracking_observed WHERE project = 'open-vlacc' FORMAT JSONEachRow" > observed.jsonl
```

On vlacc's local data (2026-10-16) it showed the drift it is for: the simulator
(`poc/analytics/openpanel/simulate.py`) sends events of its own (`filter_used`,
`entity_saved`, `entity_opened`) and bulk operations by label (`PrintLabels`),
none in the plan.

## Not yet

- The PWA sends the planned events: `view_mode_changed`, `sort_changed`,
  `bulk_operation`, `context_action`, `form_opened`, `form_submitted`.
- The PWA checks in development that what it sends is in the plan.
- The simulator generates its events from the plan.
