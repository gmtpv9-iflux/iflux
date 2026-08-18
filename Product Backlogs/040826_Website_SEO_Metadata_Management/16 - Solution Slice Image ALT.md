CẤM KHÔNG ĐƯỢC MỞ FILE TRONG QUÁ TRÌNH LÀM. CẤM KHÔNG DÙNG LỆNH $ open

# 16 — Solution Slice · Image ALT

# Epic 040826 · tách khỏi Social JPEG/PNG

| | |
|--|--|
| **Status** | Policy **LOCKED** · P4 `og:image:alt` PASS · **Admin OG Image ALT GO executed 2026-08-11** |
| **Parent** | Solution D.1.2 + Appendix **D.1.3 §P** · Plan A.2.1 PD-20 |
| **Out of scope** | JPEG/PNG format · Breadcrumb · Singleton redesign · AI ALT · full BR-18.1 HTML `<img alt>` CMS |

---

## Distinctions

```text
og:image:alt     → P4 PASS + Admin optional override (this GO)
<img alt="...">  → broader HTML ALT — not claimed done
```

MUST reuse `cover.alt` — no second ALT system.

---

## Owner resolution (no AI · no invent)

```text
SEO OG Image ALT override
  → cover.alt / existing image ALT
  → entity/page/article title
  → next valid fallback from existing data
  → empty (accepted)
```

---

## Implemented (Owner GO 2026-08-11)

| Surface | Field |
|---------|--------|
| Thiết lập SEO hệ thống | `defaultOgImageAlt` / UI **ALT ảnh OG** |
| Thiết lập SEO từng trang | `ogImageAlt` / UI **ALT ảnh OG** |
| Bài viết (edit) | `seo.og_image_alt` + reuse `cover.alt` (optional) |
| Resolver / Contract | consume foundation `og_image_alt`; empty OK (no invent) |

**Singleton = still DEFER.**
