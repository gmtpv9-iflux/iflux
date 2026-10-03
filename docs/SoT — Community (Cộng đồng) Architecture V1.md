# SoT — Community (Cộng đồng) Architecture V1

**Ngày:** 2026-10-02
**Trạng thái:** 🟢 Chốt kiến trúc nghiệp vụ — chờ thi công theo phase
**Thay thế:** `Sot - Topic_Engine (V1).md`, `Sot - Topic_Engine (V2).md` (xem §8)
**Tái dùng nguyên vẹn:** `SoT — Follow & Notification Domain.md`, hệ Interaction (IA-001…IU-001)

---

## 0. Vì sao tài liệu này tồn tại

Trang `/cong-dong` cũ (xem `Product Backlogs/270730_Community_Post_List_Management/00-README.md`) chưa từng thi công — chỉ dừng ở audit. Khái niệm "Community" trước đó đã được đổi tên hẳn thành **Tin tức** (`bfbf5df`, `e751ab4` — "Vacate community identity so Tin tức lives only as news"). Tài liệu này mở lại `/cong-dong` cho một nghiệp vụ **hoàn toàn mới**: mạng xã hội nhà đầu tư, không phải nơi hiển thị lại tin tức.

Owner đã trực tiếp chốt kiến trúc (nguyên văn trao đổi, xem lịch sử phiên làm việc 2026-10-02) — tài liệu này tổng hợp lại thành SoT kỹ thuật, đối chiếu với hệ thống đang chạy để không lặp lại hạ tầng đã có và không làm mất nghiệp vụ nào đã phát biểu.

---

## 1. Thay đổi tư duy cốt lõi

| | Kiến trúc cũ (Topic Engine V1/V2) | Kiến trúc mới (tài liệu này) |
|---|---|---|
| Nguồn hình thành Story | Hệ thống **suy luận** từ thống kê (Topic Score, ngưỡng Top X%, W/D ngày) | **User/Admin phát biểu trực tiếp** — Story tồn tại ngay khi tạo |
| Vai trò thống kê | Quyết định Story có tồn tại hay không | Chỉ quyết định Story nào đang **HOT** (ranking), không quyết định sự tồn tại |
| Topic vs Story | 2 khái niệm, Story là "trạng thái trưởng thành" của Topic | **Hợp nhất làm một** — UI gọi "Chủ đề", backend entity `story` |
| Độ phức tạp | Cron đánh giá trạng thái mỗi ngày, state machine 5 trạng thái | Không cần — Story có ngay, ranking tính theo chu kỳ Ngày/Tuần/Tháng |

AI/thuật toán phát hiện Story tự động **không bị loại bỏ vĩnh viễn** — chỉ hạ cấp thành **Story Discovery** (gợi ý cho Admin/User tạo Story), không còn là điều kiện Story tồn tại. Xem §7.5.

---

## 2. Năm domain nghiệp vụ

```text
COMMUNITY
├── 1. SOCIAL GRAPH      — Follow User (ĐÃ CÓ, tái dùng nguyên vẹn — §3)
├── 2. CONTENT           — Post hợp nhất (MỚI — §4)
├── 3. INTERACTION       — Like/Comment/Share/Repost (ĐÃ CÓ hệ Interaction — §5)
├── 4. DISTRIBUTION      — Feed/Timeline/Stock Detail (MỚI, dựa hạ tầng cũ — §6)
└── 5. STORY / TOPIC     — Chủ đề do User/Admin tạo (MỚI, thay Topic Engine — §7)
```

---

## 3. Social Graph — ĐÃ CÓ, không cần xây lại

**Phát hiện khi audit:** `backend/src/modules/follow/` đã có đầy đủ Follow User:

```text
follow.service.js:
  follow(followerId, followeeId)
  unfollow(followerId, followeeId)
  exists(followerId, followeeId)
  counts(userId)
  listFollowing(followerId, opts)
  listFollowerIds(followeeId, limit)

follow.routes.js:
  GET    /users/me/following
  GET    /users/:id/exist
  GET    /users/:id/counts
  POST   /users/:id      (follow)
  DELETE /users/:id      (unfollow)
```

