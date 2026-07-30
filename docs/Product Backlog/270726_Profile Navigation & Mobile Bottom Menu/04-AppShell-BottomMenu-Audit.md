# 04 — AppShell Bottom Menu Audit

**Date:** 2026-07-27  
**Status:** **PASS — Owner sign-off 2026-07-27**  
**Task:** Profile Navigation & Mobile Bottom Menu  
**Method:** Codebase read-only · grep · file trace  
**Scope:** User Web App Shell · mobile tabbar · profile `/tai-khoan`

---

## 1. Executive summary

| Câu hỏi | Verdict |
|---------|---------|
| Ai render Bottom Navigation? | **App Shell renderer** — `iflux-web-ui.js` → `initMobileTabbar()` |
| Có bao nhiêu implementation? | **1 host** (`#ifx-mobile-tabbar`) · **3 render modes** (primary / context / article) |
| Có reusable component? | **Có** — cùng DOM host + CSS `.ifx-mobile-tabbar*` + `renderPrimary` pattern |
| Home active theo route nào? | `IfluxAppShell.activePage()` → match pathname / `IfluxRoutes.detectRoute` |
| AppShell hay Page quyết định bottom menu? | **AppShell** — page không tạo bottom nav (trừ content slot article IX) |
| Dynamic menu support? | **Có một phần** — mode switch theo `getNavMode()` · **chưa** có account mode |
| Mobile breakpoint? | **`max-width: 1023.98px`** (`DRAWER_MAX = 1023.98` trong JS) |
| Desktop / Mobile shared code? | **Data shared** (`IfluxNavRegistry` + `IfluxAppShell`) · **renderers tách** (header desktop vs tabbar mobile) |

**Khuyến nghị:** **CÓ THỂ** mở rộng host hiện tại cho Account menu — **không** tạo bottom nav mới. Cần thêm Navigation Model `profileAccount` + mode `ACCOUNT` trước khi code Phase C.

---

## 2. Kiến trúc hiện tại

```text
IfluxNavRegistry (iflux-platform-boot.js)
  ├── primary[]     → Nhà · Thị trường · Cộng đồng · Dòng tiền · Gói cước
  ├── userHub[]     → Avatar drawer links (Timeline · Affiliate · Privacy · …)
  └── context{}     → Entity tabs (stock · sector · article …)

IfluxAppShell (resolver)
  ├── getPrimaryNav()
  ├── getUserHub()
  ├── getContextNav()
  ├── getNavMode()  → PRIMARY | CONTEXT
  └── activePage()  → dashboard | market | community | flow | pricing | ''

Renderers (consume only)
  ├── IfluxAppShellHeader.render()  → desktop .ifx-topnav-link
  └── IfluxWebUI.initMobileTabbar() → #ifx-mobile-tabbar
```

**Contract đã khóa trong code** (`iflux-platform-boot.js` L523–526):

> MỌI renderer CHỈ đọc Registry + AppShell. Cấm gọi thẳng Routes/Auth từ renderer.

---

## 3. Bottom Navigation — ai sở hữu?

### 3.1 Host DOM

| Item | Detail |
|------|--------|
| Element | `<nav id="ifx-mobile-tabbar" class="ifx-mobile-tabbar">` |
| Created by | `iflux-web-ui.js` → `initMobileTabbar()` nếu chưa có |
| Parent | `document.body` (fixed bottom) |
| CSS | `app-shell.css` — `@media (max-width: 1023.98px)` |
| Height token | `--ifx-tabbar-h: 72px` |
| Safe area | `env(safe-area-inset-bottom)` trên article mode + main padding |

**Kết luận:** Bottom nav **không** nằm trong page HTML tĩnh — **App Shell runtime** sở hữu.

### 3.2 Sync lifecycle

```text
shell-boot.js load IfluxWebUI
    → initMobileTabbar()
    → syncMobileTabbar()
resize / iflux-context-ready → syncMobileTabbar()
```

Comment trong `shell-boot.js` L213:

> Tabbar mobile dùng cùng getPrimaryNav — sync sau WebUI.

---

## 4. Ba mode bottom menu hiện có

| Mode | Trigger | `data-ifx-tabbar-mode` | Renderer fn | Data |
|------|---------|------------------------|-------------|------|
| **Primary** | Default app pages | *(none)* | `renderPrimary()` | `getPrimaryNav()` |
| **Context** | Entity detail + `[data-ec-tabs]` | `context` | `renderContext()` | `getContextNav()` |
| **Article** | `communityPost` context | `article` | `ensureArticleIxBottomSlot()` | Interaction Catalog mounts vào slot |

Logic branch (`iflux-web-ui.js` `syncMobileTabbar`):

```text
if comments page → hide tabbar
else if communityPost → article mode
else if CONTEXT + data-ec-tabs → context mode
else → primary mode (getPrimaryNav)
```

