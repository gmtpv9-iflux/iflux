# SoT — iFlux Product Architecture

# Đây là tầng kiến trúc cao nhất

Đây là kiến trúc dùng để định nghĩa cấu trúc của toàn bộ sản phẩm iFlux\.

Nó là nguồn sự thật \(Source of Truth\) cho:

- Product Architecture

- Product Design

- UI Architecture

- Design System boundary

- Technical Architecture

Mọi tài liệu phía dưới đều phải tuân theo kiến trúc này\.

Nếu có xung đột, tài liệu cấp dưới phải sửa theo tài liệu này\.

---

# **Macro Architecture — Entity-centric (Knowledge Graph)**

iFlux tổ chức theo **Entity-centric Architecture**, KHÔNG phải Page-centric\.

Nguyên tắc cốt lõi:

- Mỗi **Entity** tồn tại **một lần duy nhất** với **một URL top-level** duy nhất\.

- **Page chỉ là điểm truy cập (entry point)** tới Entity — Page KHÔNG "sở hữu" Entity\.

- Thị trường, Cộng đồng, Dashboard, Search, AI, Alert, Notification… đều có thể mở tới cùng một Entity mà URL **không đổi**\.

- Quan hệ giữa các Entity là **Relationship** (không có cha–con), tạo thành **Knowledge Graph**\.

```Plain Text
                         Chủ đề
                            │
         Sector ─────  Community ───── Stock
                            │
                        Ecosystem
```

Hệ thống chia làm **ba tầng**:

## Experience Layer

Các Page trải nghiệm dành cho người dùng (entry points)\.

```Plain Text
/home         Nhà của tôi
/market       Thị trường
/flow         Dòng tiền
/community    Cộng đồng
/faq          FAQ
```

## Knowledge Layer

Các Entity dữ liệu dùng chung — **URL top-level**, không nằm dưới `/community/*`\.

```Plain Text
Stocks       /stocks            /stocks/:ticker
Sectors      /sectors           /sectors/:slug
Ecosystems   /ecosystems        /ecosystems/:slug
Chủ đề       /chu-de            /chu-de/:slug      (narrative entity — KHÔNG phải bài viết)
Community    /community/posts   /community/posts/:id   (bài viết cộng đồng)
             /community/authors/:username
```

**Phân tách bắt buộc Chủ đề vs Post:**

- `/chu-de/:slug` → **Chủ đề** (narrative thị trường: Đầu tư công, NIM ngân hàng…) — trang group `chu-de/` detail
- `/community/posts/:id` → **Community post** (bài viết do user đăng) — trang `community/Trạng thái Story.html` (file nội bộ; URL công khai `/community/posts`)
- KHÔNG dùng `/community/stories` cho post; legacy **301 → `/community/posts/`**
- KHÔNG còn `/community/tag` (filter rác); legacy **301 → `/chu-de/:slug`**
- Bài viết Cộng đồng chỉ gắn: **cổ phiếu · chủ đề · ngành · hệ sinh thái**

Quy ước slug: Sector = slug tên tiếng Việt không dấu (`/sectors/ngan-hang`); Ecosystem = code (`/ecosystems/vin`); Stock = ticker (`/stocks/SSI`); Chủ đề = slug (`/chu-de/dau-tu-cong`)\.

## Platform Layer

Hạ tầng tài khoản & tiện ích dùng xuyên suốt mọi trải nghiệm\.

```Plain Text
/account   /messages   /search   /watchlist   /alerts   /share
/pricing   /auth/login   /  (root redirect)   /settings …
```

## Hệ quả bắt buộc

- KHÔNG còn `/community/stocks`, `/community/sectors`, `/community/ecosystems`\. Các URL cũ **301** sang top-level entity\.
- `/community/stories/:ref` (bài viết cũ) **301 → `/community/posts/:ref`**\.
- `/stories` và `/stories/:slug` (cũ) **301 → `/chu-de`** / `/chu-de/:slug`\.
- `/community/tag/:slug` và `/community/topics/:slug` (cũ) **301 → `/chu-de/:slug`**\.
- Link entity qua `IfluxSeoUrl` — `chuDeHref` / `Trạng thái StoryEntityHref` (alias), `postHref` (bài viết), `stockHref`, `sectorHref`, `ecosystemHref`\.

