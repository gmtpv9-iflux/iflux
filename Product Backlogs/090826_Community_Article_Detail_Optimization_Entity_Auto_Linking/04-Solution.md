# 04 — Solution

# Community Article Detail Optimization & Entity Auto-Linking

| | |
|--|--|
| **Task ID** | `090826_Community_Article_Detail_Optimization_Entity_Auto_Linking` |
| **BRD** | [`01-BRD.md`](01-BRD.md) — BR-AD-01…16 · **BR-AD-12/13 AMENDED** · **46 atomic Req ID** |
| **Mandatory Audit** | [`02-Mandatory-Audit.md`](02-Mandatory-Audit.md) — rev. B++ |
| **SoT** | [`03-SoT.md`](03-SoT.md) — **OWNER ABSOLUTE LOCKED** (+ BR-AD-12/13 cascade) |
| **Document** | Solution — approved way of solving |
| **Date** | 2026-08-09 |
| **Status** | 🔒 **OWNER ABSOLUTE LOCKED** · Amd A + **Amd B** (= BR-AD-12/13 AMEND cascade) · Traceability **46/46** |
| **Implementation** | ❌ **NOT AUTHORIZED** (cần Plan approve) |
| **Next gate** | [`05-Plan.md`](05-Plan.md) **OPEN** — chờ Owner LOCK Plan → Implementation |
| **Absolute Lock auth** | Owner Absolute Lock + Owner BR-AD-12/13 AMEND cascade (BRD→Audit→SoT→Solution) 2026-08-09 |

> **Purpose:** Quyết định kiến trúc / cơ chế để hiện thực BRD + SoT trong hiện trạng Audit.  
> Solution **không** được thay đổi authority đã khóa tại SoT.  
> Implementation chỉ sau Owner approve Solution **và** Plan.

### Traceability compliance (README §2)

| Check | Trước bổ sung | Sau bổ sung |
|-------|---------------|-------------|
| Form §2.5 `BR \| Audit \| SoT \| Solution \| Status` | ❌ thiếu | ✅ §0.2 |
| Cover atomic Req ID | ❌ 0 | ✅ **46/46** (sau BR-AD-13.THRESH) |
| SOL-AD-* registry | ❌ (chỉ SOL-01…05 principles) | ✅ §0.1 |
| Link đúng `03-SoT.md` | ❌ tên file sai | ✅ |

Nội dung §1…§55 giữ nguyên hướng kỹ thuật; §0 chỉ **gắn ID + map BR** — không redesign Solution.

---

# 0. Solution Traceability (README §2.5) — BẮT BUỘC

## 0.1 SOL-AD Registry (map → section nội dung bên dưới)

| SOL | Component | Semantics (tóm tắt) | SoT chính | Sections |
|-----|-----------|---------------------|-----------|----------|
| **SOL-AD-01** | Entity Resolution Pipeline | Candidate → normalize → Master validate → persist membership | SOT-AD-07 · SOT-AD-01 | §4 · §5 · §8 · §11 · §14 principles |
| **SOL-AD-02** | Ticker Resolution | Direct ticker resolve against `stocks` only | SOT-AD-03 · SOT-AD-07 | §6 |
| **SOL-AD-03** | Company Name Resolution | Name → `stocks.company_name` → identity; no hardcoded company dict authority | SOT-AD-12 · SOT-AD-03 | §7 |
| **SOL-AD-04** | VND False-positive | Currency context no-link; ticker only when context rules pass | SOT-AD-10 · SOT-AD-09 | §9 |
| **SOL-AD-05** | HCM False-positive | Geo/TP.HCM no-link; ticker only when context rules pass | SOT-AD-11 · SOT-AD-09 | §10 |
| **SOL-AD-06** | Persist Membership · Model B + Occurrence Binding | Membership + **occurrence binding** (Amd A Q1); DOM ≠ content SoT; không Hybrid Model A | SOT-AD-06 · SOT-AD-19 | §11 · §20 · §21 · **Amd A** |
| **SOL-AD-07** | Ecosystem Resolution (Sector OUT) | Eco derive + **≥3 constituent stocks**; Sector **OUT OF SCOPE** (Amd B) | SOT-AD-05 · SOT-AD-06 | §13 · **Amd B** |
| **SOL-AD-08** | Article API Contract | API = read/transport of persisted record + membership | SOT-AD-02 | §14 · §39 |
| **SOL-AD-09** | Attribution Canonical Model | Author ≠ Publisher ≠ Provider ≠ Tier | SOT-AD-13 · SOT-AD-02 | §15 |
| **SOL-AD-10** | VCCorp / No Fixed Author Fallback | No VCCorp default; no publisher→author fallback | SOT-AD-14 · SOT-AD-15 | §16 · §17 · §43 |
| **SOL-AD-11** | `tier_label` Migration | Stop using tier_label as publisher; publisher field riêng | SOT-AD-16 | §18 |
| **SOL-AD-12** | Dates Independent | Đăng/Cập nhật chỉ khi timestamp hợp lệ; tách attribution | SOT-AD-17 | §19 |
| **SOL-AD-13** | Body Link Presentation | Links from membership + deterministic render; preserve existing HTML safety | SOT-AD-08 · SOT-AD-19 · SOT-AD-24 | §21 · §22 · §23 |
| **SOL-AD-14** | Runtime Store Consumer | Store = cache/transform; no invent entity/author/publisher | SOT-AD-18 | §24 · §26 |
| **SOL-AD-15** | Legacy Authority Removal | Remove FE/Mock/FALLBACK/RSS-dict as authority; transitional only | SOT-AD-23 | §25 · §38 · §50 |
| **SOL-AD-16** | Sidebar Conditional | Render membership from API; omit empty cards (incl. Chủ đề empty rule) | SOT-AD-20 | §27 |
| **SOL-AD-17** | Layout Content-State | Expand content when no sidebar content; scoped CSS | SOT-AD-21 | §28 |
| **SOL-AD-18** | Related Exclude + Single Acquisition | `current ∉ related`; one acquisition contract; exclude before render | SOT-AD-22 | §29 · §30 · §31 |
| **SOL-AD-19** | RSS Ingestion Path | RSS = input; resolution at ingest before persist | SOT-AD-07 · SOT-AD-23 | §32 |
| **SOL-AD-20** | Backfill | Controlled batch re-processing; same canonical model | SOT-AD-24 | §35 · §37 |
| **SOL-AD-21** | Existing Article Safety | No break HTML/SEO/affiliate/URL | SOT-AD-24 | §36 · §22 |
| **SOL-AD-22** | Precision / Ambiguity | DO NOT LINK when ambiguous | SOT-AD-09 | §3 SOL-03 · §8 |

> Principles §2 `SOL-01…05` = cross-cutting; map vào SOL-AD-01 / 06 / 14 / 22.

---

## 0.2 Solution Checklist — form [`README.md`](../README.md) §2.5

> Mỗi **Req ID** = ≥1 hàng. Shared SOL được reference nhiều Req — **không gộp mất hàng Req**.  
> Chi tiết quyết định: Registry §0.1 + nội dung §1…§55.