**Không có mode Account** — `/tai-khoan` rơi vào **primary** (bug/feature gap cho Phase C).

---

## 5. Trả lời 6 câu hỏi kiến trúc

### Q1 — Bottom Menu hiện tại do AppShell hay Home Page render?

**AppShell** (`iflux-web-ui.js`). Home page (`dashboard-engine`, widgets) **không** render bottom nav.

### Q2 — Active state tính theo route hay page id?

| Mode | Active rule |
|------|-------------|
| Primary | `IfluxAppShell.activePage()` — map pathname → key (`dashboard`, `market`, …) |
| Context | DOM `[data-ec-tabs] .active` · fallback index 0 |
| Article | Interaction action bar (like/share) — không phải route |
| Profile desktop tabs | `data-ix-profile-tab` + `.ix-tab-content.active` — **page-owned** |

**Account page:** `activePage()` **không** trả về account — profile tabs active **độc lập** với bottom menu.

### Q3 — Có reuse được component hiện tại không?

**Có.**

- Host: `#ifx-mobile-tabbar` ✅
- Item template: `tabbarItemHtml()` + `.ifx-mobile-tabbar__item` ✅
- Pattern: thêm `renderAccount()` song song `renderPrimary()` ✅
- CSS: mode attribute tương tự `context` / `article` ✅

**Không cần** component file mới nếu follow pattern hiện có.

### Q4 — Có cần BottomMenuProvider không?

**Không (khuyến nghị audit).**

Đã có equivalent:

- Data: `IfluxNavRegistry`
- State/API: `IfluxAppShell`
- Imperative sync: `IfluxWebUI.syncMobileTabbar()`

Thêm Provider = abstraction trùng — vi phạm tinh thần UR-001 / governance “không thêm khi trách nhiệm cũ còn”.

### Q5 — AppShell hiện đã support dynamic slot chưa?

**Có — theo mode switching**, không phải React-style slot API.

| Dynamic behavior | Supported |
|------------------|-----------|
| Swap items primary ↔ context | ✅ |
| Article IX content injection | ✅ `data-ifx-ix-article-bottom-root` |
| Account items swap | ❌ chưa — cần extend `syncMobileTabbar` |
| Page-provided menu config trực tiếp | ❌ — phải qua Registry/AppShell |

### Q6 — Desktop tab và Mobile bottom có thể cùng consume một Navigation Model?

**Có — đây là hướng đúng SoT**, hiện **chưa** implement cho profile.

| Nav set | Desktop consumer | Mobile consumer | Shared Registry? |
|---------|------------------|-----------------|------------------|
| Primary | `IfluxAppShellHeader` | `renderPrimary` | ✅ `primary[]` |
| Context entity | `[data-ec-tabs]` in-page | `renderContext` | ✅ `context{}` |
| **Profile account** | `.ix-profile-tabs` in `profile.html` | *(primary fallback)* | ❌ **hardcoded HTML** |

**Gap:** Profile tabs = **3rd declaration** (HTML + không sync mobile).

---

## 6. Profile / Account — hiện trạng riêng

### 6.1 Trang `/tai-khoan`

| Item | File |
|------|------|
| Route | `iflux-platform-boot.js` · `account: { public: '/tai-khoan', file: '.../profile.html' }` |
| Manifest | `pages/account.manifest.js` |
| Desktop tabs | `account/profile.html` L153–168 — **hardcoded** |
| Tab switch | `hub-page.js` (shared) · `profile-page.js` · `profile-my-page.js` per tab |

**Tabs hiện tại (own profile):**

| tab id | Label hiện tại | Phase B target |
|--------|----------------|----------------|
| `tab-timeline` | Timeline | Timeline |
| `tab-affiliate` | Affiliate | Affiliate |
| `tab-payment` | Tài khoản thanh toán | Liên kết thẻ |
| `tab-privacy` | Quyền riêng tư | Riêng tư |
| `tab-security` | Bảo mật | Mật khẩu |

### 6.2 Hub `/nha-cua-toi` (khác account page)

`account/profile-panels.html` — tab set **khác** (Dashboard · Timeline · Activity · Following · Messages · Affiliate · Account).

**Out of scope v1** — không trộn audit này với account page Phase C.

### 6.3 User Hub drawer (avatar menu)

`IfluxNavRegistry.userHub[]` — links riêng:

- Timeline → `/tai-khoan`
- Affiliate → `/account/affiliate`
- Quyền riêng tư / Tài khoản thanh toán / Đổi mật khẩu

**Label drift risk** với profile tabs — UserHub consume **Deferred** (Different IA) · SoT §5 · AC-NAV-01 áp dụng Desktop + Mobile only trong task này.

### 6.4 F5 — URL consistency (architecture debt)

| Pattern | Example |
|---------|---------|
| Public route | `/tai-khoan` |
| Legacy/file paths | `/account/affiliate` · `/account/privacy` · `/account/billing` |

