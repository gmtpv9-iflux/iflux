# Solution — Admin URL Architecture Wave 2

**Task:** `180826_Inprogress_Admin_URL_Architecture_Wave_2`
**Product:** iFlux
**Scope:** Admin S1
**Status:** **OWNER LOCKED — RECONCILED** (18/08 · C-01…C-05).  
**Plan:** `05` **OWNER LOCKED**. Implementation **AUTHORIZED** (18/08/2026).
**Predecessor:** `170826_Inprogress_URL Architecture Standardization` — CLOSED
**Date:** 18/08/2026
**Authority:** SoT `03` > BRD `01` > Solution này. Không tự sửa SoT.

---

# 1. Mục tiêu Solution

Wave 2 hoàn tất việc chuyển Admin S1 từ trạng thái:

```text
Page Identity
   ├── một phần dùng pathFor()
   └── phần lớn dùng PAGES.slug

Nginx
   ├── biết một phần Page
   └── trực tiếp rewrite phần lớn Page

Permission
   ├── PAGE_PERM
   └── HREF_PERM regex

Breadcrumb
   ├── trailFor()
   └── hardcode HTML
```

thành một architecture thống nhất:

```text
                    IA
                     │
                     ▼
              Page Identity
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       pathFor()  hrefFor()  trailFor()
          │          │          │
          └──────────┼──────────┘
                     ▼
             Canonical URL
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
      PAGE_PERM             Legacy 301
          │                     │
          └──────────┬──────────┘
                     ▼
                 Express
                     │
              Nginx = infra
```

**Một Page chỉ có một canonical identity và một canonical URL.**

---

# 2. Nguyên tắc Architecture LOCK

Wave 2 **kế thừa toàn bộ architecture của Wave 1**.

Không được tạo:

* registry thứ ba;
* URL engine thứ hai;
* permission engine thứ hai;
* Page Identity thứ hai;
* breadcrumb engine thứ hai;
* navigation writer thứ hai.

Các authority đã tồn tại tiếp tục là:

```text
IfluxAdminNavRegistry
        ↓
IA

IfluxAdminRoutes / PAGES
        ↓
Page Identity + legacy metadata

pathFor()
        ↓
Canonical URL

hrefFor()
        ↓
Navigation writer

trailFor()
        ↓
Breadcrumb writer

PAGE_PERM
        ↓
Identity permission

Express
        ↓
Canonical Page serving
```

---

# 3. Canonical URL Architecture

## 3.1 Owner quyết định

Wave 2 **không tái tạo URL tiếng Việt hiện tại**.

Wave 2 hoàn tất mục tiêu URL Architecture Standardization bằng cách chuyển Admin Page sang **canonical English URL**.

URL canonical được sinh từ **IA + Page Identity**, không lấy `PAGES.slug` hiện tại làm authority.

Mô hình:

```text
IA
 ├── Group
 ├── Parent
 └── Item
       ↓
Page Identity
       ↓
urlSegment
       ↓
pathFor()
       ↓
/admin/{module}/{page}
```

Trong đó:

* `module` là segment của functional module/parent;
* `page` là segment của Page;
* Group được dùng để tổ chức IA, **không tự động trở thành URL segment** nếu Page đã thuộc một Parent;
* Page không thuộc Parent có thể dùng functional Group làm module segment.

Độ sâu URL là **hệ quả IA** (BRD §12 · C-04). Không cố định 2 cấp. Không cấm 3 cấp.

```text
/admin/{module}/{page}
/admin/{module}/{parent}/{page}
```

đều hợp lệ nếu IA có parent/item tương ứng. Wave 1 `/admin/administrators/{leaf}` = 2 cấp vì group “Cài đặt hệ thống” **không** gắn segment — không vì rule “max 2”.

---

# 4. Quy tắc ánh xạ IA → URL

## 4.1 Có Parent

Ví dụ **IA thật** (group **Cài đặt hệ thống**, không phải “Quản lý người dùng”):

