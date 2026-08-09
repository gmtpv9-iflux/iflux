# 04 — Solution · Architecture Target · Public Identity Platform (Affiliate V2)

**Document ID:** SOL-AFF-V2-002  
**Date:** 2026-07-29  
**Status:** **LOCKED v1.4** — Architecture Target · Principle E2E · Owner **ACCEPT** 2026-07-30 · tiếp [`05-Plan.md`](05-Plan.md)  
**Version:** 1.4  

**Implements (map only):** [`02-SoT.md`](02-SoT.md) — LOCKED v1.2  
**Business Intent:** [`Business requirement brief.md`](Business%20requirement%20brief.md) — LOCKED (+ §6A 2026-07-30)  
**Evidence neo:** [`00-Audit-Context.md`](00-Audit-Context.md) §D · §E · E.7 BD-00…07 **Accepted**  
**Plan:** [`05-Plan.md`](05-Plan.md)  
**Objective:** [`01-Task-Objective.md`](01-Task-Objective.md)  
**Acceptance binding:** [`03-Acceptance-Criteria.md`](03-Acceptance-Criteria.md)  

> Solution **LOCKED**. Plan chỉ map từ đây. BD-00 Subject/Lifecycle · BD-03 preserve-context · BD-06 Replace Owner Context · BD-07 Owner URL ≠ SEO asset.

**Constraint:** Không implementation · không schema/API · không Plan · không đẻ BR/PI ngoài SoT — chỉ map SoT → Architecture Target.

---

# 1. Purpose

Mô tả **Target Architecture** khi SoT + E.7 được hiện thực hóa:

```text
User
 ↓
Public Identity (Public Address)
 ↓
Platform Identity Capability (lifecycle)
 ↓
Affiliate / Share / Community / Navigation / Ads / …
```

Không phải:

```text
Platform Identity Service → sở hữu user identity → Affiliate dùng ké
```

Không mô tả: task · migration chi tiết · coding · rename.

---

# 2. Context (Audit → SoT)

| Pattern AS-IS | ID |
|---------------|-----|
| Nav/Writer đọc PNC; Register/Social đọc AR | R-AUTH-01 · R-CAP-01 |
| Nhiều URL writer / decorate path | R-URL-01 · R-URL-02 · R-OWN-01 |
| Auth zone không prepend (AS-IS) | R-URL-03 |
| Parse IFL phân tán | R-RES-01 · R-RESP-01 |
| Hai cụm storage | R-STO-01 |
| Naming Affiliate ≠ Public Address | R-SEM-01 · B-SEM-01 |

---

# 3. Design Goals (map SoT / BD)

| Goal | Neo |
|------|-----|
| Subject Owner Public Identity = User | BD-00 · BR-16 · PI-16 |
| Lifecycle Authority = Platform Identity Capability | BD-00 · BR-16 · PI-13 |
| Affiliate / Share / Nav / Register = consumers | BR-04 · PI-04 · PI-11 |
| Product URL vs Owner URL — hai Representation, một resource | BD-02 · BR-06 · PI-06 · PI-18 |
| Preserve Owner trên link cần duy trì context | BD-03 · BR-17 · PI-18 |
| Một business owner cho Application URL generation | BR-11 |
| Share artifact ≠ Application URL Writer | BR-12 |
| Attribution ≠ Identity; storage ≠ Authority | BD-04 · BD-05 · BR-08 |
| Enter Owner URL khác ⇒ Guest replace Active Owner; Logged-in Self giữ Self | BD-06 · BD-08 · BR-18 · BR-20 · PI-19 · PI-21 |
| Owner URL ≠ SEO Asset; SEO Authority = Product URL | BD-07 · BR-19 · PI-20 |
| Một Identity Context contract runtime | BR-03 · PI-05 · R-AUTH-01 |

---

# 4. Target Architecture Spine

