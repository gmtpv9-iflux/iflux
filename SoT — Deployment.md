# SoT — Deployment

> **Nguồn sự thật đang áp dụng:** [`docs/SoT — Deployment.md`](docs/SoT%20%E2%80%94%20Deployment.md) **v1.2**

Đây là **Deployment SoT duy nhất** của iFlux (as-is · evidence-based · Owner ops lock).

**Deploy** = đưa code lên **Production Server** (rsync · restart/migrate nếu cần · purge · smoke).  
**Deploy ≠** Commit / Push / Merge Git.

Trước deploy: xác định **Deploy Unit** (Frontend · Admin · Backend · Migration · Infrastructure).

Không thiết kế quy trình mới trong pointer này.
