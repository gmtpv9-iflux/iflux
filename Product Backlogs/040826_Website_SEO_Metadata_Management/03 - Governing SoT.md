CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 03 — Source of Truth

# Website SEO Metadata Management & SEO Platform

|                     |                                          |
| ------------------- | ---------------------------------------- |
| **Task ID**         | `040826_Website_SEO_Metadata_Management` |
| **BRD**             | [`01 - Business Requirement.md`](01%20-%20Business%20Requirement.md) · §0 BR Checklist · 🔒 LOCKED rev.C |
| **Mandatory Audit** | [`02 - Mandatory-Audit.md`](02%20-%20Mandatory-Audit.md) · 🔒 **OWNER LOCKED** · ✅ APPROVED · rev. **C** |
| **Document**        | **Source of Truth — OWNER LOCKED**       |
| **Date**            | 2026-08-09 · **Amend B.3** 2026-08-10 |
| **Rev**             | **B.3** — Owner Final Decision absorb (Homepage Community · rule-driven AUTO · global favicon · former_slugs+301 · entity template · Article KEEP · Zalo crawler intent · residuals) · giữ B.2 HTTP/D-SEO-11/Singleton |
| **Status**          | 🔒 **OWNER LOCKED** — Governing SoT (rev. **B.3**) |
| **Implementation**  | ❌ **STOPPED** cho items chưa Owner GO sau Plan alignment |
| **Governance docs** | [`12 - Governance Deviation Register.md`](12%20-%20Governance%20Deviation%20Register.md) · [`13 - Audit Delta Owner Final Decision.md`](13%20-%20Audit%20Delta%20Owner%20Final%20Decision.md) |
| **Next Gate**       | Solution **D.1.2** · Plan 05 alignment · STOP & REPORT · Implementation chỉ sau Owner GO |

> **Purpose:** Establish the single governing Source of Truth for SEO behavior across the entire iFlux website.
>
> This document defines **what SEO means, which URLs belong to the SEO universe, how metadata is derived, what is automatic vs manually overridable, ownership boundaries, and what every rendering pipeline MUST produce.**
>
> This document does **not** define implementation details.
>
> **Governance:** SoT trả lời **BR + Audit** (Product Backlogs Governance §2.4). Không override BRD/Audit. Không khóa Solution mechanism.

### Changelog rev. B.2 → B.3 (2026-08-10) — Owner Final Decision absorb ONLY

| Delta | Nội dung | Không đụng |
|-------|----------|------------|
| 1 | **D-SEO-12** Homepage `/` = Community public entry; Clean SEO identity `/cong-dong` (anti-duplicate) | Không invent redirect policy mới |
| 2 | **D-SEO-04** clarify: AUTO = Admin rule/template → deterministic resolve → optional override; **AUTO ≠ AI** | Không đổi BRD |
| 3 | **D-SEO-07** Favicon = **global-only**; page-level override **FORBIDDEN** | Residual API cleanup → Plan/Impl |
| 4 | **D-SEO-13** Article slug change: `former_slugs` store + HTTP **301** → current Clean URL (mechanism principle) | Không mở Versioning |
| 5 | Entity type templates (Stock/Sector/Eco/Story) + OG/Social once-per-type; Article SEO Description KEEP override semantics | Không AI SEO |
| 6 | Zalo = crawler/social-preview consumer (intent); Breadcrumb DEFER Wave C; Pagination **N/A** (Audit `13`); Versioning → Foundation NOTSTART; WATCH/SEARCH LOCK; detector ≠ Singleton PASS | Không claim PASS sớm |

### Changelog rev. B.1 → B.2 (2026-08-09) — Audit rev.C delta absorption ONLY

| Delta | Nội dung | Không đụng |
|-------|----------|------------|
| 1 | §3 + §39: HTTP Status trong SEO Contract + coherence 200/301·302/404·410 | D-SEO-01…10, Affiliate, `/co-phieu`, Universe |
| 2 | **D-SEO-11** SEO State Coherence & Conflict Resolution (policy; enforcement → Solution) | Không khóa mechanism table chi tiết |
| 3 | §0.1 + §25: Authoritative Metadata Instance per Rendered Document (Singleton) | Không rewrite Rendering architecture |
| 4 | §B V13–V15 · §D BR-06.3/06.4 · BR-10.2 · BR-29.2/29.3 · BR-34.4 · SC-30…32 | Không rewrite V1–V12 |

### Review note (rev. B — 2026-08-09)

| Check | Kết luận | Hành động |
|-------|----------|-----------|
| Bám Audit? | **PARTIAL** trước rev. B — Universe/BR-45 policy đúng hướng; thiếu map V1–V12 → authority; thiếu Decision Registry cho gap SoT | **Bổ sung §A–§C** |
| Phục vụ BRD? | **PARTIAL** — principles cover §5–§48/§45; thiếu SoT Checklist đủ Req ID | **Bổ sung §D SoT Checklist** |
| Governance §2.4? | **FAIL** trước rev. B — narrative không đủ bảng BR→Audit→SoT | **Bổ sung §D** |
| Gate Audit DRAFT vs SoT LOCKED? | **Conflict** | Owner LOCK SoT = **Audit APPROVED**; cập nhật pointer |
| B.2 vs Audit C? | **PASS** tại gate — đủ atomic HTTP/Conflict/Singleton trong Decision + Checklist | **Delta B.2** |

---

# A. Gate (Governance)

```text
01 BRD            → LOCKED (§0 BR Checklist · §45 Boundary · rev.C HTTP/Conflict/Singleton)
02 Mandatory Audit → OWNER LOCKED · APPROVED rev. C
03 Governing SoT   → OWNER LOCKED rev. B.2  ← document này
04 Solution        → OWNER REVIEW (chưa LOCK; MUST absorb B.2 + D-SEO-09)
05 Plan            → sau Solution LOCK
Implementation     → NOT AUTHORIZED
```

**Cấm** Implementation chỉ vì SoT LOCKED.  
**Cấm** Solution dựa trên SoT B.1 (outdated) — MUST dựa trên **B.2**.

---

# B. Audit Findings → SoT Authority

| Audit | Finding (tóm tắt) | SoT authority / quyết định | Đóng gap? |
|-------|-------------------|----------------------------|-----------|
| V1 | Không SEO Platform / CMS SoT | **§0.1** One SEO Platform Contract | **Đóng** (authority) — Solution implement |
| V2 | List/hub first-HTML title-only | **§26** First-HTML Requirement | **Đóng** (authority) |
| V3 | Article path chín hơn list | **§25** Rendering Contract — mọi pipeline consume cùng Contract; article = existing candidate reuse | **Đóng** (principle) |
| V4–V5 | robots.txt không version; sitemap 404 | **§10 · §34** Sitemap từ eligibility; **cấm** quảng cáo sitemap không tồn tại | **Đóng** (authority) |
| V6 | Favicon 404 / Admin field chưa wire | **§13** Public head MUST reference governed assets | **Đóng** (authority) |
| V7 | Ownership phân tán | **§0.1 · §40 · §41** Forbidden independent authorities | **Đóng** (authority) |
| V8 | Affiliate runtime OK; Clean canonical article | **§1–§2 · §46.11–15** | **Giữ** — không treat Affiliate là root cause |
| V9 | Missing SEO Index Universe policy | **§1.2 · §2.3 · D-SEO-01** — policy ngoài Universe; **mechanism → Solution** | **Policy đóng**; mechanism **mở Solution** |
| V10 | `?ref=`/`?r=` strip; publicId path primary | **§2.1 · §38 · D-SEO-02** — SEO không sở hữu; không refactor Affiliate | **Đóng** (boundary) |
| V11 | SERP gap / thiếu GSC | **§35** Machine-readable signals; GSC = verification ops | **PARTIAL** — ops evidence ngoài SoT |
| V12 | Auto vs Manual ad-hoc | **§5 · §37** Classification Matrix | **Đóng** (authority) |
| **V13** | HTTP Status không thuộc SEO Contract | **§3 · §39 · D-SEO-03** — HTTP Status là field Contract; coherent với robots/canonical/sitemap | **Đóng** (authority) — B.2 |
| **V14** | Không conflict-resolution deterministic giữa SEO signals | **D-SEO-11 · §3.1 · §31** — SEO State Coherence; invalid → prevent hoặc Health ERROR | **Đóng** (policy) — enforcement **Solution** |
| **V15** | Singleton SEO tags không enforced (đa pipeline) | **§0.1.1 · §25.1 · D-SEO-03** — Authoritative Metadata Instance; duplicate = Contract Violation / Health ERROR | **Đóng** (authority) — B.2 |

