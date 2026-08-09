 # Business Requirement Brief — Public Identity URL Strategy

**Date:** 2026-07-29  
**Status:** **LOCKED** — Business Intent cao nhất của Program Affiliate V2 Architecture Re-baseline  
**Layer:** Business Requirement / Product Vision (không phải SoT chi tiết · không phải Solution · không phải Plan)  
**Program folder:** `270729_Affiliate_V2_Architecture_Rebaseline/`

**Vai trò trong chuỗi:**

```text
Business Requirement Brief   ← file này (ý định kinh doanh)
        ↓
00 Audit Context             ← Business Model ↔ Architecture ↔ Runtime (+ Documentary/Runtime)
        ↓
01 Task Objective
        ↓
02 SoT
        ↓
03 Acceptance
        ↓
04-Solution.md
        ↓
05-Plan.md
        ↓
Implementation
```

> Mọi SoT / Solution / Plan **bắt buộc** hiện thực hóa yêu cầu trong file này.  
> Nếu Brief chưa khớp với tầng dưới → **sửa tầng dưới**, không tự diễn giải lại Business Intent.

---

Sau khi đọc toàn bộ trao đổi, đây **không phải là Solution** và cũng **không phải Business Rules chi tiết**.

Nó là **Business Requirement / Product Vision**. Tức là những yêu cầu nghiệp vụ mà Solution sau này bắt buộc phải hiện thực hóa — góc nhìn Product Requirement, loại bỏ suy luận kỹ thuật, giữ ý định kinh doanh.

---

# Business Requirement — Public Identity URL Strategy

## 1. Business Objective

iFlux xây dựng **Public Identity** như địa chỉ công khai của mỗi người dùng trên nền tảng.

Public Identity không chỉ phục vụ Affiliate mà trở thành danh tính có thể sử dụng để:

* chia sẻ nội dung
* giới thiệu thành viên mới
* quảng bá thương hiệu cá nhân
* chạy quảng cáo
* tạo QR
* xuất hiện trên mọi Application URL khi phù hợp

Mục tiêu cuối cùng là:

> Mỗi người dùng sở hữu một địa chỉ công khai của riêng mình trên domain iflux.vn.

---

# 2. Hai loại URL của sản phẩm

Sản phẩm tồn tại đồng thời hai loại URL có mục đích hoàn toàn khác nhau.

## 2.1 Product URL (Company URL)

Ví dụ

```
/cong-dong
/co-phieu/FPT
/dang-ky
```

Đây là URL chuẩn của sản phẩm.

Business purpose:

* Google index
* Sitemap
* Canonical
* SEO của công ty
* Marketing chính thức của iFlux

Product URL luôn là địa chỉ chuẩn của tài nguyên.

---

## 2.2 Owner URL (Public Identity URL)

Ví dụ

```
/IFLABC123/cong-dong
/IFLABC123/co-phieu/FPT
/IFLABC123/dang-ky
```

Business purpose:

* Share
* Referral
* Social
* QR
* Email
* Google Ads
* Facebook Ads
* TikTok
* Zalo
* Marketing của người dùng

Owner URL đại diện cho ngữ cảnh của một người dùng cụ thể.

---

# 3. Hai URL không cạnh tranh

Product URL và Owner URL không phải hai tài nguyên khác nhau.

Chúng chỉ là hai cách truy cập cùng một nội dung.

Ví dụ

```
/co-phieu/FPT
```

và

```
/IFLABC123/co-phieu/FPT
```

đều mở cùng một trang FPT.

Khác biệt duy nhất là Owner Context.

Không được phép tạo ra hai phiên bản nội dung độc lập.

---

# 4. Canonical Strategy

Sản phẩm chỉ tồn tại một Canonical URL.

Canonical luôn là Product URL.

Ví dụ

```
Canonical

/co-phieu/FPT
```

Ngay cả khi người dùng đang truy cập

```
/IFLABC123/co-phieu/FPT
```

Canonical vẫn phải là

```
/co-phieu/FPT
```

Mục tiêu:

Google chỉ coi đây là một nội dung duy nhất.