- Admin ▸ Hệ thống ▸ Cài đặt Trang ▸ Sitemap hiển thị đúng ba tầng này\.

---

# **Product Hierarchy**

```Plain Text
Page
    ↓
App Shell
    ↓
Section
    ↓
Widget Catalog
        ├── Widget Template
        └── Widget Definition
    ↓
Component
        ├── Card
        └── Block
    ↓
Item
    ↓
Atom
```

Đây là hierarchy chính thức của toàn bộ sản phẩm\.

Không được tự ý thay đổi hierarchy nếu chưa cập nhật SoT\.

---

# **Vai trò của từng tầng**

## Page

Là một màn hình nghiệp vụ hoàn chỉnh\.

Ví dụ

- Nhà của tôi

- Thị trường

- Cộng đồng

- Dòng tiền

- Membership

- FAQ

- \.\.\.

Một Page được tạo thành từ:

- Bố cục: App Shell \-\> Section

- Đối tượng hiển thị: Các Widget\.

---

## App Shell

Là khung giao diện của một Page\.

Bao gồm:

- Header

- Sidebar

- Navigation

- Footer

- Bottom Navigation

- Main Content Area

- các vùng layout khác

App Shell chỉ chịu trách nhiệm bố cục\.

Không chứa nội dung nghiệp vụ\.

---

## Section

Section là các vùng logic bên trong App Shell\.

Ví dụ

- Hero

- Main Content

- Sidebar Area

- Footer Area

Section chỉ dùng để chia bố cục\.

Không đại diện cho nội dung nghiệp vụ\.

---

# Widget Catalog

Widget Catalog là nơi quản lý toàn bộ Widget của hệ thống\.

Widget Catalog gồm hai phần hoàn toàn khác nhau\.

## Widget Template

Widget Template định nghĩa cách hiển thị\.

Ví dụ

- Ranking

- Heatmap

- Chart

- Table

- KPI

- Timeline

- News Feed

Template chỉ mô tả cấu trúc hiển thị\.

Template không phải Widget\.

Template không chứa dữ liệu nghiệp vụ\.

---

## Widget Definition

Widget Definition định nghĩa một Widget cụ thể\.

Ví dụ

Top 10 Money Flow

sẽ định nghĩa

- datasource

- settings

- capabilities

- permissions

- layout metadata

- template sử dụng

Widget không tự render UI\.

Widget chỉ khai báo metadata và configuration\.

Widget luôn sử dụng một Widget Template để hiển thị\.

Quan hệ chính thức là

```Plain Text
Widget Definition
        │
        └── uses
                │
                ▼
        Widget Template
                │
                ▼
            Component
```

Không coi Widget là nơi chứa Component\.

---

# Component

Component là tầng UI\.

Component chỉ chịu trách nhiệm render giao diện\.

Component gồm

- Card

- Block

Component không chịu trách nhiệm:

- lấy dữ liệu

- xử lý business logic

- permission

- insight

- layout engine

---

# Item

Item là thành phần nhỏ hơn Component\.

Ví dụ

- Button

- Badge

- Label

- Row

- Avatar

- Tag

---

# Atom

Atom là đơn vị UI nhỏ nhất\.

Ví dụ

- Text

- Icon

- Input

- Divider

- Checkbox

---

# Widget Principles

Widget là content unit quan trọng nhất của toàn bộ iFlux\.

Widget chính là đơn vị tạo giá trị cốt lõi của nền tảng hiện tại và tương lai\.

Mọi tính năng của iFlux đều nên ưu tiên xây dựng xoay quanh Widget thay vì Page\.

---

# Widget Capabilities

Tất cả Widget đều có khả năng:

## Responsive Layout

Widget hỗ trợ cấu hình kích thước\.

Không sử dụng khái niệm:

- 1/4

- 1/3

- 1/2

làm chuẩn nội bộ\.

Chuẩn chính thức là Grid Span \(12\-column\)\.

Ví dụ

- span 3

- span 4

- span 6

- span 12

Các tỷ lệ truyền thống chỉ là cách diễn giải\.

---

## Movable

Widget có thể thay đổi vị trí\.

---

## Resizable

Widget có thể thay đổi kích thước trong giới hạn cho phép\.

---

## Export Insight

Mọi Widget đều có khả năng xuất thành Insight\.