| BR | Req ID | Audit | SoT | Solution | Trạng thái |
|----|--------|-------|-----|----------|------------|
| BR-AD-01 | BR-AD-01.STOCK | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 | SOL-AD-16 Sidebar Conditional | DECIDED — Owner review |
| BR-AD-01 | BR-AD-01.SECTOR | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 | **Amd B** — Sector OUT OF SCOPE (no auto-link/persist); sidebar omit khi không có membership | ⛔ OUT OF SCOPE (Amd B) |
| BR-AD-01 | BR-AD-01.ECO | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 | SOL-AD-16 · **Amd B** Eco ≥3 threshold trước persist/hiển thị | ✅ DECIDED (Amd B) |
| BR-AD-01 | BR-AD-01.EMPTY | AUD-AD-01 · AUD-AD-08 | SOT-AD-20 | SOL-AD-16 Sidebar Conditional | DECIDED — Owner review |
| BR-AD-01 | BR-AD-01.STOCK | AUD-AD-14 | SOT-AD-06 | SOL-AD-06 Persist Membership | DECIDED — Owner review |
| BR-AD-02 | BR-AD-02.WIDTH | AUD-AD-01 · AUD-AD-10 | SOT-AD-21 | SOL-AD-17 · **Amd A Q7** giữ `72ch` baseline | ✅ DECIDED (Amd A) |
| BR-AD-02 | BR-AD-02.IMG | AUD-AD-01 | SOT-AD-21 | SOL-AD-17 · **Amd A Q7** follow content container | ✅ DECIDED (Amd A) |
| BR-AD-02 | BR-AD-02.ASIDE | AUD-AD-01 · AUD-AD-10 | SOT-AD-21 | SOL-AD-17 Layout Content-State | DECIDED — Owner review |
| BR-AD-02 | BR-AD-02.RWD | AUD-AD-10 | SOT-AD-21 | SOL-AD-17 Layout Content-State | DECIDED — Owner review |
| BR-AD-02 | BR-AD-02.SCOPE | AUD-AD-08 | SOT-AD-21 | SOL-AD-17 Layout Content-State | DECIDED — Owner review |
| BR-AD-03 | BR-AD-03.1 | AUD-AD-13 | SOT-AD-14 · SOT-AD-15 | SOL-AD-10 VCCorp / No Fixed Fallback | DECIDED — Owner review |
| BR-AD-03 | BR-AD-03.2 | AUD-AD-13 · AUD-AD-03 | SOT-AD-02 · SOT-AD-13 | SOL-AD-09 Attribution Canonical · SOL-AD-08 API | DECIDED — Owner review |
| BR-AD-03 | BR-AD-03.3 | AUD-AD-13 | SOT-AD-13 · SOT-AD-15 | SOL-AD-09 · **Amd A Q6** VCCorp≠author | ✅ DECIDED (Amd A) |
| BR-AD-03 | BR-AD-03.4 | AUD-AD-13 | SOT-AD-15 · SOT-AD-14 | SOL-AD-10 · **Amd A Q3** omit author | ✅ DECIDED (Amd A) |
| BR-AD-03 | BR-AD-03.5 | AUD-AD-13 · AUD-AD-03 | SOT-AD-17 | SOL-AD-12 Dates Independent | DECIDED — Owner review |
| BR-AD-03 | BR-AD-03.6 | AUD-AD-13 | SOT-AD-02 | SOL-AD-09 · SOL-AD-08 (không xóa DB để fix UI) | DECIDED — Owner review |
| BR-AD-03 | BR-AD-03.7 | AUD-AD-13 · AUD-AD-06 | SOT-AD-15 · SOT-AD-18 | SOL-AD-10 · SOL-AD-14 Runtime Consumer | DECIDED — Owner review |
| BR-AD-03 | BR-AD-03.1 | AUD-AD-13 | SOT-AD-16 | SOL-AD-11 `tier_label` Migration | DECIDED — Owner review |
| BR-AD-04 | BR-AD-04.1 | AUD-AD-01 · AUD-AD-09 | SOT-AD-22 | SOL-AD-18 · **Amd A Q4** `related_to` | ✅ DECIDED* (Amd A) |
| BR-AD-04 | BR-AD-04.2 | AUD-AD-09 | SOT-AD-22 | SOL-AD-18 exclude before render (not CSS-hide) | DECIDED — Owner review |
| BR-AD-04 | BR-AD-04.ACC | AUD-AD-01 | SOT-AD-22 | SOL-AD-18 · **Amd A Q4** | ✅ DECIDED* (Amd A) |
| BR-AD-05 | BR-AD-05.AUTH | AUD-AD-02 · AUD-AD-05 · AUD-AD-11 · AUD-AD-12 | SOT-AD-03 | SOL-AD-01 · SOL-AD-02 Ticker vs `stocks` | DECIDED — Owner review |
| BR-AD-05 | BR-AD-05.BAN | AUD-AD-04 · AUD-AD-06 | SOT-AD-23 | SOL-AD-15 Legacy Authority Removal | DECIDED — Owner review |
| BR-AD-06 | BR-AD-06.1 | AUD-AD-05 | SOT-AD-07 | SOL-AD-01 · SOL-AD-02 verify ∈ Stocks | DECIDED — Owner review |
| BR-AD-06 | BR-AD-06.2 | AUD-AD-05 | SOT-AD-07 | SOL-AD-01 occurrence validation | DECIDED — Owner review |
| BR-AD-06 | BR-AD-06.3 | AUD-AD-05 | SOT-AD-08 | SOL-AD-06 · SOL-AD-13 · **Amd A Q1** occurrence binding | ✅ DECIDED (Amd A) |
| BR-AD-06 | BR-AD-06.4 | AUD-AD-05 · AUD-AD-03 | SOT-AD-06 · SOT-AD-19 | SOL-AD-06 Persist Membership (Model B) | DECIDED — Owner review |
| BR-AD-06 | BR-AD-06.5 | AUD-AD-05 · AUD-AD-07 | SOT-AD-07 · SOT-AD-18 | SOL-AD-14 · **Amd A Q1** render từ binding | ✅ DECIDED (Amd A) |
| BR-AD-07 | BR-AD-07.1 | AUD-AD-05 | SOT-AD-12 · SOT-AD-03 | SOL-AD-03 · **Amd A Q2** Name (TICKER) presentation | ✅ DECIDED (Amd A) |
| BR-AD-07 | BR-AD-07.2 | AUD-AD-04 · AUD-AD-06 | SOT-AD-23 | SOL-AD-15 no hardcoded company authority | DECIDED — Owner review |
| BR-AD-08 | BR-AD-08.1 | AUD-AD-05 · AUD-AD-04 | SOT-AD-07 · SOT-AD-09 | SOL-AD-01 · SOL-AD-22 multi-match | DECIDED — Owner review |
| BR-AD-09 | BR-AD-09.CUR | AUD-AD-04 · AUD-AD-06 | SOT-AD-10 | SOL-AD-04 VND currency no-link | DECIDED — Owner review |
| BR-AD-09 | BR-AD-09.TK | AUD-AD-04 | SOT-AD-10 · SOT-AD-09 | SOL-AD-04 VND ticker context rules | DECIDED — Owner review |
| BR-AD-10 | BR-AD-10.GEO | AUD-AD-04 · AUD-AD-06 | SOT-AD-11 | SOL-AD-05 HCM geo no-link | DECIDED — Owner review |
| BR-AD-10 | BR-AD-10.TK | AUD-AD-04 | SOT-AD-11 · SOT-AD-09 | SOL-AD-05 HCM ticker context rules | DECIDED — Owner review |
| BR-AD-11 | BR-AD-11.INGEST | AUD-AD-05 · AUD-AD-14 | SOT-AD-07 | SOL-AD-01 · SOL-AD-19 ingest-time resolution | DECIDED — Owner review |
| BR-AD-11 | BR-AD-11.BAN | AUD-AD-07 · AUD-AD-05 | SOT-AD-18 | SOL-AD-14 · SOL-AD-15 remove FE primary resolver | DECIDED — Owner review |
| BR-AD-12 | BR-AD-12.MODEL | AUD-AD-12 · AUD-AD-14 | SOT-AD-04 OUT | **BR-AD-12 AMEND / Amd B** — không auto-link/derive/persist Sector | ⛔ OUT OF SCOPE |
| BR-AD-12 | BR-AD-12.AUTH | AUD-AD-02 · AUD-AD-11 | SOT-AD-04 | **BR-AD-12 AMEND** — Master identity ngoài task; cấm auto-membership | ⛔ OUT OF SCOPE |
| BR-AD-13 | BR-AD-13.MODEL | AUD-AD-12 · AUD-AD-14 | SOT-AD-05 · SOT-AD-06 | SOL-AD-07 · **BR-AD-13 AMEND** Eco model | ✅ DECIDED (Amd B) |
| BR-AD-13 | BR-AD-13.AUTH | AUD-AD-02 · AUD-AD-11 | SOT-AD-05 | SOL-AD-07 Ecosystem Master identity | ✅ DECIDED (Amd B) |
| BR-AD-13 | BR-AD-13.THRESH | AUD-AD-14 · AUD-AD-12 | SOT-AD-05 · SOT-AD-09 | SOL-AD-07 · INV-ECO-01/02 — Eco ≥3; 1 mã ≠ Eco | ✅ DECIDED (Amd B / BR) |
| BR-AD-14 | BR-AD-14.PIPE | AUD-AD-04 · AUD-AD-14 | SOT-AD-07 | SOL-AD-01 Common Entity Resolution Pipeline | DECIDED — Owner review |
| BR-AD-14 | BR-AD-14.BAN | AUD-AD-08 · AUD-AD-04 | SOT-AD-01 | SOL-AD-01 · SOL-AD-15 no 3 independent authorities | DECIDED — Owner review |
| BR-AD-15 | BR-AD-15.PREC | AUD-AD-04 · AUD-AD-06 | SOT-AD-09 | SOL-AD-22 Precision / Ambiguity | DECIDED — Owner review |
| BR-AD-15 | BR-AD-15.SCOPE | AUD-AD-04 | SOT-AD-09 · SOT-AD-10 · SOT-AD-11 | SOL-AD-04 · SOL-AD-05 · SOL-AD-22 | DECIDED — Owner review |
| BR-AD-16 | BR-AD-16.SAFE | AUD-AD-09 | SOT-AD-24 | SOL-AD-21 Existing Article Safety | DECIDED — Owner review |
| BR-AD-16 | BR-AD-16.SEO | AUD-AD-09 | SOT-AD-24 | SOL-AD-21 SEO/affiliate/URL safety | DECIDED — Owner review |
| BR-AD-16 | BR-AD-16.SAFE | AUD-AD-09 | SOT-AD-19 | SOL-AD-06 Model B (persist refs; DOM ≠ SoT) | DECIDED — Owner review |
| BR-AD-16 | BR-AD-16.SAFE | — | SOT-AD-24 | SOL-AD-20 Backfill batch re-process | DECIDED — Owner review |

**Coverage (traceability):** **46/46** unique Req ID có ≥1 hàng Solution (đồng bộ BRD §10.1 sau AMEND).  
**Status meaning:** `DECIDED (Amd A/B)` = khóa bởi BR AMEND + Solution Amendment · `OUT OF SCOPE` = BR-AD-12 · `DECIDED — Owner review` = có trong §1…§55 · `DECIDED*` = khóa + Plan confirm discovery · **không** = Implementation DONE.

> **Traceability ≠ Feasibility.** Checklist §0.2 chỉ chứng minh đã map BR. Đánh giá khả thi xử lý BR → **§0.3**.

---

## 0.3 Feasibility Assessment vs BR

> **Lịch sử:** Agent review phát hiện BLOCKED/PARTIAL (§0.3.B / §0.3.C dưới đây = **ARCHIVE**).  
> **Hiện hành:** Amendment A (Q1–Q8) CLOSED + **Amendment B** (Sector OUT · Eco ≥3) → §0.3.D / §0.3.E / §0.3.F · **OWNER ABSOLUTE LOCKED**.

### Verdict tổng (sau Amendment A + Absolute Lock)

| | |
|--|--|
| **Hướng kiến trúc** | ✅ Khớp SoT |
| **Traceability README §2.5** | ✅ 46/46 Req |
| **Feasibility architecture** | ✅ **CLOSED** (Q1–Q8) — không còn BLOCKED Solution-level |
| **Solution gate** | 🔒 **OWNER ABSOLUTE LOCKED** — Plan được mở khi Owner ra lệnh viết `05-Plan.md` |

