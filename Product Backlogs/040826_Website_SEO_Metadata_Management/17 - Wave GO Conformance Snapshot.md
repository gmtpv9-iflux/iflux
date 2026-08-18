CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 17 — Wave GO Conformance Snapshot

# Epic 040826 · after Implementation GO P0–P4 · 2026-08-10

| | |
|--|--|
| **Authority** | BRD `01` · SoT B.3 · Solution D.1.2+D.1.3 · Plan A.2.1 · GO `14` · Evidence `15` |
| **Mode** | Snapshot + Owner Clarification 2026-08-11 — **không** đóng epic · **không** Implementation GO |

---

## In-scope GO items

| Area | Evidence | Snapshot |
|------|----------|----------|
| Homepage Community + anti-duplicate | `15` P0 | **Aligned** Production |
| former_slugs + 301 | `15` P0 | **Aligned** Production |
| Favicon global-only | `15` P1 | **Aligned** |
| Zalo crawler via existing shell | `15` P2 | **Aligned** |
| Social JPEG/PNG absolute + public | `15` P3 | **Aligned** |
| Image ALT Contract emit | `15` P4 · Solution `16` | **Aligned** (slice; not full BR-18.1 CMS) |
| Admin ALT ảnh OG (optional) | GO 2026-08-11 · `16` | **Aligned** Production |
| Breadcrumb SOL-BC | Wave C 2026-08-11 · Audit `19` | **PASS scoped** (bot Clean + Contract); Visible entity PARTIAL · Human hub = Singleton DEFER |

---

## Explicitly NOT PASS / DEFER (Owner 2026-08-11)

| Item | Owner position |
|------|----------------|
| Singleton architecture / BR-34.4 / SC-32 | **DEFER** — no redesign GO; detector ≠ PASS |
| Full BR-18.1 beyond `og:image:alt` | Admin OG Image ALT **DONE** 2026-08-11; broader HTML `<img alt>` CMS still out |
| Breadcrumb / SC-09 | **Wave C DONE** — Audit `19` PASS scoped; Visible entity PARTIAL |
| Versioning / SC-17/18 / ROLL | **NOTSTART** Foundation |
| WATCH / SEARCH | **LOCK #2** |
| GSC / SERP | Deferred evidence track |
| Pagination | **N/A** (Audit `13`) |

## Owner PASS lock

| Item | Decision |
|------|----------|
| **BR-01.3** | **PASS** (2026-08-11) — AUTO rule/template exists; no further UX-proof scope |

---

## Architecture verification reminder

```text
Architecture verification
+ Production behavior verification
+ GSC/SERP (later)
```

---

## Recommendation to Owner

Clarification absorbed. Wave C Breadcrumb **DONE**.  
**STOP** — còn Singleton DEFER · Versioning NOTSTART · WATCH/SEARCH LOCK · GSC deferred.