---

# 5. SEO Strategy

SEO của công ty chỉ được xây dựng trên Product URL.

Owner URL không phải mục tiêu SEO.

Không yêu cầu Google index từng Owner URL.

Nếu Google nhận diện các Owner URL đều thuộc domain iflux.vn và điều đó mang lại lợi ích SEO tổng thể cho domain thì đây là giá trị cộng thêm, không phải mục tiêu bắt buộc.

---

# 6. Business Value của Owner URL

Owner URL phải đủ ổn định để người dùng có thể sử dụng như địa chỉ công khai của mình.

Ví dụ:

* chạy Google Ads
* chạy Facebook Ads
* đăng TikTok
* đăng Zalo
* gửi Email
* in QR
* đặt trong profile
* đặt trên danh thiếp

Public Identity vì vậy không chỉ là Referral Code.

Đó là Public Address của người dùng trên nền tảng.

---

# 6A. End-to-End Owner Context Preservation

Public Identity chỉ mang lại giá trị kinh doanh khi **Owner Context được duy trì xuyên suốt toàn bộ hành trình của người dùng**.

Business không coi việc chỉ sinh đúng Owner URL ở thời điểm Share là thành công nếu Owner Context bị mất trong các bước tiếp theo.

Khi một Owner URL đã được tạo và chia sẻ, hệ thống phải bảo toàn Owner Context cho đến khi:

* hoàn tất các nghiệp vụ phụ thuộc vào Owner (ví dụ: Affiliate Attribution, Register, Login...), hoặc
* phát sinh một sự kiện nghiệp vụ hợp lệ làm thay đổi Owner Context.

Trong thời gian Owner Context còn hiệu lực, hệ thống không được làm mất Owner Context chỉ vì thay đổi cách biểu diễn URL hoặc do quá trình điều hướng của ứng dụng.

Business Requirement này áp dụng cho toàn bộ hành trình của người dùng, bao gồm nhưng không giới hạn:

* Share
* Mở liên kết
* Browser hoặc In-App Browser
* Điều hướng trong ứng dụng
* Register
* Login
* Affiliate Attribution

Nếu sản phẩm tuyên bố hỗ trợ một nền tảng phân phối hoặc In-App Browser, việc sử dụng nền tảng đó không được làm mất Owner Context trước khi hoàn tất các nghiệp vụ phụ thuộc vào Owner.

Business không quy định Solution phải sử dụng URL, Cookie, Storage, Session hay bất kỳ cơ chế kỹ thuật nào. Đó là trách nhiệm của Architecture và Solution.

Business chỉ quan tâm đến kết quả cuối cùng:

**Owner Context phải được bảo toàn xuyên suốt End-to-End.**

---

# 6B. Share Action — Native Share Sheet (LOCKED 2026-07-30)

Hành vi Business của nút **Share** không phải chỉ tạo/copy link nội bộ ứng dụng.

## Hành trình bắt buộc

1. Người dùng đã **Login** (có Public Identity Self).  
2. Người dùng bấm **Share**.  
3. Hệ điều hành mở **Native Share Sheet** của thiết bị.  
4. Người dùng chọn: Copy Link · Zalo · Facebook · Messenger · Telegram · Email · hoặc ứng dụng chia sẻ khác mà thiết bị hỗ trợ.  
5. URL được gửi đi **phải** chứa Public ID của **chính người đang Share (Self)**.

Ví dụ:

```text
B Login (Self = IFLBBB123)
      ↓
B bấm Share
      ↓
Native Share Sheet
      ↓
Chọn Zalo (hoặc kênh khác)
      ↓
URL = https://iflux.vn/IFLBBB123/…
```

## Guest

* Guest **không** được Share (Foundation / Native Sheet / nút Share).  
* Guest chỉ **Copy link** URL đang xem (có thể vẫn là Owner URL của người trước).  
* Share / Like / Comment chỉ khả dụng sau Login.

## Ranh giới

