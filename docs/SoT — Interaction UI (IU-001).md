# SoT — Interaction UI & Presentation (IU-001)

**Mã:** IU-001  
**Feature:** Interaction  
**Trạng thái:** DRAFT — §7.1 **KHÓA** (Owner); Catalog chi tiết DS chờ Phase Impl  
**Ngày:** 2026-07-24  
**Ownership mount:** Follow **IO-001**  
**Permission UI state:** Follow **IP-001**

---

## 1. Mục đích

Một **Component Catalog** Interaction; nhiều **Presentation Host** do Resolver chọn.  
Runtime không fork Desktop/Mobile Component. Presentation ≠ thay đổi Domain/Store.

---

## 2. UI Ownership

| Lớp | Owner | Việc |
| --- | --- | --- |
| Catalog components | Design System + IU | ActionBar, CommentList, Composer, reaction chips… |
| Presentation Host | Layout + Resolver (IO) | sidebar / sheet / bar / page / inline |
| Tokens / class | User Web DS (`ifx-*`, `--ifx-*`) | Cấm CSS ad-hoc ngoài DS |
| Icon contract | IU | Phân biệt `like` vs Follow Heart (tránh V-IA-02) |

Component **emit Action** — không fetch, không LS, không `matchMedia` chọn host.

---

## 3. Catalog (v1 tối thiểu)

| Component | Summary | Interactive |
| --- | --- | --- |
| `InteractionSummaryBar` / counts | YES (đọc projection) | Optional mirror |
| `InteractionActionBar` | Optional (CTA → login / open host) | YES |
| `CommentList` | NO | YES |
| `CommentComposer` | NO | YES |
| `ReactionControl` | NO | YES (nếu bật) |

**Một Catalog** — không `CommentComposerMobile` / `CommentComposerDesktop` fork.

---

## 4. §7.1 Presentation Matrix — **KHÓA**

| Presentation | Desktop | Tablet | Mobile |
| --- | --- | --- | --- |
| `inline` | YES | YES | Optional |
| `sidebar` | **YES Primary** | **YES Primary** | NO |
| `bottom-bar` | NO | Optional | **YES Entry** |
| `bottom-sheet` | NO | Optional | **YES Primary Interactive** |
| `page` (`/binh-luan`) | **YES Optional** | **YES Optional** | **YES Secondary / Fallback** |

### Desktop

```text
Primary:   sidebar
Secondary: inline
Optional:  page   ← thread dài / deep-link / moderation / “Xem tất cả”
```

### Mobile

```text
Entry:                 bottom-bar
Primary Interactive:   bottom-sheet
Fallback / Deep:       page
```

Luồng mặc định (chung): **`bottom-bar → bottom-sheet → (khi cần) page`**.  
**CẤM** mặc định `bottom-bar → page` — **trừ Exception bên dưới**.

Chuyển `page` khi: thread sâu · search/sort/filter · moderator · deep link · “Mở trang đầy đủ” từ sheet.

### Exception — Community Post Comments (KHÓA 2026-07-24)

**Surface:** bình luận **bài viết cộng đồng** (`pageKey` ∈ `{ communityPost, comments }` · target `type: post`).

| Role | Mobile |
| --- | --- |
| Entry | `bottom-bar` (ActionBar trên bài) |
| **Primary Interactive** | **`page`** (`/…/binh-luan`) |
| `bottom-sheet` | Chỉ lightweight preview / future — **không** Primary |

Luồng hợp lệ: **`bottom-bar → page`**. Composer cố định đáy trang; Bottom nav + ActionBar article ẩn trên trang bình luận.  
Desktop/Tablet vẫn Primary = `sidebar` (không đổi).

---

## 5. Presentation — tham chiếu IO (không định nghĩa Resolver tại đây)

**§7.1 matrix** (mục 4) = product rules.  
**Ai `resolve()` → presentation** = **IO-003 only** (`IfluxInteractionPresentationResolver`).

IU **không**:

- implement / mô tả lại thuật toán Resolver  
- `if (isMobile)` trong Catalog  
- chọn sidebar / sheet / page trong Component  

IU **có**: Catalog components + Host *là gì* (markup/tokens) sau khi Host đã nhận `presentation` từ IO.

```text
IU §7.1 matrix  →  IO Resolver.resolve(...)  →  presentation  →  Host mount
```

Map Phase 0: **V-IU-01** (thiếu sheet / bar→page) · **V-IU-02** (`matchMedia` trong Component).

---

## 6. State UI (hiển thị)

| State | Nguồn |
| --- | --- |
| counts | Summary projection (IA Counter Owner) |
| list/composer | Interactive Store sau Permission Allow |
| LoginRequired / NoPermission | IP-001 resolve |
| loading / error / empty | IU patterns DS |

---

## 7. Responsive

Breakpoint **chỉ** trong **IO Presentation Resolver** / Layout — không trong Catalog business logic.  
CSS host attribute (sau Resolver set) được phép; Component không tự đoán.

---

## Exit IU-001

- [x] §7.1 matrix khóa  
- [x] Catalog tối thiểu + một Catalog  
- [x] Cấm Component detect mobile  
- [ ] DS atoms đầy đủ khi Impl  
- [ ] Architecture PASS  
