# 03 — Source of Truth

# Community Article Detail Optimization & Entity Auto-Linking

| | |
|--|--|
| **Task ID** | `090826_Community_Article_Detail_Optimization_Entity_Auto_Linking` |
| **BRD** | [`01-BRD.md`](01-BRD.md) · **BR-AD-12/13 AMENDED** (Sector OUT · Eco ≥3) |
| **Mandatory Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) — rev. B++ |
| **Document** | Source of Truth — Owner Locked |
| **Date** | 2026-08-09 |
| **Status** | 🔒 **OWNER ABSOLUTE LOCKED** · **AMEND BR-AD-12/13 cascade** (Sector membership OUT · Eco ≥3) |
| **Implementation** | ❌ **NOT AUTHORIZED** (cần Solution + Plan approve) |
| **Next gate** | [`04-Solution.md`](04-Solution.md) |

> **Mục đích của SoT:** khóa nguồn sự thật, ownership, field semantics và boundary giữa Article, Market Master, Attribution và Runtime.
>
> SoT **không mô tả cách implement**. Solution/Plan mới quyết định cơ chế kỹ thuật.

### Boundary clarifications (Owner 2026-08-09) — bắt buộc đọc trước Solution

```text
1. Market Master  = authoritative IDENTITY của entity
   Article Record = authoritative MEMBERSHIP/RELATIONSHIP Article ↔ entity

2. community_posts = Article persistence/domain authority
   Article API     = canonical READ CONTRACT / transport (KHÔNG phải domain SoT thứ hai)
   Runtime         = consumer / cache / transform

3. Final rendered HTML (DOM) ≠ Article raw-content SoT
   (kể cả khi Solution chọn Model A hoặc Model B)

4. BR-AD-12/13 AMEND (Owner 2026-08-09) — scope membership task này:
   - Sector membership auto-link/derive/persist = OUT OF SCOPE
   - Ecosystem membership chỉ khi ≥3 distinct constituent stock codes
   - Stock + Ecosystem không XOR loại trừ nhau; 1 mã trùng tên Eco ≠ Eco membership
   - Market Master `sectors` / `ecosystems` vẫn là IDENTITY masters (ngoài scope ≠ xóa Master)
```

---

# 1. SoT Executive Decision

Sau Mandatory Audit rev. B, hệ thống được khóa theo các nguyên tắc:

```text
                    ┌──────────────────────────┐
                    │        MARKET MASTER      │
                    │                           │
                    │ stocks                    │
                    │ sectors                   │
                    │ ecosystems                │
                    └────────────┬─────────────┘
                                 │
                                 │ authoritative entity
                                 ▼
RSS / Admin Article
        │
        ▼
┌──────────────────────────┐
│ Article Ingestion /      │
│ Article Record           │
│                          │
│ community_posts          │
│                          │
│ title                    │
│ body                     │
│ attribution              │
│ entity references        │
│ timestamps               │
└────────────┬─────────────┘
             │
             │ API
             ▼
┌──────────────────────────┐
│ Article Detail Runtime   │
│                          │
│ API data only            │
│ + deterministic render   │
│                          │
│ NO entity invention      │
│ NO publisher invention   │
│ NO author invention      │
└──────────────────────────┘
```

**Không được tồn tại flow chính:**

```text
Article API
   ↓
Frontend heuristic
   ↓
MockMarket / FALLBACK_TICKERS
   ↓
Invent entity / attribution
   ↓
Render
```

Frontend chỉ là **consumer + renderer**, không phải domain authority.

---

# 1A. SoT Authority Registry (`SOT-AD-*`)

> Mỗi Authority có ID ổn định để Solution / Plan / Verification reference.  
> Chi tiết semantics: các mục §2…§30 bên dưới.

