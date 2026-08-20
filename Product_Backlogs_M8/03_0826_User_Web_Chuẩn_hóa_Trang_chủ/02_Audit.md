# Audit — Chuẩn hóa “Nhà của tôi” → “Trang chủ”


| Field        | Value                                                                  |
| ------------ | ---------------------------------------------------------------------- |
| Platform     | User Web · Admin · Database · Routing · SEO                            |
| Module       | User Web Page Identity                                                 |
| Task         | `03_0826_User_Web_Chuẩn_hóa_Trang_chủ`                                 |
| Tên tài liệu | `02_Audit.md`                                                          |
| Status       | **STOP implement** — inventory xong; nhiều SoT; landing live ≠ Request |
| Owner        | Requester + Product/Architecture Owner                                 |
| Parent       | `01_Request.md` (AD 2.1–2.8)                                           |
| Ngày đo      | 2026-08-20                                                             |


---

## 0. Kết luận

Page **“Nhà của tôi”** đã tồn tại. Không phải page mới.


| Lớp                | Giá trị live                                                |
| ------------------ | ----------------------------------------------------------- |
| Technical identity | Runtime `home` · Admin/SEO/publish `dashboard` (cùng page)  |
| Display name       | **Nhà của tôi** (nav, catalog, composition, SEO seed)       |
| Canonical User URL | `/nha-cua-toi`                                              |
| File / content     | `User_Web/home/` · widget host pageKey `home` / `dashboard` |
| Landing `/`        | `/cong-dong` (page `community`) — **không** phải page này   |


Request **làm được** nếu PRD khóa: **giữ** `home`/`dashboard`, chỉ đổi display + slug + landing; **không** đổi `market` / `community`.

**Không tự chọn** khi SoT lệch. Không implement.

```text
Request:  /  →  /trang-chu/   (page home)
Live+V2:  /  →  /cong-dong    (page community)
SEO crumb “Trang chủ” = /cong-dong  — trùng chữ với display mới
```

---

## 1. Current State — page “Nhà của tôi”

```text
dashboard  (Admin · SEO page_key · widget publish · user-data section)
    ↕ cùng page
home       (manifest · detectRoute · path-base · soft-navigation)
    ↓
Display: Nhà của tôi
URL:     /nha-cua-toi
File:    /User_Web/home/index.html
Auth:    appOnly (nav chỉ hiện khi login)
```

Content/widget: sidebar (hồ sơ/gói) + main dashboard (`WGT-HOME-DASH`). User layout override trong `IfluxUserStorage` / API section `dashboard`.

**Không** hoán với Thị trường (`market` `/thi-truong`) hay Cộng đồng (`community` `/cong-dong`).

---

## 2. Page Identity / Source of Truth

**Không có một SoT duy nhất** cho display + URL.


| Vai trò              | Nguồn đang sống                                                                                 | Có “Nhà của tôi” / `/nha-cua-toi`?                |
| -------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Product SoT V2       | Experience `/nha-cua-toi` Nhà của tôi · `/` → `/cong-dong`                                      | Có                                                |
| URL Architecture SoT | URL ≠ identity; identity English                                                                | Khớp `home`/`dashboard`                           |
| Manifest             | `pages/home.manifest.js` `pageKey: home` `path: /nha-cua-toi` title rỗng                        | Path có; title rỗng                               |
| Admin catalog        | `page-settings-catalog.js` `PAGE-DASH` key `dashboard` title Nhà của tôi slug `nha-cua-toi`     | **Có** — gần SoT Admin                            |
| Composition file     | `Admin_Design_system/data/page-composition.json` + `backend/scripts/data/page-composition.json` | title Nhà của tôi · path `/home` (lệch slug Việt) |
| Nav / routes         | `iflux-platform-boot.js` `ROUTES.home.public = /nha-cua-toi` label **Nhà của tôi**              | **Có**                                            |
| Route map lệch       | `iflux-routes.js` `root`/`landing` = `market`                                                   | Lệch boot + nginx                                 |
| SEO code             | `seo-contract.js` `dashboard → /nha-cua-toi`                                                    | Path có                                           |
| SEO DB               | `page_seo_configs.page_key = dashboard` seed title **Nhà của tôi | iFlux**                      | **Có** (DB)                                       |
| Publish              | `page_published_versions.page_key = dashboard`                                                  | Key English; artifact có thể có title             |