```text
Cài đặt hệ thống          ← group, không urlSegment (bảo vệ Wave 1)
└── Quản trị viên         ← parent urlSegment = administrators
    ├── Danh sách         ← list
    ├── Hồ sơ             ← profile
    ├── Vai trò           ← roles
    └── Phân quyền        ← permissions
```

Canonical (Wave 1 — không đổi):

```text
/admin/administrators/list
/admin/administrators/profile
/admin/administrators/roles
/admin/administrators/permissions
```

---

## 4.2 Không có Parent

Page sử dụng functional module tương ứng làm module segment.

Ví dụ:

```text
Quản lý thông báo
└── Danh sách thông báo
```

→

```text
/admin/notifications/push
```

Tương tự:

```text
/admin/orders/list
/admin/requests/partnership
/admin/analytics/users
```

## 4.3 Cách gắn `urlSegment` (pathFor hiện có — không đổi shape)

`pathFor` đã hỗ trợ `groupSeg + parentSeg + itemSeg`. Không thêm field/registry.

| Group IA | Gắn `urlSegment` trên group? | Lý do |
|---|---|---|
| Cài đặt hệ thống | **Không** | Wave 1 `/admin/administrators/*` không được thành `/admin/system/administrators/*` |
| Quản lý cộng đồng | **Không** | Cùng group có Page `community` và Page `topics` (SoT §11) |
| Quản lý người dùng | **Không** | Cùng group có `users` và `requests` |
| 1:1 với SoT (orders, subscriptions, membership, interface, notifications, market, data-operations, data, metadata, marketing, ai, analytics) | **Có** = SoT module | Item không parent: `/admin/{module}/{leaf}` |

Parent mang SoT module khi group không gắn segment (vd. `administrators`, `users`, `requests`, `community`, `topics`).

Item không parent trong group hỗn hợp: `urlSegment` = `{module}/{leaf}` (một string, pathFor hiện tại ghép sau `/admin/`) — không tạo field mới.

Studio `-2`…`-13`: **không** gắn `urlSegment`. Chỉ identity `system-ds-studio` + hash.

Không duy trì:

```text
/admin/thong-bao/...
/admin/don-hang/...
/admin/yeu-cau/...
```

như canonical URL.

---

# 5. URL vocabulary LOCK

Wave 2 sử dụng **English semantic vocabulary** làm canonical URL.

Khớp SoT §29 **duy nhất**. Không `products`. Không `loyalty`. Không `market-operations`. `subscription` (số ít) = **legacy**.

| Functional area | Canonical module |
| --- | --- |
| Dashboard | `overview` (`/admin/overview`) |
| Quản trị viên | `administrators` |
| Người dùng | `users` |
| Yêu cầu | `requests` |
| Đơn hàng | `orders` |
| Gói Hội viên | `subscriptions` |
| Promo / Membership | `membership` |
| Cộng đồng | `community` |
| Chủ đề / Câu chuyện | `topics` |
| Thị trường | `market` |
| Vận hành dữ liệu | `data-operations` |
| Dữ liệu | `data` |
| Thông báo | `notifications` |
| Giao diện | `interface` |
| Hệ thống | `system` |
| Metadata | `metadata` |
| Marketing | `marketing` |
| Trung tâm AI | `ai` |
| Phân tích | `analytics` |

### Quyết định G-06

**Quản lý giao diện = `interface`.**

Không tiếp tục nhét Design System Studio vào:

```text
/admin/system/...
```

Canonical:

```text
/admin/interface/...
```

Studio vẫn chỉ là **một Page Identity**:

```text
system-ds-studio
```

với hash region:

```text
/admin/interface/ds-studio#...
```

13 navigation region **không biến thành 13 Page Identity**.

---

# 6. Quyết định `chu-de` / `cau-chuyen`

Canonical semantic module là:

```text
topics
```

Không dùng:

```text
chu-de
cau-chuyen
story
```

làm canonical module.

Các URL legacy hiện tại có thể tồn tại dưới dạng 301:

```text
/admin/chu-de/...
/admin/cau-chuyen/...
/admin/story/...
```

nhưng chỉ redirect về canonical `topics`.

Mục tiêu:

```text
nhiều URL legacy
       ↓
      301
       ↓
một canonical Page URL
```

---

# 7. Page Identity

## 7.1 Một Page = một Identity

Ví dụ:

```text
system-admin-users
system-admin-list
```

không phải hai Page.

Một trong hai là canonical identity; cái còn lại là alias/legacy metadata.

Tương tự:

```text
subscription-transactions
orders-list
```

nếu cùng biểu diễn một Page thì không được tồn tại như hai canonical identities.

---

# 8. PAGES.slug thay đổi vai trò

Sau Wave 2:

```text
PAGES.slug
```

**không còn là URL authority.**

Authority là:

```text
Page Identity
     ↓
urlSegment
     ↓
pathFor()
```

`slug` chỉ được giữ trong migration/legacy metadata khi cần.

Không được viết thêm code mới theo pattern:

```js
PAGES[key].slug
```

để tạo canonical navigation URL.

Canonical writer phải đi qua:

```js
hrefFor(key)
```

và cuối cùng:

```js
pathFor(key)
```

---

# 9. Navigation Solution

Navigation tiếp tục dùng:

```text
hrefFor()
```

Không được hardcode URL Page trong sidebar.

Luồng chuẩn:

```text
IfluxAdminNavRegistry
        ↓
routeKey
        ↓
hrefFor(routeKey)
        ↓
pathFor(routeKey)
        ↓
canonical URL
```

Sau migration:

```text
hrefFor === canonical URL
```

cho toàn bộ Admin Page in-scope.

---

# 10. Breadcrumb Solution

Toàn bộ Page breadcrumb phải dùng:

```text
trailFor()
```

Không tiếp tục:

```html
<a href="/Admin_Design_system/hub.html">
```

hoặc:

```html
<a href="/admin/...">
```

hardcode cho Page navigation.

Chuẩn:

```text
Page Identity
     ↓
trailFor()
     ↓
dashboard + module + current page
```

Các Page HTML hiện đang hardcode:

```text
hub.html
```

phải được migrate.

`hub.html` chỉ còn là infrastructure/legacy surface nếu vẫn cần backward compatibility; không còn là breadcrumb authority.

---

# 11. Permission Solution

## 11.1 Identity là authority

Sau Wave 2:

```text
permForHref()
      ↓
matchPath()
      ↓
Page Identity
      ↓
PAGE_PERM
```

`HREF_PERM` không còn là canonical permission registry.

---

## 11.2 Migration strategy

Không xóa 87 regex cùng lúc.

Thực hiện:

```text
HREF_PERM
    ↓
classify
    ↓
identify consumer
    ↓
map Page Identity
    ↓
PAGE_PERM
    ↓
remove obsolete regex
```

Chỉ được REMOVE khi:

1. Page đã có canonical identity;
2. `PAGE_PERM` đã tồn tại;
3. toàn bộ active consumer đã sử dụng identity;
4. không còn legacy consumer cần regex;
5. test permission pass.

---

# 12. Alias / Legacy Identity

Các alias như:

```text
system-admin-users
data-sources-legacy
subscription-transactions
...
```

không được tạo Page Identity mới nếu chúng chỉ là alias.

Metadata phải phân biệt:

```text
canonical
alias
legacy
runtime-only
non-page
```

Nếu một alias thực sự là legacy URL:

```text
legacy URL
    ↓
301
    ↓
canonical URL
```

Không:

```text
legacy URL
    ↓
render Page riêng
```

---

# 13. Nginx Solution

Mục tiêu cuối:

```text
Nginx
  ↓
infrastructure / dispatcher
```

Không:

```text
Nginx
  ↓
Page registry
```

## 13.1 Giữ

* `/admin` entry;
* login infrastructure;
* static Admin assets;
* dispatcher;
* legacy redirects cần thiết;
* các rule infrastructure khác.

## 13.2 Loại bỏ dần

Các rule kiểu:

```text
/admin/goi-cuoc/...
/admin/thong-bao/...
/admin/thi-truong/...
```

không còn được dùng để trực tiếp serve Page.

Canonical:

