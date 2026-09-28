# SoT — Deployment

> **Nguồn sự thật đang áp dụng:** [`docs/SoT — Deployment.md`](docs/SoT%20%E2%80%94%20Deployment.md) **v1.6**

Đây là **Deployment SoT duy nhất** của iFlux.

**Deploy Staging** = push GitHub `staging` → `deploy-staging.yml` → `:3002`.  
**Deploy Production** = push GitHub `production` → `deploy-production-new.yml` → `:3003`.  
**Deploy ≠** rsync tay · SSH ghi leftover · branch `staging-2` (đã retire).

Trước deploy: xác định **Deploy Unit** (Frontend · Admin · Backend · Migration · Infrastructure).

> 🔒 **v1.6 (2026-08-19):** `staging` = Canonical Staging · `production` = Canonical Production Runtime. Xem docs SoT Deployment AMENDMENT v1.6 và [`docs/SoT — Environment Map (Live Production, Staging 1, Staging 2).md`](docs/SoT%20%E2%80%94%20Environment%20Map%20(Live%20Production,%20Staging%201,%20Staging%202).md).

Không thiết kế quy trình mới trong pointer này.