Consume: User Web runtime đọc catalog/API publish theo `dashboard`/`home`; nav đọc boot labels; SEO đọc `page_seo_configs` + `PAGE_KEY_TO_PATH`.

**DB không phải SoT duy nhất** của display. Catalog + boot + V2 + SEO seed **cùng** mang chuỗi “Nhà của tôi”.

---



## 3. Reference Inventory



### 3.1 User Web (AD 2.2)


| Surface               | Evidence                                                                                                                                                                |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display name          | Nav label `Nhà của tôi`; checkout/share “Về Nhà của tôi”; allowlist `label: Nhà của tôi`                                                                                |
| Navigation            | `iflux-platform-boot.js` item `key: dashboard` `route: home` `appOnly: true`                                                                                            |
| Placement / host      | Manifest widgets + PagePublished `dashboard`; `widget-registry` scope `dashboard`                                                                                       |
| Manifest              | `home.manifest.js`                                                                                                                                                      |
| Route / URL           | `ROUTES.home.public`; `path-base.js` `/nha-cua-toi` → `User_Web/home/`; `bootstrap.js` `/nha-cua-toi`|`/home` → `home`                                                  |
| Internal links        | Brand `href="/nha-cua-toi"` trên nhiều HTML (`home`, `faq`, `share`, `loyalty`, `stock`, `checkout`…); `loyalty-page` `/nha-cua-toi?tab=affiliate`; messages breadcrumb |
| Breadcrumb (page này) | Messages: “Nhà của tôi”. SEO HOME crumb **không** trỏ page này (xem §5)                                                                                                 |
| Canonical / metadata  | SEO path `/nha-cua-toi`; utility **noindex** (`dashboard` trong `UTILITY_NOINDEX_KEYS`)                                                                                 |




### 3.2 Admin (AD 2.3) — chỉ User Web page


| Surface   | Evidence                                                          |
| --------- | ----------------------------------------------------------------- |
| Page name | `PAGE-DASH` title Nhà của tôi                                     |
| Placement | `page-composition` key `dashboard`; widget `pages: ['dashboard']` |
| Registry  | `page-settings-catalog.js` order 1                                |
| Config    | PagePublished artifact theo `dashboard`                           |


**Không** đồng nhất với Admin module `/admin/thi-truong` hay `/admin/cong-dong`. Admin `tong-quan` → `dashboard` trong `iflux-admin-routes.js` là **Admin shell**, không phải User page.

### 3.3 Database (AD 2.4)


| Chỗ                                                 | Lưu “Nhà của tôi”?                                      | SoT?                                           |
| --------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| `page_seo_configs` (`dashboard`)                    | **Có** trong seed `seoTitle`                            | Một nguồn SEO, không phải identity             |
| `page_published_versions` / `page_current_versions` | Key = `dashboard`; title nếu có nằm trong JSON artifact | Placement/widget, không phải URL SoT           |
| User data section `dashboard`                       | Layout user — **không** phải display name               | **Data semantics** — **cấm đổi key** (Request) |
| Bảng “pages” tên Việt riêng                         | Không thấy bảng page-name riêng ngoài SEO + artifact    | —                                              |


Sửa display/URL **không** đòi đổi `page_key` / user-data section.

---



## 4. URL / Routing Inventory (AD 2.5)

**Canonical hiện tại:** `/nha-cua-toi` (không bắt buộc trailing slash trên nginx `location =`).


| Lớp                               | Hành vi                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Nginx (staging-app / newprod-app) | `location = /nha-cua-toi` → `User_Web/home/index.html`; SEO shell `pageKey=dashboard&path=/nha-cua-toi` |
| Redirect đã có                    | `/home` · `/home/` · `User_Web/home/index.html` · `hub.html` → **301** `/nha-cua-toi`                   |
| Chưa có                           | `/trang-chu`                                                                                            |
| App routing                       | `path-base`, `detectRoute`, `soft-navigation`, `ROUTES.home`                                            |
| `/` live                          | `User_Web/index.html` + nginx `/index.html` → **301** `/cong-dong`; `community` `landing: true`         |


Đổi landing theo Request = đổi **root mapping**, không đổi identity/content Cộng đồng. Vẫn **lệch SoT V2** (`/` → `/cong-dong`).

`iflux-routes.js` `landing = market`: lệch thứ ba — không phải SoT, không được im lặng chọn khi implement.

---



## 5. SEO / Sitemap (AD 2.6)


