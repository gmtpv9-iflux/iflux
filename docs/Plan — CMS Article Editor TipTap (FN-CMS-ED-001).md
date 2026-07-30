# Plan — CMS Article Editor (TipTap · FN-CMS-ED-001)

**Trạng thái:** DONE — đã deploy Production · chờ Owner checklist + Regression Matrix  
**Chốt Owner:** **1A TipTap** · **2A v1 nền tảng** (không Callout) · Article HTML Contract  
**Owner Decision (LOCKED):** **IMG-A** — Image URL only; không Upload Media trong Plan này  
**Bổ sung khóa:** Image Policy · Paste Gate · HTML mode raw · URL Security · Preview = Production pipeline · Vendor immutable · DOMPurify · Regression Matrix  
**Governance:** PG-1.0  
**Ngày:** 2026-07-25  

---

## 0. Mục tiêu

Trong Admin → Quản lý cộng đồng → Quản lý nội dung → Thêm/Sửa bài viết → **Nội dung bài viết**:

- Chế độ mặc định: **Soạn thảo** (TipTap semantic toolbar)
- Chế độ **HTML** (raw source — xem §2.2)
- Chuyển đổi hai chiều, giữ nội dung / format / ảnh / bảng **hợp lệ theo Contract**
- Persistence **chỉ** `body_html`
- Preview Admin = **cùng pipeline** sanitize → `body_html` → CSS Production (`.ifx-com-article__body`)
- Không đổi Data Model, API field `body_html`, User runtime, Feed, SEO, RSS (trừ regression bắt buộc PASS)

---

## 1. Hiện trạng (neo)

| Hạng mục | Status |
|----------|--------|
| Editor | Textarea `#fld-body` trong `Admin_Design_system/app/community/content/edit.html` |
| Logic | `article-edit-page.js` → `body_html` POST/PUT `/community/admin/articles` |
| TipTap trong repo | Chưa có |
| Preview Admin | Chưa |
| User render | `community-post-page.js` + `community.css` `.ifx-com-article__body` |
| Cover ảnh bài | Input URL (`#fld-cover-url`) — không upload file |
| API Upload Media (CMS article) | Chưa có — **ngoài scope Plan này** (IMG-A LOCKED) |
| DOMPurify / sanitizer HTML | Chưa có trong repo → vendor **DOMPurify** (immutable) khi thi công |

```text
Admin: Soạn thảo TipTap ⇄ HTML raw
        → Paste Gate / Mode Gate / Save Gate
          (Contract config → DOMPurify engine + URL/Image Policy)
        → body_html only → API → DB
        → User .ifx-com-article__body
        → Admin Preview (cùng chuỗi body_html đã sanitize + cùng CSS User)
```

---

## 2. SoT khóa (không đàm phán lại khi thi công)

### 2.1 Persistence

- Chỉ lưu `body_html`
- Cấm `body_delta` / `body_json` / `body_markdown` song song
- **Editor không được tự lưu ảnh** (không base64, không blob trong DB/HTML)

### 2.2 Dual mode — HTML mode = raw thật

UI: **Soạn thảo** (default) | **HTML**

**HTML mode =**

- raw textarea / source editor
- **không** syntax highlight
- **không** beautify
- **không** auto format
- **không** auto indent
- giữ nguyên chuỗi HTML **sau Contract** (không rewrite “cho đẹp”)

Sync Soạn thảo ⇄ HTML qua cùng chuỗi HTML đã sanitize. Không tự rewrite HTML hợp lệ ngoài Contract.

### 2.3 Article HTML Contract (whitelist v1)

**Allowed tags:** `h2`, `h3`, `p`, `strong`, `em`, `blockquote`, `ul`, `ol`, `li`, `a`, `img`, `table`, `thead`, `tbody`, `tr`, `th`, `td`, `hr`, `br`

**Allowed attrs (tối thiểu):**

- `a`: `href`, `title`, `rel`, `target` (chỉ `_blank` + `rel=noopener`) — `href` tuân §2.4
- `img`: `src`, `alt`, `title` — không width/height cố định; `src` tuân §2.4 + §2.5
- `th` / `td`: `colspan`, `rowspan` nếu TipTap table cần

**Forbidden:** `style=""`, `font`, `script`, `iframe`, `class` tùy ý, `span` mang style, inline color/size, mọi tag ngoài whitelist, mọi `data:*` / `blob:` / `javascript:` trong URL attrs

### 2.3b Sanitize engine (bắt buộc)