Insight không phải Widget\.

Insight là kết quả được xuất từ Widget\.

Quan hệ chính thức:

```Plain Text
Widget

    ↓

Export

    ↓

Insight
```

Insight có thể được xuất dưới nhiều dạng:

- PNG

- Link

- Community Post

- AI Summary

- các định dạng khác trong tương lai

Export Insight là Capability, không phải Widget Type\.

---

# Widget Types

Widget có hai loại\.

## Shared Widget

Widget có thể được tái sử dụng ở nhiều Page khác nhau\.

Ví dụ

- Ranking

- Heatmap

- KPI

- Market Breadth

---

## Dedicated Widget

Widget chỉ tồn tại trên một Page nghiệp vụ cụ thể\.

Ví dụ

Trang Nhà của tôi

- Watchlist

Trang Cộng đồng

- News Feed

Trang Membership

- Affiliate

Dedicated Widget không nên dùng ngoài phạm vi được thiết kế\.

---

# Widget Customization

## User

User chỉ được tùy chỉnh Widget trên Page "Nhà của tôi"\.

Bao gồm:

- ẩn/hiện

- đổi vị trí

- thay đổi kích thước \(nếu Widget hỗ trợ\)

User không chỉnh cấu hình mặc định của hệ thống\.

---

## Admin

Admin được quản lý Widget trên tất cả các Page\.

Bao gồm:

- thêm

- xoá

- đổi vị trí

- cấu hình mặc định

Đối với trang Nhà của tôi:

Admin chỉ quản lý phiên bản mặc định\.

Sau khi User tự tùy chỉnh, cấu hình của User sẽ ghi đè \(override\) cấu hình mặc định\.

---

# Boundary với Design System

Đây là ranh giới chính thức\.

Product Architecture quản lý:

- Page

- App Shell

- Section

- Widget Catalog

- Widget

- Product Composition

Design System chỉ quản lý:

- Component

- Card

- Block

- Item

- Atom

- Design Tokens

- Foundation

Design System không sở hữu:

- Page

- App Shell

- Section

- Widget

Đây là ranh giới bắt buộc phải giữ\.

---

# Boundary với Technical Architecture

Widget không được trở thành nơi chứa toàn bộ logic hệ thống\.

**Widget là lớp định nghĩa \(declarative layer\), có nhiệm vụ mô tả một Widget và cấu hình của nó; Widget không chịu trách nhiệm trực tiếp cho việc render UI, truy xuất dữ liệu, xử lý business logic, phân quyền, bố cục hay xuất Insight\. Các trách nhiệm này thuộc về các engine hoặc service tương ứng\.**

Các trách nhiệm phải được tách riêng:

- Component chịu trách nhiệm render UI\.

- Data Provider chịu trách nhiệm lấy dữ liệu\.

- Layout Engine chịu trách nhiệm bố trí Widget\.

- Permission Engine chịu trách nhiệm kiểm tra quyền\.

- Insight Engine chịu trách nhiệm xuất Insight\.

- Business Logic xử lý nghiệp vụ\.

- Widget chỉ mô tả Widget và cấu hình của Widget\.

Việc tách ranh giới này nhằm đảm bảo hệ thống vẫn dễ bảo trì khi số lượng Widget tăng từ vài chục lên vài trăm\.

---

# **Runtime Blueprint — Kiến trúc tải & vòng đời tài nguyên của Page**

> Nghiệm thu từ **Pilot trang Cộng đồng** (2026‑07). Đây là **chuẩn chung cho MỌI Page** (Nhà của tôi, Thị trường, Dòng tiền, Cộng đồng…), KHÔNG mô tả riêng một trang.
>
> Tài liệu phân biệt rõ **Target** (kiến trúc đích) và **Current** (hiện trạng đã đạt tới đâu). Khi mở một Page mới chỉ cần yêu cầu: **"Áp dụng Runtime Blueprint"** — không tự nghĩ lại kiến trúc.

## 1. Thứ tự tải tài nguyên (Loading Order) — Target