```text
┌──────────────────────────────────────┐
│ User                                 │
│ Subject Owner                        │
└──────────────────┬───────────────────┘
                   │ owns (business meaning)
                   ▼
┌──────────────────────────────────────┐
│ Public Identity                      │
│ Business Source of Truth             │
│ Public Address                       │
└──────────────────┬───────────────────┘
                   │ lifecycle managed by
                   ▼
┌──────────────────────────────────────┐
│ Platform Identity Capability         │
│ Lifecycle Authority                  │
│ Transition · Validation · Consistency│
└──────────────────┬───────────────────┘
                   │ projects active identity into
                   ▼
┌──────────────────────────────────────┐
│ Identity Context contract            │
│ (runtime)                            │
│ Navigation Context = representation  │
│ của contract này                     │
└───────────┬──────────────┬───────────┘
            │              │
            ▼              ▼
┌───────────────────┐  ┌────────────────────────────┐
│ URL Representation│  │ Consumers (read Context)   │
│ Product URL (SEO) │  │ Nav · Register · Login     │
│ Owner URL (dist.) │  │ Share · Community · Stock  │
│ App URL Writer    │  │ Ads · QR · Affiliate Attr. │
│ Path Capture      │  │                            │
│ (candidate only)  │  │                            │
└───────────────────┘  └─────────────┬──────────────┘
                                     │
                                     ▼
                       ┌─────────────────────────────┐
                       │ Attribution Result (ledger) │
                       │ sau Identity Created        │
                       │ boundary Affiliate domain   │
                       └─────────────┬───────────────┘
                                     │
                                     ▼
                       ┌─────────────────────────────┐
                       │ Commission                  │
                       │ (ngoài Identity Architecture│
                       │  core — consume result only)│
                       └─────────────────────────────┘
```

**Cấm:**

```text
Affiliate → owns Public Identity
Platform Identity → owns User / owns Public Identity meaning
URL prefix → Identity Authority
Navigation Context → “User Identity”
```

---

# 5. Logical Capabilities (Target)

## 5.0 Khóa hiểu sai Ownership

| Concern | Subject Owner | Lifecycle / Policy Authority |
|---------|---------------|------------------------------|
| Public Identity | **User** | Platform Identity Capability |
| Identity Lifecycle / Transition | — | **Platform Identity Capability** |
| Navigation Context | — | Navigation Runtime (projection only) |
| Application URL generation | — | URL Composition policy → một App URL Writer |
| Share Owner URL artifact | — | Share (BR-12) |
| Attribution result | — | Affiliate Capability |
| Commission | — | Commission Capability |

---

## 5.1 Platform Identity Capability

| | |
|--|--|
| **Owns (Lifecycle Authority)** | Identity lifecycle rules · Identity Transition authority · Identity validation · Identity uniqueness / consistency · Identity availability |
| **Manages** | Public Identity **lifecycle** (tạo lập record theo Business Rule khi Identity Created · validate · transition Active Owner · deactivate theo Event) |
| **Does not own** | **User ownership meaning** của Public Identity · Commission · Navigation UI · Share UI · Affiliate marketing policy |
| **Consumers** | Mọi capability SoT §7 (gián tiếp qua Identity Context) |
| **Neo** | BD-00 · BR-16 · PI-13 · PI-16 |

**Cấm wording:** “Platform phát hành / sở hữu identity cho user”.  
**Đúng:** tạo lập Identity record theo Business Rule; đảm bảo uniqueness; quản lý lifecycle.

---

## 5.2 Identity Context contract · Navigation Context

| | |
|--|--|
| **Identity Context contract** | **Một** contract runtime duy nhất để đọc Public Identity đang hiệu lực cho trải nghiệm |
| **Navigation Context** | **Implementation representation** của contract đó — runtime projection |
| **Owns** | Projection state (create / transfer / deactivate **chỉ** khi Platform Identity Transition) |
| **Does not own / is not** | Public Identity business object · “User Identity” · Attribution ledger |

**Invariant:** Navigation Context **không** đại diện cho User Identity; nó chỉ mang Public Identity đang được **áp dụng** cho trải nghiệm hiện tại.

Ví dụ: User A đã login, mở Owner URL của B → Identity Context có thể mang B — **không** nghĩa User A = Identity B.

