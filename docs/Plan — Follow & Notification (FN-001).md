# Plan — Follow & Notification (FN-001)

**Trạng thái:** ✅ SHIPPED Prod 2026-07-24 · chờ Owner hard refresh xác nhận UI  
**SoT nghiệp vụ:** [`SoT — Follow & Notification Domain.md`](./SoT%20—%20Follow%20%26%20Notification%20Domain.md) (FN-001 Draft v1.0)  
**Governance:** PG-1.0 (Plan → duyệt → «làm» / «thi công»)  
**Ngày:** 2026-07-24  

> Owner đã duyệt «Duyệt, tiến hành» — Phase 0–7 đã deploy Production + CF purge.

---

## 0. Mục tiêu Plan

Hoàn thiện Follow (Entity + User) và Notification Matrix đúng SoT Domain, đồng thời **không** phá Loading / Ownership / Persistence đã khóa ở các SoT kỹ thuật.

**Không** nằm trong Plan này: tối ưu Task 4 toàn site; refactor Watchlist store; đổi schema Interaction kinds.

---

## 1. SoT chi phối

### 1.1 Nghiệp vụ (chính)

| SoT | Việc |
|-----|------|
| **Follow & Notification Domain (FN-001)** | Follow Entity / User · Matrix · Deep link · Done nghiệp vụ |

### 1.2 Ranh giới Interaction / UI / Bookmark

| SoT | Việc |
|-----|------|
| IA-001 | Like ≠ Follow · Thread/Like/Share |
| IU-001 | Icon contract |
| Bookmark Ext v1 | Bookmark ≠ Follow Entity |
| DS Foundation `ix-follow` | Một Foundation cho Entity + User |

### 1.3 Hiệu năng · Runtime · Loading · Ownership (bắt buộc)

| SoT | Ràng buộc với task này |
|-----|-------------------------|
| **PA V2** | Data Provider · Store không tự fetch · Resource một owner · cấm Page hardcode JS/CSS Widget |
| **IR-001** | Like/Reply: Summary không kéo Interactive / không hydrate thread bulk vì chuông |
| **Task 4 Resource Loading** | Policy Auth+Idle + **Necessity theo Consumer** (§3.1 · §4 Phase 6) |
| **Runtime Task 3 (Shell)** | **Notification UI Owner = App Shell duy nhất** (§3.0 · Phase 0) |
| **PS-1.0** | Follow + inbox = API SoT · cấm LS authoritative |
| **Bài học Community Feed** | API list: DTO · cursor/limit · cấm full dump · cấm `SELECT *` |
| **DS + rule UI** | Không class/CSS ad-hoc ngoài DS |
| **PG-1.0** | Duyệt Plan → mới code |

FN-001 Domain **không** ghi số KB — Exit runtime nằm ở Phase 7.

---

## 2. Hiện trạng (audit ngắn · 2026-07-24)

| Hạng mục | Status |
|----------|--------|
| Foundation Follow (bookmark) · Entity = Watchlist | ✅ Đã ship Prod (`followFound20260724`) |
| Mẫu Admin NOTIF-USER-008 + 011…015 | ✅ Đủ nhóm SoT §6 (User đăng bài = NOTIF-USER-008) |
| SoT Domain trong `docs/` | ✅ File đã tạo (Draft) |
| Follow User quan hệ + UI | ✅ API count/exist/cursor + hồ sơ |
| Emit / wiring notify + deep link | ✅ Event Bus + Shell Need Now/Soon |
| Owner verify icon trên Prod | ✅ Residual Follow=tim = 0 (Foundation bookmark); Like giữ `ti-heart` |

---

## 3. Nguyên tắc thi công (chống code thừa)

1. Một Foundation Follow — Entity + User.  
2. Follow Entity = Watchlist hiện có — không store thứ hai.  
3. **Business Event chỉ publish** — Notification (và Analytics / Achievement / Mail…) chỉ **subscribe**; Business **không** gọi Notification trực tiếp.  
4. **Notification UI Owner = App Shell duy nhất** (§3.0).  
5. Reuse inbox Shell / catalog / Admin — không App / Community / Entity Notify Manager mới.  
6. Không `hydrateFromApi` / dump feed / dump follow “phòng khi”.  
7. Loading theo Consumer Necessity (§3.1) + Auth/Idle Policy (Task 4).  
8. Fan-out notify **server-side** theo matrix — không FE poll full graph.  
9. API: DTO + `count` / `exist` / `cursor` / `limit` — **Forbidden** full list (§3.2 · Phase 1).  
10. Provider → Store set — Store không tự IO list sai owner.  
11. Cấm tim cho Follow · cấm CSS ngoài DS.