### 0.3.A — BR groups đã đủ khả thi (hướng + quyết định chính)

| BR group | Req | Vì sao khả thi với Solution hiện tại |
|----------|-----|-------------------------------------|
| Sidebar empty | BR-AD-01.* | §27 omit khi `length===0`; membership từ API — đủ đóng BR-AD-01 nếu API có entities |
| Related self-exclude | BR-AD-04.* | §29–31 + **Amd A Q4** `related_to` single path + exclude trước render |
| Stock Master authority | BR-AD-05.* | §6 / §15 legacy removal — đủ |
| Precision / VND / HCM default | BR-AD-09/10/15 | §8–10 default DO NOT LINK — đủ hướng false-positive |
| Ingest-time ownership | BR-AD-11.* | §4 / §11 / §24–25 — đủ hướng loại FE primary |
| Safety baseline | BR-AD-16.SAFE/SEO | §21–22 / §36 — đủ constraint |
| Attribution no invent | BR-AD-03.1/3.4/3.6/3.7 | §16–17 + **Amd A Q3/Q6** omit author · VCCorp ≠ author |
| Dates tách | BR-AD-03.5 | §19 — đủ |
| Multi-match | BR-AD-08.1 | Persist mọi RESOLVED — đủ |
| Common pipeline (hướng) | BR-AD-14.* | §4 · §13 — đủ hướng |

### 0.3.B — Lỗ hổng khả thi (ARCHIVE — đã đóng bởi Amendment A)

> Giữ để truy vết review. **Không** còn là trạng thái hiện hành.

#### B1 — Model B thiếu **occurrence binding** → rủi ro không đóng BR-AD-06 body link

| | |
|--|--|
| **Req** | BR-AD-06.3 / BR-AD-06.5 · BR-AD-07.1 |
| **Vấn đề** | Model B persist `Stocks[]` + raw `body_html`, rồi “deterministic renderer”. **Chưa khóa** renderer biết **vị trí nào trong body** để gắn `<a>`. Chỉ có list membership → đủ **sidebar**, **không đủ** auto-link trong nội dung. |
| **Hệ quả** | Có thể PASS sidebar + FAIL “HPG trong đoạn văn được link”. |
| **Cần Owner/Solution chốt một** | **B1-a** Persist occurrence spans/offsets (hoặc token anchors) cùng relationship · **B1-b** Hybrid: persist membership + persist linkified HTML (Model A) cho body · **B1-c** Thu hẹp BR body-link → chỉ sidebar (đổi BR — **cấm** ở Solution; phải escalate BRD) |
| **Status** | 🔴 **BLOCKED** cho BR-AD-06.3/06.5 body presentation |

#### B2 — BR-AD-07.1 `Name (TICKER)` rewrite chưa có cơ chế

| | |
|--|--|
| **Req** | BR-AD-07.1 |
| **Vấn đề** | §7 resolve company → Stock relationship. §21 nói additive transform, preserve HTML. **Không** mô tả insert ` (TICKER)` sau tên DN như BRD ví dụ. |
| **Cần chốt** | Renderer có **rewrite text** `Hòa Phát` → `Hòa Phát (HPG)` với HPG link, hay chỉ link khi ticker đã xuất hiện trong text? |
| **Status** | 🔴 **BLOCKED** / under-spec |

#### B3 — Attribution UI khi `author` absent chưa chọn SoT option A–D

| | |
|--|--|
| **Req** | BR-AD-03.3 · BR-AD-03.4 |
| **Vấn đề** | §17 `author = null` + “UI xử lý presentation rule” — **không chọn** Omit / Publisher riêng / Neutral / Preserve verified. |
| **Status** | 🟠 **PARTIAL** — policy đủ, presentation chưa khóa |

#### B4 — Related: chưa chọn **một** acquisition path cụ thể

| | |
|--|--|
| **Req** | BR-AD-04.* |
| **Vấn đề** | §29–31 cấm dual path nhưng **không chọn** `related_to` (loadPostPage) **hay** DailyFeed category+exclude (hay API mới). |
| **Status** | 🟠 **PARTIAL** — invariant đủ, ownership path chưa khóa |

#### B5 — Sector / Ecosystem: candidate source chưa khóa

| | |
|--|--|
| **Req** | BR-AD-12.* · BR-AD-13.* |
| **Vấn đề** | §13 “tương tự Stock” + có thể dùng taxonomy rồi persist. **Chưa khóa:** extract tên ngành/HST từ text, hay derive từ stock membership sau khi stock RESOLVED rồi persist? Hai cách khác precision/BR. |
| **Status** | 🟠 **PARTIAL** |

#### B6 — `VCCorp.vn` upstream meta vs product intent

| | |
|--|--|
| **Req** | BR-AD-03.3 · SOT-AD-14 |
| **Vấn đề** | CafeF meta `article:author=VCCorp.vn` (~2705 bài) sẽ được coi “verified upstream” → vẫn hiện VCCorp.vn hàng loạt. Đúng chữ SoT (không default khi missing) nhưng **có thể lệch** Owner intent “không luôn VCCorp”. |
| **Cần chốt** | Meta vendor/holding → field **vendor** (không map `author`), hay giữ author khi upstream ghi rõ? |
| **Status** | 🟠 **PARTIAL** (policy ambiguity) |

#### B7 — Layout width `72ch` (BR-AD-02.WIDTH / IMG)

| | |
|--|--|
| **Req** | BR-AD-02.WIDTH · BR-AD-02.IMG |
| **Vấn đề** | §28 chỉ expand khi không sidebar — **không** quyết định nới/xóa `72ch`. |
| **Status** | 🟠 **PARTIAL** |

#### B8 — Persistence shape: normalized tables vs payload arrays

| | |
|--|--|
| **Req** | BR-AD-06.4 · BR-AD-01 (API entities) |
| **Vấn đề** | §3.2 “ưu tiên bảng quan hệ” nhưng “không tạo mới nếu existing đủ”. Audit = `payload.tickers[]`. Plan có thể phân vân schema lớn. |
| **Khuyến nghị Solution** | Khóa **canonical API shape** `entities.{stocks,sectors,ecosystems}`; storage = **Modify existing payload arrays (+ ids)** trừ khi Audit buộc bảng mới — tránh scope schema song song. |
| **Status** | 🟠 **PARTIAL** (nên khóa trước Plan) |

### 0.3.C — Ma trận khả thi theo Req (ARCHIVE — pre-Amd A)

> **ARCHIVE.** Trạng thái hiện hành = §0.3.E (mọi BLOCKED/PARTIAL feasibility đã CLOSED).

| Req | Feasibility (pre-Amd A) | Note |
|-----|-------------------------|------|
| BR-AD-01.STOCK/SECTOR/ECO/EMPTY | ✅ OK | Nếu API entities + omit |
| BR-AD-02.WIDTH/IMG | 🟠 PARTIAL | → Q7 CLOSED |
| BR-AD-02.ASIDE/RWD/SCOPE | ✅ OK / PARTIAL RWD | Aside state OK; RWD → Verification |
| BR-AD-03.1/3.5/3.6/3.7 | ✅ OK | |
| BR-AD-03.2/3.3/3.4 | 🟠 PARTIAL | → Q3/Q6 CLOSED |
| BR-AD-04.* | 🟠 PARTIAL | → Q4 CLOSED |
| BR-AD-05.* | ✅ OK | |
| BR-AD-06.1/06.2/06.4 | ✅ OK | Resolve + persist membership |
| BR-AD-06.3/06.5 | 🔴 BLOCKED | → Q1 CLOSED |
| BR-AD-07.1 | 🔴 BLOCKED | → Q2 CLOSED |
| BR-AD-07.2 | ✅ OK | |
| BR-AD-08.1 | ✅ OK | |
| BR-AD-09.* / BR-AD-10.* / BR-AD-15.* | ✅ OK | Default no-link |
| BR-AD-11.* | ✅ OK | |
| BR-AD-12.* / BR-AD-13.* | 🟠 PARTIAL | → Q5 CLOSED |
| BR-AD-14.* | ✅ OK | |
| BR-AD-16.* | ✅ OK | + Model B safety |

**Đếm pre-Amd A (archive):** ✅ ~28 · 🟠 ~13 · 🔴 4 — **superseded bởi §0.3.E**.

### 0.3.D — Owner Decisions Q1–Q8 — **CLOSED by Amendment A**

| # | Decision (Owner propose → Solution Amd A) | Status |
|---|-------------------------------------------|--------|
| **Q1** | **B1-a** Persist occurrence binding; giữ Model B; **không** Hybrid Model A làm content authority | ✅ CLOSED |
| **Q2** | **Có rewrite** `Name (TICKER)` ở presentation khi company-name resolve chắc; **không** ghi đè raw body | ✅ CLOSED |
| **Q3** | **Omit author** khi author null; publisher/provider field riêng | ✅ CLOSED |
| **Q4** | Related = **`related_to`** single contract (+ exclude); DailyFeed không cạnh tranh Related section | ✅ CLOSED* |
| **Q5** | ~~Sector/Eco derive từ Stock~~ → **SUPERSEDED by Amendment B** (Sector OUT · Eco ≥3) | ♻️ SUPERSEDED (Amd B) |
| **Q6** | `VCCorp.vn` vendor/holding meta → **vendor/provider**, **không** map author | ✅ CLOSED |
| **Q7** | **Giữ `72ch`** baseline; expand main khi empty sidebar trong contract hiện có; không tự bỏ max-width | ✅ CLOSED |
| **Q8** | **Payload arrays + IDs** trên Article record/API; không tạo relationship tables mới trừ Audit buộc | ✅ CLOSED · shape **Amd B**: `stocks[]` + `ecosystems[]` |

