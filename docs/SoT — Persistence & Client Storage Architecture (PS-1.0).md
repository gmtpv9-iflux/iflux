# SoT — Persistence & Client Storage Architecture (PS-1.0)

**Mã:** PS-1.0  
**Tầng:** Platform / Core (không thuộc Feature Interaction, Watchlist, Dashboard…)  
**Trạng thái:** **LOCKED** — Owner duyệt 2026-07-24 (Task 6 Q0)  
**Ngày:** 2026-07-24  
**Mục đích:** Một Source of Truth cho **cách client lưu dữ liệu** trên toàn User Web (và nguyên tắc dùng chung cho Admin sandbox nếu chia key).

> Feature (Interaction, Watchlist, Dashboard, Theme…) **không** tự định nghĩa lại quy tắc localStorage.  
> Feature chỉ **tham chiếu PS-1.0** + (nếu cần) bảng mapping riêng theo data type.

---

## 0. Nguyên tắc gốc

### One Source of Truth per data type

Mỗi loại dữ liệu có **đúng một** authoritative source. Các lớp còn lại chỉ là bản sao / tạm / UI.

| Lớp | Vai trò mặc định |
| --- | --- |
| **API / Server** | Business SoT (Comment, Like, Bookmark, Watchlist sync, Plans…) |
| **Memory Store** | Runtime SoT trong phiên (sau hydrate từ API) |
| **localStorage** | Cache / Draft / UI State / Offline Queue — **không** business SoT |
| **sessionStorage** | Session UI / tab-scoped state |
| **IndexedDB** | Offline lớn / blob (nếu Owner bật sau) — không business SoT |
| **Cookie** | Auth/session transport do server quy định (ưu tiên HttpOnly) — không nhét business payload |

---

## PS-001 — Storage Ownership

1. **Owner duy nhất của client persistence adapter** = **Persistence Layer** (platform module / adapter), không phải UI Feature.  
2. Feature Store (InteractionStore, WatchlistStore…) **chỉ** gọi Persistence Adapter — **cấm** UI gọi `localStorage.setItem` / `getItem` trực tiếp cho dữ liệu nghiệp vụ hoặc cache Interaction.  
3. **CẤM:**

```text
Comment UI → localStorage
Stock UI → localStorage
Feed Card → localStorage
```

4. **ĐÚNG:**

```text
UI → Feature Store → Persistence Adapter → localStorage | sessionStorage | memory
UI → Feature Store → API
```

5. Key naming: đăng ký trong catalog keys platform (ví dụ `User_App/shared/storage-keys.json` hoặc SoT Key Registry sau này). Key nghiệp vụ legacy (`iflux_stock_comments_v6`, `iflux_community_v*`) = **vi phạm PS-1.0** — phải migrate / purge theo Feature plan.

---

## PS-002 — Persistence Types (phân loại dữ liệu)

| Loại | Định nghĩa | Authoritative SoT |
| --- | --- | --- |
| **Business data** | Comment, Reply, Like, Bookmark, Reaction, Share counter, Watchlist membership (server), Orders… | **API** |
| **Draft** | Nội dung chưa gửi (composer, bài nháp) | Memory + được phép localStorage |
| **Cache** | Bản sao đọc từ API để giảm round-trip | API vẫn SoT; LS chỉ mirror có TTL |
| **Offline Queue** | Hàng đợi mutation khi mất mạng | API vẫn SoT khi flush thành công |
| **UI State** | Tab mở, sort, filter, theme, layout collapse, recently UI prefs | Không cần API; LS / sessionStorage / memory |
| **Session** | Cờ phiên tab (wizard step…) | sessionStorage / memory |

---

## PS-003 — Allowed vs Forbidden trên localStorage

### Được phép (PS-002)

- Draft  
- Cache (có TTL / invalidate)  
- Offline Queue  
- UI State  

### Cấm authoritative trên localStorage

Không được coi localStorage là nguồn sự thật của:

- Comment / Reply  
- Like / Unlike  
- Bookmark / Favorite  
- Reaction  
- Share **counter** (số đếm)  
- Mọi business list/thread tương đương  

**PS-003a:** Ghi cache tạm của business data **chỉ** sau khi đã có từ API, và **không** dùng để overwrite Store khi hydrate (xem PS-004).

---

## PS-004 — Hydration Rules

### Đúng (business)

```text
API → Memory Store → (optional) localStorage cache
```

### Cấm (business)

```text
localStorage → overwrite Memory Store
```

trừ khi dữ liệu thuộc **Draft** hoặc **UI State** (không phải business authoritative).

### Offline Queue

```text
UI mutation → Queue (LS) → khi online → API → Store → purge queue item
```

