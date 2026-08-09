# 05 — Media Format Policy  
## Input · Variant · Quality · EXIF · Evolution

| | |
|--|--|
| **Document ID** | SOL-COM-MEDIA-05 |
| **Version** | 1.0 |
| **Status** | 🟡 Draft → Owner Review |
| **Date** | 2026-07-30 |
| **Architecture** | Asset Variant = [`03-Media-Storage-SEO-Strategy.md`](03-Media-Storage-SEO-Strategy.md) §5 |

> **Mục tiêu:** Đổi codec / chất lượng / responsive **không** phá SoT hay Data Model Asset.  
> Chỉ sửa **Format Policy** (+ regenerate variants nếu cần).

---

# 1. Nguyên tắc

1. **AVIF / WebP / JPEG / Thumbnail… đều là Variant** của một Media Asset — không phải “chiến lược WebP” gắn cứng kiến trúc.  
2. Article tham chiếu **Public Media URL** (primary delivery) — không hardcode đuôi file trong SoT.  
3. MVP chọn **subset** variants; Policy ghi rõ để Impl không đoán.

---

# 2. Định dạng đầu vào (accept)

| Format | MVP | Ghi chú |
|--------|-----|---------|
| JPEG / JPG | ✅ | |
| PNG | ✅ | |
| GIF | ✅ | Animated: giữ original; delivery có thể frame đầu (quyết định Impl) |
| WebP | ✅ | |
| AVIF | ✅ nếu decode được toolchain | |
| SVG | ❌ MVP | XSS / phức tạp — Future |
| HEIC | ❌ MVP | Future |
| BMP / TIFF | ❌ hoặc convert → reject nếu quá lớn | |

**Max size:** đề xuất 15 MB/file (cấu hình).  
**Max dimension:** đề xuất 8000 px cạnh dài — reject hoặc downscale normalize.

---

# 3. Chuẩn lưu trữ Variant (MVP)

| Role | Bắt buộc MVP | Format đề xuất MVP | Mục đích |
|------|--------------|--------------------|----------|
| `original` | ✅ | Giữ codec gốc sau normalize (hoặc lossless recompress policy) | Canonical |
| `delivery` | ✅ | **WebP** (quality ~80) | `<img src>` · cover · OG |
| `thumbnail` | ✅ | WebP hoặc JPEG nhỏ (max edge ~400) | Library grid |

**Fallback chain (tương lai serve thông minh):**

```text
AVIF → WebP → JPEG
```

MVP có thể **chỉ phát** WebP delivery; AVIF = Extension (thêm variant, không đổi model).

---

# 4. Normalize rules

* Áp dụng orientation (EXIF orientation) rồi **strip EXIF** (privacy · size) — mặc định **strip**.  
* Không giữ GPS/camera metadata public.  
* CMYK → RGB nếu cần.

---

# 5. Responsive / srcset (Extension)

```text
small / medium / large
```

Không bắt buộc MVP. Khi mở:

* Article có thể dùng `srcset` từ variant manifest.  
* SoT không đổi.

---

# 6. Regenerate policy

* Đổi Format Policy (ví dụ bật AVIF) → job regenerate variants cho Asset active.  
* **Không** đổi `asset_id` · **không** đổi logical filename.  
* Public URL path có thể giữ ổn định (cùng path, đổi bytes) **hoặc** version query — ưu tiên **cùng path** nếu CDN cache purge được.

---

# 7. Security / content

* Reject non-image masquerade.  
* SVG out = giảm XSS.  
* Quarantine fail decode.

---

# 8. Future Extension Points (Format)

* JPEG XL · AVIF primary  
* Multi-size responsive  
* Dark-mode variant  
* Per-channel quality presets (thumb vs hero)  
* Client `Accept` negotiation tại edge  

---

# 9. Acceptance

| ID | Tiêu chí |
|----|----------|
| FP-AC-1 | Input ngoài allowlist bị reject rõ ràng |
| FP-AC-2 | Mỗi Asset mới có original + delivery (+ thumbnail) |
| FP-AC-3 | EXIF bị strip theo policy |
| FP-AC-4 | Thêm format mới chỉ cần Policy + generator — không đổi SoT objects |

---

# 10. Future Extension Points (toàn capability — neo Overview)

Liệt kê để **không** code hook thừa trong MVP:

| Extension | Ghi chú |
|-----------|---------|
| Video / Audio / Document Library | Object type khác cùng DAM pattern |
| Image Editor · Watermark · OCR | |
| AI Auto Alt · AI Tagging | |
| Object Storage S3/MinIO | Storage Adapter |
| CDN đa vùng | URL Strategy CDN row |
| Auto-import sau RSS ingest | |
| Category cover localize | |
| Content Engine · Comment images | |
| `srcset` / picture | Variant sizes |
| AVIF primary delivery | Format Policy only |

---

*SOL-COM-MEDIA-05 v1.0 · Format Policy · Asset Variant · 2026-07-30*
