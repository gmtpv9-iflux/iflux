# Phase 6 · Step 1 — Discovery Audit (AS-IS)  
## URL Representation Writer · BD-03

**Date:** 2026-07-30  
**Program:** Affiliate V2 Architecture Re-baseline  
**Phase:** 6 — URL Representation Writer (P0)  
**Step:** 1 Discovery Audit — ✅ **ACCEPT** 2026-07-30 (docs only · **không code**)  
**Opened after:** Phase 5 **PASS** — [`14b-Phase-05-Acceptance.md`](14b-Phase-05-Acceptance.md)  
**Neo Plan:** [`05-Plan.md`](05-Plan.md) §2 Execution Rule · Phase 6 · §3A Program End-to-End Business Verification Gate  
**Neo Solution:** [`04-Solution.md`](04-Solution.md) §5.3 · BR-11 · BR-17 · BD-03  
**Neo SoT:** [`02-SoT.md`](02-SoT.md) · Brief §8–§9  
**Evidence base:** [`00-Audit-Context.md`](00-Audit-Context.md) §D (R-URL-01 · R-URL-03 · R-OWN-01) + re-grep `User_Web` 2026-07-30  
**Owner Design Decisions:** §9 **P6-DQ-01=A · P6-DQ-02=B · P6-DQ-03=A · P6-DQ-04=C** — LOCKED  

**Gate tiếp:** Step 2 ✅ **PASS** — [`30`](30-Phase-06-Implementation-Design-URL-Representation-Writer.md) · **Step 3 Implementation được mở** (P6-API-01 · allowlist evidence-only đã khóa).

**§6A:** Phase 6 = contribution (preserve Owner trên link app sinh) · **không** = Pass §6A · **không** = Final Program PASS · **không** tuyên bố kênh phân phối hỗ trợ đầy đủ.

---

# 1. Scope Step 1 (Phase 6 only)

**Trong phạm vi**

| Concern | TO-BE (Solution / Plan) |
|---------|-------------------------|
| Một App URL Writer | Single decorate / navigate / replacePath decision |
| Preserve Owner trên link **cần duy trì Owner Context** | BD-03 · Brief §8–§9 |
| Product URL vẫn tồn tại | Không prefix Owner toàn cục |
| Auth exclusion AS-IS | Không còn là **luật Product** cho mọi link cần preserve (Plan AC) |
| Giảm direct `location.*` ngoài Writer | R-URL-01 · R-OWN-01 |

**Ngoài phạm vi Phase 6**

| Concern | Owner đúng |
|---------|------------|
| Share artifact / Guest Share | Phase 7 |
| Parse Owner URL hợp nhất | Phase 8 |
| Attribution ledger | Phase 9 |
| Identity Context contract | Phase 5 — **DONE** |
| Program E2E Share→IAB→… | **Program End-to-End Business Verification Gate** |

**Cấm ở Phase 6 Step 4 theo Plan:** không thay Gate Business; verification = **P6-V-B1…B5** (href/menu/widget Owner URL Active).

---

# 2. AS-IS Writer map (evidence)

```text
Caller (Routes / Href / UI)
        │
        ▼
IfluxHref.forCanonical(canonical)     ← thin facade
        │
        ▼
IfluxShellUrlWriter.decorate(input)   ← single decorate decision
        │
        ├─ normalizeCanonical (IfluxNormalizePath)
        ├─ isApplicationZone(path)?
        │     NO  → return Product/canonical (không prepend)
        │     YES → getOwnerPublicId() từ IfluxNavigationContext.getContext()
        │              no owner → canonical
        │              has owner → /{owner}{canonical}
        │
        ▼
navigate / replacePath / syncBarWithOwner  ← history hoặc location.*
```

**Owner read AS-IS:** Writer đọc **`IfluxNavigationContext.getContext().ownerPublicId`** — không gọi `IfluxIdentityContext.getActiveOwner()` trực tiếp.  
(Phase 5: NC = runtime projection của Identity Context — **hướng đúng** nếu mọi Active Owner transition đi qua NC; Discovery ghi nhận, Design xác nhận không dual Owner source.)