Không được: Queue thành công ảo mà không bao giờ gọi API rồi coi như đã persist.

---

## PS-005 — Offline Queue

1. Queue chỉ chứa **intent mutation** (kind, target, payload tối thiểu), không phải toàn bộ SoT dataset.  
2. Sau `API success` → xóa item queue; cập nhật Memory Store từ response / re-fetch.  
3. Conflict / 403 / validation → surface Error; không im lặng ghi LS như đã thành công.  
4. Feature quyết định *có* bật queue hay không; **cách** queue tuân PS-1.0.

---

## PS-006 — Storage Adapter

1. Mọi đọc/ghi LS/session/IDB đi qua **Persistence Adapter** (một API nội bộ platform).  
2. Adapter chịu trách nhiệm: key namespace, version, JSON parse an toàn, quota error.  
3. Feature **không** fork adapter riêng cho cùng một storage engine.  
4. Adapter **không** chứa business rules Interaction/Watchlist — chỉ storage I/O + policy hooks (TTL).

---

## PS-007 — TTL / Cache Policy

| Cache class | TTL mặc định (DRAFT — Owner có thể chỉnh khi duyệt) | Invalidate |
| --- | --- | --- |
| InteractionSummary counts | **30s** (**KHÓA** Owner Q0) hoặc until next API refresh (short) | Mutation like/comment thành công; pull-to-refresh; navigation soft revalidate |
| Entity/list business cache | Theo Feature (không dài hơn session nếu chưa có ETag) | API version / explicit invalidate |
| Draft | Không TTL bắt buộc; clear sau submit success | User discard |
| UI State | Không TTL bắt buộc | User reset / logout (nếu key gắn user) |

**CẤM:** mỗi module tự đặt TTL khác nhau cho cùng class dữ liệu mà không đăng ký vào bảng PS-007 (hoặc bảng con Feature reference).

---

## Ma trận lớp lưu trữ (Platform)

| Storage | Vai trò |
| --- | --- |
| Memory Store | Runtime SoT sau hydrate |
| localStorage | Cache / Draft / UI State / Offline Queue |
| sessionStorage | Session / tab UI |
| IndexedDB | Offline lớn (optional, Owner bật) |
| Cookie | Auth/session theo server |
| API | Business SoT |

---

## Ma trận tham chiếu mẫu (business vs tạm)

| Data | SoT | Memory Store | localStorage | sessionStorage |
| --- | --- | --- | --- | --- |
| Comment / Reply | API | YES (mirror) | Cache only (không authoritative) | NO |
| Like | API | YES | Cache only | NO |
| Bookmark | API | YES | Cache only | NO |
| Reaction | API | YES | Cache only | NO |
| Share counter | API | YES | NO (hoặc cache counts ngắn — không authoritative) | NO |
| Draft comment | Không API cho đến submit | YES | YES | NO |
| Offline Queue | API khi flush | YES | YES | NO |
| UI State (tab, sort, theme…) | Không | YES | YES | YES |

Feature Interaction / Watchlist… copy bảng con trong SoT Feature: **“Follow PS-1.0”** + mapping dòng data type — không viết lại PS-001…007.

---

## Quan hệ với Feature SoT

| Feature SoT | Cách dùng PS-1.0 |
| --- | --- |
| IA-1.0 Interaction | `Persistence: Follow PS-1.0` + bảng Interaction Data → policy |
| Watchlist / Theme / Dashboard / Widget Placement / Search history… | Cùng pattern |

**Trình tự:** Duyệt **PS-1.0** trước khi khóa Persistence trong **IA-1.0 Phase 1**. IA Phase 0 Inventory được phép ghi AS-IS vi phạm PS-1.0 (ví dụ `iflux_stock_comments_v6`).

---

## Exit Criteria (PS-1.0 Gate — tài liệu)

- [x] Owner duyệt PS-001…PS-007 (Task 6 Q0 — 2026-07-24)  
- [x] TTL InteractionSummary counts = **30s** khóa  
- [ ] Không còn Feature SoT tự định nghĩa “localStorage chỉ dùng…” trùng / lệch PS-1.0 (enforce khi Impl)  
- [x] Key nghiệp vụ legacy liệt kê non-compliant (Phase 0 Inventory)  
- [ ] Adapter Ownership module đích khi thi công Platform

---

## Ngoài phạm vi PS-1.0

- Schema API từng Feature  
- UI component  
- Server DB  
- Cloudflare / CDN cache  

---

**Neo AS-IS (không phải SoT đúng):** `iflux_stock_comments_v6` (business trong LS), `iflux_community_v1/v2` (đã purge phía CommunityStore), `storage-keys.json` còn liệt kê community/stockComments — cần cập nhật khi migrate.
