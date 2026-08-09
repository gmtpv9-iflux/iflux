# 00 — Ngữ cảnh (Audit) · Affiliate V2 Architecture Re-baseline

**Date:** 2026-07-29  
**Status:** §A–C **PASS** · §D **PASS** · §E **PASS** (E.7 BD-00…08 Accepted) · Solution **LOCKED v1.3** · Plan [`05-Plan.md`](05-Plan.md) **DRAFT** (Phase 4 Step 2 Design) · Code **BLOCKED** đến Step 3 mở  

| Artifact | Status |
|----------|--------|
| Business Requirement Brief | **LOCKED** |
| §A–C Document Audit | **PASS** |
| §D Runtime Audit | **PASS** |
| §E Business Model Audit | **PASS** — E.7 Accepted |
| `02-SoT.md` | **LOCKED v1.2** |
| `04-Solution.md` | **LOCKED v1.1** |
| `05-Plan.md` | **DRAFT** — chờ Owner/Reviewer Accept Plan |
| Code | **BLOCKED** đến phase Owner mở |

> Gom audit Program vào **một file**.  
> §A–§C = **Audit 1 (Documents / SoT / ADR)** — SoT cũ ↔ Vision/SoT mới.  
> §D = **Audit 2 (Runtime Architecture Reality)** — ownership / responsibility / patterns.  
> §E = **Audit 3 (Business Model ↔ Architecture ↔ Runtime)** — Capability · URL Class · Ownership Transition · SEO Boundary · Semantic · **E.7 Business Intent Decisions**.

**Thứ tự sau khi khóa §E (E.7 Accepted):**

```text
Business Requirement Brief
        ↓
E.7 Business Intent Decisions (Accepted)
        ↓
02-SoT.md (sync vocabulary / invariants nếu cần)
        ↓
ADR Rewrite (khi Owner mở)
        ↓
04-Solution.md
        ↓
Plan → Implementation → Migration Cleanup
```

**Không** đi thẳng Audit → Solution khi SoT còn semantic lệch Brief.

**Cách đọc §E (LOCKED):** Evidence / quan sát AS-IS so với Brief — Findings B-* — **E.7 = Decision Lock** (không để Solution tự diễn giải Brief).

---

## A. Kết luận ngữ cảnh (Evidence)

| Evidence | Ý nghĩa |
|----------|---------|
| Hệ thống hiện tại xây quanh **Affiliate Context** riêng + cookie/LS từng là authority | Dual authority với Public Identity Vision |
| Auth Exclusion (ADR-AFF-007 · INV-2 · B3) **strip** Owner khỏi `/dang-ky` | Conflict với Vision “system URL mang Identity khi đã có Owner” |
| Register prefill/lock dựa `readActive()` / storage | Bug-fix mindset — không phải đích Re-baseline |
| Canonical/OG sạch · Share Owner URL path | Compatible với SEO Vision |
| Product Architecture V2 thiếu chương Identity | Gap SoT cao nhất |
| Business Requirement Brief khóa Public Identity = Public Address (không chỉ Referral) | Program scope = Identity platform — không chỉ referral architecture |

**Analysis:** Implementation cũ phản ánh mô hình đúng lúc đó; **Business Vision / Brief đã đổi** → cần Re-baseline Architecture, không vá Register/cookie như đích.

**Proposal (chờ Owner/Reviewer):**  
Documentary (§A–C) + Runtime (§D) **chưa đủ** để khóa Solution khi Brief đã nâng Business Model. Cần **§E Business Model Audit** → rồi mới khóa / chỉnh `04-Solution.md` trên Brief + SoT + Runtime. Sau đó mới Plan.

---

## B. Audit Register Attribution (pack 270728 — tóm tắt nhập)

| | |
|--|--|
| **Symptom** | Form `/dang-ky` tự điền mã “sai owner” / không sửa được |
| **Root cause (locked)** | `isRefFromAffiliateLink ≡ !!readActive()` trong khi `readActive` = CTX first-touch **hoặc** cookie/LS → lock nhầm; flag path write-only |
| **Tầng** | UI Register boundary (storage) — **không** phải server overwrite `referred_by` |
| **Đối với Program V2** | Là **incident/bug-fix cũ**. Không dùng làm Product SoT V2. Archive mindset storage-lock. |

Nguồn lịch sử (ngoài thư mục Program, không authority V2):  
`docs/Product Backlog/270728_Affiliate Registration Context Audit/`

---

## C. SoT Conflict Matrix (chi tiết)

## 0. Product Vision mới (ghi nhận từ Owner + Reviewer)

> Không còn mindset “sửa bug referral / Register prefill”. Đây là **đánh giá lại nguyên tắc định tuyến sản phẩm** — reviewer/developer trước đó hiểu chưa đầy đủ, không phải “thêm exception cho cookie”.

### 0.1 Tư duy kinh doanh (Owner)

| Nguyên tắc | Ý nghĩa |
|------------|---------|
| **Một mã / một Public Identity tại một thời điểm** | Guest mang Identity của người chia sẻ; sau khi đăng ký → Identity đổi thành của user mới |
| **Hai loại URL, một resource** | Company Canonical (sạch) ≠ User Owner URL (có `IFL…`) — không mâu thuẫn |
| **SEO công ty** | Index / sitemap / canonical = URL sạch (Product URL = SEO Authority) |
| **SEO/Ads của user** | User quảng bá **Owner URL** (`/IFL…/…`) — địa chỉ công khai trên nền tảng |
| **Owner URL không phải SEO Authority** | Không được trở thành canonical / index authority; chính sách crawl/noindex cụ thể = quyết định sau (không imply bắt buộc noindex trong Audit) |
| **Không bỏ link sạch** | `/dang-ky`, `/cong-dong`, … vẫn sống cho guest chưa có Owner Context / cho SEO công ty |

### 0.2 Chuẩn hóa kỹ thuật (Reviewer — đề xuất khóa SoT)

```text
Public Identity
        │
        ▼
Navigation Context
        │
        ▼
URL Representation  (Owner URL khi đã có Owner Context)
```

| Invariant Vision | Nội dung |
|------------------|----------|
| **V-ID-01** | **Public Identity** = định danh công khai của User · **một** tại một thời điểm |
| **V-ID-02** | **Public Identity** = **Business Source of Truth duy nhất** cho Navigation · Share · Register · Community · Stock · … |
| **V-ID-03** | Mọi **Application URL do hệ thống sinh** khi đã có Owner Context **phải** chứa Public Identity (kể cả `/dang-ky`, `/dang-nhap` nếu Owner known) |
| **V-ID-04** | **Không** dùng cookie / localStorage làm Business SoT (tối đa = technical restore, không phủ nhận kiến trúc) |
| **V-ID-05** | Register / consumers đọc Owner từ **URL Representation / Navigation Context** đã đồng bộ — không đọc storage như nguồn business |
| **V-SEO-01** | Canonical / sitemap / index = URL sạch · **Owner URL không bao giờ là Canonical** |
| **V-SEO-02** | Hai URL cùng render một resource · chỉ khác Owner Context |
| **V-BIZ-01** | Owner URL = Navigation / Share / Ads / Referral / Public address của user |

---

## 1. Conflict Matrix (tài liệu hiện tại × Vision)

**Legend — Conflict**

| Tag | Nghĩa |
|-----|-------|
| **Conflict** | Mâu thuẫn trực tiếp với Vision nếu Vision được chốt |
| **Partial** | Một phần khớp · một phần lệch · cần Rewrite có chọn lọc |
| **Compatible** | Khớp hoặc bổ trợ Vision |
| **Archive** | Evidence / historical — không còn authority nếu Vision chốt |

**Legend — Action (nếu Vision chốt)**

Keep · Rewrite · Delete · Replace · Archive

**Legend — Layer**

Business Rule · Product SoT · Architecture · Implementation

**Severity:** P0 chặn kiến trúc · P1 major · P2 minor · P3 evidence-only

---

### 1.1 Core locks — Navigation / PNC / Exclusion (P0 cluster)