---

# 3. Ownership hiện tại (AS-IS)

| Concern | Module / API | Vai trò AS-IS | TO-BE Phase 6 |
|---------|--------------|---------------|---------------|
| Decorate decision | `runtime/shell-url-writer.js` `decorate` | **De-facto App Writer** | Giữ — chỉnh **policy** zone / preserve |
| Href facade | `runtime/iflux-href.js` `forCanonical` | Delegate → Writer | Keep |
| Routes | `iflux-routes.js` `to` / `href` | Gọi Href/Writer | Keep funnel |
| Zone policy | `isApplicationZone` + `IfluxRoutes.isAuthPage` / `zone===auth` | Auth / oauth / payment / logout → **không prepend** | **Rewrite rule** — không giữ “auth = never preserve” làm luật Product nếu Business cần Context |
| Owner input | `IfluxNavigationContext.getContext()` | Active Owner cho decorate | Align Identity Context projection (đã P5) |
| Direct URL write | Nhiều call-site `location.href` / `location.replace` | **Bypass Writer** (R-URL-01) | Inventory → migrate hoặc document exclusion có chủ đích |
| Share decorate | `share-action-store` | Path riêng (R-URL-02) | **Out → Phase 7** |

**Kết luận owner AS-IS:** Đã có **một** Shell URL Writer funnel cho phần lớn href qua `IfluxHref` / Routes. Gap chính = **zone policy (auth strip)** + **bypass `location.*`** + verify business href sau Login.

---

# 4. Evidence chi tiết

## 4.1 Writer API (file)

`User_Web/iflux-web-ui/runtime/shell-url-writer.js`

| API | Behavior |
|-----|----------|
| `decorate` | Prepend `/{owner}` khi `isApplicationZone` + có Owner |
| `navigate` | `location.replace` / `assign` URL đã decorate |
| `replacePath` | `history.replaceState` (ưu tiên) |
| `syncBarWithOwner` | Đồng bộ thanh địa chỉ với Active Owner (skip foreign Owner prefix) |
| `isApplicationZone` | Export — dùng nội bộ + callers |

## 4.2 Auth / zone exclusion (R-URL-03 · Plan AC conflict risk)

`isApplicationZone` trả **false** khi:

- `/api`, assets, Admin, absolute http(s)
- path khớp `/oauth|callback|payment|thanh-toan|logout`
- `IfluxRoutes.isAuthPage(path)` hoặc `detectRoute.zone === 'auth'`
- không match `APP_PUBLIC_PREFIXES` / zone app

**Hệ quả AS-IS:** link auth (đăng nhập / đăng ký / …) **không** mang Owner prefix qua Writer — dù Active Owner đang hiệu lực.

**Plan Phase 6 AC:** Auth exclusion AS-IS **không** còn là luật Product cho link **cần** preserve Owner Context.

→ Gap **P6-G01** (policy).

## 4.3 Grep — Writer consumers (sample)

Callers `IfluxShellUrlWriter` / `IfluxHref.forCanonical` gồm (không hết):  
`iflux-routes.js` · `iflux-platform-boot.js` · `iflux-guest-shell.js` · `community-page.js` · `widget-renderers.js` · `watchlist-ui.js` · `pnc-lifecycle.js` (`syncBarWithOwner`) · `auth.js` · …

→ Funnel Href/Routes **đang dùng** — không thiếu Writer module.

## 4.4 Grep — direct `location.href` / `location.replace` (R-URL-01)

Mẫu ngoài Writer (cần phân loại ở Design):