| SoT | Authority | Semantics khóa (tóm tắt) | Audit ref | BR chính |
|-----|-----------|--------------------------|-----------|----------|
| **SOT-AD-01** | Domain Authority First + Source Hierarchy | LEVEL 1 Master = **identity**; LEVEL 2 Article = **membership + article fields**; LEVEL 3 API = **read contract** (không domain SoT); 4 Runtime; 5 Presentation | AUD-AD-12 · AUD-AD-14 | All |
| **SOT-AD-02** | Article Record Authority | `community_posts` = Article **persistence/domain** authority; Article API = **read contract only** (không phải domain SoT thứ hai); Detail không dựng lại từ RSS/Mock | AUD-AD-02 · AUD-AD-14 | BR-AD-03,16 |
| **SOT-AD-03** | Stock Master Authority | `stocks` = sole Stock **identity** Master (HCM là stock nào / active?); **không** = authority “Article có chứa HCM hay không” | AUD-AD-04 · AUD-AD-05 · AUD-AD-11 | BR-AD-05,06,07,08 |
| **SOT-AD-04** | Sector Master Authority | `sectors` = Sector **identity** Master (vẫn tồn tại); **task này OUT OF SCOPE** auto-membership Sector (BR-AD-12 AMEND) | AUD-AD-11 · AUD-AD-12 | BR-AD-12 |
| **SOT-AD-05** | Ecosystem Master Authority | `ecosystems` = Ecosystem **identity** Master; membership Article chỉ sau resolve + **≥3 constituent** (BR-AD-13.THRESH) | AUD-AD-11 · AUD-AD-12 | BR-AD-13 |
| **SOT-AD-06** | Article ↔ Entity Membership | Task này: authoritative membership = `stocks[]` + `ecosystems[]` (Eco ≥3); **không** bắt buộc/sinh `sectors[]` | AUD-AD-03 · AUD-AD-14 | BR-AD-01,05…14 |
| **SOT-AD-07** | Entity Resolution + Auto-Link Ownership | Candidate → Master validate → persist → API → UI; ownership = ingestion/domain; FE không quyết định entity | AUD-AD-05 · AUD-AD-07 | BR-AD-06,11,14 |
| **SOT-AD-08** | Link Presentation | `/co-phieu/{ticker}` = presentation của Stock đã resolve — không phải SoT | AUD-AD-05 | BR-AD-06,07 |
| **SOT-AD-09** | Precision-First | Không chắc → DO NOT LINK | AUD-AD-04 · AUD-AD-06 | BR-AD-15,09,10 |
| **SOT-AD-10** | VND False-positive | Không mặc định VND→stock; currency context không link | AUD-AD-04 | BR-AD-09 |
| **SOT-AD-11** | HCM False-positive | Không mặc định HCM→stock; TP.HCM / địa danh không link | AUD-AD-04 | BR-AD-10 |
| **SOT-AD-12** | Company Name → Ticker | Resolve against `stocks.company_name`; cấm hardcoded company dict làm authority | AUD-AD-05 | BR-AD-07 |
| **SOT-AD-13** | Attribution Semantics | Author ≠ Publisher ≠ Vendor ≠ Membership Tier; canonical attribution hierarchy | AUD-AD-13 | BR-AD-03 |
| **SOT-AD-14** | VCCorp.vn Rule | `VCCorp.vn` ≠ fixed/default author; chỉ khi upstream lineage verified | AUD-AD-13 | BR-AD-03 |
| **SOT-AD-15** | Publisher / No Fixed Fallback | Publisher ≠ Author mặc định; missing author → không fallback provider/fixed string | AUD-AD-13 | BR-AD-03 |
| **SOT-AD-16** | `tier_label` Semantic | `tier_label` ≠ publisher nếu domain = membership tier; publisher cần field riêng | AUD-AD-13 | BR-AD-03 |
| **SOT-AD-17** | Dates Independent | `published_at` / `updated_at` tách attribution; Đăng/Cập nhật chỉ khi timestamp hợp lệ | AUD-AD-13 · AUD-AD-03 | BR-AD-03 |
| **SOT-AD-18** | Runtime Store | CACHE + TRANSFORM; không invent entity/author/publisher | AUD-AD-07 · AUD-AD-14 | BR-AD-11,05 |
| **SOT-AD-19** | Body HTML Authority | Persisted `body_html` / entity refs (theo Model A\|B Solution chọn) = content authority; **Final rendered DOM HTML ≠ content SoT**; FE linkify runtime ≠ SoT | AUD-AD-03 · AUD-AD-05 | BR-AD-06,11,16 |
| **SOT-AD-20** | Sidebar + Empty Omit | Sidebar = persisted entity relationships; count=0 → omit card (kể cả Chủ đề cùng nguyên tắc empty) | AUD-AD-01 · AUD-AD-08 | BR-AD-01 |
| **SOT-AD-21** | Layout Content-State | Aside không tồn tại chỉ để chứa empty cards; expand khi không sidebar content | AUD-AD-01 · AUD-AD-10 | BR-AD-02 |
| **SOT-AD-22** | Related Exclude + Single Acquisition | `current ∉ related`; exclude enforce trước render; một Related acquisition contract | AUD-AD-01 · AUD-AD-09 | BR-AD-04 |
| **SOT-AD-23** | RSS / Forbidden / Legacy | RSS = INPUT; forbidden sources không phải SoT; legacy = TRANSITION — không mở rộng | AUD-AD-04 · AUD-AD-05 · AUD-AD-06 | BR-AD-05…15 |
| **SOT-AD-24** | Existing Article Safety | Không phá HTML/SEO/affiliate/URL; backfill strategy OPEN → Solution | AUD-AD-09 | BR-AD-16 |

---

# 1B. SoT Checklist — form [`README.md`](../README.md) §2.4 (`BR | Req | Audit | SoT | Status`)

> Mỗi **Req ID** (BRD §10.1) = **≥1 hàng**. Shared SoT được reference nhiều Req — **không gộp mất hàng**.  
> Không có SoT → `—` / `N/A` + lý do. **Không xóa dòng Req.**  
> Chi tiết semantics: Registry §1A + nội dung §2…§35.