\* Q4: Plan phải confirm `related_to` là existing canonical path (Audit đã ghi dual-path; Solution chọn `related_to` làm path sống).

> Chi tiết khóa: **§ Amendment A** + **§ Amendment B**. Không đổi BRD/SoT.

### 0.3.E — Feasibility sau Amendment A

| Metric | Trước Amd A | Sau Amd A |
|--------|-------------|-----------|
| Traceability | 45/45 | **46/46** (+ BR-AD-13.THRESH) |
| 🔴 BLOCKED Req | 3+ (06.3/06.5/07.1) | **0** |
| 🟠 PARTIAL feasibility gaps | B3–B8 | **CLOSED** |
| Solution Absolute Lock | HOLD / READY | 🔒 **OWNER ABSOLUTE LOCKED** (+ Amd B) |
| Plan | NOT AUTHORIZED to Impl | 🔍 **05-Plan OPEN** (46/46) — chờ Owner LOCK |

### 0.3.F — Amendment B (constraint refinement — hiện hành)

| # | Constraint | Status |
|---|------------|--------|
| **B-A** | **Sector OUT OF SCOPE** — không auto-link / derive / persist Sector trong Solution này | ✅ LOCKED |
| **B-B** | **Ecosystem ≥3** — chỉ persist/hiển thị Eco khi ≥3 mã cổ phiếu thuộc Eco đó được nhắc rõ trong bài | ✅ LOCKED |
| **B-XOR** | Stock ↔ Ecosystem **không** XOR loại trừ nhau; XOR cũ Stock/Sector/Eco/Exchange phải **Modify** cho phép `stocks∪ecosystems`; thêm **semantic exclusion** (1 mã trùng tên Eco ≠ Eco membership) | ✅ LOCKED |

Multi-membership hiện hành:

```text
Article
├── stocks[]
└── ecosystems[]
```

---

# Amendment A — Close Feasibility Gaps (Q1–Q8)

| | |
|--|--|
| **Applies to** | Document này (`04-Solution.md`) |
| **Purpose** | Đóng BLOCKED/PARTIAL §0.3 trước khi mở Plan |
| **BRD / SoT** | **Không đổi** |
| **Status** | ✅ Decisions written · 🔒 **OWNER ABSOLUTE LOCKED** (auth = lệnh Owner «Chạy đi» 2026-08-09) |

## A.1 — Correction to Solution Verdict

* Traceability: **46/46 Req**
* Architectural direction: **đúng SoT**
* Feasibility (pre-Amd A): **chưa đủ** → **CLOSED by Q1–Q8**
* Solution: 🔒 **OWNER ABSOLUTE LOCKED**
* Implementation: **NOT AUTHORIZED** until Plan approve

Nguyên tắc:

> **Solution phải khóa cơ chế đủ để chứng minh BR có thể implement được; Plan chỉ được chuyển các quyết định đã khóa thành work packages.**

## A.2 — Q1 Body auto-link = B1-a Occurrence Binding

**Không** đổi Model B → Model A / Hybrid A làm content authority.

Canonical:

```text
Raw Article Body
      ├── Entity Membership (Stock + Ecosystem†)
      └── Entity Occurrence Binding
             ├── entity_id
             ├── occurrence identity
             ├── matched text
             └── deterministic location/anchor metadata
```

† **Amd B:** Sector OUT OF SCOPE. Ecosystem chỉ khi ≥3 constituent stocks (xem Amendment B).

Authority:

```text
Raw body              = Content SoT
Entity membership     = Entity relationship SoT
Occurrence binding    = Presentation mapping metadata
Rendered linked HTML  = Derived presentation (≠ SoT)
```

Example:

```text
Body: "Hòa Phát tiếp tục..."
→ resolve company → HPG
→ persist membership Stock HPG + occurrence "Hòa Phát"
→ renderer presentation: Hòa Phát (HPG) linked (BR-AD-07.1)
```

Re-process: body_version change → invalidate/recompute bindings.  
**CẤM:** Stocks[] + raw body + “renderer tự tìm lại” (runtime resolver).

## A.3 — Q2 Company Name → `Name (TICKER)` presentation

Khi company-name resolve chắc chắn → presentation **`Name (TICKER)`**.  
`(TICKER)` derived from Stock identity — **không** ghi permanent vào raw `body_html` (tránh `Hòa Phát (HPG) (HPG)` khi re-ingest).

## A.4 — Q3 Author absent → Omit

`author = null` → **không render Author** (không Unknown / Publisher / Provider / VCCorp làm author).  
Publisher / provider = fields độc lập; chỉ render khi có giá trị hợp lệ.

## A.5 — Q4 Related = `related_to` single path

```text
Article Detail → related_to → exclude current → related[]
```

Không dual với DailyFeed/Category cho cùng Related section.  
`currentArticle ∉ related[]` trước presentation. FE defensive filter ≠ authority.

## A.6 — Q5 Sector / Ecosystem source — **SUPERSEDED by Amendment B**

> **Không còn hiệu lực** phần “derive Sector + Ecosystem từ Stock” bên dưới.  
> Hiện hành: **Amendment B** — Sector OUT OF SCOPE · Ecosystem ≥3 constituent stocks · multi-membership = `stocks[]` + `ecosystems[]` only.

~~Ưu tiên: Stock resolved → derive Sector/Ecosystem…~~ (archive Amd A Q5)

### A.6.1 — `ARTICLE_ENTITY_XOR` — **UPDATED by Amendment B**

**Evidence:** `backend/src/modules/community/community-articles.service.js` — `normalizeArticleInput` ném `ARTICLE_ENTITY_XOR` khi gắn **>1 nhóm** trong `{tickers, sectors, ecosystems, exchange}`.

**Hướng khóa hiện hành (Amd B — không invent table mới):**

```text
1) Modify XOR: cho phép đồng thời stocks ∪ ecosystems
   (KHÔNG giữ Stock XOR Ecosystem)
2) Sector: OUT OF SCOPE this task — Solution không auto-link/derive/persist Sector
3) Semantic exclusion (bắt buộc):
   Stock-level mention ≠ automatic Ecosystem membership.
   Ecosystem chỉ khi ≥3 distinct constituent stock codes của Eco đó
   được nhắc rõ trong Article.
```

Ví dụ khóa:

| Body mentions | stocks[] | ecosystems[] |
|---------------|----------|--------------|
| chỉ VIC | VIC | ❌ (không gắn Eco VIC vì trùng tên / 1 mã) |
| VIC + VHM + VRE (cùng Eco VIC) | VIC, VHM, VRE | ✓ Eco VIC |

Plan WP: Impact Analysis `ARTICLE_ENTITY_XOR` · Modify normalize cho `stocks∪ecosystems` · enforce Eco ≥3 · không workaround FE.

## A.7 — Q6 VCCorp.vn

Upstream `article:author = VCCorp.vn` kiểu holding/vendor → **vendor/provider**, **không** promote thành `author`.  
Cấm: missing→VCCorp · publisher→author · provider→author.  
Author UI chỉ hiện VCCorp khi evidence thực sự là author.

## A.8 — Q7 Content width

**Giữ `72ch` baseline.** Không remove max-width chỉ vì sidebar empty.  
Empty sidebar → main expands **within** existing Article Detail width contract.  
Đổi `72ch` chỉ nếu BRD + DS + Audit buộc. Images follow content container — không `100vw`.

## A.9 — Q8 Storage — **shape refined by Amendment B**

Canonical API **cho task này** (Amd B):

```json
{ "entities": { "stocks": [], "ecosystems": [] } }
```

(+ occurrence binding — Plan chọn field shape trên existing payload).  

**Không** yêu cầu Solution persist `sectors[]` (Sector OUT OF SCOPE). Legacy `sectors` nếu có trên record cũ: không mở rộng bởi pipeline này; sidebar omit khi empty theo SOL-AD-16.

**Ưu tiên modify existing payload + IDs.** New relationship tables chỉ khi existing không đáp ứng — Owner approve architectural delta.

**Cùng khóa với A.6.1 / Amd B:** `stocks∪ecosystems` được phép; XOR cũ chặn Stock↔Eco phải Modify; Eco còn semantic ≥3.

## A.10 — Final Body Auto-Link Architecture

```text
MARKET MASTER → Candidate Resolution → Context Validation
        → Entity Membership + Occurrence Binding
        → ARTICLE RECORD → ARTICLE API → RUNTIME CONSUMER
        → Deterministic Renderer → Linked Presentation
```

Runtime **không**: candidate extraction · Master lookup · entity/author/publisher guessing.

## A.11 — Body Link Invariants

| ID | Invariant |
|----|-----------|
| INV-BODY-01 | Body link → resolved Master entity |
| INV-BODY-02 | No Master → DO NOT LINK |
| INV-BODY-03 | Ambiguous → DO NOT LINK |
| INV-BODY-04 | Company resolve → `Name (TICKER)` presentation (BR-AD-07.1) |
| INV-BODY-05 | Preserve existing valid `<a>` |
| INV-BODY-06 | No nested anchors |
| INV-BODY-07 | Raw body not overwritten by presentation |
| INV-BODY-08 | Body update invalidates/recomputes bindings |
| INV-BODY-09 | Same body version + membership + binding → deterministic presentation |
| INV-BODY-10 | **Amd B** — Sector không được auto-link / persist bởi Solution này |
| INV-BODY-11 | **Amd B** — Ecosystem membership chỉ khi ≥3 distinct constituent stock codes thuộc Eco được nhắc rõ; 1 mã (kể cả tên trùng Eco) ≠ Eco |

## A.12 — SOL registry clarification

