# SoT — Deployment

> **Nguồn sự thật đang áp dụng:** [`docs/SoT — Deployment.md`](docs/SoT%20%E2%80%94%20Deployment.md) **v1.5**

Đây là **Deployment SoT duy nhất** của iFlux (as-is · evidence-based · Owner ops lock).

**Deploy** = đẩy commit lên GitHub branch `staging` và để CI đưa lên **Staging 1**.  
**Deploy ≠** rsync tay · push `staging-2` · ghi Production.

Trước deploy: xác định **Deploy Unit** (Frontend · Admin · Backend · Migration · Infrastructure).

> 🔒 **v1.5 (2026-08-17):** một đường — Worktree `iFLUX_P1` / `staging` → GitHub → CI → Staging 1 → Verification → Production (Gate, chưa mở). Staging 2 đóng kênh. Xem [`docs/SoT — Environment Map (Live Production, Staging 1, Staging 2).md`](docs/SoT%20%E2%80%94%20Environment%20Map%20(Live%20Production%2C%20Staging%201%2C%20Staging%202).md).

Không thiết kế quy trình mới trong pointer này.