| Document | Section | Current | Conflict | Why | Layer | Action | Sev |
|----------|---------|---------|----------|-----|-------|--------|-----|
| `18-ADR-AFF-007-Personal-Navigation-Context.md` | §12 Exclusion Zone + returnTo | Auth/OAuth/Payment: bar **sạch** · strip Owner · NC persist store | **Conflict** | Vision V-ID-03: hệ thống **không** được sinh `/dang-ky` sạch khi đã biết Owner → phải `/IFL…/dang-ky` | Architecture | **Rewrite** | P0 |
| `18-ADR-AFF-007` | D9 / AC-8 Exclusion | Enter auth → strip prefix trên bar | **Conflict** | Cùng INV Exclusion | Architecture | **Rewrite** | P0 |
| `18-ADR-AFF-007` | D2/D4 Single Writer · Resolver no mutate | Writer = Shell · Resolver không mutate URL | **Partial** | Writer vẫn đúng; **policy decorate** (zone) phải đổi — auth không còn “không decorate” | Architecture | **Rewrite** (zone policy) | P0 |
| `18-ADR-AFF-007` | §4.4 Persistence abstract | NC survive reload; mechanism = detail | **Partial** | Persist OK; **Business SoT** phải là Identity→URL, không store-as-authority | Architecture | **Rewrite** wording | P1 |
| `19-PNC-State-Transition-Matrix.md` | INV-2 Exclusion | Exclusion: address bar **luôn sạch** | **Conflict** | Trái V-ID-03 | Product SoT | **Rewrite** | P0 |
| `19-PNC-State-Transition-Matrix.md` | INV-1 B3 Application Zone | App zone bar == Owner | **Compatible** | Đúng hướng URL Identity trong app | Product SoT | **Keep** (+ mở rộng zone) | — |
| `19-PNC-State-Transition-Matrix.md` | Transition Enter Exclusion | Strip bar · Owner persist | **Conflict** | Strip = anti-pattern dưới Vision | Product SoT | **Rewrite** | P0 |
| `19-PNC-State-Transition-Matrix.md` | INV-5 / INV-7 Canonical composition | App URL = canonical + NC + zone · route nội bộ strip Owner | **Partial** | Canonical sạch = V-SEO-01 **Keep**; zone policy Exclusion **Rewrite** | Product SoT | **Rewrite** zone · **Keep** INV-7 | P0/P1 |
| `21-B2-Lifecycle-Scope-Lock.md` | Verify Owner state vs URL bar | B2 = state only · URL = B3 | **Partial** | Tách lớp OK; Exclusion strip trong lifecycle **Conflict** | Architecture | **Rewrite** | P1 |
| `21-B2-Lifecycle-Scope-Lock.md` | Exclusion / returnTo | Bar clean khi auth | **Conflict** | V-ID-03 | Architecture | **Rewrite** | P0 |
| `23-B3-Core-Navigation-Scope-Lock.md` | `decorate` · `isApplicationZone` | Auth **không** Application Zone → **không** prepend | **Conflict** | Vision: auth **cũng** mang Owner khi NC active | Architecture | **Rewrite** | P0 |
| `23-B3-Core-Navigation-Scope-Lock.md` | N5 Exclusion `/dang-nhap` | Expect bar sạch · Owner persist | **Conflict** | Expectation test trái Vision | Architecture | **Rewrite** | P0 |
| `23-B3-Core-Navigation-Scope-Lock.md` | Single `decorate()` decision | Một điểm quyết định prepend | **Compatible** | Giữ Single Writer; đổi **rule** bên trong | Architecture | **Keep** funnel · **Rewrite** rule | P1 |
| `33-Navigation-Conformance-Report.md` | Pipeline + Exclusion assumptions | Conformance quanh Writer + strip auth | **Conflict** | Evidence khóa model cũ | Architecture | **Archive** / supersede khi V2 | P2 |
| `27-B4.1-Identity-Context-Boundary-Audit.md` | Identity parent · page child | Identity không phụ thuộc page | **Compatible** | Khớp “Public Identity là lớp định danh” | Product SoT | **Keep** · align wording V2 | P2 |
| `03` Registration pack `03-Affiliate-Identity-SoT-vs-Navigation-Audit.md` | Verdict Exclusion strip = đúng SoT · đừng vá Register cho URL | Khẳng định INV-2 | **Conflict** | Đúng với SoT **cũ**; **sai** so với Vision mới — không dùng làm authority V2 | Architecture | **Archive** / superseded by this Matrix | P1 |

---

### 1.2 Attribution Context / cookie / localStorage / Register (P0–P1 cluster)

| Document | Section | Current | Conflict | Why | Layer | Action | Sev |
|----------|---------|---------|----------|-----|-------|--------|-----|
| `02-SoT-Affiliate-Attribution.md` | Capability model | **Affiliate Context** riêng · capture/persist/read · PNC **không** owner attribution (R-09) | **Conflict** | Vision: **một** Public Identity SoT cho mọi capability — dual Context vs PNC = hai authority | Product SoT | **Rewrite** / **Replace** model | P0 |
| `02-SoT-Affiliate-Attribution.md` | R-02 First-touch · R-03 UI-independent storage | Context sống bằng persist độc lập URL sau capture | **Conflict** | Business SoT = URL Identity / NC sync từ URL — không storage-as-SoT | Business Rule | **Rewrite** | P0 |
| `02-SoT-Affiliate-Attribution.md` | R-05…R-08 server `referred_by` | Server SoT cuối · immutable · consumers server-only | **Compatible** | Vẫn đúng sau Identity Created | Business Rule | **Keep** | — |
| `02-SoT-Affiliate-Attribution.md` | Journey Independence · OD wiring | Attribution không thuộc Register page ownership | **Partial** | Server contract Keep; **client transport** không còn “Context storage” | Product SoT | **Rewrite** transport · **Keep** server law | P1 |
| `03-SoT-Affiliate-Context-Contract.md` | Entire contract | Sole Context capability · read at Identity Created · persist survive nav | **Conflict** | Trái V-ID-02/04 — Context storage = Business SoT hiện hành | Product SoT | **Replace** bằng Identity→URL contract | P0 |
| `03-SoT-Affiliate-Context-Contract.md` | §6.1 PNC vs Affiliate Context | Dual-read cấm · hai capability tách | **Conflict** | Vision gộp authority về Public Identity | Product SoT | **Rewrite** | P0 |
| `03-SoT-Affiliate-Context-Contract.md` | “không mô tả storage” nhưng vẫn persist contract | Semantic persist | **Partial** | Cho phép technical restore sau; **cấm** business SoT = cookie/LS | Product SoT | **Rewrite** | P1 |
| `05-Solution-Design-Identity-Creation.md` | §3.2 Transport | Cookie primary · LS fallback · `readActive()` API | **Conflict** | Storage = proposed Business transport | Implementation | **Replace** khi Vision chốt | P0 |
| `05-Solution-Design-Identity-Creation.md` | Sole `affiliate-context` module | Capture owner riêng | **Conflict** | Authority phải là Public Identity / NC→URL | Architecture | **Replace** | P0 |
| `04-SoT-Identity-And-Event-Contract.md` | Identity Created + read Affiliate Context | Handler read Context Capability | **Partial** | Milestone Identity Created **Keep**; **nguồn** `referral_code` đổi = URL/NC Identity | Product SoT | **Rewrite** read source | P1 |
| `01-Owner-Decisions-LOCK.md` | OD-AFF-02 Context sole owner | Một Context capability owner | **Conflict** | Dual với Public Identity URL SoT | Business Rule | **Rewrite** OD set V2 | P0 |
| `01-Owner-Decisions-LOCK.md` | OD-AFF-03 Capture first Affiliate URL | First-touch capture | **Partial** | Entry qua Owner URL vẫn đúng; “persist storage SoT” lệch | Business Rule | **Rewrite** | P1 |
| `01-Owner-Decisions-LOCK.md` | OD-AFF-04 Context đến Identity Created | Context lifetime | **Partial** | Lifetime OK nếu = Owner Context; storage-as-home **Conflict** | Business Rule | **Rewrite** | P1 |
| `01-Owner-Decisions-LOCK.md` | OD-AFF-01/05/06/07/08/09 | Attribution capability · server SoT · no Register-owned logic · provider-agnostic | **Compatible / Partial** | Giữ tinh thần capability + server; bỏ “không liên quan Register UI đọc Identity” nếu Register đọc URL Identity | Business Rule | **Keep** core · **Rewrite** wording UI | P1 |
| `01-Owner-Decisions-LOCK.md` | Note PNC ≠ attribution | Tách capability | **Conflict** | Vision: một Identity SoT cho nav+attribution reference | Product SoT | **Rewrite** | P0 |
| Registration `02-Root-Cause-Locked-and-Fix-Plan.md` | Fix = path-flag vs stale storage | Lock/prefill trên `readActive` / `iflux_ref_from_link` | **Conflict** | Bug-fix trên storage boundary — **không** phải architecture V2 | Implementation | **Archive** as pre-V2 · không làm authority | P1 |
| Registration `01` / `00` Discovery | Storage lifecycle · Register conflation | Phân tích cookie/CTX | **Archive** | Hữu ích lịch sử; mindset storage | Implementation | **Archive** | P3 |

---

### 1.3 Public Identity / Path Decorators / Share / SEO (largely Compatible)

| Document | Section | Current | Conflict | Why | Layer | Action | Sev |
|----------|---------|---------|----------|-----|-------|--------|-----|
| `03-Spec-Affiliate-Identity-Path-Decorators-Draft-v1.md` | ADR-AFF-001 Public Identity = Affiliate Identity | Một Public Identity | **Compatible** | Trùng V-ID-01 | Product SoT | **Keep** · promote thành V2 spine | — |
| `03-Spec…` | §8 Canonical / OG sạch | Canonical không chứa publicId | **Compatible** | = V-SEO-01 | Product SoT | **Keep** | — |
| `03-Spec…` | Incoming → cookie → registration | Cookie session transport | **Conflict** | Storage business path | Architecture | **Rewrite** transport chapter | P1 |
| `03-Spec…` | Reserved auth slugs không làm publicId | `dang-ky` reserved | **Compatible** | Không cấm `/IFL…/dang-ky` | Product SoT | **Keep** | — |
| `05-Plan-Migrate-…Query-to-Path-Decorators.md` | Path thay `?ref=` | Path decorator | **Compatible** | Đúng hướng Owner URL | Architecture | **Keep** direction | — |
| `06-Plan-Extend-Share-Capability…` / Share Foundation (V2 pointer) | Share decorate Owner URL · Affiliate decorator | Outgoing share = Owner path | **Compatible** | Khớp V-BIZ-01 | Product SoT | **Keep** · ensure không `?ref=` business SoT | P2 |
| `35-B5-SEO-Share-Scope-Lock.md` | Canonical/og **MUST NOT** publicId | SEO meta sạch | **Compatible** | = V-SEO-01/02 | Product SoT | **Keep** | — |
| `35-B5-SEO-Share-Scope-Lock.md` | Cấm sửa Writer/Context trong B5 | Freeze đúng phase cũ | **N/A** | Process lock — không conflict Vision content | Implementation | **Archive** phase gate | P3 |
| `37` / `41` B5 SEO evidence | Canonical sạch PASS | Evidence | **Compatible** | Giữ nguyên tắc SEO | Implementation | **Archive** evidence | P3 |
| `39` / `42` B5 Share evidence | Share Owner URL | Evidence | **Compatible** | | Implementation | **Archive** | P3 |
| Product Architecture V2 | Share capability chung · Entity canonical | Canonical entity URL | **Partial** | Thiếu chương khóa Affiliate Public Identity / Owner URL vs Canonical — **gap SoT cao nhất** | Product SoT | **Rewrite** / **Add** chapter khi Vision chốt | P0 |

