# SoT — Follow & Notification Domain

**Mã:** FN-001  
**Version:** Draft v1.0  
**Ngày neo chat:** 2026-07-24  
**Trạng thái:** DRAFT — chờ Owner khóa trước Plan thi công wiring  
**Phạm vi:** Nghiệp vụ Follow + ma trận Notification — **không** mô tả cách code  

**Cross-ref (bắt buộc khi Plan / Impl):**

| SoT | Vai trò |
|-----|---------|
| `SoT — iFlux Product Architecture` (PA) | Hierarchy · Foundation · App Shell · Data Provider |
| `SoT — Interaction Domain (IA-001)` | Like ≠ Follow · Thread / Like / Share thuộc Interaction |
| `SoT — Interaction UI (IU-001)` | Icon contract Like vs Follow |
| `SoT — Bookmark Extension v1` | Bookmark ≠ Follow Entity (stock/sector/eco → Watchlist) |
| `SoT — Persistence (PS-1.0)` | Follow / Notification inbox = API SoT |
| `SoT — Interaction Resource Loading (IR-001)` | Summary ≠ Interactive khi đụng Like/Reply |
| `SoT — Resource Loading Strategy (Task 4)` | Chuông / inbox: Auth + Idle |
| `SoT — Plan Phase Governance (PG-1.0)` | Plan duyệt → mới thi công |
| **Plan task** | `docs/Plan — Follow & Notification (FN-001).md` |

---

## 1. Mục tiêu

Hệ thống Interaction hiện đã định nghĩa rõ ba hành động:

* Thích (Like)
* Bình luận (Comment)
* Chia sẻ (Share)

Tuy nhiên **Theo dõi (Follow)** vẫn chưa được định nghĩa đầy đủ. SoT này bổ sung định nghĩa Follow, ranh giới với Watchlist và Like, đồng thời xác định ma trận Notification tương ứng.

---

## 2. Nguyên tắc

### 2.1 Follow không phải Like

Like thể hiện sự yêu thích đối với một nội dung.

Follow thể hiện mong muốn theo dõi các hoạt động trong tương lai.

Hai hành vi có ý nghĩa hoàn toàn khác nhau và không được dùng chung biểu tượng, component hoặc semantics.

### 2.2 Follow không phải Bookmark

Bookmark dùng để lưu một nội dung.

Follow dùng để theo dõi một đối tượng.

Không được trộn lẫn hai khái niệm.

### 2.3 Follow có hai loại

#### Follow Thực thể

Đối tượng gồm:

* Cổ phiếu
* Ngành
* Hệ sinh thái
* Câu chuyện (Story / Chủ đề — theo Product URL SoT hiện hành)

#### Follow User

Đối tượng là một người dùng khác trong hệ thống.

Hai loại Follow này có nghiệp vụ khác nhau nhưng sử dụng cùng Foundation Follow trong Design System.

---

## 3. Follow Thực thể

### 3.1 Ý nghĩa

Follow Thực thể chính là Watchlist.

Khi người dùng Follow một thực thể thì thực thể đó được lưu vào Watchlist.

Không tạo một cơ chế lưu trữ thứ hai.

### 3.2 Design System

Design System phải có Foundation Follow riêng.

Nếu chưa tồn tại thì bổ sung:

* token
* foundation
* action component
* icon

Sau khi Foundation Follow được bổ sung, toàn bộ nút Theo dõi Thực thể phải sử dụng Foundation này.

Không được tiếp tục sử dụng biểu tượng trái tim.

### 3.3 Hardcode

Sau khi thay đổi Foundation,

mọi vị trí vẫn còn hiển thị biểu tượng cũ đều được xem là hardcode.

Phải được loại bỏ.

---

## 4. Follow User

Follow User là quan hệ giữa hai người dùng.

Không liên quan Watchlist.

Không liên quan Bookmark.

Không liên quan Like.

Follow User chỉ thể hiện mong muốn nhận thông tin về các hoạt động công khai của người được Follow.

---

## 5. Notification Matrix

### 5.1 Follow Thực thể

Người theo dõi thực thể sẽ nhận thông báo khi:

Hệ thống xuất hiện **một bài viết mới** có gắn thẻ chính thực thể đó.

Ví dụ:

User Follow HPG  
↓  
Có bài viết Community được Publish và gắn tag HPG  
↓  
Thông báo.

Không gửi thông báo trong các trường hợp:

* chỉ nhắc tên HPG trong nội dung
* bình luận nhắc HPG
* trả lời bình luận nhắc HPG
* bất kỳ trường hợp nào không phải bài viết mới được gắn tag

Mục tiêu là tránh Notification Bomb.

Khi người dùng mở Notification, hệ thống phải điều hướng đến trang chi tiết bài viết.

### 5.2 Follow User

Người theo dõi User sẽ nhận thông báo khi User đó tạo nội dung mới.