| File | Pattern | Ghi chú Discovery |
|------|---------|-------------------|
| `auth-login-init.js` | `location.href = '/cong-dong'` | Post-login redirect — **có thể cần preserve** |
| `auth.js` | `location.href = 'verify-otp.html'` | Auth flow |
| `auth-social.js` | `location.href` / `history.replaceState` | OAuth / cleanup |
| `iflux-mail-deeplink.js` | `location.href` | Deeplink — Phase 12 concern? |
| `iflux-web-ui.js` · `loyalty-page.js` · `community-post-page.js` · `iflux-pricing-modal.js` | fallback `location.href = canonical` | Fallback khi thiếu Writer |
| `stock-comment-page.js` · `profile-view.js` | navigate fallback | Có nhánh Writer trước |
| `iflux-header-search.js` | `location.href = href` | Click search result |
| `loyalty-affiliate.js` | `location.href` | Affiliate UI |

→ Gap **P6-G02** (bypass inventory + remediation matrix).

## 4.5 `history.replaceState` ngoài Writer

| File | Note |
|------|------|
| `shell-url-writer.js` | Allowed (Writer owns) |
| `iflux-platform-boot.js` | Path normalize / strip? — Design audit |
| `auth-social.js` | Query cleanup |
| `profile-chat-page.js` · `hub-page.js` · `community-post-page.js` | Hash/path local |

→ Gap **P6-G03** (phân loại replaceState: Representation vs UI hash).

## 4.6 Identity Context vs Navigation Context (Owner source)

| Source | Dùng bởi Writer? |
|--------|------------------|
| `IfluxNavigationContext.getContext().ownerPublicId` | **Yes** (AS-IS) |
| `IfluxIdentityContext.getActiveOwner()` | **No** (direct) |

Phase 5 đã khóa consumers Register/Social/Auth → Identity Context. Writer vẫn qua NC.  
Nếu NC luôn mirror Active Owner sau P4/P5 → **OK**. Design phải chứng minh không dual Active Owner cho Representation.

→ Gap / Design Q **P6-DQ-01**.

---

# 5. Gap list

| ID | Severity | Gap | TO-BE | Scope |
|----|----------|-----|-------|-------|
| **P6-G01** | P0 | Auth/oauth/payment zone **không prepend** = luật cứng AS-IS | Policy: preserve Owner khi Business cần Context; Product URL khi flow yêu cầu Product | In |
| **P6-G02** | P0 | Direct `location.*` bypass Writer (R-URL-01) | Inventory · migrate qua Writer **hoặc** exclusion có chủ đích + lý do Business | In |
| **P6-G03** | P1 | `history.replaceState` ngoài Writer | Phân loại Representation vs hash UI | In |
| **P6-G04** | P1 | Post-login / post-auth redirect Product path (`/cong-dong`) | Restore Owner URL khi Business Flow yêu cầu (Plan AC — không đẻ BR OAuth) | In |
| **P6-G05** | P2 | Fallback `location.href = canonical` khi thiếu Writer | Fail-closed hoặc bắt buộc Writer trên shell pages | In |
| **P6-G06** | — | Share Guest / Share path | **Out → Phase 7** | Out |
| **P6-G07** | — | Program E2E / kênh FB·Zalo·QR | **Out → Program End-to-End Business Verification Gate** | Out |

---

# 6. Mapping → Solution / SoT / Risks

| Gap | Solution / Plan | Risk ID |
|-----|-----------------|---------|
| P6-G01 | §5.3 BD-03 · Plan AC (1)(2) | R-URL-03 |
| P6-G02 · G05 | R-URL-01 · R-OWN-01 · một Writer | R-URL-01 |
| P6-G04 | Plan AC (3) restore nếu Business Flow yêu cầu | — |
| P6-G06 | BR-12 Share ≠ App Writer | R-URL-02 |

---

# 7. File Inventory (candidates Step 2)

| File | Touch Phase 6? |
|------|----------------|
| `runtime/shell-url-writer.js` | **Yes** — zone policy / decorate rule |
| `runtime/iflux-href.js` | Maybe — thin; keep |
| `iflux-routes.js` | Maybe — `skipDecorate` / auth returns |
| `iflux-platform-boot.js` | Maybe — duplicate Routes + replaceState |
| `auth-login-init.js` · `auth.js` | Maybe — redirect preserve (minimal) |
| Call-sites `location.href` trong inventory G02 | Theo Design matrix |
| `share-action-store.js` | **No** (Phase 7) |
| `runtime/navigation-context.js` · `pnc-lifecycle.js` | Read-only / syncBar — không mở rộng Lifecycle write |

