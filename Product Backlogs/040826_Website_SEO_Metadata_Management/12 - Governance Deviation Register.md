CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 12 — Governance Deviation Register

# Website SEO Metadata Management · Epic 040826

| | |
|--|--|
| **Task ID** | `040826_Website_SEO_Metadata_Management` |
| **Document** | Governance Deviation Register + Owner Final Decision Lock |
| **Date** | 2026-08-10 |
| **Status** | 🔒 **OWNER FINAL DECISION RECORDED** |
| **SoT** | [`03 - Governing SoT.md`](03%20-%20Governing%20SoT.md) · 🔒 OWNER LOCKED rev. **B.3** |
| **Solution** | [`04 - Solution Design.md`](04%20-%20Solution%20Design.md) · **Rev D.1.2** · 🔒 OWNER LOCKED (absorb 2026-08-10) |
| **Audit Delta** | [`13 - Audit Delta Owner Final Decision.md`](13%20-%20Audit%20Delta%20Owner%20Final%20Decision.md) |
| **Plan** | [`05 - Plan.md`](05%20-%20Plan.md) · **A.2** aligned · Impl STOPPED |
| **Versioning** | [`../100826_SEO_Metadata_Versioning_Rollback_Foundation/00-README.md`](../100826_SEO_Metadata_Versioning_Rollback_Foundation/00-README.md) · NOTSTART |

---

## 0. Hard stop

```text
IMPLEMENTATION = STOPPED
Không code · không deploy · không Plan mới cùng Epic · không tự mở Wave B
Không absorb code ngược · không dùng Production = Architecture PASS
Không GSC/SERP thay Architecture Verification
```

Chuỗi bắt buộc:

```text
Owner Decision → Governance Register → Audit Delta → SoT amendment
→ Solution amendment → Plan 05 alignment → STOP & REPORT
```

---

## 1. Owner Final Decision Lock (I–XVIII)

| # | Topic | Owner lock |
|---|--------|------------|
| I | Homepage `/` | Community = Homepage; `/` public entry; `PATH_TO_PAGE_KEY['/']=community` — KEEP behavior; **bind SoT/Solution** trước architecture fact |
| II | SEO AUTO | Rule-driven: Admin template → deterministic resolve → optional override. **AUTO ≠ AI** |
| III | Favicon | Global-only; page-level REMOVE (UI done; API residual → Audit `13`) |
| IV | Article | KEEP current desc override + verify OG; **no refactor** |
| V | Entity SEO | Template one-shot / type (Stock/Sector/Eco/Story); deterministic |
| VI | Entity OG/Social | One config / entity type; KEEP/consume if equivalent |
| VII | Other pages | Keep Admin config; no auto-expand |
| VIII | Zalo | **A** = crawler; Audit→SoT/Solution→Plan trước code; existing shell only |
| IX | Breadcrumb | **B** DEFER Wave C; no SOL-BC Wave B; no BR-22/SC-09 PASS |
| X | Pagination | Audit first — **no self N/A**; evidence in `13` → **N/A** |
| XI | Versioning | Foundation backlog **NOTSTART** (ngoài Epic) |
| XII | Image ALT | **A** Audit→Solution→Plan; **tách** Social format |
| XIII | Social JPEG/PNG | **A** tách ALT; Audit→Solution amend nếu thiếu |
| XIV | Admin AUTO | Definition CLOSED; BR-01.3 **PASS** (Owner 2026-08-11) |
| XV | WATCH/SEARCH | **LOCK #2** — không đụng |
| XVI | GSC/SERP | Sau ổn định; Architecture + Production + GSC |
| XVII | former_slugs+301 | **KEEP** = official Solution; absorb mechanism; **không revert** |
| XVIII | Singleton detector | **KEEP** expansion; **≠** Singleton architecture PASS |

---

## 2. Deviation Register (post-Owner)