---

### 1.4 B0–B5 packs / ECR / evidence (roll-up)

| Document / Pack | Section | Current | Conflict | Why | Layer | Action | Sev |
|-----------------|---------|---------|----------|-----|-------|--------|-----|
| `04-G0-Engineering-Change-Record.md` | ECR path decorators | Approved change record cũ | **Partial** | ECR đúng lúc đó; Vision = **re-baseline** mới | Governance | **Keep** history · **New ECR** khi Vision chốt | P2 |
| `00-README` Path Decorators | B1→B5 closed narrative | Exclusion + PNC + Attribution tách | **Conflict** | README khóa model cũ | Architecture | **Rewrite** khi V2 | P1 |
| B1 `20` Foundation evidence | Resolver no mutate | | **Partial** | Keep parse; URL Identity write = Shell | Implementation | **Archive** | P3 |
| B2 `22` Lifecycle evidence | Owner persist + auth strip | | **Conflict** | Strip evidence | Implementation | **Archive** | P2 |
| B3 `24` URL Writer evidence | Auth not decorated | | **Conflict** | | Implementation | **Archive** | P2 |
| B4 `26–33` Consumer migration | Funnel qua decorate + zone cũ | | **Partial** | Funnel Keep; zone policy Rewrite | Architecture | **Rewrite** scope locks | P1 |
| B4.5 / B5 soak locks | Freeze Writer/Context | | **N/A** | Process | Governance | **Supersede** bằng gate V2 | P3 |
| Attribution `00-Audit-*` / `07` Exit / `08` Gates / `06` Checklist | Storage + Identity Created gates | | **Partial** | Server gates Keep; client Context gates Rewrite | Product SoT | **Rewrite** gates | P1 |
| Attribution `09`/`10` Google×Affiliate audits | Runtime cookie/social | | **Archive** | Bug/incident mindset | Implementation | **Archive** | P3 |
| Members Notification pack `270727_*` | ReferralCreated consumers | Server consumers | **Compatible** | OD-AFF-07 hướng | Business Rule | **Keep** | — |
| Google Auth rebuild pack | OAuth exclusion clean URL | Callback sạch | **Partial** | OAuth callback có thể vẫn technical exclusion; **sau auth** URL Identity phải restore — Vision cho phép restore không phủ nhận kiến trúc | Architecture | **Rewrite** boundary OAuth | P1 |

---

## 2. Tổng hợp theo Vision invariant

| Vision ID | Tài liệu “đứng đường” chính | Kết luận |
|-----------|------------------------------|----------|
| **V-ID-01** One Public Identity | Spec ADR-AFF-001 · transferOwnership | **Gần đúng** — Keep · siết “một thời điểm” trên URL+NC |
| **V-ID-02** Sole business SoT | Attribution Context SoT · OD-AFF-02 · R-09 dual | **Conflict nặng** — dual authority |
| **V-ID-03** System URLs always carry Owner | ADR Exclusion · Matrix INV-2 · B3 `isApplicationZone` | **Conflict nặng** — P0 Rewrite |
| **V-ID-04** No cookie/LS Business SoT | Context Contract · Solution Design transport · Register audits | **Conflict nặng** |
| **V-ID-05** Register reads URL/NC | Register Fix Plans storage · `readActive` | **Conflict** (mindset + contract) |
| **V-SEO-01/02** Canonical sạch · Owner không canonical | Spec §8 · B5 SEO · SeoUrl canonical-only | **Compatible** — Keep |
| **V-BIZ-01** Owner URL = Share/Ads address | Share decorate · path decorators | **Compatible** — Keep & strengthen |

---

## 3. Phân loại “giữ / sửa / xoá / thay” (sau khi Owner chốt Vision)

### Giữ (spine Vision)

- Public Identity = Affiliate Identity (ADR-AFF-001)
- Canonical / OG / sitemap sạch (B5 SEO · Spec §8 · INV-7 route canonical)
- Single URL Writer funnel (không caller prepend)
- Server `users.referred_by` immutable + ReferralCreated consumers
- Share outgoing = Owner URL (không business `?ref=`)
- “Hai URL một resource”

### Rewrite (P0)

- Exclusion Zone / INV-2 / AC-8 / B3 auth zone policy  
- Affiliate Context Contract như Business SoT  
- OD-AFF set (02/03/04 + R-09 dual)  
- Product Architecture V2 — **thiếu chương** Affiliate Public Identity / Owner URL  
- ADR-AFF-007 zone + “bar sạch = đúng” trên auth khi Owner known  

### Replace

- Solution Design transport (`readActive` / cookie primary)  
- Dual “PNC vs Attribution Context” authority model → **một** Identity SoT  

### Archive (không authority V2)

- Registration Context bug-fix docs (`00`–`03` pack) như SoT  
- Attribution Google incident / storage lock Fix Plans  
- B2/B3 evidence rows khóa “auth bar sạch”  

### Không xoá cứng lịch sử

- ECR G0 · B1–B5 evidence: giữ làm lịch sử; **không** cite làm SoT sau khi Vision chốt  

---

## 4. Gate Owner (bắt buộc trước mọi bước sau)

| ID | Câu hỏi chốt | Status |
|----|--------------|--------|
| **OD-AFF-V2-01** | Chấp nhận Product Vision §0 làm **Product SoT** (không chỉ “ý tưởng kinh doanh”)? | ☐ |
| **OD-AFF-V2-02** | Khi Owner Context active, hệ thống **bắt buộc** sinh `/IFL…/dang-ky` (và auth tương đương) — **bãi** Exclusion strip cho Auth? | ☐ |
| **OD-AFF-V2-03** | OAuth/payment callback: cho phép URL tạm sạch **chỉ** như technical hop + **restore** URL Identity — không phủ nhận V-ID-03? | ☐ |
| **OD-AFF-V2-04** | Cookie/LS: **cấm** Business SoT; chỉ technical restore (nếu cần) — confirm? | ☐ |
| **OD-AFF-V2-05** | Sau chốt: bước tiếp theo = **Architecture Re-Baseline** (SoT/ADR rewrite) — **chưa** code audit / chưa implement? | ☐ default YES |

**Chưa chốt OD-AFF-V2-01…04 + §D đủ dùng → không khóa Solution · không Fix Plan · không implement.**

---

## 5. Phạm vi deliverable này

| Làm | Không làm |
|-----|-----------|
| Ghi nhận tư duy Owner + Reviewer | Fix Plan / hotfix / workaround |
| Conflict Matrix tài liệu (§C) | Implement / refactor |
| **Runtime Architecture Audit (§D)** — Evidence + Ownership + Findings (D.1–18) | Audit bug / tối ưu code |
| Phân lớp Keep/Rewrite/Replace/Archive | Vá Register / `readActive` như đích |
| Chỉ ra gap Product Architecture V2 | Tự khóa Solution khi chưa có §D |

---

## D. Runtime Architecture Audit

**Mục tiêu:** Xác nhận runtime hiện tại — file / module / lifecycle / ownership / dependency / conflict — để Solution không đoán.

| Cấm trong §D | |
|--------------|--|
| Sửa code · refactor · Fix Plan | |
| Đề xuất Architecture Solution (để `04-Solution.md`) | |
| Audit bug | |

**Cách đọc (LOCKED):**

| Khối | Vai trò |
|------|---------|
| **D.1–D.12** | Evidence — file/API/call quan sát được (không kết luận “conflict/bypass”) |
| **D.13–D.16** | Architecture ownership — boundary · candidate authority · lifecycle · dependency |
| **D.16.5** | Runtime Responsibility Matrix — module nào thực hiện capability nào (không kết luận đúng/sai) |
| **D.17** | Observed Runtime Patterns (Findings) — mô tả pattern; **không** kết luận dual-authority / target design |
| **D.18** | Ownership / responsibility counts + module lists (không merge) |

**Chuỗi lập luận (sau khi Reviewer chấp nhận §D):** Vision → Document SoT (`02-SoT.md`) → Evidence → Ownership → Responsibility → Observed Patterns → `04-Solution.md`.

**Ngày evidence:** 2026-07-29 · `User_Web/` · `backend/src/modules/legacy-auth/` · `Admin_Design_system/iflux-admin-ui/foundation/share-action-store.js` · `infra/nginx-iflux-production-locations.conf`

---

### D.1 Identity Runtime (Evidence)

