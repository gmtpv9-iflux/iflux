# Verification Evidence — P0 + P1 + P2 Header Logo Ownership

**Deploy:** Production trực tiếp (`/var/www/iflux/production`, `/var/iflux/backend`), Cloudflare cache purge, `pm2 restart iflux-api`.
**Thời điểm:** 2026-08-11.

---

## P0 — 8 entry point migrate

Kiểm raw HTML trực tiếp trên origin (bypass CDN) sau deploy — cả 8 điểm đều trả về canonical markup:

| Route | Kết quả |
|---|---|
| `/co-phieu/HPG` | ✅ `<img data-ifx-seo-logo>` |
| `/co-phieu` | ✅ |
| `/nganh/1` | ✅ |
| `/nganh` | ✅ |
| `/he-sinh-thai/1` | ✅ |
| `/he-sinh-thai` | ✅ |
| `/cong-dong` (post.html — patch trực tiếp) | ✅ |
| `profile.html` orphan (patch trực tiếp qua SSH, không có bản local git) | ✅ |
| `/tai-khoan` (route thật account/profile — vốn đã đúng từ trước) | ✅ giữ nguyên đúng |

Đối chiếu qua CDN thật (`https://iflux.vn`, không bypass) sau purge cache — `/co-phieu/HPG`, `/cong-dong`, `/nha-cua-toi`, `/thi-truong` đều trả canonical markup → **purge cache có hiệu lực, không cần chờ TTL**.

**Ghi chú orphan `profile.html`:** xác nhận đây là file rác tại web root (`/var/www/iflux/production/profile.html`), CSS relative path gãy (`../../Admin_Design_system` từ root sẽ 404), không nằm trong git, không phải route thật (route `/tai-khoan` trỏ đúng `User_Web/account/profile.html`, vốn đã đúng). Đã vá theo yêu cầu Owner (cosmetic), không rsync được vì không có bản local — patch trực tiếp trên production qua SSH.

## P1 — Bỏ gate `bindLogo: !soft`

Kiểm production `bootstrap.js`:
```
grep 'resolveManifest(pageKey' → resolveManifest(pageKey);   (không còn opts.seo.bindLogo)
grep 'bindLogo: !soft'         → không tìm thấy (GATE REMOVED)
```
→ Logo rebind chạy ở **mọi** lần `start()`, không phân biệt hard/soft. Comment code đã cập nhật phản ánh quyết định Owner-approved reopen (20260811).

**Chưa test được bằng browser thật** (không có browser automation tool trong phiên này): việc "soft-nav 2 chiều giữa 8 entry cũ ↔ /cong-dong không còn kẹt logo" được đảm bảo **cấu trúc** bởi 2 fact đã verify tách biệt — (a) P0 đã làm đúng markup ở toàn bộ 21+1 entry, (b) code review xác nhận `teardownOutlet()` không đụng `<header>`, và `enrichManifestWithSiteSeo` chạy lại mỗi nav với `bindLogo` luôn `true` → set đúng `src` vào bất kỳ DOM logo nào đang tồn tại. Vì mọi entry giờ đều có cùng 1 hình dạng DOM (`<img data-ifx-seo-logo>`), kết quả soft-nav từ bất kỳ entry nào cũng phải ra cùng logo. **Đề nghị Owner tự click thật 1 lượt trên production để xác nhận bằng mắt** (không cần agent — đã đủ điều kiện kỹ thuật).

## P2 — `logoUrl` GLOBAL-only

Xác nhận trên production:
```
site-seo-resolver.js:54  if (key !== 'faviconUrl' && key !== 'logoUrl' && !isBlank(page)) {
site-seo.routes.js:116   delete patch.logoUrl;
```
`pm2 restart iflux-api` → process online, pid mới (269 restarts counter, không lỗi khởi động).

Verify qua `/api/seo/effective?pageKey=stock-detail` (route đúng: `/api/seo/effective`, không phải `/api/site-seo/effective`) → trả `logo_url` thật từ Global SEO (`/media/community/2026/08/mas_msn0iyam_d117b67b/img-001.webp`), xác nhận resolver vẫn hoạt động đúng sau khi thêm điều kiện loại trừ.

**Chưa test round-trip PUT thật** (route `PUT /api/admin/seo/pages/:pageKey` yêu cầu quyền `marketing.seo_pages.edit` — agent không có/không tự tạo session admin để test). Đã verify bằng đọc code trực tiếp trên production: `delete patch.logoUrl` chạy **trước** khi gọi `svc.upsertPageSeo()`, nên **dù ai gọi API với `logoUrl` cũng không được lưu**; đồng thời resolver cũng chặn ở tầng đọc (defense-in-depth 2 lớp). Nếu Owner muốn test round-trip thật qua Admin UI, thao tác thủ công 1 lần trên "Thiết lập SEO từng trang" là đủ xác nhận (field vẫn chưa lộ ra UI nên không thể set qua UI — đúng như kỳ vọng).

---

## Tổng kết

| Item | Trạng thái |
|---|---|
| P0 — 8 entry migrate | ✅ Verify trực tiếp trên production (origin + CDN thật) |
| P1 — rebind mọi nav | ✅ Verify code deployed đúng; soft-nav thật cần Owner click-through xác nhận bằng mắt |
| P2 — GLOBAL-only contract | ✅ Verify code deployed đúng + resolver còn hoạt động; round-trip PUT thật chưa test (cần quyền Admin) |
| Cloudflare purge | ✅ `purge_everything` thành công, xác nhận qua domain thật |
| Không đụng orphan duplicate khác / href duplicate / Persistent Shell | ✅ Đúng theo chốt Owner — không sửa gì ngoài phạm vi |

**Việc còn lại (không phải do agent thiếu năng lực, mà do giới hạn công cụ trong phiên):** Owner tự xác nhận bằng mắt 1 lượt soft-nav thật trên production (VD: mở `/co-phieu/HPG`, để trang chạy JS xong, sau đó bấm menu "Cộng đồng" — không F5) để chốt 100% behavior thực tế khớp với suy luận cấu trúc ở trên.