```text
/admin/{module}/{page}
        ↓
Nginx dispatcher
        ↓
Express
        ↓
Page Identity
```

---

# 14. Legacy URL Migration

Mọi URL cũ phải có một trong ba trạng thái:

### A. Canonical

```text
200
```

### B. Legacy

```text
301 → canonical
```

### C. Dead

Không còn consumer và được chứng minh không cần compatibility.

Không tồn tại trạng thái:

```text
legacy URL
    ↓
200 Page riêng
```

nếu Page đó chỉ là alias của canonical Page.

---

# 15. Legacy redirect strategy

Ví dụ:

```text
/admin/goi-cuoc/entitlements
        ↓ 301
/admin/users/entitlements
```

hoặc canonical module tương ứng theo mapping Owner đã LOCK.

English legacy cũ cũng redirect về canonical. **`subscription` (số ít) = legacy; canonical module = `subscriptions`.**

```text
/admin/subscription/...
        ↓ 301
/admin/subscriptions/...   (hoặc users/entitlements nếu Page thuộc Users)
```

Vietnamese legacy:

```text
/admin/goi-cuoc/...
        ↓ 301
canonical
```

3-level Wave 1 legacy:

```text
/admin/system-settings/administrators/roles
        ↓ 301
/admin/administrators/roles
```

Mỗi legacy chain phải đạt:

```text
1 hop
```

Không:

```text
old
 ↓
VI
 ↓
EN
 ↓
canonical
```

---

# 16. Runtime query/state

Các query như:

```text
?plan=new
```

không được biến thành Page Identity.

Ví dụ:

```text
/admin/subscriptions/plan-edit?plan=new
```

vẫn là:

```text
Page Identity = subscription-plan-add
state = plan=new
```

Không đổi pageKey (C-05 · D-01). Không tạo identity `plan-edit` / `plan-new` chỉ vì query.

Query phải được giữ nguyên qua redirect nếu legacy URL có query:

```text
legacy?plan=new
        ↓ 301
canonical?plan=new
```

---

# 17. Dashboard và Login

Dashboard **PAGE** (SoT §12 · C-03):

```text
identity = dashboard-index
canonical = /admin/overview
```

`/admin` = INFRA entry:

```text
/admin → 302 → /admin/overview
```

Legacy (301, 1 hop):

```text
/admin/tong-quan → /admin/overview
/admin/dashboard → /admin/overview
```

Không giữ nginx exact `tong-quan` như Page registry sau khi Express serve `overview` đã PASS.

Login vẫn là:

```text
/admin/login
```

và thuộc **Auth Infrastructure**, không đưa vào Page inventory của Wave 2.

Legacy:

```text
/admin/dang-nhap
```

→

```text
301 /admin/login
```

---

# 18. Hướng dẫn

5 Hướng dẫn:

```text
/Admin_Design_system/*.html
```

được giữ là:

```text
NON-PAGE / documentation infrastructure
```

Không ép chúng vào:

```text
/admin/{module}/{page}
```

Không tạo `urlSegment` Page Identity cho chúng.

Permission riêng của documentation vẫn được xử lý theo classification của SoT.

---

# 19. Design System Studio

Giữ nguyên D-03.

```text
system-ds-studio
```

là **một identity**.

Canonical:

```text
/admin/interface/ds-studio
```

Hash **thực tế** (source / D-03 — không dùng ví dụ `#tokens`):

```text
#page-primitive-tokens
#page-foundations
#page-design-tokens
#page-icons
#page-charts
#page-atoms
#page-items
#page-blocks
#page-cards
#page-organisms
#page-sections
#page-business-objects
#page-user-flows
```

Canonical region:

```text
/admin/interface/ds-studio#page-cards
```

13 nav giữ. Không tạo 13 Page Identity.

---

# 20. PAGES cleanup

Không thực hiện destructive rewrite ngay.

Migration theo ba trạng thái:

```text
CANONICAL
LEGACY
RUNTIME
```

Các object key dư thừa phải được classify.

Ví dụ:

```text
alias
 ↓
legacy metadata
 ↓
canonical identity
```

Nếu một entry không còn consumer:

