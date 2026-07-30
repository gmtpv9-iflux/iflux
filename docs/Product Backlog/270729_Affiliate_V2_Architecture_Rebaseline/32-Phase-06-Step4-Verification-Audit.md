# Phase 6 · Step 4 — Verification Audit

**Date:** 2026-07-30  
**Status:** ✅ **Verification PASS** — Owner runtime PASS + grep/static PASS · chờ Step 5 Phase Acceptance  
**Design:** [`30-Phase-06-Implementation-Design-URL-Representation-Writer.md`](30-Phase-06-Implementation-Design-URL-Representation-Writer.md)  
**Change List:** [`31-Phase-06-Step3-Change-List.md`](31-Phase-06-Step3-Change-List.md)  
**Production:** `?v=p6Writer20260730` · CDN auth.js có marker `P6-API-01`

**§6A:** Pass Phase 6 ≠ Pass §6A · ≠ Final Program PASS · ≠ tuyên bố kênh phân phối.

---

## 0. Verdict matrix

| Area | Result | Note |
|------|--------|------|
| P6-API-01 / AC-D7 | ✅ PASS | Internal nav → `Writer.navigate`; thin alias only |
| DQ-01 Writer đọc NC | ✅ PASS | Grep: không `IfluxIdentityContext` trong Writer |
| DQ-02 Auth không prepend | ✅ PASS | Không sửa `isApplicationZone` auth strip |
| DQ-03 Post-login restore | ✅ PASS | **Owner test 2026-07-30** |
| DQ-04 Hybrid + allowlist evidence | ✅ PASS | §3 allowlist đóng VERIFY@S4 |
| Business Representation P6-V-B* | ✅ PASS | Owner journey + static |
| Process | ✅ | Step 3 Change List + deploy + CF purge |

### Overall

**Step 4 Verification: PASS.**  
Phase 6 Final PASS → Step 5 Acceptance ([`33`](33-Phase-06-Acceptance.md) khi mở).

---

## 1. Owner runtime evidence (Business)

**Scenario Owner xác nhận (2026-07-30):**

```text
A share: https://iflux.vn/IFLAAA123/cong-dong
B (Guest) mở link
B Login / Đăng ký → Self IFLBBB123
→ URL: https://iflux.vn/IFLBBB123/cong-dong
```

| Expect | Owner | Map AC |
|--------|-------|--------|
| Không về `/cong-dong` trần | ✅ | P6-V-R1 · DQ-03 |
| Không kẹt `/IFLAAA123/…` sau Self | ✅ | P6-V-B2 |
| Thấy `/IFLBBB123/cong-dong` | ✅ | P6-V-B2 · Representation Self |

Owner ghi chú: hành vi này **đúng trước và sau** Step 3 (regression không phá).

---

## 2. Static / Grep verification

### P6-V-R2 — Hardcode app `location` `/cong-dong`

```text
auth-login-init.js — chỉ trong nhánh else khi !IfluxShellUrlWriter (dev fallback)
Primary path: IfluxShellUrlWriter.navigate('/cong-dong')
```

**PASS** (fallback allowlist khi Writer thiếu).

### P6-V-R3 — Writer không gọi Identity Context

```text
rg IfluxIdentityContext shell-url-writer.js → No matches
```

**PASS**

### P6-V-R4 — P6-API-01 entrypoint

| Pattern | Result |
|---------|--------|
| Migrate-list dùng `Writer.navigate` khi có Writer | ✅ auth · login-init · share-boot · guest-shell · web-ui · pricing · profile · stock-comment · loyalty path |
| `shellNavigate` / `IfluxHref.navigate` | Thin alias → Writer (documented) |
| `entity-pretty-url-redirect.js` | `IfluxHref.navigate` = alias Writer — **OK** |

**PASS**

### P6-V-R5 — Header search (VERIFY@S4)

| Check | Evidence | Result |
|-------|----------|--------|
| Generator `href` | `entityUrl()` → `IfluxHref.forCanonical(c)` (L225) | ✅ |
| Click / Enter | Ưu tiên `IfluxHref.followHref` → normalize + `Writer.navigate` (L490–491) | ✅ |
| Fallback `location.href` | Chỉ khi không có `IfluxHref` | ✅ EVIDENCE |

**PASS** — không còn assumption “kỳ vọng”; có bằng chứng generator + followHref.

### P6-V-R6 — platform-boot replaceState

`syncAccountProfileTabUrl` (L703–711): chỉ đổi `?tab=` trên **cùng** `location.pathname` — **không** strip Owner segment.

**PASS**

### Allowlist đóng

| Item | Disposition |
|------|-------------|
| External `http(s)` / OAuth / auth HTML / loginWithReturn | EVIDENCE giữ |
| Hash-only replaceState | EVIDENCE giữ |
| `iflux-header-search` | **VERIFY@S4 PASS** → giữ click qua followHref |
| `loyalty-affiliate` absolute link | EVIDENCE `^https?:` allowlist; path → Writer |
| `stock-pretty-url-redirect.js` | EVIDENCE: chỉ legacy `User_Web/community/stocks/*/index.html` file bootstrap — không phải public Owner journey `/co-phieu/…` |

---

## 3. Design Verification cases

| ID | Case | Result | Evidence |
|----|------|--------|----------|
| **P6-V-B1** | Login → link app-zone Owner URL | ✅ | Owner: sau Login Self URL đúng; Writer/Href decorate từ NC |
| **P6-V-B2** | Guest A → Login Self B → `/IFLB/…` | ✅ | Owner test IFLAAA→IFLBBB |
| **P6-V-B3** | Menu/card/widget không mất Owner | ✅ | Funnel Href.forCanonical + Owner confirmed Representation |
| **P6-V-B4** | Không Product URL trần khi có Context | ✅ | Owner: không `/cong-dong` trần sau auth |
| **P6-V-B5** | `a[href]` sample Owner đúng | ✅ | Generators qua Href; reconcile hooks; Owner Self URL |
| **P6-V-R1** | Post-login community restore | ✅ | Owner PASS |
| **P6-V-R2** | Grep hardcode | ✅ | Fallback only |
| **P6-V-R3** | No IC in Writer | ✅ | Grep |
| **P6-V-R4** | P6-API-01 | ✅ | Grep |
| **P6-V-R5** | Header search | ✅ | forCanonical + followHref |
| **P6-V-R6** | platform-boot | ✅ | query-only replaceState |

---

## 4. AC-D checklist

| ID | Status |
|----|--------|
| AC-D0 No Writer v2 file | ✅ |
| AC-D1 NC only | ✅ |
| AC-D2 Auth no forced prefix | ✅ |
| AC-D3 Post-auth restore | ✅ Owner |
| AC-D4 Migrate + allowlist evidence | ✅ |
| AC-D5 No Share / no §6A claim | ✅ |
| AC-D6 P6-V-* | ✅ |
| AC-D7 P6-API-01 | ✅ |

---

## 5. Không được claim sau Step 4

* Guest Share / Share Foundation → Phase 7  
* Program End-to-End Business Verification Gate / Final Program PASS  
* Kênh Facebook / Zalo / QR / Ads / Email “hỗ trợ đầy đủ”

---

## 6. Next

→ Step 5 Phase Acceptance — [`33-Phase-06-Acceptance.md`](33-Phase-06-Acceptance.md)

---

*Phase 6 Step 4 Verification · PASS 2026-07-30 · Pass Phase ≠ Pass §6A*
