# Tích hợp AI biên tập tin iFlux — khảo sát context

Ngày: 2026-10-13. Phạm vi: source local, chưa kiểm tra DB hoặc runtime staging/production.

Cập nhật sau khảo sát chuyên sâu Topic/Story: xem [AI-News-Master-Plan.md](./AI-News-Master-Plan.md). Đã xác nhận Topic tự hình thành và có cron tự tạo Story từ Top 5 Topic thịnh hành tuần; phát hiện bất nhất author_id NULL/NOT NULL và vấn đề ngày thống kê. Báo cáo ban đầu này không thay cho bằng chứng chi tiết và kế hoạch cập nhật đó. Chưa triển khai runtime.

## 1. Overview

### Task Objective
Chuyển tin nguồn thành bài iFlux có dữ kiện, thực thể, lịch sử sự việc và nguồn có thể kiểm tra; tự publish khi đạt kiểm tra, còn mơ hồ chuyển review. Không deploy production tự động.

### Task Roadmap
| Phase | Objective |
| --- | --- |
| 0 | Khảo sát owner, source và khoảng thiếu |
| 1 | Chốt contract dữ liệu và sửa nhận diện thực thể |
| 2 | Lưu nguồn, hồ sơ sự việc, mốc và chống trùng |
| 3 | AI có cấu trúc, kiểm tra và chạy thử không publish |
| 4 | Timeline, bài liên quan, render và publish trên staging |
| 5 | Kiểm chứng, tài liệu bàn giao và giới hạn |

### Current Phase Objective
Phase 0: ghi nhận hiện trạng và bằng chứng trước khi thiết kế chi tiết hay sửa runtime.

### Phase Contribution
Khảo sát này xác định nơi tái sử dụng/sửa; chưa chứng minh đủ điều kiện publish. Exit preview: có inventory, lỗi tái hiện, giới hạn kiểm chứng và roadmap.

## 2. Objective
Phân biệt yêu cầu nghiệp vụ đã chốt với khả năng thực tế của source; tránh xây lại pipeline và nhầm Story/Topic với hồ sơ sự việc.

## 3. Scope
RSS, schema bài/thực thể, nhận diện mã, media, bài liên quan, UI cổ phiếu/bài viết, AI, scheduler và CI/CD.

## 4. Evidence

### Hướng dẫn và Git
- Đã đọc README, AGENTS, Engineering Change Governance, Plan Phase Governance; đối chiếu phần đầu Product Architecture V2 và Community Architecture V1.
- Branch local: `staging`, tracking `github/staging`. Workspace có sẵn 2 thay đổi thuộc nhóm modified/other, 773 đường dẫn deleted, 3 nhóm untracked trước khi thêm báo cáo này. Không khôi phục hoặc sửa các thay đổi đó. Số liệu lấy bằng `git -c core.fsmonitor=false status --porcelain=v1`; lệnh mặc định báo lỗi fsmonitor IPC.
- README xác định push staging/production kích hoạt CI deploy. Chưa commit/push/migrate/deploy.
- Tài liệu Product V2 và Community V1 có mô tả Topic/Story khác nhau; migration 080 còn tiếp tục đổi lifecycle so với ghi chú Community V1 ngày 08/10. Cần đối chiếu đầy đủ tài liệu quyết định mới nhất trước khi sửa domain này. Không dùng sơ đồ cũ để kết luận runtime hiện tại.

### Inventory / Impact Analysis (CG-005)
| Feature / owner hiện tại | Files / functions | Consumers, storage/API | Decision |
| --- | --- | --- | --- |
| RSS — news | `backend/src/modules/news/rss-ingest.service.js`: `processFeed`, `upsertRssArticle`, `resolveRssStatus`; `rss-mappings.js`, `rss-providers.service.js` | `news_posts.payload`, admin RSS run, scheduler `backend/src/server.js` | Reuse fetch/mapping; modify bước lưu nguồn và điều kiện publish |
| Nhận diện — news + market master | `news-entity-resolve.service.js`: `loadMaster`, `resolveArticleEntities`; `market/market-master.service.js`: `listStocks` | stocks/sectors/ecosystems, RSS ingest/backfill, occurrences dùng trên User Web | Modify đúng owner; không thêm bộ gắn mã song song |
| Bài viết/publish — news | `news-articles.service.js`: `normalizeArticleInput`, `createArticle`, `updateArticle`, `ensureUniqueSlug`; `news.routes.js` | Admin editor, ArticleDetail, `news_posts` | Reuse CRUD/route; modify validation, URL ổn định và tích hợp transaction |
| Bài liên quan — news feed | `news-feed.service.js`: `resolveRelatedSeed`, `listFeed` | `/news/feed?related_to=...`, `news-daily-feed.js`, `news-post-page.js` | Modify ranking trong owner hiện tại |
| Media — media | `media-trigger.worker.js`: `runAutoImportWorker`; `media-import.service.js` | media_status/retry, cron, ảnh bài viết | Reuse import/worker; bổ sung publish gate sau kiểm tra quyền/nguồn |
| AI admin — ai | `ai-notif-admin.service.js`; migration `033_wave_c_ai_notif.sql` | ai_prompts, ai_log_rows, ai_cost_rows, ai_quality_items; admin routes | Reuse quản trị; đánh giá mở rộng version/run thay vì tạo bản sao |
| UI — User Web | `entity-detail-center.js`: `eventsPanel`; `news-post-page.js`, `news-store.js`, `news-geo-ai.js` | tab cổ phiếu, TOC/body, internal links/related | Modify renderer hiện tại; kiểm tra sanitize end-to-end |
| Scheduler / CI — core + workflows | `core/scheduler/scheduler.js`: `registerJob`; `.github/workflows/deploy-staging.yml` | RSS mỗi 10 phút mặc định, media worker; deploy qua push | Reuse orchestration; bổ sung độ bền/idempotency AI, không push trong khảo sát |