`docs/SoT — Follow & Notification Domain.md` đã phân biệt rõ **Follow Thực thể** (cổ phiếu/ngành/story — qua `watchlist-store.js`) và **Follow User** (quan hệ 2 người dùng, không liên quan Watchlist/Bookmark/Like) — đúng khái niệm "Social Graph" mà Owner mô tả.

**Việc cần làm:** Chỉ là **dùng lại** API này cho nút "+ Theo dõi" trên Post/Story card trong Cộng đồng. Không tạo bảng/API follow mới.

---

## 4. Content — Một Post Model duy nhất

### 4.1 Nguyên tắc (Owner nhấn mạnh — khoá cứng)

> Một nội dung chỉ tồn tại **một Post Source of Truth**. Community Feed, User Timeline, Stock Detail chỉ là **view/distribution surface** của cùng một Post — **cấm** tạo `community_posts` / `profile_posts` / `stock_comments` thành 3 bản copy khác nhau.

### 4.2 Schema

```text
Post
├── id
├── author_id
├── content                 — text người dùng viết
├── post_type               — status | stock_view | share | reply-as-post (xem 4.4)
├── source_type              — null | news | story | chart …
├── source_id                — id của Article/Story khi post gắn kèm nguồn
├── stock_tags[]              — mã cổ phiếu được gắn (0..n)
├── visibility                — public | followers (mở rộng sau)
├── created_at / updated_at
└── engagement                — đọc qua Interaction system (§5), KHÔNG lưu trùng ở Post
```

4 biến thể nghiệp vụ Owner liệt kê (viết thường, viết về cổ phiếu, share tin, share tin + tag mã) **đều là cùng 1 `Post`** — chỉ khác giá trị `source_type`/`stock_tags`. Không tạo 4 bảng/luồng nghiệp vụ khác nhau.

### 4.3 "Bình luận cổ phiếu" = Post có `stock_tags`, không phải `stock_comment`

> User tag cổ phiếu + để lại nhận định → đó là **tạo một Post có relation với Stock**, không phải "comment vào Stock".

Hệ quả kỹ thuật quan trọng: **không dùng `stock-comments-ui.js` / `IfluxStockStore.addComment` cho luồng này nữa** — đây là 2 hệ khác nhau cố tình tách biệt:

- **Ý kiến về cổ phiếu từ Composer Cộng đồng** → tạo `Post` (`stock_tags: [HPG]`) → xuất hiện ở Community Feed + Timeline + HPG Stock Detail (cùng 1 bản ghi, 3 nơi hiển thị).
- **Trả lời 1 Post có sẵn** → `Comment` (gắn `post_id`, qua hệ Interaction §5) — khác object, không tự động thành Post trên Timeline.

`stock-comments-ui.js`/`IfluxStockStore` hiện tại (dùng ở trang cổ phiếu) là hệ **cũ, trước Post model** — giữ nguyên để không vỡ trang Cổ phiếu hiện tại, nhưng **không mở rộng** luồng đó nữa; mọi "bình luận cổ phiếu" mới đi qua Composer → Post. Việc migrate `stock-comments-ui.js` sang đọc Post-feed theo `stock_tags` là Phase 2 riêng (xem §9), không bắt buộc để launch Cộng đồng.

### 4.4 Comment dưới Post vẫn là Comment (không tự thành Post)

```text
POST
├── stock_tags[]
├── news attachment (source_type=news)
└── COMMENTS (hệ Interaction) → Comment, Reply
```

Trừ khi user chọn rõ "Đồng thời đăng lên tường" (switch tường minh trong Composer trả lời — **tính năng tuỳ chọn, không bật mặc định**), reply không tự nhân bản thành Post mới trên Timeline. Nếu không chặn, feed sẽ nhiễu khi scale.

---

## 5. Interaction — tái dùng hệ IA/IO/IP/IR/IU đã có

Hệ Interaction (`docs/SoT — Interaction *.md`, IA-001…IU-001) **đã** dự trù `communityPost` như một `pageKey` hợp lệ (`IO-001 §123`: *"Community Post Comments — mobile Primary Interactive = page"*). Nghĩa là:

- Like/Comment/Share/Repost trên `Post` đi qua **đúng** `IfluxInteractionStore` hiện có (`interaction/catalog`, `interaction/boot.js`...) — không viết lại interaction riêng cho Cộng đồng.
- Owner chain, Presentation Resolver, Summary vs Interactive — áp dụng y nguyên theo IO-001/IU-001.
- Việc cần làm: khai báo `Post` như 1 **entity type** mới trong catalog Interaction (giống cách `article`/`comments` đã khai báo), còn runtime/ownership giữ nguyên.

**Layer 2 — Network Interaction (Owner yêu cầu rõ ranh giới):**

```text
FeedScore = DirectFollowWeight (Post của người mình follow)
          + InteractionWeight (người mình follow Like/Comment/Repost bài người khác — yếu hơn)
          + Recency
          + Engagement
```

Không chốt công thức cụ thể ở V1 — **chỉ chốt nguyên tắc**: Layer 2 tạo *candidate* cho Feed, không phải mọi interaction của người mình follow đều hiển thị. Hệ số cụ thể để Phase ranking riêng tinh chỉnh bằng dữ liệu thật (tránh đoán số trước khi có traffic).

---

## 6. Distribution — Feed/Timeline/Stock Detail là View, không phải Data riêng

```text
Post #123 (1 bản ghi duy nhất)
   ├── Community Feed     (theo FeedScore, §5)
   ├── User Timeline       (toàn bộ Post của 1 author_id)
   └── Stock Detail        (lọc theo stock_tags chứa mã đó)
```

Ba nơi trên là **query khác nhau trên cùng 1 bảng `Post`**, không phải 3 API/bảng riêng. API Feed cần tối thiểu 3 kiểu truy vấn:

- `GET /community/feed?mode=following|trending|latest&cursor=...&limit=10`
- `GET /users/:id/timeline?cursor=...&limit=10`
- `GET /stocks/:ticker/posts?cursor=...&limit=10` (phục vụ "Thảo luận theo mã" + Stock Detail tab Discussion)

Tất cả **cursor-based, limit mặc định 10** — khớp đúng yêu cầu lazy-load timeline của Owner (§10).

---

## 7. Story / Chủ đề — thay thế Topic Engine

### 7.1 Entity

Backend/DB giữ tên `story` (hệ thống cũ đã dùng nhiều — tránh rename tốn kém); UI luôn hiển thị **"Chủ đề"**.

```text
Story
├── id
├── title
├── description           — luận điểm
├── author_id              — User hoặc Admin
├── stock_tags[]
├── sentiment               — bullish | bearish (THUỘC TÍNH, KHÔNG PHẢI SCORE)
├── agree_count
├── comment_count           — qua hệ Interaction, đọc lại không lưu trùng
├── status                  — active | archived (Admin có thể archive, không còn state machine 5 bước)
└── created_at
```

### 7.2 Lifecycle — không còn cron đánh giá trạng thái

```text
User/Admin tạo Chủ đề (title, stock(s), sentiment, luận điểm) → Publish → tồn tại ngay lập tức.
```

Không còn "Mới → Đang phát triển → Đã trưởng thành → Đang suy giảm → Lưu trữ" của Topic Engine V2. Không còn Topic Score quyết định tồn tại. **Xoá hẳn state machine này khỏi scope V1** — đơn giản hoá đúng như Owner chốt.

### 7.3 Đồng tình (Agree) — không phải Like

`agree_count` là hành động xác nhận "tôi đồng ý narrative này", tách biệt khỏi Like (vốn dùng cho Post thường). Vẫn đi qua hệ Interaction nhưng với **action type riêng** (`agree`, không trùng `like`) để không lẫn ngữ nghĩa khi hiển thị số liệu.

### 7.4 Hai bảng xếp hạng KHÔNG được gộp

