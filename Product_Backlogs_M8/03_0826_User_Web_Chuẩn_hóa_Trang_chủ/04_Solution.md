# 04_Solution — Chuẩn hóa “Nhà của tôi” → “Trang chủ”

| Field | Value |
|---|---|
| Platform | User Web · Admin · Database · Routing · SEO |
| Module | User Web Page Identity |
| Task | `03_0826_User_Web_Chuẩn_hóa_Trang_chủ` |
| Tên tài liệu | `04_Solution.md` |
| Status | **OWNER LOCKED — Solution** |
| Owner | Requester + Product/Architecture Owner |
| Parent | `03_PRD.md` (OWNER LOCKED) + `02_Audit.md` |
| Authority | `Governance_URL_Architecture.md` · SoT V2 Experience (đã sửa 2026-08-20) |

> **WHAT** = PRD. Tài liệu này chỉ **HOW**. Không đổi PR, không mở EN locale, không làm public/private content.

---

## 0. Quyết định kiến trúc

```text
GIỮ     pageKey home / dashboard · folder User_Web/home/ · widget host · user-data section
SỬA     display + public path + landing ownership của Root `/` + leftover resolve + SEO representation
KHÔNG   tạo page / route identity mới · không /admin/trang-chu/ · không đổi community/market
```

Một page. Nhiều representation. Sửa **từng authority đang sống** — không thêm registry song song.

SoT V2 Experience (`/trang-chu` · `/` → landing page này) **đã khóa**. Solution không sửa lại V2 trừ khi Plan thấy file bị revert.

---

## 1. CURRENT → TARGET

```text
CURRENT
  home / dashboard
       ↓
  Display  Nhà của tôi
  URL      /nha-cua-toi
  /        → /cong-dong   (landing owner = community)
  /home    → /nha-cua-toi (leftover)
  crumb HOME = Trang chủ → /cong-dong

TARGET (task này · VI)
  home / dashboard          ← cùng page
       ↓
  Display  Trang chủ
  URL      /trang-chu
  /        → home/dashboard → /trang-chu
  /nha-cua-toi → /trang-chu
  /home        → /trang-chu   (vẫn leftover; chưa phải EN)
  crumb HOME = Trang chủ → /trang-chu
  community    /cong-dong     không đổi identity
  market       /thi-truong    không đổi identity
```

```text
                    ┌─────────────────────┐
                    │  home / dashboard   │
                    │    SAME PAGE        │
                    └──────────┬──────────┘
                               │
                    Display: Trang chủ
                    File:    User_Web/home/
                    Widgets: không chuyển
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
         /trang-chu/          /               leftover
         canonical VI    301 → /trang-chu    /nha-cua-toi
                                             /home
```

---

## 2. Authority map (sửa chỗ nào)

PRD §2.6: sửa tại canonical của từng lớp. Không đụng generated nếu sinh từ registry.

| Lớp | Authority sống | HOW |
|---|---|---|
| Product SoT | `docs/SoT — iFlux Product Architecture (V2).md` | **Đã sửa.** Không revert. |
| URL Arch | `Governance_URL_Architecture.md` | Không sửa file. Tuân §2.1/§3/§5/§6. |
| Route SoT User Web | `User_Web/iflux-web-ui/iflux-platform-boot.js` (+ bản trùng nếu cùng authority) | Canonical public path `/trang-chu` · **landing ownership** của Root chuyển community → home · alias root/landing = home · nav Display Trang chủ · `/` detect = home |
| Route map lệch | `User_Web/iflux-web-ui/iflux-routes.js` | Đồng bộ cùng landing ownership + public path (D5). Không xóa file. |
| Slug map | `iflux-public-slugs.js` · `path-base.js` | Thêm `/trang-chu` → `User_Web/home/` · leftover `/nha-cua-toi` và `/home` → `/trang-chu` · `USER_PUBLIC['/']` đổi từ market → home (khớp landing mới) |
| Detect path | `runtime/bootstrap.js` · `runtime/soft-navigation.js` · regex path→`dashboard` trong boot | Nhận `/trang-chu` (+ leftover `/nha-cua-toi`/`/home`) → `home` |
| Manifest | `pages/home.manifest.js` | `path: /trang-chu` · `title`/`documentTitle` = Trang chủ (D6) · **giữ `pageKey: home`** |
| Admin catalog | `Admin_Design_system/app/system/page-settings-catalog.js` `PAGE-DASH` | title Trang chủ · slug/`path` `/trang-chu` · **giữ key `dashboard`** |
| Composition | `Admin_Design_system/data/page-composition.json` · `backend/scripts/data/page-composition.json` | Display Trang chủ · path = Canonical URL `/trang-chu` · **giữ `pageKey: dashboard`**. **D4:** đồng bộ Composition representation với Canonical URL mới — không đổi pageKey. |
| SEO code | `seo-contract.js` · `seo-platform.service.js` · `breadcrumb.js` | `dashboard → /trang-chu` · map path `/trang-chu` → `dashboard` · leftover `/nha-cua-toi` vẫn resolve `dashboard` · `HOME = { name: Trang chủ, path: /trang-chu }` |
| SEO DB | `page_seo_configs` `page_key = dashboard` | UPDATE representation (`seoTitle` Trang chủ). **Không đổi `page_key`.** Seed `055` đã apply — thêm migration UPDATE, không viết lại seed cũ. |
| Routing layer | Nginx snippets trong Git mà kênh deploy đang dùng (Staging + Production) | §4 — cùng strategy cả hai môi trường. Không ghi leftover Live bằng SSH. |
| Root document | `User_Web/index.html` | Root document resolve tới Canonical URL mới |
| Allowlist | `User_Web/data/iflux-staging-allowlist.json` | label Trang chủ |
| Onboarding | `iflux-onboarding.js` fallback · `onboarding.service.js` | title bước `target_key: home` → Trang chủ |
| Entitlement chip | `iflux-entitlements.js` `key: dashboard` | label Trang chủ · **giữ key** |

