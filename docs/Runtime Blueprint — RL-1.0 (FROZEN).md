# Runtime Blueprint — RL-1.0 (FROZEN)

## 1. Mục tiêu

Runtime là tầng duy nhất chịu trách nhiệm chuyển đổi cấu hình đã Publish thành giao diện đang chạy.

Runtime **không quyết định**:

- Widget nào xuất hiện.
- Layout như thế nào.
- Permission của Widget.
- Business Logic.
- Data Source.
- Template.

Runtime chỉ **thực thi** các Source of Truth đã được Publish.

---

# 2. Runtime Pipeline

Pipeline chuẩn:

```text
Browser
    │
    ▼
App Shell
    │
    ▼
Page Registry
    │
    ▼
PagePublished
    │
    ▼
Placement Resolution
    │
    ▼
Runtime Host
    │
    ▼
Widget Host
    │
    ▼
Permission Engine
    │
    ▼
Resource Loader
    │
    ▼
Widget Manifest
    │
    ▼
Widget Runtime
    │
    ▼
Template
    │
    ▼
Design System Components
    │
    ▼
Render
```

Đây là pipeline duy nhất được phép tồn tại.

---



# 3. Ownership


| Khái niệm kiến trúc (SoT)            | Thuật ngữ trên Admin                                         | Owner                   | Thiết lập (Source of Truth)                                                         | Được consume bởi        |
| ------------------------------------ | ------------------------------------------------------------ | ----------------------- | ----------------------------------------------------------------------------------- | ----------------------- |
| **Page**                             | **Giao diện > Cài đặt trang → (Tab) Sitemap**                | App Shell               | `IfluxRoutes.ROUTES` (Page Registry)                                                | Router → Runtime        |
| **Route**                            | —                                                            | App Shell               | `IfluxRoutes.ROUTES`                                                                | App Shell               |
| **Placement**                        | **Giao diện > Cài đặt trang → (Tab) Bố cục trang**           | Admin                   | Admin → **Cài đặt trang → (Tab) Bố cục trang**                                      | **Publish Service**     |
| **Published Layout (PagePublished)** | (không có UI trực tiếp)                                      | Publish Service         | Publish từ Widget Placement                                                         | **Runtime Engine**      |
| **Region**                           | **Giao diện > Cài đặt trang → (Tab) Widget → Section**       | Admin                   | Trường **Section** trong Widget                                                     | Runtime Region Resolver |
| **Position**                         | **Giao diện > Cài đặt trang → (Tab) Widget → Pos**           | Admin                   | Trường **Pos** trong Widget                                                         | Runtime Layout          |
| **Grid Span**                        | **Giao diện > Cài đặt trang → (Tab) Widget → Span**          | Admin                   | Trường **Span** trong Widget                                                        | Runtime Layout          |
| **Placement Enabled**                | **Giao diện > Cài đặt trang → (Tab) Widget → Bật**           | Admin                   | Trường **Bật** trong Widget                                                         | Runtime Engine          |
| **User Layout Override Policy**      | **Giao diện > Cài đặt trang → (Tab) Widget → User Override** | Admin                   | Trường **User Override** trong Widget                                               | Runtime Engine          |
| **Widget Definition**                | Admin → **Kiến trúc 4 tầng → Tầng 4 (Widget)**    | Widget Definition Layer |                                                                                     | Widget Runtime          |
| **Widget Manifest**                  | —                                                            | Widget Runtime          | Widget package (Manifest JS/CSS/runtime dependency)                                 | Resource Loader         |
| **Widget Host**                      | —                                                            | Runtime                 | Không có màn hình cấu hình. Runtime tạo Host theo Region sau khi resolve Placement. | Widget Runtime          |
| **Template**                         | **Giao diện > Mẫu giao diện (Template Library)**             | Template Library        | Admin → Template Library                                                            | Template Renderer       |
| **Permission**                       | **Gói đăng ký → Phân quyền sử dụng**                         | Permission Engine       | Admin → Gói đăng ký → Phân quyền sử dụng                                            | Permission Engine       |
| **Widget Data**                    | **Kiến trúc 4 tầng → Tầng 4 (Widget)** **         | Core Layer              | Provider Registry (khai báo trong Core)                                             | Resource Loader         |
| **ViewModel**                        | —                                                            | Core Layer              | Sinh từ Business Logic của Core Layer (không cấu hình trong Admin)                  | Widget Runtime          |
| **Design Tokens**                    | **Giao diện > Design Tokens**                                | Design System           | Design Token Catalog                                                                | Template Renderer       |
| **Components**                       | —                                                            | Design System           | Component Library                                                                   | Template Renderer       |

Dữ liệu đầu vào của Widget: Hiện tại đang sử dụng Demo Data trong Widget Definition. Tương lai dữ liệu này sẽ được sinh từ Business Layer (Tầng 3 | Tầng 2 | Tầng 1)) sau.
---

