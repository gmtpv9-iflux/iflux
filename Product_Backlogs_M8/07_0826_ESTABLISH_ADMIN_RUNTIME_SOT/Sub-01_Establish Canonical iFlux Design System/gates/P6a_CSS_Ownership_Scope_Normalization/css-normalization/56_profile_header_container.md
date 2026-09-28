# User Profile — page-header DS + container gutter

**Date:** 2026-08-31

## Header

| Trước | Sau | Owner |
|---|---|---|
| `h1` + breadcrumb isolate | `.ifx-page-header` + `.ifx-page-title` + `.ifx-breadcrumb` | `04_components/10_page-header/` · `03_primitives/08_title/` · `04_components/02_breadcrumb/` |

Không dùng Workbench `.ifx-appshell-bar` làm page header.

## Foundation (Owner chỉ)

| Chỗ | Trước | Sau |
|---|---|---|
| `.ifx-container` | `padding-inline` | `padding: var(--ifx-space-container)` |
| `--ifx-space-container` @768 | `--ifx-space-20` | `--ifx-space-24` |

File: `design_system/02_foundation/layout.css`

Profile page = `.ifx-container.ifx-profile-page` (bỏ pad local trùng).

## Consumer khác

Chat / pattern khác đang dùng `.ifx-container` nhận pad 4 phía + gutter 24 từ 768. Không đụng Chat markup.