**Không sửa:** widget `pages: ['dashboard']` · user-data section `dashboard` · `User_Web/home/` folder · `UTILITY_NOINDEX` · sitemap static (không thêm `/trang-chu`) · Admin module `/admin/cong-dong` `/admin/thi-truong` · Admin `tong-quan` → `dashboard` shell.

### Authority Conflict Rule (GOV-06)

Nếu Implementation phát hiện một representation **không** thuộc Authority Map này nhưng ảnh hưởng cùng Page Identity `home` / `dashboard`:

```text
Không tự sửa
    ↓
Report Owner
    ↓
Chỉ mở rộng Authority Map khi Owner cập nhật PRD hoặc Solution
```

---

## 3. Canonical Landing Authority

`landing` là **authority quyết định alias Root (`/`) của User Web**.

Hôm nay landing owner = `community`:

```text
community = landing owner của Root
to(community) không canonical  →  /
Root / routing layer           →  /cong-dong
```

Nếu đổi Root `/` sang `/trang-chu` mà **community vẫn là landing owner**:

```text
to(community) → / → /trang-chu
```

Nav Cộng đồng gãy. **Cấm.**

### Ownership sau thay đổi

```text
home        = landing owner của Root
community   không còn landing owner
community   vẫn có canonical URL /cong-dong/
market      không nhận landing ownership
```

Root `/` resolve tới Page Identity `home` / `dashboard`, rồi ra Canonical URL `/trang-chu/`.

Link mới của page này dùng Canonical URL (hoặc route key + canonical) — không generate `/nha-cua-toi` (AC-09).

### Post-login — không đổi

Auth sau login gọi thẳng Community (`/cong-dong`), **không** lấy landing owner. Giữ nguyên. Không phải public/private task.

Return path khi user vào từ Root `/` hoặc `/guest`: resolve về Canonical URL của **home** (`/trang-chu`), không còn map sang Community.

`home` vẫn `auth` như hiện tại. Khách Root → Canonical Trang chủ → login (nội dung public = task sau).

---

## 4. Routing Layer Strategy

Routing layer phải đạt bốn outcome. Không phát minh redirect policy — dùng convention hiện hành của URL Architecture.

1. **Canonical** User Web URL của Page Identity là `/trang-chu/`. Location canonical kế thừa behavior của page hiện tại (cùng file `User_Web/home/`, cùng SEO `pageKey=dashboard`).
2. **Root `/`** resolve tới Canonical URL của Page Identity này.
3. **Legacy** (`/nha-cua-toi`, `/home`, và leftover cùng page đã Audit) tiếp tục resolve đúng Page Identity — không broken link. `/home` task này vẫn leftover, chưa phải canonical EN.
4. **Không** đổi routing ownership của Community hoặc Market.

Chi tiết từng location = Plan.

---

## 5. Internal Representation Strategy

Reconcile toàn bộ internal references được Audit xác định — theo nhóm authority. Không tạo helper mới. Không đụng tài liệu lịch sử.