---

# C. Decision Registry (Owner-facing)

### D-SEO-01 — Affiliate/Public Identity ∉ SEO Index Universe · 🔒 LOCK (policy)

**Policy (SoT):**

```text
Clean Public URL     → SEO Universe
PublicId / Affiliate → Attribution Universe → NOT SEO Universe
```

MUST NOT: canonical / sitemap / OG identity / structured-data identity theo decorated URL.  
MUST: attribution vẫn resolve; SEO không preempt Affiliate (thứ tự §2.2).

**Mechanism (không khóa tại SoT):** noindex · canonical-only · robots.txt · sitemap exclusion · crawler rendering · tổ hợp tương đương → **Solution**.

| BR | Audit | SoT |
|----|-------|-----|
| BR-45.* | AUD-45.* | D-SEO-01 · §1–§2 |
| BR-12.2 | AUD-12.2 | D-SEO-01 |
| SC-21…23 | — | D-SEO-01 |

---

### D-SEO-02 — Không refactor Affiliate trong Epic SEO · 🔒 LOCK

SEO MUST NOT refactor Affiliate/Public Identity trừ defect SEO-boundary đã chứng minh + Owner approve (BR-45.7).

| BR | Audit | SoT |
|----|-------|-----|
| BR-45.7 · BR-12.3 · BR-46 · BR-47 | AUD-45.7 · AUD-12.3 | D-SEO-02 · §2.1 · §43 |

---

### D-SEO-03 — One SEO Contract / One authority · 🔒 LOCK

Một logical SEO Platform Contract. FE/BE/Nginx/JS không được là SEO authority độc lập.

| BR | Audit | SoT |
|----|-------|-----|
| BR-34 · BR-06 · BR-32 | V1,V7 · AUD-34.* · AUD-06.* | D-SEO-03 · §0.1 · §3 · §40 |

---

### D-SEO-04 — Automatic by Default · 🔒 LOCK

| BR | Audit | SoT |
|----|-------|-----|
| BR-01 · BR-02 · BR-37 | AUD-01.* · AUD-02.* · AUD-37 | D-SEO-04 · §0.2 · §0.2.1 · §5 · §37 |

**B.3:** Rule-driven AUTO (Admin template + deterministic resolver). MUST NOT implement as AI-invented SEO format.

---

### D-SEO-12 — Homepage `/` = Community · 🔒 LOCK (B.3)

| Policy | Lock |
|--------|------|
| Long-term Homepage | **Community** |
| Public entry | `/` |
| Page identity / pageKey | `community` (`PATH_TO_PAGE_KEY['/'] = community`) |
| Clean SEO identity | `/cong-dong` |
| Canonical · og:url · Structured Data URL | Clean identity `/cong-dong` (anti-duplicate vs `/`) |
| Sitemap | Include Clean identity `/cong-dong` once for this identity |
| Crawler shell / SPA | Community |

MUST NOT invent additional redirect/canonical policy beyond what is required to keep **one** Clean SEO identity for Community Homepage.  
MUST prove `/` and `/cong-dong` do not create contradictory duplicate SEO identities (BRD).

| BR | Audit | SoT |
|----|-------|-----|
| BR-04 · BR-07.HOME · BR-11 · BR-48.CONSIST | Challenge `11` HOME | D-SEO-12 · §1.1 |

---

### D-SEO-13 — Article slug change · former_slugs + 301 · 🔒 LOCK (B.3)

When an Article public slug changes:

1. Previous slug(s) MUST be retained in a governed **`former_slugs`** collection on the article record (bounded history).
2. Requests to a former slug MUST resolve to the **current** Clean Public Article URL via **HTTP 301**.
3. Missing / unknown slug → governed **404** (not soft-200 as current identity).
4. Canonical for the live article MUST be the **current** Clean URL only (system-generated; not RSS/external authority).

This is the **official** redirect mechanism for Article slug change (Owner KEEP). Solution MUST specify store + lookup + emit paths. Detector/Health MAY observe conflicts; mechanism ownership = SEO/Community Article identity pipeline.

| BR | Audit | SoT |
|----|-------|-----|
| BR-11 · BR-12.1 · BR-24 · BR-25 | BRD slug-change edge | D-SEO-13 · §8 · §21 |

---

### D-SEO-05 — Crawler-accessible critical metadata · 🔒 LOCK

Indexable pages: critical metadata trên crawler-accessible path (không chỉ post-load JS).

| BR | Audit | SoT |
|----|-------|-----|
| BR-35 · BR-06 · BR-07.* | V2 · AUD-35 · AUD-07.* | D-SEO-05 · §25 · §26 |

---

### D-SEO-06 — Sitemap / robots discovery coherence · 🔒 LOCK

Không advertise sitemap không tồn tại. Eligibility system-governed.

| BR | Audit | SoT |
|----|-------|-----|
| BR-13 · BR-14 | V4,V5 · AUD-13 · AUD-14 | D-SEO-06 · §9 · §10 · §34 |

---

### D-SEO-07 — Website Identity / Favicon public wire · 🔒 LOCK

Admin field chưa wire ≠ SEO implementation hợp lệ.

**B.3:** Favicon is **global-only** (Thiết lập SEO hệ thống). Page-level favicon configuration / override is **FORBIDDEN**. Public head and `/favicon.ico` MUST consume the single global Foundation favicon source.

| BR | Audit | SoT |
|----|-------|-----|
| BR-03 · BR-04 · BR-05 | V6 · AUD-05.* · Audit `13` §5 | D-SEO-07 · §13 · §32 |

---

### D-SEO-08 — Reuse before replace · 🔒 LOCK

Đánh giá reuse `IfluxSeoUrl`, page-definition, Affiliate Resolver, Article metadata resolver trước khi tạo capability trùng.

| BR | Audit | SoT |
|----|-------|-----|
| BR-47 | AUD-47 | D-SEO-08 · §42 · §46.16 |

---

### D-SEO-10 — Vietnamese-first SEO URL taxonomy · 🔒 LOCK

Public SEO Clean routes **locale vi** dùng taxonomy tiếng Việt khi thuật ngữ VN tự nhiên/ổn định (`/co-phieu`, `/nganh`, `/he-sinh-thai`, `/cong-dong`, `/thi-truong`, `/dong-tien`, …).  
Ticker / brand / publicId / system id **không dịch**.  
Existing indexed URLs ổn định; đổi taxonomy chỉ qua URL Migration/Redirect Policy + Owner.  
**Reject** đề xuất `/co-phieu`→`/stocks` (và English equivalents) chỉ vì “international SEO” / thay identity locale vi.

**Không** khóa vĩnh viễn monolingual: SEO locale `en` / quốc tế **được phép** ở phase sau qua §24 (hreflang / alternate / parallel Clean URLs + Migration) — **không** bằng cách thay Clean URL tiếng Việt hiện tại.

| BR | Audit | SoT |
|----|-------|-----|
| BR-24 · BR-11 · BR-07.STOCK/SECTOR/ECO · BR-27 | AUD-24 · AUD-11 · AUD-07.* · AUD-27 | D-SEO-10 · §1.1.1–§1.1.2 · §20 · §22 · §24 |

---

### D-SEO-11 — SEO State Coherence & Conflict Resolution · 🔒 LOCK (policy)

**Policy (SoT):** SEO signals không phải các field độc lập. Chúng phải cùng mô tả **một SEO identity / một URL policy hợp lệ**.

Chuỗi coherence (conceptual order — không phải implementation stack):

```text
HTTP status
    ↓
redirect state
    ↓
SEO eligibility
    ↓
canonical
    ↓
robots / indexability
    ↓
sitemap eligibility
    ↓
social URL (OG URL)
    ↓
structured-data URL
    ↓
internal SEO target
```

