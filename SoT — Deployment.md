# SoT — Deployment

> **Nguồn sự thật đang áp dụng:** [`docs/SoT — Deployment.md`](docs/SoT%20%E2%80%94%20Deployment.md) **v1.3**

Đây là **Deployment SoT duy nhất** của iFlux (as-is · evidence-based · Owner ops lock).

**Deploy** = đưa code lên **server** (rsync/CI-CD · restart/migrate nếu cần · purge · smoke).  
**Deploy ≠** Commit / Push / Merge Git.

Trước deploy: xác định **Deploy Unit** (Frontend · Admin · Backend · Migration · Infrastructure).

> 🔒 **v1.3 (2026-08-14):** `iflux.vn` (Live Production) là **Protected — không SSH deploy trực tiếp**. Deploy hiện tại chỉ hợp lệ trên **Staging 1** (`staging.iflux.vn`) và **Staging 2** (`production.iflux.vn`). Xem [`docs/SoT — Environment Map (Live Production, Staging 1, Staging 2).md`](docs/SoT%20%E2%80%94%20Environment%20Map%20(Live%20Production%2C%20Staging%201%2C%20Staging%202).md) trước khi làm bất cứ gì.

Không thiết kế quy trình mới trong pointer này.
