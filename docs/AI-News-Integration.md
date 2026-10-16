# Tích hợp AI biên tập iFlux — trạng thái và vận hành

## 1. Overview

Mục tiêu cuối: RSS → extract → đối chiếu dữ kiện/context → compose → kiểm tra → liên kết hồ sơ/so sánh → publish chính thức → sitemap/Google discovery. Bản hiện tại **đã có adapter OpenAI và pipeline hai bước chạy ra bản xem trước**, chưa đạt toàn bộ điều kiện tự publish.

Prompt (`news-editorial-v2`, migration `084_news_editorial_v2.sql` + `086_news_ai_programmatic_config.sql`) **không còn ở file tài liệu riêng** — DB (`ai_prompts.code='news-editorial-v2'`) là nguồn thật duy nhất, Admin sửa trực tiếp tại Admin → Thiết lập SEO → AI Programmatic SEO (tab Instruction), không cần script đồng bộ từ file nữa. Backend dùng Responses API, model mặc định `gpt-5.4` (Admin đổi được tại cùng trang, tab Thống kê), Structured Outputs theo [OpenAI Docs](https://developers.openai.com/api/docs/guides/structured-outputs). Không bật tools/web search. Không coi JSON hợp lệ là dữ kiện đã xác minh.

## 2. Decision

- RSS **không được đăng ký index, không vào sitemap**, luôn noindex dù metadata yêu cầu index. Vẫn đọc được trên User Web/Admin.
- Chỉ `published` chính thức được xét vào sitemap; Admin đặt noindex vẫn được tôn trọng. Sửa tiêu đề giữ slug/URL đã cấp.
- Pipeline AI hiện chỉ ghi `news_ai_jobs`, không ghi đè bài nguồn, không tạo article/case/milestone hoặc chuyển published. Thành công kỹ thuật vẫn `needs_review`, với lý do semantic/media rights cần kiểm tra.
- Topic/Story optional: dùng `stories.id` từ Story active và Topic đã confirmed. Giữ owner Cộng đồng/hashtag; không tạo Topic từ RSS. Context chỉ metadata, không đưa thảo luận vào facts.
- So sánh optional: chọn một scope sector/ecosystem/story + metric + tickers + purpose. Backend kiểm tra danh mục/membership và đọc `stocks`/`market_sot_audit` hiện có. Không nhận số liệu hoặc SQL của AI.

## 3. Scope và ownership

| Phần | Owner / thay đổi |
| --- | --- |
| Prompt | Tài liệu có marker; script đăng ký vào `ai_prompts` hiện hữu, không ghi đè bản Admin. Job snapshot body/hash/version tại enqueue |
| Contract | `backend/src/modules/ai/news-ai.contract.js`: một định nghĩa sinh JSON Schema và Zod, required fields/nullable/strict |
| Provider | `openai-responses.provider.js`: server-only key, timeout, store:false, schema validation, refusal/incomplete/error codes không chứa raw response |
| Context | `news-ai-context.service.js`: catalog ứng viên, Story đã hình thành, hồ sơ, scope/members, metric available; đối chiếu quote/source/reference |
| Orchestration | `news-ai-jobs.service.js`, migration `082_news_ai_jobs.sql` + `083_news_editorial_prompt.sql`: idempotency, checkpoint extract, retry/backoff, lease/fencing, quota |
| Intake / worker | Mở rộng RSS ingest hiện hữu để enqueue sau lưu nguồn; scheduler hiện hữu mỗi phút claim jobs và recovery nguồn chưa enqueue |
| Article/UI | Service/news routes/SEO owner; Admin editor; User Web article/list/stock events; template 17/18 và preview pattern hiện hữu đã bổ sung |

Core queue hiện là in-memory shell, chưa chạy job bền vững. News dùng PostgreSQL với scheduler sẵn có, không thêm broker hoặc pipeline RSS khác.

## 4. Cấu hình key và khởi tạo

Repo local: `/Users/mac/Documents/Productions/iFLUX_P1/backend/`. Khi chạy `npm start` từ thư mục này, `src/server.js` nạp `.env` qua dotenv.

**Dùng chung `backend/.env` đã có.** Người dùng tự điền `OPENAI_API_KEY` vào đó. Không nhập key vào `.env.example`, source, frontend, Git hoặc chat/log. `.gitignore` đã loại `.env` và `backend/.env`. Trong lần kiểm tra theo yêu cầu người dùng đã xác nhận biến có giá trị, không in giá trị và chưa kiểm tra hiệu lực bằng API thật. File mẫu không phải file runtime thứ hai; `infra/staging/staging.env` là cấu hình triển khai khác.

Production script đang dùng `/var/iflux/backend-production/shared/.env`, symlink vào release; systemd cũ dùng `/var/iflux/backend/.env`. Chỉ mô tả source triển khai, chưa truy cập/chỉnh các file trên server. Không suy ra đường env staging-1 từ đường production.

Các biến không chứa secret có thể thêm vào file `.env` hiện tại:

```dotenv
NEWS_AI_ENABLED=false
NEWS_AI_MODEL=gpt-5.4
NEWS_AI_TIMEOUT_MS=90000
NEWS_AI_MAX_OUTPUT_TOKENS=10000
NEWS_AI_MAX_ATTEMPTS=3
NEWS_AI_BATCH_SIZE=2
NEWS_AI_MAX_JOBS_PER_DAY=10
SCHEDULER_ENABLED=true
```

Chỉ đổi `NEWS_AI_ENABLED=true` khi muốn gọi API thật. Tắt biến này và restart backend để dừng enqueue/claim mới; request đang chạy có thể hoàn tất vào hàng chờ. Chưa có cờ bật auto-publish vì đường này chưa được nghiệm thu. Quota tính theo job đã bắt đầu trong ngày UTC, có khóa PostgreSQL giữa workers; giới hạn job/token/retry không phải ngân sách USD.

Trên **DB local/staging đã xác nhận đúng môi trường**, áp dụng migrations bằng công cụ hiện hữu rồi đăng ký prompt từ checkout đầy đủ:

```sh
cd /Users/mac/Documents/Productions/iFLUX_P1/backend
npm run migrate
node scripts/register-news-ai-prompt.js
```

Chưa chạy các lệnh này trên DB dự án trong phiên làm việc. Migration 081 chứa hồ sơ/mốc, 082 chứa job AI, 083 đăng ký prompt active ban đầu bằng `ON CONFLICT DO NOTHING` (không ghi đè Admin prompt). Script prompt không gọi AI, không ghi đè code prompt đã có; quản trị phiên bản hiện hữu qua Admin AI prompts. Cần tài liệu prompt trong checkout khi chạy script; runtime đọc DB, không phụ thuộc docs trên server. Restart backend sau khi sửa `.env`.

Lưu ý: khi bật AI, recovery worker có thể đưa **RSS cũ chưa có job** vào hàng chờ, theo batch/quota. Muốn thử riêng một bài, giữ scheduler tắt, enqueue/worker bằng harness thử nghiệm có provider giả lập; chưa có chế độ allowlist nguồn trên UI.

## 5. Dữ liệu đầu vào / đầu ra

Extract input: source ID/URL/tên/thời gian/plain text (tối đa 120.000 ký tự), stock candidates từ catalog thật, Story active từ Topic confirmed, case candidates, các scope và members, metric available. Không dùng tickers đã gắn từ RSS cũ như bằng chứng xác nhận. Không chuyển toàn bộ dữ liệu thảo luận sang AI.

Extract output: facts có ID/metric nullable/evidence, entities có tên/mã/role/uncertainty, events ứng viên nhóm 1–8/hồ sơ/ngày/status/metrics/evidence, Story candidates, comparison spec, context requests, issues. Backend kiểm tra quote tồn tại nguyên trong source, ID thuộc context, tên/alias không trùng, chủ thể sự kiện có role subject; ngày theo validator sự kiện. Mâu thuẫn/mơ hồ/lookup chưa đáp ứng đi review.

Compose input: facts đã đối chiếu quote, entities được chấp nhận ở mức catalog, Story ID, event proposals + lịch sử hồ sơ được truy vấn, comparison lấy DB và thời điểm/provenance. Không gửi lại toàn văn nguồn cho compose. Chưa có projection quyền ảnh đủ căn cứ nên allowed_images rỗng; không để AI tự chọn/chuyển URL/định dạng.

Compose output: title/excerpt/lead, sections H2 + paragraphs + fact IDs/images, tickers, Story/timeline refs, comparison metric, insight hoặc omission reason, SEO, warnings. Backend escape prose thành HTML cho **preview**, thêm nguồn; không nhận UI HTML/canonical/author/comment/recommendations từ AI. Schema thực thi: `contracts.extract.json/z`, `contracts.compose.json/z`; version `news-ai-v1`.

Ví dụ fixture (không phải tin PNJ thật):

```json
{
  "source": "Công ty A đăng ký bán 100 cổ phiếu.",
  "extracted_metric": {"indicator":"registered","value":100,"basis":"planned","unit":"cổ phiếu"},
  "executed_value": null,
  "entity": {"ticker":"AAA","role":"subject"},
  "topic": null,
  "timeline": [],
  "comparison": null,
  "job_status": "needs_review",
  "source_article_status": "published_rss"
}
```

Đây là ví dụ contract và dữ liệu thử, không phải kết quả model thật. Bản xem trước gồm nội dung/SEO/ref; kết quả source vẫn nguyên vẹn. `null` chưa có số liệu khác `0` đã xác định số bằng không.

## 6. API và khả năng kiểm tra

Các endpoint theo base `/api/news` hoặc `/v1/news` đã mount trong app; yêu cầu guard Admin/RBAC hiện hữu:

| Method/path sau `/news` | Chức năng |
| --- | --- |
| POST `/admin/ai/jobs` | Body `{ "source_post_id": "ID_RSS" }`; enqueue khi AI enabled, không gọi model trong HTTP request |
| GET `/admin/ai/jobs` | 100 jobs gần nhất, status/reasons/errors |
| GET `/admin/ai/jobs/:id` | Context/extraction/result/calls; không trả prompt body/key |
| POST `/admin/ai/jobs/:id/retry` | Chỉ job failed; giữ checkpoint, reset attempt theo thao tác Admin |
| GET `/admin/comparison-metrics` | Metric registry, available/unavailable |
| GET/POST `/admin/event-cases` và POST `/:id/milestones` | Nhập/gắn hồ sơ/mốc có nguồn bằng quyền biên tập |

Job lưu model/prompt/schema/hash/source snapshot, usage của các lần gọi thành công, thời lượng/response ID và error code. `cost_usd=null` khi chưa có bảng giá, không giả số 0. Lần provider lỗi không trả usage thì không biết token/chi phí thực; đây là giới hạn đo lường. Chưa nối bảng job vào màn hình AI cost/log stub và chưa có UI review AI chuyên biệt; dùng API Admin để kiểm tra, không ngầm apply kết quả vào editor.

## 7. Đối chiếu toàn bộ yêu cầu và gap còn lại

| Yêu cầu | Đã kiểm chứng local | Còn thiếu trước nghiệm thu tự động |
| --- | --- | --- |
| Tiêu đề/mô tả/H2/mục lục | Schema + article render; sidebar desktop/mobile trước body | Evals chất lượng model thật/lead/độ dài/claim và nội dung nhiều loại tin |
| Topic hình thành Cộng đồng | Reuse confirmed Topic → active Story, validate ID; optional | Vá các bất nhất formation/lifecycle đã nêu trong master plan, catalog alias/membership thực tế; không lấy popularity làm bằng chứng |
| Thực thể | Chặn tên ngắn lồng tên doanh nghiệp khác bằng fixture; role/evidence/candidate checks | Pháp nhân mẹ/con/brand/alias xác nhận; bài lỗi thực từ DB, PNJ pháp lý chưa có fixture nguồn thật |
| Ảnh | Giữ cover variants, body IDs/alt trong edit/sanitize; import/regeneration owner hiện hữu | Projection quyền/nguồn/readiness, gắn ảnh theo section AI; không tự copy URL ảnh nguồn |
| Timeline | Schema hồ sơ/mốc 8 nhóm, nullable ngày/số liệu, evidence, retry/conflict, template và tab stock | Ghép đăng ký/kết quả theo người/cùng đợt qua nhiều nguồn; duplicate semantic; roles/confidence/corrections đầy đủ; timeline lịch sử cùng loại khi không cùng hồ sơ |
| So sánh | Template bảng/cột âm dương; scope sector/ecosystem/Story, DB membership và snapshot | Hiện chỉ có adapter market_cap/shares_outstanding; P/E/P/B/Room NN disabled đến khi chứng minh schema/định nghĩa/kỳ/provenance; validate dữ liệu live |
| Tác giả/nhận định | Khung tác giả hiện hữu, bỏ badge kinh nghiệm hardcode; insight optional 400–600 | Danh tính biên tập tự động do backend cấu hình và kiểm chứng model insight; AI không tạo identity |
| Bình luận/related/list | Mobile comments trước nhóm; entity → Story → category, mới nhất, lazy preview/list theo ngày/Back | Kiểm chứng dữ liệu thật và hành vi trong shell staging; current browser dùng fixture |
| Extract/compose | Adapter + schema + prompt version + context + preview; mock refusal/schema/429/retry | Key đã điền nhưng chưa gọi thật; đánh giá hallucination/causality/số liệu mâu thuẫn ngoài quote matching |
| Chống trùng/publish | Job dedup, lease/fencing/quota/checkpoint; source không bị ghi/publish bởi AI | Unique source URL/cross-source semantic dedup, transaction article–facts–case–publish + durable side effects/replay; hiện bus in-memory |
| Index | RSS gate ở SEO/head/header/sitemap; published mới được xét sitemap, URL ổn định | Chưa có Search Console submission client, chưa kiểm tra property/credentials hoặc index thật |

**Kết luận readiness:** sẵn sàng ở mức cấu trúc UI/article + contract + provider + pipeline preview để bắt đầu thử AI. **Chưa sẵn sàng tự publish toàn bộ theo prompt.** Không biến nhãn “đã đối chiếu bằng chứng” thành “iFlux đã trực tiếp xác minh”; quote matching chưa chứng minh số liệu/diễn giải đúng.

## 8. Kiểm thử và bằng chứng

- Backend unit: **42/42 PASS** sau thêm adapter/schema/context tests; thiếu key không gọi transport; không phản chiếu raw error/key.
- PostgreSQL tạm riêng: **10/10 PASS** (migrations 081/082), gồm RSS/index/URL, Story, related/date cursor, HTTP guards, giữ variants/IDs, event retry/null/0/conflict, comparison canonical/snapshot, pipeline giả lập extract→compose→429 retry/concurrent claim/review. Không dùng DB dự án.
- Browser fixture: **PASS desktop 1440/mobile 390**, template preview + runtime pipeline, TOC/comments ordering, lazy groups/list/date/Header Back. Screenshots trong `/private/tmp/iflux-news-browser-evidence/`; chưa phải kết quả staging.
- Asset versions: `sync-js-versions.mjs --check` PASS; global bundle `build-web-bundle.mjs --check` PASS; diff whitespace check PASS.
- Chưa gọi OpenAI thật, chưa dùng key để test quyền model, chưa chạy full staging/production smoke. Health suite cũ cần server localhost:3001, không được tính vào số PASS trên.

Sau các chỉnh quota/test cuối, cập nhật số PASS mới trong nhật ký bàn giao; không tự diễn giải checkpoint cũ thành test đã qua sau mọi diff.

## 9. Google discovery

Bài chính thức dùng route `/tin-tuc/bai-viet/`, canonical hệ thống, structured data/head và sitemap hiện hữu. Source chưa có client “đăng ký Google index từng bài”. Với bài tin thông thường, kênh triển khai cần hoàn thiện là sitemap/Search Console; [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/using-api) hiện chỉ hỗ trợ JobPosting/BroadcastEvent phù hợp. [Google hướng dẫn submit sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) qua Search Console/API. Không giả schema tuyển dụng/livestream cho bài tin hoặc khẳng định sitemap bảo đảm index.

RSS tuyệt đối không được đưa vào các payload submission/sitemap. Chưa có submission thực tế trong phiên này.

## 10. Bàn giao / tiếp theo

Đọc `AI_Handoff.md` trước thay đổi; không chạm thay đổi người dùng/Claude đã ghi. Chưa commit/push/deploy, chưa migrate DB dự án. Tiếp theo: thử model thật có kiểm soát trên local/staging sau xác nhận cấu hình; lưu eval có nguồn cho PNJ/đăng ký–kết quả/pháp lý/dự án/multi-events/trùng hai nguồn; hoàn thiện semantic/review/media; transaction/outbox rồi mới mở auto-publish. Cần Google Search Console property/auth riêng nếu triển khai submission; không dùng OpenAI key cho Google.
