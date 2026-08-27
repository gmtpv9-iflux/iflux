# SoT — Canonical CSS Ownership & Scope Rules

## 1. Trạng thái

Tài liệu này là CSS Ownership SoT áp dụng cho Canonical iFlux Architecture.

Mọi CSS mới và mọi CSS được migration phải tuân thủ tài liệu này.

Nếu implementation hiện tại xung đột với Rules này:

→ Rules này là target canonical.

---

# 2. CSS ownership hierarchy

Canonical direction:

GLOBAL DESIGN SYSTEM
→ PLATFORM
→ MODULE / FEATURE
→ PAGE
→ WIDGET

Dependency chỉ đi từ trái sang phải.

Scope thấp được consume scope cao.

Scope cao KHÔNG được phụ thuộc scope thấp.

---

# 3. GLOBAL DESIGN SYSTEM

Owner:

`design_system/`

Global Design System chỉ được chứa CSS:

- generic;
- semantic;
- domain-independent;
- platform-independent;
- reusable;
- không biết business object;
- không biết Page cụ thể;
- không biết Widget cụ thể;
- không biết Admin/User Web/App.

Ví dụ hợp lệ:

- tokens;
- reset;
- fonts;
- semantic typography;
- spacing;
- container;
- grid;
- Button;
- Checkbox;
- Radio;
- Badge;
- Chip;
- Card;
- generic Table;
- generic Pagination;
- generic Tabs;
- generic Title primitive;
- generic Pattern composition.

Không hợp lệ:

- Admin Sidebar;
- Web Header;
- Mobile Bottom Navigation;
- Market stock style;
- Community post style;
- Subscription page style;
- Money Flow widget style;
- one-page fix.

---

# 4. PLATFORM

Owner:

`platform/admin/`
`platform/web/`
`platform/app/`

Platform CSS sở hữu cấu trúc dùng chung của đúng platform.

Ví dụ:

- Admin Header;
- Admin Sidebar;
- Admin AppShell;
- Web Header;
- Web Main Navigation;
- Web Mobile Bottom Navigation;
- AppBar;
- App Bottom Navigation;
- Drawer.

Platform được consume Global DS.

Global DS không được biết Platform.

---

# 5. MODULE / FEATURE

Owner:

`modules/<domain>/`
hoặc
`features/<feature>/`

Module CSS dùng cho business/domain UI có phạm vi nhiều Page nhưng không phải global.

Ví dụ:

- Market;
- Community;
- Subscription;
- Notification;
- Portfolio;
- Content.

Nếu selector/rule hiểu business domain thì mặc định không thuộc Global DS.

---

# 6. PAGE

Page CSS chỉ sở hữu:

- page-specific composition;
- page-specific arrangement;
- page-specific responsive layout;
- positioning chỉ có ý nghĩa trên page đó.

Page không được redefine canonical component.

Nếu Page cần capability reusable:

→ promote lên owner phù hợp.

Không giữ duplicate tại Page.

---

# 7. WIDGET

Widget là scope nhỏ nhất.

Widget tự sở hữu:

- widget-specific CSS;
- visualization;
- domain state;
- widget responsive behavior;
- internal layout.

Widget CSS không được leak ra page.

Widget không được redefine sibling Widget.

Widget không được promote vào Global DS chỉ vì xuất hiện trên nhiều Page.

---

# 8. Minimum Valid Scope Rule

Mọi CSS phải nằm tại:

> Phạm vi hẹp nhất mà vẫn đúng với responsibility thực tế.

Không dùng nguyên tắc:

> Dùng nhiều nơi thì đưa Global.

Phải xét semantic responsibility.

Ví dụ một font-size chỉ cần trong một Table Component:

→ Table CSS.

Một font-size chỉ cần một Widget:

→ Widget CSS.

Một spacing chỉ cần một Page:

→ Page CSS.

Không tạo Global utility để giải quyết một consumer cục bộ.

---

# 9. One Responsibility — One Owner

Một CSS responsibility chỉ có một canonical owner.

Cấm:

Global có A
+
Page copy A
+
Widget lại copy A.

Nếu chuyển owner:

MOVE
→ migrate consumer
→ verify
→ DELETE old source.

Không copy rồi giữ hai nơi.

---

# 10. Override Rule

Canonical direction cho phép:

Global
→ Platform
→ Module
→ Page
→ Widget

Nhưng việc scope thấp override scope cao là một AUDIT SIGNAL.

Không mặc định coi override là đúng.

Mỗi override phải được kiểm tra.

---

# 11. Owner Override Policy

OWNER RULE:

Trong quá trình normalization hiện tại, nếu phát hiện scope thấp override cùng property đã được scope cao định nghĩa thì mặc định:

→ REMOVE declaration ở scope thấp.

Ví dụ:

Global:

