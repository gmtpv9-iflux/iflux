# Phase 4 · Step 4 — Verification Audit (TO-BE)

**Date:** 2026-07-29  
**Status:** ✅ **Phase 4 PASS** (Owner 2026-07-29) · Verification Plan ACCEPT · V-B7 ✅ · mở Phase 5  
**Phase 4 chính thức PASS** → [`09b-Phase-04-Acceptance-PASS.md`](09b-Phase-04-Acceptance-PASS.md) · Phase 5 Discovery [`10-Phase-05-Discovery-Audit-Identity-Context.md`](10-Phase-05-Discovery-Audit-Identity-Context.md)

---

## 0. Phân chia verify theo roadmap (khóa)

| Phase | Trách nhiệm | Business outcome được phép claim |
|-------|-------------|----------------------------------|
| **4 Lifecycle Authority** | Transition → **Active Owner** đúng | Hệ thống **biết** Owner hiện tại là ai |
| **5 Identity Context Projection** | Mọi capability **đọc** cùng Context | Consumers không dual-read Authority |
| **6 URL Representation Writer** | Sinh **Owner URL** khi cần duy trì context | Login → link/menu/widget = `/IFL{Self}/…` (BRD representation) |

```text
Sai (đã sửa):  Phase 4 FAIL vì href còn /cong-dong  →  đổ lỗi Writer lên Lifecycle
Đúng:          Phase 4 PASS khi Active Owner đúng mọi transition
               Phase 6 PASS khi Writer/Href sinh Owner URL đúng BRD
```

**BRD đầy đủ** ("login → mọi URL mang Owner của user") = claim sau **Phase 6 PASS** (+ Phase 4·5 nền). Không claim sớm ở Phase 4.

---

## 1. Static — Lifecycle — PASS

| Check | Evidence | Result |
|-------|----------|--------|
| replaceProjection mirror-only | `navigation-context.js` | ✅ |
| replaceGuestOwner trong Lifecycle | `pnc-lifecycle.js` | ✅ |
| BD-08 `isLoggedIn` skip | `onIncomingReferrer` | ✅ |
| BD-06 Guest last-wins | không first-touch lock | ✅ |
| Candidate ≠ Active Owner | Capture → Lifecycle | ✅ |
| History Guest re-parse pathname | `onPopState` | ✅ |

> Writer `getOwnerPublicId()` đọc Context = **evidence tiêu thụ sẵn có** — **không** dùng làm AC Phase 4; verify representation ở Phase 6.

---

## 2. Runtime — State machine (engineering)

**Đọc:** `IfluxNavigationContext.getContext()` → `ownerPublicId` + `state`.

| ID | Case | Expect | Runtime | Evidence |
|----|------|--------|---------|----------|
| V-T1 | Guest sạch → `/IFL{B}/…` | Active = B · guest | ☐ | |
| V-T2 | Guest A → `/IFL{B}/…` | Active = B | ☐ | |
| V-T2c | Guest A→…→E | Active = E | ☐ | |
| V-T3 | Guest B → Register | Active = Self | ☐ | |
| V-T4 | Guest B → Login A | Active = A · authenticated | ☐ | |
| V-T5 | Login A → `/IFL{B}/…` | Active = A | ☐ | |
| V-T6 | Logout | None | ☐ | |
| V-SM | Không Self→Guest / Self→Self(khác) vì URL | Không xảy ra | ☐ | |

---

## 3. Phase 4 — Business State Verification (Active Owner)

Verify **Business State** — không verify **Business Representation** (href/menu/widget).

| ID | Scenario | Expect (tự đọc được — không cần mở Design) | Runtime | Evidence |
|----|----------|---------------------------------------------|---------|----------|
| **V-B1** | Guest · mở `/IFL{B}/…` lần đầu | `getContext().ownerPublicId = B` · `state = guest` | ☐ | |
| **V-B2** | Guest đang A · mở `/IFL{B}/…` | `ownerPublicId = B` (không còn A) | ☐ | |
| **V-B2c** | Guest lần lượt A→B→C→D→E | `ownerPublicId = E` | ☐ | |
| **V-B3** | Guest đang B · **Login** (hoặc Register) thành C | `ownerPublicId = C` · `state = authenticated` | ☐ | |
| **V-B4** | Đã Login Self = A · mở `/IFL{B}/…` | `ownerPublicId = A` (không đổi thành B) | ☐ | |
| **V-B5** | Logout | `getContext() = null` | ☐ | |