| Câu hỏi | Evidence |
|---------|----------|
| Server Public Identity field | `users.referral_code` · `auth.service.js` comment `publicId := referral_code` |
| Client self id | `IfluxAuth.getUser().referral_code` · `pnc-lifecycle.js` `selfPublicId(user)` |
| Client guest/nav owner field | `IfluxNavigationContext` · `ownerPublicId` trong `navigation-context.js` |
| Client attribution read API | `IfluxAffiliateResolver.readActive` / `getCodeForIdentityCreation` · `affiliate-resolver.js` |
| Path capture | `affiliate-resolver.js` `resolve()` → `storeAttribution` · `storeContextOnce` |
| PNC create/transfer/deactivate | `pnc-lifecycle.js` `onIncomingReferrer` · `onSessionEstablished` · `onLogout` |
| Consumers đọc attribution code | `auth-register-init.js` · `social-login-usecase.js` · `auth.js` · `loyalty-affiliate-store.js` |
| Storage keys liên quan | cookie/LS `iflux_ref_code` · LS `iflux_aff_context_v1` · LS `iflux_ref_from_link` · session `iflux_pnc_domain_v1` |

---

### D.2 Navigation Runtime (Evidence)

| Câu hỏi | Evidence |
|---------|----------|
| Module | `runtime/navigation-context.js` → `global.IfluxNavigationContext` |
| Persist | `sessionStorage` `iflux_pnc_domain_v1` (+ `returnTo`) |
| Create path | Resolver event → `pnc-shell-bridge.js` → `IfluxPncLifecycle.onIncomingReferrer` → `NavigationContext.create` |
| Transfer path | `auth.js` → `IfluxPncLifecycle.onSessionEstablished` → `transfer` |
| Deactivate path | `auth.js` → `IfluxPncLifecycle.onLogout` → `deactivate` |
| API | `create` · `getContext` · `transfer` · `deactivate` · `setReturnTo` · `takeReturnTo` · `_restore` |
| LAS | `loyalty-affiliate-store.js` — API referral; không export NavigationContext |

---

### D.3 URL Runtime (Evidence)

| Câu hỏi | Evidence |
|---------|----------|
| Reader (strip → canonical) | `runtime/iflux-normalize-path.js` → `IfluxNormalizePath` |
| Writer API | `runtime/shell-url-writer.js` → `decorate` · `navigate` · `replacePath` · `syncBarWithOwner` · `isApplicationZone` |
| Writer đọc Owner từ | `IfluxNavigationContext.getContext().ownerPublicId` |
| Auth zone trong Writer | `isApplicationZone` + `IfluxRoutes.isAuthPage` / `zone === 'auth'` → decorate trả canonical (không prepend) |
| Href | `runtime/iflux-href.js` `forCanonical` → `IfluxShellUrlWriter.decorate` |
| Routes | `iflux-routes.js` `to` / `href` → Href hoặc Writer |
| `location.replace` / `location.href` call-sites (mẫu) | `auth.js` · `auth-login-init.js` · `auth-social.js` · `community-post-page.js` · `stock-comment-page.js` · `account-feature-boot.js` · `entity-pretty-url-redirect.js` · `stock-pretty-url-redirect.js` · `iflux-mail-deeplink.js` |
| Share path decorate | `share-action-store.js` `decorateAffiliateRef` |
| Boot inject order | nginx `sub_filter`: resolver → normalize-path → navigation-context → pnc-shell-bridge → pnc-lifecycle → shell-url-writer → iflux-href → path-base |

---

### D.4 Resolver Runtime (Evidence)

| Câu hỏi | Evidence |
|---------|----------|
| Path-capture module | `runtime/affiliate-resolver.js` → `IfluxAffiliateResolver` |
| `PUBLIC_ID_RE` / tương đương tại | `affiliate-resolver.js` · `shell-url-writer.js` · `iflux-normalize-path.js` · `navigation-context.js` · `pnc-lifecycle.js` · `loyalty-affiliate-store.js` · `share-action-store.js` · `interaction/catalog/index.js` |
| Parse API | `parseAffiliatePath(pathname)` |
| Boot side effect | IIFE `resolve()` khi load script |
| `replaceState` trong resolver | Không có trong `affiliate-resolver.js` |
| Gọi AR / parse khác | LAS · `share-action-store.registerUrlAttribution` · interaction catalog regex trên segs |

---

### D.5 Auth Runtime (Evidence)

| Flow | Evidence path |
|------|----------------|
| Login | `auth-login-init.js` → `auth.js` · social `auth-social.js` / `social-auth/*` |
| Register | `auth-register-init.js` → `auth.js` · AR `getCodeForIdentityCreation` / `isPathCapturedAttribution` |
| Social referral body | `social-login-usecase.js` → `getCodeForIdentityCreation` |
| Zalo OAuth | `auth-social.js` `location.href` · callback `handleZaloCallback` · `history.replaceState` |
| PNC on session | `auth.js` → `onSessionEstablished` |
| PNC on logout | `auth.js` → `onLogout` |
| returnTo | `auth.js` → `saveReturnTo(IfluxRoutes.pathname())` |
| Payment strings in Writer | `/payment` · `/thanh-toan` trong `isApplicationZone` |

---

### D.6 Share Runtime (Evidence)

| Câu hỏi | Evidence |
|---------|----------|
| Build share | `share-action-store.js` `buildShareUrl` · `createShare` |
| Decorate | `decorateAffiliateRef(cleanUrl, refCode)` |
| Canonical input | consumer `canonicalUrl` · `normalizeShareUrl` |
| Outgoing ref | `getOutgoingAffiliateRef()` / `payload.ref` |
| Gọi `IfluxShellUrlWriter.decorate` từ Share createShare/buildShareUrl | Không có (đọc file) |
| UI entry | `iflux-web-ui.js` `ensureShareAction` · `IfluxShareAction` |

---

### D.7 Storage Runtime (Evidence)

| Key / cơ chế | Module ghi/đọc quan sát |
|--------------|-------------------------|
| cookie `iflux_ref_code` | `affiliate-resolver.js` · `loyalty-affiliate-store.js` |
| LS `iflux_ref_code` | AR |
| LS `iflux_ref_from_link` | AR write · `isPathCapturedAttribution` read |
| LS `iflux_aff_context_v1` | AR `storeContextOnce` / `readActive` |
| session `iflux_pnc_domain_v1` | `navigation-context.js` |
| Memory flags | `__IFLUX_INITIAL_CONTEXT_EVENT__` · `__IFLUX_AFFILIATE_RESOLVE__` · PNC `activeContext` |
| Auth session keys | `auth.js` |

---

### D.8 Server Runtime (Evidence)

| Câu hỏi | Evidence |
|---------|----------|
| Email register + referrer | `auth.service.js` → `resolveReferrer(referral_code)` → INSERT `referred_by` |
| Social new user | `socialLoginOrRegister` khi `!user` → `resolveReferrer` → `createSocialUser` |
| Social existing user | Nhánh merge/login — không set `referred_by` mới trong đoạn đã đọc |
| HTTP | `auth.routes.js` `referral_code` optional · `publicId: referral_code` |
| Client gửi | Register/social body từ AR / draft |

---

### D.9 Capability Runtime (Evidence — đọc gì)

| Consumer | API / field đọc |
|----------|-----------------|
| `auth-register-init.js` | AR `getCodeForIdentityCreation` · `isPathCapturedAttribution` |
| `social-login-usecase.js` | AR `getCodeForIdentityCreation` |
| `auth.js` | AR + LAS `isRefFromAffiliateLink` · `resolveRegistrationRefCode` |
| `loyalty-affiliate-store.js` | AR delegate · validate |
| Routes / Href / Writer | PNC `ownerPublicId` qua Writer |
| Share | `getOutgoingAffiliateRef` · `decorateAffiliateRef` |
| `interaction/catalog/index.js` | regex `IFL…` trên path segments |
| Một số page | `IfluxHref.forCanonical` và/hoặc `location.*` (D.3) |

---

### D.10 Module ↔ concern (Evidence index)

| Concern | Module quan sát |
|---------|-----------------|
| DB Public Identity | `auth.service.js` / `users.referral_code` |
| PNC Owner | `navigation-context.js` + `pnc-lifecycle.js` |
| Attribution client | `affiliate-resolver.js` |
| URL read | `iflux-normalize-path.js` |
| URL write (decorate API) | `shell-url-writer.js` |
| Share decorate | `share-action-store.js` |
| Auth session | `auth.js` |
| Boot inject | nginx `sub_filter` list |

---

### D.11 Runtime wiring diagram (Evidence AS-IS)

```text
[nginx inject]
  affiliate-resolver.js ──resolve──► storage keys + event
  navigation-context.js
  pnc-shell-bridge.js ──event──► pnc-lifecycle.js ──► IfluxNavigationContext
  shell-url-writer.js ◄── getContext().ownerPublicId
  iflux-href.js / Routes.to ──► decorate()
  path-base.js

[also present]
  share-action-store.js ──decorateAffiliateRef──► shareUrl
  auth* / register-init / social-usecase ──AR.getCodeForIdentityCreation──► API
  auth.js / pages ──location.replace|href──► (direct)
```

---

### D.12 Evidence gaps

| Gap | Evidence hiện có dừng ở |
|-----|-------------------------|
| Payment/checkout feature files | zone string trong Writer |
| Full `location.*` inventory | grep mẫu D.3 — chưa 100% call-site |
| Production boot vs local social-auth | khác version boot có thể tồn tại |
| SeoUrl / article metadata runtime | B5 docs + pattern |

---

### D.13 Runtime Ownership Boundary

