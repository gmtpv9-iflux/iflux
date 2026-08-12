# 30 — Bộ Test Case Owner Tự Kiểm Tra (BR-01…BR-48)

## 0. Đã xong toàn bộ BR chưa?

**Chưa 100% "hoàn thiện tuyệt đối", nhưng KHÔNG còn BR nào ở trạng thái FAIL/tồn đọng chưa xử lý.** Cụ thể (chi tiết đầy đủ ở `29 - BR Verification Matrix — Final Acceptance Audit.md`):

| Trạng thái | Số BR | Ý nghĩa |
|---|---|---|
| ✅ **VERIFIED đầy đủ** | 32/41 | Có bằng chứng thật (curl/API/Chrome/Admin) — sẵn sàng để bạn test lại |
| 🟡 **DEFERRED (bạn đã quyết định hoãn)** | BR-05 (Favicon completeness), BR-29/BR-32 (SEO Health site-wide + CMS mở rộng) | Không phải lỗi — bạn đã chọn hoãn, không cần test bây giờ |
| 🟡 **PARTIAL (residual không chặn)** | BR-31 (Source Traceability), BR-33 (Permission granularity) | Hoạt động cơ bản OK, phần mở rộng chưa làm — không cần test kỹ |
| ⚪ **OUT OF SCOPE (đã khóa từ trước)** | BR-30 (SEO Versioning/Rollback) | Chưa build, đã có quyết định khóa trước đây |
| ⚪ **N/A** | BR-47 (Reuse Requirement — chỉ là process/governance, không phải tính năng chạy trên web) | Không có gì để bấm/test |
| ⚠️ **VERIFIED nhưng phạm vi hẹp** | BR-27 (chỉ 1 ngôn ngữ — chưa có bản Anh để so sánh), BR-36 (Google SERP cũ là do Google cache, không phải lỗi code) | Test được nhưng đừng kỳ vọng thấy đa ngôn ngữ hoặc Google cập nhật ngay |

→ Bộ test case dưới đây tập trung vào **32 BR đã VERIFIED** (bạn tự bấm/kiểm tra lại) + có ghi chú rõ BR nào **không cần test** (đã hoãn) để bạn không mất thời gian.

---

## 1. Chuẩn bị trước khi test

1. **Dùng Chrome ẩn danh (Incognito)** cho các test không cần đăng nhập — tránh cache/login cũ làm sai lệch kết quả. Mở bằng `Cmd+Shift+N`.
2. **Có sẵn 1 trình duyệt đã đăng nhập Admin** để test các mục "Nhóm Admin".
3. **Có điện thoại cài Zalo** để test preview chia sẻ thực tế.
4. Ghi nhớ 6 cách kiểm tra dưới đây — mỗi test case sẽ ghi rõ dùng cách nào:

| Cách | Khi nào dùng | Làm thế nào |
|---|---|---|
| **A. Tiêu đề tab trình duyệt** | Kiểm tra title nhanh | Nhìn chữ trên tab Chrome — đó chính là `<title>` |
| **B. F12 → Elements → `<head>`** | Kiểm tra canonical/description/OG/robots thật trong trang | Mở trang → nhấn `F12` (hoặc chuột phải → Kiểm tra) → tab **Elements** → bấm mở thẻ `<head>` ở trên cùng → tìm dòng cần xem (Cmd+F trong panel Elements để tìm nhanh, ví dụ gõ "canonical") |
| **C. Zalo Debug Sharing** | Kiểm tra OG/description/image mà crawler thực sự nhận được | Mở `https://developers.zalo.me/tools/debug` → dán URL → bấm "Thu thập lại" → xem kết quả |
| **D. Chia sẻ Zalo thật** | Kiểm tra preview thực tế người dùng thấy | Trên điện thoại, dán link vào khung chat Zalo (chưa gửi) → xem preview hiện ra |
| **E. Mở URL trực tiếp (robots.txt / sitemap.xml)** | Kiểm tra file tĩnh | Gõ URL vào address bar, xem nội dung text/XML hiện ra |
| **F. Admin UI** | Kiểm tra field quản trị | Đăng nhập `https://iflux.vn/Admin_Design_system/app/dashboard/index.html` |