### 3.1 V-B6 — History / Refresh / Deep link (ghi rõ expect)

| ID | Steps | Expect |
|----|-------|--------|
| **V-B6a** | Guest mở `/IFL{A}/…` → Active=A · rồi mở `/IFL{B}/…` → Active=B · **Browser Back** | URL lại A · **`ownerPublicId = A`** |
| **V-B6b** | Sau V-B6a · **Browser Forward** | URL lại B · **`ownerPublicId = B`** |
| **V-B6c** | Guest Active=B trên `/IFL{B}/…` · **Refresh (F5)** | **`ownerPublicId` vẫn = B** (không mất Active) |
| **V-B6d** | **Tab mới** / paste deep link `https://iflux.vn/IFL{B}/…` (không dùng tab cũ) | **`ownerPublicId = B`** (parse đúng Owner từ URL) |

| ID | Runtime | Evidence |
|----|---------|----------|
| V-B6a | ☐ | |
| V-B6b | ☐ | |
| V-B6c | ☐ | |
| V-B6d | ☐ | |

### 3.2 V-B7 — Write authority (Lifecycle Authority · không khóa tên module)

**Business Rule (SoT / BD-00 · khóa):**

> Chỉ **Lifecycle Authority** (Platform Identity Lifecycle) được phép thay đổi **Active Owner**.  
> Capability khác (Register · Share · Widget · Affiliate · Navigation page · Writer) chỉ **consume** — không mutate Active Owner.

**Không phải Business Rule:**

> “Chỉ file `pnc-lifecycle.js` được gọi `replaceProjection`.”

Đó là **implementation constraint / runtime evidence hiện tại**. Nếu sau này Architecture đổi thành:

```text
PlatformIdentityService (Lifecycle Authority)
        ↓
NavigationContext.replaceProjection
```

thì Business Rule **vẫn đúng**; caller hợp lệ đổi theo implementation — audit lại caller graph, không sửa BR.

---

**Runtime hiện tại (evidence — AS-IS 2026-07-29):**

Lifecycle Authority được hiện thực hóa bởi `IfluxPncLifecycle` (`pnc-lifecycle.js`).

| API mutate (NC) | Định nghĩa (export) | Caller hợp lệ **hiện tại** | Caller khác |
|-----------------|---------------------|----------------------------|-------------|
| `replaceProjection` | `navigation-context.js` → export | `pnc-lifecycle.js` (`replaceGuestOwner`) | **0** |
| `create` / `createContext` | `navigation-context.js` | `pnc-lifecycle.js` | **0** |
| `transfer` / `transferOwnership` | `navigation-context.js` | `pnc-lifecycle.js` | **0** |
| `deactivate` / `deactivateContext` | `navigation-context.js` | `pnc-lifecycle.js` | **0** |

| Lifecycle entry (hiện tại) | Source hợp lệ |
|----------------------------|---------------|
| `onIncomingReferrer` | Path Capture → `pnc-shell-bridge.js` |
| `onSessionEstablished` | Auth → `auth.js` |
| `onLogout` | Auth → `auth.js` |

**Grep (re-audit khi đổi facade Lifecycle):**

```text
rg "replaceProjection" User_Web --glob '*.js'
```

| ID | Check | Result |
|----|-------|--------|
| **V-B7** | **BR:** chỉ Lifecycle Authority mutate Active Owner · **Evidence hiện tại:** sole NC-mutate caller = `pnc-lifecycle` (0 foreign) | ✅ PASS evidence · re-run nếu rename/move Lifecycle module |

**Cấm (Business):** thêm mutate Active Owner ngoài Lifecycle Authority = FAIL shadow authority.  
**Cấm hiểu sai:** khóa vĩnh viễn tên file `pnc-lifecycle` như BR.