```Plain Text
App Shell            (khung + boot nền tảng, dùng chung mọi Page)
    ↓
Header               (topnav / search / user menu)
    ↓
Page Structure       (tiêu đề, mô tả, khai báo Section + Widget Slot)
    ↓
Page Feature         (nội dung ĐẶC THÙ của Page: feed Tin tức, Chuyên gia…)
    ↓
    Widget Slots         (vị trí widget do Admin > Cài đặt trang quyết định)
    ↓
Widget Manifest      (mỗi Slot → JS + CSS + Data Requirement của Widget)
    ↓
Resource Orchestrator(nơi DUY NHẤT nạp JS/CSS + cấp Data)
    ↓
Store → Template → Render
```

Trách nhiệm & owner từng tầng:

| Tầng | Trách nhiệm | Owner |
|---|---|---|
| App Shell | Khung layout + boot nền tảng (router, auth, entitlements, header UI) | App Shell (dùng chung) |
| Header | Topnav, tìm kiếm, menu user, sync trạng thái | App Shell |
| Page Structure | Khai báo tiêu đề/mô tả + danh sách Section + Widget Slot | Page |
| Page Feature | Nội dung đặc thù của Page (feed, section nội dung) | Page |
| Widget Slot | Widget nào, ở vị trí nào, span bao nhiêu | Admin ▸ Cài đặt trang |
| Widget JS/CSS | Tài nguyên hiển thị của Widget | Widget Manifest |
| Widget Data | Dữ liệu Widget cần | Resource Orchestrator |
| Render | Vẽ UI | Component / Template |

## 2. Resource Ownership — mỗi tài nguyên MỘT owner duy nhất

| Resource | Owner (Target) | KHÔNG được quyết bởi | Hiện trạng Cộng đồng |
|---|---|---|---|
| Header | App Shell | Page | ✅ Đạt |
| Widget Slot | Admin ▸ Cài đặt trang | Composite/Page | 🔴 Còn hardcode trong composite (`SLOTS`) |
| JS Widget | Widget Manifest | Page | ✅ Đạt (giải qua catalog) |
| CSS Widget | Widget Manifest | Page | ✅ Đạt (market‑components.css rời Page) |
| Data Widget | Resource Orchestrator | Store | 🔴 Store còn tự fetch |
| Page Feature JS/CSS | Page | — | ✅ Đạt (feed do Page sở hữu — hợp lệ) |
| Template | Template | Business Logic | ✅ Đạt |

Mục tiêu: mỗi dòng chỉ có **một** owner. Cột cuối cho biết Community đã khớp Target tới đâu.

## 3. Cấu trúc CSS sau tối ưu

| Nhóm | Ví dụ | Chính sách tải | Owner |
|---|---|---|---|
| Foundation | color, radius, shadow, motion, z‑index, layout, typography, spacing, aliases, utilities | **Luôn tải** | Design System |
| Design System | components, atoms‑extensions, widget‑shell, block‑templates, tabler‑icons, fonts | **Luôn tải** | Design System |
| App Shell | app‑shell.css, onboarding.css | **Luôn tải** | App Shell |
| Page Feature CSS | community.css, watchlist.css (nút tim của feed) | **Theo Page** | Page |
| Widget CSS | market.css, market‑components.css | **Theo Widget** (qua Manifest) | Widget Manifest |

Nguyên tắc: **không CSS nào ở tầng Page mà thực chất phục vụ một Widget** — CSS của Widget phải đi theo Widget Manifest.

## 4. Cấu trúc JS sau tối ưu

| Nhóm | Ví dụ | Chính sách | Owner |
|---|---|---|---|
| Platform | platform‑boot, api‑bundle, auth | preload (App Shell boot) | App Shell |
| App Shell | platform‑layers‑widgets, entitlement‑catalog, plans‑store, entitlements, block‑paywall/gate, guest‑shell, iflux‑web‑ui | preload (App Shell boot, **song song 1 tầng**) | App Shell |
| Runtime | bootstrap, page‑runtime, shell‑boot, widget‑module‑catalog, legacy‑bridge, widget‑loader | runtime (ESM) | Runtime |
| Page Feature | community‑store/ui/page/daily‑feed, mock‑market, seo‑url, taxonomy… | preload theo Page (**song song theo tầng**) | Page |
| Widget Runtime | resolveWidgetRuntime, loadStyles/import | runtime | Runtime |
| Widget Module | market‑heatmap, squarified‑treemap, community‑trending, stock‑store… | **lazy** khi Widget mount | Widget Manifest |