```text
prove dead
 ↓
remove
```

Không xóa chỉ vì nhìn thấy duplicate.

---

# 21. Implementation order

Implementation phải đi theo thứ tự này.

## Step 1 — URL vocabulary

Lock mapping:

```text
IA
 ↓
canonical module
 ↓
canonical page segment
```

Tạo migration matrix.

---

## Step 2 — Page Identity normalization

Classify toàn bộ PAGES:

```text
CANONICAL
ALIAS
LEGACY
RUNTIME
NON-PAGE
```

Đảm bảo một Page chỉ có một canonical identity.

---

## Step 3 — Attach `urlSegment`

Gắn `urlSegment` cho toàn bộ Page in-scope.

Không gắn cho:

* Login;
* documentation;
* non-page infrastructure;
* Studio hash regions.

---

## Step 4 — Expand `pathFor()`

`pathFor()` trở thành canonical URL authority cho toàn bộ Admin Page.

---

## Step 5 — Navigation migration

Xác nhận:

```text
sidebar
hub
widgets
cross-page links
```

đều dùng:

```text
hrefFor()
```

---

## Step 6 — Breadcrumb migration

Migrate toàn bộ hardcode breadcrumb:

```text
hub.html
hardcoded /admin/...
```

sang:

```text
trailFor()
```

---

## Step 7 — Permission migration

Migrate:

```text
HREF_PERM
```

→

```text
PAGE_PERM
```

theo từng identity.

---

## Step 8 — Nginx migration

Sau khi canonical Express routing đã chứng minh hoạt động:

```text
Nginx Page regex
        ↓
remove
```

chỉ từng nhóm đã chứng minh không còn consumer.

---

## Step 9 — Legacy redirects

Tất cả legacy URL:

```text
301 → canonical
```

và kiểm tra:

* 1 hop;
* query preserved;
* no redirect loop;
* no redirect chain.

---

## Step 10 — Dead-code cleanup

Cuối cùng mới xử lý:

* obsolete PAGES aliases;
* dead `HREF_PERM`;
* obsolete nginx Page rules;
* HTML redirect stubs;
* obsolete hardcoded href.

---

# 22. Không được làm

Agent **không được**:

* tạo URL registry mới;
* tạo `AdminUrlRegistry`;
* tạo permission registry mới;
* tạo breadcrumb registry mới;
* tạo `pathForV2`;
* tạo `hrefForV2`;
* tạo Page Identity thứ hai;
* dùng PAGES.slug làm canonical writer;
* tự đổi permission key;
* xóa toàn bộ HREF_PERM;
* xóa toàn bộ Nginx `/admin` rules;
* migrate User Web;
* migrate User App;
* sửa Production;
* sửa Staging 2;
* redesign UI;
* đổi file HTML chỉ vì đổi URL;
* tự quyết định lại vocabulary đã Owner LOCK.

---

# 23. Migration Matrix bắt buộc

Trước khi sửa code hàng loạt, phải tạo matrix:

| Identity | Current URL | Canonical URL | Legacy URLs | Permission | IA | Writer | Nginx | Status |
| -------- | ----------- | ------------- | ----------- | ---------- | -- | ------ | ----- | ------ |

Không implementation bulk nếu matrix chưa đầy đủ.

Đây là **control artifact** của Wave 2. Matrix: [`05_Implementation-Plan.md`](05_Implementation-Plan.md) §4 (REVISED).

---

# 24. Verification

Sau implementation phải kiểm chứng theo từng Page class.

## V1 — Identity

```text
1 Page
=
1 canonical identity
```

## V2 — Canonical URL

Canonical URL:

```text
200
```

và được serve bởi Express.

## V3 — Legacy

Mọi legacy URL:

```text
301
```

→ canonical trong **1 hop**.

## V4 — Navigation

Sidebar và cross-page navigation:

```text
hrefFor()
```

→ canonical.

## V5 — Breadcrumb

Không còn hardcoded Page breadcrumb.

## V6 — Permission

Canonical URL → correct `PAGE_PERM`.

Không phụ thuộc HREF regex đối với migrated Page.

