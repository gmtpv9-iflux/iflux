# 03 — Affiliate Identity SoT vs Navigation Audit

**Date:** 2026-07-29  
**Constraint:** Audit only — **không sửa code** · **không vá Register** trong task này  
**Question Owner:** Affiliate Identity phải tồn tại ở đâu — **A** hay **B**?

---

## 0. Verdict

| | |
|--|--|
| **A** — Chỉ capture một lần rồi chuyển sang localStorage/cookie | **Không đúng** (nhầm **Attribution Context** với **Affiliate Public Identity / PNC**) |
| **B** — Luôn tồn tại trên URL suốt anonymous flow (landing → login → register → verify) | **Vi phạm SoT** — Exclusion Zone **cấm** prefix Owner trên bar |
| **SoT đúng** | **Identity (Owner) sống trong Navigation Context (Shell/PNC).** URL chỉ **biểu diễn** Owner trong **Application Zone**. Auth/OTP = Exclusion → bar **sạch**, Owner **persist off-URL**. |
| **Boundary sửa (nếu có lệch)** | **PNC + Shell URL Writer (B2/B3)** — **không** Register referral field |

---

## 1. Product SoT — hai capability (cấm gộp)

Nguồn khóa:

| Doc | Khóa |
|-----|------|
| [`03-SoT-Affiliate-Context-Contract.md`](../Affiliate%20Attribution%20Capability/03-SoT-Affiliate-Context-Contract.md) §6.1 | **Affiliate Context ≠ PNC** |
| [`01-Owner-Decisions-LOCK.md`](../Affiliate%20Attribution%20Capability/01-Owner-Decisions-LOCK.md) OD-AFF-03/04 | Attribution: capture first-touch · persist đến Identity Created |
| [`18-ADR-AFF-007…`](../../250726_Affiliate%20Public%20Identity%20%26%20Path%20Decorators/18-ADR-AFF-007-Personal-Navigation-Context.md) | Single URL Writer · Exclusion strip · Context persist |
| [`19-PNC-State-Transition-Matrix.md`](../../250726_Affiliate%20Public%20Identity%20%26%20Path%20Decorators/19-PNC-State-Transition-Matrix.md) INV-1 · INV-2 | App zone: bar == Owner (B3+) · **Exclusion: bar luôn sạch** |

```text
Affiliate Public Identity (Owner / PNC)
  · Mục đích: navigation UX · URL bar Application Zone
  · Home: NavigationContext.ownerPublicId (Shell store)
  · URL: decorate chỉ Application Zone

Affiliate Attribution Context (referral)
  · Mục đích: referred_by lúc Identity Created
  · Home: Context capability (persist — storage = implementation detail)
  · URL: chỉ là trigger capture (/IFL…) — không phải “Identity luôn trên bar”
```

### 1.1 Trả lời A / B

| Option | Kết luận |
|--------|----------|
| **A** | Mô tả gần **Attribution persist** (OD-AFF), **không** định nghĩa chỗ ở của **Affiliate Identity**. SoT Attribution còn nói rõ: contract **không** khóa cookie/LS. |
| **B** | **Sai SoT.** Matrix INV-2: vào `/dang-nhap` · `/dang-ky` · OTP · OAuth → address bar **không** có publicId; Owner **persist** trong Shell. |

**Công thức SoT (Identity):**

```text
Identity home     = Navigation Context (PNC)
URL Application   = /{ownerPublicId}{canonical}     ← B3 MUST
URL Exclusion     = canonical sạch (/dang-ky, …)    ← MUST · Owner vẫn trong PNC
```

---

## 2. Navigation audit — implementation hiện tại

### 2.1 Pipeline (đúng kiến trúc)

```text
/IFL… path
  → affiliate-resolver.resolve()     [parse + emit · CẤM mutate URL]
  → iflux-incoming-referrer
  → PncLifecycle.onIncomingReferrer
  → NavigationContext.create(Owner)  [sessionStorage iflux_pnc_domain_v1]
  → ShellUrlWriter.decorate()        [chỉ Application Zone]
```

| Module | Vai trò SoT | Evidence runtime |
|--------|-------------|------------------|
| `affiliate-resolver.js` | Capture path · emit · **không** URL mutate | Comment + `resolve()` |
| `navigation-context.js` | Owner store · `sessionStorage` · returnTo | `STORAGE_KEY = iflux_pnc_domain_v1` |
| `pnc-lifecycle.js` | create / transfer / logout | `onIncomingReferrer` · `onSessionEstablished` |
| `shell-url-writer.js` | `decorate` · `isApplicationZone` | Auth → **không** prepend |
| `iflux-routes.js` | `zone: 'auth'` cho dang-nhap/ky/otp | Exclusion |

