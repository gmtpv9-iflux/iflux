# 57 — Form UI contract (Add Customer surface)

Nguồn visual: `/admin/users/list` → `+ Thêm khách hàng` (offcanvas).  
Không sửa trang admin. Không migration. Không class Add Customer.

Workbench: `?area=design-system&section=components&panel=form` và `panel=drawer`

| Responsibility | REUSE / EXTEND / CREATE | Owner/File |
|---|---|---|
| Group | CREATE | `design_system/04_components/08_form/form.css` (`.ifx-group`) |
| Group Label | REUSE | `design_system/02_foundation/typography.css` (`.ifx-group-label`) |
| Field | EXTEND | `design_system/04_components/08_form/form.css` (`.ifx-field` = `.ifx-form-group`) |
| Field Label | EXTEND | `design_system/04_components/08_form/form.css` (`.ifx-field-label` = `.ifx-label`) |
| Input | REUSE | `design_system/04_components/08_form/form.css` (`.ifx-input` / `.ifx-select`) |
| Placeholder | REUSE | `design_system/04_components/08_form/form.css` (`.ifx-input::placeholder`) |
| Field Hint | EXTEND | `design_system/04_components/08_form/form.css` (`.ifx-field-hint`) |
| Form surface = Drawer | REUSE | `design_system/04_components/06_drawer/` |
| Header / Title | EXTEND | `design_system/04_components/06_drawer/drawer.css` (`.ifx-drawer-header` + `.ifx-drawer-title`) |
| Body | EXTEND | `design_system/04_components/06_drawer/drawer.css` (padding `--ifx-space-20`) |
| Footer | REUSE | `design_system/04_components/06_drawer/drawer.css` (`.ifx-drawer-footer`) |
| Overlay | REUSE | `design_system/04_components/06_drawer/drawer.css` (`--ifx-overlay-scrim`) |
| Open / Close | REUSE | `design_system/04_components/06_drawer/drawer.js` (`.is-open`) |
| Transition | REUSE | `--ifx-transition-drawer` + `.ifx-drawer.is-open` |
| Click outside | REUSE | `drawer.js` (click overlay) |
| Escape | REUSE | `drawer.js` (đã có; admin offcanvas không lắng nghe Escape) |
| Focus first field | — | Không có trên form hiện tại → không thêm |
| Drawer width 400px | CREATE | `design_system/01_tokens/01_source/size.json` (`--ifx-size-drawer-w`) |

## Gates

| Gate | Result |
|---|---|
| FORM_UI_CONTRACT | PASS |
| FORM_OPEN_CLOSE_CONTRACT | PASS |
| WRONG_OWNER_ADDITION | 0 |
| ADMIN_PAGE_CHANGED | NO |
| MIGRATION_STARTED | NO |
