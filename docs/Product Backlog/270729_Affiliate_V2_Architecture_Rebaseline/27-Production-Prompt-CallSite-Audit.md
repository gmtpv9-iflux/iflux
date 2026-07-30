# Audit — Production `google.accounts.id.prompt()` call sites (post gisArch)

**Date:** 2026-07-30  
**Type:** Evidence only · **không sửa code**  
**Live:** `auth-social.js?v=gisArch20260730` · md5 `bc7c8629f9af214f05e3bd66e8a8b155`  
**Phạm vi quét:** toàn bộ script trong `auth-login-boot` + `auth-register-boot` FEATURE list (12 URL)

---

## Kết luận

**Đúng 1 call site executable** của `google.accounts.id.prompt(...)`.

| # | File | Line | Context |
|---|------|------|---------|
| 1 | `User_Web/iflux-web-ui/auth-social.js?v=gisArch20260730` | **198** | Trong `promptOneTapOnLoad()` |

**Chuỗi gọi:**

```text
IfluxAuthSocial.initPage
  → initGoogle (initialize)
  → renderVisibleGoogleButton
  → promptOneTapOnLoad          // L348
      → google.accounts.id.prompt(...)   // L198
```

**Không còn** call site khác trong:

* helper / wrapper / retry / timeout / fallback / click path  
* `auth-login-init.js` / `auth-register-init.js` / boot  
* các script FEATURE còn lại trên login/register boot  

**Legacy** `startGoogleLoginFromUserGesture` / `clickOffscreen*` / `ensureOffscreen*` chỉ còn **trong comment** (không executable). Comment có chữ `prompt()` — **không** phải call site.

---

## Moment APIs trong Production hiện tại

Trong `auth-social.js` live:

* **0** lần gọi `isSkippedMoment` / `isNotDisplayed` / `isDisplayMoment` / `isDisplayed` / `getSkippedReason`

Callback L198–201:

```js
google.accounts.id.prompt(function (notification) {
  if (!notification) return;
  /* intentional no-op ... */
});
```

→ Warning GSI về “One Tap prompt UI status methods” có thể vẫn xuất hiện vì **có truyền moment callback** / GIS client log chung khi dùng `prompt` + FedCM — **không** chứng minh app còn đọc các method đó. App **không** reject/toast từ moment nữa.

---

## Về AbortError / Prompt dismissed / NetworkError

Ngoài phạm vi đếm call site. Với **một** `prompt()` lúc load: chuỗi đó là **browser/FedCM** abort + dismiss One Tap (cooldown message GIS), không phải app gọi `prompt` lần 2. Không có evidence second call site trong source Production.