## 5. Dependency Graph

```Plain Text
App Shell ──> Runtime ──> Page
                          │
        ┌─────────────────┼────────────────────┐
        ▼                 ▼                     ▼
   Page Feature      Widget Slots          Header (App Shell)
        │                 │
        │                 ▼
        │           Widget Manifest ──> Resource Orchestrator ──> JS / CSS / Data
        ▼                                                              │
      Store  <────────────────────────────────────────────────────────┘
        │
        ▼
    Template ──> Render
```

## 6. Resource Lifecycle — vòng đời một Widget (từ Admin → màn hình)

Chương mô tả **luồng vận hành**, bổ sung cho phần cấu trúc tĩnh ở trên.

```Plain Text
Admin
    ↓  cấu hình widget cho Page
Page Settings            (Slot: id + vị trí + span + config)
    ↓
Page Runtime             (đọc Page Settings)
    ↓
Resolve Widget Slots     (Slot nào bật/tắt theo entitlement)
    ↓
Resolve Manifest         (Slot → JS + CSS + Data Requirement)
    ↓
Load JS / CSS            (Orchestrator nạp, không phải Page)
    ↓
Resolve Data Requirement (Manifest khai dữ liệu Widget cần)
    ↓
Resource Orchestrator    (cấp data — nơi DUY NHẤT gọi API/nguồn)
    ↓
Store Hydrate            (nhận data, không tự đi fetch)
    ↓
Template Render          (vẽ UI, không chứa business logic)
```

Trách nhiệm từng bước:

- **Admin / Page Settings** — nguồn sự thật về "Widget nào xuất hiện ở đâu". Không ai khác được quyết Slot.
- **Page Runtime** — đọc Settings, dựng Structure, KHÔNG quyết JS/CSS/Data của Widget.
- **Widget Manifest** — nơi khai JS + CSS + **Data Requirement** của từng Widget.
- **Resource Orchestrator** — điểm **duy nhất** nạp tài nguyên và cấp dữ liệu (không để Page/Store/Widget tự nạp).
- **Store** — chỉ **hydrate** từ data được cấp; KHÔNG tự fetch.
- **Template** — chỉ render; KHÔNG chứa business logic.

## 7. Loading Rules (BẮT BUỘC — đã chứng minh bằng số)

1. **Script cùng tầng tải SONG SONG, giữ thứ tự thực thi bằng `script.async=false`.** Không `await` từng script khi chúng độc lập. (App Shell boot: 3 đợt → 1 đợt, span 1189ms → 737ms cache lạnh.)
2. **CSS dùng `<link>` song song, KHÔNG `@import` nối tiếp.** Chuỗi `@import` là waterfall chặn render → đội FCP. *(Điểm chưa xử: `iflux-admin-ui.css` còn 16 `@import` — hạng mục kế tiếp.)*
3. **JS/CSS của Widget đi qua Widget Manifest**, không hardcode ở Page.
4. **Page Feature (feed/section đặc thù) do Page sở hữu** — hợp lệ, không coi là "rác".
5. **Widget Module lazy** — nạp khi Widget mount, không preload cùng Page Feature.
6. **Không `loadScriptsSequential()` cho nhóm script độc lập** — chỉ tuần tự khi có phụ thuộc thực.

## 8. Những gì đã LOẠI BỎ (khỏi Cộng đồng — chuẩn cho trang sau)

- Hardcode URL JS/CSS của Widget ở tầng Page.
- Page preload JS của Widget không dùng.
- Page preload CSS của Widget (đã chuyển `market-components.css` về Widget Manifest).
- `loadScriptsSequential(27)` — thay bằng nạp song song theo tầng.
- CSS sai owner ở tầng Page.
- `ensureSequence` tuần tự cho App Shell boot — thay bằng `ensureParallel` 1 tầng.
- Widget Registry preload khỏi trang Cộng đồng.

## 9. Kiến trúc chuyển tiếp — Current vs Target

**✅ Đã đạt SoT:** Widget JS/CSS qua Manifest · CSS đúng owner · App Shell boot song song 1 tầng · Page Feature thuộc Page · Template không chứa logic.

**🟡 Chuyển tiếp (chấp nhận, sẽ refactor):** `legacy-bridge`/`loadScriptTiers` · Widget tự nạp JS dep · chưa có Orchestrator chung · Data Requirement chưa khai trong Manifest.