Bao gồm:

**A.** Đăng bài viết Community mới → Thông báo.

**B.** Chia sẻ một bài viết → Thông báo.

**C.** Đăng một bình luận gốc tại trang chi tiết Thực thể. Bình luận này được xem là một dạng nội dung do User tạo → Thông báo.

Không gửi thông báo khi:

* trả lời bình luận của người khác
* chỉnh sửa bình luận
* thích bài viết
* thích bình luận
* Follow người khác
* cập nhật hồ sơ
* đổi avatar
* các hoạt động không tạo nội dung mới

Khi mở Notification, hệ thống điều hướng tới đúng bài viết hoặc đúng bình luận tương ứng.

### 5.3 Notification đặc biệt

Nếu người dùng đã tham gia một cuộc thảo luận thì sẽ nhận Notification khi:

**A.** Có người thích trực tiếp bình luận của mình → Đi đến bình luận.

**B.** Có người trả lời trực tiếp bình luận của mình → Đi đến đúng thread.

Không gửi Notification khi:

* người khác trả lời bình luận của người khác trong cùng thread
* người khác thích bình luận không phải của mình

---

## 6. Notification Catalog

Hệ thống tối thiểu phải hỗ trợ các nhóm Notification sau:

* Theo dõi Thực thể có bài viết mới
* User được Follow đăng bài viết mới
* User được Follow chia sẻ bài viết
* User được Follow đăng bình luận gốc tại trang Thực thể
* Bình luận của bạn được thích
* Bình luận của bạn được trả lời trực tiếp

Mỗi Notification phải có:

* tiêu đề
* nội dung
* icon
* deep link
* thời gian
* trạng thái đã đọc / chưa đọc

**Mirror Admin (tạm — không thay SoT):** mã mẫu trong `system-notification-catalog` (NOTIF-USER-011…015 và mẫu bổ sung nếu thiếu nhóm «User đăng bài»). Catalog JS phải bám §5–§6; xung đột → sửa catalog theo SoT này.

---

## 7. Deep Link

Mỗi Notification phải điều hướng đúng đối tượng.

| Loại Notification | Điều hướng |
| ----------------- | ---------- |
| Entity Follow | Trang chi tiết bài viết |
| User đăng bài | Trang chi tiết bài viết |
| User chia sẻ bài | Trang chi tiết bài được chia sẻ |
| User bình luận gốc | Trang chi tiết Thực thể và cuộn tới bình luận |
| Comment Like | Bình luận được thích |
| Comment Reply | Thread của bình luận |

URL công khai: slug tiếng Việt theo Product / `IfluxSeoUrl` (không hardcode path English mới).

---

## 8. Kiến trúc (nghiệp vụ)

Follow chỉ định nghĩa **quan hệ theo dõi**.

Notification chỉ là **một Consumer** của các sự kiện phát sinh từ quan hệ Follow (và từ Interaction khi §5.3).

Business Event và Notification phải được tách biệt.

```text
Business Event = publish only
Notification   = subscribe only
```

Business **không** gọi Notification trực tiếp.  
Analytics / Achievement / Mail (nếu có) cũng là subscriber độc lập — không nhét vào cùng lời gọi nghiệp vụ với Notification.

Notification không được trở thành nguồn dữ liệu của Follow.

**Notification UI (Product):** chỉ **App Shell** sở hữu badge, unread count, dropdown/panel. Community / Entity / Comment không sở hữu UI Notification riêng.

**API list (Product constraint):** không dump full followers / following / notification history; dùng count / exist / cursor / limit.

---

## 9. Tiêu chí hoàn thành (nghiệp vụ)

Task chỉ được xem là hoàn thành khi:

* Design System có Foundation Follow thống nhất.
* Không còn sử dụng biểu tượng Like cho Follow.
* Không còn hardcode icon Follow.
* Follow Thực thể hoạt động trên Watchlist hiện có.
* Follow User được định nghĩa rõ và hoạt động.
* Toàn bộ Notification Matrix hoạt động đúng theo SoT.
* Deep Link chính xác.
* Không phát sinh Notification ngoài các trường hợp được định nghĩa trong SoT.
* Backend, Frontend và Admin đều tuân thủ cùng một Source of Truth.

**Bổ sung Exit kỹ thuật (Plan FN-001):** PA Data Provider · IR-001 · Task 4 Auth+Idle chuông · PS-1.0 · không over-fetch / không `SELECT *` public list — chi tiết trong Plan.

---

## 10. Lịch sử

| Version | Ngày | Ghi chú |
|---------|------|---------|
| Draft v1.0 | 2026-07-24 | Neo từ chỉ thị Owner (chat); đưa vào `docs/` |
| Draft v1.0+ | 2026-07-24 | §8: Event publish/subscribe · Shell owns UI · API không full dump (khớp Plan review) |