**Neo:** BR-09 · PI-10 · BD-00

---

## 5.3 URL Representation

| Concern | Target | Neo |
|---------|--------|-----|
| **Product URL / Canonical** | SEO Authority — sạch; cùng resource lifecycle với Owner URL | BD-02 · BD-07 · BR-05 · PI-06 · PI-20 |
| **Owner URL** | Distribution Representation — **không** SEO Asset; format đổi được | BR-06 · BR-19 · PI-09 · BD-07 |
| **Application URL Writer** | **Một** writer cho application navigation URL cần preserve Owner Context | BR-11 · BR-17 · BD-03 |
| **Share artifact generator** | Tạo Owner URL **trong phạm vi share action** — **không** decorate application navigation | BR-12 |
| **Path Capture** | Transport: cung cấp **Public Identity reference candidate** / lookup input — **không** Identity Authority | §6 · BD-00 |
| **Normalize / strip** | URL Reader (pure) | PI-09 |

**Invariant URL Class:**

* Product URL và Owner URL **không** có lifecycle resource độc lập.
* Resource lifecycle thuộc **Product Resource**.
* Owner URL chỉ thêm Owner Context lên cùng resource.

**BD-03:** Writer preserve Owner trên link **cần duy trì context**. Product URL vẫn tồn tại. Không mọi URL bắt buộc prefix.

### Architecture Principle — End-to-End Owner Context Preservation

*(Brief §6A · amendment 2026-07-30 — **không** đổi Spine · **không** capability mới · **không** đổi Ownership.)*

Trong thời gian Owner Context còn hiệu lực theo Business Rule, toàn bộ kiến trúc phải bảo đảm khả năng duy trì Owner Context xuyên suốt các capability và các môi trường phân phối mà sản phẩm tuyên bố hỗ trợ.

Không capability nào được phép làm mất Owner Context nếu chưa xảy ra một Business Event hợp lệ làm thay đổi Owner Context.

Solution **không** khóa cơ chế kỹ thuật để thực hiện nguyên tắc này.

Việc hiện thực và kiểm chứng nguyên tắc này được thực hiện thông qua **Program Plan** và **Program End-to-End Business Verification Gate** — không thông qua việc Pass từng Phase capability đơn lẻ.

**Final Program PASS** chỉ được ký sau khi Gate đó PASS.  
**Không** tuyên bố các kênh phân phối (Facebook, Zalo, QR, Ads, Email, …) đã hỗ trợ đầy đủ cho đến khi Gate hoàn tất.

Direct `location.*` ngoài Writer = ngoài target (Plan: R-URL-01 · R-OWN-01).

---

## 5.4 Consumer capabilities

Navigation · Community · Stock · Article · Register · Login · QR · Ads · Deep Link · Affiliate Attribution:

* Đọc Public Identity đang hiệu lực **chỉ** qua **Identity Context contract** (Navigation Context là representation của contract).
* **Không** mở dual path “contract tương đương” khác.
* **Không** parse URL / Attribution storage thành Authority.

---

## 5.5 Affiliate Attribution (boundary)

| | |
|--|--|
| **Owns** | Attribution **result** lifecycle sau ghi nhận chính thức (ledger) · policy “ai giới thiệu ai” sau Identity Created |
| **Does not own** | Public Identity · Identity Context · App URL Writer · Identity Transition |
| **Reads** | Public Identity đang hiệu lực tại Identity Created qua Identity Context — **không** storage-as-SoT |
| **Scope trong Identity Architecture** | Chỉ đến điểm tạo **Attribution Result** |
| **Neo** | BR-07 · BR-08 · PI-08 · BD-04 |

---

## 5.6 Affiliate Commission (ngoài Identity Architecture core)

| | |
|--|--|
| **Owns** | Commission policy · calculation · payout/settlement · earning history |
| **Does not own** | Public Identity · URL · Path Capture · Identity Context |
| **Reads** | Chỉ Attribution Result / Context đã hợp lệ |
| **Dependency** | Attribution → Commission (**một chiều**); **không** gọi ngược Identity/URL |