| Nhóm | HOW |
|---|---|
| Navigation references | Display + route của page này → Trang chủ / `/trang-chu` |
| Brand / Home references | Trỏ Canonical URL mới (hoặc route key + canonical) |
| Deep links (`?tab=…`) | Cùng Canonical, giữ query |
| Breadcrumb references | Semantic User Web Home → Trang chủ / `/trang-chu` |
| User-facing copy có semantic Page Identity | Đổi tên page; không đụng copy không chỉ page này |
| Admin representation của User Web page | Catalog / copy mô tả **chính page này** |

Không thay đổi nội dung không mang semantic Page Identity này (comment nội bộ, Community Layer URL, FAQ không gọi page).

Danh sách file = Plan.

---

## 6. SEO / sitemap

```text
page_key dashboard          giữ
canonical path              /trang-chu
seoTitle                    Trang chủ | iFlux   (cùng công thức seed, chỉ đổi tên page)
HOME breadcrumb             /trang-chu
noindex                     giữ
sitemap static              không thêm /trang-chu
```

Map `/nha-cua-toi` → `dashboard` **giữ** để bot/leftover còn resolve đúng page.

---

## 7. Database

| Object | HOW |
|---|---|
| `page_seo_configs.page_key = dashboard` | UPDATE JSON representation |
| `page_published_versions` / `page_current_versions` | **Giữ key `dashboard`.** Title trong artifact: republish từ catalog/composition đã sửa, hoặc UPDATE JSON nếu artifact đang nhét “Nhà của tôi” / path cũ — không đổi key |
| User layout `dashboard` | **Không đụng** |

Không migration đổi schema. Không đổi data semantics.

---

## 8. Ngoài scope (cấm trong Solution này)

- Locale EN sống (`/home` canonical, hreflang, UI English)
- Public vs private content trên Trang chủ
- Đổi post-login sang home
- Đổi Community / Market / Community Layer
- Tạo `pageKey` / folder / Admin route `trang-chu`
- Index page đang noindex
- SSH leftover Live `/var/www/iflux/production` như kênh deploy

---

## 9. FR → HOW → AC

| FR | HOW | AC |
|---|---|---|
| FR-01 Display | catalog, nav, composition, entitlements, onboarding, SEO title | AC-02, AC-03 |
| FR-02 Canonical `/trang-chu/` | boot + slugs + manifest + nginx location mới | AC-03, AC-05 |
| FR-03 `/` → `/trang-chu/` | chuyển landing ownership + Routing Layer Strategy §4 | AC-04 |
| FR-04 Reconcile | authority map §2 + internal links §5 | AC-06–AC-13 |
| FR-05 Legacy | 301 `/nha-cua-toi` `/home` + map SEO leftover | AC-10 |
| FR-06 Preserve | không đổi folder/widget/key | AC-01, AC-05, AC-14–AC-16 |
| Community / Market | không sửa page đó | AC-17, AC-18 |
| Identity cuối | chứng minh cùng page | AC-20 |

---

## 10. Verify evidence (để Plan gắn)

| AC | Evidence tối thiểu |
|---|---|
| AC-01/05 | `pageKey`/`ROUTES.home`/`PAGE-DASH.dashboard` không thành `trang-chu` |
| AC-02 | Nav + catalog + composition không còn “Nhà của tôi” cho page này |
| AC-03/04 | GET `/trang-chu` 200 cùng HTML `User_Web/home/` · GET `/` 301 `/trang-chu` |
| AC-06 | Không có `/admin/trang-chu` · catalog vẫn `dashboard` |
| AC-07 | `page_seo_configs.page_key` + user-data section = `dashboard` |
| AC-08 | manifest + boot + catalog + composition cùng `Trang chủ` + `/trang-chu` |
| AC-09 | brand/loyalty/share không generate `/nha-cua-toi` |
| AC-10 | `/nha-cua-toi` và `/home` 301 `/trang-chu` · query `?ref=` giữ |
| AC-11 | canonical `/trang-chu` · noindex giữ |
| AC-12 | `breadcrumb.js` HOME path `/trang-chu` · không `/cong-dong` |
| AC-13 | sitemap không thêm URL mới; không còn `/nha-cua-toi` nếu từng có |
| AC-14–16 | folder `User_Web/home/` · widget id/host không đổi |
| AC-17/18 | `/cong-dong` `/thi-truong` identity/URL/content giữ |
| AC-19 | diff không có abstraction/page mới |
| AC-20 | sơ đồ §1 đúng trên Staging rồi Production (push GitHub → CI) |

---

## 11. Decision gate

Không còn câu hỏi Owner. Không implement từ file này.

Authority Conflict Rule (§2) áp dụng suốt Implementation. Verify = §10.