| BR | Req ID | Audit | SoT | Trạng thái |
|----|--------|-------|-----|------------|
| BR-AD-01 | BR-AD-01.STOCK | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 Sidebar + Empty Omit | 🔒 LOCKED |
| BR-AD-01 | BR-AD-01.SECTOR | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 omit khi 0 · **SOT-AD-04** không sinh Sector membership (OUT) | 🔒 LOCKED (AMEND) |
| BR-AD-01 | BR-AD-01.ECO | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 · SOT-AD-05 (≥3 trước membership) | 🔒 LOCKED (AMEND) |
| BR-AD-01 | BR-AD-01.EMPTY | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 Sidebar + Empty Omit | 🔒 LOCKED |
| BR-AD-01 | BR-AD-01.STOCK | AUD-AD-14 | SOT-AD-06 Article ↔ Entity Relationship | 🔒 LOCKED |
| BR-AD-02 | BR-AD-02.WIDTH | AUD-AD-01 · AUD-AD-10 | SOT-AD-21 Layout Content-State | 🔒 LOCKED |
| BR-AD-02 | BR-AD-02.IMG | AUD-AD-01 | SOT-AD-21 Layout Content-State | 🔒 LOCKED |
| BR-AD-02 | BR-AD-02.ASIDE | AUD-AD-01 · AUD-AD-10 | SOT-AD-21 Layout Content-State | 🔒 LOCKED |
| BR-AD-02 | BR-AD-02.RWD | AUD-AD-10 | SOT-AD-21 Layout Content-State | 🔒 LOCKED |
| BR-AD-02 | BR-AD-02.SCOPE | AUD-AD-08 | SOT-AD-21 Layout Content-State | 🔒 LOCKED |
| BR-AD-03 | BR-AD-03.1 | AUD-AD-13 | SOT-AD-14 VCCorp.vn Rule · SOT-AD-15 No Fixed Fallback | 🔒 LOCKED |
| BR-AD-03 | BR-AD-03.2 | AUD-AD-13 · AUD-AD-03 | SOT-AD-02 Article Record · SOT-AD-13 Attribution Semantics | 🔒 LOCKED |
| BR-AD-03 | BR-AD-03.3 | AUD-AD-13 | SOT-AD-13 Attribution Semantics · SOT-AD-15 Publisher Rule | 🔒 LOCKED |
| BR-AD-03 | BR-AD-03.4 | AUD-AD-13 | SOT-AD-15 No Fixed Fallback · SOT-AD-14 VCCorp.vn Rule | 🔒 LOCKED |
| BR-AD-03 | BR-AD-03.5 | AUD-AD-13 · AUD-AD-03 | SOT-AD-17 Dates Independent | 🔒 LOCKED |
| BR-AD-03 | BR-AD-03.6 | AUD-AD-13 | SOT-AD-02 Article Record Authority | 🔒 LOCKED |
| BR-AD-03 | BR-AD-03.7 | AUD-AD-13 · AUD-AD-06 | SOT-AD-15 No Fixed Fallback · SOT-AD-18 Runtime Store | 🔒 LOCKED |
| BR-AD-03 | BR-AD-03.1 | AUD-AD-13 | SOT-AD-16 `tier_label` Semantic | 🔒 LOCKED |
| BR-AD-04 | BR-AD-04.1 | AUD-AD-01 · AUD-AD-09 | SOT-AD-22 Related Exclude + Single Acquisition | 🔒 LOCKED |
| BR-AD-04 | BR-AD-04.2 | AUD-AD-09 | SOT-AD-22 Related Exclude + Single Acquisition | 🔒 LOCKED |
| BR-AD-04 | BR-AD-04.ACC | AUD-AD-01 | SOT-AD-22 Related Exclude + Single Acquisition | 🔒 LOCKED |
| BR-AD-05 | BR-AD-05.AUTH | AUD-AD-02 · AUD-AD-05 · AUD-AD-11 · AUD-AD-12 | SOT-AD-03 Stock Master Authority | 🔒 LOCKED |
| BR-AD-05 | BR-AD-05.BAN | AUD-AD-04 · AUD-AD-06 | SOT-AD-23 RSS / Forbidden / Legacy | 🔒 LOCKED |
| BR-AD-06 | BR-AD-06.1 | AUD-AD-05 | SOT-AD-07 Entity Resolution + Auto-Link Ownership | 🔒 LOCKED |
| BR-AD-06 | BR-AD-06.2 | AUD-AD-05 | SOT-AD-07 Entity Resolution + Auto-Link Ownership | 🔒 LOCKED |
| BR-AD-06 | BR-AD-06.3 | AUD-AD-05 | SOT-AD-08 Link Presentation | 🔒 LOCKED |
| BR-AD-06 | BR-AD-06.4 | AUD-AD-05 · AUD-AD-03 | SOT-AD-06 Article ↔ Entity · SOT-AD-19 Body HTML | 🔒 LOCKED |
| BR-AD-06 | BR-AD-06.5 | AUD-AD-05 · AUD-AD-07 | SOT-AD-07 · SOT-AD-18 Runtime Store | 🔒 LOCKED |
| BR-AD-07 | BR-AD-07.1 | AUD-AD-05 | SOT-AD-12 Company Name → Ticker · SOT-AD-03 Stock Master | 🔒 LOCKED |
| BR-AD-07 | BR-AD-07.2 | AUD-AD-04 · AUD-AD-06 | SOT-AD-23 Forbidden Sources | 🔒 LOCKED |
| BR-AD-08 | BR-AD-08.1 | AUD-AD-05 · AUD-AD-04 | SOT-AD-07 Entity Resolution · SOT-AD-09 Precision-First | 🔒 LOCKED |
| BR-AD-09 | BR-AD-09.CUR | AUD-AD-04 · AUD-AD-06 | SOT-AD-10 VND False-positive | 🔒 LOCKED |
| BR-AD-09 | BR-AD-09.TK | AUD-AD-04 | SOT-AD-10 VND False-positive · SOT-AD-09 Precision-First | 🔒 LOCKED |
| BR-AD-10 | BR-AD-10.GEO | AUD-AD-04 · AUD-AD-06 | SOT-AD-11 HCM False-positive | 🔒 LOCKED |
| BR-AD-10 | BR-AD-10.TK | AUD-AD-04 | SOT-AD-11 HCM False-positive · SOT-AD-09 Precision-First | 🔒 LOCKED |
| BR-AD-11 | BR-AD-11.INGEST | AUD-AD-05 · AUD-AD-14 | SOT-AD-07 Entity Resolution Ownership | 🔒 LOCKED |
| BR-AD-11 | BR-AD-11.BAN | AUD-AD-07 · AUD-AD-05 | SOT-AD-18 Runtime Store | 🔒 LOCKED |
| BR-AD-12 | BR-AD-12.MODEL | AUD-AD-12 · AUD-AD-14 | SOT-AD-04 — Sector auto-membership **OUT OF SCOPE** | 🔒 LOCKED (OUT OF SCOPE) |
| BR-AD-12 | BR-AD-12.AUTH | AUD-AD-02 · AUD-AD-11 | SOT-AD-04 identity Master ngoài task; cấm auto-membership | 🔒 LOCKED (AMEND) |
| BR-AD-13 | BR-AD-13.MODEL | AUD-AD-12 · AUD-AD-14 | SOT-AD-05 · SOT-AD-06 Eco membership | 🔒 LOCKED |
| BR-AD-13 | BR-AD-13.AUTH | AUD-AD-02 · AUD-AD-11 | SOT-AD-05 Ecosystem Master Authority | 🔒 LOCKED |
| BR-AD-13 | BR-AD-13.THRESH | AUD-AD-14 · AUD-AD-12 | SOT-AD-05 · SOT-AD-09 — Eco ≥3 constituent; 1 mã ≠ Eco | 🔒 LOCKED (AMEND) |
| BR-AD-14 | BR-AD-14.PIPE | AUD-AD-04 · AUD-AD-14 | SOT-AD-07 pipeline Stock+Eco (Sector ngoài scope) | 🔒 LOCKED (AMEND) |
| BR-AD-14 | BR-AD-14.BAN | AUD-AD-08 · AUD-AD-04 | SOT-AD-01 Domain Authority First | 🔒 LOCKED |
| BR-AD-15 | BR-AD-15.PREC | AUD-AD-04 · AUD-AD-06 | SOT-AD-09 Precision-First | 🔒 LOCKED |
| BR-AD-15 | BR-AD-15.SCOPE | AUD-AD-04 | SOT-AD-09 · SOT-AD-10 · SOT-AD-11 | 🔒 LOCKED |
| BR-AD-16 | BR-AD-16.SAFE | AUD-AD-09 | SOT-AD-24 Existing Article Safety | 🔒 LOCKED |
| BR-AD-16 | BR-AD-16.SEO | AUD-AD-09 | SOT-AD-24 Existing Article Safety | 🔒 LOCKED |
| BR-AD-16 | BR-AD-16.SAFE | AUD-AD-09 | SOT-AD-19 Body HTML Authority (Model A/B OPEN → Solution) | 🔒 LOCKED (authority) / OPEN (persistence) |
| BR-AD-16 | BR-AD-16.SAFE | — | Backfill strategy | N/A — OPEN → Solution |