| SOL | Amendment |
|-----|-----------|
| SOL-AD-06 | Model B = Membership + Occurrence Binding |
| SOL-AD-13 | Body links từ persisted occurrence binding |
| SOL-AD-03 | Company Name → `Name (TICKER)` presentation |
| SOL-AD-07 | **Amd B** — Ecosystem + ≥3; Sector OUT OF SCOPE |
| SOL-AD-09/10 | Author omit · VCCorp ≠ author |
| SOL-AD-17 | `72ch` baseline |
| SOL-AD-18 | Related = `related_to` only |
| SOL-AD-06 / Q8 | Storage = existing payload+IDs · shape `stocks`+`ecosystems` (Amd B) |

## A.13 — Plan Boundary

Plan **được** discovery: schema fields · services · endpoints · payload shape cho occurrence · migration · tests · rollout · **Modify `ARTICLE_ENTITY_XOR`** cho `stocks∪ecosystems` · enforce Eco ≥3 (Amd B).  

Plan **không được** đổi: Model B · Name(TICKER) · Author omit · VCCorp · Related single-path · **Amd B Sector OUT / Eco ≥3** · 72ch · storage preference (payload+IDs first).  

Discovery conflict → STOP → Solution Amendment → Owner → continue.

## A.14 — Absolute Lock Gate

**Owner authorization:**

> Absolute Lock («Chạy đi») + lệnh apply **Amd B** (2026-08-09): chỉ sửa Solution/README; không đụng BRD/SoT; không mở Plan; không Implementation.

```text
[x] BRD / Audit / SoT
[x] Traceability 46/46 (BR-AD-13.THRESH)
[x] BR-AD-12/13 AMEND cascaded (BRD→Audit→SoT→Solution)
[x] Q1–Q8 CLOSED (Amendment A) — Q5 SUPERSEDED by Amd B
[x] Amendment B LOCKED (Sector OUT · Eco ≥3 · XOR stocks∪ecosystems)
[x] Final consistency check (live checklist không BLOCKED/PARTIAL; §0.3.B/C = ARCHIVE)
[x] A.6.1 ARTICLE_ENTITY_XOR → Modify for stocks∪ecosystems + Eco semantic ≥3
[x] Owner Absolute Lock 04-Solution (+ Amd B)
[x] Open 05-Plan          ← Owner «được phép mở plan» / «chạy» 2026-08-09
[x] Plan approve / LOCK   ← Owner «tiến hành đi» 2026-08-09
[x] Implementation        ← WP-0…11 in progress / shipping
```

**Implementation AUTHORIZED under locked Plan.**

---

# Amendment B — Sector OUT · Ecosystem ≥3

| | |
|--|--|
| **Origin** | **BR-AD-12 / BR-AD-13 AMEND** (Owner) → Audit rev. B++ → SoT cascade → Solution Amd B |
| **Applies to** | Solution (cơ chế) — **đối chứng bắt buộc** với BRD §10.1 + SoT SOT-AD-04/05/06 |
| **Type** | Requirement change cascaded — không chỉ “Solution note” |
| **Supersedes** | Amd A **Q5** · A.6 / A.6.1 / A.9 shape `sectors[]` |
| **Keeps** | Q1 occurrence · Q2 Name(TICKER) · Q3 omit author · Q4 `related_to` · Q6 VCCorp · Q7 `72ch` · Q8 payload+IDs |
| **Status** | 🔒 **LOCKED** · Absolute Lock **giữ nguyên** |

## B.1 — Remove Sector (OUT OF SCOPE)

```text
Sector is explicitly OUT OF SCOPE for this task and shall not be
auto-linked, derived, or persisted by this Solution.
```

* BR-AD-12.* → Solution status **OUT OF SCOPE (Amd B)** (traceability giữ hàng; không implement).  
* Sidebar Sector: omit khi không có membership (SOL-AD-16); pipeline mới **không** sinh Sector.  
* Market Master `sectors` vẫn tồn tại ngoài task — **không** dùng làm target auto-link của Solution này.

## B.2 — Ecosystem minimum-membership rule

```text
An Ecosystem may only be derived/persisted when at least 3 distinct
constituent stock codes belonging to that Ecosystem are explicitly
mentioned in the Article.

A single stock-code mention, even when its name matches an Ecosystem
name, MUST NOT by itself create an Ecosystem association.
```

Anti-duplication / semantic exclusion:

```text
Stock association and Ecosystem association are not mutually exclusive,
but the Ecosystem association is subject to the ≥3 constituent-stock threshold.

→ Không được coi cùng ngữ cảnh là Stock VIC và Ecosystem VIC một cách vô lý
  chỉ vì tên trùng (1 mã VIC ≠ Eco VIC).
```

Ví dụ:

```text
"VIC tăng mạnh..."
→ stocks: [VIC] · ecosystems: []

"VIC, VHM và VRE cùng tăng..."
→ stocks: [VIC, VHM, VRE] · ecosystems: [VIC ecosystem]  (nếu 3 mã ∈ Eco đó)
```

## B.3 — Multi-membership shape

```text
Article
├── stocks[]          ← Auto-link + occurrence binding (giữ Amd A Q1)
└── ecosystems[]      ← Auto-link + occurrence binding + ≥3 rule
```

**Không** còn yêu cầu `sectors[]` trong Solution membership của task này.

## B.4 — `ARTICLE_ENTITY_XOR` (refined)

Existing XOR: Stock XOR Sector XOR Ecosystem XOR Exchange.

| Rule | Decision |
|------|----------|
| Stock XOR Ecosystem | **Gỡ** — cho phép đồng thời |
| Sector trong XOR / pipeline | **OUT OF SCOPE** this task (không persist bởi Solution) |
| Semantic | Stock mention **không** tự suy ra Eco; Eco cần ≥3 constituent codes |

Plan MUST Modify normalize theo bảng trên — không giữ XOR Stock↔Eco; không invent tables (Q8).

## B.5 — Invariants (Amd B)

| ID | Invariant |
|----|-----------|
| INV-ECO-01 | Eco persist ⇒ ≥3 distinct constituent stock codes mentioned ∈ that Eco |
| INV-ECO-02 | 1 stock code (name-match Eco) ⇒ **no** Eco association |
| INV-ECO-03 | Stock membership và Eco membership không XOR loại trừ nhau |
| INV-SEC-01 | Solution **không** auto-link / derive / persist Sector |

## B.6 — Traceability continuity

```text
BRD BR-AD-12 OUT + BR-AD-13.THRESH
        ↓
Audit checklist 46/46 (rev. B++)
        ↓
SoT SOT-AD-04/05/06 AMEND
        ↓
Solution Amd B (cơ chế + XOR)
```

*(Lịch sử Amd B cascade — Plan đã mở sau đó theo lệnh Owner.)* **không** Implementation đến khi Owner LOCK Plan.

---

# 1. Solution Executive Decision

## 1.1 Final architectural direction

Task sẽ được triển khai theo mô hình:

```text
                         ┌──────────────────────┐
                         │    MARKET MASTER     │
                         │                      │
                         │ stocks               │
                         │ sectors              │
                         │ ecosystems           │
                         └──────────┬───────────┘
                                    │
                         resolve / validate
                                    │
                                    ▼
RSS / Admin ───────→ Article Ingestion
                         │
                         │ entity resolution
                         │ attribution normalization
                         ▼
                  ┌───────────────────┐
                  │  Article Record   │
                  │ community_posts   │
                  └─────────┬─────────┘
                            │
                            │ canonical API
                            ▼
                  ┌───────────────────┐
                  │    Article API    │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │ Article Runtime   │
                  │ cache + transform │
                  └─────────┬─────────┘
                            │
                ┌───────────┼───────────┐
                ▼           ▼           ▼
              Body       Entities   Attribution
                │           │           │
                └───────────┼───────────┘
                            ▼
                         Render
```

### Core decision

**Entity resolution được chuyển về domain/ingestion boundary.**

Article Detail frontend:

```text
API → normalize → render
```

không còn:

```text
API → guess → resolve → invent → render
```

---

# 2. Solution Principles

Solution này tuân thủ các nguyên tắc:

### SOL-01 — Authority First

Mọi entity phải resolve từ Market Master.

```text
stocks
sectors
ecosystems
```

không bị thay thế bởi frontend dictionary hoặc runtime heuristic.

---

### SOL-02 — Persist Relationship, Not Guess

Sau khi entity được resolve thành công, relationship giữa Article và Entity phải trở thành dữ liệu authoritative của Article.

```text
candidate
   ↓
resolve
   ↓
validate
   ↓
persist relationship
```

Không chạy lại detection mỗi lần user mở Article Detail.

---

### SOL-03 — Precision First

Không đủ chắc chắn:

```text
DO NOT LINK
```

Không có cơ chế "link thử rồi sửa ở frontend".

---

### SOL-04 — Runtime Is Consumer

Runtime chỉ:

* consume API;
* normalize;
* transform presentation;
* cache;
* render.

Runtime không được:

* tạo entity;
* tạo attribution;
* suy diễn membership;
* tự bổ sung publisher/author.

---

### SOL-05 — Deterministic Rendering

Cùng một Article API response phải tạo ra cùng một entity presentation.

Không phụ thuộc:

* thứ tự load JS;
* MockMarket;
* browser state;
* regex dictionary;
* random fallback;
* external page parsing.

---

# 3. Target Data Model

## 3.1 Article entity relationship

Solution chọn **persisted relationship model** làm canonical domain model.

Conceptual structure:

```text
Article
├── Stocks[]
├── Sectors[]
└── Ecosystems[]
```

Entity reference phải có đủ identity để:

1. xác định entity;
2. validate entity;
3. render entity;
4. tạo presentation URL.

Schema implementation cụ thể sẽ sử dụng existing database conventions của codebase thay vì tạo một parallel entity system.

---

## 3.2 Recommended relationship representation