Commission implementation **không** thuộc Public Identity Architecture core — chỉ neo boundary consume.

---

# 6. Target Runtime Lifecycle

```text
Guest / Product URL
        └──► Không Owner Context (Product URL vẫn sống)

Guest / Owner URL
        │
        ▼
[Representation Resolver]     → parse Owner URL Representation
        │
        ▼
Resolve Public Identity candidate   → lookup input (không Authority)
        │
        ▼
[Platform Identity] validates Business Event
        │                         → Guest enter Owner URL: **replace** Active Owner (BD-06)
        │                         → Logged in Self: **không** replace từ Owner URL (BD-08)
        ▼
[Identity Context / Navigation Context] projection
        │
        ▼
[App URL Writer]              → preserve Owner trên link cần duy trì context (BD-03)
        │
        ├──► [Share] Share artifact Owner URL (không App Writer)
        │
        └──► [Register / Social] đọc Identity Context only
                │
                ▼
        Business Event: Identity Created / Login (account đã có Identity)
                │
                ▼
        [Platform Identity] áp dụng Transition Rule
                │
                ├──► Attribution Result (nếu Identity Created + BR)
                │
                └──► Identity Context = self Public Identity (Subject Owner = User đó)
                        │
                        ▼
                [App URL Writer] preserve Owner mới khi cần
                        │
                        ▼
                Logout → Platform Identity → Context deactivate → No Owner
```

**Login principle:** Authentication **không** tạo Identity Authority. Login chỉ là Business Event có thể **kích hoạt** Identity Transition theo Rule (Platform Identity).

Commission chỉ sau Attribution Result hợp lệ.

---

# 7. Product Roles — Assignment (Target)

Taxonomy SoT §12 — **Public Representation** (không “View” UI).

| Artifact / Concern | Target Role | Ghi chú |
|--------------------|-------------|---------|
| Public Identity (business meaning) | **Authority** — Subject Owner = **User** | BD-00 |
| Identity Lifecycle / Transition | **Authority** — Platform Identity Capability | BD-00 · BR-16 |
| Identity Context / Navigation Context | **Mirror** (+ Temporary theo session) | Không = User Identity |
| Owner URL / Product URL string | **Public Representation** | Format đổi được |
| App URL Writer | **Authority** của Application URL Representation | Một writer; BD-03 |
| Share artifact generator | **Public Representation** producer | Không App Writer |
| Path Capture | **Transport** | Candidate / lookup input only |
| Cookie / LS attribution | **Transport** / **Temporary** / **Flag** | BD-05 |
| Canonical / OG | **Public Representation** (Product) | SEO |
| Attribution result | **Authority** (Attribution concern) | Affiliate |
| Commission records | **Authority** (Commission concern) | Ngoài Identity core |

---

# 8. Responsibility Assignment (Target)

| Responsibility | Target | Consumers | Cấm |
|----------------|--------|-----------|------|
| Parse Representation shape | Một Parse contract | Writer · Reader · Capture | Regex phân tán (R-RES-01) |
| Capture Owner URL enter | Path Capture → candidate | Platform Identity validate + **replace** Active Owner (BD-06) | Page parse → Authority; giữ Owner cũ khi enter B |
| Persist Identity Context | Navigation Context (contract rep.) | App Writer · consumers | Consumer mở Identity store riêng; dual AR Authority |
| Persist Attribution ledger | Server Attribution | Commission · Admin | Client ghi đè |
| Decorate Application URL | App URL Writer | Routes / Href / pages | Share / location.* ngang hàng |
| Share Owner URL artifact | Share | Share UI | Share decorate app navigation |
| Read Identity (Register/Login) | Identity Context contract only | Register · Social · Login | URL/storage Authority |
| Identity Transition | Platform Identity Capability | Context · Writer · event triggers | Affiliate/Nav/Auth owns Transition |

---

# 9. Dependency Graph (Target)