**Coverage:** **46/46** Req ID có ≥1 hàng SoT (sau BR-AD-13.THRESH). Không Req bị xóa / gộp mất.

---

# 2. Global SoT Rules

## SOT-AD-01 — Database/Domain Authority First

Mỗi **domain concern** phải có đúng một authoritative source. Phân biệt rõ **vai trò**:

| Concern | Authoritative artifact | Vai trò khóa |
|---------|------------------------|--------------|
| Article persistence / domain record | `community_posts` | **Domain SoT** — field thuộc bản thân bài viết + membership refs |
| Stock **identity** master | `stocks` | **Domain SoT** — entity là gì / active? (**không** = Article membership) |
| Sector **identity** master | `sectors` | **Domain SoT** — identity ngành |
| Ecosystem **identity** master | `ecosystems` | **Domain SoT** — identity HST |
| Article ↔ entity **membership** | entity references trên Article record (`community_posts`) | **Domain SoT** của relationship |
| Attribution semantics | Canonical attribution fields trên Article record | **Domain SoT** |
| Related Articles | Community Feed/Related **query contract** | Contract authority (không invent membership) |
| Article API | Article API | **Canonical read contract / transport representation** — **không** phải domain SoT thứ hai |
| Article Detail UI | Render từ API response | **Presentation** — consumer của contract |
| Runtime Store | Store / normalize | **Cache + transform** — **không phải SoT** |

### Semantic khóa (chống nhầm API = SoT thứ hai)

```text
community_posts
    = Article persistence / domain authority

Article API
    = canonical read contract / transport representation
      (phải phản ánh community_posts; không invent domain truth)

Runtime
    = consumer / cache / transform
```

**CẤM hiểu:** “Article API là một Domain SoT ngang hàng `community_posts`.”  
API chỉ là lớp đọc chuẩn; nếu API ≠ DB → đó là **bug/contract drift**, không phải authority mới.

---

### Master Authority vs Article Membership Authority (khóa)

```text
Market Master (stocks / sectors / ecosystems)
    = authoritative IDENTITY của entity

Article Record (community_posts)
    = authoritative MEMBERSHIP / RELATIONSHIP
      của Article với entity
```

Ví dụ:

```text
stocks
→ HCM là stock nào, identity gì, active hay không

community_posts
→ Article này CÓ relationship với HCM hay không
```

**CẤM hiểu:** `stocks` (hoặc Master) là authority cho câu hỏi “bài viết này có chứa / gắn stock X không”.  
Câu hỏi đó thuộc **Article membership** trên `community_posts` (sau khi đã resolve/validate identity qua Master).

---

# 3. Article SoT

## 3.1 Article record

`community_posts` là **Article persistence/domain authority** cho các field thuộc bản thân bài viết và membership refs.

Bao gồm:

* `title`
* `body_html`
* author/attribution fields
* `published_at`
* `updated_at`
* article entity references (**membership**)
* source/provider metadata nếu có

Article Detail **consume** Article record thông qua Article API (**read contract**), không coi API là domain SoT độc lập.

```text
community_posts          ← domain / persistence authority
      ↓
Article API              ← canonical read / transport contract
      ↓
Article Detail Runtime   ← consumer / cache / transform
      ↓
UI render                ← presentation
```

Không cho phép Article Detail tự dựng lại Article record từ RSS, MockMarket hoặc các nguồn phụ.

---

# 4. Market Entity SoT

## 4.1 Stock

**`stocks` là authoritative source duy nhất của Stock Master (IDENTITY).**

Các thông tin như:

* ticker/symbol
* company name
* active status
* stock identity
* market-domain metadata

phải được **resolve / validate identity** against Stock Master.

Stock Master **không** trả lời:

```text
Article X có membership với ticker HCM không?
```

Câu đó thuộc Article Record membership (SOT-AD-06).

### Cấm

Không được coi các nguồn sau là Stock Master:

* `FALLBACK_TICKERS`
* `IfluxMockMarket`
* RSS hardcoded ticker dictionary
* FE regex dictionary
* danh sách ticker viết trực tiếp trong JS
* tên công ty/ticker tự suy diễn tại runtime