* Share artifact = Self — **không** = Active Owner / Incoming URL Owner trên trang.  
* Share **không** dùng Application URL Writer.  
* Việc mở được Native Sheet với đúng Self URL là yêu cầu Phase Share Boundary.  
* Bảo toàn Owner Context **sau khi** người nhận mở link (IAB/Zalo…) thuộc End-to-End (§6A / Program Gate) — không thay thế bởi chỉ sinh đúng URL lúc Share.

---

# 7. Public Identity Lifecycle

Tại một thời điểm, chỉ tồn tại **một Public Identity đang có hiệu lực** đối với một phiên làm việc.

Ví dụ:

### Trường hợp 1

Người truy cập từ

```
/IFLABC123/dang-ky
```

Owner hiện hành là

```
IFLABC123
```

---

Sau khi hoàn tất đăng ký và tài khoản mới được tạo

Owner phải chuyển thành

```
IFLNEW456
```

Toàn bộ Application URL sau đó phải phản ánh Public Identity mới.

Người dùng không tiếp tục hoạt động dưới Owner của người giới thiệu.

---

# 8. Product Navigation

Các trang của hệ thống luôn tồn tại ở dạng Product URL.

Ví dụ

```
/dang-ky
/cong-dong
/co-phieu/FPT
```

Chúng không bị loại bỏ khi áp dụng Public Identity.

Owner URL chỉ là một cách biểu diễn khác của cùng tài nguyên khi tồn tại Owner Context.

---

# 9. Owner Context

Owner Context phải được biểu diễn trực tiếp bằng Owner URL khi trải nghiệm đang mang Owner.

Business không coi cookie hoặc local storage là nơi mang ý nghĩa nghiệp vụ.

Khi trải nghiệm đang thuộc Owner Context, các link do hệ thống sinh ra mà **cần duy trì context đó** phải **preserve Owner**.

**Không** hiểu là mọi URL bắt buộc có prefix Owner. **Product URL vẫn tồn tại** (SEO · canonical · guest · entry sạch).

---

# 10. Product Principle

Public Identity là một khái niệm của toàn bộ platform.

Affiliate chỉ là một capability sử dụng Public Identity.

Các capability khác cũng có thể sử dụng cùng Public Identity, ví dụ:

* Share
* Community
* Stock
* Register
* Login
* QR
* Campaign
* Ads
* Deep Link
* Affiliate

Không capability nào được sở hữu Public Identity riêng.

---

# 11. Business Success

Sau khi hoàn thành định hướng này:

* Công ty vẫn duy trì một hệ thống SEO duy nhất trên Product URL.
* Người dùng có một địa chỉ công khai ổn định trên domain iflux.vn.
* Người dùng có thể quảng bá, chia sẻ và chạy quảng cáo trực tiếp bằng địa chỉ của mình.
* Nút Share (user đã Login) mở Native Share Sheet; URL mang đi luôn là Owner URL của Self.
* Guest không Share — chỉ Copy link URL đang xem; Share/Like/Comment sau Login.
* Một nội dung chỉ có một Canonical.
* Owner URL và Product URL cùng tồn tại nhưng phục vụ hai mục đích kinh doanh khác nhau.
* Public Identity trở thành nền tảng dùng chung của toàn bộ hệ thống thay vì chỉ là cơ chế Affiliate.
* Owner Context được bảo toàn xuyên suốt từ thời điểm Owner URL được chia sẻ cho đến khi hoàn tất các nghiệp vụ phụ thuộc vào Owner.
* Người nhận truy cập thông qua các nền tảng phân phối hoặc In-App Browser được hệ thống hỗ trợ vẫn phải giữ đúng Owner Context cho đến khi hoàn tất Attribution hoặc khi có sự kiện nghiệp vụ hợp lệ làm thay đổi Owner Context.
* Việc chỉ sinh đúng Owner URL lúc Share nhưng làm mất Owner Context trong các bước tiếp theo không được xem là đáp ứng Business Requirement.

---

*Business Intent · nguồn cao nhất · SoT/Solution/Plan phải bám Brief này.*  
*Amendment 2026-07-30: §6A End-to-End Owner Context Preservation · §6B Native Share Sheet (Self) · §11 success criteria bổ sung.*