| Concern | Runtime Owner (module) | Reader (quan sát) | Writer (quan sát) | Notes (factual) |
|---------|------------------------|-------------------|-------------------|-----------------|
| Public Identity (DB) | `auth.service` / users row | API · profile · PNC `selfPublicId` | INSERT `referral_code` | AFF-ID-002 comment immutable |
| PNC Owner | `IfluxNavigationContext` | Writer · lifecycle | create/transfer/deactivate via PncLifecycle | sessionStorage |
| Attribution active code | `IfluxAffiliateResolver` | register-init · social-usecase · auth.js · LAS | resolve/store/clear | CTX first-touch `storeContextOnce` |
| URL canonical read | `IfluxNormalizePath` | Routes · Writer · callers | (pure — không ghi history) | strip IFL |
| URL app decorate write | `IfluxShellUrlWriter` | Href · Routes · syncBar | decorate/navigate/replacePath/syncBar | auth zone: no prepend |
| Direct location write | call-sites D.3 | — | location.href/replace · một số history.replaceState | không qua Writer API |
| Share URL decorate | `share-action-store` | Share UI | decorateAffiliateRef/buildShareUrl | không gọi Shell Writer trong createShare |
| Auth session | `IfluxAuth` / `auth.js` | pages | login/logout/session | trigger PNC |
| SEO canonical meta | Metadata/SeoUrl (B5) | crawlers/HTML | meta writers | tách Shell Writer |

---

### D.14 Authority Matrix (Observed Authority Role — candidate)

Nhãn dưới đây là **vai trò quan sát / ứng viên** — chưa phải quyết định Architecture. Solution mới khóa Authority vs Mirror vs Transport vs Temporary vs **Public Representation**.

| Artifact | Observed Authority Role (candidate) | Module / key | Notes (factual) |
|----------|-------------------------------------|--------------|-----------------|
| `users.referral_code` | Candidate Authority | DB / auth.service | self Public Identity field (tên lịch sử = referral) |
| `users.referred_by` | Candidate Authority | DB / auth.service | attribution result field |
| PNC `ownerPublicId` | Candidate Authority (nav decorate input) | `iflux_pnc_domain_v1` | Writer đọc field này khi decorate |
| AR `readActive` / CTX | Candidate Authority (Identity Created client read) | `iflux_aff_context_v1` (+ fallback) | Register/Social đọc path này |
| cookie/LS `iflux_ref_code` | Candidate Transport / Mirror | AR (+ LAS) | xuất hiện trong `readActive` fallback |
| LS `iflux_ref_from_link` | Candidate Flag | AR | predicate UI lock |
| URL `/IFL…/…` | Candidate **Public Representation** (+ capture input) | location · Writer · Share | **không** gọi “View” — Brief: business address / Owner URL |
| Share `shareUrl` decorated | Candidate **Public Representation** (outgoing) | share-action-store | Owner URL string |
| `__IFLUX_*` memory | Candidate Temporary | boot bridge | |

---

### D.15 Runtime Lifecycle (AS-IS)

```text
Guest mở /IFL{sharer}/…
        │
        ▼
affiliate-resolver.resolve()
  → storeAttribution + storeContextOnce
  → emit iflux-incoming-referrer
        │
        ▼
pnc-lifecycle.onIncomingReferrer
  → NavigationContext.create(ownerPublicId=sharer)
        │
        ▼
ShellUrlWriter.decorate / Href / Routes
  → app-zone URLs mang /IFL{sharer}/… (auth zone: không prepend)
        │
        ▼
(parallel) Share createShare → decorateAffiliateRef (self ref)
(parallel) Register/Social → AR.getCodeForIdentityCreation → body.referral_code
        │
        ▼
Identity Created (server)
  → resolveReferrer → users.referred_by (new user)
        │
        ▼
auth.js → onSessionEstablished
  → NavigationContext.transfer(ownerPublicId=self)
        │
        ▼
Writer decorate → /IFL{self}/…
        │
        ▼
Logout → onLogout → NavigationContext.deactivate
```

---

### D.16 Dependency Graph (AS-IS)

```text
affiliate-resolver ──event──► pnc-shell-bridge ──► pnc-lifecycle ──► navigation-context
                                                                      │
                                                                      ▼
                                                              shell-url-writer
                                                                      │
                                                          IfluxHref / Routes.to
                                                                      │
                                                                  Consumers

affiliate-resolver ──readActive──► auth-register-init / social-usecase / auth.js / LAS
                                                                      │
                                                                      ▼
                                                           API referral_code → auth.service

share-action-store ──decorateAffiliateRef──► share consumers

auth.js / pages ──location.*──► direct navigation

normalize-path ◄── Routes / Writer / callers
```

---

### D.16.5 Runtime Responsibility Matrix

Khác D.13 (ai **sở hữu**): bảng này ghi ai **thực hiện** capability nào — quan sát AS-IS, không phân bổ lại.

| Module / Concern | Parse | Capture | Persist | Read | Write URL / store | Decorate | Transfer |
|------------------|:-----:|:-------:|:-------:|:----:|:-----------------:|:--------:|:--------:|
| `affiliate-resolver` | ✓ | ✓ | ✓ (attrib keys) | ✓ | — | — | — |
| `navigation-context` + `pnc-lifecycle` | ✓ (validate shape) | — | ✓ (session PNC) | ✓ | ✓ (create/deactivate) | — | ✓ |
| `shell-url-writer` | ✓ (shape) | — | — | ✓ (PNC) | ✓ (`decorate` / navigate / replacePath / syncBar) | ✓ | — |
| `iflux-normalize-path` | ✓ (strip) | — | — | ✓ | — | — | — |
| `share-action-store` | ✓ (shape) | — | — | ✓ (outgoing ref) | — | ✓ (`decorateAffiliateRef`) | — |
| `loyalty-affiliate-store` | ✓ (validate) | — | ✓ (mirror keys) | ✓ | — | ✓ (delegate Share hoặc build link) | — |
| `auth.js` / register-init / social-usecase | — | — | ✓ (session/draft) | ✓ (AR + PNC hooks) | ✓ (`location.*` một số path) | — | ✓ (gọi lifecycle) |
| `auth.service` (server) | — | — | ✓ (DB) | ✓ | ✓ (`referral_code` / `referred_by`) | — | — |
| Direct page call-sites (D.3) | — | — | — | — | ✓ (`location.*`) | — | — |

✓ = responsibility quan sát được tại module. Ô trống = không thấy trong evidence hiện tại.

---

### D.17 Observed Runtime Patterns (Findings)

Chỉ mô tả pattern đã thấy. **Không** kết luận dual-authority / “phải merge” / target design — để `04-Solution.md`.

| ID | Observed Runtime Pattern | Evidence neo |
|----|--------------------------|--------------|
| **R-AUTH-01** | Navigation/Writer consume PNC `ownerPublicId`. Register/Social consume AR `readActive` / CTX / cookie fallback. | D.1 · D.2 · D.9 · D.14 · D.16.5 |
| **R-URL-01** | Call-sites ghi URL qua `location.href` / `location.replace` / một số `history.replaceState` tồn tại ngoài `IfluxShellUrlWriter` API. | D.3 · D.16.5 |
| **R-URL-02** | Share dùng `decorateAffiliateRef`. App navigation dùng `IfluxShellUrlWriter.decorate`. Hai decorate path quan sát được. | D.6 · D.16 · D.16.5 |
| **R-URL-03** | Writer `isApplicationZone`: auth routes trả path không prepend Owner. | D.3 |
| **R-RES-01** | Shape/regex `IFL…` xuất hiện tại 8 modules (list D.18). Path-capture boot chính: `affiliate-resolver`. | D.4 · D.18 |
| **R-STO-01** | Attribution keys (cookie/LS) và PNC session (`iflux_pnc_domain_v1`) là hai cụm storage riêng. | D.7 |
| **R-OWN-01** | Cùng lúc tồn tại: ShellUrlWriter decorate API · direct `location.*` writers · Share decorator. | D.13 · D.16.5 · D.18 |
| **R-CAP-01** | Register/Social đọc AR. Navigation decorate đọc PNC. | D.9 · D.15 · D.16.5 |
| **R-RESP-01** | Parse xuất hiện trên nhiều module (AR · Normalize · Writer · PNC · Share · LAS · interaction catalog). Decorate xuất hiện trên Writer và Share (+ LAS delegate). | D.16.5 · D.18 |
| **R-SEM-01** | Runtime naming vẫn mô hình hóa Public Identity như Affiliate/Referral. Evidence: `affiliate-resolver` · `decorateAffiliateRef` · `referral_code` · Affiliate Context (docs). Observation: vocabulary phản ánh capability referral lịch sử — **không** kết luận rename trong Audit. | E.5 · D.4 · D.6 |

---

### D.18 Candidate Ownership (count + module list)

Chỉ thống kê. **Không merge · không chọn owner target.**

| Concern | Count (AS-IS) | Modules / sites |
|---------|---------------|-----------------|
| URL Reader (normalize API) | **1** | `iflux-normalize-path.js` |
| URL Writer API (decorate) | **1** | `shell-url-writer.js` |
| URL write qua `location.*` / raw history | **N>1** | mẫu: `auth.js` · `auth-login-init.js` · `auth-social.js` · `community-post-page.js` · `stock-comment-page.js` · `account-feature-boot.js` · `entity-pretty-url-redirect.js` · `stock-pretty-url-redirect.js` · `iflux-mail-deeplink.js` (chưa inventory 100%) |
| Share path decorator | **1** | `share-action-store.js` (`decorateAffiliateRef`) |
| Nav Owner store (PNC) | **1** | `navigation-context.js` (+ `pnc-lifecycle.js`) |
| Attribution client store/API | **1** | `affiliate-resolver.js` (+ LAS mirror keys) |
| Client identity/context read path | **2** | PNC `ownerPublicId` · AR `readActive`/CTX |
| Regex / IFL parse sites | **8** | `affiliate-resolver.js` · `shell-url-writer.js` · `iflux-normalize-path.js` · `navigation-context.js` · `pnc-lifecycle.js` · `loyalty-affiliate-store.js` · `share-action-store.js` · `interaction/catalog/index.js` |
| Decorate implementations | **2** (+ LAS delegate) | `shell-url-writer.decorate` · `share-action-store.decorateAffiliateRef` · LAS có thể delegate Share |
| Storage clusters | **2** | attribution (`iflux_ref_*` / `iflux_aff_context_v1`) · PNC (`iflux_pnc_domain_v1`) |
| Server Public Identity writer | **1** | `auth.service` INSERT `referral_code` |
| Server `referred_by` writer (new user) | **1** | `auth.service` `resolveReferrer` path |