**🔴 Chưa đạt (cần làm để đạt 100% SoT):**
- Widget Slot chưa lấy từ Admin ▸ Cài đặt trang (còn hardcode `SLOTS`).
- Store còn tự fetch (chưa qua Orchestrator).
- Chưa có **Resource Orchestrator** thống nhất.
- **Page Composition mới tiêu thụ một phần (Partial Consumption)** — xem mục kế.

**Bug đỏ implementation:**
- ✅ ĐÃ FIX: `community-store` load trùng (đồng bộ URL plain).
- ✅ ĐÃ FIX: `/api/plans/runtime` gọi trùng 2 lần (bỏ URL origin thừa).
- ✏️ ĐÍNH CHÍNH: `/api/page-composition/community` **KHÔNG phải dead fetch** — đang điều khiển `span`. Xếp lại là *Partial Consumption* (🟡→🔴), không phải bug.

### Page Composition — mức tiêu thụ (Current vs Target)

Endpoint `/api/page-composition/:pageKey` trả về mỗi slot đầy đủ:
`id · title · section · position(order) · span · enabled(visibility) · locked · userCanOverride(permission) · config(runtime) · lazyModule · css`.

| Trang | Đang tiêu thụ | Ghi chú |
|---|---|---|
| Slot pages (Thị trường/Nhà) | **Full slot** (id, enabled, section, position, span, config, lazyModule, css qua `resolveApiManifest`+`enrichSlot`) | Đã đạt Target |
| Community (composite) | **Chỉ `id` + `span`** (Partial Consumption) | Slot list còn hardcode `SLOTS`; bỏ qua order/visibility/permission/config |

**Lộ trình Target cho Community (và mọi composite):** dựng `SLOTS` từ composition (id/section/position/span/enabled+permission/config) — cơ chế đã tồn tại ở slot pages, chỉ cần composite áp dụng. Hệ quả hiện tại của Partial Consumption: `config.source` của `WGT-MKT-006` do Admin đặt (`Trạng thái Story`) bị `SLOTS` hardcode ghi đè (`chu-de`).

## 10. Blueprint áp dụng cho Page mới — Checklist nghiệm thu

Khi mở/tối ưu một Page bất kỳ, phải chứng minh:

1. Page chỉ quản lý **Header (App Shell) + Page Structure + Page Feature + Widget Slot**.
2. Mọi **Widget** chỉ nạp khi: `Page Settings → Widget Manifest` (không hardcode).
3. **Không** còn `loadScriptsSequential` cho nhóm độc lập; script cùng tầng nạp song song (`async=false`).
4. **Không** preload Widget không dùng; Widget Module lazy khi mount.
5. **Không** CSS/JS của Widget nằm ở tầng Page.
6. App Shell boot nạp **song song 1 tầng**.
7. Có **bằng chứng Network + Dependency Graph** (before/after: số request, KB, waterfall), không nghiệm thu bằng lời.

Pilot chỉ được coi là thành công khi **vừa giảm tải tài nguyên, vừa tiến gần kiến trúc SoT** — không chỉ đổi cách import.

## 11. Nghiệm thu theo Phase (nhãn bắt buộc — tránh hiểu nhầm “PASS = xong hết”)

Chuỗi tư duy Product / Blueprint (thứ tự Ownership trước):

```text
Ownership (Composition → Manifest → Runtime → DOM, cùng Widget ID)
    ↓
Nơi hiển thị (Page / Slot / Section)
    ↓
Hình thức hiển thị (Template / DS)
    ↓
Hiển thị cái gì (Core Layer / Data — Target)
```

**Cấm** ghi nghiệm thu chung chung là `PASS Blueprint Resource Loading` khi mới xong một phase. Phải ghi **đủ phạm vi**:

