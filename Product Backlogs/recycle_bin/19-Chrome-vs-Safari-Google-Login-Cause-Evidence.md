# Chrome vs Safari — Cause Evidence (Google Login Production)

**Date:** 2026-07-29  
**Type:** Cause evidence · không sửa code  
**Production path:** `auth-social.js?v=googleProxy20260728` (`clickOffscreenGoogleActivator`)  
**Artifact:** `.tmp/phase5-task3/chrome-vs-safari/contrast.json` · `chrome-vs-webkit-full.json`

---

## 1. Sự kiện trên path (Production)

```text
initPage
  → ensureOffscreenGoogleActivator
      → google.accounts.id.initialize({ use_fedcm_for_prompt: true, … })
      → google.accounts.id.renderButton(proxy, { type:'icon', theme:'outline', size:'medium', shape:'circle' })
  → User click #btn-google
      → clickOffscreenGoogleActivator
          → btn = querySelector('[role=button]') || querySelector('div[tabindex]')
```

Cùng code · cùng page · khác browser → GIS **render ra light DOM khác nhau**.

---

## 2. Đo đối chứng (cùng URL `https://iflux.vn/dang-nhap`)

| | Chrome 150 | WebKit (Safari engine 17.4) |
|--|------------|------------------------------|
| `is_fedcm_supported` trong iframe `src` | **`true`** | **`false`** |
| Light DOM có `DIV[role=button]` | **Không** | **Có** (overlay `L5Fo6c-bF1uUb`) |
| Light DOM có `div[tabindex]` | **Không** | **Có** (`tabindex=0` trên overlay) |
| Inventory tags | `DIV, DIV, DIV, IFRAME` | `DIV… IFRAME` + **`DIV[role=button]`** |
| `clickOffscreenWouldReturn` | **`false`** | **`true`** |
| Toast sau click `#btn-google` | Có (`… [auth-social.js]`) | Không (probe) |
| iframe cross-origin | Có (cả hai) | Có (cả hai) |

### WebKit `proxy.innerHTML` (đo được) — có overlay clickable

```html
…<iframe … is_fedcm_supported=false …></iframe>
<div class="L5Fo6c-bF1uUb" … role="button" tabindex="0" …></div>
```

### Chrome — không có overlay đó

```html
…<iframe … is_fedcm_supported=true … allow="identity-credentials-get" …></iframe>
<!-- không có DIV role=button sibling trong light DOM -->
```

---

## 3. Chuỗi nhân quả (evidence-bound)

```text
GIS renderButton trên Chrome
  → iframe src có is_fedcm_supported=true
  → light DOM: chỉ iframe, KHÔNG có overlay role=button
  → clickOffscreen querySelector → null
  → return false
  → toast

GIS renderButton trên Safari/WebKit
  → iframe src có is_fedcm_supported=false
  → light DOM: iframe + overlay DIV[role=button][tabindex=0]
  → clickOffscreen tìm thấy btn → .click() → return true
  → (tiếp credential path — Owner Safari PASS)
```

| | |
|--|--|
| **First abnormal state (Chrome)** | Sau `renderButton`: light DOM **không** có phần tử thỏa selector; trong khi code click **bắt buộc** có |
| **Failure point** | `clickOffscreenGoogleActivator` → `btn == null` → `return false` |
| **Vì sao Safari OK** | GIS vẫn chèn **overlay `role=button`** trong light DOM (`is_fedcm_supported=false`) → selector khớp |

---

## 4. Không phải

- Backend OAuth (Safari PASS + user Google đã tạo)
- SDK không load (cả hai có `google.accounts.id` + iframe)
- Hai file Product khác nhau (cùng `auth-social.js` Production)

---

*Cause evidence · Chrome vs WebKit same page · 2026-07-29.*