**Invalid contradictory states MUST NOT** được coi là output hợp lệ. Ví dụ **invalid**:

```text
HTTP 404 + indexable + sitemap eligible
HTTP 410 + indexable / sitemap eligible
HTTP 301 + self-canonical như trang indexable độc lập + sitemap eligible (trái redirect policy)
noindex + sitemap eligible
canonical = A + structured-data url = B (khi cùng yêu cầu một Clean SEO identity)
redirect → B + canonical → C (mâu thuẫn identity)
```

Khi phát hiện invalid:

```text
prevent invalid output
        OR
surface as SEO Health ERROR
```

**Mechanism / bảng precedence chi tiết / enforcement runtime → Solution.**  
SoT **không** khóa một stack tag cụ thể; SoT khóa **bắt buộc có coherence policy deterministic + không để invalid im lặng**.

| BR | Audit | SoT |
|----|-------|-----|
| BR-06.3 · BR-06.4 | AUD-06.3 · AUD-06.4 | D-SEO-11 · §3 · §3.1 |
| BR-10.2 | AUD-10.2 · V14 | D-SEO-11 |
| BR-29.2 | AUD-29.2 | D-SEO-11 · §31 |
| SC-30 · SC-31 | — | D-SEO-11 |

---

# D. SoT Checklist — trả lời BR + Audit (Governance §2.4)
> **Đủ Req ID** trong BRD §0. Status: `LOCKED` = authority đã khóa trong SoT; `DEFER-SOL` = mechanism/Solution; `N/A` = verification index (BR-SC) hoặc ngoài SoT.

### D.1 BR-01 … BR-14

| BR | Req ID | Audit | SoT authority | Status |
|----|--------|-------|---------------|--------|
| BR-01 | BR-01.1…01.4 | AUD-01.* | D-SEO-04 · §0.2 · §4 | LOCKED |
| BR-02 | BR-02.A…D | AUD-02.* | §5 · §37 Matrix | LOCKED |
| BR-03 | BR-03.1…03.2 | AUD-03.* | §32 · D-SEO-07 | LOCKED |
| BR-04 | BR-04.1…04.2 | AUD-04.* | §13 · §36 · D-SEO-07 | LOCKED |
| BR-05 | BR-05.1…05.2 | AUD-05.* | §13 · D-SEO-07 | LOCKED |
| BR-06 | BR-06.1…06.2 | AUD-06.1…06.2 | §3 · §39 · D-SEO-03 | LOCKED |
| BR-06 | BR-06.3 | AUD-06.3 | §3 · §3.1 · D-SEO-11 (HTTP Status trong Contract) | LOCKED |
| BR-06 | BR-06.4 | AUD-06.4 | §3.1 · D-SEO-11 (HTTP↔SEO coherence) | LOCKED |
| BR-07 | BR-07.* (mọi surface) | AUD-07.* | §3 · §16 · §26 · §38 · D-SEO-05 · **D-SEO-10** | LOCKED |
| BR-07 | BR-07.REF · BR-07.PID | AUD-07.REF/PID | D-SEO-01 · §1.2 · §2 | LOCKED (policy) |
| BR-08 | BR-08.* | AUD-08.* | §6 · §16 | LOCKED |
| BR-09 | BR-09.1…09.2 | AUD-09.* | §6 | LOCKED |
| BR-10 | BR-10.1 | AUD-10.1 | §9 · Rule Engine trong §45 model | LOCKED |
| BR-10 | BR-10.2 | AUD-10.2 · V14 | **D-SEO-11** · §3.1 · §31 | LOCKED |
| BR-11 | BR-11.1…11.2 | AUD-11.* | §8 | LOCKED |
| BR-12 | BR-12.1…12.3 | AUD-12.* | §8.3 · D-SEO-01 · D-SEO-02 | LOCKED |
| BR-13 | BR-13.1 | AUD-13.1 | §9 · D-SEO-06 | LOCKED |
| BR-14 | BR-14.1 | AUD-14.1 | §10 · D-SEO-06 | LOCKED |

### D.2 BR-15 … BR-37

| BR | Req ID | Audit | SoT authority | Status |
|----|--------|-------|---------------|--------|
| BR-15 | BR-15.1 | AUD-15.1 | §11 | LOCKED |
| BR-16 | BR-16.1 | AUD-16.1 | §11 | LOCKED |
| BR-17 | BR-17.1 | AUD-17.1 | §12 | LOCKED |
| BR-18 | BR-18.1 | AUD-18.1 | §23 | LOCKED |
| BR-19 | BR-19.1 | AUD-19.1 | §7 | LOCKED |
| BR-20 | BR-20.1 | AUD-20.1 | §6 | LOCKED |
| BR-21 | BR-21.1 | AUD-21.1 | §14 | LOCKED |
| BR-22 | BR-22.1 | AUD-22.1 | §15 | LOCKED |
| BR-23 | BR-23.1 | AUD-23.1 | §22 | LOCKED |
| BR-24 | BR-24.1 | AUD-24.1 | §20 · **D-SEO-10** | LOCKED |
| BR-25 | BR-25.1 | AUD-25.1 | §21 | LOCKED |
| BR-26 | BR-26.1 | AUD-26.1 | §18 | LOCKED |
| BR-27 | BR-27.1 | AUD-27.1 | §24 | LOCKED |
| BR-28 | BR-28.1 | AUD-28.1 | §30 | LOCKED |
| BR-29 | BR-29.1 | AUD-29.1 | §31 | LOCKED |
| BR-29 | BR-29.2 | AUD-29.2 | §31 · **D-SEO-11** (signal conflict → Health ERROR) | LOCKED |
| BR-29 | BR-29.3 | AUD-29.3 | §31 · §0.1.1 · §25.1 (duplicate singleton → Health ERROR) | LOCKED |
| BR-30 | BR-30.1 | AUD-30.1 | §28 | LOCKED |
| BR-31 | BR-31.1 | AUD-31.1 | §27 · §44 | LOCKED |
| BR-32 | BR-32.1 | AUD-32.1 | §32 · D-SEO-03 | LOCKED |
| BR-33 | BR-33.1 | AUD-33.1 | §29 | LOCKED |
| BR-34 | BR-34.1…34.3 | AUD-34.1…34.3 | D-SEO-03 · §0.1 · §25 · §40 | LOCKED |
| BR-34 | BR-34.4 | AUD-34.4 · V15 | §0.1.1 · §25.1 · D-SEO-03 (Authoritative Metadata Instance) | LOCKED |
| BR-35 | BR-35.1 | AUD-35.1 | §25 · §26 · D-SEO-05 | LOCKED |
| BR-36 | BR-36.1 | AUD-36.1 | §35 | LOCKED |
| BR-37 | BR-37.1 | AUD-37.1 | D-SEO-04 · §0.2 | LOCKED |

### D.3 BR-45 … BR-48 · BR-SC

| BR | Req ID | Audit | SoT authority | Status |
|----|--------|-------|---------------|--------|
| BR-45 | BR-45.0 | AUD-45.0 | D-SEO-01 · §1–§2 | LOCKED |
| BR-45 | BR-45.1 | AUD-45.1 | §1.1 · §8.1 | LOCKED |
| BR-45 | BR-45.2 | AUD-45.2 | §1.2 | LOCKED |
| BR-45 | BR-45.3 | AUD-45.3 | D-SEO-01 (policy) · **D-SEO-09** (mechanism → Solution) | LOCKED + DEFER-SOL |
| BR-45 | BR-45.4 | AUD-45.4 | §2.2 | LOCKED |
| BR-45 | BR-45.5 | AUD-45.5 | §2.3 | LOCKED |
| BR-45 | BR-45.6 | AUD-45.6 | Matrix = Audit deliverable; SoT giữ Universe model | LOCKED |
| BR-45 | BR-45.7 | AUD-45.7 | D-SEO-02 | LOCKED |
| BR-46 | BR-46.1 | AUD-46.1 | §43 · D-SEO-02 | LOCKED |
| BR-47 | BR-47.1 | AUD-47.1 | D-SEO-08 · §42 | LOCKED |
| BR-48 | BR-48.* | AUD-48.* | §44 · §28 · §29 · D-SEO-01/02 | LOCKED |
| BR-SC | SC-01…SC-29 | §2.6 Audit | Verification index — **không** tạo BR mới; đạt qua Solution/Impl/Verify | N/A (SoT) |
| BR-SC | SC-21…SC-24 | AUD-45 | D-SEO-01 · D-SEO-09 | LOCKED / DEFER-SOL |
| BR-SC | SC-30 | AUD SC-30 | §3 · §3.1 · D-SEO-11 | LOCKED (authority) |
| BR-SC | SC-31 | AUD SC-31 | **D-SEO-11** | LOCKED (authority) |
| BR-SC | SC-32 | AUD SC-32 | §0.1.1 · §25.1 | LOCKED (authority) |