Ưu tiên quan hệ normalized:

```text
community_posts
        │
        ├── article_stock_relationship
        │        └── stock_id → stocks.id
        │
        ├── article_sector_relationship
        │        └── sector_id → sectors.id
        │
        └── article_ecosystem_relationship
                 └── ecosystem_id → ecosystems.id
```

Tên bảng thực tế phải được xác nhận trong codebase trước implementation.

**Không được tự tạo schema mới nếu existing relationship model đã đáp ứng contract.**

---

# 4. Entity Resolution Architecture

## 4.1 Resolution pipeline

Pipeline chuẩn:

```text
Raw Article
    │
    ▼
Candidate Extraction
    │
    ├── explicit ticker
    ├── company name
    └── other supported candidate
    │
    ▼
Normalization
    │
    ▼
Market Master Lookup
    │
    ▼
Context Validation
    │
    ├── valid → resolved entity
    │
    └── ambiguous → discard
    │
    ▼
Persist Article Relationship
    │
    ▼
Article API
```

---

# 5. Candidate Extraction

Candidate extraction có thể sử dụng các kỹ thuật hiện có như:

* tokenization;
* regex;
* source-specific metadata;
* company-name matching;
* structured upstream metadata.

Nhưng cần phân biệt:

```text
Extraction
≠
Resolution
```

Regex chỉ trả lời:

> "Có một candidate giống ticker."

Nó không trả lời:

> "Đây chắc chắn là Stock entity."

---

# 6. Ticker Resolution

## 6.1 Direct ticker

Candidate:

```text
FPT
VIC
VCB
HCM
...
```

được lookup trong:

```text
stocks
```

Sau đó validate theo entity state/domain rule.

Chỉ entity đã resolve mới được persist.

---

## 6.2 No direct hardcoded authority

Không được triển khai:

```javascript
const FALLBACK_TICKERS = [...]
```

hoặc:

```javascript
const tickerMap = {
  FPT: ...,
  VIC: ...
}
```

làm source authority.

Nếu legacy dictionary vẫn cần trong transition:

```text
legacy candidate aid
```

nhưng kết quả cuối cùng **bắt buộc validate against `stocks`**.

---

# 7. Company Name Resolution

Company-name detection được xử lý như một resolution strategy.

```text
Article text
   ↓
company candidate
   ↓
normalize
   ↓
stocks.company_name
   ↓
candidate match
   ↓
context validation
   ↓
Stock relationship
```

Không dùng hardcoded:

```text
"FPT Corporation" → "FPT"
```

làm authority.

Nếu database có nhiều company name aliases, Solution/Plan có thể bổ sung normalized lookup capability, nhưng authority cuối cùng vẫn là Stock Master.

---

# 8. Ambiguity Handling

Resolution phải có ba trạng thái logic:

```text
RESOLVED
AMBIGUOUS
NOT_FOUND
```

### RESOLVED

Persist relationship.

### AMBIGUOUS

Không persist.

### NOT_FOUND

Không persist.

Không được biến:

```text
AMBIGUOUS
```

thành:

```text
BEST GUESS
```

---

# 9. VND Resolution

`VND` phải đi qua dedicated ambiguity protection.

Baseline:

```text
VND
```

không được link.

Các context như:

```text
100.000 VND
20 triệu VND
giá bằng VND
```

phải bị loại.

Chỉ khi Solution implementation xác định được một context đủ mạnh để chứng minh `VND` là Stock candidate mới được resolve.

**Default behavior = DO NOT LINK.**

---

# 10. HCM Resolution

`HCM` cũng có ambiguity protection.

Các context:

```text
TP.HCM
TP HCM
Thành phố Hồ Chí Minh
khu vực HCM
```

không được link.

Ticker `HCM` chỉ được resolve khi context phù hợp với stock usage.

**Default behavior = DO NOT LINK khi ambiguous.**

---

# 11. Entity Persistence Strategy

## 11.1 Resolution happens before Article API

Entity relationship phải được xác định trước khi Article Detail consume Article.

Target:

```text
Ingestion
   ↓
Persist relationship
   ↓
API
   ↓
Runtime
```

Không:

```text
API
   ↓
FE scans body
   ↓
resolve
```

---

## 11.2 Idempotency

Reprocessing cùng một Article phải không tạo duplicate relationship.

Conceptually:

```text
(article_id, entity_id)
```

phải có uniqueness semantics phù hợp với relationship type.

Ví dụ:

```text
Article 100
  ├── Stock 5
  ├── Stock 8
  └── Stock 12
```

Re-running resolver:

```text
Article 100
  ├── Stock 5
  ├── Stock 8
  └── Stock 12
```

không được tạo bản ghi thứ hai.

---

# 12. Relationship Replacement Semantics

Khi Article được re-processed:

```text
new resolved relationships
```

phải được xác định theo một transactionally safe strategy.

Không để trạng thái:

```text
old entities
+
new entities
```

bị cộng dồn ngoài ý muốn.

Target semantics:

```text
Article current entity membership
=
latest authoritative resolution result
```

trừ trường hợp relationship được Admin override theo một contract riêng.

Nếu hệ thống hiện tại chưa có manual override semantics, Plan phải không tự tạo thêm authority layer.

---

# 13. Sector / Ecosystem Resolution

> **⚠ Amendment B (hiện hành) supersedes phần Sector của §13.**  
> **Sector = OUT OF SCOPE** — không auto-link / derive / persist Sector.  
> **Ecosystem** = vẫn resolve + persist + occurrence binding, **chỉ khi ≥3** distinct constituent stock codes thuộc Eco được nhắc rõ trong bài.  
> Stock mention (kể cả tên trùng Eco) **không** tự tạo Eco membership. Chi tiết: **§ Amendment B**.

~~Sector và Ecosystem được xử lý tương tự Stock…~~ (pre-Amd B narrative — không áp dụng cho Sector).

Ecosystem (Amd B):

```text
Resolved stocks in article
   ↓
Group by Ecosystem Master constituents
   ↓
count distinct stock codes mentioned ∈ Eco ≥ 3 ?
   ├── YES → persist Ecosystem membership (+ occurrence binding if Eco text linked)
   └── NO  → DO NOT persist Ecosystem
```

Không suy luận vô lý:

```text
1× ticker VIC  →  Stock VIC ✓ · Ecosystem VIC ✗
VIC + VHM + VRE (∈ Eco VIC) → stocks ✓ · Ecosystem VIC ✓
```

Nếu dùng market taxonomy để derive Eco từ stocks đã resolve, kết quả vẫn phải persist vào Article relationship **sau** khi vượt ngưỡng ≥3.

---

# 14. Article API Contract

Article API trở thành canonical read contract cho Detail.

Conceptual response:

```json
{
  "id": "...",
  "title": "...",
  "body_html": "...",
  "attribution": {
    "author": {},
    "publisher": {},
    "provider": {}
  },
  "dates": {
    "published_at": "...",
    "updated_at": "..."
  },
  "entities": {
    "stocks": [],
    "ecosystems": []
  },
  "related": []
}
```

> **Amd B:** task này không persist `sectors[]`. Legacy field có thể còn trên record cũ — Solution không mở rộng Sector; omit sidebar khi empty.

Đây là **conceptual contract**, không phải yêu cầu giữ nguyên JSON shape này.  
Solution/Plan phải adapt theo existing API conventions (+ Amd B constraints).

---

# 15. Attribution Solution

## 15.1 Canonical semantic model

Attribution phải được normalize thành:

```text
author
publisher
provider
```

và tách khỏi:

```text
membership tier
```

---

## 15.2 Author

Author chỉ được set khi upstream cung cấp attribution có thể xác minh.

```text
verified upstream author
        ↓
author
```

Không có:

```text
author
```

thì giữ missing/empty semantic.

---

## 15.3 Publisher

Publisher được lưu/render riêng.

```text
publisher
```

không được copy sang:

```text
author
```

---

## 15.4 Provider

Provider giữ identity của upstream/source system khi cần.

Ví dụ:

```text
provider = CafeF
author = Thu Minh
publisher = CafeF
```

có thể cùng tồn tại nếu upstream metadata xác nhận từng semantic.

Không được tự động suy ra chúng bằng equality.

---

# 16. VCCorp.vn Handling

Implementation phải loại bỏ mọi logic tương đương:

```text
if (!author) author = "VCCorp.vn";
```

hoặc:

```text
defaultAuthor = "VCCorp.vn";
```

`VCCorp.vn` chỉ được lưu khi Article's upstream lineage xác nhận giá trị đó.

---

# 17. Publisher Fallback

> **Amendment A Q3:** `author = null` → **omit author** trong UI; publisher/provider độc lập.

Không có fallback:

```text
author missing
→ publisher
```

Không có:

```text
author missing
→ provider
```

Không có:

```text
author missing
→ VCCorp.vn
```

Default:

```text
author = null / absent
```

và UI xử lý theo presentation rule.

---

# 18. `tier_label` Migration

Nếu existing code hiện dùng:

```text
tier_label
```

để chứa:

```text
CafeF
VietStock
...
```

thì Solution coi đây là **legacy semantic mapping**.

Target:

```text
membership tier
    → tier_label

publisher
    → canonical publisher field
```

Không sửa semantic bằng cách đổi tên frontend variable nhưng giữ cùng dữ liệu sai nghĩa.

---

# 19. Dates

API phải expose independently:

```text
published_at
updated_at
```

Runtime:

```text
valid published_at
    → Đăng

valid updated_at
    → Cập nhật
```

Không suy diễn:

```text
updated_at missing
→ published_at as updated_at
```

trừ khi BRD explicitly yêu cầu và Solution được Owner approve.

---

# 20. Body Link Strategy

## 20.1 Decision

