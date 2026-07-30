# Wave 0 — Inventory Production (Template · Widget · Publish)

**Trạng thái:** ✅ **APPROVED (Owner)** · Gap Classification · **Wave 1 Gap A đóng + FLW-001 Resolved** · 2026-07-22  
**Ngày:** 2026-07-22 · **Rev:** Gap Classification + FLW-001 Unknown  
**Neo Plan:** `Plan-Template-Runtime-Publish.md` §6 Wave 0 · §6.5 Step 3  
**Phạm vi:** READ ONLY inventory · **không** sửa SoT/UI/Publish/legacy  

---

## 0. Nguồn dữ liệu

| Nguồn | Dùng |
|-------|------|
| Repo seed Tầng 4 `platform-layers-widgets.js` | `templateRef` Widget (seed) |
| Repo `templates-catalog.js` | 15 Template Admin |
| Repo `template-runtime-map.js` + `legacy-runtime-map.js` | Cửa 1 / cửa 2 |
| ESM `User_Web/iflux-web-ui/widgets/**/index.js` | File module tồn tại? |
| Production API `GET /api/pages/{key}?embed=true` | Artifact đã Publish (spot-check) |

**Hạn chế hệ thống:** Override `templateRef` trên một số môi trường có thể chỉ nằm trong **Admin browser store** (localStorage). Wave 0 **không** đọc được máy Admin cá nhân. Seed + API Published = neo hệ thống. Binding Widget→Template trên Production Admin nếu lệch seed → trạng thái **Unknown / Needs Verification** (xác minh đầu Wave 1 qua DB / API Admin / export — **không** lấy ký ức Owner làm SoT).

---

## 0.1 Định nghĩa cột (quan trọng cho Wave 1)

| Cột | Nghĩa hôm nay | Không nhầm với |
|-----|---------------|----------------|
| **Admin** | Có trong `templates-catalog.js` | — |
| **Implementation(Web)** | **Chỉ trong Wave 1:** được **đại diện bởi** entry trong `template-runtime-map.js` | **Không phải kiến trúc đích.** Đích Plan: Runtime Implementation → Publish → Artifact (Wave 2–3). Map = cầu nối tạm. |
| **Publish** | Cửa 1 resolve được qua map trên (= proxy Implementation Web hôm nay) | Cửa 2 legacy / cửa 3 lazyModule |
| **ESM** | Có thư mục `widgets/<name>/index.js` **ứng viên** gắn Template (theo map đã có hoặc legacy/tên tương đương) | Preview Admin (`templates-preview.js`) hay classic `widget-renderers.js` |

Wave 1 «đăng ký Implementation» = **điền map Template → ESM đã có** trong `template-runtime-map.js` (runtime `web`), **không** invent Registry / store Implementation mới, **không** đồng nhất map với Runtime Implementation đích.

---

## 1. Catalog Template — ma trận Gap

| Template | Admin | Implementation(Web) | Publish (cửa 1) | ESM ứng viên | Gap | Ghi chú |
|----------|:-----:|:-------------------:|:---------------:|--------------|:---:|---------|
| TMP-HEATMAP | ✓ | ✓ | ✓ | `market-heatmap` | — | OK |
| TMP-TREND-LINE | ✓ | ✓ | ✓ | `trend-line` | — | OK |
| TMP-COMMUNITY-LIST | ✓ | ✓ | ✓ | `community-list` | — | OK |
| TMP-COMMUNITY-STORY-TOP | ✓ | ✓ | ✓ | `community-story-top` | — | OK |
| TMP-DIVERGING-BARS | ✓ | ✓ | ✓ | `diverging-bars` | — | OK · seed chưa gắn Widget |
| TMP-SUMMARY | ✓ | ✓ *(Wave1)* | ✓ | `market-overview` | — | Gap A **đã đóng** 2026-07-22 |
| TMP-BREADTH | ✓ | ✓ *(Wave1)* | ✓ | `market-breadth` | — | Gap A **đã đóng** |
| TMP-COLLECTION | ✓ | ✓ *(Wave1)* | ✓ | `watchlist` | — | Gap A **đã đóng** |
| TMP-NET-SUBJECT | ✓ | ✓ *(Wave1)* | ✓ | `flow-subj-net` | — | Gap A **đã đóng** |
| TMP-RANK-PERF | ✓ | ✗ | ✗ | ✗ *(chỉ classic `widget-renderers`)* | **B** | Wave 1 **không** code ESM mới trừ Owner mở scope |
| TMP-FLOW-SUMMARY | ✓ | ✗ | ✗ | ? `flow-score-board` (chưa chứng minh contract) | **B** | FLW-001 Resolved → Gap B |
| TMP-FLOW-RANK-DUO | ✓ | ✗ | ✗ | ✗ | **B** | Chưa dùng seed |
| TMP-FLOW-RANK-SIGNAL | ✓ | ✗ | ✗ | ✗ | **B** | Chưa dùng seed |
| TMP-ZONE-POSITION | ✓ | ✗ | ✗ | ✗ | **B** | Chỉ preview Admin |
| TMP-SR-HISTORY | ✓ | ✗ | ✗ | ✗ | **B** | Chỉ preview Admin |