### Điều đã kiểm chứng trong source
1. RSS đang lưu thẳng thành bài `news_posts`; chỉ cần title + category_id là `published_rss`. Lỗi fetch HTML có fallback về RSS. Như vậy bài chưa qua kiểm tra dữ kiện/AI vẫn có thể lên public theo thiết kế hiện tại.
2. Chống trùng RSS hiện tra `external_url` hoặc canonical rồi insert/update. Bài đã publish/scheduled bị skip. Đây chưa phải gom nhiều nguồn theo cùng mốc/sự việc; nhánh SELECT→INSERT được đọc chưa có khóa chống chạy đồng thời ở chính hàm này. Cần kiểm tra toàn bộ index DB trước khi kết luận race thực tế.
3. Migration 069 đã DROP luồng content_articles từ vnstock; không phục hồi luồng này chỉ để tích hợp AI. Chưa kiểm tra lịch sử migration thực chạy trên DB.
4. Resolver lấy name/short_name/english_name từ market master; có ticker alias suy ra từ tên, không có kiểm tra vai trò chủ thể/so sánh. Sector trả `[]`; hệ sinh thái chỉ được gắn khi đếm ít nhất 3 mã cùng ecosystem. Các điều kiện này khác contract mới.
5. `eventsPanel` chỉ render thông báo chưa có lịch sự kiện. Trong phạm vi đã tìm chưa thấy domain hồ sơ/mốc đáp ứng yêu cầu; các bảng interest/relevance events cũ là tương tác, không phải sự kiện doanh nghiệp.
6. Bài liên quan ưu tiên category → story → ticker, có loại bài hiện tại và dedup theo ID. Chưa theo thứ tự sự việc → mã → ngành → hệ sinh thái → Topic.
7. `updateArticle` chuẩn hóa lại slug từ title, sau đó lưu former_slugs. Sửa tiêu đề có thể đổi URL; yêu cầu mới cần giữ URL ổn định.
8. Route bài và canonical trong service/routes hiện là `/tin-tuc/bai-viet/:slug`. Không áp dụng route `/cong-dong/bai-viet/` cũ.
9. AI service đã đọc là CRUD prompt/log/cost/quality. Tìm trong backend src/scripts chưa thấy client LLM thực hiện biên tập bài. Không coi UI `news-geo-ai.js` hay bảng AI admin là pipeline AI hoàn chỉnh.
10. Media worker đã có transaction claim với `FOR UPDATE SKIP LOCKED`, retry và nhận lại job PROCESSING quá hạn; có thể tái sử dụng cách quản lý công việc. RSS insert vẫn publish trước khi media hoàn tất.
11. Market master có ticker, tên, ngành/hệ sinh thái và slug; API đã đọc chưa cung cấp alias xác nhận hay quan hệ pháp nhân mẹ/con/thương hiệu. Cần audit catalog/schema rộng hơn trước khi quyết định migration cụ thể.

### Lỗi gắn mã đã tái hiện
Chạy `resolveArticleEntities` thật bằng Node, mock dependency market master, không kết nối DB:

```json
{
  "catalog": [
    {"ticker":"AAA","name":"Công ty Cổ phần Alpha","short_name":"Alpha"},
    {"ticker":"BBB","name":"Công ty Cổ phần Alpha Miền Nam","short_name":"Alpha Miền Nam"}
  ],
  "input": "Công ty Cổ phần Alpha Miền Nam công bố kết quả kinh doanh",
  "expected": ["BBB"],
  "actual": ["BBB", "AAA"]
}
```