**Solution chọn Model B làm target architecture** — **bổ sung Occurrence Binding theo Amendment A Q1** (không Hybrid Model A):


```text
Raw Body
+
Persisted Entity Relationships
        ↓
Deterministic renderer
        ↓
Linked presentation
```

Lý do:

1. tách content khỏi presentation;
2. tránh biến HTML generated thành domain authority;
3. entity identity được kiểm soát bởi Market Master;
4. dễ re-render khi route/presentation thay đổi;
5. giảm nguy cơ hardcoded link trong body;
6. giữ raw article content nguyên bản.

---

## 20.2 Canonical relationship

Ví dụ:

```text
Article
 └── Stock relationship
       └── stock_id = 123
```

Renderer lấy:

```text
stock.id
stock.symbol
stock canonical route
```

từ API/domain representation.

Không tạo:

```text
/co-phieu/${rawMatchedText}
```

trực tiếp từ regex.

---

# 21. Body HTML Rendering

Renderer phải:

```text
raw body
+
resolved entity references
+
deterministic mapping
```

để tạo presentation.

Không được modify semantic content bằng heuristic không persisted.

---

## 21.1 Existing HTML preservation

Không được phá:

* paragraphs;
* headings;
* images;
* links;
* embeds;
* formatting;
* existing SEO-critical structure;
* affiliate decorators;
* canonical URL.

Entity-link rendering phải là additive presentation transformation.

---

# 22. Existing Links

Nếu body đã chứa link:

```html
<a href="...">FPT</a>
```

renderer không được mù quáng wrap thêm:

```html
<a href="/co-phieu/FPT">
  <a href="...">FPT</a>
</a>
```

Existing anchor boundary phải được preserve.

---

# 23. Entity Link Presentation

Canonical stock route:

```text
/co-phieu/{ticker}
```

được tạo từ resolved Stock entity.

Flow:

```text
stock relationship
       ↓
Stock identity
       ↓
canonical presentation route
```

Không:

```text
candidate text
       ↓
route
```

---

# 24. Runtime Store Refactor

Existing runtime normalization phải được giới hạn vào:

```text
API response
    ↓
normalizePostRecord()
    ↓
runtime model
```

`normalizePostRecord()` không được:

```text
findTicker()
findCompany()
guessAuthor()
guessPublisher()
deriveSector()
deriveEcosystem()
```

nếu các hàm này tạo authoritative semantics.

---

# 25. Legacy Runtime Logic

Các logic như:

```text
FALLBACK_TICKERS
IfluxMockMarket
FE regex
company dictionary
```

phải được audit usage.

Phân loại:

```text
ACTIVE AUTHORITY
TRANSITION SUPPORT
DEAD CODE
```

Chỉ:

```text
TRANSITION SUPPORT
```

được giữ tạm thời.

Không được mở rộng dependency mới vào legacy authority.

---

# 26. Article Detail Data Flow

Target:

```text
User opens Article
        │
        ▼
Article Detail
        │
        ▼
Article API
        │
        ▼
Article Record
        │
        ├── body
        ├── attribution
        ├── dates
        ├── entity relationships
        └── related
        │
        ▼
Runtime Store
        │
        ▼
Deterministic Render
```

Không có secondary entity fetch để "tìm xem bài này có ticker gì" trong frontend.

---

# 27. Sidebar Solution

Sidebar lấy trực tiếp:

```text
article.entities.stocks
article.entities.sectors
article.entities.ecosystems
```

Không scan:

```text
body_html
```

để xây sidebar.

---

## 27.1 Empty state

Renderer:

```text
entities.stocks.length > 0
    → render Stock card

entities.stocks.length === 0
    → omit
```

Tương tự:

```text
Sector
Ecosystem
Topic
```

theo BR/SoT.

---

# 28. Layout Solution

Layout được quyết định theo content state.

```text
sidebarContent.length > 0
        ↓
main + aside

sidebarContent.length === 0
        ↓
main expands
```

Không render:

```text
aside
 └── empty cards
```

chỉ để giữ grid structure.

Exact CSS implementation thuộc Plan.

---

# 29. Related Article Solution

Chọn **một authoritative acquisition path** cho Related Articles.

> **Amendment A Q4:** path canonical = **`related_to`** (confirm trong Plan); không DailyFeed song song cho Related.

Target:

```text
Article Detail
      │
      ▼
Related Query Contract
      │
      ├── current article exclusion
      ├── ranking/filter
      └── limit
      │
      ▼
related[]
```

Không để:

```text
loadPostPage()
```

và:

```text
DailyFeed
```

cùng acquisition Related dataset.

---

# 30. Self-Exclusion

Exclusion phải được enforce ở query/data acquisition boundary khi có thể.

```text
currentArticle.id
        ↓
exclude
        ↓
related query
```

Frontend vẫn có thể có defensive guard:

```text
related.filter(item => item.id !== currentId)
```

nhưng defensive filter **không thay thế query contract**.

---

# 31. Related Single Acquisition

Target:

```text
ONE RELATED CONTRACT
```

Các component khác chỉ consume cùng dataset.

Không được có:

```text
Related API
+
DailyFeed API
+
Category API
```

cùng được dùng để xây cùng một Related section.

---

# 32. RSS Ingestion Solution

RSS remains:

```text
input
```

Pipeline:

```text
RSS
 ↓
parse
 ↓
normalize article
 ↓
extract candidates
 ↓
resolve against Master
 ↓
persist Article + relationships
```

RSS không được trực tiếp tạo authoritative entity relationship mà bỏ qua Master.

---

# 33. Admin Article Solution

Admin Content vẫn quản lý Article.

Khi Admin tạo/chỉnh Article:

```text
Admin Article
      ↓
Article persistence
      ↓
entity resolution / validation
      ↓
relationships
```

Nếu Admin chọn entity thủ công, entity cũng phải reference Master identity.

Không cho Admin lưu arbitrary ticker string làm entity authority nếu relationship model đã tồn tại.

---

# 34. Admin Market Master

Market Admin quản lý:

```text
stocks
sectors
ecosystems
```

Đây là authority boundary.

Article Admin không tạo:

```text
local stocks
local sectors
local ecosystems
```

---

# 35. Backfill Strategy

## Decision

Backfill chọn **re-process ingestion / controlled batch migration**, không lazy-resolve tại Article Detail runtime.

Target:

```text
Existing Articles
       ↓
batch selection
       ↓
re-process / entity resolution
       ↓
validate against Master
       ↓
persist relationships
       ↓
verify
```

Lý do:

* deterministic;
* không tăng runtime latency;
* không tạo entity state khác nhau giữa user;
* có thể audit kết quả;
* phù hợp precision-first.

---

## 35.1 Backfill safety

Backfill phải:

* idempotent;
* batchable;
* resumable;
* observable;
* không overwrite verified attribution ngoài scope;
* không phá body HTML hiện hữu;
* không thay canonical URL;
* không thay affiliate semantics.

Exact batch size, retry và operational mechanism thuộc Plan.

---

# 36. Existing Article Safety

Existing articles phải được bảo vệ:

```text
URL
SEO metadata
canonical
OG metadata
affiliate decorators
body content
existing valid links
published timestamps
```

không được thay đổi ngoài phạm vi task.

Entity migration phải là additive trước khi destructive cleanup.

---

# 37. Migration Strategy

Migration gồm các phase logic:

```text
Phase 1
Introduce canonical relationship capability

Phase 2
Resolve new Articles through canonical pipeline

Phase 3
Backfill existing Articles

Phase 4
Switch Article Detail to canonical API relationships

Phase 5
Remove frontend authority logic

Phase 6
Remove obsolete legacy authority paths
```

Không được xóa legacy mechanism trước khi consumer migration hoàn tất.

---

# 38. Legacy Removal Rules

### `FALLBACK_TICKERS`

Target:

```text
REMOVE
```

sau migration.

### `IfluxMockMarket`

Target:

```text
REMOVE as Article entity authority
```

Có thể giữ cho test/demo nếu hoàn toàn isolated khỏi production domain path.

### RSS dictionary

Target:

```text
REMOVE as authority
```

Có thể giữ candidate extraction aid nếu resolution cuối cùng luôn qua Master.

### FE ticker regex

Target:

```text
REMOVE as authoritative resolver
```

Có thể giữ parser utility nếu chỉ phục vụ non-authoritative presentation use case và không tạo entity.

---

# 39. API Compatibility

Nếu existing Article API đang được consumed bởi nhiều clients:

```text
web
admin
mobile
other runtime
```

không được breaking-change trực tiếp.

Ưu tiên:

```text
backward-compatible extension
```

sau đó migrate consumers.

Exact versioning strategy phải được kiểm tra trong Plan dựa trên actual API consumers.

---

# 40. Performance Solution

Entity resolution không được chạy trên mỗi Article Detail request.

Target:

```text
INGESTION-TIME COST
```

thay vì:

```text
EVERY PAGE-VIEW COST
```

Article Detail request chỉ cần:

```text
Article API
→ relationship data
→ render
```

Điều này đồng thời loại bỏ:

* repeated regex;
* repeated company lookup;
* repeated Master lookup;
* repeated entity guessing.

---

# 41. Cache Strategy

Runtime cache chỉ cache:

```text
canonical Article API representation
```

hoặc normalized equivalent.

Cache invalidation phải follow Article update lifecycle.

Entity Master changes không được tự động biến runtime thành nơi resolve lại Article membership.

Nếu entity presentation metadata thay đổi, API/cache invalidation strategy sẽ được xử lý trong Plan.

---

# 42. Error Handling

Entity resolution failure không được làm Article fail.

Ví dụ:

```text
Article valid
Stock candidate ambiguous
```

kết quả:

```text
Article = available
Stock relationship = omitted
```

Không:

```text
entity failure
→ article 500
```

Article content availability và optional entity resolution phải tách failure domain.