**Orphan Publish** (id pilot, không trong catalog Admin — giữ, không xóa Wave 1):  
TMP-ARTIFACT-CARD · TMP-MARKET-HEATMAP · TMP-COM-STOCK-HEAT · TMP-COM-STORY-TOP · TMP-COM-ACTIVE  

---

## 1.1 Gap Classification (Owner yêu cầu)

### A — Có ESM · không Implementation(Web)

→ **Wave 1 xử lý:** đăng ký `template-runtime-map` → module đã có.  
→ **Trạng thái 2026-07-22:** **ĐÃ ĐÓNG** (SUMMARY · BREADTH · COLLECTION · NET-SUBJECT).

| Template | ESM | Widget liên quan (seed) |
|----------|-----|-------------------------|
| TMP-SUMMARY | `market-overview` | WGT-MKT-001 (legacy), WGT-MKT-RISK |
| TMP-BREADTH | `market-breadth` | WGT-MKT-002 (legacy) |
| TMP-COLLECTION | `watchlist` | WGT-WAT-001 (legacy) |
| TMP-NET-SUBJECT | `flow-subj-net` | Definition seed |

### B — Không có ESM (hoặc contract chưa chứng minh)

→ **Ngoài phạm vi Wave 1 mặc định** (cần code Widget ESM / chứng minh contract — Owner mở riêng).

| Template | Lý do |
|----------|--------|
| TMP-RANK-PERF | Không `widgets/rank-*` · chỉ classic renderer |
| TMP-FLOW-SUMMARY | Không ESM đúng tên · `flow-score-board` chưa chứng minh = cùng Template |
| TMP-FLOW-RANK-DUO / SIGNAL | Không ESM |
| TMP-ZONE-POSITION / TMP-SR-HISTORY | Chỉ Admin preview |

### C — Legacy only (cửa 2)

→ **Giữ nguyên** Wave 1–3 · cắt ở Wave 4.

Widget seed: WGT-MKT-001 · WGT-MKT-002 · WGT-WAT-001 (+ ~19 WGT khác trong `legacy-runtime-map`, kể cả khi đã có cửa 1).

---

## 2. Risk matrix Widget (seed Tầng 4)

| Status | Số | Ý nghĩa |
|--------|----|---------|
| **PUBLISH_OK** | 10 | Cửa 1 map + ESM |
| **LEGACY_ONLY** | 3 | Chỉ cửa 2 — Gap **C** |
| **WILL_FAIL_PUBLISH** | 4 | Không cửa 1 · không legacy theo id |

### PUBLISH_OK

| Widget | Template |
|--------|----------|
| WGT-COM-001 | TMP-HEATMAP |
| WGT-COM-002 · 003 · 004 | TMP-COMMUNITY-LIST |
| WGT-COM-CHUDE-TOP | TMP-COMMUNITY-STORY-TOP |
| WGT-MKT-004 · 005 · 006 | TMP-HEATMAP |
| WGT-MKT-007 · 008 | TMP-TREND-LINE |

### LEGACY_ONLY — Gap C

| Widget | Template seed | Legacy module |
|--------|---------------|---------------|
| WGT-MKT-001 | TMP-SUMMARY | market-overview |
| WGT-MKT-002 | TMP-BREADTH | market-breadth |
| WGT-WAT-001 | TMP-COLLECTION | watchlist |

### WILL_FAIL_PUBLISH (sau Wave 1 Gap A)

| Widget | Template seed | Gap | Wave 1 |
|--------|---------------|:---:|--------|
| WGT-MKT-RISK | TMP-SUMMARY | — | **Publish cửa 1 OK** sau Gap A |
| WGT-MKT-003 | TMP-RANK-PERF | **B** | Ngoài scope mặc định (cần ESM) |
| WGT-SEC-001 | TMP-RANK-PERF | **B** | Ngoài scope mặc định |
| WGT-FLW-001 | TMP-FLOW-SUMMARY | **B** | **Resolved** · giữ Gap B |

---

## 2.1 WGT-FLW-001 — **Resolved** (Wave 1 Step 1 · 2026-07-22)