Các nguồn trên, nếu còn tồn tại vì compatibility, chỉ được xem là legacy/input aid trong quá trình migration và **không có authority**.

---

## 4.2 Sector

**`sectors` là authoritative source của Sector Master (identity).**

> **BR-AD-12 AMEND:** task này **OUT OF SCOPE** auto-link / derive / persist Sector membership.  
> Identity Master vẫn tồn tại; Solution **không** được dùng Master để sinh `article.sectors` trong scope task.

Article Detail không được coi:

```text
ticker → sector   (runtime)
```

là Article membership — và task này **không** yêu cầu persist Sector membership mới.

---

## 4.3 Ecosystem

**`ecosystems` là authoritative source của Ecosystem Master (identity).**

```text
ticker → ecosystem
```

có thể là mechanism derive trong Solution — **không** = membership SoT.

**Membership rule (BR-AD-13.THRESH — khóa SoT):**

```text
Eco membership chỉ khi ≥3 distinct constituent stock codes
thuộc Ecosystem đó được nhắc rõ trong Article.

1 stock-code mention (kể cả tên trùng Eco) MUST NOT tạo Eco association.
Stock membership và Eco membership không XOR loại trừ nhau.
```

---

# 5. Article ↔ Entity SoT

Đây là boundary quan trọng nhất của task.

## 5.0 Boundary nhắc lại

```text
Master = “entity tồn tại / identity / active?”
Article membership = “Article này gắn entity đó không?”
```

Hai tầng **không thay thế** nhau.

## 5.1 Entity relationship (membership authority)

Article Detail — **scope membership task này** (BR-AD-12/13 AMEND):

```text
Article (community_posts)
 ├── Stocks[]       ← membership (validate identity qua stocks)
 └── Ecosystems[]   ← membership (validate identity qua ecosystems + ≥3 gate)
```

- **Sector membership** không thuộc deliverable auto-pipeline của task này.  
- **Membership SoT** = refs trên `community_posts` (sau persist).  
- **Identity SoT** = Market Master tương ứng.  
- Refs phải trỏ tới **entity identity** đã resolve, không phải text heuristic thuần.

Ví dụ conceptually:

```text
Article
  └── Stock membership
       ├── id / symbol  (identity — validated against stocks)
       └── (presence on this article = membership authority)
```

Không khóa schema cụ thể tại SoT; Solution sẽ quyết định IDs, symbols hay normalized references — **miễn** không đảo boundary Master vs Membership.

---

## 5.2 Resolution rule

Entity detection phải tuân thủ:

```text
Candidate
   ↓
Normalize
   ↓
Resolve against Market Master
   ↓
Validate active/valid entity
   ↓
Persist authoritative relationship
   ↓
API
   ↓
UI
```

Không được:

```text
Candidate
   ↓
FE regex
   ↓
/co-phieu/{candidate}
```

mà không qua Market Master validation.

---

# 6. Entity Auto-Linking SoT

## 6.1 Ownership

**Domain entity resolution thuộc ingestion/domain layer, không thuộc Article Detail frontend.**

Frontend không được là nơi quyết định:

* bài viết có ticker nào
* ticker đó có hợp lệ hay không
* company name nào tương ứng ticker nào
* sector nào thuộc article
* ecosystem nào thuộc article

Frontend chỉ render entity relationship đã được authoritative pipeline cung cấp.

---

## 6.2 Link generation

URL link như:

```text
/co-phieu/{ticker}
```

là **presentation representation** của một Stock entity đã được resolve.

URL không phải Source of Truth.

Do đó:

```text
Stock identity
      ↓
Stock entity reference
      ↓
UI route
```

chứ không phải:

```text
UI route
      ↓
suy ra Stock identity
```

---

# 7. Precision-First Rule

Entity auto-linking phải ưu tiên:

> **Precision over Recall**

Nếu hệ thống không đủ confidence để xác định entity:

```text
DO NOT LINK
```

Không được link chỉ vì chuỗi giống ticker.

---

# 8. VND Rule

`VND` là một trường hợp ambiguous.

Không được mặc định:

```text
VND → VNDIRECT stock
```

trong mọi context.

Ví dụ:

```text
100.000 VND
giá 20.000 VND
```

không được biến thành:

```text
100.000 <link>VND</link>
```

Chỉ resolve `VND` thành stock khi context đáp ứng rule đã được Solution khóa.

---

# 9. HCM Rule

Tương tự:

```text
HCM
```

không được mặc định là ticker `HCM` trong mọi context.

Ví dụ:

```text
TP.HCM
Thành phố Hồ Chí Minh
khu vực HCM
```

không được tự động biến thành Stock link.

False-positive protection là mandatory.

---

# 10. Company Name → Ticker

Company-name detection được công nhận là một capability thuộc entity resolution.

Ví dụ conceptually:

```text
Tên doanh nghiệp
      ↓
Resolve against stocks.company_name
      ↓
Stock identity
      ↓
Ticker
```

Không được dùng:

```text
hardcoded company dictionary
```

làm authority.

---

# 11. Attribution / Author SoT

## 11.1 Critical semantic rule

### **Author ≠ Publisher ≠ Vendor ≠ Tier**

Bốn khái niệm này phải được phân biệt.

```text
Author
    = người/tổ chức thực sự được attribution là tác giả

Publisher
    = đơn vị xuất bản/phát hành

Vendor / Holding
    = metadata từ nguồn cung cấp hoặc hệ thống vendor

Membership Tier
    = trạng thái membership của user
```

Không được dùng một field semantic của khái niệm này để đại diện cho khái niệm khác.

---

# 12. VCCorp.vn Rule — OWNER LOCKED

Đây là quyết định bắt buộc của SoT.

> **`VCCorp.vn` tuyệt đối không được là fixed/default author của Community Article.**

`VCCorp.vn` chỉ được xuất hiện khi attribution lineage của chính Article đó chứng minh rằng đây là giá trị author/source metadata thực tế của upstream.