---

# 0. Governing Principles

## 0.1 Single SEO Source of Truth

iFlux MUST have exactly one logical **SEO Platform Contract** governing SEO behavior.

No individual:

* HTML page
* JavaScript module
* frontend component
* backend service
* Nginx rule
* Admin page
* share utility
* entity page
* article renderer

may independently become an SEO authority.

Existing implementations may remain as implementation mechanisms only after they conform to this SoT.

### 0.1.1 Authoritative Metadata Instance per Rendered Document (Singleton) · 🔒 LOCK

> **One SEO Contract** (D-SEO-03) **không đồng nghĩa** với “DOM có thể có nhiều owner inject cùng một semantic field.”

Với **mỗi rendered public document**, không được tồn tại nhiều **authoritative owner / authoritative instance** cho cùng một semantic metadata field — trừ khi **chuẩn web liên quan explicitly permits multiple values**.

Tối thiểu (singleton authoritative):

```text
<title>                  → 1 authoritative instance
<meta description>       → 1
<link canonical>         → 1
<meta robots>            → 1 (không duplicate mâu thuẫn)
og:title                 → 1
og:description           → 1
og:url                   → 1
og:image (primary)       → governed / 1 primary
twitter:title            → 1
twitter:description      → 1
```

Nếu nhiều pipeline (HTML · JS · SPA · Node · Nginx) cùng inject → **Contract Violation**, không chỉ “code smell”.

```text
Duplicate authoritative metadata
→ Contract Violation
→ SEO Health ERROR (khi ảnh hưởng correctness)
```

| BR | Audit | SoT |
|----|-------|-----|
| BR-34.4 | AUD-34.4 · V15 | §0.1.1 · §25.1 |
| BR-29.3 | AUD-29.3 | §31 |
| SC-32 | — | §0.1.1 |

---

## 0.2 Automatic by Default

SEO metadata MUST be **automatically derived whenever deterministic source data exists**.

Editors MUST NOT be required to manually enter metadata that the system can deterministically generate.

### 0.2.1 Owner definition (B.3) — 🔒 LOCK

```text
AUTO ≠ AI-generated SEO
AUTO ≠ hệ thống tự nghĩ format SEO

AUTO =
  Admin-defined Rule / Template
    → deterministic runtime resolution
    → entity-specific metadata
    → optional Admin Override
    → final metadata
```

**Admin quyết định RULE. Runtime tự áp dụng RULE.**

Ví dụ Stock template `iFlux | {Mã} - {Tên cổ phiếu}` → deterministic cho mọi mã.

Priority:

```text
Admin-defined Rule / Template (+ System / Entity Variables)
        ↓
Deterministic Resolver
        ↓
Automatic Metadata
        ↓
Optional Manual Override
```

Manual input is an exception, not the default workflow.  
**BR-01.3 MUST NOT be claimed PASS** chỉ vì resolver tồn tại — cần E2E verification.

---

# 1. SEO Universe

The SEO Platform MUST explicitly distinguish between:

### 1.1 SEO Identity

A **Clean Public URL** representing a public piece of content.

#### 1.1.1 Vietnamese-first SEO URL taxonomy — 🔒 LOCKED

> **iFlux Vietnamese-first SEO URL taxonomy:** sử dụng taxonomy tiếng Việt làm chuẩn cho các public SEO routes khi thuật ngữ tiếng Việt tự nhiên, rõ nghĩa và ổn định. Các identifier như ticker, brand name, publicId và các định danh hệ thống **không dịch**. Existing SEO URLs phải được giữ ổn định; mọi thay đổi taxonomy đã được index phải đi qua **URL Migration/Redirect Policy**, không được tự ý đổi route chỉ vì SEO.

**Chuẩn Clean Public SEO routes (hiện hành — đúng SoT):**

```text
/co-phieu/{ticker}              ← Stock  (vd. /co-phieu/vcb)
/nganh/{slug}                   ← Sector
/he-sinh-thai/{slug}            ← Ecosystem
/cong-dong
/cong-dong/bai-viet/{slug}
/thi-truong
/dong-tien
```

`/co-phieu` **là đúng SoT**. **Không** yêu cầu / **không** cho phép migration sang `/stocks` (hoặc English slug tương đương) chỉ vì “chuẩn quốc tế” / “SEO best practice”.

**Cấm Solution / Implementation / Agent:**

* đề xuất đổi `/co-phieu` → `/stocks`, `/nganh` → `/sectors`, `/he-sinh-thai` → `/ecosystems`, `/thi-truong` → `/market`, `/dong-tien` → `/flow`, `/cong-dong` → `/community` làm SEO identity chuẩn mới;
* tự ý đổi taxonomy đã index mà không có Owner-approved URL Migration/Redirect Policy.

English path aliases (nếu còn) chỉ được là **redirect/đọc tạm** theo URL policy hiện hữu — **không** trở thành Clean Public SEO identity chuẩn **cho locale Việt Nam**.

#### 1.1.2 Vietnamese-first ≠ khóa vĩnh viễn monolingual — 🔒 LOCKED (đọc cùng §1.1.1)

Vietnamese-first là **ưu tiên thị trường / locale mặc định hiện tại**, **không** phải ép tiêu cực “chỉ được SEO tiếng Việt mãi mãi”.

| Được | Không được (trong Epic / Solution hiện tại) |
|------|---------------------------------------------|
| Giữ `/co-phieu/...` làm Clean Public SEO identity **locale vi** | Đổi `/co-phieu` → `/stocks` làm identity chuẩn mới “cho quốc tế” |
| Architecture **ready** cho SEO quốc tế / locale `en` sau này (§24) | Tự implement English taxonomy thay thế VN mà không có Owner + Migration Policy |
| Thêm locale EN qua **hreflang / language alternate / parallel Clean URLs** (hoặc policy Owner chốt) | Gộp “international SEO” = rename path VN sang English |
| URL Migration/Redirect khi Owner mở phase đa ngôn ngữ | Soft-replace indexed VN URLs chỉ vì best-practice blog |

**Future readiness (SoT cho phép hướng):**

```text
Locale vi (hiện tại)
  Clean Public: /co-phieu/vcb · /cong-dong/...
        ↓ (phase sau — Owner)
Locale en (quốc tế)
  Clean Public EN riêng HOẶC alternate policy Owner chốt
  + hreflang / canonical per locale
  + Migration/Redirect nếu đụng URL đã index
```

Chi tiết cơ chế locale EN = **Solution/Plan phase sau** (BR-27). Epic SEO hiện tại **MUST** không phá sẵn sàng đa ngôn ngữ, và **MUST NOT** lấy “chuẩn quốc tế” làm lý do thay taxonomy VN.

Clean Public URLs (theo locale policy) MAY participate in:

* indexing
* canonicalization
* sitemap
* OpenGraph
* Twitter/X metadata
* structured data
* internal SEO linking

subject to the page's SEO policy.

---

### 1.2 Non-SEO Identity

Affiliate / Public Identity / referral URLs are **not SEO identities**.

Examples:

```text
/{publicId}/...
?ref={id}
?r={id}
```

Their purpose is:

* attribution
* identity resolution
* navigation
* referral context

They MUST NOT become separate SEO entities.

The SEO Platform MUST NOT:

* generate separate SEO metadata identities for them;
* generate sitemap entries for them;
* generate separate structured-data identities;
* create separate OG identities;
* treat `publicId` as content identity;
* cause duplicate SEO pages for each user.

---

# 2. Affiliate / Public Identity Boundary

## 2.1 Ownership

Affiliate/Public Identity remains owned by the existing Affiliate / Identity architecture.