## V7 — Nginx

Nginx không còn Page-specific serve rule cho Page đã migrated.

## V8 — Query

Query preserved qua 301.

## V9 — Studio

13 hash regions vẫn hoạt động với:

```text
1 identity
```

## V10 — Drift

Không xuất hiện:

* registry mới;
* engine mới;
* duplicate identity;
* User Web migration;
* architecture fork.

---

# 25. Definition of Done

Wave 2 chỉ được coi là COMPLETE khi:

```text
100% Admin Page in-scope
        ↓
Page Identity
        ↓
urlSegment
        ↓
pathFor()
```

và:

```text
Navigation → hrefFor()
Breadcrumb → trailFor()
Permission → PAGE_PERM
Serving → Express
Legacy → 301
Nginx → infrastructure
```

đồng thời:

```text
0 duplicate canonical identity
0 new URL architecture
0 new registry
0 Page-specific Nginx dependency
0 unclassified legacy Page
```

Các thành phần **INFRA / NON-PAGE / runtime state** được loại khỏi phép đo, không bị ép thành Page.

---

# 26. Owner Gate

Agent chỉ được bắt đầu implementation sau khi hoàn thành:

```text
BRD LOCKED       ✓
SoT LOCKED       ✓
Solution LOCKED  ✓
Migration Matrix ✓
```

Nếu trong quá trình lập matrix phát hiện:

* IA không đủ để xác định canonical URL;
* một Page có nhiều identity;
* permission semantics mâu thuẫn;
* một URL cần business decision;
* migration làm thay đổi business behavior;

→ **STOP và báo Owner.**

Không tự quyết định.

---

# 27. Owner Command cho Agent

> **Implement Wave 2 theo đúng BRD + SoT + Solution này.**
>
> Đây là một migration từ architecture hiện hữu sang architecture đã LOCK, không phải một cơ hội thiết kế architecture mới.
>
> Trước implementation bulk, hãy lập Migration Matrix đầy đủ cho toàn bộ Admin Page in-scope và self-audit các dependency của `PAGES.slug`, `HREF_PERM`, Nginx Page-specific rules, hardcoded breadcrumb/href và legacy stubs.
>
> Không tự chọn lại URL vocabulary, Page Identity, IA mapping, permission semantics hoặc scope.
>
> Không tạo registry/engine/convention thứ hai.
>
> Nếu phát hiện bất kỳ điểm nào mâu thuẫn với BRD/SoT/Solution hoặc cần một quyết định business/architecture chưa được khóa: **STOP và báo Owner.**
>
> Chỉ sau khi matrix và implementation plan phù hợp với Solution mới được tiến hành code.

---

# 28. Owner correction C-01…C-05 (18/08 — LOCK)

| ID | Quyết định |
|---|---|
| C-01 | Canonical = `data-operations`. Không `market-operations`. Legacy: `van-hanh-du-lieu`, `market-ops`. |
| C-02 | Không namespace `products` / `loyalty`. Gói = `subscriptions`. Promo + membership = `membership`. |
| C-03 | Dashboard = `/admin/overview`. `tong-quan` / `dashboard` = 301. |
| C-04 | Độ sâu = IA. Không cấm 3 cấp. |
| C-05 | Giữ pageKey. `subscription-plan-add` không đổi. |

Studio hash = 13 id source. `subscription` số ít = legacy.

---

## Owner conclusion

**Wave 2 không phải “làm tiếp Wave 1 bằng cách gắn thêm `urlSegment`.**

Nó là bước hoàn tất mô hình đã được Wave 1 chứng minh:

```text
                 OWNER
                   │
          BRD + SoT + Solution
                   │
                   ▼
              Page Identity
                   │
          ┌────────┼────────┐
          ▼        ▼        ▼
      URL/Path   Perm     Breadcrumb
          │        │        │
          └────────┼────────┘
                   ▼
                Admin
                   │
              IMPLEMENT
                   │
                   ▼
                VERIFY
```

**Đây là Solution Owner-level. Agent không có quyền thay đổi các quyết định trong tài liệu này.**
