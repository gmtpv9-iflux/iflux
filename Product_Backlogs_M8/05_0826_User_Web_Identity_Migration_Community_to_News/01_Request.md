# 01_Request — User Web Identity Migration: Community → News

| Field    | Value                                                   |
| -------- | ------------------------------------------------------- |
| Platform | User Web · Admin · Backend · Database · Runtime         |
| Module   | User Web Page Identity                                  |
| Task     | `05_0826_User_Web_Identity_Migration_Community_to_News` |
| Status   | **REQUEST — Chờ Audit**                                 |
| Owner    | Requester + Product/Architecture Owner                  |

---

## 1. Background

Task trước đã hoàn thành việc chuẩn hóa **display** và **URL**:

* Cộng đồng → Tin tức.
* `/cong-dong` → `/tin-tuc`.

Tuy nhiên đây **chưa phải identity migration**.

Hiện tại hệ thống vẫn còn sử dụng `community` như technical identity ở nhiều layer (pageKey, folder, registry, runtime, backend, database, widget, publish, entitlement, SEO...).

Task trước được xem là **đã đóng đúng scope**, vì scope chỉ là display + URL.

Task này tồn tại để **hoàn tất identity migration** còn thiếu.

---

## 2. Business Goal

Chuẩn hóa hoàn toàn technical identity của User Web Page **Tin tức**.

Target cuối cùng:

| Hiện tại    | Target |
| ----------- | ------ |
| `community` | `news` |
| `Community` | `News` |
| `COMMUNITY` | `NEWS` |

Identity này áp dụng cho **User Web Page Tin tức** trên toàn hệ thống.

Mục tiêu cuối cùng là không còn technical identity `community` đại diện cho User Web Page Tin tức.

---

## 3. Phạm vi yêu cầu

Audit toàn bộ hệ thống để tìm mọi dấu tích của identity `community` liên quan đến User Web Page Tin tức.

Bao gồm nhưng không giới hạn:

* Page Key.
* Folder / file / manifest.
* Route registry.
* Runtime registry.
* Widget registry.
* Composition.
* Catalog.
* Entitlement.
* SEO contract.
* Publish contract.
* User-data.
* Notification mapping.
* Backend service.
* API contract.
* Database table / column / enum / view / seed / migration.
* Cache / reader / writer / scheduler.
* Admin representation.
* Internal registry / constant / config.

Tìm toàn bộ các biến thể:

* `community`
* `Community`
* `COMMUNITY`

---

## 4. Ngoài phạm vi

Không implementation.

Không rename.

Không migration.

Không commit.

Không push.

Không deploy.

Không Production.

Không Solution.

Không Plan.

---

## 5. Audit Deliverable

Audit phải trả về đầy đủ:

### A. Identity Inventory

Liệt kê toàn bộ nơi còn dùng:

* `community`
* `Community`
* `COMMUNITY`

### B. Classification

Phân loại từng usage:

* Page Identity
* Runtime Identity
* Widget Identity
* Backend Identity
* Database Identity
* API Contract
* SEO / Publish
* Admin Module
* Domain Model
* Historical / Comment / Documentation
* Khác

### C. Migration Target

Với từng usage:

| Current | Target | Layer | Impact |
| ------- | ------ | ----- | ------ |

Target mặc định là `news`, `News`, `NEWS` nếu đó là User Web Page Identity.

Nếu phát hiện usage **không được phép đổi** vì thuộc domain khác thì ghi rõ lý do.

### D. Dependency Graph

Cho biết identity `community` đang được tiêu thụ ở đâu và ghi ra toàn bộ producer / consumer.

### E. Collision / Risk

Đánh dấu mọi nơi đổi tên có thể ảnh hưởng:

* Runtime.
* Publish.
* Widget binding.
* API.
* DB.
* Cache.
* Persisted data.
* Admin.

### F. Stop List

Những nơi cần Owner quyết định trước khi implementation.

---

## 6. Acceptance của Audit

Audit chỉ PASS khi:

* Không bỏ sót bất kỳ usage `community` nào thuộc User Web Page Tin tức.
* Có inventory đầy đủ.
* Có dependency đầy đủ.
* Có migration target cho từng usage.
* Có risk map.
* Có stop list.

---

## 7. Governance

Đây là **AUDIT ONLY**.

Sau Audit sẽ tạo:

* `04_Solution.md`
* `05_Plan.md`

cho task identity migration này.

Không được tự chuyển sang implementation.