Ví dụ:

```text
CafeF HTML
   ↓
meta author = VCCorp.vn
   ↓
Article attribution metadata
```

thì có thể lưu như **upstream attribution metadata**.

Nhưng không được biến thành:

```text
missing author
   ↓
VCCorp.vn
```

hoặc:

```text
CafeF article
   ↓
author = VCCorp.vn
```

một cách mặc định.

---

# 13. Publisher Rule

`CafeF`, `VietStock`, `Báo Đầu Tư`... là **publisher/provider identity**.

Publisher không được tự động trở thành author.

Ví dụ:

```text
Publisher = CafeF
Author = Thu Minh
```

là hợp lệ.

Nhưng:

```text
Publisher = CafeF
Author missing
→ Author = CafeF
```

là **không hợp lệ**, trừ khi upstream attribution thực sự xác nhận CafeF là author.

---

# 14. No Fixed Attribution Fallback

Khi upstream không cung cấp author hợp lệ:

```text
missing author
```

không được tự động fallback sang:

* `VCCorp.vn`
* `CafeF`
* `VietStock`
* provider name
* publisher name
* bất kỳ fixed string nào

Thay vào đó, Solution phải quyết định một trong các semantics hợp lệ:

```text
A. Omit author
B. Render publisher separately
C. Render neutral attribution state
D. Preserve explicit upstream attribution if verified
```

Không được invent author.

---

# 15. `tier_label` Semantic Rule

Hiện trạng:

```text
tier_label = providerName
```

là semantic conflict.

SoT khóa:

> **`tier_label` không được dùng để biểu diễn Publisher nếu field này về mặt domain được định nghĩa là Membership Tier.**

Nếu Community Article cần publisher chip, publisher phải có canonical attribution field riêng.

Không được tiếp tục sử dụng:

```text
author.tier_label = "CafeF"
```

để giả lập publisher nếu semantic contract của `tier_label` là membership tier.

Schema migration cụ thể thuộc Solution/Plan.

---

# 16. Attribution Field Hierarchy

Canonical conceptual model:

```text
Article Attribution
├── author
│   └── display_name / identity
│
├── publisher
│   └── display_name / identity
│
├── source/provider
│   └── provider identity
│
└── timestamps
    ├── published_at
    └── updated_at
```

Không khóa implementation field name tại SoT.

Nhưng **semantic separation là mandatory**.

---

# 17. Dates

`published_at` và `updated_at` là independent Article lifecycle fields.

UI labels:

```text
Đăng
Cập nhật
```

chỉ được render khi timestamp tương ứng hợp lệ.

Dates không được dùng để xác định publisher/author.

---

# 18. Article Detail Runtime SoT

Runtime object/store là:

```text
CACHE + TRANSFORM
```

không phải domain authority.

`normalizePostRecord` không được trở thành nơi:

* invent ticker
* invent author
* invent publisher
* invent sector
* invent ecosystem

Runtime có thể:

* normalize presentation
* format values
* map API response
* render UI
* cache data

nhưng không được thay thế Domain SoT.

---

# 19. Body HTML SoT

### 19.1 Raw / persisted content authority

`community_posts.payload.body_html` là **authoritative raw article body** (persistence) tại thời điểm trước khi Solution chọn Model A hoặc Model B.

Frontend transformation như:

```text
linkifyTickersInHtml()
```

**không** được coi là authoritative Article content.

### 19.2 Model A / B — OPEN → Solution

Solution phải quyết định mechanism cuối cùng giữa:

### Model A

```text
Persist final linkified HTML
```

hoặc:

### Model B

```text
Persist entity references
        ↓
Render deterministic links
```

Trong cả hai model:

> **Entity resolution phải dựa trên authoritative Market Master (identity), rồi persist membership/refs trên Article Record.**

### 19.3 Presentation ≠ Content SoT — OWNER LOCKED

> **Final rendered HTML (DOM sau render) ≠ Article raw-content SoT.**

Dù chọn Model A hay Model B:

* Dữ liệu authoritative là **`body_html` và/hoặc entity references đã persist** theo Solution đã chọn trên `community_posts`.
* HTML DOM mà browser/renderer tạo ra chỉ là **presentation artifact**.

**CẤM hiểu / diễn giải ở Solution:**

```text
❌ "Frontend đã linkify đúng → HTML frontend là source of truth"
❌ "DOM hiện tại = authoritative body"
```

---

# 20. Sidebar SoT

Sidebar phải phản ánh Article entity relationships.

Conceptual model (**scope task — BR-AD-12/13 AMEND**):

```text
Article
 ├── Stocks[]
 └── Ecosystems[]   ← chỉ khi ≥3 constituent (BR-AD-13.THRESH)
```

Block Ngành: omit khi không có membership; task **không** auto-sinh Sector.

Không được lấy sidebar membership bằng cách chạy lại heuristic frontend trên body HTML.

---

# 21. Empty Sidebar Rule

Khi entity count = 0:

```text
DO NOT RENDER EMPTY CARD
```

Không render:

```text
Stock
Không có dữ liệu
```

hoặc placeholder tương đương nếu BR không yêu cầu.

Sidebar block phải được conditional render.

Rule áp dụng cho các entity block thuộc Article Detail.

**Chủ đề** được áp dụng cùng nguyên tắc empty-state nếu Owner đã xác nhận trong BR/SoT; không được tạo thêm một fixed empty card chỉ vì component hiện tại có sẵn.

---

# 22. Article Layout SoT

Content width và aside behavior phải phản ánh actual content state.

Không được duy trì một aside column chỉ để chứa empty entity cards.

Conceptually:

```text
Has sidebar content
    → content + sidebar

No sidebar content
    → content expands appropriately
```

Exact CSS/layout implementation thuộc Solution.

---

# 23. Related Article SoT

Current article phải luôn bị loại khỏi Related Articles.