---

## 2. Nhóm 1 — Global & Page SEO Settings (Admin) — BR-01, 02, 03, 04

### TC-01 (BR-01, BR-03) — Global SEO tự động áp dụng
- **Cách:** F
- **Bước:** Admin → **Thiết lập SEO hệ thống** → mở trang bất kỳ **chưa cấu hình riêng** (ví dụ trang FAQ) trên web thật (`/hoi-dap`).
- **Kỳ vọng:** Trang vẫn có đủ title/description dù không cấu hình riêng — tự động kế thừa từ Global (không phải trống hay lỗi).

### TC-02 (BR-02) — Phân loại field: cái nào tự động, cái nào sửa được
- **Cách:** F
- **Bước:** Vào **Thiết lập SEO từng trang** → mở 1 trang (ví dụ Cộng đồng) → thử sửa **Tiêu đề SEO** → Lưu.
- **Kỳ vọng:** Sửa được và lưu thành công (đây là field Automatic + Manual Override). Các field như URL/canonical thì **không có ô để sửa tay** trong UI (đúng — vì đó là Fully Automatic).

### TC-03 (BR-04) — Website Identity tách biệt Site Name / SEO Title
- **Cách:** F
- **Bước:** Vào Thiết lập SEO hệ thống → xem có 2 field riêng: **"Tên site"** và **"Tiêu đề SEO mặc định"**.
- **Kỳ vọng:** 2 field khác nhau, không dùng lẫn nhau. (Ghi chú: "Tên site" hiện vẫn dùng chung dữ liệu `marketing_brand_identity` — bạn đã ghi nhận là P1, chưa cần action ngay).

---

## 3. Nhóm 2 — Page SEO Contract & Coverage — BR-06, BR-07

### TC-04 (BR-06) — Mỗi trang public có đủ SEO Contract
- **Cách:** B
- **Bước:** Mở `https://iflux.vn/thi-truong` → F12 → Elements → `<head>` → tìm: `title`, `meta[name=description]`, `link[rel=canonical]`, `meta[name=robots]`, các `meta[property^=og:]`, `meta[name^=twitter:]`.
- **Kỳ vọng:** Có đủ tất cả, không thẻ nào trống/thiếu.

### TC-05 (BR-06.4) — HTTP Status khớp với SEO (không mâu thuẫn)
- **Cách:** Gõ 1 URL không tồn tại, ví dụ `https://iflux.vn/duong-dan-khong-ton-tai-12345`
- **Kỳ vọng:** Trang hiện lỗi 404 rõ ràng (không phải trang trắng, không phải hiện nội dung như thể URL hợp lệ).

### TC-06 (BR-07) — Coverage đủ các loại trang
- **Cách:** A + B, lặp lại TC-04 cho từng URL sau (mỗi URL đều phải có `<title>` đúng nội dung trang, không phải tiêu đề mặc định chung):
  ```text
  /nha-cua-toi        (Home)
  /thi-truong         (Market)
  /dong-tien          (Money Flow)
  /cong-dong          (Community)
  /thanh-vien         (Membership)
  /hoi-dap            (FAQ)
  /co-phieu/HPG       (Stock)
  /nganh              (Sector list)
  /he-sinh-thai       (Ecosystem list)
  /cau-chuyen         (Story list)
  /goi-cuoc           (Pricing)
  ```
- **Kỳ vọng:** Mỗi trang có tiêu đề tab riêng biệt, đúng nội dung trang đó — không trang nào bị trùng tiêu đề "iFlux" chung hoặc trống.

---

## 4. Nhóm 3 — Entity/Dynamic SEO & Template — BR-08, BR-09, BR-10