---

*§A–§C Documentary · §D Runtime Architecture · §E Business Model Audit (E.1–E.5). Brief + §E được Reviewer chấp nhận → mới khóa `04-Solution.md`.*

---

## E. Business Model Audit (Brief ↔ Architecture ↔ Runtime)

**Neo Brief:** [`Business requirement brief.md`](Business%20requirement%20brief.md)  
**Mục tiêu §E:** Kiểm tra Business Model Public Identity (Public Address, không chỉ Referral) có khớp Architecture/Runtime AS-IS hay không.  
**Cấm trong §E:** Fix · Solution design · rename code.

| Khối | Vai trò |
|------|---------|
| **E.1** | Business Capability Audit |
| **E.2** | URL Class Audit |
| **E.3** | Ownership Transition Audit |
| **E.4** | SEO Boundary Audit |
| **E.5** | Public Identity Semantic Audit |
| **E.6** | Findings B-* (+ severity) |
| **E.7** | Business Intent Decisions (BD-*) — Owner Accept |
| **E.8** | Điều kiện đóng §E |

**Ngày evidence §E:** 2026-07-29 · `User_Web/iflux-web-ui/` · Share Foundation · docs SEO Spec · Brief LOCKED

---

### E.1 Business Capability Audit

**Câu hỏi Brief:** Public Identity dùng cho share · referral · branding · ads · QR · Application URL — không chỉ Affiliate.

| Capability | Public Identity đang được hiểu / dùng AS-IS (Evidence) | Đọc từ đâu (AS-IS) | Có dấu hiệu “chỉ là Referral Code”? |
|------------|--------------------------------------------------------|--------------------|-------------------------------------|
| **Referral / Attribution** | `referral_code` body · `resolveReferrer` · AR `getCodeForIdentityCreation` | AR CTX/cookie · LAS | **Có** — naming + flow referral-first |
| **Share** | `decorateAffiliateRef` · `buildShareUrl` prepend IFL lên canonical sạch | `getOutgoingAffiliateRef` / payload.ref · user.referral_code | **Có (tên)** — decorate = Owner URL path; comment “affiliate” |
| **Navigation / App Shell** | PNC `ownerPublicId` · Writer `decorate` | `IfluxNavigationContext` | **Một phần** — Nav dùng Identity; naming vẫn gắn Affiliate path decorators ADR |
| **Register** | Prefill/lock mã · gửi `referral_code` | AR `readActive` / `isPathCapturedAttribution` | **Có** — Identity Created = referral field |
| **Login / Social** | Social body `referral_code` khi new user | AR `getCodeForIdentityCreation` | **Có** |
| **Community** | Page nav qua Href/Writer; share bài qua Share Foundation | PNC gián tiếp · Share canonical sạch + decorate | **Hỗn hợp** — nội dung canonical; share = Owner URL |
| **Stock / Entity** | Pretty URL + Writer; stock canonical trong `seo-url.js` | Normalize + Writer · SEO meta Product URL | **Hỗn hợp** |
| **Profile / Membership** | Hiển thị `referral_code` · `buildReferralLink` | `user.referral_code` · LAS | **Có** — UI “mã giới thiệu” / referral link |
| **QR** | Evidence mỏng trong scope grep hiện tại — thường reuse Share/referral link | (gap) | **Gap** — chưa inventory QR riêng |
| **Marketing / Ads** | Brief yêu cầu Owner URL ổn định; runtime không có module “Ads URL builder” riêng ngoài Share/Writer | Share / Writer | **Gap** — chưa audit Ads landing cụ thể |
| **Deep Link / Mail** | `iflux-mail-deeplink.js` · `location.*` (D.3) | Path/query tùy deeplink | **Gap** — chưa class Owner vs Product |
| **Notification** | Catalog có thể chứa link; chưa audit Owner prepend | (gap) | **Gap** |
| **OAuth / Callback** | Writer `isApplicationZone` = false cho oauth/callback | Không decorate | **N/A Identity trên bar** (zone loại) |
| **Payment / Thanh toán** | Writer loại `/payment` · `/thanh-toan` | Không decorate | **N/A trên bar** (zone loại) |
| **Affiliate Commission / Payout** | LAS · payout stores — referral economics | `referral_code` / affiliate APIs | **Có** — đúng domain referral; không = Public Address platform |

**Observed pattern (E.1):**  
Nhiều capability **đã** mang path IFL / `ownerPublicId` (Nav, Share, Writer) nhưng **ngôn ngữ + contract** vẫn neo “affiliate / referral_code”. Một số capability Brief (QR, Ads, Notification) **chưa** có evidence rõ trong inventory hiện tại.

---

### E.2 URL Class Audit

**Brief:** hai class — **Product URL** (Company) và **Owner URL** (Public Identity URL) — cùng resource, khác purpose.

#### E.2.1 Class definition (Brief) vs Runtime terms

| URL Class (Brief) | Purpose (Brief) | Canonical? | Share / Ads | Index mục tiêu | Runtime term gần nhất (AS-IS) |
|-------------------|-----------------|------------|-------------|----------------|------------------------------|
| **Product URL** | SEO · sitemap · marketing công ty | **Luôn** Canonical | Input sạch cho Share | Có | `canonical` · `IfluxNormalizePath` output · `decorate` input |
| **Owner URL** | Share · referral · ads user · QR · branding | **Không** bao giờ Canonical | Output Share decorate · Writer bar | Không bắt buộc | `/IFL…` + path · `decorateAffiliateRef` · Writer `decorate` |

#### E.2.2 Runtime xử lý theo class (Evidence)

| Concern | Product URL | Owner URL | Evidence |
|---------|-------------|-----------|----------|
| **Sinh Application URL khi có Owner** | Input | Output (app zone) | `shell-url-writer.js` `decorateCanonical` |
| **Auth / OAuth / Payment zone** | Giữ sạch (không prepend) | Không sinh Owner trên zone này | `isApplicationZone` = false |
| **Share** | `canonicalUrl` required sạch | `shareUrl` = decorate IFL | `share-action-store.js` |
| **Strip / đọc resource** | Sau normalize | Prefix IFL bị strip | `iflux-normalize-path.js` |
| **SEO meta canonical** | Set Product canonical | Không thấy set Owner làm canonical trong `seo-url.js` mẫu | `seo-url.js` `link[rel=canonical]` từ meta Product |
| **robots.txt / sitemap.xml** | Writer không decorate các path này | — | Writer exclude list |
| **Hai bản nội dung độc lập?** | Không — cùng page sau strip | Không | Normalize + routes |

**Observed pattern (E.2):** Runtime **có** tách hành vi Product (canonical/normalize input) vs Owner (prefix IFL), nhưng **không** có vocabulary/class “Product URL / Owner URL” trong code — dùng `canonical` + `affiliate`/`decorateAffiliateRef`.

**Gap:** Inventory đầy đủ internal link có/không luôn đi Writer; Ads landing pages; email templates.

---

### E.3 Ownership Transition Audit

**Brief §7:** Guest mang Owner sharer → Identity Created → Owner = self; Application URL phản ánh Owner mới.  
**Brief:** một Public Identity tại một thời điểm.

| State / Event | Owner hiệu lực (AS-IS evidence) | Application URL (bar) | Canonical (SEO) | Share URL | Navigation Context |
|---------------|----------------------------------|----------------------|-----------------|-----------|-------------------|
| **Guest · mở Owner URL** | Sharer (path → AR + PNC create) | Có thể mang `/IFL{sharer}/…` nếu app zone | Product (meta) | N/A hoặc sau đó self | PNC `ownerPublicId` = sharer |
| **Guest · Product URL sạch** | Không Owner / chưa create | Sạch | Product | — | Không PNC owner |
| **Guest đã có Owner A · mở Owner URL của B** | **Chưa khóa rule** — AS-IS: resolver/PNC có thể tạo/ghi đè theo incoming (cần verify path-by-path) | Phụ thuộc Writer + NC sau replace | Product | — | **Gap decision** — thay A bằng B ngay? |
| **Register · form** | Prefill từ AR (referral) | Auth zone: Writer **không** prepend (R-URL-03) | Product | — | PNC có thể còn sharer trong session |
| **Identity Created (email/social new)** | Server: self `referral_code` + `referred_by` | Sau session: PNC transfer → self | Product | Share dùng self ref | `onSessionEstablished` → transfer self |
| **Login existing** | Self (user.referral_code) | Transfer self | Product | Self | PNC authenticated self |
| **Logout** | Deactivate NC | Hết Owner prepend | Product | — | `onLogout` deactivate |
| **Login again** | Self | Self Owner URL (app zone) | Product | Self | Recreate/transfer self |
| **OAuth callback** | Zone không decorate | Path callback sạch / replaceState tùy flow | — | — | Sau session → transfer (**exception kỹ thuật** — phải restore Context sau callback theo BD-03) |
| **Payment** | Zone không decorate | Sạch trên bar | — | — | NC có thể vẫn tồn tại store |
| **Expired session** | **Gap** — chưa evidence riêng | **Gap** | Product | **Gap** | **Gap** restore/expire policy |

