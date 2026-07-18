# Architecture Gap Register — iFlux

Tài liệu **sống** (thay đổi theo tiến độ), **tách khỏi** `SoT — iFlux Product Architecture.md`.

- **SoT** = kiến trúc mục tiêu + quy tắc bất biến.
- **Gap Register** = khoảng cách giữa hiện trạng và mục tiêu (**Type B — Architecture Gap**).

Quy tắc: Type B **KHÔNG remediation** trong pha Governance. Không workaround, không tạo Core Layer tạm, không adapter/bridge. Chỉ **ghi nhận + theo dõi**. Việc xử lý là **Architecture Evolution** riêng.

Nguồn: Widget Governance Audit 2026-07-15 (canvas `audit-widget-governance`).

## Bảng Gap

| ID | Gap | Ảnh hưởng (SoT) | Ưu tiên | Trạng thái |
|---|---|---|---|---|
| AG-001 | Core Layer (Layer 4) chưa hình thành — Widget đọc dữ liệu qua mock store, chưa có tầng ViewModel/Business Logic thật | Data (WGS-04) | High | Open |
| AG-002 | Global store còn naming "Mock" (`IfluxMockMarket`, `IfluxFlowScoreMock`) — swap sang data thật phải giữ nguyên interface global, rủi ro nếu đổi tên | Data swap | Medium | Open |
| AG-003 | `WGT-FLW-CTX` có trong `widget-registry.js` + plans nhưng **thiếu** định nghĩa trong L4 `platform-layers-widgets.js` WIDGETS | Widget catalog consistency | Medium | Open |
| AG-004 | Data-selection hardcode theo id: `blocksForWidgetId()` (flow-score-board), `enrichSlot` `config.source/scope` — nên đến từ Core Layer / Admin config | Data/config ownership | Medium | Open |
| AG-005 | Community composite **Partial Consumption** của `page-composition` (chỉ dùng `id`+`span`; bỏ order/visibility/permission/config) + `SLOTS` còn hardcode | Layout/Composition completeness | Medium | Open |
| AG-006 | `registry.tier` và L4 `WGT_TIER` là 2 nơi khai báo tier — hợp nhất về L4 duy nhất là Architecture Evolution | Permission metadata consistency | Low | Open |
| AG-007 | Title lệch giữa `widget-registry` và L4 (vd `WGT-MKT-001`) | Display consistency | Low | Open |
| AG-008 | Widget Destroy / Lifecycle Audit (unmount · listener · timer · observer) — **Deferred** đến khi App Shell có SPA / partial navigation / client routing. Hiện tại full page reload → chưa là release blocker Phase A/B | Blueprint Target lifecycle | Low | Deferred |

## Chi tiết

### AG-001 — Core Layer chưa hình thành
Widget hiện đọc qua `*-store.js` / `mock-market.js` / `flow-score-top-mock.js`. Đúng invariant "Widget không fetch trực tiếp" (Type A = 0), nhưng chưa có tầng Core Layer (Layer 4) chuẩn hoá ViewModel + Business Logic. Khi có Core Layer thật: Widget vẫn giữ nguyên (chỉ đọc ViewModel), thay phần bên trong store.

### AG-002 — Mock naming
Global đang mang tên "Mock". Đề xuất tương lai (Evolution): trỏ Widget qua một façade Core Layer trung tính để swap data thật không phải sửa Widget. **Không** làm trong pha Governance.

### AG-005 — Partial Consumption (Community)
Đã ghi ở chương Runtime Blueprint (mục 9). Composite mới tiêu thụ `id`+`span` từ composition; slot list còn hardcode. Target: dựng `SLOTS` từ composition đầy đủ (cơ chế đã có ở slot pages). Đây là gate **Phase B** (Ownership & Consumption), không block nhãn Phase A sau khi Community sequential đã đóng.

### AG-008 — Destroy Lifecycle (Deferred)
Deferred until SPA / partial navigation architecture is introduced. Khi App Shell chuyển sang client navigation / view transition / PJAX / SPA shell → Lifecycle Audit trở thành release blocker trước Target PASS. Không bỏ khỏi sổ theo dõi.

## Approved Architectural Exceptions (không phải Gap)

Không đưa vào bảng Gap — đây là ngoại lệ **hợp lệ** đã ghi trong SoT (chương Widget Governance):

- Nhà của tôi — User Layout override Widget Tùy chỉnh.
- Dòng tiền (WGT-FLW-PAGE) — Page Feature Internal Layout.