Nguyên nhân: `spanOwner` dùng key `start:end`, chỉ chặn khác mã trên đoạn khớp giống hệt; không giải quyết span lồng nhau. Sắp xếp tên dài trước chưa loại được tên ngắn. Guard tên bị cắt chỉ xử lý phần tiếp nối `và`/`&`. Fixture này là dữ liệu tổng hợp, không phải bằng chứng AAA/BBB hay một bài thật bị gắn sai trong DB. Chưa sửa code trong Phase 0.

## 5. Deliverables
Khảo sát source → inventory/owner ở trên → danh sách reuse/modify và roadmap. Lỗi resolver → fixture input/output và nguyên nhân → cơ sở test hồi quy. Đây là file mới vì chưa tìm thấy báo cáo dành cho yêu cầu AI biên tập này trong docs hiện có; không tạo owner runtime mới.

## 6. Gap
- Cần contract AI có schema validation, input nguồn bất tín nhiệm, context backend kiểm soát; model không tự cấp ID/URL/ngành hoặc điều khiển công cụ.
- Cần lưu nguồn/bằng chứng độc lập với nội dung đã biên tập; dedup bài nguồn, mốc và sự việc riêng; retry không tạo bản sao.
- Cần ba cấp dữ liệu: taxonomy 8 nhóm → hồ sơ cụ thể → mốc; vai trò thực thể, ba loại ngày, số liệu/đơn vị/kỳ/thực tế-dự kiến, nguồn, confidence và đính chính. Giá trị thiếu = null, UI = “—”, số 0 được giữ nguyên.
- Cần alias được xác nhận và kiểm tra quan hệ pháp nhân; backend xác nhận liên kết do AI đề xuất, mơ hồ thì review. Mention/so sánh không tự tạo timeline.
- Cần bài iFlux có nguồn rõ ràng, không ngụ ý trực tiếp xác minh; nhận định tách riêng 400–600 ký tự khi đủ căn cứ, không ép tạo. Giữ cấu trúc/tiêu đề/H2 và số liệu theo yêu cầu người dùng.
- Cần publish gate, dry-run mặc định, review queue, replay, prompt/model version và usage/cost/error; commit nhất quán bài–sự kiện–publish.
- Cần backend render cấu trúc, sanitize HTML, internal links, timeline đúng ngữ cảnh và bảng không trộn chỉ tiêu/kỳ/dự kiến-thực tế. Chưa kết luận mức độ an toàn sanitizer hiện tại.
- Schema dự kiến tác động: news_posts/payload và liên kết nguồn; stocks/catalog alias và quan hệ nếu audit xác nhận thiếu; các bảng AI hiện hữu; bổ sung hồ sơ/mốc/nguồn/đính chính/job khi chứng minh chưa có owner tương ứng. Không dùng stories/topics thay hồ sơ doanh nghiệp. Tên bảng/cột cuối cùng chưa chốt.
- Files dự kiến modify nằm trong inventory. Migration mới và test mới chỉ xác định sau contract; không thay thế media, feed hay article route hiện có.

## 7. Out of Scope
Không gọi AI, đọc secret, sửa runtime, chạy migration, truy cập DB, commit/push/deploy trong khảo sát. Chưa có kiểm chứng desktop/mobile hoặc luồng staging.

## 8. Exit
- [x] Có inventory và owner/consumer/storage/API.
- [x] Có lỗi tái hiện độc lập qua code thật, phân biệt fixture với dữ liệu thực.
- [x] Xác nhận route bài hiện dùng từ source.
- [x] Có khoảng thiếu và roadmap; giữ nguyên thay đổi có sẵn trong workspace.
- [ ] Chưa hoàn tất audit DB/runtime, toàn bộ tài liệu quyết định Topic/Story và sanitizer; không coi đây là gate triển khai đã PASS toàn diện.

## 9. Open Items
- Đọc tiếp tài liệu quyết định mới nhất và đối chiếu schema DB môi trường kiểm thử được phép; tìm bài thật tái hiện gắn nhầm, đặc biệt PNJ đăng ký/kết quả. Không dùng dữ liệu thảo luận làm dữ kiện đã xác minh.
- Chọn nhà cung cấp/model, ngân sách, nguồn dữ liệu được phép và chính sách ảnh khi mở thiết kế AI; chưa cần API key ở bước này.
- Bộ kiểm chứng bắt buộc: đăng ký→kết quả cùng đợt (giữ số đăng ký và thực hiện), thiếu dữ liệu, hai nguồn/cùng mốc, một bài/nhiều sự kiện, dự án/pháp lý qua nhiều bài, mention so sánh, mâu thuẫn/review, AI lỗi/retry, link/canonical/timeline/related và desktop/mobile.

## 10. Phase Verdict
Đã nắm context ban đầu và phát hiện các lệch cụ thể. Chưa triển khai tích hợp. Bước tiếp theo là hoàn tất các khoảng khảo sát còn lại, rồi chốt contract và triển khai từng phần kiểm chứng độc lập; dry-run trước, staging publish sau, không tự deploy production.