**Observed pattern (E.3):**  
**Lệch Brief/BD-03 (AS-IS):** Auth Exclusion có thể làm bar không mang Owner dù NC có sharer. BD-03 Accepted: link **cần duy trì Owner Context** phải preserve Owner — **không** = mọi URL bắt buộc prefix; Product URL vẫn tồn tại.  
**B-OWN-03:** Rule thay Owner khi Guest/User đang Context A rồi enter Owner URL B **chưa được định nghĩa tường minh** ở Brief/SoT (expose P1 — không giải trong Audit).

---

### E.4 SEO Boundary Audit

**Brief / BD lock hướng:** **SEO Authority = Product URL**. Owner URL **không** được trở thành canonical / index authority.

**Không** khóa trong Audit một trong ba option implementation:

| Option | Mô tả | Audit có khóa? |
|--------|-------|----------------|
| A | Canonical Product + Owner URL vẫn crawl/indexable | Không |
| B | Canonical Product + noindex Owner URL | Không |
| C | robots block Owner pattern | Không |

Chỉ khóa boundary: Owner URL ≠ SEO Authority.

| Câu hỏi boundary | Evidence AS-IS | Khớp Brief? (quan sát) |
|------------------|----------------|-------------------------|
| Crawl Owner URL thấy cùng nội dung resource? | Normalize strip IFL → cùng route/page | **Khớp hướng** (một resource) |
| `link[rel=canonical]` trả gì khi đang ở Owner URL? | `seo-url.js` / community meta dùng canonical Product; không thấy ghi Owner vào canonical | **Khớp hướng** (cần verify mọi page type) |
| `og:url` | Thường = canonical/meta url Product | **Khớp hướng** (mẫu stock/community) |
| Share `robots` | `pages/share.manifest.js` `noindex,follow` | Surface share — không = policy toàn Owner URL |
| `sitemap.xml` chứa Owner URL? | Spec: sitemap từ catalog Product paths; Writer không decorate sitemap path | **Khớp hướng** — **Gap** verify file prod |
| `robots.txt` Disallow `/IFL*`? | Spec Disallow admin/api/home; **không** thấy rule Disallow Owner | **Không imply** phải block — quyết định Option A/B/C sau |
| Internal link sinh Owner URL? | Writer decorate app zone khi có PNC | **Đúng Brief §9** cho app; **Conflict** auth zone |
| Google Ads landing = Owner URL? | Brief yêu cầu; runtime = Share/Writer | **Gap** marketing inventory |

**Observed pattern (E.4):** Canonical/OG **hướng** Product URL = SEO Authority. Chính sách crawl/noindex Owner = **chưa lock** (tránh hiểu nhầm “Google không cần index” = bắt buộc noindex).

---

### E.5 Public Identity Semantic Audit

**Câu hỏi:** Codebase đang hiểu “Public Identity” là gì — so Brief (Public Address) vs “chỉ Referral”.

**Vocabulary V2 (khóa hướng — Confirm ở E.7):**

| Cũ (lịch sử) | V2 |
|--------------|-----|
| referral_code (business meaning) | **publicId** / Public Identity |
| affiliate link / referral URL | **Owner URL** |
| affiliate context (như Identity SoT) | **attribution transport** (không = Identity) |
| affiliate owner | **identity owner** / Owner |
| Affiliate Public Identity | **Public Identity** (cấm dùng lại cụm “Affiliate Public Identity”) |

**Cây capability đúng Brief:**

```text
Public Identity
        ├── Attribution capability
        ├── Referral / Commission capability
        ├── Share capability
        └── … (Nav, Community, Stock, …)
```

Affiliate **không** là cha của Public Identity.

| Semantic / Symbol | Ý nghĩa AS-IS (Evidence) | So Brief (Public Address / Owner URL) |
|-------------------|--------------------------|----------------------------------------|
| `users.referral_code` / `referral_code` | Public id field + referral body param | **Lệch tên** — field = Public Identity; tên = Referral |
| `publicId` (API comment / auth) | Alias `referral_code` | **Gần đúng** Brief |
| `ownerPublicId` (PNC) | Owner hiệu lực cho Nav/Writer | **Khớp** Nav Identity |
| `decorateAffiliateRef` | Prepend IFL → **Owner URL** từ canonical | **Lệch tên** — Affiliate; **đúng hành vi** Owner URL |
| `buildReferralLink` / LAS | Link giới thiệu = Owner URL root | **Lệch tên** — Referral; Brief = Public Address |
| `IfluxAffiliateResolver` / `readActive` | Capture/persist attribution code | **Referral transport** — không = Business SoT Identity |
| `iflux_aff_context_v1` / `iflux_ref_code` | Attribution storage | **Transport/Temporary** — Brief cấm coi là nghiệp vụ SoT |
| `resolveReferrer` | Map code → `referred_by` | **Khớp** Attribution capability |
| `Affiliate Context` (docs/ADR cũ) | Business context capability | **Lệch Brief** — không được = Identity platform |
| `Path Decorators` / ADR-AFF naming | Affiliate path | **Lệch tên** — Brief = Owner URL Representation |
| Share comment “affiliate?” | Flag decorate | **Lệch tên** |
| Canonical / `IfluxNormalizePath` | Product URL class | **Khớp** Product URL |
| `referred_by` | Attribution result | **Khớp** Attribution — không phải Identity của self |

**Observed pattern (E.5):** Semantic **lạc hậu so Brief** (**P0** drift): nhiều symbol “affiliate/referral” đang mang **Public Identity / Owner URL**.

---

### E.6 §E Findings summary (Observed — không phải Solution)

| ID | Severity | Observed Business-Model Pattern | Neo |
|----|----------|----------------------------------|-----|
| **B-SEM-01** | **P0** | Runtime/docs naming vẫn model Public Identity như Affiliate/Referral | E.5 · R-SEM-01 |
| **B-CAP-01** | **P0** | Nhiều capability dùng path/code IFL nhưng contract/UI vẫn “referral/affiliate” — semantic architecture drift | E.1 · E.5 |
| **B-CAP-02** | P2 | QR · Ads · Notification · Deeplink — inventory còn gap | E.1 |
| **B-URL-01** | P1 | Runtime tách Product vs Owner nhưng thiếu vocabulary class trong code | E.2 |
| **B-URL-02** | P0 | Auth/Payment/OAuth không mang Owner URL dù NC có Owner — lệch Brief §9 / BD-03 | E.2 · E.3 |
| **B-OWN-01** | P0 | Guest→Self có; Register bar sạch lệch Brief “URL phản ánh Owner” | E.3 |
| **B-OWN-02** | P2 | Expired session / restore Owner — gap evidence | E.3 |
| **B-OWN-03** | **P1** | Owner Context replacement khi đang Owner A rồi enter Owner URL B — rule chưa định nghĩa tường minh | E.3 |
| **B-SEO-01** | P1 | SEO Authority = Product URL (khớp hướng); crawl/noindex Owner = chưa lock option | E.4 |

---

### E.7 — Quyết định Authority của Public Identity (+ Business Intent Decisions)

**Status:** ✅ **Owner Accepted** — 2026-07-29 (BD-00…05 · BD-06 Owner Context Replacement · BD-07 Owner URL SEO Role)  
**Mục đích:** Khóa Authority từ Brief → **không** để Solution hiểu “Platform Identity sở hữu User/Identity” hoặc “Public Identity = URL”.

---

#### BD-AFF-V2-00 — Authority của Public Identity (cốt lõi)

**Quyết định:**

**User là chủ thể sở hữu Public Identity.**

Public Identity đại diện cho một User trên nền tảng và được liên kết duy nhất với User đó.

**Platform Identity là capability chịu trách nhiệm định nghĩa và bảo vệ lifecycle của Public Identity.**

Platform Identity sở hữu các quy tắc nghiệp vụ liên quan đến:

* tạo Public Identity;
* validate Public Identity;
* thay đổi trạng thái hiệu lực của Public Identity;
* thực hiện Identity Transition theo Business Event được Product cho phép;
* đảm bảo tính nhất quán của Public Identity trên toàn nền tảng.

Không capability nào khác ngoài Platform Identity được phép tự ý thay đổi trạng thái Public Identity.

---

##### Phân biệt Ownership và Authority

| Khái niệm | Ý nghĩa | Owner / Authority |
|-----------|---------|-------------------|
| **User** | Chủ thể mà Identity đại diện | User |
| **Private Identity** | Định danh nội bộ của User | User Account |
| **Public Identity** | Định danh công khai / Public Address đại diện User | **Subject Owner: User** |
| **Public Identity Lifecycle** | Quy tắc tạo, thay đổi, transition, consistency | **Lifecycle Authority: Platform Identity** |
| **Attribution** | Kết quả nghiệp vụ giới thiệu | Affiliate Capability |
| **Navigation Context** | Runtime projection của Identity | Navigation Runtime |
| **Owner URL** | Public Representation của Public Identity | Representation — **không** = Identity |

---

##### Nguyên tắc bất biến

```text
User
 |
 | sở hữu (Subject Owner)
 ↓
Public Identity          ← Business SoT / Public Address
 |
 | được quản lý lifecycle bởi (Lifecycle Authority)
 ↓
Platform Identity
 |
 | được sử dụng bởi
 ↓
Affiliate / Share / Community / Navigation / Register / …
```

