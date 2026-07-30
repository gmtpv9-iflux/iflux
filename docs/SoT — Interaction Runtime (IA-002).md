# SoT — Interaction Runtime (IA-002)

**Mã:** IA-002  
**Feature:** Interaction  
**Trạng thái:** Phase 1 LOCKED → **Phase 2 Runtime Contract** (cụ thể hoá; không đổi luật SoT)  
**Ngày:** 2026-07-24  
**Tham chiếu:** IO-001 · IA-001 · IR-001 · IU-001 · `Phase2-Runtime-Contract.md` (RC-IA-RT)

---

## 1. Mục đích

Khóa **Runtime Contract**: Summary ≠ Interactive.  
Presentation Host đổi (sidebar/sheet/page) **không** đổi Domain/Store semantics.

---

## 2. Hai mode

| | Summary | Interactive |
| --- | --- | --- |
| Mục đích | Hiển thị counts / CTA mở host | Thread + mutation |
| Data | Summary projection counts-only | Store + API thread |
| Components | SummaryBar / optional ActionBar | List + Composer + ActionBar |
| Store init | **0** (IR-001) | Có |
| Presentation | Bất kỳ host Summary (mode do **IO Resolver** đã chọn) | Host Interactive — `presentation` đã resolve từ IO |

---

## 3. mountInteraction (contract)

```text
mountInteraction({
  target: { type, id },
  mode: 'summary' | 'interactive',
  presentation: 'inline' | 'sidebar' | 'bottom-bar' | 'bottom-sheet' | 'page',
  permissionContext?
})
```

- Chỉ **Interaction Host** gọi (IO-002).  
- `presentation` **đã resolve** từ `IfluxInteractionPresentationResolver` (IO-003) — Runtime **không** chọn mode.  
- `mode: summary` → không init Store, không load Interactive chunk.

---

## 4. Runtime không phụ thuộc Presentation

Cùng Action `like` / `comment` dù host là sidebar hay sheet.  
Đổi Presentation ≠ đổi API path hay Counter Owner.

---

## 5. Event / Counter (nhắc)

- Counter Owner = Summary projection (IA-001).  
- Interactive success → refresh projection (không UI `stats++` làm SoT).

---

## Exit IA-002

- [x] Summary ≠ Interactive  
- [x] mountInteraction shape  
- [x] Presentation-agnostic runtime  
- [x] Phase 2 RC-IA-RT (xem Phase2-Runtime-Contract.md)  
- [ ] Impl sau Phase 2 PASS / Phase 3+  