**Cách ghi evidence runtime (V-B1…B6):**

```text
V-B6a | URL=/IFLA… | getContext()={ ownerPublicId: IFLA…, state: guest } | ts=
```

**Không** yêu cầu `querySelectorAll('a[href]')` ở Phase 4.

---

## 3.3 Phase 4 được phép claim sau PASS

| Được khẳng định | Không được khẳng định (→ Phase 6 / sai hiểu) |
|-----------------|-----------------------------------------------|
| Một Active Owner duy nhất | Mọi link = `/IFLA/…` |
| Active đổi đúng Guest→Guest→Self→None | Menu / widget / breadcrumb / card URL |
| Không first-touch lock | Writer decorate đầy đủ |
| Logged-in Self không bị Owner URL khác ghi đè | — |
| **Lifecycle Authority** là write authority của Active Owner (**Business Rule**) | “Chỉ `pnc-lifecycle.js`” như Business Rule (sai — chỉ **evidence** runtime hiện tại) |

---
## 4. Chuyển sang Phase 6 — Business Representation Verification

Cụm verify **href · Writer · menu · card · breadcrumb · widget · link generation** (bản V-B1…B5 cũ kiểu “mọi link = `/IFLA/…`”) **không xóa** — **chuyển nguyên** sang Phase 6 Verification.

| ID (Phase 6) | Nội dung (ex-Phase-4 Writer matrix) |
|--------------|-------------------------------------|
| **P6-V-B1** | Login A → Community/Stock/Membership/FAQ/Article/Search → link app-zone = `/IFLA/…` |
| **P6-V-B2** | Guest B → Login C → navigation = `/IFLC/…` (không còn `/IFLB/…` trên link) |
| **P6-V-B3** | Click menu/card/breadcrumb/widget/internal → không mất Owner trên URL sinh ra |
| **P6-V-B4** | Không link nội bộ app sinh Product URL trần thay Owner URL khi đang Owner Context |
| **P6-V-B5** | `querySelectorAll('a[href]')` — không href sai Owner |

Neo Plan Phase 6 AC / Step 4 Verification khi mở Phase 6.

---

## 5. Phase 5 (nhắc — không verify ở đây)

Sau Phase 5: mọi capability (Register/Social/…) **đọc** cùng Identity Context — dual-read AR vs PNC đóng.  
Không gộp vào gate Phase 4.

---

## 6. Gate Phase 4 Acceptance

| Điều kiện | Status |
|-----------|--------|
| Step 3 code (Lifecycle only) | ✅ ACCEPT (tạm) |
| Static Lifecycle | ✅ |
| Runtime V-T* | ☐ |
| **Business State V-B1…B5 + V-B6a–d** (expect tường minh) | ☐ **blocker** |
| **V-B7 Write authority** | ✅ BR = Lifecycle Authority · Evidence AS-IS = `pnc-lifecycle` (không khóa tên file như BR) |
| Verification Plan (Reviewer) | ✅ **ACCEPT** |
| Owner/Reviewer Accept Phase 4 (sau runtime) | ☐ |

```text
Phase 4 Design / Verification Plan  ✅ ACCEPT
Phase 4 Runtime PASS                ⇔  V-T* ∧ V-B1…B6a–d ∧ V-B7 evidence
Mở Phase 5                          ⇔  Phase 4 Runtime PASS + Owner
```

Sau Phase 4 PASS chỉ được claim mục §3.3 (Active Owner + write authority) — **không** claim mọi link `/IFLA/…`.

---

## 7. Dual Authority / Shadow (Phase 4)

| Concern | Status |
|---------|--------|
| First-touch Guest | Removed |
| Self + Owner URL khác | BD-08 |
| Shadow NC mutate ngoài Lifecycle Authority | **V-B7** BR · evidence AS-IS `pnc-lifecycle` · không khóa tên module như BR |
| AR storage Authority | Phase 5 |
| Href / Writer gaps | **Phase 6** — không FAIL Phase 4 |

---

*Responsibility lock: Phase 4 = Active Owner + sole Lifecycle write · Phase 5 = Context consumers · Phase 6 = Owner URL representation*