# 4. Runtime Principles

Runtime chỉ được phép:

- đọc PagePublished
- resolve Placement
- mount Host
- kiểm Permission
- load Resource
- mount Widget
- render Template

Runtime không được phép:

- sửa Placement
- sửa Permission
- chọn Widget
- đổi Template
- tính Business Logic

---



# 5. Resource Loading

Resource được load theo Widget Runtime.

Không được preload toàn bộ hệ thống.

```
Widget A

↓

JS

↓

CSS

↓

Data Provider
```

Widget B không được load nếu không xuất hiện.

---



# 6. App Shell

App Shell chỉ chứa nền tảng dùng chung.

Bao gồm:

- Header
- Navigation
- Theme
- Runtime Core
- Router
- Resource Orchestrator
- Permission Engine

Không được chứa:

- Widget
- Business Feature
- Dashboard Logic
- Market Logic
- Community Logic

---



# 7. Widget Manifest

Widget Manifest chỉ mô tả Runtime Resource.

Ví dụ:

```text
widgetId

runtimeModule

css

dependencies

version
```

Không chứa:

- Business Formula
- Layout
- Permission
- Template

---



# 8. Widget Definition

Widget Definition là Source of Truth của Widget.

Bao gồm:

- Identity
- Outputs
- Formula Specification
- Template Reference

Runtime không được sửa Definition.

---



# 9. Placement

Placement là Source of Truth của bố cục.

Runtime chỉ consume.

Không được hardcode:

- sidebar widgets
- dashboard widgets
- community widgets

---



# 10. Resource Loader

Resource Loader chịu trách nhiệm:

- JS
- CSS
- Runtime Dependency
- Data Provider

Không được để Widget tự import chéo.

---



# 11. Data Pipeline

Pipeline chuẩn:

```
Provider

↓

Normalizer

↓

Core Layer

↓

ViewModel

↓

Runtime

↓

Widget
```

Widget không được:

- fetch API
- gọi SQL
- đọc Provider trực tiếp

---



# 12. Permission

Permission được resolve trước khi Widget mount.

Widget không tự kiểm quyền.

---



# 13. Template

Widget Runtime không render HTML trực tiếp.

Pipeline:

```
ViewModel

↓

Template

↓

Design System

↓

HTML
```

---



# 14. Isolation

Mỗi Widget là một Runtime độc lập.

Một Widget lỗi:

- không được crash Runtime
- không được crash Page
- không được crash Widget khác

Runtime phải:

- safe mount
- safe destroy
- safe error logging

---



# 15. Lazy Loading

Chỉ load Resource khi Widget xuất hiện trong Placement.

Không được:

- eager import Widget
- eager import CSS
- eager import API
- eager import Business Store

---



# 16. Global Runtime

Global chỉ được chứa:

- User
- Auth
- Theme
- Permission
- Runtime Config
- Event Bus

Không được chứa Business State.

---



# 17. Strict Rules

Cấm tuyệt đối:

- import toàn bộ Widget
- import toàn bộ CSS
- import toàn bộ API
- import toàn bộ Store
- Widget tự fetch API
- Widget tự quyết định Layout
- Widget tự chọn Template
- Widget tự kiểm Permission
- Runtime sửa Placement

---



# 18. Acceptance Criteria

Một Runtime đạt chuẩn khi:

- ✅ Runtime chỉ consume PagePublished.
- ✅ Placement là SoT duy nhất của Layout.
- ✅ Widget chỉ mount khi Placement yêu cầu.
- ✅ Resource chỉ load khi Widget được mount.
- ✅ Widget không biết Layout.
- ✅ Widget không biết Permission.
- ✅ Widget không biết Data Source.
- ✅ Widget không biết Business Formula.
- ✅ Widget chỉ render ViewModel.
- ✅ Một Widget lỗi không làm Page bị crash.
- ✅ Không còn bất kỳ hardcode Widget trên Page.

---



## Mình đề xuất bổ sung thêm một chương nữa: **Runtime Invariants (RL-001 → RL-010)**.

Đây sẽ là các bất biến ở cấp Runtime (tương tự WGS của Widget Governance), ví dụ:

- **RL-001:** Runtime chỉ consume, không quyết định.
- **RL-002:** Mỗi thành phần Runtime chỉ có một Owner.
- **RL-003:** Placement là nguồn duy nhất của Layout.
- **RL-004:** Widget chỉ render ViewModel.
- **RL-005:** Resource được load theo nhu cầu.
- **RL-006:** Runtime không chứa Business Logic.
- ...

Việc có bộ invariant riêng sẽ giúp mọi đợt audit hoặc refactor Runtime sau này đều có tiêu chuẩn PASS/FAIL rõ ràng, giống như cách WG-1.0 đã làm cho Widget Governance. Đây là bước hoàn thiện hợp lý sau toàn bộ các phase Governance, Ownership, Cleanup và Runtime Host mà bạn đã hoàn thành.