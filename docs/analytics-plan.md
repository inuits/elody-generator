# Plan: analytics uit de elody-declaratie (POC Open Vlacc)

Redmine #167487 (subtaak van #139502 *Rapportering en exportmogelijkheden*).
Doel: de statistiek-requirements van Open Vlacc halen met de keten
**elody (MongoDB) → dlt → ClickHouse → Superset**, waarbij het analytics-schema
**gegenereerd** wordt uit de bestaande UI-declaratie in plaats van met de hand
geschreven. Dit is tegelijk de referentie-opzet voor de Cultuurconnect-dashboardingofferte.

Fase 1 beantwoordt één vraag van Cultuurconnect: **hoeveel entiteiten worden
aangemaakt, per type, per periode, en opgesplitst per dimensie** (materiaaltype,
bibliografisch type, doelgroep, ...).

---

## Context die je eerst leest

Lees deze bestanden voor je iets schrijft:

1. `../elody-ontology/README.md` en `../elody-ontology/ui/elody-ui.ttl` (zoek op
   `elody:Filter`, `elody:filterKind`, `elody:key`, `elody:filtersFragment`).
2. `README.md` en `docs/declarations-brief.md` van deze repo, plus `src/reading.ts`,
   `src/declarationFiles.ts` (`loadDeclaration`), `src/turtle.ts`, `src/parse.ts`.
3. `../elody-declarations/README.md` en de Vlacc-declaratie:
   - `../elody-declarations/clients/vlacc/client.json` (Mongo DB `vlacc`, collecties
     `entities_actual`, `bibliographic_entities_actual`, `users_actual`)
   - `../elody-declarations/clients/vlacc/ui/entities/vlaccFragments.ui.ttl`: het
     filtersFragment `entityAuditFilters` met `vlacc:1|audit.created.at` (DateFilter)
     en `vlacc:1|audit.created.by`
   - `../elody-declarations/clients/vlacc/ui/entities/manifestations/manifestation.ui.ttl`:
     filters zoals `material_type`, `bibliographic_type`, `status_field`
4. Vertalingen: `../clients/vlacc-dams/client-frontend/inuits-dams-graphql-service/src/translations/nl.json`
   (labels onder `nl.metadata.labels.*`, bv. `material-type` → "Materiaaltype").

### Wat we al weten (niet opnieuw uitzoeken, wel verifiëren)

- De declaratie is een directory van Turtle-bestanden die als **één graaf** gelezen wordt.
  `elody:EntityUi` is een `sh:NodeShape`; `elody:graphqlType` geeft het type.
- De Vlacc-declaratie bevat ~491 filters. Elke filter heeft `elody:key` met het
  documentpad in de vorm `"vlacc:1|<pad>"` (bv. `vlacc:1|properties.material_type.value`),
  een `elody:filterKind` (388× SelectionFilter, 58× TypeFilter, 40× TextFilter,
  5× DateFilter) en een `rdfs:label` dat een vertaalsleutel is.
- Dezelfde key komt in veel lijstqueries terug (tot 33×): **ontdubbelen op key**.
- Elke bibliografische entiteit heeft `audit.created.at/by` en `audit.updated.at/by`.
  Fase 1 kan dus uit de entiteiten zelf, zonder de auditlog.
- `sh:datatype` is bijna altijd `xsd:string`; `sh:in` komt niet voor. Typen leid je af
  uit `filterKind` en uit een steekproef van de data (stap 3), niet uit `sh:datatype`.
- Type-waarden zijn snake_case (`manifestation_word`, `work_serial`, `reading`, ...);
  de declaratie noemt ze in `sh:defaultValue` van de TypeFilters en in `elody:creationType`.

---

## Werkregels

- Werk op een branch `feat/analytics-poc` in `elody-generator` en, voor de overlay,
  in `elody-declarations`. Commit per stap.