SEO does not own:

* attribution;
* referral resolution;
* referral cookie/context;
* Public Identity resolution;
* affiliate transport;
* affiliate persistence.

---

## 2.2 Request Ordering

For an Affiliate/Public Identity request:

```text
Incoming Request
      ↓
Public Identity / Affiliate Resolution
      ↓
Attribution Context
      ↓
Content Resolution
      ↓
SEO Representation Resolution
```

SEO MUST NOT preempt or break attribution resolution.

SEO MUST NOT:

* strip `publicId` before attribution is resolved;
* redirect before attribution resolution;
* mutate referral context;
* remove attribution cookies;
* alter Affiliate behavior.

---

## 2.3 SEO Treatment

After content resolution:

```text
PublicId / Affiliate URL
        ↓
same underlying content
        ↓
Clean Public SEO Representation
```

The SEO identity is always the **Clean Public Representation**, subject to the page's SEO policy.

**Policy (SoT — LOCKED):** decorated URLs remain **outside the SEO Index Universe** (D-SEO-01).

**Mechanism (NOT locked here):** noindex · canonical-only · robots.txt · sitemap exclusion · crawler rendering · equivalent proven combination → **Solution (D-SEO-09)**.

SoT MUST NOT be read as requiring any single mechanism (especially MUST NOT equate “NOT SEO” with “must emit meta robots noindex” alone).
---

# 3. SEO Contract

Every public URL MUST resolve to an SEO Contract.

The contract contains, where applicable:

```text
HTTP Status
URL
SEO Eligibility
Title
Description
Canonical
Robots
OpenGraph
Twitter/X
Structured Data
Breadcrumb
Sitemap Eligibility
Language / hreflang
Image Metadata
```

A URL MUST NOT be considered SEO-complete merely because it has a `<title>`.

SEO is not only `<head>`. **HTTP response status is part of the SEO Contract.**

### 3.1 HTTP Status & URL Policy Coherence · 🔒 LOCK

SEO Contract **MUST** include HTTP response state/status so that HTTP status, indexability, canonical, robots and sitemap eligibility form **one coherent URL policy** (BR-06.3 · BR-06.4 · D-SEO-11).

Authority:

```text
200
→ normal SEO contract evaluation

301 / 302
→ redirect state; target URL governs SEO identity

404 / 410
→ non-indexable

Other non-success responses
→ explicit SEO policy required
```

**MUST NOT** treat HTTP status, robots, canonical, and sitemap eligibility as independent fields that may contradict each other without detection.

Invalid example (forbidden as silent valid output):

```text
HTTP 404
    +
indexable
    +
sitemap eligible
```

See **D-SEO-11**.

---

# 4. Metadata Resolution Order

For every metadata field:

```text
1. System-required value
2. Entity-derived value
3. SEO template / rule
4. Approved manual override
5. Platform fallback
```

The platform MUST NOT require manual entry when a valid automatic value exists.

---

# 5. Automatic vs Manual Governance

## 5.1 Fully Automatic

The following SHOULD be automatically generated wherever deterministic data exists:

* canonical
* sitemap eligibility
* robots policy
* OG URL
* page URL
* breadcrumb
* JSON-LD structural fields
* site name
* favicon references
* organization identity
* WebSite identity
* Article URL
* entity URL
* pagination URL policy
* language defaults
* default OG image fallback
* Twitter/X derived metadata
* title from approved template
* description from approved template

These are system-governed values.

---

## 5.2 Automatic + Manual Override

These MAY support controlled editorial overrides:

* SEO Title
* SEO Description
* OG Title
* OG Description
* OG Image
* social image
* Article-specific structured-data fields where editorially meaningful
* image ALT
* selected SEO text fields

Override MUST:

* be explicit;
* be optional;
* have validation;
* have defined precedence;
* preserve system safety rules;
* be auditable;
* be reversible.

---

## 5.3 System Only

The following MUST NOT normally be manually editable per page:

* canonical generated from canonical URL policy;
* sitemap eligibility;
* system redirect safety;
* attribution URL identity;
* Affiliate/Public Identity behavior;
* system-generated structured-data identity fields;
* SEO identity derived from entity primary key;
* robots safety rules that protect private/system pages.

---

# 6. SEO Title Policy

Every indexable SEO page MUST have a deterministic title.

Generic fallback:

```text
{Page Title} · iFlux
```

Entity-specific templates MAY be defined.

### 6.1 Entity type templates (B.3) — 🔒 LOCK

For **Stock · Sector · Ecosystem · Story** detail types:

```text
Entity Type Template (Admin, one-shot per type)
        ↓
Entity Variables
        ↓
Deterministic Resolver
        ↓
Generated SEO Title
        ↓
Optional Override (only where Solution allows)
```

Admin MUST NOT be required to enter SEO title per individual entity when a type template exists.  
MUST NOT call this AI-generated SEO.

Illustrative Admin template: `iFlux | {Mã} - {Tên cổ phiếu}`.

### 6.2 Other page types (B.3)

Hub / static pages outside the detail types above KEEP Admin page/global configuration as governed today. MUST NOT auto-expand entity-template rules to other page types without Owner lock.

Examples:

```text
{Post Title} | Cộng đồng iFlux

{Stock Name} ({Ticker}) | iFlux

{Sector Name} | Phân tích ngành | iFlux

{Ecosystem Name} | iFlux

{Author Name} | Cộng đồng iFlux
```

Templates MUST be centrally governed.

Changing a template MUST be capable of propagating consistently to all applicable pages.

---

# 7. SEO Description Policy

Every indexable page SHOULD have a deterministic description.

Resolution:

```text
Manual SEO Description
        ↓
Entity-derived description
        ↓
Template-generated description
        ↓
Platform fallback
```

The system MUST avoid empty descriptions where meaningful source content exists.

Description generation MUST be deterministic.

---

# 8. Canonical Policy

## 8.1 Canonical Authority

Canonical MUST be generated by the SEO Platform from the canonical URL policy.

Canonical MUST represent the **Clean Public SEO URL**.

---

## 8.2 Affiliate / Public Identity

Canonical MUST NOT contain:

```text
publicId
?ref=
?r=
```

Decorated URLs are **Attribution Universe**, never SEO canonical identity (D-SEO-01).  
No future “exception” may reintroduce publicId/referral as canonical without **Owner change to BRD §45 + this SoT**.

---

## 8.3 Query Parameters

The SEO Platform MUST define deterministic handling for query variants including:

```text
?page=
?sort=
?filter=
?search=
?ref=
?r=
```

Each parameter MUST have an explicit SEO classification:

```text
Canonical-preserving
Canonical-changing
Non-SEO
Redirected
Noindex
```

No query parameter may become an SEO identity accidentally.

---

# 9. Robots Policy

Robots behavior MUST be centrally governed.

The platform MUST distinguish:

```text
Index / Follow
Index / Nofollow
Noindex / Follow
Noindex / Nofollow
System-only
```

Examples that require explicit policy:

* public content
* authenticated pages
* checkout
* account pages
* search results
* empty collections
* draft content
* deleted content
* Affiliate/Public Identity variants
* query variants
* pagination
* 404
* 410

The exact rendering mechanism is implementation detail.

The policy itself belongs to this SoT.

---

# 10. Sitemap Policy

Sitemap membership MUST be derived automatically from SEO eligibility.

Conceptually:

```text
URL
 ↓
SEO Contract
 ↓
Indexable?
 ↓ YES
Sitemap eligible?
 ↓ YES
Sitemap
```

A URL MUST NOT be manually inserted into sitemap files as an independent SEO decision.

The platform MUST support scalable sitemap segmentation when volume requires it, e.g.:

```text
sitemap.xml
post-sitemap.xml
stock-sitemap.xml
sector-sitemap.xml
ecosystem-sitemap.xml
image-sitemap.xml
news-sitemap.xml
```

Only applicable sitemap types need to exist.

---

# 11. OpenGraph / Social Metadata

OG metadata MUST derive from the same SEO Contract.

Minimum:

```text
og:title
og:description
og:url
og:type
og:image
og:site_name
```

Twitter/X metadata MUST derive from the same source.

Minimum:

```text
twitter:card
twitter:title
twitter:description
twitter:image
```

