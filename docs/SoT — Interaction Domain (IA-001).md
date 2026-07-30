# SoT — Interaction Domain (IA-001)

**Mã:** IA-001  
**Feature:** Interaction  
**Trạng thái:** Phase 1 Architecture Draft PASS — Domain khóa kinds/Counter; Guest → IP  
**Ngày:** 2026-07-24  
**Persistence:** Follow **PS-1.0** (LOCKED)  
**Authorization:** Follows **IP-001** — **không** chứa Guest YES/NO matrix trong file này.  
**Counter Owner:** **chỉ** Interaction Summary projection — không CommentStore / CommunityStore / UI / API client tự authoritative `stats++`

---

## 1. Mục đích

Định nghĩa **Domain lõi** Interaction: kinds, counter owner, event boundary, anti-pattern.  
Không định nghĩa Presentation host (IU) · Permission matrix (IP) · Bundle load (IR) · Ownership chain (IO).

---

## 2. Interaction kinds (vocabulary)

| Kind | Mô tả | Ghi chú |
| --- | --- | --- |
| `comment` | Bình luận gốc | |
| `reply` | Trả lời comment | |
| `like` | Thích nội dung (bài / comment tùy target policy) | ≠ Follow |
| `share` | Chia sẻ + (khi có) share **counter** | ≠ Insight Export |
| `reaction` | Phản ứng mở rộng (sau v1 nếu bật) | |
| `bookmark` | Kind trong vocabulary | **Target rules → Bookmark Extension v1** |
| `mention` | Reserved | Chưa Impl bắt buộc v1 |
| `report` | Reserved | Chưa Impl bắt buộc v1 |

### Ngoài Domain Interaction

| Hiện tượng | Owner đúng |
| --- | --- |
| Follow ticker / story (Heart Foundation) | Watchlist — **không** là Interaction kind |
| Insight Share / Export Insight | Insight Engine / Share Action |
| Feature-request like | Product Feedback |

**V-IA-02:** cấm dùng cùng semantics `ti-heart` cho `like` và Follow mà không phân biệt Catalog/icon contract (IU).

---

## 3. Counter Owner

**Counter Owner duy nhất** = **Interaction Summary projection** (server-backed counts).

| Luật | |
| --- | --- |
| Ai cập nhật counter | API success / projection refresh — **không** UI tự `stats++` làm SoT |
| Summary payload | **Counts-only** — cấm nhúng `comments:[]` đầy đủ trong Summary API |
| Feed / badge / ActionBar Summary | Chỉ đọc projection |
| Interactive list | Hydrate thread riêng — không thay Counter Owner |

Map Phase 0: **V-IA-01**.

---

## 4. Event Boundary

```text
Component → emit Action
Action → Permission (IP) → API → Store
API/Store success → emit Domain Event (optional bus)
Consumers (feed badge, analytics) → nghe Event / đọc Summary
Consumers KHÔNG subscribe InteractionStore nội bộ để “lấy lậu” thread
```

**Anti-pattern:** Comment mutation → trực tiếp mutate Feed card DOM/store khác Feature.

---

## 5. Persistence mapping (tham chiếu PS-1.0)

| Data | Authoritative | Client |
| --- | --- | --- |
| Comment / Reply / Like / Bookmark / Share counter | API | Memory Store; LS chỉ cache/draft/queue theo PS |
| Composer draft | Draft (PS-002) | Memory + LS draft OK |
| Sort / filter UI | UI State | session/LS OK |

Legacy `iflux_stock_comments_v6` = **vi phạm PS** (V-PS-01) — migrate Phase 4.

---

## 6. Bookmark Extension v1 (không nhúng cứng trong Domain)

| | |
| --- | --- |
| Kind | `bookmark` vẫn thuộc vocabulary IA-001 |
| Target rules v1 | post / article / story |
| Out v1 | stock / sector / ecosystem → Watchlist Follow |
| Tách sau | Có thể thành Bookmark Feature — IA chỉ còn kind reference |

Chi tiết: `docs/SoT — Bookmark Extension v1.md`.

> **Không nhầm với Thread:** Out v1 ở bảng trên chỉ áp dụng **bookmark/follow**.  
> Thread comment trên `stock` / `sector` / `family` / `story` = **Interaction v1** (§6b) — không phải Watchlist.

---

## 6b. Thread Target Registry v1 (Owner PASS Q-4.4-A · 2026-07-24)

**Nguyên tắc:** Interaction là **platform capability** — sở hữu Thread theo cặp `(entityType, entityId)`.  
Không phụ thuộc business Stock / Sector / Family / Story / Post. Domain chỉ cung cấp type + id.

### Registry ĐÓNG v1

| entityType (canonical) | Thực thể sản phẩm | Alias chấp nhận |
| --- | --- | --- |
| `post` | Bài viết Cộng đồng | `article` → `post` |
| `stock` | Cổ phiếu | — |
| `sector` | Ngành | — |
| `family` | Hệ sinh thái | `ecosystem` → `family` |
| `story` | Chủ đề (`/cau-chuyen`) | — |

- Mở `entityType` mới (watchlist, portfolio, event…) = **Update SoT + Regenerate RC** — **CẤM** tự thêm trong Impl (PG-008).
- **Ngoài Interaction:** Follow ticker / story (Heart / Watchlist) — không phải Thread/Like Interaction.

### Platform rule (KHÓA)

> Mọi thực thể cần tương tác xã hội (Like, Bình luận, Chia sẻ counter…) **đi qua Interaction**.  
> **CẤM** tạo hệ bình luận / like riêng theo từng domain.
---

## 7. IA-001 KHÔNG chứa

- Bảng Guest / User / Premium × action  
- Hardcode “stock không bookmark” như luật Domain vĩnh viễn  
- Presentation matrix (§7.1 → IU)  
- Bundle / hydrate rules (→ IR)  

---

## Exit IA-001

- [x] Kinds + ngoài-domain  
- [x] Counter Owner = Summary projection  
- [x] Event boundary + anti-pattern  
- [x] Follow PS + IP — không Guest matrix  
- [x] Bookmark = Extension  
- [ ] Owner / Architecture PASS  