- **Wijzig geen bestaande `*.ui.ttl`** en niets in `clients/` (de clientrepos).
  Alleen nieuwe bestanden, plus een nieuw CLI-commando.
- `pnpm test` en `pnpm check:all` (in elody-declarations) moeten groen blijven.
- De overlay staat **buiten** de `ui/`-map: de UI-loader leest alle Turtle in `ui/` als
  één graaf en valideert die tegen de UI-meta-shapes.
- Geen nieuwe `elody:`-termen in `elody-ontology`. Analytics-termen gaan in een eigen
  namespace (zie stap 2) en hergebruiken W3C Data Cube (`qb:`) waar het kan.
- Bij een open beslissing (onderaan): kies de standaard die er staat, noteer het in
  `docs/analytics-decisions.md` en ga door. Stop alleen als een stap echt niet kan.

---

## Stap 1 — Filterinventaris (`elody-ui analytics inventory`)

Nieuw commando in `src/cli.ts`, logica in `src/analytics/inventory.ts`.

```
elody-ui analytics inventory <declaration-dir> --translations <nl.json> --out <dir>
```

- Lees de declaratie met `loadDeclaration` en parse de graaf (bestaande turtle-helpers).
  Lees de filters rechtstreeks uit de graaf, niet via `UiEntity`, zodat ook filters in
  `elody:filtersFragment` meekomen.
- Per filter: eigenaar (graphqlType van de EntityUi, of fragmentnaam), `alias`, `key`,
  `filterKind`, `rdfs:label`, `optionsKey`, `optionsDistinctBy`, `dash:hidden`,
  `sh:defaultValue`s, en de type-waarden uit `elody:optionsInput` als die er zijn.
- Normaliseer de key: strip het `<client>:<versie>|`-voorvoegsel → documentpad.
  Keys zonder voorvoegsel (`type`, `createdfrom`) apart markeren.
- Ontdubbel op documentpad. Houd bij: aantal voorkomens, de entiteitstypes waar de
  filter op zit, alle aliassen.
- Stel per pad een **rol** voor (heuristiek, uitlegbaar in een kolom `reason`):
  - `type` of TypeFilter → `entity_type`
  - DateFilter → `time`
  - pad eindigt op `identifiers`, `id`, `_id`, `isbn`, `ean`, `email`, of het is
    een TextFilter → `identifier` (standaard uitgesloten)
  - pad bevat `title`, `name`, `description`, `wording`, `subtitle` → `text` (uitgesloten)
  - pad begint met `properties.ref_` of `lookup.` → `relation` (uitgesloten in fase 1)
  - overige SelectionFilter → `dimension` (standaard opgenomen)
- Zoek het Nederlandse label op via de vertaalsleutel.

**Output** in `<dir>`:
- `filters.json` (alles, ook de duplicaten, voor debugging)
- `candidates.json` en `candidates.md`: één rij per pad met pad, rol, reason,
  label nl, filterKind, # voorkomens, entiteitstypes, `include` (true/false).

**Klaar als**: het commando draait op de Vlacc-declaratie; `material_type`,
`bibliographic_type`, `target_audience`, `audit.created.at` en `audit.created.by`
staan in `candidates.md` met de juiste rol en label; er zijn vitest-tests op een
kleine fixture (ontdubbelen, voorvoegsel strippen, rollen).

---

## Stap 2 — Selectie-overlay (`analytics/vlacc.analytics.ttl`)

Genereer uit `candidates.json` een eerste overlay die een mens daarna aanpast:

```
elody-ui analytics overlay <candidates.json> --client vlacc
  --out ../elody-declarations/clients/vlacc/analytics/vlacc.analytics.ttl
```

Vorm (W3C Data Cube + eigen namespace `https://elody.eu/ns/analytics#`, prefix `ea:`):