### TC-07 (BR-08, BR-09) — Tiêu đề tự sinh theo template cho từng mã cổ phiếu
- **Cách:** A
- **Bước:** Mở lần lượt `/co-phieu/HPG`, `/co-phieu/VNM`, `/co-phieu/FPT` (đã đăng nhập).
- **Kỳ vọng:** Mỗi trang có tiêu đề khác nhau, đúng tên công ty tương ứng (ví dụ "iFlux | HPG - Công ty Cổ phần Tập đoàn Hòa Phát") — **không** thấy chữ `{ticker}` hoặc `{company_name}` còn sót lại chưa thay.

### TC-08 (BR-10) — Không mâu thuẫn khi Admin override
- **Cách:** F rồi A
- **Bước:** Admin → Thiết lập SEO từng trang → 1 trang có sẵn (ví dụ Market) → nhập tiêu đề riêng khác với mặc định → Lưu → mở lại `/thi-truong` (ẩn danh, hoặc F5 sau khi đã load).
- **Kỳ vọng:** Trang hiển thị đúng tiêu đề bạn vừa override, không bị "giằng" giữa 2 giá trị.

---

## 5. Nhóm 4 — Canonical — BR-11, BR-12, BR-24

### TC-09 (BR-11) — Canonical tự sinh, hiển thị đúng cả khi đã đăng nhập
- **Cách:** B
- **Bước:** Mở `/thi-truong`, `/cong-dong`, `/dong-tien`, `/goi-cuoc` (đăng nhập bình thường, KHÔNG ẩn danh) → F12 → Elements → `<head>` → tìm `link[rel="canonical"]`.
- **Kỳ vọng:** Mỗi trang đều có đúng 1 dòng canonical, trỏ về chính URL đó (ví dụ `/thi-truong` → canonical = `https://iflux.vn/thi-truong`). **Đây là gap mới fix trong lần audit này — trước đây hoàn toàn không có, giờ phải thấy.**

### TC-10 (BR-12) — Canonical cho trang chủ `/` (alias của Cộng đồng)
- **Cách:** B
- **Bước:** Mở `https://iflux.vn/` (chỉ dấu `/`, không gõ gì thêm) → F12 → Elements → tìm canonical.
- **Kỳ vọng:** Canonical = `https://iflux.vn/cong-dong` (**không phải** `https://iflux.vn/`) — vì `/` là alias kỹ thuật của trang Cộng đồng.

### TC-11 (BR-24) — Slug tiếng Việt không dấu
- **Cách:** A
- **Bước:** Mở 1 bài viết Cộng đồng bất kỳ, nhìn URL trên address bar.
- **Kỳ vọng:** URL dạng `/cong-dong/bai-viet/ten-bai-viet-khong-dau` — không có ký tự có dấu, không có khoảng trắng.

---

## 6. Nhóm 5 — Robots — BR-13

### TC-12 (BR-13) — Trang public thì index, trang riêng tư thì noindex
- **Cách:** B
- **Bước 1:** Mở `/thi-truong` → F12 → tìm `meta[name=robots]` → phải thấy `content="index,follow"`.
- **Bước 2:** Mở `/tai-khoan` (trang Tài khoản của bạn) → F12 → Network tab → chọn request đầu tiên (document) → xem **Response Headers** → tìm `x-robots-tag`.
- **Kỳ vọng:** Bước 2 phải thấy `x-robots-tag: noindex, nofollow` (**gap mới fix trong lần audit này** — trước đây hoàn toàn không có header này).

### TC-13 (BR-13) — robots.txt hợp lệ
- **Cách:** E — mở `https://iflux.vn/robots.txt`
- **Kỳ vọng:** Thấy nội dung text rõ ràng, có dòng `Disallow: /tai-khoan`, `Disallow: /tin-nhan`, và dòng `Sitemap: https://iflux.vn/sitemap.xml` ở cuối.

---

## 7. Nhóm 6 — Sitemap — BR-14

### TC-14 (BR-14) — Sitemap tồn tại, hợp lệ, không rò rỉ link giới thiệu
- **Cách:** E — mở `https://iflux.vn/sitemap.xml`
- **Kỳ vọng:** Trình duyệt hiển thị danh sách XML (không lỗi), có nhiều thẻ `<url><loc>...</loc></url>`. Dùng `Cmd+F` tìm chữ `IFL` hoặc `ref=` trong trang — **phải không tìm thấy kết quả nào** (không có link affiliate/publicId lẫn vào sitemap).