| Change | Pre-Owner | Post-Owner verdict | Absorb / next |
|--------|-----------|--------------------|---------------|
| `/` → community shell + identity | UNRESOLVED / DEVIATION | **KEEP** Owner Homepage Lock | SoT B.3 · Solution D.1.2 |
| `PATH_TO_PAGE_KEY['/']=community` | DEVIATION | **KEEP** | Absorb cùng Homepage |
| Absolutize OG/favicon/logo | AUTHORIZED | **KEEP** | None |
| `cau-chuyen` PAGE_KEY_TO_PATH | AUTHORIZED | **KEEP** | None |
| Singleton detector expand | AUTHORIZED | **KEEP** ≠ arch PASS | Note SoT/Solution |
| former_slugs + 301 | DEVIATION | **KEEP** official | SoT+Solution mechanism |
| Page-level favicon UI | — | **REMOVED** | Residual API → post-GO cleanup |
| Article SEO desc override | — | **KEEP** | No code |
| Entity template / OG-once | — | **OWNER LOCK** | Bind SoT/Solution; consume runtime nếu đủ |
| Zalo crawler | Undecided | **A** | Audit `13` → amend → Plan; **no code this turn** |
| Breadcrumb SOL-BC | Gap | **DEFER Wave C** | Residual doc |
| Pagination | Gap | **N/A bằng evidence** (`13`) | Re-open nếu Product ship `?page=` identity |
| Versioning | Gap | **DEFER** Foundation NOTSTART | Backlog ngoài Epic |
| Image ALT | Gap | **Policy LOCKED** 2026-08-11 | D.1.3 §P · slice `16`; Admin OG ALT field **chờ GO** |
| Social JPEG/PNG | Gap | **AUDIT → Solution** | WebP-only; PNG 404 |
| WATCH/SEARCH | Lock #2 | **LOCK** | No coverage |
| GSC/SERP | Gap | Deferred evidence | Not arch substitute |

---

## 3. Homepage identity model (Owner Lock — bind)

**Không invent redirect/canonical policy mới.** Model governed để tránh duplicate SEO identity:

| Surface | Governed |
|---------|----------|
| Public entry | `/` = Community Homepage entry |
| Page identity / pageKey | `community` |
| Clean SEO identity | `/cong-dong` |
| Canonical / og:url / SD URL (shell `/` và `/cong-dong`) | Clean identity `https://iflux.vn/cong-dong` |
| Crawler shell | Community Contract |
| SPA | Community |
| Sitemap | `/cong-dong` (một SEO identity; không hai identity indexable song song) |

Proof target: `/` và `/cong-dong` **không** tạo hai Clean SEO identity trái BRD.

---

## 4. Classification (XXI)

### KEEP / AUTHORIZED
Homepage Community · PATH_TO_PAGE_KEY · Absolutize · cau-chuyen · detector expand · former_slugs+301 · Article override · rule-driven AUTO · global favicon · entity template · entity-type OG/Social

### DEFER
Breadcrumb → Wave C · Versioning → Foundation NOTSTART · WATCH/SEARCH → LOCK

### AUDIT FIRST (done in `13`)
Pagination · ALT · Social JPEG/PNG · Zalo · Favicon API residual

### MUST NOT CLAIM PASS
Singleton architecture · BR-34.4 / SC-32 · GSC/SERP · full BR-18.1 (beyond P4 `og:image:alt`) · Pagination (N/A)

### OWNER PASS LOCK
**BR-01.3** — 2026-08-11

---

# Appendix — Owner Clarification 2026-08-11 (4 residual areas)

| Area | Owner decision |
|------|----------------|
| Singleton | **DEFER** — no architecture redesign GO; keep FAIL/PARTIAL; detector ≠ PASS |
| Image ALT | **Policy LOCKED** — optional OG Image ALT override; reuse `cover.alt`; chain override→cover→title→fallback→empty; no AI; empty OK; **impl residual chờ GO** |
| Breadcrumb | **DEFER Wave C** |
| Versioning/Rollback | **NOTSTART** Foundation |
| BR-01.3 | **PASS** (Owner) — AUTO mechanism exists; no further UX-proof scope |

Pointers: Solution Appendix **D.1.3** · Plan **§14 A.2.1**.

**STOP — no Implementation GO from this clarification.**
