# 05 — Plan

# Site Metadata, Asset & Dynamic Configuration Foundation

| | |
|--|--|
| **Task ID** | `090826_Site_Metadata_Asset_Dynamic_Configuration_Foundation` |
| **BRD** | [`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md) · §16 · §8 IA · 🔒 OWNER LOCKED |
| **Audit** | [`02 - Mandatory-Audit.md`](02%20-%20Mandatory-Audit.md) · Rev A · ✅ OWNER APPROVED |
| **SoT** | [`03 - Governing SoT.md`](03%20-%20Governing%20SoT.md) · Rev B.2 · 🔒 OWNER APPROVED |
| **Solution** | [`04 - Solution Design.md`](04%20-%20Solution%20Design.md) · **Rev A.2** · 🔒 OWNER LOCKED |
| **Document** | Plan — execution index (Governance §2.6) |
| **Date** | 2026-08-09 |
| **Rev** | **A.1** — Owner LOCK + safety rules (review): PL-01 observe-only · media audit-gate · PL-09≠Verification · Convention A · field-state+source |
| **Status** | 🔒 **OWNER LOCKED** (2026-08-09) — Implementation **AUTHORIZED** theo Plan · Verification = `06` riêng |
| **Related** | Downstream SEO epic `040826_…` = **PENDING** · **không** mở trong Plan này |
| **Supersedes** | File Plan trước (sai Task ID Community Article / Entity Auto-Linking) — **void** |

> Plan = **execution index**. Không redesign BRD / Audit / SoT / Solution.  
> Trace: `BR → AUD → SOT → SOL → PLAN → Impl → Evidence handoff → 06 Verification → Closure`.

---

# 0. Gate & hierarchy

```text
01 BRD          🔒 LOCKED (+ §8 Thiết lập SEO)
02 Audit        ✅ APPROVED
03 SoT          🔒 APPROVED (B.2)
04 Solution     🔒 LOCKED (A.2 · OD-SOL-01…03)
05 Plan         🔒 OWNER LOCKED  ← THIS
06 Impl         ✅ AUTHORIZED (theo Plan)
07 Verification `06 - Verification-Evidence` — sau PL-09 handoff
```

**Cấm** tuyên bố BR PASS / đóng task ở tầng Impl. Chỉ `06 Verification` + Owner acceptance mới đóng.

---

## 0.1 Implementation safety rules (bắt buộc)

1. Inspect existing implementation **before** creating new code/schema.
2. Reuse existing services, stores, routes, permissions, Media Library, page catalog where authoritative.
3. Do not create duplicate authority, resolver, media pipeline, permission domain, or Admin IA.
4. Do not delete legacy until replacement is live **and** verified.
5. Do not change unrelated modules.
6. Every migration must be backward-compatible with current Production.
7. Every runtime change must have a rollback path.
8. **No schema/API before inventory** (PL-01 complete; per-area audit gates).

---

# 1. Plan purpose

Chuyển Solution A.2 thành chuỗi workstream có dependency + acceptance, để:

1. Global / Page / Article configuration persistent + Admin + runtime.
2. Asset authority reuse Media Library (mở scope GLOBAL/PAGE).
3. Effective resolver `ARTICLE > PAGE > GLOBAL > FALLBACK`.
4. Admin IA đúng **Thiết lập SEO** (hệ thống + từng trang).
5. Field state `INHERITED | OVERRIDDEN | INVALID | UNSET`.
6. OG/Social: semantic độc lập · shared-default asset.
7. Migrate legacy (hardcode / manifest / localStorage orphan) không phá public/Admin.
8. **Không** làm SEO epic (sitemap/robots/SERP/…).
9. **Không** Entity Auto-Linking / Article Detail Optimization (task khác).

---

# 2. Owner locks Plan must obey

| ID | Lock | Plan implication |
|----|------|------------------|
| **OD-SOL-01** | Field state indicator | PLAN-P5 Admin surfaces MUST show states |
| **OD-SOL-02** | OG/Social shared-default | PLAN-P3 model 2 semantic fields + default share |
| **OD-SOL-03** | **Thiết lập SEO** IA | PLAN-P5: parent + 2 children; **cấm** Brand; **cấm** Cài đặt Trang |

```text
Nhận diện thương hiệu          ← giữ; không Global SEO form
Thiết lập SEO                  ← NEW
 ├── Thiết lập SEO hệ thống
 └── Thiết lập SEO từng trang
Cài đặt Trang                  ← placement ONLY
Article edit SEO               ← reuse
```

---

# 3. Workstream model

```text
P0  Baseline & Audit inventory freeze
 ↓
P1  Persistence authority (Global / Page / Asset usage)
 ↓
P2  Effective resolver (+ public-read projection)
 ↓
P3  Asset pipeline extend (GLOBAL/PAGE) + OG/Social model
 ↓
P4  Article integrate into shared resolver (reuse pipeline)
 ↓
P5  Admin IA: Thiết lập SEO (sys + page) + RBAC + field-state
 ↓
P6  Runtime / public HTML consume (hub + article)
 ↓
P7  Legacy migrate → verify → cleanup
 ↓
P8  Evidence A/B/C + closure (BR checklist)
```

Không skip P0. Không cleanup legacy trước P7 verify PASS.

---

# 4. Plan decisions (execution — trong quyền Plan)

Solution để mở schema/API/route. Plan **chốt hướng triển khai** (đổi phải Owner/Solution nếu phá constraint):

| # | Decision | Choice |
|---|----------|--------|
| D1 | Global persistence | **EXTEND** `marketing_brand_identity.payload` với BR-01 fields — **không** second Global authority; **không** tách JSON thành nhiều cột trừ khi Owner/Solution khóa sau |
| D2 | Page persistence | **CREATE** persistent Page SEO config keyed by existing `pageKey` (catalog); **không** ghi vào `page_published_versions` placement artifact |
| D3 | Article persistence | **REUSE** `community_posts.payload.seo` + cover; extend OG/social semantic fields nếu thiếu |
| D4 | Asset | **EXTEND** Media Library + `media_usages` cho GLOBAL/PAGE **without breaking ARTICLE** — audit schema/callers trước mọi migration |
| D5 | Resolver | **CREATE** one semantic effective-config resolver (BE và/hoặc shared contract); Article `resolveArticleMetadata` **REFACTOR** để consume Global/Page + bỏ hardcode `site_name` authority |
| D6 | Public read | Public-safe effective config API **hoặc** server HTML inject — **không** gọi Admin API từ User Web |
| D7 | Admin routes | Nav labels khóa OD-SOL-03; Convention A `app/{module}/{page}.html` + existing `tiep-thi`↔`marketing` — **cấm** index.html/nested architecture mới |
| D8 | Permissions | New perms dưới domain SEO config (view/edit global + page); reuse media + article perms; Brand perm **không** thay SEO perm |
| D9 | Out of scope | Category SEO, Content Engine merge, sitemap/robots/SERP, Entity auto-link |

---

# 5. Workstreams detail

## P0 — Baseline & inventory

### PLAN-P0-01 — Freeze baseline
Ghi commit/hash, Prod smoke (favicon 404, `/home` title-only, article pipeline OK).

**AC:** Baseline recorded; **no code change**.

### PLAN-P0-02 — Existing capability inventory
Inventory đúng Audit §1 + SoT §26 → KEEP / EXTEND / MIGRATE / DELETE.

**PL-01 MUST:** observe → record → classify.

**PL-01 MUST NOT:**
- refactor / migration / cleanup
- fix favicon / metadata
- change Admin IA
- modify runtime behavior
- “tiện tay sửa” bất kỳ gap Prod

**Serves:** BR-06,11 · AUD-OWN · V1–V8 · SOT-25/26 · SOL-15/23

---

## P1 — Persistence

### PLAN-P1-01 — Global config persistence
**EXTEND** existing `marketing_brand_identity.payload` với đủ BR-01 fields. Admin write qua SEO Global API — **không** Brand UI. **Không** second Global authority.

### PLAN-P1-02 — Page config persistence
Store per-page overrides (title/desc/OG/social); null = inherit.

### PLAN-P1-03 — Asset usage scope (audit-first)
**Before migration:**
1. Inspect `media_usages` schema + constraints
2. Inspect all usages / `upsertUsage` callers
3. Preserve ARTICLE semantics
4. Reuse columns where possible
5. Only migrate confirmed missing GLOBAL/PAGE capability
6. **Forbidden:** parallel usages model that breaks Article

**Serves:** BR-01,02,03,06 · SOT-02/03/10/12 · SOL-03/04/07/08

---

## P2 — Effective resolver

### PLAN-P2-01 — Shared resolver semantics
Implement field-level resolve: Article > Page > Global > Fallback. States: INHERITED/OVERRIDDEN/UNSET/INVALID.

**AC:** Matrix test (PLAN-P8) khớp SoT examples; empty ≠ clear inherit.

### PLAN-P2-02 — Public-safe projection
Tách Admin write model vs public effective read.

**AC:** Public không nhận perm/internal fields.

**Serves:** BR-07,08,10,13.5 · SOT-05…08,20 · SOL-06/10/21

---

## P3 — Assets & OG/Social

### PLAN-P3-01 — Wire Media Library to Global/Page config
Upload/replace favicon, logo, default OG/social, page images qua Media.

**AC:** No FileReader→localStorage path; orphan brand upload **không** dùng.

### PLAN-P3-02 — OD-SOL-02 OG/Social model
Hai semantic fields; default shared asset; independent override.

**AC:** Shared default + separate override cases verified.

**Serves:** BR-01.3–01.8, BR-02, BR-03.5–03.6 · OD-SOL-02 · SOL-07/09

---

## P4 — Article integration

### PLAN-P4-01 — Reuse article Admin + payload
Giữ Community article SEO UI; bổ sung OG/social theo model nếu thiếu field riêng.

### PLAN-P4-02 — Refactor `resolveArticleMetadata`
Consume Global/Page via shared resolver; `site_name` từ Global (fallback only nếu thiếu).

### PLAN-P4-03 — Keep Pipeline A/B
nginx open-graph/spa tiếp tục; head từ effective meta.

**AC:** Article bots/HTML vẫn OK; inherit Global/Page khi article unset.

**Boundary:** Content Engine **không** merge (SOT-17).

**Serves:** BR-04,08,09,11 · SOL-05/09/11 · V5

---

## P5 — Admin IA (OD-SOL-03)

### PLAN-P5-01 — Convention A gate rồi Nav + routes **Thiết lập SEO**
**Before creating pages:** inspect Convention A `app/{module}/{page}.html`, Nginx rewrite, `iflux-admin-routes.js`, sibling Brand pages. **Cấm** `index.html` / nested architecture mới.

Thêm parent + 2 children cùng cấp Nhận diện thương hiệu. Labels tiếng Việt khóa.

### PLAN-P5-02 — Thiết lập SEO hệ thống
Form Global đủ BR-01; asset pickers; save → persistence P1.

### PLAN-P5-03 — Thiết lập SEO từng trang
Chọn pageKey từ catalog; edit overrides.

### PLAN-P5-04 — Field-state + source (OD-SOL-01)
MUST expose `INHERITED|OVERRIDDEN|UNSET|INVALID` **và effective source** (vd. Inherited ← Thiết lập SEO hệ thống). Visual = DS only — không khóa pixel.

### PLAN-P5-05 — Article SEO surface + RBAC
Reuse edit.html; SEO perms riêng; Brand perm ≠ SEO perm.

**Serves:** BR-05,07.8,13 · OD-SOL-01/03 · SOL-03/04/12/13 · SOT-15/18/19

---

## P6 — Runtime / public HTML

### PLAN-P6-01 — Hub / public pages consume effective Page+Global
### PLAN-P6-02 — Favicon / logo public
### PLAN-P6-03 — Hardcode chỉ temporary fallback
Legacy hardcode MAY remain only as **explicitly temporary** migration fallback. MUST NOT remain primary authority. Every temporary fallback MUST have cleanup in **P7/PL-08**.

**Serves:** BR-08,09,01.10 · V2/V7/V8 · SOL-10/11/14

---

## P7 — Legacy migration

### PLAN-P7-01…03 — Search → enumerate → migrate → verify → remove
Map manifests; delete orphan localStorage brand; remove temporary hardcode — **no permanent fallback**.

**Serves:** BR-06.6,06.10,11 · SOT-24 · SOL-15/16 · V3/V7

---

## P8 — Evidence preparation & Verification handoff

### PLAN-P8 / PL-09
Prepare A/B/C **per atomic BR-xx.y** + matrices + regression Article/placement.  
Trace: `BR → AUD → SOT → SOL → Plan ticket → EV-BR-xx.y`.  
Mark **Impl tickets** DONE khi AC ticket đạt.  
**MUST NOT** declare BR PASS / task closure.  
Handoff → `06 - Verification-Evidence`.

**Serves:** handoff only — Verification owns PASS

---

# 6. Implementation ticket map

| Ticket | Scope | Depends | WS |
|--------|-------|---------|-----|
| PL-01 | Baseline + inventory | — | P0 |
| PL-02 | Global + Page persistence + asset usage | PL-01 | P1 |
| PL-03 | Effective resolver + public projection | PL-02 | P2 |
| PL-04 | Media Global/Page + OG/Social model | PL-02 | P3 |
| PL-05 | Article resolver integrate + Pipeline keep | PL-03, PL-04 | P4 |
| PL-06 | Admin Thiết lập SEO (nav+2 pages) + RBAC + field-state | PL-02, PL-03 | P5 |
| PL-07 | Public HTML / favicon / hub consume | PL-03, PL-05, PL-06 | P6 |
| PL-08 | Legacy migrate + orphan delete | PL-07 | P7 |
| PL-09 | Evidence A/B/C + closure | PL-08 | P8 |

---

# 7. Plan Checklist — BR → Audit → SoT → Solution → Plan (Governance §2.6)

Status lúc Plan draft = **PLANNED** (chưa DONE). Impl cập nhật → DONE / BLOCKED.

### 7.1 BR-01 Global

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-01 | BR-01.1 | AUD-01.1 | SOT-02/14 | SOL-03 | P1+P5-02 | PLANNED |
| BR-01 | BR-01.2 | AUD-01.2 | SOT-02 | SOL-03 | P1+P5-02 | PLANNED |
| BR-01 | BR-01.3 | AUD-01.3 | SOT-10/14 | SOL-03/07 | P1+P3+P5-02+P6 | PLANNED |
| BR-01 | BR-01.4 | AUD-01.4 | SOT-10/14 | SOL-03/07 | P1+P3+P5-02+P6 | PLANNED |
| BR-01 | BR-01.5 | AUD-01.5 | SOT-02 | SOL-03 | P1+P5-02 | PLANNED |
| BR-01 | BR-01.6 | AUD-01.6 | SOT-02 | SOL-03 | P1+P5-02 | PLANNED |
| BR-01 | BR-01.7 | AUD-01.7 | SOT-02/13 | SOL-03/09 | P1+P3+P5-02 | PLANNED |
| BR-01 | BR-01.8 | AUD-01.8 | SOT-02/13 | SOL-03/09 | P1+P3+P5-02 | PLANNED |
| BR-01 | BR-01.9 | AUD-01.9 | SOT-02 | SOL-03 | P1 | PLANNED |
| BR-01 | BR-01.10 | AUD-01.10 | SOT-08/14 | SOL-03/10 | P2+P6 | PLANNED |

### 7.2 BR-02 Asset

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-02 | BR-02.1 | AUD-02.1 | SOT-10 | SOL-07 | P3+P5 | PLANNED |
| BR-02 | BR-02.2 | AUD-02.2 | SOT-10/12 | SOL-07/08 | P1-03+P3 | PLANNED |
| BR-02 | BR-02.3 | AUD-02.3 | SOT-10 | SOL-07 | P3 | PLANNED |
| BR-02 | BR-02.4 | AUD-02.4 | SOT-11 | SOL-07/14 | P3 | PLANNED |
| BR-02 | BR-02.5 | AUD-02.5 | SOT-11 | SOL-07/14 | P3 | PLANNED |
| BR-02 | BR-02.6 | AUD-02.6 | SOT-10/12 | SOL-07 | P3+P5 | PLANNED |
| BR-02 | BR-02.7 | AUD-02.7 | SOT-12 | SOL-08 | P3 | PLANNED |
| BR-02 | BR-02.8 | AUD-02.8 | SOT-10/14 | SOL-07/15 | P3+P7 | PLANNED |
| BR-02 | BR-02.9 | AUD-02.9 | SOT-08/10 | SOL-07/10 | P3+P6 | PLANNED |
| BR-02 | BR-02.10 | AUD-02.10 | SOT-10/12 | SOL-07 | P3+P7 | PLANNED |

### 7.3 BR-03 Page

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-03 | BR-03.1 | AUD-03.1 | SOT-03 | SOL-04 | P1-02+P5-03 | PLANNED |
| BR-03 | BR-03.2 | AUD-03.2 | SOT-15 | SOL-04 · OD-03 | P5-01/03 | PLANNED |
| BR-03 | BR-03.3 | AUD-03.3 | SOT-03/24 | SOL-04 | P1+P5-03 | PLANNED |
| BR-03 | BR-03.4 | AUD-03.4 | SOT-03/24 | SOL-04 | P1+P5-03 | PLANNED |
| BR-03 | BR-03.5 | AUD-03.5 | SOT-03/13 | SOL-04/09 | P1+P3+P5-03 | PLANNED |
| BR-03 | BR-03.6 | AUD-03.6 | SOT-03/13 | SOL-04/09 | P1+P3+P5-03 | PLANNED |
| BR-03 | BR-03.7 | AUD-03.7 | SOT-03 | SOL-04 | P1-02 | PLANNED |
| BR-03 | BR-03.8 | AUD-03.8 | SOT-05 | SOL-02/06 | P2 | PLANNED |
| BR-03 | BR-03.9 | AUD-03.9 | SOT-05/06 | SOL-02/06 | P1+P2 | PLANNED |
| BR-03 | BR-03.10 | AUD-03.10 | SOT-07/08 | SOL-06/10 | P2+P6 | PLANNED |

### 7.4 BR-04 Article

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-04 | BR-04.1 | AUD-04.1 | SOT-04/17 | SOL-05 | P4 | PLANNED |
| BR-04 | BR-04.2 | AUD-04.2 | SOT-04 | SOL-05 | P5-04 | PLANNED |
| BR-04 | BR-04.3 | AUD-04.3 | SOT-04 | SOL-05 | P4/P5-04 | PLANNED |
| BR-04 | BR-04.4 | AUD-04.4 | SOT-04 | SOL-05 | P4/P5-04 | PLANNED |
| BR-04 | BR-04.5 | AUD-04.5 | SOT-04/13 | SOL-05/09 | P3+P4 | PLANNED |
| BR-04 | BR-04.6 | AUD-04.6 | SOT-04/13 | SOL-05/09 | P3+P4 | PLANNED |
| BR-04 | BR-04.7 | AUD-04.7 | SOT-04 | SOL-05 | P4 | PLANNED |
| BR-04 | BR-04.8 | AUD-04.8 | SOT-05 | SOL-05/06 | P2+P4 | PLANNED |
| BR-04 | BR-04.9 | AUD-04.9 | SOT-05/06 | SOL-05/06 | P2+P4 | PLANNED |
| BR-04 | BR-04.10 | AUD-04.10 | SOT-04/08/09 | SOL-05/11 | P4+P6 | PLANNED |

### 7.5 BR-05 Admin

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-05 | BR-05.1 | AUD-05.1 | SOT-02/18 | SOL-03 | P5-01/02 | PLANNED |
| BR-05 | BR-05.2 | AUD-05.2 | SOT-15/18 | SOL-04 | P5-01/03 | PLANNED |
| BR-05 | BR-05.3 | AUD-05.3 | SOT-04/18 | SOL-05 | P5-04 | PLANNED |
| BR-05 | BR-05.4 | AUD-05.4 | SOT-18 | SOL-12 | P5 | PLANNED |
| BR-05 | BR-05.5 | AUD-05.5 | SOT-18 | SOL-12 | P5 | PLANNED |
| BR-05 | BR-05.6 | AUD-05.6 | SOT-18 | SOL-12 | P5 | PLANNED |
| BR-05 | BR-05.7 | AUD-05.7 | SOT-10/18 | SOL-07/12 | P3+P5 | PLANNED |
| BR-05 | BR-05.8 | AUD-05.8 | SOT-08/18 | SOL-12 | P5+P6 | PLANNED |
| BR-05 | BR-05.9 | AUD-05.9 | SOT-18 | SOL-12 | P5 | PLANNED |
| BR-05 | BR-05.10 | AUD-05.10 | SOT-18/19 | SOL-12/13 | P5-05 | PLANNED |

### 7.6 BR-06 Persistence & authority

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-06 | BR-06.1 | AUD-06.1 | SOT-02 | SOL-03 | P1-01 | PLANNED |
| BR-06 | BR-06.2 | AUD-06.2 | SOT-03 | SOL-04 | P1-02 | PLANNED |
| BR-06 | BR-06.3 | AUD-06.3 | SOT-04 | SOL-05 | P4 | PLANNED |
| BR-06 | BR-06.4 | AUD-06.4 | SOT-10/12 | SOL-07/08 | P1-03 | PLANNED |
| BR-06 | BR-06.5 | AUD-06.5 | SOT-02/07/25 | SOL-01/22 | P1+P2 | PLANNED |
| BR-06 | BR-06.6 | AUD-06.6 | SOT-02/14 | SOL-03/14 | P6+P7 | PLANNED |
| BR-06 | BR-06.7 | AUD-06.7 | SOT-07/08 | SOL-06/10 | P2+P6 | PLANNED |
| BR-06 | BR-06.8 | AUD-06.8 | SOT-18 | SOL-12 | P5 | PLANNED |
| BR-06 | BR-06.9 | AUD-06.9 | SOT-01 | SOL-01/02 | P1 | PLANNED |
| BR-06 | BR-06.10 | AUD-06.10 | SOT-08/24 | SOL-15 | P6+P7 | PLANNED |

### 7.7 BR-07 Inheritance

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-07 | BR-07.1 | AUD-07.1 | SOT-02/05 | SOL-02/03 | P1+P2 | PLANNED |
| BR-07 | BR-07.2 | AUD-07.2 | SOT-03/05 | SOL-04/06 | P1+P2 | PLANNED |
| BR-07 | BR-07.3 | AUD-07.3 | SOT-04/05 | SOL-05/06 | P2+P4 | PLANNED |
| BR-07 | BR-07.4 | AUD-07.4 | SOT-05 | SOL-06 | P2 | PLANNED |
| BR-07 | BR-07.5 | AUD-07.5 | SOT-05 | SOL-06 | P2 | PLANNED |
| BR-07 | BR-07.6 | AUD-07.6 | SOT-07 | SOL-06 | P2 | PLANNED |
| BR-07 | BR-07.7 | AUD-07.7 | SOT-06 | SOL-06/21 | P2 | PLANNED |
| BR-07 | BR-07.8 | AUD-07.8 | SOT-06/18 | SOL-12 · OD-01 | P5 | PLANNED |
| BR-07 | BR-07.9 | AUD-07.9 | SOT-07 | SOL-06 | P2 | PLANNED |
| BR-07 | BR-07.10 | AUD-07.10 | SOT-07 | SOL-06 | P2 | PLANNED |

### 7.8 BR-08 Runtime

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-08 | BR-08.1 | AUD-08.1 | SOT-02/07/08 | SOL-03/06/10 | P2+P6 | PLANNED |
| BR-08 | BR-08.2 | AUD-08.2 | SOT-03/07/08 | SOL-04/06/10 | P2+P6 | PLANNED |
| BR-08 | BR-08.3 | AUD-08.3 | SOT-04/07/08 | SOL-05/06 | P2+P4 | PLANNED |
| BR-08 | BR-08.4 | AUD-08.4 | SOT-03/08 | SOL-04/10 | P6 | PLANNED |
| BR-08 | BR-08.5 | AUD-08.5 | SOT-08/09 | SOL-10/11 | P6 | PLANNED |
| BR-08 | BR-08.6 | AUD-08.6 | SOT-09/13 | SOL-09/11 | P3+P6 | PLANNED |
| BR-08 | BR-08.7 | AUD-08.7 | SOT-09/13 | SOL-09/11 | P3+P6 | PLANNED |
| BR-08 | BR-08.8 | AUD-08.8 | SOT-10/14 | SOL-07/14 | P3+P6 | PLANNED |
| BR-08 | BR-08.9 | AUD-08.9 | SOT-08 | SOL-10 | P5+P6 | PLANNED |
| BR-08 | BR-08.10 | AUD-08.10 | SOT-07/08 | SOL-06/10 | P2+P6 | PLANNED |

### 7.9 BR-09 Public HTML

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-09 | BR-09.1 | AUD-09.1 | SOT-09 | SOL-11 | P6 | PLANNED |
| BR-09 | BR-09.2 | AUD-09.2 | SOT-09 | SOL-11 | P6 | PLANNED |
| BR-09 | BR-09.3 | AUD-09.3 | SOT-09 | SOL-11 | P6 | PLANNED |
| BR-09 | BR-09.4 | AUD-09.4 | SOT-04/09 | SOL-05/11 | P4+P6 | PLANNED |
| BR-09 | BR-09.5 | AUD-09.5 | SOT-08/09 | SOL-10/11 | P6 | PLANNED |
| BR-09 | BR-09.6 | AUD-09.6 | SOT-09 | SOL-11 | P6 | PLANNED |

### 7.10 BR-10 Validation

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-10 | BR-10.1 | AUD-10.1 | SOT-21 | SOL-14 | P1+P5 | PLANNED |
| BR-10 | BR-10.2 | AUD-10.2 | SOT-11 | SOL-14 | P3 | PLANNED |
| BR-10 | BR-10.3 | AUD-10.3 | SOT-21 | SOL-14 | P1+P5 | PLANNED |
| BR-10 | BR-10.4 | AUD-10.4 | SOT-06/21 | SOL-06/21 | P2 | PLANNED |
| BR-10 | BR-10.5 | AUD-10.5 | SOT-11 | SOL-14 | P3 | PLANNED |
| BR-10 | BR-10.6 | AUD-10.6 | SOT-07/22 | SOL-21 | P2+P6 | PLANNED |
| BR-10 | BR-10.7 | AUD-10.7 | SOT-06/07/22 | SOL-06/21 | P2 | PLANNED |
| BR-10 | BR-10.8 | AUD-10.8 | SOT-21/18 | SOL-14/12 | P5 | PLANNED |

### 7.11 BR-11 Compatibility

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-11 | BR-11.1 | AUD-11.1 | SOT-23 | SOL-16 | P6+P8 | PLANNED |
| BR-11 | BR-11.2 | AUD-11.2 | SOT-23 | SOL-16 | P4+P8 | PLANNED |
| BR-11 | BR-11.3 | AUD-11.3 | SOT-22/23 | SOL-16 | P2+P6 | PLANNED |
| BR-11 | BR-11.4 | AUD-11.4 | SOT-04/22 | SOL-05/16 | P4 | PLANNED |
| BR-11 | BR-11.5 | AUD-11.5 | SOT-23/24 | SOL-15 | P7 | PLANNED |
| BR-11 | BR-11.6 | AUD-11.6 | SOT-23 | SOL-16 | P8 | PLANNED |
| BR-11 | BR-11.7 | AUD-11.7 | SOT-23 | SOL-16 | P8 | PLANNED |

### 7.12 BR-12 Foundation / SEO separation

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-12 | BR-12.1 | AUD-12.1 | SOT-28 | SOL-19 | P1–P6 deliver capability | PLANNED |
| BR-12 | BR-12.2 | AUD-12.2 | SOT-28 | SOL-19 | Non-goal: no SEO epic rebuild | PLANNED |
| BR-12 | BR-12.3 | AUD-12.3 | SOT-28 | SOL-19 | Doc handoff to 040826 | PLANNED |
| BR-12 | BR-12.4 | AUD-12.4 | SOT-27 | SOL-19 | Non-goals §8 | PLANNED |
| BR-12 | BR-12.5 | AUD-12.5 | SOT-28 | SOL-19 | Page model reusable | PLANNED |

### 7.13 BR-13 Security

| BR | Req ID | Audit | SoT | Solution | Plan | Status |
|----|--------|-------|-----|----------|------|--------|
| BR-13 | BR-13.1 | AUD-13.1 | SOT-18/19 | SOL-13 | P5-05 | PLANNED |
| BR-13 | BR-13.2 | AUD-13.2 | SOT-19 | SOL-13 | P5-05 | PLANNED |
| BR-13 | BR-13.3 | AUD-13.3 | SOT-11/19 | SOL-07/13 | P3 | PLANNED |
| BR-13 | BR-13.4 | AUD-13.4 | SOT-11/19 | SOL-14 | P3 | PLANNED |
| BR-13 | BR-13.5 | AUD-13.5 | SOT-20 | SOL-10 | P2-02 | PLANNED |
| BR-13 | BR-13.6 | AUD-13.6 | SOT-19 | SOL-13 | P5-05 | PLANNED |

---

# 8. Audit findings → Plan

| V | Plan response |
|---|---------------|
| V1 | P1+P2 resolver foundation |
| V2 | P1 Global + P5 hệ thống + P6 consume |
| V3 | P3 Media + P7 delete orphan localStorage |
| V4 | P5 **không** Page Settings; Thiết lập SEO từng trang |
| V5 | P4 article reuse + inherit |
| V6 | P1-03/P3 extend media usages |
| V7 | P6+P7 single site name authority |
| V8 | P6 favicon + hub HTML |
| V9 | Boundary — Category SEO out |
| V10 | BR-12 — capability only; 040826 PENDING |

---

# 9. Explicit non-goals

1. SEO epic (`040826`): sitemap, robots, SERP, keyword strategy, full SEO CMS.  
2. Entity Auto-Linking / Article Detail Optimization (task `…Entity_Auto_Linking`).  
3. Merge Content Engine `content_articles`.  
4. Category SEO vào Foundation.  
5. Biến Cài đặt Trang / Brand thành SEO Admin.  
6. Tạo Media authority thứ hai.  
7. Rebuild Article Pipeline A/B từ zero.  
8. Khóa pixel/layout field-state.  
9. Cleanup legacy trước verify PASS.

---

# 10. Definition of Ready (open Impl)

* [x] BRD LOCKED  
* [x] Audit APPROVED  
* [x] SoT APPROVED  
* [x] Solution A.2 LOCKED (OD-SOL-01…03)  
* [x] **This Plan OWNER LOCKED** (2026-08-09)  
* [x] Checklist §7 đủ atomic  
* [x] No Entity/SEO-epic scope creep  

---

# 11. Definition of Done

### Impl phase (PL-01…PL-09)
* [ ] Impl tickets AC satisfied  
* [ ] Thiết lập SEO nav + 2 surfaces live  
* [ ] Resolver + field-state+source + OG/Social  
* [ ] Favicon/public hub meta  
* [ ] Orphan localStorage removed (sau verify)  
* [ ] PL-09 evidence pack handed to `06`  

### Task closure (only after 06)
* [ ] `06 - Verification-Evidence` ALL atomic PASS  
* [ ] Owner acceptance  
* [ ] Plan checklist §7 → PASS (Verification owns)  

---

# 12. Owner gate

```text
🔒 OWNER LOCKED — Implementation AUTHORIZED
```

---

# 13. PL-01 Baseline record (observe-only · 2026-08-09)

| Field | Value |
|-------|--------|
| Git HEAD | `4357417` |
| Branch | `rescue/20260806-before-gitflow` |
| Note | Working tree dirty unrelated files present — Foundation impl must not touch unrelated modules |

### Inventory (KEEP / EXTEND / MIGRATE / DELETE)

| Capability | Path / symbol | Classification |
|------------|---------------|----------------|
| Global persist name/tagline | `marketing_brand_identity` · wave-d-admin | **EXTEND** payload for BR-01 |
| Brand Admin UI | `brand-identity.html` · `AdmWaveD.initBrand` | **KEEP** (no SEO forms) |
| Orphan brand localStorage | `brand-identity-page.js` · `brand-identity-store.js` | **DELETE** after Global SEO live (PL-08) |
| Page Settings placement | `page-settings*` · `page_published_versions` | **KEEP** placement domain |
| Page keys catalog | `page-settings-catalog.js` | **REUSE** keys for Page SEO |
| Page SEO persist | — | **CREATE** (PL-02) |
| Manifests / page-definition SEO | `pages/*.manifest.js` · `page-definition.js` | **MIGRATE** → Page/Global (PL-07/08) |
| Article SEO + Pipeline A/B | `community-articles.service.js` · nginx | **EXTEND/REFACTOR** onto resolver |
| Media Library | `media_*` · `upsertUsage(articleId)` | **EXTEND** usages for GLOBAL/PAGE; **KEEP** ARTICLE |
| Hardcode `site_name: 'iFlux'` | `resolveArticleMetadata` | **MIGRATE** → Global; temp fallback only |
| Hardcode SVG logo / no favicon | User_Web shells · Prod 404 | **MIGRATE** → Asset/Global (PL-07/08) |
| Category SEO | `community_categories.seo_*` | **KEEP ADJACENT** (out of scope) |
| Content Engine SEO | `content_articles` | **BOUNDARY** (out of scope) |

**PL-01 status:** DONE (observe-only — no runtime change)

---

# END OF PLAN

**Rev A.1** · OWNER LOCKED · Impl authorized · Verification = `06`  
**Next:** PL-02… → PL-09 handoff → `06 - Verification-Evidence`