### 3.0 Ownership — Notification UI (khóa)

```text
App Shell
  owns
    - badge (chuông)
    - unread count
    - dropdown / panel inbox
    - mark read (UI trigger → API)

Community / Entity / Comment / Watchlist / Interaction Host
  KHÔNG owns Notification UI
```

**Forbidden (tên ví dụ — mọi biến thể tương đương cũng cấm):**

- `CommunityNotificationManager`
- `EntityNotificationManager`
- `CommentNotificationManager`
- `NotificationPanel` / `NotificationBadge` sống ngoài App Shell
- Feature tự mount badge/panel song song Shell

Page/Feature **chỉ** phát Business Event (hoặc gọi API nghiệp vụ sinh event).  
UI chuông / unread / panel = **một Owner: App Shell**.

Inventory Phase 0 phải ghi: file Shell hiện có nào đang own badge/panel — **reuse**, không tạo owner thứ hai.

### 3.1 Loading theo Consumer (Task 4 Necessity)

Policy nền (đã có): script inbox **Auth + Idle** — không Startup.

Necessity **theo Consumer** (khóa):

| Consumer | Necessity | Khi nào tải / fetch |
|----------|-----------|---------------------|
| **Badge** + unread count | **Need Now** (sau Auth; không chặn nội dung trang nếu Idle script — nhưng **dữ liệu badge** là Need Now của chuông) | Sau đăng nhập: chỉ **count / unread summary** — không kéo panel/history |
| **Panel** (dropdown danh sách ngắn) | **Need Soon** | **User click** chuông → mới fetch page đầu (cursor + limit nhỏ) |
| **History** (cuộn thêm / trang lịch sử) | **Need Maybe** | **User scroll** / mở “xem thêm” → cursor tiếp |
| Mark read / avatar trong row | Theo panel item đã hiện | Không prefetch mark-read hàng loạt hay avatar full graph lúc Startup |

**Cấm chuỗi:**

```text
Startup → badge + panel + history + mark read + avatar…
```

**Chuỗi đúng:**

```text
Auth (+ Idle script Shell)
  → Need Now: badge / unread count
  → user click
  → Need Soon: panel (page 1, limit nhỏ)
  → user scroll
  → Need Maybe: history (cursor)
```

### 3.2 Forbidden API (khóa — bài học Feed)

**Forbidden**

| API / hành vi | Lý do |
|---------------|--------|
| `GET …/followers` full list (không cursor/limit cứng nhỏ) | Dump hàng nghìn user “để kiểm tra” |
| `GET …/following` full list | Như trên |
| `GET …/notifications` full history một phát | Over-fetch Need Maybe thành Need Now |
| `SELECT *` / Persistence Model trên list public | Leak body / profile thừa |

**Allowed (bắt buộc hướng Contract Phase 1)**

| Hình thức | Ví dụ ý nghĩa |
|-----------|----------------|
| `count` | Số follower / unread |
| `exist` / boolean | Đã follow user X chưa |
| `cursor` + `limit` | Page panel / history / fan-out nội bộ có bound |
| Summary DTO | Badge: `{ unreadCount }` — không danh sách |

Fan-out server (ai nhận notify) dùng query nội bộ có **bound/batch** — không expose full followers ra FE.

---

## 4. Phases

### Phase 0 — Docs đã có + Inventory (không feature)

**Mục đích:** Đóng băng SoT + Impact Analysis trước API + **khóa Ownership UI**.

| Việc | Chi tiết |
|------|----------|
| 0.1 | SoT Domain đã nằm trong `docs/` — Owner khóa Draft → v1.0 LOCKED nếu OK |
| 0.2 | **Consumer Inventory:** Follow Entity UI · Follow User UI (có nút chưa?) · **Shell notify files (badge/panel)** · catalog Admin · backend · deep link SEO |
| 0.3 | Gap catalog ↔ SoT §6 (đặc biệt §5.2 A đăng bài) |
| 0.4 | **Ownership lock:** xác nhận App Shell = sole Owner badge / unread / panel; ghi path file hiện có; đánh dấu mọi candidate Manager ngoài Shell = **cấm tạo** |