```turtle
@prefix qb: <http://purl.org/linked-data/cube#> .
@prefix ea: <https://elody.eu/ns/analytics#> .
@prefix em: <https://elody.io/ns/metadata#> .

<#EntityActivity> a qb:DataStructureDefinition ;
  ea:sourceCollection "entities_actual" , "bibliographic_entities_actual" ;
  ea:entityTypes "work_word" , "manifestation_word" , "reading" , ... ;   # uit de TypeFilters
  qb:component
    [ qb:dimension em:type ;          ea:sourcePath "type" ;                       ea:role ea:EntityType ] ,
    [ qb:dimension em:created_at ;    ea:sourcePath "audit.created.at" ;           ea:role ea:Time ] ,
    [ qb:dimension em:created_by ;    ea:sourcePath "audit.created.by" ] ,
    [ qb:dimension em:material_type ; ea:sourcePath "properties.material_type.value" ] ,
    ... ;
  qb:component [ qb:measure ea:entityCount ; qb:order 1 ] .
```

- Property-IRI = `em:` + laatste zinvolle padsegment (het segment vóór `.value`).
- Schrijf ook een korte `analytics/README.md` in die client-map: wat de overlay is en hoe
  je een dimensie toevoegt of schrapt.

**Klaar als**: de overlay parst, alleen `include: true`-paden bevat en een kleine
SHACL-shape (`ontology/analytics.shapes.ttl` in deze repo) haar valideert
(elke component heeft `ea:sourcePath`, precies één `ea:Time`, precies één `ea:EntityType`).

---

## Stap 3 — Dataprofiel uit de lokale Mongo (`elody-ui analytics profile`)

Verifieer de overlay tegen echte data voor je schema's genereert.

```
elody-ui analytics profile <overlay.ttl> --mongo <uri> --db vlacc --sample 5000 --out <dir>
```

- Gebruik de lokale Mongo-container (`elody-common-mongo-1`, zie elody-declarations
  README, `ELODY_MONGO_CONTAINER`). Er staat ook een prod-dump in `~/mongo-dump-vlacc-prod`;
  restore die alleen lokaal en alleen als de container leeg is. **Nooit tegen prod verbinden.**
- Per pad en per entiteitstype: vulgraad, aandeel arrays vs. scalairen, BSON-type(s),
  aantal distincte waarden, top-10 waarden.
- Neem ook deze twee kandidaten voor *invoerbibliotheek* mee, ook als ze niet in de
  overlay staan: `properties.cataloging_source_agency.value` en `audit.created.by`
  (+ hoeveel distincte gebruikers, en of `users_actual`/groepen via `refUsers` een
  bibliotheek opleveren).

**Output**: `profile.json` + `profile.md`. Werk met de resultaten de overlay bij:
`ea:multiValued true` waar >1% arrays, en schrap paden met <5% vulgraad (noteer waarom).

**Klaar als**: `profile.md` bestaat en de beslissing over invoerbibliotheek is
voorbereid (tabel met beide kandidaten), niet genomen.

---

## Stap 4 — Generators (`elody-ui analytics generate`)

```
elody-ui analytics generate <overlay.ttl> --translations <nl.json> --out <dir>
```

Genereer uit overlay + declaratie + vertalingen:

1. **`clickhouse/001_raw.sql`**: `raw.vlacc_entities`
   - `id String`, `type LowCardinality(String)`, `created_at DateTime64(3, 'Europe/Brussels')`,
     `created_by String`, `updated_at DateTime64(3, 'Europe/Brussels')`, `updated_by String`,
     per dimensie `LowCardinality(String)` of `Array(LowCardinality(String))` (multiValued),
     `ingested_at DateTime`.
   - `ENGINE = ReplacingMergeTree(updated_at) ORDER BY (type, id)`.
2. **`clickhouse/010_mart.sql`**: views
   - `mart.entities_created_daily`: dag × type × elke enkelvoudige dimensie → `count()` op `FINAL`.
   - `mart.entities_created_by_<dim>` voor elke multiValued dimensie (met `arrayJoin`).