| | |
|--|--|
| **Status** | **Resolved** |
| **Verified templateRef** | `TMP-FLOW-SUMMARY` |
| **Evidence** | (1) Production `platform-layers-widgets.js` dòng ~765 = `TMP-FLOW-SUMMARY`. (2) Không có Admin API/DB widget-definition để override. (3) PagePublished `/flow` hiện **không** placement `WGT-FLW-001` (chỉ `WGT-FLW-STAT_STOCK`). (4) Không đọc được localStorage máy Admin → dùng **seed/file Production Admin** làm SoT hiện hành. |
| **Kết luận** | **Gap B** — không có ESM đúng contract; **không** đăng ký Implementation trong Wave 1. |
| **Action tiếp** | Ngoài scope Wave 1 trừ Owner mở phê duyệt code ESM / map `TMP-FLOW-SUMMARY`. `TMP-DIVERGING-BARS` vẫn Ready (đã map) nhưng **không** gắn FLW-001 theo SoT hiện hành. |

Vòng đời đã đóng: `Unknown → Verification → Resolved (Gap B)`.

---

### 2.1b (lịch sử) Unknown — đã supersede

<details>
<summary>Wave 0 Unknown (trước Step 1)</summary>

Seed vs tín hiệu Production mâu thuẫn giả thuyết DIVERGING-BARS; không kết luận được đến khi Step 1 đọc file Production Admin.

</details>

---

## 3. Legacy map (cửa 2) — 22 WGT

MKT-001/002/004/005/006 · PRF-001/002 · WAT-001 · HOME-DASH · FLW-SUBJ-* · FLW-STAT_* · FLW-EX_TM_* · COM-001 · COM-CHUDE-TOP · COM-002  

**Kết luận:** Cắt cửa 2 trước Wave 1–3 = **NO-GO**.

---

## 4. Production API spot-check (2026-07-22)

| pageKey | HTTP | placements | widgets embed | Thiếu `display.module` | renderSpec.templateId (mẫu) |
|---------|------|------------|---------------|------------------------|-----------------------------|
| community | 200 | 4 | 4 | 0 | **TMP-LEGACY** ×4 |
| flow | 200 | 1 | 1 | 0 | TMP-LEGACY ×1 |
| market | 200 | 0 | 0 | — | (chưa Publish placement?) |
| home | 404 | — | — | — | Chưa có PagePublished |

**Ý nghĩa:** Artifact đang chạy có module (Publish cũ qua legacy/debt) nhưng stamp **TMP-LEGACY** — re-publish sau khi Gap A đóng. Không chứng minh Admin store hiện tại.

---

## 5. Ưu tiên Wave 1 (sau Gap Classification)

1. ~~**Step 1 — Verify FLW-001**~~ → **Resolved = TMP-FLOW-SUMMARY · Gap B** (2026-07-22).  
2. ~~**Gap A — đăng ký Implementation Web**~~ → **DONE** SUMMARY · BREADTH · COLLECTION · NET-SUBJECT (Production API restarted).  
3. **Gap B — không code ESM** trừ Owner mở scope (RANK-PERF · FLOW-SUMMARY · ZONE · SR).  
4. **Gap C — giữ** cửa 2.  
5. Re-publish community/flow khi Admin Publish lại (xóa stamp TMP-LEGACY) — thao tác Admin, không tự.  
6. **Cấm:** refactor Runtime · invent Registry · cắt cửa 2 · đồng nhất `template-runtime-map` = Runtime Implementation đích.

---

## 5.1 Wave 1 Exit checklist

| Tiêu chí | TT |
|----------|-----|
| FLW-001 Unknown → Resolved | ✅ Gap B |
| Gap A map + resolve | ✅ |
| Legacy cửa 2 giữ | ✅ |
| Gap B không code ESM | ✅ |
| Không Registry / không refactor Runtime | ✅ |
| Message Publish thiếu Implementation rõ hơn | ✅ `resolvers.js` |

---

## 6. Exit Wave 0

| Tiêu chí | TT |
|----------|-----|
| Catalog Template đủ + gap map | ✅ |
| **Gap Classification A / B / C** | ✅ *(bổ sung theo Owner)* |
| Risk matrix Widget seed | ✅ |
| Legacy count / rủi ro cắt sớm | ✅ |
| Spot-check Production PagePublished | ✅ |
| FLW-001 | ✅ ghi **Unknown / Needs Verification** (không Owner-as-SoT) |
| Owner Exit | ✅ **APPROVED** 2026-07-22 |

**Lệnh mở Wave 1 (Owner):**  
«Thi công Wave 1 — Đóng gap Runtime Implementation cho Runtime đang Publish (Web), giữ nguyên legacy, không refactor Runtime, không invent Registry, không cắt cửa 2.»

---

**Chữ ký:** Agent · 2026-07-22 · Wave 0 Rev Gap Classification  
**Cấm đã tuân:** không sửa code product trong Wave 0.