**Exit Phase 0**

- [ ] Owner xác nhận SoT Domain file  
- [ ] Bảng Inventory + Impact  
- [ ] Gap mẫu Admin liệt kê đủ  
- [ ] **Notification UI Owner = App Shell** đã ghi trong Inventory (file reuse)  
- [ ] Owner duyệt Phase 0 → mở Phase 1  

---

### Phase 1 — Contract (trước code)

| Contract | Nội dung |
|----------|----------|
| Follow User | Quan hệ follower/followee · create/unfollow · **Forbidden** full followers/following list (§3.2) · Allowed: count / exist / cursor+limit |
| Business Events | Event types + điều kiện cấm (SoT §5) · **publish only** |
| Event → Subscriber | **Business không gọi Notification / Achievement / Mail trực tiếp.** Bus (hoặc tương đương): Event publish → Notification subscriber (+ subscriber khác độc lập). Cấm `if (event) { notify(); achievement(); mail(); }` trong một hàm nghiệp vụ |
| Notification DTO | title, body, icon, deepLink, createdAt, read — Forbidden: `body_html` bài, thread đầy đủ, dump persistence |
| Inbox API | Badge: count/summary · Panel: cursor+limit · History: cursor — **Forbidden** full notifications dump |
| Deep Link | Bảng SoT §7 → pattern URL Việt |
| Loading Contract | Badge Need Now · Panel Need Soon (click) · History Need Maybe (scroll) — §3.1 |

**Exit Phase 1:** Owner duyệt Contract (gồm Event Bus + Forbidden API + Necessity) → mới Phase 2+.

---

### Phase 2 — Icon residual (A · nhẹ)

*Phần lớn đã xong.*

1. Quét còn tim cho Follow Entity.  
2. Gỡ hardcode.  
3. Like Interaction giữ `ti-heart`.  
4. Không đổi logic Watchlist.

**Exit:** Owner xác nhận UI · residual Follow=tim = 0.

---

### Phase 3 — Admin mẫu (trước emit)

1. Bổ sung mẫu thiếu (§5.2 A) nếu Inventory xác nhận.  
2. Đồng bộ Admin + User catalog.  
3. Gắn deep link mẫu khớp §7.  
4. Không emit thật.

**Exit:** Đủ nhóm SoT §6 trong Admin.

---

### Phase 4 — Follow User (BE + UI tối thiểu)

1. API quan hệ + DTO (không `SELECT *`).  
2. UI: **một** surface (mặc định đề xuất: hồ sơ) — Foundation Follow.  
3. Loading: không Startup toàn site.  
4. Provider → Store.

**Exit:** Follow/unfollow được · không đụng Watchlist · không regression cold `/cong-dong` feed.

**Chờ Owner chốt:** surface UI duy nhất trong scope = trang hồ sơ?

---

### Phase 5 — Emit (matrix) · Event Bus

```text
Business action
  → publish Business Event only
       ↓
  Notification subscriber  →  Inbox (DTO)
  (Analytics / Achievement / Mail = subscriber độc lập — ngoài scope hoặc task riêng)
```

**Cấm:** trong handler nghiệp vụ gọi trực tiếp `notify()` + `achievement()` + `mail()` nối chuỗi.

| Wave | Nội dung |
|------|----------|
| 5.1 | Entity tagged post → Watchlist followers (query nội bộ bound — không API full followers cho FE) |
| 5.2 | Comment liked / replied (§5.3) |
| 5.3 | Follow user: đăng bài / share / bình luận gốc entity |

Ngoài matrix = bug. Payload = DTO nhẹ.

**Exit:** Bảng test đúng/sai từng hàng SoT §5 · Event chỉ publish · Notification chỉ subscribe · ghi kích thước payload thực tế (không magic KB).

---

### Phase 6 — FE inbox + Deep Link (App Shell only)

