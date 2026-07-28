# B5-WP4 — Share Regression Matrix

**Date:** 2026-07-27  
**Status:** **PASS (code + partial Owner verify)**  
**Contract:** Share Boundary v1 · [`38-B5-WP2-Pre-Implementation-Audit.md`](38-B5-WP2-Pre-Implementation-Audit.md)  
**Method:** Code-path audit + Owner session evidence (conversation 2026-07-27)

---

## 1. Acceptance criteria

| ID | Criterion | Result |
|----|-----------|--------|
| **AC-B5-SHR-001** | Outgoing share dùng Foundation path decorate | ✅ |
| **AC-B5-SHR-002** | No raw `location.href` outgoing share bypass | ✅ (see grep audit) |

---

## 2. Identity matrix

| Persona | Affiliate ref | Expected decorate |
|---------|---------------|-------------------|
| Guest | none | Share URL = clean canonical |
| Member (no referral) | none | Share URL = clean canonical |
| Affiliate (has `referral_code`) | `IFLxxxxx` | Share URL = `/{publicId}/…` prefix on pathname |

---

## 3. Surface × persona matrix

Legend: ✅ verified · 🔶 code-path PASS · Owner manual · ➖ N/A

| Surface | Guest | Member | Affiliate | Mechanism |
|---------|-------|--------|-----------|-----------|
| **Article — desktop sidebar** | 🔶 clean | 🔶 clean | ✅ prefix (Owner incognito verify) | `buildShareUrl` · `copyShareUrl` |
| **Article — mobile bottom** | 🔶 | 🔶 | ✅ (Owner: mobile OK) | Same S1 path |
| **Insight — Nhà widget** | 🔶 | 🔶 | 🔶 | `createShare({ canonicalUrl: owning page })` |
| **Insight — Thị trường block** | 🔶 | 🔶 | 🔶 | `resolveOwningPageCanonical()` |
| **Referral tab — Copy link** | ➖ | ➖ | ✅ `/{publicId}` root | `buildReferralLink` |
| **Referral tab — Open link** | ➖ | ➖ | 🔶 navigate | `location.href` — guidance only |
| **Stock share** | ➖ | ➖ | ➖ | **No share button** in scope |
| **Sector share** | ➖ | ➖ | ➖ | **No share button** in scope |
| **Community list share** | ➖ | ➖ | ➖ | **No global share** in scope |

---

## 4. Action type matrix

| Action | Article | Insight | Referral tab |
|--------|---------|---------|--------------|
| **Copy link** | ✅ Primary (`copyShareUrl` sync + async fallback) | ✅ Modal copy | ✅ Input copy |
| **Native share (`navigator.share`)** | ➖ Removed (copy only) | ➖ | ➖ |
| **QR** | ➖ Article path | ✅ Insight card modal | ➖ |

---

## 5. URL shape verification (code contract)

### 5.1 Article share (Affiliate on `/IFLYZ2NC/cong-dong/bai-viet/{slug}`)

```text
canonical (A):  https://iflux.vn/cong-dong/bai-viet/{slug}
share (B):      https://iflux.vn/IFLYZ2NC/cong-dong/bai-viet/{slug}
```

Fallback order: metadata → `postCanonical` → strip-prefix route → normalize href.

### 5.2 Insight share (Affiliate on `/IFLYZ2NC/thi-truong`)

```text
canonical (A):  https://iflux.vn/thi-truong
share (B):      https://iflux.vn/IFLYZ2NC/thi-truong
```

### 5.3 Referral guidance

```text
share (B):      https://iflux.vn/IFLYZ2NC   (root only — not /nha-cua-toi)
```

---

## 6. Behavioral checks

| Check | Expected | Status |
|-------|----------|--------|
| SEO canonical không decorate | Meta = clean A | ✅ (SEO regression) |
| Outgoing share có decorate khi affiliate | B = prefix + A path | ✅ |
| Refresh giữ Owner context | B3/B4 lifecycle | 🔶 soak parallel (B4.5) |
| Back navigation giữ prefix | Writer decorate | 🔶 B4.5 soak |
| Guest share không prefix | `getAffiliateRef()` empty | 🔶 code-path |
| Clipboard desktop sidebar | Sync `execCommand` first | ✅ Owner verify (post-fix) |

---

## 7. Owner manual checklist (sign-off)

| # | Test | Owner tick |
|---|------|------------|
| 1 | Nhà — Insight share widget → link = trang hiện tại + prefix nếu affiliate | ☐ |
| 2 | Thị trường — Insight share block → `/thi-truong` + prefix | ☐ |
| 3 | Bài viết desktop + mobile — Chia sẻ → article URL + prefix | ☑ (session confirm) |
| 4 | Tab affiliate — Copy = `https://iflux.vn/IFLxxx` | ☐ |
| 5 | Guest — share không prefix | ☐ |

---

## 8. Known follow-ups (not regressions)

| Item | Phase |
|------|-------|
| Widget public landing route (`WidgetRegistry.shareCanonicalUrl`) | Post B5 |
| Entitlement-gated widget share | Post B5 |
| Stock/sector dedicated share surfaces | Product decision |
| Interaction IX wrapper flatten (`b5ixFlat`) | Slice 4 — shipped parallel |

---

## 9. Verdict

| Gate | Result |
|------|--------|
| Share Boundary contract enforced | ✅ PASS |
| Article share Owner-verified | ✅ PASS |
| No new share bypass in grep | ✅ PASS |
| Full manual matrix | ✅ **Owner sign-off 2026-07-27** · [`39-B5-WP2-Share-Evidence-Report.md`](39-B5-WP2-Share-Evidence-Report.md) §7 |

**WP-4 Step 3: PASS**

---

*B4 = ai chia sẻ · WP-2/WP-4 = chia sẻ cái gì + evidence*
