# Plan — Production Google Login Bootstrap Race + User Data Sync Fix

**Date:** 2026-07-28  
**Status:** Plan only — **chưa implement**  
**SoT incident:** [19-Google-Icon-Runtime-Incident-Audit.md](19-Google-Icon-Runtime-Incident-Audit.md) (PASS)  
**Scope tách biệt:** **Không** thuộc WP7 gate · **Không** đụng Affiliate Attribution SoT · **Không** deploy WP7 trong phase này

---

## 1. Positioning vs WP7

| Track | Status |
|-------|--------|
| WP7 Google rebuild (feature branch) | Tiếp tục local regression / RV-1 / Owner Phase 5 — **không** trộn incident này |
| Production `googleProxy20260728` | Incident riêng — Fix Plan này |
| Production deploy WP7 | Phase **sau** Owner Phase 5 PASS |

```text
WP7 implementation audit PASS
  → WP7 runtime (controlled)
  → RV-1
  → Owner Phase 5 PASS
  → Production deploy WP7 (riêng)

Song song / trước hoặc độc lập:
  Incident 19 PASS → Fix Plan (doc này) → Owner APPROVE → Implement Production hotfix → verify
```

---

## 2. Impact Analysis (CG-005)

| Feature | Google Login icon trên `/dang-nhap` (+ `/dang-ky` cùng pattern) · `IfluxUserDataSync` hydrate |
| Current owner | Auth page HTML (`login.html` / `register.html`) · `auth-social.js` bind · `path-base.js` (`<base>`) · `iflux-user-data-sync.js` |
| Files | `User_Web/auth/login.html` · `User_Web/auth/register.html` · (optional CSS DS class đã có `ix-social-btn`) · `iflux-user-data-sync.js` · có thể `auth-login-init` / `auth-register-init` enable sau bind |
| Functions | `bindSocialButtons` · `initPage` · `installBase` (path-base — **không đổi map** trong Fix 1–2 trừ Owner mở) · `hydrateFromServer` |
| Consumers | Login / Register social buttons · mọi page hydrate user data |
| Storage/API | Không đổi API Google · không đổi Affiliate |

**Decision:**

| Item | Decision | Why |
|------|----------|-----|
| `#btn-google` `<a href="#">` | **Migrate** → `<button type="button">` | Hết native navigation / hết phụ thuộc `<base>` khi race |
| Button disabled until bind | **Modify** init + HTML | Đóng race window |
| `iflux-user-data-sync.js` extra `}` | **Modify** (syntax) | Production `IfluxUserDataSync` undefined |
| path-base `<base>` map | **Reuse / không đụng** trong hotfix | Không phải root cần xóa; decoupling bằng button |
| `javascript:void(0)` / inline onclick | **Cấm** | Phá SoT / a11y / pattern |

---

## 3. Root cause (locked — từ audit 19)

```text
/dang-nhap + path-base <base href="/User_Web/auth/">
  + <a id="btn-google" href="#">
  + click trước IfluxAuthSocial.bind (preventDefault)
  → browser resolve # theo baseURI
  → /User_Web/auth/# → nginx 403
```

Độc lập: `iflux-user-data-sync.js` SyntaxError (extra `}`).

---

## 4. Fix Plan (ưu tiên Owner)

### Fix 1 — Semantic (bắt buộc)

**Đổi** social Google (và ideally Apple/FB/Zalo cùng hàng nếu cùng `href="#"`) từ `<a>` → `<button type="button">`.

```html
<button type="button" class="ix-social-btn google" id="btn-google" title="Google" …>
  <i class="ti ti-brand-google-filled"></i>
</button>
```

| | |
|--|--|
| Existing | `login.html` / `register.html` `#btn-google` |
| Why cannot only patch JS | Race xảy ra **trước** JS; HTML fallback vẫn navigate |
| Diff ownership | Page markup Auth · bind vẫn `getElementById('btn-google')` |
| Cleanup | Xóa `href="#"` trên control action |

**Verify:** Race click (boot chưa xong) → **không** còn `/User_Web/auth/#` 403.

### Fix 2 — Disabled until hydrate (nên có)

| Steps | |
|-------|--|
| HTML | `disabled` (hoặc `aria-disabled` + class) trên social buttons lúc render |
| After `IfluxAuthSocial.initPage(…).then` / cuối `bindSocialButtons` | `removeAttribute('disabled')` |
| Optional | `pointer-events` / visual đã có trong DS — **không** invent CSS ad-hoc nếu thiếu token → báo Owner |

**Flow:**

```text
HTML button disabled → boot → bind → enable → user click
```

### Fix 3 — `iflux-user-data-sync.js` (bắt buộc, độc lập)

- Xóa `}` thừa trong `hydrateFromServer` (audit L48).
- `node --check` PASS.
- Runtime: `typeof IfluxUserDataSync === 'object'`.

**Không** gộp logic mới; chỉ sửa syntax.

### Không làm trong phase này

- Không `onclick=` / `javascript:void(0)`
- Không đổi Google OAuth / client ID / GIS proxy behavior (trừ enable timing)
- Không đổi `path-base` map trừ Owner phase riêng
- Không deploy feature WP7 như “fix” incident
- Không đụng Affiliate attribution rules

---

## 5. Delete / Cleanup checklist (khi implement)

| ID | Item |
|----|------|
| D1 | Không còn `<a href="#" id="btn-google">` trên login/register Production path |
| D2 | Race headed: click sớm ≠ `/User_Web/auth/#` |
| D3 | `node --check iflux-user-data-sync.js` PASS · global sync defined |
| D4 | Dead `href` / class thừa sau migrate — xóa |

---

## 6. Test plan (sau implement)

| Case | Expected |
|------|----------|
| Hard reload `/dang-nhap` → click **ngay** khi thấy nút | Không 403; hoặc no-op nếu còn disabled |
| Click sau boot | GIS / loginGoogle như hiện tại (Production googleProxy) |
| `/dang-ky` cùng pattern | Không 403 |
| Console | Không SyntaxError sync |
| Password login | Không regress |
| WP7 local stack | Không bắt buộc trong hotfix Production — regression riêng |

---

## 7. Owner gate

| ID | Quyết định | Status |
|----|------------|--------|
| OD-INC-01 | Approve Fix 1 (button semantic) | ☐ |
| OD-INC-02 | Approve Fix 2 (disabled until bind) | ☐ |
| OD-INC-03 | Approve Fix 3 (sync `}`) | ☐ |
| OD-INC-04 | Production hotfix deploy **tách** WP7 | ☐ |

**Chỉ implement sau OD-INC-01…03 (tối thiểu 01+03).**

---

*Change record / Fix Plan only. Không code trong deliverable này.*