| Nhãn nghiệm thu | Phạm vi | Gate chính |
|---|---|---|
| **PASS Blueprint Resource Loading – Phase A** | Current / Checklist §10: shell · bootstrap · lazy · không sequential độc lập · CSS/JS đúng tầng · App Shell 1 tầng · Network evidence | Không còn `loadScriptsSequential` cho nhóm độc lập trên page đã áp Blueprint; HTML không nhồi widget script |
| **PASS Blueprint Resource Loading – Phase B** | Ownership + Runtime Consumption | Bảng bắt buộc: Widget ID × API slot × Runtime load × DOM `data-widget-id` = khớp; Full Consumption trên page có composition (không Partial trừ Approved Exception) |
| **PASS Blueprint Resource Loading – Phase C** | Resource Hygiene | Duplicate JS/CSS · orphan/dead resource · unused manifest entry (pilot rồi mở rộng) |
| **PASS Blueprint Resource Loading – Target** | SoT §1–6 + §9 🔴 | Resource Orchestrator · Store hydrate-only · SPA/partial-nav lifecycle (khi có) |

Trạng thái hiện tại (2026‑07‑15): Phase A **chưa ký** (còn FAIL Community sequential). Phase B/C/Target = chưa bắt đầu nghiệm thu.

Thứ tự làm việc đã thống nhất:

1. **Vòng 1** — đóng FAIL Phase A (Community sequential + re-audit CDP).
2. **Vòng 2** — Phase B Ownership & Consumption (Market → Home → Community; entity composite giữ 🟡 đến khi có composition key).
3. **Vòng 3** — Phase C Hygiene (không block Phase A).
4. Target / Orchestrator / SPA lifecycle — Gap Register, không lẫn vào Phase A.

---

# Widget Governance — 4 Source of Truth

Áp dụng cho **toàn bộ Widget** (Đặc thù + Tùy chỉnh), không phụ thuộc trang. Governance ở **cấp Widget**, audit theo **vertical concern** (không theo Page). Mọi Widget phải bị điều khiển đồng thời bởi đúng **4 SoT** dưới đây; mỗi SoT có **một owner duy nhất**.

## WGS-01 — Permission (Phân quyền sử dụng)
- **Owner duy nhất:** `IfluxEntitlements` (engine). Admin (tier/block matrix + plans) cấp dữ liệu.
- **Trách nhiệm:** ai được xem Widget, điều kiện hiển thị.
- **Dependency Graph:** `Admin → IfluxEntitlements → Runtime/Composite/Widget (chỉ HỎI engine) → Render/Gate`.
- **Cấm:** Widget/Composite tự đọc `IfluxAuth.tier`, tự `isElite`, tự gate; fail-open (mở khi engine vắng). `registry.tier` chỉ là **metadata** đầu vào cho `canAccessWidget` (Admin `plan.blocks` phủ quyết), KHÔNG phải nơi tự quyết.

## WGS-02 — Layout (Cài đặt trang)
- **Owner duy nhất (Runtime Layout):** Admin ▸ Cài đặt trang → `page-composition` → Runtime (`widget-loader.applySpan`).
- **Trách nhiệm:** position, span, order, section của **Widget Runtime**.
- **Dependency Graph:** `Admin → page-composition → Runtime Layout → Widget Slot → Render`.
- **Cấm:** Composite tự quyết span (hardcode/fallback/inline), Manifest chứa span quyết định, Widget CSS redefine layout primitive dùng chung (vd `.ifx-dash-grid` chỉ `widget-shell.css` sở hữu).

### Layout Scope (phân biệt bắt buộc)
| Scope | Áp dụng cho | Owner | Điều kiện |
|---|---|---|---|
| **Runtime Layout** | Widget · Slot · Composition | **Admin** (WGS-02) | luôn |
| **Internal Layout** | Page Feature · Widget internal UI | **Feature** | Không redefine primitive dùng chung · không đổi ownership Runtime Layout · CSS tự-scope |

Chuyển từ Internal Layout sang Widget Runtime (nếu muốn) là **Architecture Evolution riêng**, KHÔNG thuộc Governance Remediation.

## WGS-03 — Template
- **Owner duy nhất (runtime):** Registry `renderAs` (metadata khai báo) → Runtime (`widget-renderers`) → `block-templates` render. Admin catalog L4 `TMP-*` là nguồn thiết kế.
- **Trách nhiệm:** giao diện, variant, card style, display mode.
- **Cấm:** Widget tự quyết template bằng if/else; Composite override (`renderHero/Compact/Premium/Default`); Manifest chứa `renderAs/variant/style`; fallback template khi Admin đã cấp.