| | Chủ đề HOT | Mã được quan tâm |
|---|---|---|
| Nguồn | `agree_count` (+ comment/share sau) của **Story** | Mention trong Post + Story + Comment + View + Search |
| Ý nghĩa | Narrative nào đang được cộng đồng *xác nhận* nhiều nhất | Mã nào đang được *nhắc tới* nhiều nhất (không cần đồng tình) |
| Chu kỳ | Ngày / Tuần / Tháng | Không nhất thiết theo chu kỳ cố định |

Owner nhấn mạnh: *"Đừng gộp hai cái"* — 2 widget sidebar trái riêng biệt (khớp wireframe: "🔥 Chủ đề HOT" và "🔥 Mã được thảo luận nhiều" là 2 khối khác nhau).

### 7.5 Story Discovery (tương lai, không phải điều kiện tồn tại)

Khi đủ dữ liệu, có thể bổ sung AI phát hiện cụm bài đang nói về cùng 1 narrative → **gợi ý** Admin/User tạo Chủ đề. Đây là tính năng *discovery* độc lập, đặt sau Phase V1, không ảnh hưởng tới việc Story đã tồn tại từ lúc tạo thủ công.

---

## 8. Siêu thay thế — Topic Engine V1/V2

`Sot - Topic_Engine (V1).md` và `(V2).md` **được đánh dấu SUPERSEDED bởi tài liệu này** kể từ 2026-10-02:

- Toàn bộ state machine 5 trạng thái, Topic Score (Content/Interaction/Search/Growth × trọng số), ngưỡng Top X%/W ngày/D ngày — **không triển khai**.
- Khái niệm "cổ phiếu đại diện / Leader Stock theo tỷ trọng cộng dồn 80%" trong V2 **vẫn hữu ích** cho Story có nhiều mã — có thể tái dùng làm thuật toán phụ trợ hiển thị "mã nổi bật trong Chủ đề" nếu Story có >1 `stock_tags`, nhưng **không phải điều kiện xác định Story có tồn tại hay không** (khác hẳn vai trò cũ của nó).
- Nếu Admin cần tham khảo UI "Topic detail như Market Entity" (biểu đồ Topic Index từ nhóm cổ phiếu đại diện) ở V2 §Hiển thị — đây là ý tưởng hay, **đưa vào backlog riêng** ("Story có >80% tỷ trọng vào 1 nhóm mã → hiện biểu đồ Story Index"), không phải yêu cầu bắt buộc của Phase V1.

---

## 9. Thứ tự Phase thi công (dependency-ordered)

```text
Phase 0 — Scaffold trang (không phụ thuộc backend mới)
  ├── Route /cong-dong (ROUTES table, iflux-platform-boot.js)
  ├── pages/community.manifest.js — sections: sidebar, main, sidebar-right
  ├── widgets/community-page/index.js — buildPageFrame(el, { rightSidebar: true })
  ├── Admin: RIGHT_SIDEBAR['community'] = true (page-settings-catalog.js — hiện đang {})
  ├── Nav Registry: thêm mục "Cộng đồng" (iflux-admin-nav-registry.js tương đương phía User Web)
  └── CSS cục bộ community.css (theo đúng yêu cầu #3 — không đẩy style riêng vào DS dùng chung)

Phase 1 — Post model (backend, chặn mọi phase sau)
  ├── Bảng `posts` (schema §4.2)
  ├── API: POST /community/posts, GET /community/feed, GET /users/:id/timeline,
  │        GET /stocks/:ticker/posts
  └── Khai báo `post` là entity type trong Interaction catalog (tái dùng, không viết lại)

Phase 2 — Story/Chủ đề (backend, độc lập Phase 1 — có thể song song)
  ├── Bảng `stories` (schema §7.1), action `agree` riêng trong Interaction
  ├── API: POST /community/stories, GET /community/stories?sort=trending&range=day|week|month
  └── Admin: trang "Cộng đồng > Danh sách chủ đề" (danh sách + sentiment + agree + comment)

Phase 3 — Feed Ranking (phụ thuộc Phase 1)
  ├── FeedScore v1 (công thức thô — tinh chỉnh sau khi có traffic thật)
  └── Layer 2 candidate generation (Direct Follow vs Network Interaction)

Phase 4 — Composer UI (phụ thuộc Phase 1 + 2)
  ├── "Bạn đang nghĩ gì..." + Viết bài / Chia sẻ tin / Gắn mã / Tạo chủ đề
  └── Share từ Article (News) → mở Composer pre-filled source_type=news

Phase 5 — Sidebar widgets (phụ thuộc Phase 1-3, dùng hạ tầng Widget Placement có sẵn)
  ├── Trái (3/12, qua Admin Widget Placement — không code cứng trong page):
  │     Chủ đề HOT (Ngày/Tuần/Tháng), Mã được thảo luận nhiều, Nhà đầu tư nên theo dõi
  └── Phải (2/12, MỚI — qua RIGHT_SIDEBAR whitelist Phase 0):
        Tạo chủ đề (CTA), Hoạt động từ người theo dõi (Layer 2 feed), Lối tắt nhanh

Phase 6 — Timeline lazy-load (phụ thuộc Phase 1 + 3)
  └── 10 bài/lần, cursor-based, load tiếp khi cuộn chạm đáy (giống pattern IfluxDailyFeed
      đã có ở Tin tức — tái dùng cùng kỹ thuật sentinel + IntersectionObserver)
```