| Vai trò | Module | Được phép | Cấm |
|---------|--------|-----------|-----|
| **Contract** | `article-html-contract.js` | Định nghĩa whitelist tags/attrs, URL Policy hooks, Image Policy hooks; gọi engine | **Không** tự viết parser HTML; **không** sanitize bằng regex |
| **Engine** | **DOMPurify** (recommended, vendor immutable) — hoặc sanitizer nội bộ **nếu đã tồn tại** trong repo | Parse + purify theo config Contract | Fork / tự chế regex sanitizer |

**Neo:** repo hiện **chưa** có DOMPurify → thi công vendor `Admin_Design_system/iflux-admin-ui/vendor/dompurify/` (**immutable**, không sửa source).

Mọi gate (Paste / Mode / Save / Preview) gọi **một** hàm `sanitizeArticleHtml(html)` = Contract config → DOMPurify.

### 2.4 URL Security Policy (bắt buộc trong Contract)

Áp dụng khi sanitize (Paste / Mode / Save) và khi insert link/ảnh.

| Attr | Cho phép | Cấm |
|------|----------|-----|
| `a.href` | `https:`, `http:`, `mailto:` | `javascript:`, `data:`, `vbscript:`, `blob:`, scheme lạ |
| `img.src` | `https:`, `http:` (v1 IMG-A) | `data:`, `blob:`, `javascript:`, object URL, base64 |

URL không hợp lệ → **strip** attribute hoặc strip node `img`/`a` (không giữ nguyên payload nguy hiểm).

### 2.5 Image Policy — Owner Decision (LOCKED): **IMG-A**

**v1 chỉ cho phép `img` với URL https/http hợp lệ.**

| Nguồn ảnh | Hành vi khóa |
|-----------|----------------|
| Nhập **URL** https/http hợp lệ | Cho phép → insert `<img src="…">` |
| **Upload** file / **Paste** file ảnh / **Drag & Drop** file ảnh | **Không bật** trong Plan này |
| Paste HTML có `data:image/*` / `blob:` | Strip theo Contract — không giữ |

**Cấm tuyệt đối (editor state sau sanitize + `body_html`):**

- `data:image/*`
- `blob:`
- object URL
- base64 image trong HTML
- Editor tự “lưu” ảnh local vào bài
- Silent base64 / localStorage / brand-identity-style hack

**Owner Decision (LOCKED): IMG-A**

- Toolbar **Image (URL)** only
- Upload Media / Paste file / DnD file = **ngoài scope** — không hỏi lại, không tự mở rộng Plan

### 2.6 Paste Policy — Paste Gate (không chỉ Save Gate)

Bug kinh điển TipTap/ProseMirror: copy từ Word / Google Docs / ChatGPT / TradingView / CafeF mang `style=`, `class=`, `span`, `font`, `mso-…`.

**Luồng khóa:**

```text
Paste vào editor
  → Paste Gate: sanitizeArticleHtml ngay (DOMPurify + Contract)
  → editor state sạch
  → (user soạn tiếp)
  → Save Gate: sanitize lần cuối
  → body_html
```

Tương tự khi **rời HTML mode → Soạn thảo**: sanitize trước khi `setContent`.

**Sanitize gates bắt buộc:**

| Gate | Khi nào |
|------|---------|
| **Paste Gate** | `paste` / drop HTML vào TipTap |
| **Mode Gate** | Rời HTML mode → Soạn thảo; (khi vào HTML mode: lấy HTML đã sanitize từ editor) |
| **Save Gate** | Trước `collectPayload` / POST/PUT |

Không được chỉ sanitize lúc save rồi để editor state bẩn.

### 2.7 Toolbar v1 (semantic only)

Có: H2, H3, Paragraph · Bold, Italic · Bullet / Number list · Quote · Divider · Link · **Image (URL)** · Table  

Cấm: Font family/size, color, highlight, background, letter-spacing, line-height, custom CSS, Callout/Alert/Badge · Upload ảnh file  

**Callout = Phase sau** — chỉ sau khi Foundation article-callout có trên User Web.

### 2.8 Preview = cùng pipeline Production

**Cấm:** Preview = dump HTML thô từ TipTap/`innerHTML` chưa qua Contract.

**Bắt buộc:**

```text
editor
  → sanitizeArticleHtml (DOMPurify + Contract)
  → body_html  (cùng hàm getBodyHtml() dùng khi save)
  → Preview pane
  → CSS Production `.ifx-com-article__body` (+ `community.css` Production)
```

Preview Admin ≈ trang chi tiết User với **cùng** `body_html` đã sanitize.

### 2.9 Ranh giới kiến trúc

- Chỉ đổi Editor UI (`edit.html` + module editor + contract + vendor TipTap/DOMPurify)
- **Không** thêm Upload Media / endpoint media trong Plan này
- Không đụng: schema/API field `body_html`, Store User, Feed DTO, SEO, RSS (ngoài regression verify)
- Không gắn lại legacy `content-edit.js`