```text
User (Subject Owner)
        │
        ▼
Public Identity
        │
        ▼
Platform Identity Capability (Lifecycle Authority)
        │
        ├──► Identity Context contract (NC representation)
        │         │
        │         └──► App URL Writer ──► application consumers (preserve khi cần)
        │
        ├──► Path Capture (candidate in) ──► Platform validate Event
        │
        ├──► Share artifact (outbound Owner URL)
        │
        ├──► Register / Login (read Context; trigger Event)
        │
        └──► Attribution Result (sau Identity Created)
                    │
                    └──► Commission (ngoài Identity core)
```

**Cấm:** Commission → Identity/URL; Attribution owns Public Identity; dual Context read path; Path Capture = Authority.

---

# 10. Mapping: Observed Patterns → Target

| Finding | Target resolution | Neo |
|---------|-------------------|-----|
| **R-AUTH-01 / R-CAP-01** | Một Identity Context contract; Register không dùng AR storage làm Authority | BR-03 · PI-15 |
| **R-URL-01 / R-OWN-01** | Mọi app navigation mutation qua App URL Writer | BR-11 |
| **R-URL-02** | Share artifact ≠ App Writer — cùng Representation family, khác purpose | BR-12 |
| **R-URL-03** | AS-IS auth strip ≠ luật Product. Target: preserve Owner trên link **cần duy trì context** (BD-03); Product URL vẫn tồn tại; exception OAuth/payment restore | BR-17 · PI-18 |
| **R-RES-01 / R-RESP-01** | Một Parse contract | PI-09 |
| **R-STO-01** | Context = Mirror/Temporary; attribution keys = Transport — không dual Authority | BD-05 |
| **R-SEM-01 / B-SEM-01** | Architecture dùng vocabulary Public Identity / Owner URL; rename symbol = Plan | BD-01 |
| **B-OWN-03** | Guest enter Owner URL khác ⇒ replace (BD-06 · BR-18); Logged-in Self giữ Self (BD-08 · BR-20); Attribution riêng | E.7 BD-06 · BD-08 |
| **B-SEO-01** | Owner URL ≠ SEO Asset (BD-07); kỹ thuật crawl/index deferred SEO phase — không khóa noindex trong Solution | E.7 BD-07 |

---

# 11. Traceability — BR / PI → Architecture

| SoT ID | Mapping |
|--------|---------|
| BR-01 · PI-01 | §5.0–5.1 — một Public Identity / user (Subject Owner = User) |
| BR-02 · PI-02 | §5.2 — một Active Owner / trải nghiệm (Context) |
| BR-03 · PI-05 | §5.4 — consumers đọc một Identity Context contract |
| BR-04 · PI-04 · PI-11 · PI-14 | §5.5 — Attribution không owns Identity |
| BR-05 · PI-06 | §5.3 — Product URL SEO Authority |
| BR-06 · PI-09 · PI-17 | §5.3 — Owner URL Representation ≠ Identity |
| BR-07 · BR-08 · PI-08 | §5.5 — Attribution result |
| BR-09 · PI-10 | §5.2 — NC projection, không = User Identity |
| BR-10 | §5.3 — URL ≠ Business SoT |
| BR-11 | §5.3 · §8 — một App URL Writer |
| BR-12 | §5.3 — Share artifact ≠ App Writer |
| BR-13–15 · PI-12 | §6 — Transition chỉ Business Event |
| BR-16 · PI-13 · PI-16 | §4 · §5.0–5.1 — Subject Owner vs Lifecycle Authority |
| BR-17 · PI-18 | §5.3 · §6 · §10 — BD-03 preserve context |
| BR-18 · PI-19 | §6 — BD-06 Guest replace on enter Owner URL |
| BR-19 · PI-20 | §5.3 — BD-07 Owner URL ≠ SEO Asset |
| BR-20 · PI-21 | §6 — BD-08 Authenticated Self precedence |
| **Brief §6A · §11 E2E** | §5.3 Architecture Principle E2E — verify qua Plan **Program End-to-End Business Verification Gate** |
| PI-03 | §4 — Public Identity = Business SoT |
| PI-07 | §5.4 · §13 — reuse Identity |
| SoT §6 | §6 Lifecycle |
| SoT §10–§12 | §5 · §7 · §8 |

