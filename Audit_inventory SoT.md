Có, và đây là điểm rất quan trọng. Trước đó chúng ta đã thống nhất **không bao giờ xóa ngay sau khi bỏ hardcode**, mà theo quy trình audit ownership.

Quy trình mình đã dùng ở các đợt refactor Blueprint và Widget Governance là:

### Bước 1. Thay Ownership trước (Functional PASS)

Ví dụ trước:

```text
IfluxMarketLiquidity.mount(...)
        ↓
Layout Engine
        ↓
Host
```

Lúc này:

* Chức năng chạy đúng.
* Production PASS.
* Nhưng **HTML/CSS/JS cũ vẫn giữ nguyên** nếu chưa chứng minh là không còn được sử dụng.

---

### Bước 2. Audit Usage

Sau khi Runtime chạy ổn mới kiểm tra từng loại tài nguyên.

#### HTML

Ví dụ:

```html
<div data-ec-liq-mount></div>
```

Kiểm tra:

* còn JS nào query selector này không?
* còn CSS nào style selector này không?

Nếu:

```text
grep data-ec-liq-mount
```

ra 0 nơi sử dụng

→ mới được xóa.

---

#### JS

Ví dụ:

```js
mountLiquidity()
```

Kiểm tra:

* còn ai gọi không?
* còn import không?
* còn event listener không?

Nếu không còn consumer

→ mới xóa.

---

#### CSS

Ví dụ:

```css
.ec-liquidity-panel {}
```

Không được xóa ngay.

Phải kiểm tra:

```text
grep ec-liquidity-panel
```

Nếu:

* HTML không dùng
* JS không addClass
* Runtime không generate

→ mới xóa.

---

#### Class

Ví dụ

```html
class="ec-liquidity-panel"
```

Nếu class chỉ còn để decorate một widget đã bỏ

→ xóa.

Nếu class đang được widget khác reuse

→ giữ.

---

#### Selector

Ví dụ

```css
[data-ec-liq-mount]
```

Nếu selector không còn xuất hiện trong DOM

→ xóa.

---

# Đây chính là Hygiene Phase

Ngày trước chúng ta gọi là

```text
Functional PASS

↓

Ownership Audit

↓

Hygiene Cleanup

↓

Regression

↓

Commit
```

không bao giờ:

```text
Sửa

↓

Xóa sạch CSS

↓

Hy vọng không lỗi
```

---

# Tôi còn nhớ một nguyên tắc ông yêu cầu

Ông từng bắt agent làm theo đúng thứ tự:

> **Sửa xong → chạy PASS → audit từng HTML/CSS/JS/class/selector → chỉ xóa khi chứng minh không còn consumer.**

Tôi thấy nguyên tắc đó rất đúng.

---

## Tôi sẽ bổ sung vào task này một mục riêng

Ví dụ:

```text
### 6. Hygiene Cleanup (sau khi Functional PASS)

Chỉ thực hiện sau khi:

- Runtime PASS
- Publish PASS
- Reload PASS

Audit tuần tự:

1. HTML placeholder cũ
2. data-* selector
3. JS mount cũ
4. Event listener
5. CSS class
6. CSS selector
7. Import/module không còn consumer

Quy tắc:

- Chứng minh "0 consumer" mới được xóa.
- Không xóa hàng loạt.
- Mỗi nhóm xóa phải chạy regression.
- Nếu chưa chứng minh được ownership thì giữ nguyên.
```

Tôi nghĩ nên đưa mục này thành **Acceptance bắt buộc** chứ không chỉ là ghi chú, vì đây là bước giúp tránh tích lũy "xác chết" trong codebase sau mỗi lần gỡ hardcode.