There MUST NOT be a separate independent Social Metadata Source of Truth.

---

# 12. Default Image Fallback

Image resolution:

```text
Entity/Page OG Image
        ↓
Content Image
        ↓
Section Image
        ↓
Website Default OG Image
```

If no valid image exists, the platform MUST have a deterministic fallback policy.

The system MUST NOT produce broken OG image references.

---

# 13. Favicon / Website Identity

Website identity is part of the SEO Platform's public machine-readable identity contract.

At minimum the public site MUST govern:

```text
favicon.ico
favicon PNG variants
apple-touch-icon
PWA/manifest icons where applicable
theme-color where applicable
```

The public head MUST reference the governed assets.

Admin fields that are not connected to public rendering MUST NOT be considered a valid SEO implementation.

### 13.1 Favicon scope (B.3) — 🔒 LOCK

```text
Thiết lập SEO hệ thống
└── Favicon   ← single global source for entire site
```

MUST NOT provide or honor page-level favicon override in Admin SEO từng trang or page SEO config as a governed capability.  
Residual page `faviconUrl` in API/store (Audit `13`) is **non-governed debt** → remove/ignore on authorized implementation.

---

# 14. Structured Data

Structured data MUST derive from the same SEO/entity contract.

Platform-supported schema types SHOULD include:

```text
Organization
WebSite
WebPage
BreadcrumbList
Article
NewsArticle
CollectionPage
Person
FAQPage
ImageObject
VideoObject
```

Only semantically valid schema types may be emitted for a page.

The platform MUST NOT generate misleading structured data merely to increase search visibility.

---

# 15. Breadcrumb

Breadcrumb MUST be generated from route/entity hierarchy.

Example:

```text
Home
  ↓
Community
  ↓
Articles
  ↓
Article
```

Breadcrumb display and Breadcrumb JSON-LD MUST derive from the same hierarchy.

They MUST NOT become two independent ownership systems.

---

# 16. Entity SEO

The platform MUST support deterministic SEO contracts for applicable entities.

Initial entity classes:

```text
Article / Post
Stock
Sector
Ecosystem
Author
Tag
Collection
Static Page
```

Future entities MUST be able to adopt the same SEO Contract without inventing another metadata system.

---

# 17. Content Lifecycle

SEO behavior MUST account for:

```text
Draft
Published
Updated
Archived
Deleted
Deleted permanently
```

Examples:

```text
Draft
→ non-indexable

Published
→ eligible according to entity policy

Deleted with replacement
→ redirect policy

Deleted permanently
→ 410 where appropriate
```

The actual HTTP behavior is governed by the SEO Solution.

---

# 18. Pagination

Pagination MUST have deterministic SEO behavior.

Examples:

```text
/page/2
?page=2
```

The platform MUST define:

* title
* description
* canonical
* robots
* sitemap eligibility
* structured data
* duplicate-content behavior

No pagination behavior may be left to accidental browser/JS behavior.

---

# 19. Search / Internal Utility Pages

Internal search and utility pages MUST have explicit SEO classification.

Examples:

```text
/search
/account
/checkout
/watchlist
/comments
/share
```

They MUST NOT become indexable merely because they are publicly reachable.

---

# 20. URL Governance

SEO URL policy MUST govern:

* **Vietnamese-first SEO URL taxonomy** (D-SEO-10 · §1.1.1)
* lowercase policy
* slug policy
* trailing slash policy
* Unicode handling
* duplicate URLs
* query parameters
* pagination
* redirect
* 404
* 410
* URL normalization
* **URL Migration/Redirect Policy** trước mọi đổi taxonomy đã index

URL normalization MUST NOT break Affiliate/Public Identity resolution.

Solution/Implementation MUST NOT rename Vietnamese Clean Public routes to English equivalents for “SEO best practice” alone.

---

# 21. Redirect Policy

Redirects are part of SEO URL governance.

Supported policy classes:

```text
301
302
410
451 where legally applicable
```

Redirect rules MUST be deterministic and auditable.

SEO MUST NOT introduce a redirect that breaks Affiliate attribution before attribution resolution.

---

# 22. Internal Linking

Internal SEO links SHOULD be generated from canonical Clean Public URLs.

Entity references SHOULD use the governed URL resolver.

Examples:

```text
VCB
→ /co-phieu/vcb

Ngân hàng
→ /nganh/{slug}  (governed Sector Clean URL)

Article
→ /cong-dong/bai-viet/{slug}
```

Affiliate/Public Identity decorators MUST NOT become the default SEO internal-link target.

English legacy aliases MUST NOT be used as default internal SEO targets when a Vietnamese Clean Public URL exists.

---

# 23. Image SEO

Where image content participates in SEO, the platform SHOULD govern:

```text
ALT
Title
Caption
Credit
Width
Height
Image URL
Format
```

The system MUST automatically derive values where deterministic data exists.

Manual ALT/content overrides MAY be supported where editorial meaning cannot be inferred reliably.

---

# 24. Multi-language Readiness

The architecture MUST be capable of supporting:

```text
lang
hreflang
canonical
language alternate
```

The platform MUST NOT create contradictory canonical/language relationships.

Actual multi-language / international (`en`) rollout may be implemented in a **later Owner-approved phase**.

This section **complements** §1.1.1–§1.1.2:

* Locale **vi** Clean URLs remain Vietnamese-first (`/co-phieu`, …).
* Locale **en** (when opened) MUST NOT be achieved by silently renaming vi taxonomy to English.
* Cross-locale discovery uses hreflang / alternate / Migration Policy — not “replace vi with /stocks”.

---

# 25. Rendering Contract

All rendering pipelines are implementations of the same SEO Contract.

Current architecture may contain:

```text
Browser HTML shell
SPA
Backend metadata resolver
Nginx
Crawler/social pipeline
```

None of these may become independent SEO authorities.

Conceptually:

```text
                 SEO Contract
                      │
          ┌───────────┼───────────┐
          ↓           ↓           ↓
       Browser      Crawler      Social
          │           │           │
          └───────────┼───────────┘
                      ↓
              Same SEO semantics
```

Human and crawler representations MUST remain semantically consistent.

### 25.1 Singleton on rendered output · 🔒 LOCK

Rendering pipelines MUST emit at most **one authoritative metadata instance** per semantic field on the final rendered public document (§0.1.1).

Duplicate authoritative instances from distributed ownership (HTML + JS + SPA + Node + Nginx) are **Contract Violations** and MUST surface as SEO Health ERROR when they affect correctness (BR-34.4 · BR-29.3).

---

# 26. First-HTML Requirement

For pages intended to be indexable, critical SEO metadata MUST be available through the crawler-accessible rendering path.

At minimum:

```text
<title>
description
canonical
robots
OG
```

where applicable.

Client-side-only metadata MUST NOT be relied upon as the sole SEO mechanism for indexable pages.

---

# 27. SEO Source Traceability

Every resolved metadata field SHOULD be traceable to its source.

Example:

```text
SEO Title
→ Template: Article.Title.v1
→ Source: Article.title
→ Override: none
→ Final: "{title} | Cộng đồng iFlux"
```

For manual override:

```text
SEO Title
→ Manual Override
→ Actor
→ Timestamp
→ Previous Value
→ Current Value
```

---

# 28. SEO Versioning

SEO configuration SHOULD be versioned.

Versioning applies to:

* templates
* rules
* global defaults
* overrides
* important SEO settings

Rollback MUST be possible for governed SEO configuration.

---

# 29. SEO Permissions

SEO administration MUST support role-based permissions.

Minimum conceptual permissions:

```text
View SEO
Edit SEO
Publish SEO
Manage SEO Settings
Manage Redirects
Manage Robots
Manage Sitemap
Manage SEO Templates
```

Not every Admin user should automatically be able to modify global SEO policy.

---

# 30. SEO Preview

Admin SHOULD provide deterministic previews for:

```text
Google/Search Preview
OpenGraph
Twitter/X
```

Preview MUST be generated from the same resolved SEO Contract used by production rendering.

Preview MUST NOT invent a separate metadata calculation.

---

# 31. SEO Health

The platform SHOULD expose SEO health checks including:

```text
Missing Title
Missing Description
Missing Canonical
Missing OG
Missing Image
Missing H1
Duplicate Title
Duplicate Description
Canonical Conflict
Noindex Conflict
Broken Canonical
Broken Image
404
500
Redirect Loop
Orphan Page
Sitemap Conflict
Structured Data Error
HTTP ↔ SEO incoherent state (D-SEO-11)
Conflicting SEO signals (D-SEO-11) → ERROR khi ảnh hưởng correctness
Duplicate authoritative singleton tags (§0.1.1) → ERROR khi ảnh hưởng correctness
```

Health checks are consumers of the SEO Contract, not separate metadata owners.

Under **D-SEO-11**, Health MUST treat incoherent SEO state as **invalid**, not as three independent warnings that can all “PASS” while contradicting each other.

---

# 32. Global Website SEO Settings

Admin MUST eventually provide a centralized SEO settings surface.

Conceptual location:

```text
Admin
└── System
    └── SEO Settings
```

It MAY govern:

```text
Website Name
Website Title Template
Website Description
Canonical Domain
Default OG Image
Favicon
Apple Touch Icon
Organization Identity
Social Defaults
Robots Defaults
Verification
Theme Color
Manifest
```

These values MUST have one authoritative source.

---

# 33. Verification

Search-engine verification SHOULD be centrally governed.

Examples:

```text
Google Search Console
Bing Webmaster
other supported verification mechanisms
```

Verification tokens MUST NOT be scattered across arbitrary HTML files.

---

# 34. Search Engine Discovery

The platform MUST support coherent discovery through:

```text
robots.txt
sitemap.xml
canonical
internal links
structured data
```

The system MUST NOT advertise a sitemap that does not exist.

---

# 35. SERP / Search Representation

The target SEO representation for a brand query such as:

```text
iFlux
```

MUST be derived from the website's actual identity and public SEO metadata.

The system MUST NOT intentionally produce an incorrect or generic representation such as:

```text
Cộng đồng · iFlux
```

when the intended site-level identity is the iFlux website.

Search-engine output itself is not directly controllable by the application, but the application MUST provide correct machine-readable signals.

---

# 36. Brand Identity Boundary

SEO Website Identity MUST be distinct from:

```text
Page identity
Article identity
User identity
Affiliate identity
Public Identity
```

For example:

```text
Website
→ iFlux

Article
→ Article title

User
→ User identity

Affiliate
→ Attribution identity
```

No user identity may become the website SEO identity.

---

# 37. Automatic Metadata Classification Matrix

| Metadata               | Default                          | Manual Override             | System Authority       |
| ---------------------- | -------------------------------- | --------------------------- | ---------------------- |
| Website Name           | Automatic                        | Controlled                  | SEO/Brand SoT          |
| Website Title Template | Automatic                        | Admin configuration         | SEO Platform           |
| Page Title             | Automatic                        | Yes                         | SEO Platform           |
| Description            | Automatic                        | Yes                         | SEO Platform           |
| Canonical              | Automatic                        | No by default               | SEO Platform           |
| Robots                 | Automatic                        | No by default               | SEO Rule Engine        |
| Sitemap Eligibility    | Automatic                        | No                          | SEO Rule Engine        |
| OG Title               | Derived                          | Yes                         | SEO Platform           |
| OG Description         | Derived                          | Yes                         | SEO Platform           |
| OG Image               | Derived + fallback               | Yes                         | SEO Platform           |
| Twitter Card           | Automatic                        | Controlled                  | SEO Platform           |
| Favicon                | Automatic                        | Global setting              | Website Identity       |
| JSON-LD                | Automatic                        | Controlled                  | SEO Platform           |
| Breadcrumb             | Automatic                        | No                          | Route/Entity hierarchy |
| URL                    | Automatic by route/entity policy | Controlled for content slug | URL SoT                |
| Redirect               | Rule-based                       | Admin governed              | Redirect Policy        |
| Affiliate/PublicId     | Automatic                        | **Not SEO-editable**        | Affiliate SoT          |
| `ref` / `r`            | Attribution only                 | **Not SEO-editable**        | Affiliate SoT          |

---

# 38. Non-SEO URL Classification

The following MUST be explicitly classified before implementation:

```text
/{publicId}/...
?ref=
?r=
authenticated routes
account routes
checkout routes
share routes
internal search
utility routes
draft routes
private routes
system routes
```

No URL may be accidentally included in the SEO Universe.

---

# 39. SEO Contract Completeness

For every SEO-eligible public URL:

```text
HTTP Status
      +
SEO Eligibility
      +
Title
      +
Description
      +
Canonical
      +
Robots
      +
Social Metadata
      +
Structured Data where applicable
      +
Sitemap Eligibility
      +
Correct rendering
      +
State coherence (D-SEO-11)
      +
Singleton authoritative metadata on rendered document (§0.1.1)
```

must resolve deterministically.

Missing metadata MUST be either:

1. automatically generated;
2. explicitly optional by page policy; or
3. reported as a health error.

Silent omission is not acceptable.

Incoherent HTTP/SEO combinations and duplicate authoritative singleton tags are **not** “optional omissions” — they are **invalid states** (D-SEO-11 · §0.1.1).

---

# 40. Ownership Model

## SEO Platform owns

* SEO Contract
* metadata resolution
* templates
* SEO rules
* canonical policy
* robots policy
* sitemap policy
* social metadata derivation
* structured-data policy
* SEO defaults
* SEO traceability
* SEO health

## Website Identity owns

* brand identity source data
* website name
* logo
* favicon source assets

## Content Domain owns

* Article
* Stock
* Sector
* Ecosystem
* Author
* Tag
* Collection data

## Affiliate / Identity owns

* Public Identity
* referral
* attribution
* referral context
* affiliate transport

## Rendering Infrastructure owns

* how the SEO Contract is rendered

It MUST NOT redefine the SEO Contract.

---

# 41. Forbidden Patterns

The following are prohibited after this SoT is implemented:

### 41.1 Independent `<title>` ownership

```text
page.html
→ hardcoded <title>
```

unless explicitly generated from the SEO Contract.

### 41.2 Independent metadata builders

```text
frontend SEO builder
backend SEO builder
nginx SEO builder
```

with conflicting rules.

### 41.3 Affiliate as SEO identity

```text
/{publicId}/article
→ unique SEO page
```

### 41.4 Manual canonical

Editors MUST NOT arbitrarily set canonical to another URL without an approved policy/override mechanism.

### 41.5 Sitemap hardcoding

Individual teams MUST NOT manually append URLs to sitemap files.

### 41.6 Client-only SEO for indexable pages

Critical SEO metadata MUST NOT depend solely on post-load JavaScript.

### 41.7 Untracked SEO settings

SEO configuration MUST NOT live only inside arbitrary source files.

---

# 42. Migration Principle

Existing SEO behavior MUST NOT be blindly deleted.

Migration sequence:

```text
Existing implementation
        ↓
Audit
        ↓
Map to SEO Contract
        ↓
Identify duplicate ownership
        ↓
Select authoritative source
        ↓
Migrate consumers
        ↓
Remove obsolete ownership
```

Existing reusable components such as:

```text
IfluxSeoUrl
page-definition
Affiliate Resolver
Article metadata resolver
```

MUST be evaluated for reuse.

Do not duplicate functionality merely to create the new platform.

---

# 43. Compatibility Principle

The SEO Platform MUST preserve existing valid business behavior.

Especially:

```text
Affiliate attribution
Public Identity resolution
Article routing
Existing canonical clean URLs
Existing valid content URLs
```

SEO modernization MUST NOT become an excuse to refactor unrelated domains.

---

# 44. Observability

The SEO Platform SHOULD make it possible to observe:

```text
Requested URL
Resolved SEO identity
SEO eligibility
Canonical
Robots
Metadata source
Template version
Override state
Sitemap eligibility
Rendering pipeline
```

This is necessary to diagnose:

```text
Why Google sees the wrong title
Why a page is not indexed
Why a canonical is wrong
Why an Affiliate URL is entering SEO
Why metadata differs between crawler and browser
```

---

# 45. Final Governing Model

The complete architecture is:

