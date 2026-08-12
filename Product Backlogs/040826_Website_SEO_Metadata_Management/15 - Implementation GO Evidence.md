CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 15 — Implementation GO Evidence

# Epic 040826 · scoped GO [`14`](14%20-%20Implementation%20GO%20Scoped.md)

| | |
|--|--|
| **Execution SoT** | Plan **A.2** |
| **Started** | 2026-08-10 |
| **Wave P0–P4** | **CLOSED with evidence** |

---

## P0 — Verify / close existing authorized code

**Status: PASS — no code change**

### Homepage identity + anti-duplicate (PD-11)

| Check | `/` Googlebot | `/cong-dong` Googlebot |
|-------|---------------|------------------------|
| title | iFlux \| Cộng đồng chứng khoán | same |
| canonical / og:url / SD url | `https://iflux.vn/cong-dong` | same |
| pageKey / nginx | community / `@seo_shell_community` | same |
| sitemap `https://iflux.vn/` | **0** | — |
| sitemap `…/cong-dong` | **1** | — |

### former_slugs + 301 (PD-14)

| Check | Result |
|-------|--------|
| Former slug probe | **HTTP 301** → current Clean article path |
| Unknown slug | **HTTP 404** |

---

## P1 — Favicon global-only (PD-13)

**Status: PASS**

| Change | Detail |
|--------|--------|
| Resolver | Skip PAGE for `faviconUrl` (GLOBAL only) |
| API/service | Strip `faviconUrl`/`faviconAssetId` on page PUT |
| DB | Cleared residual keys on **20** page configs |
| UI | Already removed; save body no longer sends favicon |
| Prod head | Hub still emits global favicon link |

---

## P2 — Zalo crawler (PD-17)

**Status: PASS**

| Change | Detail |
|--------|--------|
| Hub UA regex | Added `ZaloShare\|Zalo` → existing `418` / `@seo_shell_*` |
| Article | Zalo → existing `open-graph` pipe (WhatsApp/FBAN still Human) |
| Verify hub Zalo | Full title + canonical `/cong-dong` + OG |
| Verify article Zalo | open-graph HTML + OG tags |

**No separate Zalo SEO pipeline.**

---

## P3 — Social JPEG/PNG (PD-20 social)

**Status: PASS**

| Change | Detail |
|--------|--------|
| nginx | `location ^~ /media/` so `*.original.png` not stolen by static `*.png` regex |
| Media | `resolveSocialCompatiblePublicUrl` prefers original jpeg/png variant |
| Contract | apply after build (hub + article) |
| Verify hub OG | `…/img-001.original.png` · **200 image/png** |
| Verify article OG | `….original.jpeg` absolute |

**ALT not touched in P3.**

---

## P4 — Image ALT (PD-20 ALT)

**Status: PASS** (slice [`16`](16%20-%20Solution%20Slice%20Image%20ALT.md))

| Change | Detail |
|--------|--------|
| Chain | `og_image_alt` → `cover.alt` → title → hub title fallback |
| Emit | `og:image:alt` when image present |
| Verify hub | alt = page title |
| Verify article | alt = article title |

**Social format not reopened.**

---

## Forbidden scope — untouched

| Item | Status |
|------|--------|
| Singleton architecture / BR-34.4 claim | **Not modified** |
| BR-01.3 PASS project | **Not claimed** |
| Breadcrumb / SOL-BC | **Not opened** |
| Versioning | **NOTSTART backlog only** |
| WATCH / SEARCH | **Lock held** |
| GSC / SERP ops | **Not run as arch substitute** |

---

## Wave-end note

Full BRD Conformance rerun → [`17 - Wave GO Conformance Snapshot.md`](17%20-%20Wave%20GO%20Conformance%20Snapshot.md).