**Severity:** LOW — architecture debt. **Không sửa** trong task · không downgrade thành INFO.

---

## 7. Desktop vs Mobile — code sharing

| Concern | Desktop | Mobile | Shared? |
|---------|---------|--------|---------|
| Primary nav data | Registry + AppShell | same | ✅ |
| Primary render | Header links | Tabbar items | ❌ renderer |
| Profile tabs | `.ix-profile-tabs` buttons | **none** (shows primary tabbar) | ❌ |
| Breakpoint | topnav drawer ≤1023.98px | tabbar visible ≤1023.98px | ✅ same breakpoint |
| CSS class system | `ix-profile-tab` | `ifx-mobile-tabbar__item` | ❌ different DS classes |

---

## 8. Implementation inventory

| # | Location | Role |
|---|----------|------|
| 1 | `iflux-platform-boot.js` | NavRegistry + AppShell |
| 2 | `iflux-web-ui.js` L1048–1221 | Mobile tabbar init + render |
| 3 | `app-shell.css` L825–1287 | Tabbar styles + safe-area |
| 4 | `shell-boot.js` L213–216 | Boot sync |
| 5 | `runtime/app-shell.js` | Layout sections · `bottomnav` chrome key (no render) |
| 6 | `account/profile.html` | Profile desktop tabs (page) |
| 7 | `hub-page.js` | Tab switch orchestration |

**Count:** 1 bottom nav implementation · 3 render modes · 0 duplicate `<nav>` hosts found.

---

## 9. Findings / gaps

| ID | Severity | Finding | Slice / disposition |
|----|----------|---------|---------------------|
| F1 | **HIGH** | `/tai-khoan` mobile shows **Primary** bottom menu, not account tabs | Fix Slice 3 |
| F2 | **MED** | Profile tabs hardcoded HTML — không qua Registry | Fix Slice 2 |
| F3 | **MED → PREREQ** | `activePage()` không nhận diện account route | **Slice 1** · SoT §6 |
| F4 | **LOW** | UserHub · Profile Tabs · Bottom — label drift risk (3 surfaces) | UserHub **Deferred** · Different IA · SoT §5 |
| F5 | **LOW** | Architecture debt — `userHub` href mix `/tai-khoan` và `/account/*` | **Out of scope** · document only |

---

## 10. Reuse verdict — Phase C

| Criterion | PASS? |
|-----------|-------|
| Single bottom host | ✅ |
| Extend mode without new nav | ✅ |
| Registry + AppShell pattern exists | ✅ |
| Page không cần render bottom chrome | ✅ |
| BottomMenuProvider required | ❌ No |

**Audit verdict:** **REUSE APPROVED** — extend `syncMobileTabbar` + Registry, không tạo bottom menu mới.

---

## 11. Owner decision gate

| Decision | Status |
|----------|--------|
| Phase A Discovery PASS | ✅ **Owner 2026-07-27** |
| Reuse bottom host (`#ifx-mobile-tabbar`) | ✅ Approved |
| Navigation Model pipeline (SoT P1) | ✅ Approved · [`02-SoT.md`](02-SoT.md) |
| AC-NAV-01 single model desktop + mobile | ✅ Approved · [`02-SoT.md`](02-SoT.md) §4 |
| AC-NAV-02 renderer NavigationItem[] only | ✅ Approved · [`02-SoT.md`](02-SoT.md) §4 |
| F3 → Slice 1 prerequisite | ✅ Approved |
| UserHub deferred (Different IA) | ✅ Approved |
| Implementation GO (vertical slice rev.3) | ✅ Approved · [`03-Implementation-Plan.md`](03-Implementation-Plan.md) |

**Owner sign-off Phase A:**

| Field | Value |
|-------|-------|
| Decision | **Phase A PASS — Discovery CLOSED** |
| Owner | Owner iFlux |
| Date | 2026-07-27 |
| Conditions | SoT rev.3 · F3 in Slice 1 · AC-NAV-02 · UserHub deferred |

**Implementation note:** Navigation **Model** (khái niệm) tách **Navigation Registry** (storage). Model id `accountProfile` + `currentNavigationModel()` → `NavigationItem[]` (SoT rev.3).

---

## 12. Evidence references (code)

| Topic | File · anchor |
|-------|----------------|
| NavRegistry primary/userHub | `iflux-platform-boot.js` L537–567 |
| getPrimaryNav / getNavMode | `iflux-platform-boot.js` L689–783 |
| initMobileTabbar | `iflux-web-ui.js` L1048–1221 |
| syncMobileTabbar branch | `iflux-web-ui.js` L1183–1211 |
| Tabbar CSS breakpoint | `app-shell.css` L849 · L1041 |
| Profile tabs HTML | `account/profile.html` L153–168 |

---

*Phase A deliverable — no code changes in this task step.*
