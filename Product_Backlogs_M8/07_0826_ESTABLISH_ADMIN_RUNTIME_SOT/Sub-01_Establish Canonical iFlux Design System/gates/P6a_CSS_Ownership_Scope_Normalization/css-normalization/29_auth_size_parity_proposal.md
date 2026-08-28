# P6a — Auth size parity (W10) — Đề xuất (rev. 2)

**Mode:** ĐỀ XUẤT — chưa thi công. STOP chờ Owner duyệt §10.  
**Date:** 2026-08-28 · **Rev:** 2 (Owner review: classification PASS, implementation NEEDS REVISION)  
**Surface:** [Workbench Auth](http://127.0.0.1:8901/design_system/workbench/?module=patterns&pattern=auth)  
**Legacy SoT (4 file, 4 state):**

| State | File | Staging |
|---|---|---|
| Login | `Admin_Design_system/auth/login.html` | https://staging.iflux.vn/Admin_Design_system/auth/login.html |
| Register | `Admin_Design_system/auth/register.html` | https://staging.iflux.vn/Admin_Design_system/auth/register.html |
| Forgot Password | `Admin_Design_system/auth/forgot.html` | https://staging.iflux.vn/Admin_Design_system/auth/forgot.html |
| Verify 2FA | `Admin_Design_system/auth/verify-2fa.html` | https://staging.iflux.vn/Admin_Design_system/auth/verify-2fa.html |

**Luật**

1. Global = `design_system/{tokens,foundation,primitives,components,patterns}/`. Không `.ifx-auth*`.
2. Lower layer mô phỏng chỉ tại `design_system/sandbox/assets/reference-layers.css`.
3. Token LOCKED. 420 và 36×40 = literal PAGE. Không invent `--ifx-space-36` / size-auth.
4. Không redefine `.ifx-*` trong sandbox. Không `admin-auth.js`. Không Google GIS runtime.
5. Target = **100% template/visual từng state Legacy**. Không “residual chấp nhận” khi cùng use case.
6. Mỗi mismatch: cùng use case → xem Global có cần variant tái sử dụng; khác use case → tách lớp; chỉ page → PAGE.

---

## 0. Owner lock / reject (rev. 2)

| ID | Status | Nội dung |
|---|---|---|
| D1 | **LOCKED YES** | Splash `100vh` flex center → `.ref-platform-auth` |
| D2 | **LOCKED YES** | Không Page Header / Grid / catalog chrome **trong canvas** |
| D3 | **LOCKED P0** | Card padding `36px 40px` |
| D4 | **LOCKED** | Card `max-width: 420px` literal |
| D5 | **REJECT** | Cấm 1 card 4 tab gộp Login/Register/Forgot/2FA |
| D6 | **LOCKED** | Xóa Alert Demo catalog (“Demo / Không gọi runtime”) |
| D7 | **LOCKED YES** | Brand + title + sub **trong card** — copy = **đúng chữ Legacy từng state** (§3–6) |
| D8 | **PER STATE** | Chỉ Verify 2FA: 1 input (không 6 ô). Login/Register/Forgot: không OTP |
| D9 | **PER STATE** | Chỉ Register: password eye. Login/Forgot/2FA: không eye |
| D10 | **LOCKED YES** | `box-shadow: none` trên auth card |
| D11 | **LOCKED YES** | Platform root `padding: var(--ifx-space-16)` |

---

## 1. Kiến trúc (thay 1 card 4 tab)

```text
Workbench (NGOÀI canvas)
  sidebar: Auth
  state switcher: Login | Register | Forgot Password | Verify 2FA
       │  iframe src theo state
       ▼
Auth Pattern canvas (MỘT state / một document)
  .ref-platform-auth
    .ifx-card.ref-page-auth-card
      = đúng template Legacy của state đó
```

**Trong canvas**

- Login **được** giữ 2 tab Legacy: `Bằng Gmail` · `Bằng mật khẩu` (đổi **phương thức Login**, không phải đổi state Auth).
- Register / Forgot / 2FA: **không** tab.
- Link trong card (`Đăng nhập`, `Quay lại đăng nhập`) là nội dung Legacy — được phép đổi canvas sibling. Không thay bằng tab catalog.

**Ngoài canvas (Workbench = PLATFORM workbench)**

Đề xuất: một item sidebar **Auth** + switcher trên AppShell bar (`ifx-tabs ifx-tabs-nav`, đã có Global). URL:

`?module=patterns&pattern=auth&state=login|register|forgot|verify-2fa`

Default `state=login`. Iframe:

`design_system/references/patterns/auth/{login|register|forgot|verify-2fa}.html`

`index.html` = Login (entrypoint).

**Không** nhét 4 state vào `IfxTabs` trong card.

**JS runtime cấm:** `IfluxAdminAuth`, GIS, redirect Hub/Dashboard. Toast demo được (Register / Forgot / 2FA Legacy đã toast).

---

## 2. Shell dùng chung 4 state

Mọi state: cùng root + cùng card. Chiều cao card **khác nhau** vì nội dung — đúng Legacy.

| Token | Legacy | Đề xuất | Owner |
|---|---|---|---|
| Root | `.ix-auth-root` 100vh flex center | `.ref-platform-auth` + pad 16 (D11) | PLATFORM → `platform/admin/` |
| Card | 100% / max 420 / pad 36×40 / radius lg / border / **không** shadow | `.ifx-card.ref-page-auth-card` — không `.ifx-card-header/body` | Card Global + PAGE hook |
| Brand | 20 / bold / center / mb 24 | `.ref-page-auth-brand` + `--ifx-font-size-20` + `--ifx-font-weight-bold` + `--ifx-space-24` | PAGE |
| Title | 20 / bold / mb 4 | `h2` Foundation (20/800) + PAGE `margin-bottom: var(--ifx-space-4)` (h2 Global đang mb 8) | Foundation h2 + PAGE rhythm |
| Sub | 14 muted / mb 24 | PAGE `--ifx-font-size-14` + `--ifx-text-muted` + `--ifx-space-24` | PAGE (không Title `p` — Title `p` = 13) |

**Không** dùng `.ifx-container` / Grid / Page Header trong canvas.

---

## 3. Login — structure / copy / size / reuse / mismatch

### 3.1 Structure (đúng thứ tự Legacy)

```text
.ref-platform-auth
  .ifx-card.ref-page-auth-card
    brand
    title
    sub
    alert danger          (slot lỗi; mặc định ẩn, rỗng)
    .ifx-tabs             (CHỈ 2 phương thức Login)
      Bằng Gmail | Bằng mật khẩu
    panel Gmail
      host GIS            (EXCLUDE runtime — slot trống)
      nút outline Gmail   (Legacy ẩn tới khi GIS fail)
      alert warning       (Legacy ẩn tới khi Google không dùng được)
    panel Password        (form)
      group Email
      group Mật khẩu      (input password — KHÔNG eye)
      submit primary
    remember              (NGOÀI panel — luôn dưới tabs)
    helper phiên          (NGOÀI panel)
```

Legacy HTML default **trước JS:** tab Gmail active, panel password `display:none`, mọi alert/nút Gmail **ẩn**, host GIS trống.

Legacy **sau JS trên HTTP/IP** (`127.0.0.1`): Gmail tab disabled, chuyển Password, hiện warning. Staging HTTPS + clientId: GIS hiện, Gmail default.

Không `admin-auth.js` → default demo **không** tự chạy nhánh HTTP. Quyết định D13 (§10).

### 3.2 Copy / demo (đúng chữ)

| Slot | Chữ Legacy |
|---|---|
| Brand | `iFlux Admin` |
| Title | `Đăng nhập quản trị` |
| Sub | `Chỉ tài khoản được cấp quyền mới truy cập được khu vực Admin.` |
| Tab | `Bằng Gmail` · `Bằng mật khẩu` |
| Label | `Email` · `Mật khẩu` |
| Placeholder | `admin@iflux.vn` · `••••••••` |
| Submit | icon `ti-login` + `Đăng nhập` |
| Gmail fallback | icon `ti-brand-google-filled` + `Đăng nhập bằng Gmail` |
| Warning | `Trình duyệt/địa chỉ này không mở được đăng nhập Google. Hãy chuyển sang tab “Bằng mật khẩu”.` |
| Remember | `Ghi nhớ đăng nhập trên máy này` (checked) |
| Helper | `Phiên ghi nhớ giữ đăng nhập để lần sau không cần xác thực lại trên trình duyệt này.` |
| Error slot | rỗng, ẩn — **không** Alert Demo catalog |

Không value sẵn trên input (Legacy chỉ placeholder).

### 3.3 Dimensions (ngoài shell §2)

| Đo | Legacy | Token / literal |
|---|---|---|
| Tabs host | `margin: 12px auto 20px` | 12 + 20 có token; `auto` = PAGE |
| Tab pad | `6px 14px` | xem M-TABS |
| Tab font | 14 | xem M-TABS |
| Tabs host pad / gap | 3px / 2px | xem M-TABS |
| Form group | mb 16 | `--ifx-stack-md` — xem M-GROUP |
| Label | 14 / medium / secondary / mb 8 | xem M-LABEL |
| Input font | 14 | xem M-INPUT |
| Submit | width 100% + `margin-top: 8` | PAGE + hook submit. Group mb 16 + mt 8 = **24** tới nút |
| Remember | `margin-top: 18` (inline) | **18 không có token** — xem M-18 |
| Check row | gap 7 / font 14 / secondary / align center | xem M-CHOICE |
| Helper | 14 muted / center / mt 16 | PAGE |

### 3.4 Global reuse

| Mảnh | Class Global | Đủ 100%? |
|---|---|---|
| Card surface | `.ifx-card` | Không — cần PAGE width/pad/shadow |
| Segmented 2 tab | `.ifx-tabs` `.ifx-tab` + `tabs.js` | Cùng use case; **metric lệch** M-TABS |
| Label / input / checkbox | Form | Metric lệch M-LABEL / M-INPUT / M-CHOICE |
| Button primary / outline | `.ifx-btn` | Width = PAGE hook (đã có) |
| Alert danger / warning | `.ifx-alert-*` | Slot đúng; type 14 vs 13 = M-ALERT |
| Icon | Tabler + `.ifx-icon` | Có |
| Toast | không trên Login template (lỗi = alert) | Không toast Login trừ Owner muốn |

### 3.5 Mismatch Login

| ID | Lệch | Cùng use case? | Owner đề xuất |
|---|---|---|---|
| M-TABS | Tab 6×14 / 14 / host pad 3 vs Canon 8×12 / 13 / pad 2 | Có — segmented | **TABS** variant hoặc chỉnh default về rewrite `.ix-tabs` (§8) |
| M-LABEL | 14 vs `.ifx-label` 13 | Có — form label | **FORM** |
| M-INPUT | 14 vs `.ifx-input` 13 | Có — text field | **FORM** |
| M-GROUP | `.ifx-form-group` 0 rule; Legacy mb 16. Auth **không** Stack (tránh lệch 16 vs 24 tới nút) | Có — field group | **FORM** `.ifx-form-group { margin-bottom: var(--ifx-stack-md) }` |
| M-CHOICE | gap 7 / 14 / secondary / center vs `.ifx-choice` gap 12 / 13 / primary / start | Có — checkbox + label | **FORM** (align + size). 7 → gần `--ifx-space-8` |
| M-18 | remember mt 18 | Chỉ Login chrome | **PAGE** literal `18px` |
| M-TABS-PLACE | tabs `12 auto 20` | Chỉ Login | **PAGE** |
| M-SUBMIT-8 | submit mt 8 | Login password | **PAGE** |
| M-GIS | GIS widget | Khác — vendor | **EXCLUDE**. Slot + outline = PAGE demo (D13) |
| M-AUTH-JS | allowlist / redirect | Khác — runtime | **EXCLUDE** |

D8/D9 Login: không OTP, không eye.

---

## 4. Register — structure / copy / size / reuse / mismatch

### 4.1 Structure

```text
.ref-platform-auth
  .ifx-card.ref-page-auth-card
    brand
    title
    sub
    group Tên hiển thị
    group Email
    group Mật khẩu
      .ifx-input-password (THIẾU) + toggle eye
    terms (checkbox + câu + link)
    submit primary
    footer “Đã có tài khoản?” + link Đăng nhập
```

Không tabs. Không remember. Không helper phiên.

### 4.2 Copy / demo

| Slot | Chữ Legacy |
|---|---|
| Brand | `iFlux` |
| Title | `Tạo tài khoản quản trị 🚀` |
| Sub | `Dành cho nhân viên được mời — cần phê duyệt từ Admin` |
| Labels | `Tên hiển thị` · `Email` · `Mật khẩu` |
| Placeholders | `Nguyễn Văn A` · `admin@iflux.vn` · `············` |
| Terms | `Tôi đồng ý với ` + link `điều khoản & chính sách` |
| Submit | `Đăng ký` (không icon) |
| Footer | `Đã có tài khoản?` · `Đăng nhập` |
| Toast | `Đã gửi yêu cầu đăng ký` / success |
| Eye | `aria-label="Hiện mật khẩu"` · `ti-eye-off` → `ti-eye` |

Link Đăng nhập → canvas Login (ngoài = workbench state; trong = sibling href).

### 4.3 Dimensions

| Đo | Legacy |
|---|---|
| Groups | mb 16 (M-GROUP) |
| Password wrap | input `padding-right: 40`; toggle absolute right 10, center |
| Terms block | `margin: 16px 0` |
| Submit | width 100% + `margin-bottom: 16` |
| Footer | center, 14 muted, mt 16; link accent |
| Eye icon | 16 |

### 4.4 Global reuse

Button, Form label/input/checkbox, Card, Toast: như Login.

**Thiếu Global:** password reveal. Legacy `.ix-input-password-wrap` / `-toggle` nằm trong `components.css` AUTH block nhưng **use case = password field** (Register, sau này profile).

Đề xuất: **FORM** `.ifx-input-password` + `.ifx-input-password-toggle` + JS nhỏ (`form.js` hoặc adapter). Không PAGE-only trừ Owner cấm Form mới.

Link trong câu: Foundation `a { color: var(--ifx-text-link) }` — **đã có**. Bỏ inline accent.

### 4.5 Mismatch Register

| ID | Lệch | Cùng use case? | Owner |
|---|---|---|---|
| M-LABEL / M-INPUT / M-GROUP / M-CHOICE | như Login | Có | **FORM** |
| M-EYE | không có wrap/toggle | Có — password reveal | **FORM** + JS Form |
| M-TERMS-16 | khối terms 16 0 | Register chrome | **PAGE** |
| M-FOOTER | footer 14 center mt 16 | Auth footer (Register + 2FA) | **PAGE** `.ref-page-auth-footer` |
| M-EMOJI | 🚀 trên title | Copy Legacy — giữ chữ | Không CSS |
| D9 | eye **có** | — | Theo state này |

---

## 5. Forgot Password — structure / copy / size / reuse / mismatch

### 5.1 Structure

```text
.ref-platform-auth
  .ifx-card.ref-page-auth-card
    brand
    title
    sub
    group Email
    submit primary + icon send
    back link + chevron
```

Không tabs, remember, eye, OTP, footer “Đã có tài khoản”.

### 5.2 Copy / demo

| Slot | Chữ Legacy |
|---|---|
| Brand | `iFlux` |
| Title | `Quên mật khẩu? 🔒` |
| Sub | `Nhập email để nhận hướng dẫn đặt lại mật khẩu` |
| Label | `Email` |
| Placeholder | `admin@iflux.vn` |
| Submit | `ti-send` + `Gửi link đặt lại` |
| Back | `ti-chevron-left` + `Quay lại đăng nhập` |
| Toast | `Đã gửi link đặt lại mật khẩu` / success |

### 5.3 Dimensions

| Đo | Legacy |
|---|---|
| Group | mb 16 |
| Submit | width 100% + `margin-bottom: 8` |
| Back | flex center, gap 4, 14 accent, mt 16; icon 13 |

### 5.4 Global reuse

Form email, Button primary + icon, Card. Back = PAGE (không có `.ifx-link-back`).

### 5.5 Mismatch Forgot

| ID | Lệch | Cùng use case? | Owner |
|---|---|---|---|
| M-LABEL / M-INPUT / M-GROUP | như Login | Có | **FORM** |
| M-SUBMIT-8 | mb 8 dưới nút | Forgot chrome | **PAGE** |
| M-BACK | back row + icon 13 | Auth back (Forgot + 2FA) | **PAGE** `.ref-page-auth-back` |
| D8 / D9 | không OTP / không eye | — | — |

---

## 6. Verify 2FA — structure / copy / size / reuse / mismatch

### 6.1 Structure

```text
.ref-platform-auth
  .ifx-card.ref-page-auth-card
    brand
    title
    sub
    group
      label Mã xác thực
      1 input text (không 6 ô)
      helper <p>
    submit (Legacy = <a class="ix-btn">)
    footer link Quay lại đăng nhập
    back Về Hub checklist
```

Không tabs, eye, remember.

### 6.2 Copy / demo

| Slot | Chữ Legacy |
|---|---|
| Brand | `iFlux` |
| Title | `Xác thực 2FA` |
| Sub | `Nhập mã 6 số từ ứng dụng Authenticator (TOTP) — BR-ADM-02` |
| Label | `Mã xác thực` |
| Placeholder | `000000` · `maxlength=6` · `inputmode=numeric` |
| Helper | `Mã làm mới mỗi 30 giây. Không chia sẻ mã với bất kỳ ai.` |
| Submit | `Xác nhận` |
| Footer | `Quay lại đăng nhập` |
| Back | `ti-chevron-left` + `Về Hub checklist` |
| Toast | thiếu 6 số: `Nhập đủ 6 số TOTP` / warning · đủ: `2FA xác thực thành công` / success |

Submit: Button (không `<a>` sang dashboard). Hub: giữ **chữ**; `href` không sang Admin Hub (D14).

### 6.3 Dimensions

| Đo | Legacy | Token gần |
|---|---|---|
| OTP input | center / `var(--ifx-font-mono)` / `letter-spacing: 0.25em` / **20px** | mono **có**. 20 **có** (`--ifx-font-size-20`). `0.25em` **không** (caps = 0.08em) |
| Helper | 12 / muted / `margin: 8px 0 0` | xs = 12. `.ifx-field-hint` = 13 + mt 4 |
| Submit | width 100% + mb 16 | PAGE |
| Footer | mt 16 | PAGE |
| Back | `margin-top: 20` (inline, cộng mt 16 class) | PAGE 20 |

`.ix-otp-digit` (6 ô) **không** có trên trang này. Không dựng 6 ô.

`.ref-page-auth-otp` hiện tại: center + caps 0.08em + xl (18). **Chưa** 100%.

### 6.4 Global reuse

Form + Button + Card + Toast. OTP surface: cùng use case “ô mã một lần” (2FA, sau này verify email).

Đề xuất: **FORM** `.ifx-input-otp` (center, mono, 20, tracking). `0.25em` = literal trên variant Form (không token mới) **hoặc** PAGE nếu Owner coi chỉ 2FA.

Helper: `.ifx-field-hint` lệch 12/8 → **FORM** hint size/rhythm **hoặc** hint variant compact.

### 6.5 Mismatch 2FA

| ID | Lệch | Cùng use case? | Owner |
|---|---|---|---|
| M-LABEL / M-INPUT / M-GROUP | như Login | Có | **FORM** |
| M-OTP | 0.25em / 20 / mono vs hook 0.08 / 18 | Có — OTP field | **FORM** `.ifx-input-otp` |
| M-HINT | 12 + mt 8 vs hint 13 + mt 4 | Có — helper dưới field | **FORM** (hint vs caption) |
| M-HUB | “Về Hub checklist” | Khác — Admin Hub | **PAGE** copy; href demo (D14) |
| M-BACK-20 | back mt 20 | 2FA chrome | **PAGE** |
| D8 | 1 ô, không 6 | — | theo state này |
| D9 | không eye | — | — |

---

## 7. Tổng hợp Global (không gọi là residual)

Cùng use case, lặp 2+ state → **không** page-patch từng auth. Owner chọn một hướng / contract.

| ID | Rewrite Legacy | Canon Global | Đề xuất |
|---|---|---|---|
| M-TABS | pad 6×14, font 14, host pad 3, gap 2 | 8×12, sm 13, pad 2, gap 2 | **A** default Tabs về số rewrite (đụng mọi Tabs). **B** variant `.ifx-tabs` dense, Login dùng variant. Không PAGE override metric. |
| M-LABEL | 14 | 13 (`sm`) | **A** `.ifx-label` → `--ifx-font-size-14` (đúng comment REWRITE `.ix-label`). **B** `.ifx-label-md`. |
| M-INPUT | 14 | 13 | Cùng A/B với label (field 14). |
| M-GROUP | mb 16 | 0 rule | Thêm `.ifx-form-group`. Auth dùng group, **không** bọc `ifx-stack-md` (tránh double + lệch submit). Form khác đang Stack: không gắn group+stack cùng lúc. |
| M-CHOICE | 14 / gap 7 / center / secondary | 13 / gap 12 / start / primary | **A** chỉnh `.ifx-choice` gần rewrite. **B** variant compact. 7→8 token. |
| M-ALERT | title/text 14; alert `margin-bottom: 12` | 13; không mb | Chỉ hiện khi show error/warning. **ALERT** 14 + mb nếu muốn khớp lúc hiện. |
| M-EYE | wrap + toggle | không | **FORM** (Register bắt buộc) |
| M-OTP | 20 / mono / 0.25em | hook PAGE lệch | **FORM** `.ifx-input-otp` |
| M-HINT | 12 / mt 8 | 13 / mt 4 | **FORM** hint |

**PAGE-only** (không lên Global): splash, 420, 36×40, brand lockup, tabs `12 auto 20`, remember 18, submit mt/mb 8, terms 16 0, footer, back, Hub chữ, GIS slot.

**EXCLUDE:** GIS, `admin-auth.js`, social 36 circle, 6 ô OTP, Alert Demo catalog.

---

## 8. File / CSS / JS dự kiến (chưa làm)

### 8.1 Canvas files

```text
design_system/references/patterns/auth/
  index.html          → Login (hoặc redirect login.html)
  login.html
  register.html
  forgot.html
  verify-2fa.html
  page.js             → IfxTabs (chỉ login.html) + toast + eye (register) + OTP length toast (2fa)
```

Xóa compose 4 tab + Page Header + Grid + Alert Demo.

### 8.2 `reference-layers.css`

**PLATFORM — auth**

```css
.ref-platform-auth {
  box-sizing: border-box;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--ifx-space-16);
  background: var(--ifx-bg-canvas);
}
```

**PAGE — auth** (giữ submit/alt; otp chuyển lên Form nếu D-OTP = FORM)

```css
.ref-page-auth-card { width: 100%; max-width: 420px; padding: 36px 40px; box-sizing: border-box; }
.ref-page-auth-card.ifx-card { box-shadow: none; }
.ref-page-auth-brand { /* center, 20, bold, mb 24 */ }
.ref-page-auth-heading h2 { margin: 0 0 var(--ifx-space-4); }
.ref-page-auth-heading p { margin: 0 0 var(--ifx-space-24); font-size: var(--ifx-font-size-14); color: var(--ifx-text-muted); }
.ref-page-auth-methods { margin: var(--ifx-space-12) auto var(--ifx-space-20); } /* Login tabs host */
.ref-page-auth-submit { width: 100%; }
.ref-page-auth-submit-login { margin-top: var(--ifx-space-8); }
.ref-page-auth-submit-register { margin-bottom: var(--ifx-space-16); }
.ref-page-auth-submit-forgot { margin-bottom: var(--ifx-space-8); }
.ref-page-auth-submit-otp { margin-bottom: var(--ifx-space-16); }
.ref-page-auth-session { margin-top: 18px; }
.ref-page-auth-session-note { display: block; margin-top: var(--ifx-space-16); text-align: center; font-size: var(--ifx-font-size-14); color: var(--ifx-text-muted); }
.ref-page-auth-terms { margin: var(--ifx-space-16) 0; }
.ref-page-auth-footer { margin-top: var(--ifx-space-16); text-align: center; font-size: var(--ifx-font-size-14); color: var(--ifx-text-muted); }
.ref-page-auth-back { display: flex; align-items: center; justify-content: center; gap: var(--ifx-space-4); margin-top: var(--ifx-space-16); font-size: var(--ifx-font-size-14); color: var(--ifx-action-primary); text-decoration: none; }
.ref-page-auth-back-hub { margin-top: var(--ifx-space-20); }
```

Không `.ref-page-auth-alt` (không còn nút “liên kết” catalog).

### 8.3 Workbench (NGOÀI canvas)

`workbench.js` + `workbench/index.html`: đọc `state`, set iframe file, render 4 control trên bar. Không CSS auth trong workbench (chỉ nav).

### 8.4 Global — chỉ sau Owner §10

Không đụng token. Có thể đụng `tabs.css` / `form.css` / `alert.css` / `form.js` theo A/B.

### 8.5 Không đụng

`Admin_Design_system/auth/*`. Không commit trừ Owner.

---

## 9. Login Gmail — default canvas (D13)

| Option | Canvas mặc định | Khớp |
|---|---|---|
| **L1** | Đúng HTML tĩnh: Gmail active, panel trống, alert ẩn | Template trước JS — **thiếu** control |
| **L2** | Password active + warning + Gmail disabled | JS trên `127.0.0.1` |
| **L3 (đề xuất)** | 2 tab dùng được; **default Password** (form đủ); panel Gmail = outline `Đăng nhập bằng Gmail` (toast demo, không GIS); warning **ẩn** | Form login reviewable; Gmail = fallback Legacy, không vendor |

GIS luôn EXCLUDE.

---

## 10. Owner duyệt rồi mới code

Trả lời các dòng còn mở. D1–D4, D6, D7, D10, D11, reject D5 = đã khóa.

| ID | Câu hỏi | Đề xuất |
|---|---|---|
| **N1** | Switcher ngoài canvas | AppShell bar 4 state + `?state=` + 4 HTML |
| **D13** | Default Login | **L3** |
| **D14** | “Về Hub checklist” | Giữ chữ; `href="#"` + toast demo, không sang Hub |
| **D-TABS** | M-TABS | **B** variant dense trên Login methods |
| **D-FORM-TYPE** | M-LABEL / M-INPUT | **A** label+input = 14 (REWRITE) |
| **D-GROUP** | M-GROUP | Thêm `.ifx-form-group`; auth không Stack |
| **D-CHOICE** | M-CHOICE | **B** không đổi mọi choice; PAGE/Form compact chỉ auth **hoặc** A nếu Owner muốn mọi form |
| **D-ALERT** | M-ALERT | Chỉ khi show; **A** 14 + mb 12 trên Alert |
| **D-EYE** | Register eye | **FORM** Global + JS |
| **D-OTP** | 2FA input | **FORM** `.ifx-input-otp` + `0.25em` literal trên variant |
| **D-HINT** | Helper 12 / mt 8 | **FORM** hint khớp 12 + mt 8 **hoặc** variant `.ifx-field-hint-tight` |

---

## 11. Việc không làm

- Không 4 tab trong card.  
- Không 6 ô OTP.  
- Không GIS / `admin-auth.js`.  
- Không Alert Demo catalog.  
- Không đổi `--ifx-inset-card`.  
- Không comment UI.  
- **Không thi công** đến khi §10 đủ. *(rev.2 — đã duyệt, đã thi công)*

---

## 13. Implementation + verify (2026-08-28)

§10 Owner = YES theo quyết định đã khóa. Đã implement. Không sửa `Admin_Design_system/auth/*`.

**Local measure:** Chrome headless, 1440 / 1024 / 768 / 390. Canon = 4 HTML reference. Legacy = 4 file `Admin_Design_system/auth/`.

| Gate | Result |
|---|---|
| AUTH_LOGIN_PARITY | **PASS** — 4 viewport; card 420 / pad 36×40 / center 0; 2 tab dense 6×14 / 14; L3 Password default; copy khớp |
| AUTH_REGISTER_PARITY | **PASS** — eye có; footer đúng chữ; 4 viewport |
| AUTH_FORGOT_PARITY | **PASS** — back “Quay lại đăng nhập”; 4 viewport |
| AUTH_2FA_PARITY | **PASS** — OTP 20 / mono / 0.25em; hint 12 + mt 8; “Về Hub checklist” không sang Hub |
| GLOBAL_FORM_REGRESSION | **PASS** — sandbox Form + W02: label/input 14; default choice gap 12; default hint 13/mt 4; stack+group gap 16 (không double) |
| GLOBAL_TABS_REGRESSION | **PASS** — default tab 8×12 / 13; dense 6×14 / 14 |
| MATERIAL_VISUAL_DELTA | **0** so với §10. @390 card 358 (D11 pad 16) vs Legacy full 390 — đúng lock, không phải lệch grammar |
| Workbench N1 | **PASS** — bar ngoài canvas; `?state=`; iframe file riêng |

@390 Legacy card = 390 vì root không pad. Canon = 358 vì D11. Không chỉnh.

STOP. Không chuyển pattern tiếp.

---

## 12. Quan hệ tài liệu

| Doc | Vai trò |
|---|---|
| File này rev. 2 | Implementation proposal — chờ duyệt |
| [`P6-W10.md`](../../P6-W10.md) | Wave catalog 4 tab = **superseded** |
| [`18_reference_composition_parity_w04_w10.md`](18_reference_composition_parity_w04_w10.md) | “Do not copy 100vh” + “4 generic steps” = luật cũ |
| [`new_solution.md`](../new_solution.md) | Receiver + ownership |
| [`docs/SoT — iFlux Product Architecture (V2).md`](../../../../../../docs/SoT — iFlux Product Architecture (V2).md) | Splash = platform/page, không capability Global mới |