Invariant:

```text
currentArticle.id ∉ relatedArticles[]
```

`excludeId` không được tồn tại dưới dạng dead parameter.

Nếu Related query cần exclusion:

```text
query → exclusion → result
```

exclusion phải được enforce trước khi render.

Frontend không được chỉ filter sau khi UI đã nhận một result sai nếu backend/query layer có thể enforce contract.

---

# 24. Related Acquisition SoT

Article Detail không được có hai acquisition path cạnh tranh cho cùng Related dataset.

Hiện trạng:

```text
loadPostPage()
    └── related_to

DailyFeed
    └── category fetch
```

là duplicate/conflicting path.

Solution phải chọn một authoritative Related acquisition contract.

---

# 25. RSS Role

RSS là:

```text
INPUT SOURCE
```

không phải Market Master.

RSS có thể cung cấp:

* article body
* title
* upstream attribution
* provider
* candidate entities

nhưng candidate entity phải được validate against Market Master trước khi trở thành authoritative relationship.

RSS hardcoded ticker dictionary không được coi là authority.

---

# 26. Admin Role

Admin Market Master là authority để quản lý:

```text
Stocks
Sectors
Ecosystems
```

Admin Content là authority để quản lý Article content.

Article Detail không được tạo một authority thứ ba riêng cho entities.

---

# 27. Source Hierarchy

Hierarchy chính thức:

```text
LEVEL 1 — DOMAIN MASTER (IDENTITY)
  stocks / sectors / ecosystems
  → “entity là gì / active?”

LEVEL 2 — ARTICLE RECORD (DOMAIN / PERSISTENCE + MEMBERSHIP)
  community_posts
  → article fields + “article gắn entity nào?”

LEVEL 3 — API READ CONTRACT (TRANSPORT — không phải domain SoT)
  Article API
  → phải phản ánh LEVEL 2; drift = bug, không = authority mới

LEVEL 4 — RUNTIME (CACHE + TRANSFORM)
  Store / normalize
  → consumer; không invent

LEVEL 5 — PRESENTATION
  links / chips / sidebar / CSS / DOM HTML
  → presentation artifact; DOM ≠ content SoT
```

Quy tắc:

> Lower layer không được override authoritative value của higher **domain** layer (LEVEL 1–2) bằng heuristic local.  
> LEVEL 3–5 không được trở thành domain SoT song song.

---

# 28. Forbidden Sources

Các nguồn sau **không được trở thành SoT**:

| Source | Status |
|--------|--------|
| `FALLBACK_TICKERS` | ❌ Forbidden as authority |
| `IfluxMockMarket` | ❌ Forbidden as entity authority |
| RSS hardcoded ticker dictionary | ❌ Forbidden as entity authority |
| FE ticker regex | ❌ Forbidden as entity authority |
| FE company-name dictionary | ❌ Forbidden as entity authority |
| Provider name as author fallback | ❌ Forbidden |
| `VCCorp.vn` as fixed author fallback | ❌ Forbidden |
| `CafeF` as fixed author fallback | ❌ Forbidden |
| `tier_label = publisher` | ❌ Forbidden semantic contract |
| Runtime-derived taxonomy as Article membership | ❌ Forbidden |
| Vendor HTML links as canonical entity links | ❌ Forbidden |

---

# 29. Legacy / Migration Rule

Các cơ chế legacy có thể vẫn tồn tại trong codebase trước khi implementation task hoàn tất.

Điều đó **không có nghĩa chúng còn authority**.

Đặc biệt:

```text
FALLBACK_TICKERS
MockMarket
FE linkify
RSS ticker dictionary
```

được phân loại:

```text
LEGACY / TRANSITION MECHANISM
```

và Solution/Plan phải xác định:

* remove
* replace
* migrate
* compatibility-only

Không được tiếp tục mở rộng chúng.

---

# 30. Backfill SoT

Backfill bài cũ là **implementation decision**, không phải authority decision.

SoT chỉ khóa:

> Sau migration, Article cũ và Article mới phải tuân theo cùng một canonical data model và cùng entity/attribution authority.

Các chiến lược:

```text
re-process ingest
lazy migration
batch migration
new articles only
```

sẽ được quyết định ở Solution/Plan.

---

# 31. Final Field Lineage

| UI Concern | Domain / persistence authority | Identity authority (nếu có) | Transport | Runtime / presentation role |
|------------|--------------------------------|-----------------------------|-----------|-----------------------------|
| Title | `community_posts` | — | Article API | Render |
| Raw / persisted body | `community_posts.body_html` (+ refs nếu Model B) | — | Article API | Render; **DOM ≠ content SoT** |
| Author | Canonical Article Attribution trên record | — | Article API | Render |
| Publisher | Canonical Article Attribution trên record | — | Article API | Render |
| Provider | Article source metadata trên record | — | Article API | Render/diagnostic |
| Published date | `published_at` | — | Article API | Format/render |
| Updated date | `updated_at` | — | Article API | Format/render |
| Stock **membership** | Article entity refs trên `community_posts` | validate identity via `stocks` | Article API | Render sidebar/links |
| Sector **membership** | **OUT OF SCOPE** auto-pipeline task này (BR-AD-12); identity Master `sectors` vẫn tồn tại | `sectors` (identity only) | — | Omit sidebar khi không có membership |
| Ecosystem **membership** | Article entity refs + **≥3 constituent gate** (BR-AD-13.THRESH) | validate identity via `ecosystems` | Article API | Render sidebar/links |
| Body stock links | Persisted body/refs (Model A\|B) | Stock identity via `stocks` | Article API | Presentation only |
| Related Articles | Related query contract | — | Feed/Related API | Render |
| Membership tier | Membership domain (không = publisher) | — | API tương ứng | Render khi semantic đúng |

---

# 32. Mandatory Invariants