**Không được hiểu sai:**

```text
Sai:  Platform Identity → sở hữu User / sở hữu Public Identity như tài sản
Đúng: User → sở hữu Public Identity
      Platform Identity → quản lý luật vận hành (lifecycle) của Public Identity
```

**Không được hiểu sai (URL):**

```text
Sai:  User → Owner URL → Public Identity
Đúng: User → Public Identity → Owner URL (Representation)
```

---

##### Boundary capability

| Capability | Được phép | Không được phép |
|------------|-----------|-----------------|
| Affiliate | Sử dụng Public Identity để attribution | Tạo hoặc đổi Public Identity |
| Share | Tạo Owner URL từ Public Identity | Tự định nghĩa Identity |
| Register | Kích hoạt Business Event (vd. User/Identity Created) | Tự quyết định Identity Transition |
| Navigation | Mang Identity Context runtime | Tự đổi Owner |
| Auth | Xác thực User | Trở thành nguồn Public Identity |
| URL | Biểu diễn Public Identity | Trở thành Identity Authority |

**Owner Accept BD-00:** ✅ 2026-07-29  

---

#### BD-AFF-V2-01 — Platform capability, not Affiliate artifact

**Decision:** Public Identity is a **platform Public Address**, not an affiliate-only artifact.

**Acceptance:**

- `referral_code` (storage/field hiện có) = **existing storage representation** (không = Subject Owner)
- **Business meaning** = Public Identity (Public Address) thuộc **User**
- Cấm gọi “Affiliate Public Identity” trong SoT/Solution/ADR mới

**Owner Accept:** ✅ 2026-07-29  

---

#### BD-AFF-V2-02 — Two URL representations

**Decision:** Owner URL and Product URL are **two representations of one resource**.

**Acceptance:**

- **Product URL** = SEO Authority
- **Owner URL** = distribution Representation (Share · Ads · QR · branding) — **không** = Public Identity

**Owner Accept:** ✅ 2026-07-29  

---

#### BD-AFF-V2-03 — Owner Context ⇒ preserve Owner trên link cần duy trì context

**Decision:** Khi trải nghiệm đang thuộc **Owner Context**, các link do hệ thống sinh ra mà **cần duy trì context đó** phải **preserve Owner** (thường qua Owner URL Representation).

**Không được hiểu sai:**

- ❌ Mọi URL bắt buộc phải có prefix Owner / IFL…
- ✅ **Product URL vẫn tồn tại** (SEO · canonical · guest · entry sạch · Brief §8)
- ✅ Chỉ các navigation / application links **cần mang Owner Context** mới bắt buộc preserve Owner
- ✅ Technical callback / OAuth / payment exception **có thể** tạm không mang Owner trên bar nhưng **phải restore** Owner Context / Representation sau exception

**Acceptance:**

- Auth exclusion **không** được dùng để **xóa** Active Owner Context khỏi các link ứng dụng cần preserve context
- Product URL class không bị bãi bỏ vì có Owner Context
- Neo: B-URL-02 · B-OWN-01 · R-URL-03 · Brief §8–§9 (đã refine)

**Owner Accept:** ✅ 2026-07-29 (sau refine wording)

---

#### BD-AFF-V2-04 — Attribution ≠ Identity

**Decision:** Attribution and Identity are **related but not identical**.

**Acceptance:**

- Attribution result = `referred_by` (ledger) — Affiliate Capability
- Identity = Public Identity thuộc User; representation = publicId / Owner Context / Owner URL
- Affiliate **consume** — không Subject Owner Identity

**Owner Accept:** ✅ 2026-07-29  

---

#### BD-AFF-V2-05 — Storage is not Business Authority

**Decision:** Storage is not Business Authority.

**Acceptance:**

- cookie / localStorage / sessionStorage = **transport** hoặc **recovery** only
- Không dùng storage làm Business SoT / Subject Owner của Public Identity

**Owner Accept:** ✅ 2026-07-29  

---

#### BD-AFF-V2-06 — Owner Context Replacement

**Decision (Accepted · refined 2026-07-29 với BD-08):**

Khi **Guest** (hoặc trải nghiệm **chưa** có Authenticated Self) truy cập **Owner URL** của một Public Identity khác với Owner Context hiện hành, **Owner Context hiện hành được thay thế** bởi Owner mới (Replace ngay).

**Rationale:**

- Owner Context đại diện cho **trải nghiệm hiện tại** khi chưa có Self đã xác lập.
- **Attribution history** không đồng nghĩa Owner Context (neo BD-04).
- Guest giữ A trong khi URL đang là B → rối trải nghiệm.

**Acceptance:**

- Guest · Active Owner = A · enter Owner URL B ⇒ Active Owner Context = B.
- Guest · chưa có Owner · enter Owner URL B ⇒ Active Owner = B.
- Attribution xử lý **riêng** theo Business Rule Attribution.
- **Không** áp dụng replace vô điều kiện khi User đã login — xem **BD-08**.

**Trước đây:** `OD-OWN-REPLACE` — Deferred.  
**Owner Accept BD-06:** ✅ 2026-07-29 · **Refine scope Guest:** ✅ 2026-07-29 (cùng BD-08)

---

#### BD-AFF-V2-08 — Authenticated Self Owner Context Precedence

**Decision (Accepted):**

Khi User **đã login** và Public Identity Self = A đã xác lập:

* Mở Owner URL của B (`/IFLB456/…`) → **Active Owner Context vẫn = A** (**không** replace sang B).

**Rule tổng hợp:**

| Trạng thái | Enter Owner URL B | Active Owner sau |
|------------|-------------------|------------------|
| Guest (chưa Self) | `/IFLB…` | **B** |
| Guest · đang Owner A | `/IFLB…` | **B** (replace — BD-06) |
| Logged in · Self = A | `/IFLB…` | **A** (không replace — BD-08) |

**Rationale:**

- Public Identity của user đã đăng nhập **luôn ưu tiên**.
- Owner URL dùng để xác lập Owner Context cho **Guest** hoặc **trước khi** Identity của người dùng được xác lập.
- Không được để user A chỉ vì mở link của B mà toàn bộ Application chuyển sang Owner B.

**Acceptance:**

- `isLoggedIn() → không apply incoming Owner` **không** kết luận là bug nếu đúng BD-08.
- Audit/Design phải chứng minh transition matrix đầy đủ (Guest attach · Guest replace · Register→Self · Login→Self · Logged-in ignore · Logout deactivate).
- Attribution từ link B (nếu có) **không** đồng nghĩa đổi Owner Context của A.

**Owner Accept BD-08:** ✅ 2026-07-29  

---

#### BD-AFF-V2-07 — Owner URL SEO Role

**Decision (Accepted):**

**Owner URL** là **Public Distribution Representation** — **không** phải SEO Asset.

**SEO Authority duy nhất** thuộc **Product URL**.

**Implementation** crawl/index policy của Owner URL (noindex · canonical · robots · sitemap exclusion · …) **deferred** cho quyết định kỹ thuật SEO — **không** khóa trong Business Decision này.

**Rationale:**

- Owner URL phục vụ Share · Ads · QR · Email · distribution — không tạo hàng loạt SEO pages theo từng user.
- Không chọn hướng “Owner URL = indexable SEO target” (phương án index cũ).

**Acceptance:**

- Cấm hiểu: BD-07 = bắt buộc chọn một kỹ thuật cụ thể (vd. chỉ noindex).
- Solution/Plan SEO phase được phép chọn cơ chế kỹ thuật phù hợp miễn **không** biến Owner URL thành SEO Authority / SEO asset cạnh Product URL.
- Neo: BD-02 · Brief SEO · Audit E.4.

**Trước đây:** `OD-SEO-CRAWL` (*Owner Decision: SEO Crawl policy*) — Deferred (A index / B noindex / C robots).  
**Owner Accept BD-07:** ✅ 2026-07-29  

---

#### Quyết định còn mở (expose — deferred)

*Không còn OD-OWN-REPLACE / OD-SEO-CRAWL.* Các quyết định Product mới (nếu phát sinh) ghi thêm BD-* tại đây — không tự chốt trong Solution.

---

### E.8 Điều kiện đóng §E / mở Solution

| Điều kiện | Status |
|-----------|--------|
| §A–C PASS | ✅ |
| §D PASS | ✅ |
| §E.1–E.6 findings recorded | ✅ |
| Owner Accept **BD-AFF-V2-00** | ✅ 2026-07-29 |
| Owner Accept **BD-AFF-V2-01…05** | ✅ 2026-07-29 (BD-03 refined) |
| Owner Accept **BD-AFF-V2-06** (Owner Context Replacement — Guest) | ✅ 2026-07-29 · refined với BD-08 |
| Owner Accept **BD-AFF-V2-07** (Owner URL SEO Role) | ✅ 2026-07-29 |
| Owner Accept **BD-AFF-V2-08** (Authenticated Self Precedence) | ✅ 2026-07-29 |
| Vocabulary: Public Identity · ≠ Owner URL · ≠ Affiliate Public Identity | ✅ |
| `02-SoT` sync Subject Owner / Lifecycle Authority + BD-03 · BD-06 · BD-07 | ✅ / cập nhật cùng Accept |
| `04-Solution` | **LOCKED** v1.1 — map BD-06/07 khi sync Plan |

---

*§A–§C PASS · §D PASS · §E PASS · E.7 Owner Accepted BD-00…08 (2026-07-29). Solution LOCKED. Plan/Code theo phase.*