1. **Chỉ** sửa / mở rộng App Shell notify (file Inventory Phase 0) — **cấm** tạo `*NotificationManager` ngoài Shell.  
2. Loading §3.1: Need Now badge → click → Need Soon panel → scroll → Need Maybe history.  
3. API: count/summary cho badge; cursor+limit cho panel/history — **cấm** full notifications.  
4. Policy script: Auth + Idle (Task 4).  
5. Mark read qua API (PS-1.0) — theo item đã hiện, không Startup.  
6. Cấm kéo Interactive IX chỉ vì mở chuông.  
7. Cấm prefetch 100 bài khi click notify.

**Exit:** 6 loại deep link đúng · Necessity đúng §3.1 · Owner UI = Shell · không regression `/community/feed`.

---

### Phase 7 — Verify Production → đóng task

#### Nghiệp vụ (SoT Domain §9)

- [x] Foundation Follow thống nhất  
- [x] Không Like icon cho Follow  
- [x] Entity = Watchlist  
- [x] Follow User hoạt động  
- [x] Matrix đúng · không ngoài SoT  
- [x] Deep link đúng (href từ inbox DTO)  
- [x] Admin / BE / FE cùng SoT  

#### Runtime / Loading / Ownership

- [x] Notification UI Owner = App Shell (không Manager theo Feature)  
- [x] Business Event publish only · Notification subscribe  
- [x] Badge Need Now · Panel Need Soon · History Need Maybe (Xem thêm cursor)  
- [x] Không API full followers / following / notifications  
- [x] Chuông Auth + Idle  
- [x] Store/Provider đúng PA  
- [x] Không `SELECT *` / body trên list notify/follow  
- [x] IR-001 không bị phá *(feed API vẫn live)*  
- [x] Cold `/cong-dong` vẫn feed DTO *(GET `/api/community/feed` 200)*  

**Trạng thái:** Deploy Prod 2026-07-24 · migration `024` · API + Event Bus smoke PASS · CF purged. Owner hard refresh để xác nhận UI chuông/hồ sơ.

---

## 5. Thứ tự khi Owner bảo «làm»

```text
0 Inventory + Ownership Shell lock
1 Contract (Event Bus + Forbidden API + Necessity)
2 Icon residual
3 Admin mẫu
4 Follow User (count/exist/cursor — không full list)
5 Emit via subscribers 5.1 → 5.3
6 Shell inbox (Need Now/Soon/Maybe)
7 Verify → đóng
```

Có thể duyệt **toàn bộ Plan** hoặc chỉ **Phase 0–1** trước.

---

## 6. Cấm (danh sách đỏ)

- `CommunityNotificationManager` / `EntityNotificationManager` / `CommentNotificationManager` / panel-badge ngoài Shell  
- Business gọi trực tiếp Notification (+ Achievement/Mail) trong cùng hàm  
- Full `GET followers` / `GET following` / `GET notifications` history dump  
- Framework Notify / Repository thừa khi Shell + API đủ  
- Hydrate `posts?limit=100` / đổi mặc định list legacy vì notify  
- Polling follower graph trên client  
- Startup kéo panel + history + mark read + avatar  
- Nâng `inapp-notifications` lên Startup (trái Task 4 + §3.1)  
- CSS/class ngoài DS  
- Watchlist logic song song  
- Gộp Like + Follow một component  
- Code trước Phase đã duyệt  

---

## 7. Điểm chờ Owner chốt

| # | Câu hỏi | Mặc định Plan |
|---|---------|----------------|
| 1 | Khóa SoT Domain Draft → v1.0 LOCKED? | Sau khi Owner đọc file `docs/` |
| 2 | Thiếu mẫu «User đăng bài» → thêm ở Phase 3? | Có |
| 3 | Follow User UI chỉ một surface hồ sơ trong task này? | Có (đề xuất) |
| 4 | Duyệt Plan toàn bộ hay chỉ Phase 0–1? | — chờ Owner |

---

## 8. Lịch sử

| Ngày | Việc |
|------|------|
| 2026-07-24 | Plan đưa vào `docs/` từ chat; SoT Domain file tạo cùng đợt |
| 2026-07-24 | Reviewer: + Ownership Shell · Event publish/subscribe · Necessity badge/panel/history · Forbidden full list API |