---

## 8. Nhóm 7 — OpenGraph / Twitter / Ảnh chia sẻ — BR-15, BR-16, BR-17, BR-18

### TC-15 (BR-15, BR-17, BR-18) — Ảnh chia sẻ đúng định dạng, có kích thước
- **Cách:** C — Zalo Debug Sharing với `https://iflux.vn/co-phieu/HPG`
- **Kỳ vọng:** Thấy đầy đủ `og:title`, `og:description`, `og:image` (đuôi `.jpg`, **không phải** `.webp`), có ảnh preview hiển thị rõ.

### TC-16 (BR-16) — Twitter card
- **Cách:** B — F12 → Elements → tìm `meta[name="twitter:card"]` trên `/co-phieu/HPG`.
- **Kỳ vọng:** `content="summary_large_image"` + có `twitter:title`, `twitter:description`, `twitter:image`.

### TC-17 (BR-15) — Chia sẻ thật lên Zalo (test cuối cùng, quan trọng nhất với người dùng)
- **Cách:** D
- **Bước:** Trên điện thoại, dán `https://iflux.vn/co-phieu/HPG` và `https://iflux.vn/cong-dong` vào khung chat Zalo (gửi cho chính mình, chưa cần bấm gửi thật).
- **Kỳ vọng:** Preview hiện đủ ảnh + tiêu đề + mô tả. **Ghi chú quan trọng:** nếu link nào bạn **đã từng chia sẻ trước đây** mà Zalo cache cũ, có thể cần bấm "Thu thập lại" trong Zalo Debug Sharing trước, hoặc thử URL có thêm `?v=1` ở cuối để Zalo coi là link mới.

---

## 9. Nhóm 8 — Validation Tiêu đề/Mô tả SEO (Admin) — BR-19, BR-20

### TC-18 (BR-19, BR-20) — Chặn HTML/ký tự lỗi
- **Cách:** F
- **Bước:** Admin → Thiết lập SEO từng trang → nhập vào ô Tiêu đề SEO: `<b>Test</b>` → Lưu.
- **Kỳ vọng:** Hệ thống **báo lỗi, không cho lưu** (vì chứa thẻ HTML).

### TC-19 (BR-19, BR-20) — Cảnh báo chất lượng (không chặn)
- **Cách:** F
- **Bước:** Nhập mô tả rất ngắn (dưới 50 ký tự, ví dụ "Test ngắn") → Lưu.
- **Kỳ vọng:** **Lưu được** nhưng có **cảnh báo** hiển thị (ví dụ "Meta description quá ngắn...").

---

## 10. Nhóm 9 — Structured Data & Breadcrumb — BR-21, BR-22

### TC-20 (BR-21) — Có dữ liệu có cấu trúc (Structured Data)
- **Cách:** B
- **Bước:** Mở `/co-phieu/HPG` → F12 → Elements → Cmd+F tìm `application/ld+json`.
- **Kỳ vọng:** Thấy ít nhất 2 khối `<script type="application/ld+json">` (WebPage + BreadcrumbList).

### TC-21 (BR-22) — Breadcrumb UI khớp với dữ liệu ẩn
- **Cách:** A quan sát mắt thường
- **Bước:** Mở `/co-phieu/HPG` → nhìn breadcrumb hiển thị trên trang (thường ở đầu trang: Trang chủ > Thị trường > Cổ phiếu > HPG).
- **Kỳ vọng:** Breadcrumb hiển thị đúng thứ tự, khớp với cấu trúc điều hướng thật.

---

## 11. Nhóm 10 — Redirect — BR-25

