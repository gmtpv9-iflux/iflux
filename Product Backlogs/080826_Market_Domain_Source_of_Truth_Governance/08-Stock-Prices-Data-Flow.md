# 08 — Current Market Price State + Market Data Sync Cycle

**Status:** Time SoT + Full-Universe (Owner lock 2026-08-08)  
**Terminology:** **Current Market Price State** (`stock_prices`)

## Pipeline

```text
Admin Cấu hình thời gian
        ↓
Server-side Time SoT (system_admin_kv.core_setup)
        ↓
Sync Engine (WHEN: weekday + phiên VN + tick)
        ↓
Source Full Universe → NEW auto / MATCHED reconcile / CONFLICT review
        ↓
Price Ingest → PostgreSQL stock_prices
        ↓
market_data_sync_runs → 「Lần Sync Cycle gần đây」
```

## Semantics

- One current row per `(ticker, trading_date, source)`.
- Sync Cycle UPSERTs — does not append history per poll.
- Interval authority = `tick_interval_seconds` in Time SoT (not `market_price_sync_config.interval_seconds`).
- Full-Universe: không giới hạn theo `stocks.active`; NEW auto-persist; chỉ CONFLICT vào Admin Review.

## Admin

- `/admin/thi-truong/cau-hinh-thoi-gian` — Time SoT + 「Lần Sync Cycle gần đây」 + giá hiện hành + Đồng bộ ngay
- `/admin/thi-truong/du-lieu-giao-dich` — **301** → Cấu hình thời gian (capability absorbed)
- `/admin/thi-truong/dong-bo-cau-truc-co-phieu` — Field Authority + conflict review

## Nginx

Live include: `/etc/nginx/snippets/iflux-prod-app.conf`

```nginx
location = /admin/thi-truong/du-lieu-giao-dich {
    return 301 /admin/thi-truong/cau-hinh-thoi-gian$is_args$args;
}
```

Verify: `curl -sSI https://iflux.vn/admin/thi-truong/du-lieu-giao-dich` → **301** → cau-hinh-thoi-gian.

## Future / Out of Scope

Market Flow (separate task) may attach to the same Sync Cycle boundary.