## WGS-04 — Data (Core Layer / Layer 4)
- **Owner duy nhất:** Core Layer / Store → Runtime → Widget. Widget chỉ render ViewModel.
- **Trách nhiệm:** dữ liệu hiển thị, Business ViewModel, Data Source, Business Logic đã xử lý.
- **Cấm:** Widget gọi `fetch/axios/XHR/WebSocket` trực tiếp; Widget biết Data Source.
- *(Trạng thái hiện tại: Widget đọc qua Store/Global — Type A = 0. Core Layer thật chưa hình thành = Architecture Gap, xem Gap Register.)*

# Architectural Invariants (bất biến)

1. Widget không biết Permission.
2. Widget không biết Layout (Runtime).
3. Widget không biết Template.
4. Widget không biết Data Source.
5. Widget không biết Business Logic.
6. Widget chỉ render ViewModel do Runtime/Core cung cấp.
7. Composite không quyết định ownership của Widget (Permission/Layout/Template/Data).
8. Manifest không quyết định Governance.
9. Runtime chỉ thực thi SoT, không tạo SoT.

# Approved Architectural Exceptions

Ghi chính thức để **không bị audit nhầm thành vi phạm**:

| Exception | Phạm vi | Owner | Lý do |
|---|---|---|---|
| **Nhà của tôi — User Layout** | vị trí/kích thước Widget **Tùy chỉnh** trên Dashboard cá nhân | User (override Admin default) | User tùy biến Dashboard; Widget Đặc thù vẫn theo Admin |
| **Dòng tiền — Page Feature Internal Layout** (WGT-FLW-PAGE) | layout nội bộ board (tab · sidebar/main) | Page Feature | Board thiết kế sẵn; CSS tự-scope `.ifx-flow-*`; không chạm primitive/Slot/composition |

# Trạng thái Governance (đợt Remediation 2026-07-15)

| SoT | Kết quả | Type A đã fix |
|---|---|---|
| Permission | ✅ PASS (1 owner) | 6 (2 isElite→engine · eliteGate→registry.tier · 3 blockVisible fail-closed · dashboard picker→canAccessWidget) |
| Layout | ✅ PASS (1 owner) | 2 (community hardcode/fallback · `.ifx-dash-grid` redefine) |
| Template | ✅ PASS (1 owner) | 0 |
| Data | ✅ PASS (Type A = 0) | 0 (Core Layer = Type B) |

Nguyên tắc Remediation: chỉ **trả ownership về SoT / xóa owner thừa / xóa hardcode-decision / xóa fallback không hợp lệ**. KHÔNG thêm kiến trúc, bridge, adapter, wrapper, runtime, config, if/else che kiến trúc. Type B (Architecture Gap) chỉ ghi nhận (xem `Architecture Gap Register.md`), không remediation trong pha này.

# Governance Baseline — WG-1.0 (FROZEN)

Sau khi cả 4 SoT PASS **có bằng chứng kiểm chứng** (Governance Evidence Report — canvas `audit-widget-governance`), Widget Governance được **đóng băng** làm baseline chính thức:

| Trường | Giá trị |
|---|---|
| Version | **WG-1.0** |
| Date | 2026-07-15 |
| Widget Inventory (registry — verifiable) | **39** (37 catalog definition + 2 page component `WGT-PRF-*`) |
| Widget Modules | 14 (`widgets/*/index.js`) |
| Coverage | 100% |
| Type A | **0** |
| Type B | 7 (AG-001…AG-007 — Gap Register) |
| Approved Exception | 2 (Nhà của tôi User Layout · Dòng tiền Internal Layout) |
| SoT Owner Count | 4/4 = 1 owner |

**Quy tắc duy trì (CI Gate):** mọi Widget mới phải **PASS Governance Evidence Report** (chạy lại 4 nhóm Audit Commands: Permission · Layout · Template · Data) TRƯỚC khi merge. Nếu bất kỳ Negative-evidence > 0 → **FAIL → không merge**. Không cần audit lại toàn hệ thống — chỉ chạy lại Audit Commands.

**Chuỗi tài liệu Governance (4 lớp):** Baseline Discovery → Governance Remediation → Governance Evaluation → **Governance Evidence Report**. Đến WG-1.0, việc tối ưu tiếp theo là **Blueprint Resource Loading** (tối ưu tải tài nguyên theo trang), không còn xử lý ownership Widget.

---