Solution/Implementation phải giữ tất cả invariants sau.

### INV-01 — No invented author

```text
No verified author
→ no invented author
```

### INV-02 — No VCCorp default

```text
VCCorp.vn
≠ default author
```

### INV-03 — Publisher ≠ Author

```text
publisher identity
≠ author identity
```

### INV-04 — Tier ≠ Publisher

```text
membership tier
≠ provider/publisher
```

### INV-05 — Entity must resolve

```text
ticker/company candidate
→ Market Master validation
→ only then entity
```

### INV-06 — No frontend entity authority

```text
FE cannot invent entity
```

### INV-07 — No false-positive linking

```text
ambiguous candidate
→ DO NOT LINK
```

### INV-08 — No empty sidebar card

```text
count = 0
→ omit block
```

### INV-09 — No self-related article

```text
currentArticle
∉ relatedArticles
```

### INV-10 — One authority per field

```text
One semantic field
→ One authoritative source
```

### INV-11 — Master ≠ Article membership

```text
Market Master answers identity
Article Record answers membership
Master ⇏ “article contains entity”
```

### INV-12 — API ≠ domain SoT

```text
community_posts = domain / persistence authority
Article API     = read contract / transport
API ⇏ second domain SoT
```

### INV-13 — Rendered DOM ≠ content SoT

```text
Final rendered HTML
≠ Article raw-content SoT
(even under Model A or Model B)
```

---

# 33. Owner Decisions Locked

Các quyết định sau được khóa tại SoT:

| Decision | Status |
|----------|--------|
| Market Master = entity **identity** authority; Article Record = **membership** authority | 🔒 LOCKED |
| Market Master (`stocks/sectors/ecosystems`) là domain entity **identity** authority | 🔒 LOCKED |
| `community_posts` = Article persistence/domain; Article API = read contract (không phải domain SoT thứ hai) | 🔒 LOCKED |
| Final rendered HTML ≠ Article content SoT | 🔒 LOCKED |
| Frontend không phải entity authority | 🔒 LOCKED |
| Entity resolution phải validate against Master | 🔒 LOCKED |
| Precision-first | 🔒 LOCKED |
| VND/HCM phải có false-positive protection | 🔒 LOCKED |
| VCCorp.vn không được fixed/default author | 🔒 LOCKED |
| Publisher không được mặc định thành Author | 🔒 LOCKED |
| `tier_label` không được semantic-as-publisher nếu field là membership tier | 🔒 LOCKED |
| Dates tách khỏi attribution | 🔒 LOCKED |
| Empty entity sidebar phải omit | 🔒 LOCKED |
| Related không được chứa current article | 🔒 LOCKED |
| Runtime Store không phải SoT | 🔒 LOCKED |
| RSS không phải Market Master | 🔒 LOCKED |
| Backfill strategy | OPEN → Solution |
| Body link persistence strategy | OPEN → Solution |
| MockMarket removal/retention | OPEN → Solution |

---

# 34. Gate to Solution

Chỉ được mở `04-Solution.md` sau khi Owner xác nhận:

* [x] Audit rev. B / B+ accepted
* [x] `community_posts` = Article persistence/domain authority
* [x] Article API = read contract / transport — **không** domain SoT thứ hai
* [x] Market Master = entity **identity** SoT
* [x] Article Record = entity **membership** SoT
* [x] FE không phải Entity SoT
* [x] Entity resolution phải validate Master rồi persist membership
* [x] Precision-first
* [x] `VND` / `HCM` false-positive protection
* [x] `VCCorp.vn` không phải fixed/default author
* [x] Publisher ≠ Author
* [x] Tier ≠ Publisher
* [x] Empty sidebar omit
* [x] Related self-exclusion mandatory
* [x] Runtime Store = cache/transform
* [x] Final rendered HTML ≠ content SoT
* [x] Backfill strategy chuyển sang Solution
* [x] Body-link persistence Model A/B chuyển sang Solution
* [x] **Owner confirm absolute lock** sau Boundary AMEND 2026-08-09 → mở Solution

---

# 35. SoT Final Verdict

**APPROVED SOURCE-OF-TRUTH MODEL:**

```text
                 ┌─────────────────────┐
                 │    MARKET MASTER    │
                 │                     │
                 │ stocks              │
                 │ sectors             │
                 │ ecosystems          │
                 └──────────┬──────────┘
                            │
                       resolve/validate
                            │
                            ▼
RSS / Content Admin ──→ ARTICLE RECORD
                         │
                         │ community_posts
                         │
                         ▼
                    ARTICLE API
                         │
                         ▼
                ARTICLE DETAIL RUNTIME
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
            Body      Entities   Attribution
              │          │          │
              ▼          ▼          ▼
           Render     Render     Render
```

Và các nguyên tắc cấm:

```text
❌ FE invent ticker
❌ FE invent author
❌ FE invent publisher
❌ MockMarket as Master
❌ FALLBACK_TICKERS as Master
❌ RSS dictionary as Master
❌ Publisher → Author fallback
❌ VCCorp.vn → default author
❌ tier_label → fake publisher
❌ taxonomy derived at render → Article membership
❌ empty sidebar cards
❌ current article in Related
❌ Sector auto-membership trong scope task này (BR-AD-12 OUT)
❌ Ecosystem từ 1 mã / trùng tên Eco (thiếu ≥3 — BR-AD-13.THRESH)
```

**SoT status: OWNER ABSOLUTE LOCKED** (Boundary AMEND + **BR-AD-12/13 cascade AMEND** 2026-08-09).

**Implementation remains NOT AUTHORIZED until `04-Solution.md` + `05-Plan.md` được Owner approve.**

---

*SoT OWNER ABSOLUTE LOCKED · BR-AD-12/13 AMEND cascaded 2026-08-09. Task: [`00-README.md`](00-README.md). Next: [`04-Solution.md`](04-Solution.md).*