→ **AC-T2 / AC-T3**.

---

# 12. Explicit Non-Ownership

| Concern | Không được gán cho |
|---------|-------------------|
| Subject ownership của Public Identity | Platform Identity · Affiliate · Share · Register · URL · Auth |
| Lifecycle Transition Authority | Navigation · Affiliate · Auth UI · Share · Register page |
| Application URL Writer | Share · pages trực tiếp · Commission |
| Identity Context dual Authority | Attribution storage / AR `readActive` |
| Attribution ledger Authority | Client store · cookie · UI |
| User Identity meaning | Navigation Context |

---

# 13. Extension Model

Capability mới chỉ: consume Public Identity / Identity Context / Attribution Result / Commission policy — **không** tạo Identity SoT thứ hai.

---

# 14. Non Goals

Không định nghĩa: schema · API · cookie key · file path · migration steps · timeline · dual-run adapter · inventory `location.*` 100%.

---

# 15. Success Criteria (khóa Solution)

1. Spine: User → Public Identity → Platform Lifecycle — Affiliate không owns Identity (**AC-S3 · AC-R1**).  
2. Không còn wording “Platform owns Public Identity durable”.  
3. Một Identity Context contract; Share ≠ App Writer; Path Capture = candidate only.  
4. BD-03 preserve-context (không mọi URL prefix).  
5. Bảng §11 phủ BR/PI kể BR-16/17 · PI-16…18 (**AC-T2**).  
6. Mọi quyết định neo SoT (**AC-T3**).  
7. Commission ngoài Identity core — chỉ consume Attribution Result.  
8. Không đẻ BR/PI mới ngoài SoT.

---

# 16. Expected Result (sau Plan/implement)

* User-centric Public Address trên platform.  
* Platform Identity = lifecycle governance, không sở hữu User.  
* Một Identity Context; URL = Representation; Product URL sống song song Owner URL.  
* Attribution → Commission một chiều.  
* Không dual Authority Context vs attribution storage.

---

## Changelog v1.4 (Brief §6A — 2026-07-30)

* §5.3: Architecture Principle **End-to-End Owner Context Preservation** (invariant only).
* Không đổi Spine · Capability · Ownership · không khóa cơ chế kỹ thuật.
* Kiểm chứng: Plan **Program End-to-End Business Verification Gate** — Pass từng Phase ≠ Pass §6A.
* **Final Program PASS** chỉ sau Gate Business PASS.
* **Cấm** tuyên bố kênh phân phối (Facebook, Zalo, QR, Ads, Email, …) hỗ trợ đầy đủ trước Gate.
* **Owner ACCEPT / LOCK** — 2026-07-30 · wording v1.2.1.

## Changelog v1.3 (E.7 BD-08)

* Guest replace (BD-06) vs Logged-in Self precedence (BD-08) trên Enter Owner URL.
* B-OWN-03 / lifecycle spine cập nhật — `isLoggedIn` skip không mặc định = bug.

## Changelog v1.2 (E.7 BD-06 · BD-07)

* Enter Owner URL → replace Active Owner Context (BD-06 · BR-18).  
* Owner URL ≠ SEO Asset; SEO Authority = Product URL; crawl/index kỹ thuật deferred (BD-07 · BR-19).  
* B-OWN-03 / B-SEO-01 không còn Deferred OD.

## Changelog v1.1

* BD-00: Subject Owner vs Lifecycle Authority — sửa spine · §5.1 · Roles.  
* NC ≠ User Identity; một Identity Context contract (bỏ “contract tương đương”).  
* Path Capture = candidate; lifecycle có Representation Resolver + validate.  
* Share ≠ App Writer; BD-03 preserve-context; Login = Event trigger only.  
* Product/Owner URL cùng resource lifecycle; Attribution boundary đến Result; Commission ngoài Identity core.

---

*Map SoT → Architecture · **LOCKED v1.4** · tiếp [`05-Plan.md`](05-Plan.md).*