---

# 43. Attribution Failure Handling

Tương tự:

```text
author missing
```

không được làm Article unavailable.

Result:

```text
author = absent
publisher = independently resolved if available
provider = independently available if applicable
```

UI render theo available semantic fields.

---

# 44. Security / Trust Boundary

Frontend-supplied entity identity không được coi là trusted domain input.

Ví dụ:

```text
POST /article
{
  "ticker": "XYZ"
}
```

nếu endpoint cho phép entity assignment, backend phải validate:

```text
XYZ
→ stocks
→ valid
```

Không trust raw client ticker.

---

# 45. Observability

Entity resolution phải có khả năng quan sát tối thiểu:

```text
candidate extracted
candidate resolved
candidate rejected
candidate ambiguous
relationship persisted
```

Các metric/error classification nên phân biệt:

```text
NOT_FOUND
AMBIGUOUS
INVALID_ENTITY
PERSIST_FAILURE
```

Không log raw article content nếu không cần thiết.

Exact telemetry implementation thuộc Plan.

---

# 46. Verification Model

Solution phải được verify theo 5 layers:

```text
1. Data
2. Domain
3. API
4. Runtime
5. UI
```

### Data

Kiểm tra relationship tồn tại và không duplicate.

### Domain

Entity phải resolve từ Master.

### API

API trả canonical relationship.

### Runtime

Runtime không invent.

### UI

UI chỉ render API truth.

---

# 47. Mandatory Test Matrix

## Entity

| Case                    | Expected                |
| ----------------------- | ----------------------- |
| Valid ticker            | Link                    |
| Unknown ticker          | No link                 |
| Ambiguous ticker        | No link                 |
| Valid company name      | Resolve                 |
| Unknown company         | No link                 |
| Duplicate candidate     | One relationship        |
| Inactive/invalid entity | Reject theo Master rule |

## False Positive

| Case                                | Expected               |
| ----------------------------------- | ---------------------- |
| `100.000 VND`                       | No stock link          |
| `20 triệu VND`                      | No stock link          |
| `TP.HCM`                            | No HCM stock link      |
| `Thành phố Hồ Chí Minh`             | No HCM stock link      |
| Stock `HCM` in valid market context | Resolve if rule passes |

## Attribution

| Case                        | Expected                     |
| --------------------------- | ---------------------------- |
| Verified author             | Render author                |
| Missing author              | No invented author           |
| Publisher exists            | Render publisher separately  |
| Publisher only              | Must not become author       |
| `VCCorp.vn` absent upstream | Must not appear              |
| `tier_label` membership     | Must not render as publisher |

## Sidebar

| Case           | Expected         |
| -------------- | ---------------- |
| Stocks > 0     | Stock card       |
| Stocks = 0     | Omit             |
| Sectors > 0    | Sector card      |
| Sectors = 0    | Omit             |
| Ecosystems > 0 | Ecosystem card   |
| Ecosystems = 0 | Omit             |
| All empty      | No empty sidebar |

## Related

| Case                      | Expected                                    |
| ------------------------- | ------------------------------------------- |
| Current article candidate | Excluded                                    |
| Valid related article     | Included                                    |
| Duplicate related         | Deduplicated according to contract          |
| No related                | Section handled without invalid self-result |

---

# 48. Acceptance Invariants

Implementation is not considered PASS unless all are true:

```text
INV-01
No invented author

INV-02
VCCorp.vn is never default author

INV-03
Publisher ≠ Author

INV-04
Tier ≠ Publisher

INV-05
Entity → Market Master validation

INV-06
FE cannot create authoritative entity

INV-07
Ambiguous candidate → DO NOT LINK

INV-08
Empty sidebar block → OMIT

INV-09
Current article ∉ Related

INV-10
One semantic field → One authority
```

---

# 49. Non-Goals

Solution does NOT authorize:

* redesign toàn bộ Community;
* thay đổi Article URL;
* thay đổi canonical/SEO architecture;
* thay đổi affiliate architecture;
* thay đổi Membership semantics;
* tạo Market Master mới;
* thay thế existing Market Master;
* redesign RSS provider system;
* rewrite toàn bộ Article ingestion;
* thay đổi unrelated Admin modules;
* thay đổi business rules ngoài BRD/SoT.

---

# 50. Decision on Open Items from SoT

| Open Item                    | Solution Decision                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------ |
| Backfill strategy            | Controlled batch re-processing                                                       |
| Body-link persistence        | **Model B — persisted entity relationships + deterministic renderer**                |
| MockMarket removal/retention | Remove as production entity authority; temporary isolated test/demo only if required |
| FALLBACK_TICKERS             | Remove as authority; transitional candidate aid only if required                     |
| RSS ticker dictionary        | Remove as authority; candidate aid only if required                                  |
| FE entity resolver           | Remove from authoritative path                                                       |
| Attribution fallback         | No fixed author fallback                                                             |
| `tier_label` publisher usage | Remove semantic conflict                                                             |

---

# 51. Implementation Boundary

Implementation MUST produce:

```text
                MASTER
                   │
                   ▼
          ENTITY RESOLUTION
                   │
                   ▼
       PERSISTED RELATIONSHIP
                   │
                   ▼
             ARTICLE API
                   │
                   ▼
            RUNTIME STORE
                   │
                   ▼
              UI RENDER
```

Implementation MUST NOT produce:

```text
                 ARTICLE API
                     │
                     ▼
                 FE regex
                     │
             ┌───────┴───────┐
             ▼               ▼
        MockMarket      hardcoded map
             │               │
             └───────┬───────┘
                     ▼
                invented data
```

---

# 52. Solution → Plan Boundary

`05-Plan.md` phải chuyển các quyết định trên thành executable work packages.

Plan phải xác định cụ thể:

1. Existing schema và relationship tables;
2. Existing Article ingestion paths;
3. Existing Article API implementation;
4. Existing attribution fields;
5. Existing `tier_label` consumers;
6. Existing `FALLBACK_TICKERS` consumers;
7. Existing `IfluxMockMarket` consumers;
8. Existing FE linkify implementation;
9. Existing Related acquisition paths;
10. Migration/backfill scripts;
11. API compatibility;
12. test fixtures;
13. verification commands;
14. rollout sequence;
15. rollback strategy.

Plan **không được thay đổi các decisions đã khóa trong Solution**.

---

# 53. Gate Conditions

Before implementation:

```text
[x] BRD accepted
[x] Mandatory Audit rev. B accepted
[x] SoT OWNER ABSOLUTE LOCKED (Boundary AMEND chốt)
[x] Market Master authority locked
[x] Article authority locked
[x] FE authority prohibition locked
[x] Precision-first locked
[x] Attribution semantics locked
[x] Sidebar empty omission locked
[x] Related self-exclusion locked
[x] Body-link target model selected
[x] Backfill strategy selected
[x] Legacy authority removal direction selected

[x] Traceability checklist §0.2 = 46/46 Req (README §2.5)
[x] Feasibility Assessment §0.3 completed (Agent)
[x] Amendment A — Q1–Q8 CLOSED (written; Q5 SUPERSEDED by Amd B)
[x] Amendment B LOCKED — Sector OUT · Eco ≥3 · XOR stocks∪ecosystems
[x] Owner Absolute Lock Solution (auth = «Chạy đi» + apply Amd B 2026-08-09)
[x] 05-Plan.md OPEN (checklist 46/46 — Owner mở Plan)
[ ] 05-Plan.md approved / LOCK
```

Until Plan LOCK:

```text
IMPLEMENTATION = NOT AUTHORIZED
PLAN = OPEN — chờ Owner LOCK
```

---

# 54. Final Solution Verdict

## APPROVED TECHNICAL DIRECTION — OWNER ABSOLUTE LOCKED

Community Article Detail sẽ chuyển từ:

```text
Runtime heuristic
+
Frontend entity guessing
+
Legacy fallback
```

sang:

```text
Market Master
      ↓
Entity Resolution
      ↓
Persisted Article Relationships
      ↓
Article API
      ↓
Deterministic Runtime
      ↓
Presentation
```

### Entity (Amd B)

```text
Master validates identity.
Article stores membership: stocks[] + ecosystems[] (≥3 rule).
Sector = OUT OF SCOPE this task.
Runtime renders membership.
Stock ≠ automatic Ecosystem (name-match alone forbidden).
```

### Attribution

```text
Author
≠ Publisher
≠ Provider
≠ Membership Tier
```

### Content

```text
Raw Article Body
= authoritative content

Entity relationship
= authoritative entity membership

Rendered HTML
= presentation
```

### UI

```text
API truth
→ deterministic render

No entity invention.
No attribution invention.
No empty cards.
No self-related article.
```

### Migration

```text
New pipeline
      ↓
Backfill
      ↓
Consumer migration
      ↓
Legacy authority removal
```

---

# 55. Status

**`04-Solution.md` — 🔒 OWNER ABSOLUTE LOCKED** (Amd A + **Amd B** = BR-AD-12/13 cascade · XOR `stocks∪ecosystems` · **46/46** Req)

```text
BRD — OWNER LOCKED
 ↓
Mandatory Audit rev. B
 ↓
SoT — OWNER ABSOLUTE LOCKED
 ↓
04-Solution — OWNER ABSOLUTE LOCKED (+ Amd B)
 ↓
05-Plan — OPEN (46/46)  ← chờ Owner LOCK
 ↓
[OWNER LOCK Plan]
 ↓
IMPLEMENTATION
```

**Implementation remains NOT AUTHORIZED until Owner LOCKs Plan.**

---

*Absolute Locked («Chạy đi») + Amendment B applied 2026-08-09 — từ `01-BRD.md`, `02-Mandatory-Audit.md` rev. B+, `03-SoT.md` (không sửa BRD/SoT).*