| Surface           | Hiện trạng                                   |
| ----------------- | -------------------------------------------- |
| Title seed        | `Nhà của tôi | iFlux` (`page_key=dashboard`) |
| Canonical code    | `https://iflux.vn/nha-cua-toi`               |
| Robots            | Utility **noindex**                          |
| OG                | Đi theo SEO platform / shell dashboard       |
| Sitemap static    | **Không** liệt `/nha-cua-toi` (khớp noindex) |
| Breadcrumb `HOME` | name **Trang chủ**, path `/cong-dong`        |


Request đổi display thành “Trang chủ” + URL `/trang-chu` **đụng chữ** với crumb HOME đang = Cộng đồng. Không đổi page Cộng đồng — nhưng PRD phải nói crumb/landing “Trang chủ” sau remap trỏ **page** `home` hay vẫn `/cong-dong`.

---



## 6. Dependency & Discrepancy (AD 2.7)


| Discrepancy | Chi tiết                                                                    |
| ----------- | --------------------------------------------------------------------------- |
| D1          | Request `/` → `/trang-chu/` vs SoT V2 + nginx + boot `/` **→** `/cong-dong` |
| D2          | SEO/UI “Trang chủ” hiện = `/cong-dong`, không phải Nhà của tôi              |
| D3          | Dual key `home` / `dashboard` — đã ổn định; không gộp thành key mới         |
| D4          | Composition path `/home` vs live `/nha-cua-toi`                             |
| D5          | `iflux-routes.js` landing = market vs mọi kênh khác = community             |
| D6          | Manifest title rỗng vs catalog/nav/SEO có “Nhà của tôi”                     |


Không tự chọn D1–D2. D3 giữ. D4–D6 ghi cho PRD (sửa representation `dashboard` khi đổi URL/tên — không mở page khác).

---



## 7. Scope Impact (AD 2.8)


| Request cấm đổi             | Audit                                                     |
| --------------------------- | --------------------------------------------------------- |
| Content page home           | **Không cần** nếu giữ folder + widgets + pageKey          |
| Widget / business logic     | **Không cần** đổi chức năng; chỉ path/label/SEO/nginx/nav |
| Data semantics              | **Giữ** `dashboard` (publish, user-data, widget `pages`)  |
| Thị trường identity/content | **Không cần** đụng `market` / `/thi-truong`               |
| Cộng đồng identity/content  | **Không cần** đổi page/feed/`/cong-dong/`*                |


**Dependency trong scope (bắt buộc để đạt Request):**

- Registry/nav/SEO/nginx/path-base/internal `href` của **page này**
- Landing `/` và flag `landing: true` (hiện trên `community`)
- 301 `/nha-cua-toi` → `/trang-chu` (URL SoT: không xóa route cũ nếu gãy link)

**Ngoài scope — chỉ hỏi Owner, không tự làm:** đổi SoT V2 Experience line; đổi crumb HOME; đổi sitemap policy noindex.

---



## 8. Khả năng thực hiện Business Request

**Có — có điều kiện PRD khóa D1 + D2.**

Cách đạt (HOW cho PRD, không phải lệnh code):

```text
Giữ pageKey home / dashboard
Đổi display → Trang chủ
Đổi public path → /trang-chu
301 /nha-cua-toi (và /home) → /trang-chu
/ → /trang-chu
Không đổi market, community, widget set, user-data key
```

Chưa khóa landing vs SoT V2 → **không implement**.

---



## 9. Câu hỏi Owner (PRD)

1. SoT V2 `/` → `/cong-dong`: **sửa V2 theo Request**, hay Request phải theo V2?
2. Chuỗi “Trang chủ” trên breadcrumb/SEO: chuyển sang page `home` `/trang-chu`, hay Cộng đồng vẫn là “Trang chủ” (hai nghĩa)?
3. Xác nhận giữ `home`/`dashboard`, không tạo pageKey `trang-chu`.

---



## 10. Đã đổi / không đổi


|           |                                                   |
| --------- | ------------------------------------------------- |
| Đã đổi    | **Không**                                         |
| Không đổi | App, Admin, DB, nginx, SEO, Thị trường, Cộng đồng |


---



## Traceability


| AD       | Mục   |
| -------- | ----- |
| 2.1      | §1–§2 |
| 2.2      | §3.1  |
| 2.3      | §3.2  |
| 2.4      | §3.3  |
| 2.5      | §4    |
| 2.6      | §5    |
| 2.7      | §6    |
| 2.8      | §7    |
| Output 8 | §8    |