3. **`dlt/projection.json`**: collecties, typefilter (`type IN (...)`), Mongo-projectie
   van de paden, mapping pad → kolomnaam, incrementele cursor `audit.updated.at`.
4. **`superset/datasets/*.yaml`** in het Superset-importformaat: kolommen met
   `verbose_name` uit `nl.json`, `is_dttm` voor `created_at`, `groupby`/`filterable`
   voor dimensies, metriek `count` → "Aantal entiteiten".

Kolomnamen: snake_case van de property-IRI-lokale naam. Labels: vertaalsleutel →
`nl.json`, anders de lokale naam.

**Klaar als**: snapshot-tests op de gegenereerde SQL/YAML voor de Vlacc-overlay;
de SQL draait foutloos tegen een lege ClickHouse (`clickhouse-local` of container).

---

## Stap 5 — Lokale keten draaien (`poc/analytics/`)

In elody-declarations of een nieuwe map `poc/analytics/` in elody-common (kies één, noteer het):

- `docker-compose.yml` met ClickHouse en Superset (laatste stabiele versies; Superset ≥ 5,
  zodat de MCP-service later kan).
- `pipeline.py`: dlt met de MongoDB-bron (`dlt[mongodb]`), leest `dlt/projection.json`,
  schrijft naar ClickHouse (`dlt[clickhouse]`), `write_disposition="merge"` op `id`.
- `scripts/load_superset.sh`: importeert de dataset-YAML via de Superset-CLI/API.
- Eén dashboard **Catalogusinvoer**: trend van aangemaakte entiteiten per maand,
  verdeling per type, per materiaaltype en per bibliografisch type, filters op periode en
  type. Exporteer het als YAML naar `superset/dashboards/` zodat het reproduceerbaar is.

**Klaar als**: `scripts/verify.py` voor drie types en drie maanden de telling in ClickHouse
vergelijkt met `countDocuments` in Mongo (`audit.created.at` in die maand) en gelijk geeft;
een `poc/analytics/README.md` legt in tien regels uit hoe je het opstart.

---

## Stap 6 — Afronden

- `docs/analytics.md` in elody-generator: wat de commando's doen, de rolheuristiek, de
  overlay-vorm, en wat bewust niet gedaan is.
- Uren per stap noteren in `docs/analytics-decisions.md` (platform / connector / tenant):
  dat zijn de eenheden voor de CC-raming.
- Korte samenvatting voor Redmine #167487 (tekst in `docs/analytics-decisions.md`,
  niet zelf posten).

---

## Niet in deze opdracht

- Auditlog-ingestie (#139250): verwijderingen, wijzigingshistoriek, activiteit per gebruiker (fase 2).
- Row-level security per invoerbibliotheek (wacht op de beslissing hieronder).
- De `connector`-entiteit in elody en de self-service beheerlaag.
- Datakwaliteit (SHACL-validatierapporten in ClickHouse), Matomo, Kubernetes-deploy.
- Wijzigingen aan `elody-ontology` of aan bestaande declaraties.

## Open beslissingen (standaard tussen haakjes)

1. **Invoerbibliotheek**: `cataloging_source_agency` of `created_by` → groep?
   (geen standaard: voorbereiden in stap 3, Jeroen/Hannelore beslissen)
2. **Waar de code leeft**: nieuw subcommando in elody-generator of apart pakket?
   (elody-generator, `src/analytics/`)
3. **Bron**: Mongo rechtstreeks of de elody-API? (Mongo voor de POC; API is de productieweg)
4. **Verwijderde entiteiten**: tellen ze mee in "aangemaakt"? (nee in fase 1; auditlog in fase 2)
5. **Overlay-namespace**: `https://elody.eu/ns/analytics#` (`ea:`) (zo, tot er een eigen
   ontologie-map in elody-ontology komt)
