# SoT — Interaction API & Store (IA-003)

**Mã:** IA-003  
**Feature:** Interaction  
**Trạng thái:** Architecture + **Q-4.4 Contract KHÓA** (Owner PASS 2026-07-24)  
**Ngày:** 2026-07-24  
**Persistence:** Follow **PS-1.0**  
**Baseline:** Phase 0 API inventory · V-PS-02 · V-IA-01 · Phase 4 Q-4.4-A…D  
**Target registry:** IA-001 §6b

---

## 1. Mục đích

Một **InteractionStore** + API surface thống nhất cho kinds IA-001.  
Summary API **counts-only**. Comment list ≠ Summary payload.  
Thread keyed by `(entityType, entityId)` — không schema riêng theo domain.

---

## 2. Store

| | Luật |
| --- | --- |
| Tên đích | `InteractionStore` (thay dual Community mem like + Stock LS comments) |
| UI | Không gọi LS/API trực tiếp — qua Store |
| Persistence | Chỉ Persistence Adapter (PS-006) |
| Init | Chỉ Interactive mode (IR-001) |
| Target | `{ type: entityType, id: entityId }` — type ∈ IA-001 §6b registry |

---

## 3. API groups (contract)

| Group | Vai trò | Summary? |
| --- | --- | --- |
| **Summary** | `GET …/interaction/summary?type=&id=` → counts-only | **YES** |
| **Thread** | `GET/POST …/threads/{type}/{id}/comments` | NO — Interactive |
| **Mutation** | like / unlike / bookmark / share-bump / reaction | NO — Interactive (+ refresh Summary) |

**CẤM:** Summary response chứa `comments: []` đầy đủ.

---

## 3b. Thread routes (Q-4.4-B · KHÓA)

### Canonical (TO-BE)

```text
GET  /api/interaction/v1/threads/{entityType}/{entityId}/comments
POST /api/interaction/v1/threads/{entityType}/{entityId}/comments
GET  /api/interaction/v1/summary?type={entityType}&id={entityId}
```

`entityType` ∈ registry IA-001 §6b (sau normalize alias).

### Alias bắt buộc (tương thích Phase 3 post)

| Alias (giữ tới cutover post) | Map tới |
| --- | --- |
| `GET/POST /api/community/articles|posts/:idOrSlug/comments` | Thread `post` + resolve id/slug |
| Summary post AS-IS (nếu đã mount) | Cùng projection Summary `type=post` |

**CẤM** hai schema Thread song song lâu dài — alias chỉ bridge; Store client ưu tiên canonical khi sẵn sàng.

### Comment payload (Interaction only)

| Field | v1 DoD 4.4 | Ghi chú |
| --- | --- | --- |
| `body` | Có | text |
| `image` / `image_url` | Có | AS-IS post đã nhận dataURL |
| `parentId` | **Optional** — không bắt buộc DoD 4.4 | Reply tree = v1.1 trừ Owner khóa sớm |
| Business metadata (tên CP, ngành…) | **CẤM** trong payload | Page/Entity cung cấp ngoài Thread |

---

## 3c. Summary fields (Q-4.4-C · KHÓA)

Counts-only v1 (mọi target trong registry khi surface hỗ trợ):

| Field | DoD 4.4 |
| --- | --- |
| `likes` | Có |
| `comments` | Có |
| `shares` | Có |
| `favorites` | Có nếu target hỗ trợ (post đã có) |
| `views` | Có nếu target hỗ trợ (post đã có) |
| `participantCount` | **Không** DoD 4.4 — sau |

---

## 3d. Cutover LS → API (Q-4.4-D · KHÓA)

Áp dụng `iflux_stock_comments_v6` và mọi surface entity còn LS authoritative:

```text
Từ khi mở Impl Slice 4.4:
  WRITE mới     → chỉ Interaction API (CẤM ghi mới authoritative LS)   [RC-PS-04]
  READ          → API trước; miss → LS legacy (dual-read)
  Migrate       → one-shot LS → API khi dual-read thấy bản ghi LS
  Purge key     → chỉ sau Phase 4 Exit PASS + evidence không còn cần migrate
```

---

## 4. Interest / relevance

`/content/interest` · `/content/relevance` = analytics — **không** thay Like mutation SoT.  
Wire sau (Owner) — không trộn Counter Owner.

---

## 5. Mapping Phase 0 → Phase 3–4

| AS-IS | TO-BE |
| --- | --- |
| CommunityStore.toggleLike mem | Mutation API + Store + Summary refresh |
| StockStore LS comments | API + Store; dual-read → migrate → purge (§3d) |
| hydrateFromApi(100) trên comments page | Thread scoped + Summary riêng |
| Chỉ `/articles/.../comments` | Canonical `/interaction/v1/threads/...` + alias post |

---

## Exit IA-003

- [x] Store + Summary counts-only + Thread tách  
- [x] Cấm Summary nhúng full comments  
- [x] Q-4.4-A…D Owner PASS — registry · routes · summary · cutover  
- [ ] OpenAPI / routes Impl Slice 4.4  
- [ ] Purge LS sau Phase 4 Exit  
