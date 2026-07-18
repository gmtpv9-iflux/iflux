# Runtime Architecture Refactor – Lazy Page Runtime \(SoT\)

## Background

Hiện tại hệ thống iFlux đang có vấn đề nghiêm trọng:

- Boot process tải gần như toàn bộ JS/CSS của toàn hệ thống\.

- Các module Profile, Community, Dashboard, Stock, Chat\.\.\. đều được import ngay khi mở bất kỳ trang nào\.

- Widget Registry đang kéo theo implementation của widget\.

- Page chỉ hiển thị một phần nhỏ nhưng vẫn tải toàn bộ business logic\.

- Điều này gây:

    - Startup rất chậm\.

    - Browser memory tăng cao\.

    - Parse/Compile JS rất lớn\.

    - Dễ phát sinh race condition\.

    - Một module lỗi có thể làm toàn bộ website bị crash\.

    - Rất khó scale khi số lượng Widget tiếp tục tăng\.

Đây là kiến trúc sai và phải thay đổi\.

---

# Runtime Principle

Runtime phải hoạt động theo nguyên tắc:

```Plain Text
Browser

↓

Router

↓

App Shell

↓

Page Manifest

↓

Widget Loader

↓

Dynamic Import

↓

Render Widget
```

Không được phép:

```Plain Text
Boot

↓

Import toàn bộ module

↓

Module tự kiểm tra đang ở page nào

↓

if(location...)
```

Kiến trúc này bị cấm\.

---

# App Shell

Boot chỉ được phép load:

```Plain Text
Header

Navigation

Sidebar

Footer

Layout

Router
```

Không được phép load bất kỳ Widget nào\.

---

# Page Manifest

Mỗi Page phải có Manifest riêng\.

Ví dụ:

```Plain Text
dashboard.manifest.js

market.manifest.js

community.manifest.js

profile.manifest.js

stock.manifest.js
```

Manifest chỉ mô tả:

```Plain Text
Page

↓

Widget IDs

↓

Layout
```

Không chứa implementation\.

---

# Widget Registry

Widget Registry chỉ chứa metadata\.

Ví dụ:

```Plain Text
{
    id,
    category,
    title,
    permissions,
    requiredApis,
    lazyModule
}
```

Tuyệt đối không import widget implementation\.

Sai:

```Plain Text
import './heatmap.js'
import './watchlist.js'
```

Đúng:

```Plain Text
lazyModule:
"/widgets/heatmap/index.js"
```

---

# Dynamic Widget Loader

Sau khi Manifest được đọc:

```Plain Text
for widget of manifest.widgets

↓

import(widget.lazyModule)
```

Chỉ Widget được sử dụng mới được load\.

---

# CSS

Không được load:

```Plain Text
profile.css

community.css

chat.css

stock.css
```

cho tất cả page\.

Mỗi module chỉ được phép load CSS của chính nó\.

Ví dụ:

```Plain Text
Dashboard

↓

dashboard.css

market-summary.css

heatmap.css
```

---

# API

Không được khởi tạo:

```Plain Text
Chat API

Notification

Profile

Payment

Affiliate

Community

Watchlist
```

khi mở Dashboard\.

Chỉ API cần thiết mới được khởi tạo\.

---

# Widget Isolation

Widget phải độc lập\.

Một Widget lỗi:

```Plain Text
Heatmap
```

không được phép làm Dashboard chết\.

Một module lỗi:

```Plain Text
Profile
```

không được phép làm Home Page chết\.

Widget phải có Error Boundary riêng\.

---

# Global State

Global Store chỉ được chứa:

```Plain Text
Auth

User

Theme

Permission

Runtime Config
```

Không được chứa:

```Plain Text
Chat

Profile

Community

Stock

Heatmap

Dashboard

Payment

Alert
```

Business Store phải được load theo Page\.

---

# Performance Rules

Mỗi Page chỉ được phép tải:

- App Shell

- Manifest của Page

- Widget được sử dụng

- CSS được sử dụng

- API được sử dụng

Không được tải bất kỳ module nào ngoài phạm vi Page\.

---

# Strict Rules

Cursor tuyệt đối không được:

- Import toàn bộ Widget\.

- Import toàn bộ CSS\.

- Import toàn bộ Store\.

- Import toàn bộ API\.

- Import toàn bộ Feature\.

- Đăng ký toàn bộ Event Listener ngay khi Boot\.

Tất cả phải Lazy Load theo Page\.

---

# Acceptance Criteria

Sau khi refactor:

✅ Home không tải Chat\.

✅ Home không tải Profile\.

✅ Home không tải Community\.

✅ Dashboard không tải Payment\.

✅ Stock Page không tải Widget Dashboard\.

✅ Widget chỉ load khi xuất hiện trong Manifest\.

✅ Một Widget lỗi không làm crash toàn bộ Website\.

✅ Mỗi Page chỉ tải đúng những gì Page đó sử dụng\.

---

## Mình còn đề xuất thêm một rule bắt buộc

Hiện tại Cursor đang đi theo tư duy **SPA \(Single Page Application\)**, nên nó có xu hướng gom tất cả module vào một runtime chung\.

Trong khi iFlux của bạn thực chất là **Multi\-Page Application \(MPA\) có App Shell dùng chung**\.

Đây là khác biệt rất lớn:

- **SPA:** tải gần như toàn bộ ứng dụng ngay từ đầu rồi điều hướng nội bộ\.

- **MPA \+ Shared App Shell \(phù hợp với iFlux\):** mỗi page là một entry riêng, chỉ dùng chung Header, Sidebar, Theme, Router và Runtime Core; mọi business module đều được tải theo nhu cầu\.

Nếu bổ sung rule này vào SoT, Cursor sẽ thay đổi cách suy nghĩ khi sinh code và sẽ không còn xu hướng "all\-in" mọi module vào `boot.js` nữa\. Đây mới là cách giải quyết tận gốc vấn đề bạn đang gặp\.