---

## 3. Thiết kế kỹ thuật

### 3.1 TipTap trên Admin tĩnh — Vendor immutable

Admin không có bundler → **vendor** dưới `Admin_Design_system/iflux-admin-ui/vendor/tiptap/` (ESM/UMD), không thêm npm pipeline monorepo.

**Rule bắt buộc (TipTap + DOMPurify):**

- **Không sửa source** trong `vendor/`
- Vendor = **immutable**
- Cần chỉnh hành vi → **wrapper** riêng
- **Không fork** library

Extensions v1: StarterKit siết (heading 2–3 only), Link, Image, Table (+ Row/Cell/Header), HorizontalRule. Không extension tạo class/style ngoài Contract. Paste handler gọi `sanitizeArticleHtml`.

### 3.2 Module mới

- `article-html-contract.js` — **chỉ** config Contract (whitelist, URL/Image hooks) + gọi DOMPurify; **không** parser HTML tự viết / regex
- `article-body-editor.js` — mode switch, TipTap, get/set HTML, Paste Gate, sync; **không** beautify HTML mode
- Wire `article-edit-page.js`: `collectPayload` / `fillForm` / Preview qua `getBodyHtml()` (đã sanitize)
- Vendor: `vendor/tiptap/` + `vendor/dompurify/` (cả hai immutable)

### 3.3 UI shell

Chỉ `ix-*` / token DS hiện có. Toolbar = hàng `ix-btn`. Thiếu pattern DS → dừng báo Owner. Không hardcode CSS ngoài DS.

---

## 4. Phase thi công

| Phase | Việc | Exit |
|-------|------|------|
| 0 | Vendor TipTap + DOMPurify (**copy nguyên, không patch**) + Contract stub + slot UI | Mount được trên edit |
| 1 | TipTap + toolbar semantic + Image URL + Paste Gate + save `body_html` | Tạo/sửa bài HTML sạch; paste bẩn bị strip ngay |
| 2 | Mode HTML **raw** + round-trip (không formatter) | Switch mẫu phức tạp PASS; HTML không bị beautify |
| 3 | Preview = `getBodyHtml()` + CSS Production | Khớp User detail cùng HTML |
| 4 | Deploy Prod + purge | Owner checklist + Regression Matrix PASS |

**Ngoài scope v1:** Callout, Video/iframe, Underline/Strike/Checklist, mention ticker, User write page, **Upload Media / Paste file / DnD file**.

---

## 5. Touch points (tối thiểu)

1. `edit.html` — mode + editor host + preview  
2. `article-body-editor.js` + `article-html-contract.js` (mới)  
3. `article-edit-page.js` — wire  
4. `iflux-admin-ui/vendor/tiptap/` (**immutable**)  
5. `iflux-admin-ui/vendor/dompurify/` (**immutable**)  
6. Cache-bust script `edit.html`  

**Không sửa:** schema API `body_html`, User render (trừ regression). **Không thêm** Media Upload.

---

## 6. Kiểm thử Owner (chức năng)

- [ ] Mặc định Soạn thảo; không control font/màu  
- [ ] H2/H3/list/link/ảnh URL/quote/bảng/hr → User chi tiết đúng  
- [ ] HTML ⇄ Soạn thảo không mất nội dung hợp lệ; HTML mode **không** auto-format  
- [ ] Paste từ Word/Docs/web bẩn → strip ngay trong editor (Paste Gate)  
- [ ] `data:` / `blob:` / `javascript:` không vào `body_html`  
- [ ] Preview Admin ≈ Production (cùng `body_html` đã sanitize)  
- [ ] API chỉ `body_html`  
- [ ] Không có nút/flow Upload ảnh file trong editor  

---

## 7. Regression Matrix

**Không được ảnh hưởng:**

- [ ] Feed Community  
- [ ] Trang chi tiết bài viết  
- [ ] `body_html` API contract  
- [ ] Existing articles  
- [ ] RSS  
- [ ] SEO  
- [ ] Admin Edit Article khác (list, cover, metadata, publish — ngoài body editor)  

---

## 8. Quyết định đã khóa

- Engine: **TipTap** · Sanitize: **DOMPurify** · Vendor **immutable** (wrapper only)  
- Contract module ≠ parser (không regex sanitizer)  
- v1: semantic + HTML **raw** + Preview = Production pipeline  
- Callout: **Phase sau**  
- Image: **IMG-A LOCKED** (URL only; không Media Upload trong Plan này)  

**Chờ Owner:** «Duyệt» / «Làm» / «Thi công» → mới code.