```text
                         ┌─────────────────────┐
                         │   Website / Entity  │
                         │       Data          │
                         └──────────┬──────────┘
                                    │
                                    ↓
                         ┌─────────────────────┐
                         │   SEO Platform      │
                         │                     │
                         │ SEO Contract        │
                         │ Template Engine      │
                         │ Rule Engine          │
                         │ Canonical Policy     │
                         │ Robots Policy        │
                         │ Sitemap Policy       │
                         │ Social Metadata      │
                         │ Structured Data      │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  ↓                 ↓                 ↓
              Browser           Crawler            Social
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    ↓
                         Same SEO semantics
```

Affiliate remains a separate upstream boundary:

```text
Incoming URL
      │
      ├── Clean Public URL
      │       ↓
      │   SEO Platform
      │
      └── PublicId / Affiliate URL
              ↓
       Affiliate Resolver
              ↓
       Attribution Context
              ↓
       Same Content
              ↓
       Clean Public SEO Identity
```

---

# 46. Owner-Locked Rules

The following are **non-negotiable SoT rules**:

1. **One logical SEO Source of Truth.**
2. **Automatic SEO by default.**
3. **Manual SEO is exception/override, not primary input.**
4. **Canonical is system-governed.**
5. **Sitemap eligibility is system-governed.**
6. **Robots policy is system-governed.**
7. **Social metadata derives from the SEO Contract.**
8. **Structured data derives from the SEO/entity contract.**
9. **Indexable public pages require crawler-accessible critical metadata.**
10. **Human and crawler representations must be semantically consistent.**
11. **Clean Public URL is the SEO identity.**
12. **Affiliate/Public Identity is NOT an SEO identity.**
13. **PublicId/referral MUST NOT become canonical, sitemap identity, or separate structured-data identity.**
14. **Affiliate attribution MUST NOT be broken by SEO processing.**
15. **SEO MUST NOT own Affiliate/Public Identity resolution.**
16. **Existing reusable SEO/URL/Identity components MUST be evaluated before creating replacements.**
17. **SEO configuration MUST be traceable and auditable.**
18. **No implementation may create a second independent SEO authority.**
19. **Vietnamese-first SEO URL taxonomy is LOCKED** (`/co-phieu`, `/nganh`, `/he-sinh-thai`, `/cong-dong`, `/thi-truong`, `/dong-tien`, …). Ticker/brand/publicId/system ids are not translated. **Reject** renaming to English SEO paths (`/stocks`, `/sectors`, `/ecosystems`, `/market`, `/flow`, `/community`, …) without Owner-approved URL Migration/Redirect Policy.
20. **HTTP Status is part of the SEO Contract**; HTTP ↔ robots ↔ canonical ↔ sitemap MUST form one coherent URL policy (D-SEO-11 · §3.1).
21. **SEO State Coherence is mandatory** — contradictory SEO signals MUST be prevented or Health ERROR (D-SEO-11).
22. **Authoritative Metadata Instance (Singleton)** — mỗi rendered public document tối đa một authoritative instance per semantic field unless the web standard permits multiples (§0.1.1 · §25.1).
---

# 47. SoT Acceptance Criteria

This SoT is considered satisfied only when the future Solution/Implementation can demonstrate:

```text
✓ Every applicable public page has an SEO Contract
✓ HTTP Status is part of the Contract and coherent with robots/canonical/sitemap (D-SEO-11)
✓ SEO State Coherence — no silent invalid contradictory signals
✓ Authoritative Metadata Instance (Singleton) on each rendered document
✓ Metadata is automatic by default
✓ Manual override is controlled
✓ Canonical is deterministic
✓ Robots is deterministic
✓ Sitemap is deterministic
✓ OG/Twitter derive from the same contract
✓ Structured Data derives from the same contract
✓ Favicon/Website Identity is publicly wired
✓ Crawler receives critical metadata
✓ Browser/Crawler semantics are consistent
✓ Affiliate attribution remains intact
✓ PublicId URLs are outside SEO identity
✓ No PublicId URL becomes sitemap/canonical SEO identity
✓ SEO ownership is centralized
✓ Existing valid reusable code is reused where appropriate
✓ SEO configuration is traceable
✓ SEO health can identify contract violations (incl. conflict + duplicate singleton)
✓ Future entities can adopt the same contract
```

---

# 48. Gate

| Gate                 | Status               |
| -------------------- | -------------------- |
| BRD                  | ✅ LOCKED (§0 Registry · §45 · rev.C HTTP/Conflict/Singleton) |
| Mandatory Audit      | 🔒 OWNER LOCKED · ✅ APPROVED rev. **C** |
| **SEO Platform SoT** | 🔒 **OWNER LOCKED** rev. **B.3** (Owner Final Decision 2026-08-10) |
| Solution             | 🔒 **D.1.2** absorb B.3 |
| Plan                 | Align `05` · Implementation **STOPPED** until Owner GO |
| Implementation       | ❌ **STOPPED** this governance turn |

**Implementation MUST NOT begin from this SoT alone.**  
**Solution MUST base on SoT B.3** for Owner Final Decision items.

```text
Self-audit B.3 (Owner Final Decision)
────────────────────────────────────
D-SEO-12 Homepage Community     → LOCKED ✓
D-SEO-04 / §0.2.1 rule-driven AUTO → LOCKED ✓
D-SEO-07 / §13.1 global favicon → LOCKED ✓
D-SEO-13 former_slugs + 301     → LOCKED ✓
Entity templates §6.1 · Article override · Zalo intent · residuals → LOCKED / DEFER as Register `12`
Detector completeness ≠ Singleton architecture PASS → LOCKED ✓
```

```text
Self-audit B.2 (Governance §2.4) — still intact
────────────────────────────────
BR-06.3/06.4 → AUD-06.3/06.4 → V13 → §3/§3.1/D-SEO-11 → LOCKED ✓
BR-10.2      → AUD-10.2      → V14 → D-SEO-11           → LOCKED ✓
BR-29.2/29.3 → AUD-29.2/29.3 →     → §31 / §0.1.1       → LOCKED ✓
BR-34.4      → AUD-34.4      → V15 → §0.1.1 / §25.1     → LOCKED ✓
SC-30…32     → Audit SC      →     → Checklist §D       → LOCKED ✓
D-SEO-01…11  → B.2 baseline                         → intact ✓
```

---

# Appendix B.3 — Additional Owner locks (policy pointers)

## Article SEO Description (KEEP)

If Admin does **not** enter a distinct SEO Description → use Article Description / Excerpt.  
If Admin enters SEO Description → use as **intentional override**.  
MUST NOT treat this as manual-first defect. MUST NOT require SEO Description. MUST NOT refactor solely to “look more automatic.”

## Entity OG / Social (Stock / Sector / Ecosystem / Story)

Admin configures OG/Social image **once per entity type**; runtime applies to all entities of that type. Prefer consume existing PAGE/GLOBAL inherit if equivalent. MUST NOT require per-entity social asset config.

## Zalo (intent)

Zalo is a **crawler / social-preview consumer** for First HTML / OG (Owner A). Mechanism → Solution/Plan; MUST use existing shell architecture; MUST NOT create a separate Zalo SEO pipeline.

## Breadcrumb

SOL-BC / BR-22 / SC-09 → **DEFER Wave C**. MUST NOT claim PASS in Wave B.

## Pagination

Per Audit `13`: **N/A** (no indexable pagination product). Re-open only if Product ships `?page=` SEO identity.

## Versioning / Rollback

Out of Epic 040826 → Foundation backlog `100826_SEO_Metadata_Versioning_Rollback_Foundation` **NOTSTART**.

## WATCH / SEARCH

Owner Lock #2 — no coverage / shell / SEO change in this epic scope.

## Singleton detector

KEEP detector expansion as Health/audit capability.  
**Detector completeness ≠ Singleton architecture PASS.** Multi-pipeline consistency remains open (Human · Googlebot · Facebook · Zalo · First HTML · SPA · OG · fields).

## GSC / SERP

Evidence after stable implementation. NEVER substitutes Architecture Verification.

## Image ALT vs Social JPEG/PNG

Separate tracks. ALT ≠ Social format. Both require Audit→Solution→Plan before implementation.

---

**End of Source of Truth — OWNER LOCKED (rev. B.3)**
