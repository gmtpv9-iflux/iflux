# Insight Share — Daily Report (Capture)

**Trạng thái: NOT START**
Ngày ghi nhận: 14/08/2026
Nguồn: Owner mô tả trực tiếp trong chat (task `120826_pending_Git_Deployment_Process_Reconstruction`), ghi nhận nhân tiện lúc audit cấu trúc Widget — không phải requirement thuộc task đó.

> Đây là **capture ý tưởng để phân loại sau**, chưa phải BRD chính thức. Khi Owner mở phase triển khai, phải làm lại đúng chuỗi `BRD → Audit → SoT → Solution → Plan` theo `Product Backlogs Governance.md` — không code thẳng từ ghi chú này.

## Module liên quan (để phân loại)

- **Share Foundation** — `Admin_Design_system/iflux-admin-ui/foundation/share-action.js` + `share-action-store.js` (capability chung, theo SoT Product Architecture V2: *"Share là capability chung, không phải feature sở hữu của Widget hay Community"*).
- **Export/Insight capability** — thuộc nhóm Widget capabilities (`capabilities.share/insight/export` trong Widget artifact — xem audit cấu trúc widget cùng ngày).
- **Trang `/chia-se`** — `User_Web/share/index.html` (`#shr-card`) + `User_Web/iflux-web-ui/runtime/share-feature-boot.js`. Route này **đã có markup** cho "1 mình insight card" nhưng **hiện đang redirect bỏ qua** (`share-feature-boot.js` → `/nha-cua-toi` ngay khi load, không render card) — là nền tảng gần nhất cần sửa/mở lại khi triển khai tính năng này.
- **Affiliate ref (mã giới thiệu)** — `loyalty-affiliate-store.js` (đã có: `getOutgoingAffiliateRef`, path decorator `/{publicId}/...`).
- **Backend** — hiện **chưa có bảng nào** lưu share/snapshot (đã kiểm DB Production: không có `shares`, `insight_shares`, `snapshots`, `daily_report`...). Toàn bộ share hiện tại chỉ tồn tại tạm trong `localStorage` phía client, xoá ngay sau khi dùng (`clearShareStorage()`). Đây là gap hạ tầng lớn nhất cần Solution quyết định khi mở phase.

## Nội dung Owner mô tả (giữ nguyên, chưa diễn giải thêm)

Hai mục đích hiện tại của Export/Insight/Share:

1. **Share insight card**: bấm vào → hệ thống khoanh vùng giao diện đầy đủ → cho phép lưu ảnh PNG về máy + copy liên kết chia sẻ để đi đến (2).
2. **Giao diện HTML chứa riêng 1 mình insight card mà user đã share** — cũng là nơi sau này có thể chứa **báo cáo hàng ngày của user**: chứa tất cả widget đã được snapshot để ghi nhận theo ngày.

**Tính năng báo cáo hàng ngày (chưa làm — nội dung capture chính của backlog này):**

- Quy định bởi **người share** (mã affiliate) và **người view**:
  - Nếu người view là **chính người đã share** → xem được **toàn bộ widget trong báo cáo**.
  - Nếu người view là **người được share** → chỉ xem được **bản thân widget đã được share đó** (không thấy toàn bộ báo cáo).

## Ghi chú audit liên quan (evidence tại thời điểm capture)

- Mục đích 1 đang chạy đầy đủ, đúng như mô tả (capture DOM → PNG qua html2canvas → card có QR + mã giới thiệu → copy link / tải PNG / native share sheet).
- Mục đích 2 (nền tảng cho báo cáo hàng ngày) **chưa sống thật**: link chia sẻ thực tế trỏ về trang gốc (kèm affiliate prefix), không trỏ về `/chia-se`; trang `/chia-se` bị bootscript redirect bỏ qua trước khi kịp render.
- Không có gì trong code hiện tại nằm **ngoài** 2 mục đích Owner liệt kê (không có export Community/AI Summary nào đang chạy dù SoT Product Architecture V2 có nhắc capability này ở tên gọi).