### TC-22 (BR-25) — Slug cũ tự động chuyển hướng
- **Cách:** A, quan sát address bar
- **Bước:** Mở 1 link bài viết cũ (nếu có) hoặc thử thêm hậu tố lạ vào cuối slug 1 bài viết đang có, ví dụ thêm `-abc` vào cuối URL bài viết.
- **Kỳ vọng:** Trình duyệt tự chuyển (redirect) về đúng slug chuẩn hiện tại, không hiện lỗi 404.

---

## 12. Nhóm 11 — SEO Preview (Admin) — BR-28

### TC-23 (BR-28) — Xem trước SEO trước khi lưu
- **Cách:** F
- **Bước:** Admin → Thiết lập SEO từng trang → mở 1 trang → tìm khu vực "Xem trước" (preview Google/Facebook nếu có).
- **Kỳ vọng:** Preview hiển thị đúng title/description sẽ áp dụng, cập nhật theo giá trị bạn vừa nhập.

---

## 13. Nhóm 12 — Singleton / Source of Truth — BR-34

### TC-24 (BR-34) — Không có 2 thẻ trùng nhau
- **Cách:** B
- **Bước:** Mở `/thi-truong` → F12 → Elements → Cmd+F gõ `<title` → xem số kết quả tìm được.
- **Kỳ vọng:** Chỉ **1 kết quả** (không có 2 thẻ `<title>` cùng lúc). Lặp lại tương tự cho `canonical` và `meta name="description"`.

---

## 14. Nhóm 13 — Ranh giới SEO vs Affiliate/Public Identity — BR-45 (quan trọng)

### TC-25 (BR-45) — Link giới thiệu (affiliate) không phá canonical
- **Cách:** B + D
- **Bước:** Lấy 1 link giới thiệu thật của bạn (trong Nhà của tôi/Membership → Giới thiệu bạn bè, dạng `https://iflux.vn/IFLxxxxxxx/...`). Mở link đó trên Chrome (bình thường, không ẩn danh) → F12 → Elements → tìm canonical.
- **Kỳ vọng:** Canonical **không chứa** đoạn `IFLxxxxxxx` — canonical phải là URL sạch (Clean Public URL) của nội dung đó.
- **Kiểm tra thêm:** Vào Chrome → F12 → **Application** tab → **Cookies** → tìm cookie `iflux_ref_code` → phải thấy đúng mã giới thiệu của bạn (chứng minh việc ghi công/attribution vẫn hoạt động dù canonical đã "làm sạch").

### TC-26 (BR-45) — Link `?ref=` cũng không phá canonical
- **Cách:** B
- **Bước:** Lấy URL 1 bài viết Cộng đồng, thêm `?ref=ABC123` vào cuối (ví dụ `https://iflux.vn/cong-dong/bai-viet/ten-bai-viet?ref=ABC123`) → mở → F12 → tìm canonical.
- **Kỳ vọng:** Canonical không chứa `?ref=ABC123`.

---

## 15. Nhóm 14 — Compatibility spot-check — BR-46

### TC-27 (BR-46) — Các tính năng khác không bị ảnh hưởng
- **Cách:** A, thao tác thật
- **Bước:** Thử nhanh: (1) đăng nhập tài khoản, (2) vào Nhà của tôi xem Widget hiển thị bình thường, (3) vào Cộng đồng bấm vào 1 bài viết, (4) vào Admin xem Danh sách quyền/Role vẫn hoạt động.
- **Kỳ vọng:** Không có tính năng nào bị lỗi/mất do các thay đổi SEO.

---

## 16. Nhóm 15 — Hiệu năng cơ bản — BR-48

### TC-28 (BR-48) — Trang tải nhanh, không khựng
- **Cách:** A, cảm nhận
- **Bước:** Mở lần lượt `/thi-truong`, `/cong-dong` vài lần, bấm chuyển qua lại giữa các trang bằng menu điều hướng (không load lại cả trang).
- **Kỳ vọng:** Chuyển trang mượt, không thấy trắng trang/giật, không thấy tải lại toàn bộ header/logo mỗi lần chuyển.

---

## 17. Bảng checklist tổng hợp (điền khi test)