```css
h1 {
  font-size: var(--ifx-text-h1-size);
}
````

Page:

```css
.page-title h1 {
  font-size: 28px;
}
```

Normalization target:

```css
.page-title h1 {
}
```

hoặc nếu selector không cần tồn tại về responsibility thì DELETE selector.

HTML class/semantic structure được giữ nếu nó vẫn có vai trò ownership/composition.

Không cố đoán lại giá trị khác.

Owner sẽ bổ sung CSS cục bộ sau nếu thực sự có requirement.

Mục tiêu trong normalization:

> Loại bỏ override trước, không phát minh override mới.

---

# 12. Không tạo override để sửa override

Cấm:

Global A
→ Platform override B
→ Page override C
→ Widget override D.

Nếu phát hiện chain như vậy:

STOP.

Xác định canonical owner.

Xóa các lớp không cần thiết.

Không dùng thêm specificity để thắng cascade.

---

# 13. Specificity Rule

Không dùng:

* `!important`;
* ID selector để thắng Global;
* selector chain dài;
* duplicated class;
* artificial specificity;
* nested selector chỉ để override.

Nếu cần specificity cao hơn để sửa Global:

→ audit ownership trước.

---

# 14. Semantic HTML First

Foundation Typography sở hữu semantic HTML:

* h1;
* h2;
* h3;
* h4;
* h5;
* h6;
* p;
* strong;
* em;
* small;
* blockquote;
* lists;
* code;
* pre;
* caption/figcaption khi đúng semantics.

Không tạo class duplicate semantic HTML nếu không có visual responsibility độc lập.

---

# 15. Component Owns Its Internal Styling

Component phải tự sở hữu typography/layout nội bộ thuộc contract của Component.

Ví dụ:

Button size
→ Button CSS.

Table header/cell typography
→ Table CSS.

Không tạo:

`.ifx-typo-btn-*`
`.ifx-typo-table-*`

chỉ để Component phải compose thêm class.

Consumer API phải càng đơn giản càng tốt.

---

# 16. Global Utility Rule

Không xây utility framework tự phát trong Global DS.

Utility chỉ được tồn tại khi:

* generic thật;
* broad reuse;
* semantic responsibility rõ;
* không chỉ thay một declaration cho convenience.

Các dạng cần audit đặc biệt:

* font-size utility;
* font-weight utility;
* line-height utility;
* tracking utility;
* margin/padding utility;
* arbitrary width;
* one-property state helper.

Nếu Component có thể consume token trực tiếp:

→ ưu tiên Component CSS.

---

# 17. Pattern Rule

Pattern là composition.

Pattern được consume Global capabilities.

Pattern không được redefine Global capabilities.

Nếu một Pattern cần một reusable capability chưa có:

→ bổ sung ngược về đúng Foundation / Primitive / Component / Pattern owner.

Không chữa bằng CSS local.

---

# 18. Reference Pattern Rule

P6 References là consumer/test surface.

Reference có thể có CSS cục bộ cho page composition thật sự.

Nhưng:

* không redefine `.ifx-*`;
* không override canonical artifact để giống baseline;
* không chứa reusable capability;
* không tạo Design System thứ hai.

Nếu Reference cần override Global:

→ audit Global trước.

---

# 19. Local Placeholder Rule trong normalization hiện tại

Khi một local selector có semantic/ownership reason để tồn tại nhưng declarations hiện tại chỉ đang override Global:

Giữ:

* class trong HTML;
* selector tại đúng local owner.

Xóa declarations override.

Ví dụ:

```css
.my-page-title {
}
```

Đây là placeholder ownership có chủ đích trong giai đoạn normalization.

Owner sẽ tự bổ sung declaration sau nếu có requirement thực.

Không tự phát minh style thay thế.

---

# 20. Comment Header bắt buộc

Mọi CSS file phải có ownership header.

Global example:

```css
/**
 * iFlux CSS Ownership
 *
 * OWNER: GLOBAL DESIGN SYSTEM
 * LAYER: <Foundation | Primitive | Component | Pattern>
 * CAPABILITY: <name>
 *
 * SCOPE:
 * - Generic
 * - Semantic
 * - Domain-independent
 * - Platform-independent
 *
 * ALLOWED:
 * - <responsibilities>
 *
 * NOT ALLOWED:
 * - Platform-specific CSS
 * - Module/business CSS
 * - Page-specific CSS
 * - Widget-specific CSS
 * - one-off override
 *
 * DEPENDENCY:
 * Global DS → Platform → Module → Page → Widget
 *
 * OVERRIDE:
 * Local override của Global là audit signal.
 * Không thêm patch chain.
 */
```

Local file phải ghi đúng:

OWNER
SCOPE
RESOURCE/PAGE/WIDGET/MODULE.

---

# 21. Dead Code Rule

Không giữ:

* commented declarations;
* duplicate selector;
* stale aliases;
* unused compatibility CSS;
* legacy copy;
* selector vô nghĩa không có ownership.

Ngoại lệ duy nhất:

empty local selector được Owner yêu cầu giữ làm ownership placeholder trong normalization hiện tại.

---

# 22. Consumer Count không quyết định Global

Consumer nhiều không tự động làm CSS trở thành Global.

Phải xét:

* semantic;
* domain knowledge;
* ownership;
* reuse contract.

Widget dùng trên 20 Page vẫn là Widget.

---

# 23. Sandbox Rule

Sandbox là consumer.

`sandbox/**/*.css` không được định nghĩa canonical `.ifx-*`.

Sandbox chỉ được sở hữu `.sb-*` hoặc namespace tương đương cho:

* catalog;
* navigation;
* test harness;
* iframe;
* measurement;
* documentation chrome.

---

# 24. Canonical acceptance

Global DS chỉ PASS khi:

0 Platform CSS
0 Module CSS
0 Page CSS
0 Widget CSS
0 unresolved duplicate owner
0 unnecessary override chain
0 unknown ownership

Mỗi rule còn lại phải trả lời được:

> Tại sao rule này phải Global?

Nếu không trả lời được:

→ move/delete.