**§2.1 New File:** Mặc định **Modify Existing** Writer — **cấm** tạo `url-writer-v2.js` / parallel Writer.

---

# 8. Verification preview (không chạy Step 4 ở Step 1)

Plan **P6-V-B1…B5** (neo [`09`](09-Phase-04-Step4-Verification-Audit.md) §4 chuyển từ Phase 4):

- Login → link/menu/widget/href = Owner URL Active  
- Guest B → Login C → `/IFLC/…`  
- `querySelectorAll('a[href]')` sample  

Chi tiết AC Design ở Step 2.

---

# 9. Owner Design Decisions — **LOCKED** 2026-07-30

| ID | Quyết định | Lý do (Owner) |
|----|------------|---------------|
| **P6-DQ-01** | **A — Giữ Writer đọc Navigation Context (projection)** | Phase 5 đã khóa NC = runtime projection của Identity Context. Writer = tầng Representation — **không** đọc Authority / Identity Context trực tiếp. Tránh bypass projection và dependency mới. |
| **P6-DQ-02** | **B — Chỉ preserve qua cơ chế restore khi Business Flow yêu cầu; không mặc định prefix mọi Auth URL** | BD-03 yêu cầu preserve Owner Context, **không** yêu cầu mọi trang Auth mang Owner prefix. Cho phép redirect state / restore / cơ chế phù hợp — miễn không mất Context. **Không** đẻ BR “Auth URL phải có prefix”. |
| **P6-DQ-03** | **A — Có. Sau Login, nếu Active Owner Context còn hợp lệ thì Representation phải được restore** | Khớp BD-03 · BR-17. Login không được làm mất Owner Representation chỉ vì redirect `/cong-dong` → phải thành `/IFL{Active}/cong-dong` khi Context còn hiệu lực (không tạo Context mới). |
| **P6-DQ-04** | **C — Hybrid: migrate bypass P0 (application navigation); allowlist hẹp có chủ đích** | Migrate mọi bypass thuộc app navigation. Allowlist chỉ: external URL · OAuth callback · hash-only UI · browser API ngoài Writer responsibility — mỗi mục **bắt buộc** lý do kiến trúc trong Design. Cấm allowlist tùy tiện. |

### Layering khóa (P6-DQ-01)

```text
Identity Authority
        ↓
Identity Context
        ↓
Navigation Context (projection)
        ↓
Shell URL Writer
```

Writer **không** gọi `IfluxIdentityContext.getActiveOwner()` trực tiếp.

### Post-login Representation (P6-DQ-03)

```text
Owner URL B → Login → Community
  nếu chưa có Business Event đổi Owner
  → Representation = /IFLB/cong-dong
  ✗ không được /cong-dong (mất Representation của Active Owner)
```

**CG-030:** Đã chốt — Design Step 2 **map** các quyết định này; **không** suy diễn lại.

---

# 10. Step 1 Acceptance checklist

| Check | Status |
|-------|--------|
| Scope = Writer / BD-03 / không Share / không §6A Gate | ✅ |
| Evidence Writer API + zone policy | ✅ |
| Evidence R-URL-01 bypass sample | ✅ |
| Out of scope Phase 7 / Program Gate rõ | ✅ |
| Gap list + File inventory | ✅ |
| Design questions Owner LOCK | ✅ **P6-DQ-01…04** §9 |
| Không code | ✅ |

**Step 1:** ✅ **ACCEPT** (Owner Design Decisions LOCKED) → Step 2 Design [`30`](30-Phase-06-Implementation-Design-URL-Representation-Writer.md) **OPEN**.

---

*Phase 6 Step 1 Discovery · ACCEPT 2026-07-30 · P6-DQ-01=A · 02=B · 03=A · 04=C · Pass Phase ≠ Pass §6A*