| TC | BR | Nội dung | Kết quả |
|---|---|---|---|
| TC-01 | BR-01,03 | Global SEO tự áp dụng | ☐ PASS ☐ FAIL |
| TC-02 | BR-02 | Field nào sửa được/không | ☐ PASS ☐ FAIL |
| TC-03 | BR-04 | Tên site vs Tiêu đề SEO | ☐ PASS ☐ FAIL |
| TC-04 | BR-06 | Đủ SEO Contract | ☐ PASS ☐ FAIL |
| TC-05 | BR-06 | HTTP 404 đúng | ☐ PASS ☐ FAIL |
| TC-06 | BR-07 | Coverage 11 trang | ☐ PASS ☐ FAIL |
| TC-07 | BR-08,09 | Template theo mã CP | ☐ PASS ☐ FAIL |
| TC-08 | BR-10 | Override không mâu thuẫn | ☐ PASS ☐ FAIL |
| TC-09 | BR-11 | Canonical hiện đúng (fix mới) | ☐ PASS ☐ FAIL |
| TC-10 | BR-12 | Canonical `/` → `/cong-dong` | ☐ PASS ☐ FAIL |
| TC-11 | BR-24 | Slug không dấu | ☐ PASS ☐ FAIL |
| TC-12 | BR-13 | Robots index/noindex (fix mới) | ☐ PASS ☐ FAIL |
| TC-13 | BR-13 | robots.txt | ☐ PASS ☐ FAIL |
| TC-14 | BR-14 | Sitemap hợp lệ | ☐ PASS ☐ FAIL |
| TC-15 | BR-15,17,18 | Ảnh chia sẻ .jpg | ☐ PASS ☐ FAIL |
| TC-16 | BR-16 | Twitter card | ☐ PASS ☐ FAIL |
| TC-17 | BR-15 | Chia sẻ Zalo thật | ☐ PASS ☐ FAIL |
| TC-18 | BR-19,20 | Chặn HTML | ☐ PASS ☐ FAIL |
| TC-19 | BR-19,20 | Cảnh báo chất lượng | ☐ PASS ☐ FAIL |
| TC-20 | BR-21 | Structured Data | ☐ PASS ☐ FAIL |
| TC-21 | BR-22 | Breadcrumb | ☐ PASS ☐ FAIL |
| TC-22 | BR-25 | Redirect slug cũ | ☐ PASS ☐ FAIL |
| TC-23 | BR-28 | SEO Preview Admin | ☐ PASS ☐ FAIL |
| TC-24 | BR-34 | Không trùng thẻ | ☐ PASS ☐ FAIL |
| TC-25 | BR-45 | Affiliate không phá canonical | ☐ PASS ☐ FAIL |
| TC-26 | BR-45 | `?ref=` không phá canonical | ☐ PASS ☐ FAIL |
| TC-27 | BR-46 | Compatibility | ☐ PASS ☐ FAIL |
| TC-28 | BR-48 | Hiệu năng cơ bản | ☐ PASS ☐ FAIL |

---

## 18. Các BR KHÔNG cần test (đã có quyết định, không phải thiếu sót quên)

| BR | Lý do không test |
|---|---|
| BR-05 | Favicon completeness — bạn đã quyết định defer |
| BR-29, BR-32 | SEO Health site-wide crawl + CMS mở rộng — bạn đã quyết định defer |
| BR-30 | SEO Versioning/Rollback — out of scope, khóa từ trước |
| BR-31, BR-33 | Traceability/Permission granularity — residual không chặn, đã ghi nhận |
| BR-47 | Reuse Requirement — chỉ là process/governance nội bộ, không có gì để bấm test |
| BR-36 | SERP Google cũ là do cache của Google, không phải lỗi code — muốn cập nhật thì dùng Google Search Console "Yêu cầu lập chỉ mục", không test được qua web thường |

Nếu sau khi test bạn thấy TC nào FAIL, báo lại đúng mã TC (ví dụ "TC-09 FAIL") kèm ảnh chụp màn hình nếu có — sẽ điều tra root cause ngay theo đúng quy trình đã áp dụng suốt task này.
