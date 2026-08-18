# Audit — 3 Page Header trên Staging sau 55e45b7

**Task:** `180826_Admin Menu AppShell Behavior Standardization`  
**Ngày:** 18/08/2026  
**Status:** Audit only — **không fix · Task NOT PASS**  
**Owner verify:** Overview co · Partnership co · Withdrawals ~64px  
**Release origin:** `20260818175817-55e45b76a787`  

Không sửa code. Không đoán CSS mới.

---

# 1. Kết luận

Hai lớp, cùng lúc:

**A. Cơ chế layout (Audit 08, vẫn đúng)**  
Header cùng node, `flex-shrink: 1`. Host vẫn `display: block; flex: 0 1 auto; min-height: auto`. Khi Host + 64 > `main` (100vh), Header co sát nội dung trong (~37–43px).

**B. Vì sao 55e45b7 không có hiệu lực trên Staging**  
Origin đã có rule Host flex. **Trình duyệt không load file đó.**

```text
HTTPS iflux-admin-ui.css
  → Cloudflare HIT
  → last-modified 17/08/2026 (không phải 18/08 17:58)
  → @import components.css?v=seoBrandLogo36px20260810   ← bản cũ, không có Host rule

Origin disk (đúng release)
  → @import components.css?v=hostFlex20260818           ← có Host rule
```

Ba Page **không** có ba Header khác nhau. Chúng khác **chiều cao Page Host so với viewport**. Withdrawals Host thấp → không overflow → 64px. Overview Host ~1115 > 100vh → Header 37px. Partnership cùng contract; Owner thấy co khi Host của họ vượt phần còn lại của `main` (nhiều dòng bảng / cửa sổ thấp hơn).

---

# 2. Bằng chứng — CSS mà runtime thực sự dùng

## Origin (SSH, file trên release live)

| File | Thời điểm | Nội dung |
|---|---|---|
| `iflux-admin-ui.css` | 18/08 17:58 | `@import ...components.css?v=hostFlex20260818` |
| `components.css` | 18/08 17:58 | có `[data-ix-admin-page-host] { flex:1; ... }` |

## HTTPS https://staging.iflux.vn (Cloudflare)

| URL | CF | last-modified / etag | Host rule |
|---|---|---|---|
| `/Admin_Design_system/iflux-admin-ui/iflux-admin-ui.css` | **HIT** · max-age=14400 · age≈2896 | **17/08/2026 09:13** | import **cũ** `?v=seoBrandLogo36px20260810` |
| `components.css?v=seoBrandLogo36px20260810` | HIT | etag cũ | **không** có rule Host |
| `components.css?v=hostFlex20260818` | MISS (gọi tay) | — | **có** rule Host |

HTML Page:

```html
<link rel="stylesheet" href="/Admin_Design_system/iflux-admin-ui/iflux-admin-ui.css" />
```

Không cache-bust. CDN giữ bundle 4 giờ → browser không bao giờ request `?v=hostFlex20260818`.

Chrome Staging (document thật):

```text
stylesheet iflux-admin-ui.css
  importHint = ./components.css?v=seoBrandLogo36px20260810
  hasHost   = false
```

Computed Host trên cả 3 Page:

```text
display: block
flex: 0 1 auto
min-height: auto
```

Đúng contract **trước** remediation. Rule 55e45b7 **không nằm trong cascade**.

---

# 3. Bằng chứng — 3 Page cùng Staging (viewport 1280×800)

| | Overview | Partnership | Withdrawals |
|---|---|---|---|
| Header box | **37px** | 64px * | **64px** |
| Host flex | `0 1 auto` | `0 1 auto` | `0 1 auto` |
| Host scrollHeight | **1115** | 532–556 | **495** |
| main height | 800 | 800 | 800 |
| 64 + Host > main? | **có** | không (viewport này) | không |
| Page CSS → Header | không | không | không |
| Host children | `.ix-content` (+ svg Apex lúc F5) | `.ix-content` + modal `display:none` | chỉ `.ix-content` |

\* Partnership F5 trên 800px: Host 532 < 736 → Header còn 64. Owner đo **co** trên máy mình: cùng công thức, Host của Owner cao hơn phần còn lại (bảng nhiều dòng, hoặc viewport thấp hơn / DevTools). Không phải Header/CSS riêng của Page.

Nav cùng document Withdrawals → Partnership → Overview: Header **cùng node**. Overview lại 37px.

---

# 4. Nguyên lý khác biệt 3 Page

```text
main.ix-main = flex column, height 100vh, overflow hidden
header.ix-navbar = height 64px specified, flex-shrink 1
[data-ix-admin-page-host] = block, cao theo content   ← rule flex mới không apply
```

```text
nếu Host_content + 64 ≤ 100vh  → Header used height = 64     (Withdrawals)
nếu Host_content + 64  > 100vh  → Header used height = min-content ~37–43
                                   (Overview luôn; Partnership khi bảng/viewport đủ cao)
```

HTML 3 Page gần giống (cùng `iflux-admin-ui.css`, cùng `.ix-navbar`).  
Overview thêm `dashboard.css` — **không** chọn Header (Audit 08).  
Partnership có modal sau `.ix-root` → vào Host, `display:none`, không ăn chiều cao.

Khác biệt runtime = **chiều cao nội dung Host**, không = 3 implementation Header.

---

# 5. Vì sao local “64px Overview” không chứng minh Staging

Local load CSS **từ disk**, không qua Cloudflare → nhận `?v=hostFlex20260818` → Host `flex: 1 1 0%` → Header 64.

Staging public CSS graph vẫn là bundle **17/08**. Cùng commit origin, **khác stylesheet runtime**.

Không được coi local/contract PASS = Staging PASS.

---

# 6. Không làm gì tiếp

- Không sửa Header / không thêm CSS đoán.
- Không purge / không deploy trong audit này.
- Extract/swap, Express, PAGES, Registry, IA: không đụng.

Khi Owner mở bước tiếp: vấn đề cần xử lý trước là **CSS public Staging không phải file 55e45b7** (bundle `iflux-admin-ui.css` không có query, CF max-age 14400). Layout Host flex chỉ có ý nghĩa sau khi cascade runtime thực sự load rule đó — rồi mới đo lại R-01…R-05.

Task **NOT PASS**.