### 2.2 Exclusion Zone — SoT vs code

| Check | SoT | Code | Vi phạm B? |
|-------|-----|------|------------|
| `/dang-nhap` · `/dang-ky` · `/xac-minh-otp` trên bar **không** `/IFL…` | MUST sạch | `isApplicationZone` → false → `decorate` = canonical | **Không** — đúng SoT, **bác B** |
| Owner còn sau khi vào auth | MUST persist PNC | sessionStorage PNC | Đúng hướng |
| Attribution cookie/CTX riêng | OD-AFF persist | `iflux_aff_context_v1` + cookie | Capability khác |

→ **Implementation Exclusion strip URL không vi phạm SoT Identity.**  
Yêu cầu “Identity luôn trên URL tới register” = **đòi hỏi sai SoT**, không phải gap cần vá Register.

### 2.3 Application Zone

| Check | SoT (B3+) | Code |
|-------|-----------|------|
| Bar / link == Owner khi context active | INV-1 B3 | `decorateCanonical` prepend khi `getOwnerPublicId()` |
| Consumer canonical-only | INV-5 | `IfluxHref` / Writer |

Lệch (nếu có) thuộc **Shell URL Writer / consumer bypass decorate** — **không** thuộc Register form.

### 2.4 Chỗ Register đang đọc (không phải Identity home)

```text
/dang-ky referral field
  → getCodeForIdentityCreation() / readActive()
  → Affiliate Attribution Context (CTX · cookie · LS)
  → KHÔNG đọc NavigationContext.ownerPublicId
```

Đây là **Attribution consumer UI**, không phải “Affiliate Identity trên URL”.  
Vá thêm Register để “kéo Identity từ URL” trên Exclusion page = **sai boundary** (URL Exclusion cố ý sạch; Identity ở PNC).

---

## 3. Có vi phạm SoT Identity không?

| Claim | Kết luận |
|-------|----------|
| Prod **vi phạm B** vì `/dang-ky` không có `/IFL…` trên bar? | **Không** — đúng INV-2 |
| Prod **vi phạm** vì Identity chỉ còn cookie attribution? | **Một phần nhầm khái niệm:** Attribution **được phép** persist storage; **Identity (Owner)** phải ở **PNC**. Hai store song song là SoT (§6.1 dual-read cấm gộp, không cấm hai capability). |
| Symptom “form mã owner khác” | Đã khóa ở pack Register audit: **Attribution first-touch / stale + UI lock** — **không** chứng minh Identity SoT đòi URL suốt auth |

### 3.1 Boundary đúng nếu còn lệch navigation

| Lệch quan sát | Boundary sửa | Cấm |
|---------------|--------------|-----|
| App zone bar/link mất Owner trong khi PNC còn | **B3 `ShellUrlWriter` / consumer `Routes`·`IfluxHref`** | Vá Register |
| PNC mất khi F5 / tab (sessionStorage) khác Attribution (localStorage 30d) | **B2 PNC lifetime / persist policy** (Owner quyết) — không phải Register | Ép URL lên `/dang-ky` |
| Form referral stale / lock nhầm | **Attribution UI boundary** (đã có Fix Plan path vs stale) — vẫn **không** đổi SoT Identity URL | Gộp PNC = Attribution |
| Đòi Identity trên URL login→register→verify | **Từ chối** — trái INV-2 | Implement B |

---

## 4. Fix direction (chỉ định hướng — không code)

1. **Không** implement option B.  
2. **Không** vá Register để “Identity luôn trên URL”.  
3. Giữ tách:
   - **PNC** = Affiliate Public Identity (nav)  
   - **Affiliate Context** = attribution tới Identity Created  
4. Mọi sửa nav Identity → **PNC Lifecycle + Shell URL Writer** (Application Zone).  
5. Mọi sửa mã referral trên form → **Attribution context predicate** (đã khóa riêng) — không rewrite Exclusion URL policy.

---

## 5. Owner one-liner

> **Affiliate Identity (Owner) = Navigation Context; URL chỉ mang Identity trong Application Zone. Exclusion (login/register/verify) bar sạch là đúng SoT — không phải bug. A và B đều sai framing. Đừng vá Register cho Identity URL.**

---

*Audit only. Liên kết: [02-Root-Cause-Locked…](02-Root-Cause-Locked-and-Fix-Plan.md) (Attribution UI) · ADR-AFF-007 · PNC Matrix INV-2.*