**Owner đã uỷ quyền:** tự xây dependency, không cần hỏi từng bước; việc nào cần Owner xác nhận mới đi tiếp (ví dụ: trọng số FeedScore chính thức, ngưỡng archive Story) thì ghi nhận là "chờ xác nhận" trong backlog tương ứng và **chuyển sang phần khác**, không chặn toàn bộ tiến độ.

---

## 10. Giao diện (đối chiếu wireframe `wireframe-cong-dong.png`)

| Vùng | Tỉ lệ | Nguồn |
|---|---|---|
| AppShell Header | — | Dùng chung, tải 1 lần (đã có mọi trang) |
| Sidebar trái | 3/12 | Widget host qua Admin Widget Placement — **giống mọi trang khác**, không hardcode |
| Main content | 7/12 | **Không** có widget host — toàn bộ là Composer + Timeline do `widgets/community-page` tự dựng |
| Sidebar phải | 2/12 | Widget host MỚI — hạ tầng đã có sẵn (`opts.rightSidebar`, CSS `.ifx-shell-sidebar-right`), **chưa trang nào dùng** tới nay |

Timeline: lazy-load 10 bản tin/lần, cuộn xuống đáy mới tải thêm lịch sử (Phase 6).

**Nguyên tắc CSS/JS (#3 trong yêu cầu Owner):** mọi style/logic dùng ≥2 trang → DS (`design_system/`); style/logic chỉ Cộng đồng dùng → file cục bộ (`community.css`, `community-page.js`) — không đẩy vào DS làm nặng các trang khác. Đúng tinh thần đã áp dụng xuyên suốt phiên làm việc này (xem các lần tách `mobile-nav.js`, `auth-forms.js`).

---

## 11. Rà soát không trùng lặp hạ tầng (đã audit trước khi viết tài liệu)

| Cần | Đã có sẵn? | Vị trí |
|---|---|---|
| Follow User | ✅ Có đầy đủ API | `backend/src/modules/follow/` |
| Like/Comment/Share generic | ✅ Có hệ Interaction | `IA-001…IU-001`, `interaction/` |
| Sidebar phải (2/12) layout | ✅ Có sẵn, chưa ai dùng | `app-shell.js` `opts.rightSidebar`, CSS `25_app-shell/app-shell.css` |
| Widget Placement cho sidebar-right | ✅ Có sẵn generic, chỉ cần thêm page vào whitelist | `page-settings-catalog.js` `RIGHT_SIDEBAR = {}` |
| Lazy-load feed 10/lần + sentinel | ✅ Có pattern mẫu | `news-daily-feed.js` (IfluxDailyFeed) — tái dùng kỹ thuật, không tái dùng data Tin tức |
| Post model thống nhất | ✅ Xong (Phase 1, 2026-10-03) | `backend/src/modules/community/` |
| Story/Chủ đề do User/Admin tạo trực tiếp | ❌ Chưa có — Topic Engine cũ không khớp mô hình mới | Thay thế theo §8 |

---

## 12. Tiến độ

- [x] **Phase 0 — Scaffold trang** — route `/cong-dong`, `community.manifest.js`, `widgets/community-page`,
  CSS cục bộ, seed data tĩnh khớp wireframe.
- [x] **Phase 1 — Post model (backend)** (2026-10-03):
  - Migration `072_social_posts.sql` — bảng `social_posts` (1 bảng duy nhất cho Feed/Timeline/
    Stock Detail, đúng §4.1) + bảng `interaction_likes` (generic, trước đây CHỈ có comment).
    Đặt tên `social_posts` (không phải `community_posts`) để tránh trùng tên bảng lịch sử đã
    rename thành `news_posts` (migration 063).
  - API `backend/src/modules/community/`: `POST /api/community/posts`, `GET /api/community/feed`
    (mode=latest|following|trending), `GET /api/community/users/:id/timeline`,
    `GET /api/community/stocks/:ticker/posts`, `DELETE /api/community/posts/:id`.
    **Đúng path đề xuất ban đầu của tài liệu này** — ban đầu phải tạm đổi sang `/api/social/*` vì
    phát hiện prefix `/community` lúc đó còn bị `newsRouter` chiếm (di sản "Cộng đồng = Tin tức",
    dùng sẽ đụng `GET /community/feed` feed Tin tức cũ). 2026-10-03: gỡ hẳn alias
    `community→newsRouter` + `admin/community-ops→newsOpsRouter` (0 consumer thật, xác nhận qua
    audit) rồi đổi API Phase 1 này về đúng `/api/community/*` — "community" trong API từ nay chỉ
    còn nghĩa mạng xã hội nhà đầu tư, hết lẫn với Tin tức. Tên BẢNG SQL vẫn giữ `social_posts`
    (không đổi `community_posts`) để tránh trùng tên bảng lịch sử đã rename thành `news_posts`
    (migration 063) — tên bảng nội bộ và tên API đối ngoại không bắt buộc trùng nhau.
  - Đăng ký entity type `communitypost` vào Interaction registry (tái dùng nguyên luồng comment
    generic đã chạy tốt cho stock/sector/family/story — đúng §5, không viết lại). Thêm
    `POST/DELETE /api/interaction/v1/:entityType/:entityId/like` (generic, dùng chung mọi nơi).
  - Đã test đầy đủ trên staging + production (tạo bài/feed/timeline/like/summary/xoá) — PASS.
  - **CHƯA làm**: trang Cộng đồng (`widgets/community-page`) vẫn hiển thị seed data tĩnh, CHƯA
    đọc/viết qua API Phase 1 này (nối dây Composer + Feed thật là việc tiếp theo, thuộc Phase 4).
- [ ] **Phase 2 — Story/Chủ đề** (độc lập Phase 1, có thể làm song song)
- [ ] **Phase 3 — Feed Ranking thật** (FeedScore — Phase 1 đang tạm dùng `created_at DESC` cho
  mode `trending`, chưa tính DirectFollowWeight/InteractionWeight/Recency/Engagement thật)
- [ ] **Phase 4 — Composer UI** (nối Composer hiện tại — đang báo "đang hoàn thiện" — vào
  `POST /api/community/posts`; Feed/Timeline đọc qua `GET /api/community/feed`)
- [ ] **Phase 5 — Sidebar widgets** (Chủ đề HOT, Mã được thảo luận nhiều, Hoạt động từ người theo
  dõi — có thể tận dụng ngay `GET /api/community/users/:id/timeline` theo danh sách Follow cho mục
  "Hoạt động từ người theo dõi")
- [ ] **Phase 6 — Timeline lazy-load** (hạ tầng cursor-based đã sẵn trong API Phase 1, chỉ còn nối
  UI sentinel + IntersectionObserver kiểu `news-daily-feed.js`)

---

*Tài liệu này là SoT nghiệp vụ + kiến trúc kỹ thuật cho Cộng đồng V1. Cập nhật tiếp khi từng Phase ở §9 hoàn thành hoặc khi Owner điều chỉnh quyết định.*
