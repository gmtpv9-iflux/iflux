# Nhật ký bàn giao chung — Codex và Claude

Mục mới nhất ở đầu. Trước khi thêm mục: đọc lại file hiện tại, thêm phía trên các mục cũ và giữ nguyên lịch sử. Không ghi secret, API key hoặc dữ liệu riêng tư vào nhật ký.

## 2026-10-13 22:01:00 +07:00 — Codex — release Staging thành công, chuẩn bị Production

- **Nhiệm vụ/trạng thái:** CI Staging đã deploy thành công; commit Production đã tạo, đang ghi nhật ký và chuẩn bị push `production`.
- **Phạm vi:** Prompt v2, schema/validation/backend timeline, migration `084_news_editorial_v2.sql`, timeline template và tests. Release Production dựa trên commit `69edd93`; không đưa thay đổi ngoài scope vào.
- **Trước → sau:** Staging chưa có cập nhật Prompt v2/section-event relationship → Staging deploy thành công; Production release đã có cùng logic tương thích, migration và test.
- **Kiểm tra:** CI Staging run `38418211513` thành công tại SHA `cc589288`; Production release unit 13/13, PostgreSQL integration 11/11, browser desktop/mobile, JS version/bundle và diff checks đều PASS.
- **Commit:** Staging code `8a04aa6`, handoff `cc58928`; Production code `430525f`.
- **Còn lại/lưu ý:** commit mục handoff này, push nhánh `production`, chờ CI thành công; sau đó purge Cloudflare và kiểm tra Staging/Production. Không ghi secret vào log.

## 2026-10-13 21:59:00 +07:00 — Codex — kiểm thử release Staging/Production trước phát hành

- **Nhiệm vụ/trạng thái:** hoàn tất kiểm tra; chuẩn bị commit và đẩy lần lượt Staging rồi Production theo yêu cầu Owner, sau CI sẽ purge cache và smoke-test.
- **Phạm vi:** Prompt v2, schema/validation/backend timeline, template timeline, migration `084_news_editorial_v2.sql`, author panel/mobile entity fix và generated asset versions liên quan. Staging release dựa trên `8705717`; Production release dựa trên `69edd93`. Các file ngoài scope chỉ nằm trong working tree chính; không đưa vào release.
- **Trước → sau:** H2/event chưa có quan hệ ổn định và ngày sự kiện riêng → section manifest/anchor backend cấp, mốc có occurred_on và section refs; Prompt v2 quy định liên kết H2–mốc, phân loại ngày/trạng thái, cách viết nhận định iFlux và kiểm tra JSON. Timeline render tiêu đề nguồn dạng liên kết và phân biệt ngày. Author/mobile fixes đã gồm trong các release.
- **Kiểm tra:** trên cả hai release unit 13/13 PASS, browser desktop/mobile PASS, JS versions và bundle PASS; PostgreSQL integration 11/11 PASS (migration 084 và các mốc/ngày/section). `git diff --check` PASS.
- **Commit:** chưa có; cập nhật hash sau commit trong mục bàn giao kế tiếp.
- **Còn lại/lưu ý:** chỉ stage file của task và version references do build tạo; commit, push `staging`, đợi CI thành công rồi push `production`; purge Cloudflare sau CI Production thành công. Không dùng SSH hay ghi secret vào log.

## 2026-10-13 21:35:00 +07:00 — Codex — mở rộng Prompt v2 và liên kết section với timeline

- **Nhiệm vụ/trạng thái:** code hoàn tất, đang kiểm tra release riêng cho Staging và Production trước commit/push; theo yêu cầu Owner sẽ purge cache sau Production deploy.
- **Phạm vi:** docs/prompt, `backend/src/modules/ai/news-ai.contract.js`, `backend/src/modules/news/{news-ai-jobs.service.js,news-ai-context.service.js,news-events.service.js}`, migration mới, timeline widget và tests. Hai nhánh chỉ nhận commit nhiệm vụ này; giữ nguyên thay đổi chưa commit khác trong worktree staging.
- **Trước → sau:** runtime prompt v1 → migration đăng ký/activate `news-editorial-v2`; H2→fact mở rộng thành H2→fact/event với anchor do backend cấp, manifest được lưu ở payload và xác thực khi lưu bài. Mốc timeline có `occurred_on` riêng; nguồn được xác nhận qua iFlux/CafeF/Vietstock/FireAnt. Prompt mới quy định vai trò H2, ngày/trạng thái, không lặp heading, nhận định iFlux và kiểm tra JSON. AI vẫn ở chế độ preview/review, chưa auto-publish.
- **Kiểm tra:** unit 13/13 PASS; PostgreSQL integration 11/11 PASS (migration v2, thời gian mốc, article section anchors); browser desktop/mobile PASS; đang đồng bộ version và bundle trên hai release worktree.
- **Commit:** chưa có.
- **Còn lại/lưu ý:** hoàn tất JS/bundle check, cập nhật commit/hash vào handoff trước mỗi commit, push Staging rồi Production, theo dõi CI; purge Cloudflare và smoke-test cả hai sau deploy. Không đưa các thay đổi không liên quan từ worktree chính vào release.

## 2026-10-13 21:27:00 +07:00 — Codex — đang phát hành metadata SEO và điều tra mobile entity slot

- **Nhiệm vụ/trạng thái:** hoàn thành code và kiểm thử; release commit `69edd93` đã tạo trên nhánh dựa từ Production, đang chờ push CI, purge Cloudflare và smoke-test theo yêu cầu người dùng.
- **Phạm vi:** release cô lập `/private/tmp/iflux-production-release` trên CI branch `production`; thay đổi SEO từ mục 21:26 chỉ lấy đúng file/module của nhiệm vụ đó. Review/fix tiếp theo dự kiến `User_Web/iflux-web-ui/{news-post-page.js,news-ui.js,mobile-nav.js,news.css}`, shell/runtime và browser test nếu root cause cần. Không thao tác trên runtime server.
- **Trước → sau:** Production vẫn dùng author widget cũ (còn nhãn nguồn và “Hỗ trợ biên soạn: AI”). Đã xác định root cause mobile: quote hydration của bài liên quan cập nhật nhầm bottom bar toàn cục theo `posts[0]`; đã gỡ side effect toàn cục để bottom bar chỉ do bài chi tiết hiện tại quản lý. Đã thêm browser assertion ngăn mã bài liên quan ghi đè chip bài hiện tại.
- **Kiểm tra:** browser desktop/mobile PASS, gồm related lazy-load không ghi đè thực thể bài hiện tại; SEO unit 5/5 PASS; PostgreSQL integration 11/11 PASS; JS version và web bundle checks PASS. Timeline template đã áp dụng ngày diễn ra/hiệu lực, nguồn hiển thị tiêu đề link. Đang review/stage commit release; chưa push/purge.
- **Commit:** release `69edd93` (SEO metadata/canonical, author widget, timeline template, mobile entity hydration và asset version references).
- **Còn lại/lưu ý cho AI tiếp theo:** push commit lên `production`, theo dõi CI, sau khi deploy thành công purge cache và xác minh HTML/JS/SEO trên Production. Nguyên nhân mobile đã sửa tại `news-ui.js`: hydration của related cards không còn ghi vào entity strip toàn cục; test kiểm tra mã của bài hiện tại không đổi sau lazy-load related. Không ghi token/secret vào handoff hoặc log.

## 2026-10-13 21:26:00 +07:00 — Codex — hoàn thành kiểm soát index, canonical và metadata bài viết

- **Nhiệm vụ/trạng thái:** hoàn thành phần code và kiểm thử local; chưa deploy Production.
- **Phạm vi:** `backend/src/modules/news/{news-articles.service.js,news.routes.js,rss-ingest.service.js,news-article-schema-fields.js}`, `backend/src/modules/seo-platform/{seo-platform.service.js,seo-contract.js,head-renderer.js}`, `Admin_Design_system/app/news/content/{article-edit-page.js,edit.html}`, `User_Web/iflux-web-ui/seo-url.js`, backend unit/integration tests. Provider sitemap được audit, không cần sửa vì vốn chỉ chọn `status='published'`.
- **Trước → sau:** RSS `published_rss` vẫn hiển thị web, bị ép `noindex,nofollow` và không vào sitemap → giữ nguyên policy. Khi RSS được chuyển sang `published`, backend ghi riêng `source_published_at`, đóng dấu `official_published_at` và `published_at` tại thời điểm kích hoạt; tạo slug chính thức từ tiêu đề biên tập một lần, lưu slug cũ làm alias để endpoint article chuyển 301. Các lần edit/đăng lại giữ slug và ngày xuất bản chính thức. `excerpt` nay là SoT cho `seo.description`, `meta_description`, `og_description`; form Admin xem trước và gửi đồng bộ nội dung này. First HTML JSON-LD nay có NewsArticle headline, description, image, datePublished, dateModified, author; User Web microdata bổ sung dateModified. API cho phép các alias SEO cần thiết, canonical/robots vẫn do backend quản lý.
- **Kiểm tra:** SEO unit/contract **16/16 PASS**; PostgreSQL integration `news-editorial.test.js` **11/11 PASS**, gồm RSS noindex/sitemap exclusion, xuất bản chốt URL/ngày, slug cũ được tìm và chuyển về slug chính thức, ngày không đổi qua edit/gỡ/đăng lại, ngày nguồn giữ riêng, mô tả đồng bộ. `node --check` các JS backend/Admin/User Web PASS; `git diff --check` PASS; `sync-js-versions.mjs --check` PASS (233 file version, 315 file scan). Lệnh đồng bộ asset đã cập nhật query version cho 27 file có source thay đổi trong worktree; các file ngoài danh sách module chính giữ nguyên nội dung.
- **Commit:** chưa có; không deploy. Branch `staging`, HEAD vẫn `8705717`; worktree có các thay đổi/xóa có trước ngoài phạm vi, không stage/commit chung.
- **Còn lại/lưu ý cho AI tiếp theo:** cần phát hành backend/Admin/User Web đồng bộ trước khi production áp dụng. Sau release, dùng Search Console URL Inspection để xác nhận crawl HTML mới và gửi sitemap; Google vẫn tự quyết định có hiện snippet/ngày/ảnh. Các URL cũ đã 404 như root `/pnj-giai-trinh` cần xử lý redirect riêng nếu còn kết quả Google; change này lưu alias cho slug cũ bên trong route `/tin-tuc/bai-viet/`, chưa thêm redirect root-level. Không index RSS.

## 2026-10-13 21:03:00 +07:00 — Codex — hoàn thành redesign khung tác giả và prompt đề xuất v2

- **Nhiệm vụ/trạng thái:** hoàn thành phần local theo yêu cầu; chưa phát hành/deploy.
- **Phạm vi:** `User_Web/iflux-web-ui/news-ui.js`, `news-post-page.js`, `news.css`; `design_system/05_templates/17_event-timeline/event-timeline.js`; `backend/src/modules/news/news-ai-context.service.js`; prompt `docs/AI-News-Programmatic-Prompt.md`; unit/browser tests. Công cụ `sync-js-versions.mjs` cập nhật chuỗi hash phụ thuộc qua User Web theo toàn bộ trạng thái file hiện tại; đây là thay đổi sinh tự động, cần giữ đồng bộ cùng nguồn liên quan khi release và rà phạm vi generated refs trước khi stage.
- **Trước → sau:** khung tác giả có text “Nguồn tham khảo”, “Hỗ trợ biên soạn: AI”, bố cục desktop/mobile chật và méo → bỏ hai label/dòng AI, nguồn là tên nhà xuất bản làm anchor tới URL bài nguồn, thiết kế card dùng DS icon-list/card với identity và metadata chia cột trên desktop, xếp dọc trên mobile. Preview AI không tự nối dòng nguồn vào cuối body. Chuẩn bị bài gỡ anchor bên trong H2 để giữ H2 thuần text. Timeline ưu tiên ngày diễn ra/hiệu lực, giữ ngày công bố riêng; mốc hiển thị link bằng tiêu đề, bỏ quote “bằng chứng” khỏi UI. Evidence mới từ pipeline lấy title bài nguồn làm label.
- **Prompt:** cập nhật quy tắc nguồn bài chỉ hiển thị trong khung tác giả; timeline ưu tiên link bài iFlux do backend cung cấp, fallback theo danh sách CafeF/Vietstock/FireAnt, không tự tạo URL; timeline lấy ngày sự kiện, H2 độc lập/cô đọng/có thể gom thành chủ đề/sự kiện, không link entity và không lặp lại heading trong câu đầu. File ghi rõ đây là đề xuất `news-editorial-v2`; DB/runtime vẫn ở `news-editorial-v1` cho đến khi người dùng duyệt và có migration/đăng ký phiên bản mới.
- **Kiểm tra:** backend unit 8/8 PASS; browser fixture desktop 1440/mobile 390 PASS, gồm link nguồn (tên nguồn làm anchor; nhận cả URL nội bộ tương đối), bỏ label AI/nguồn, H2 bỏ liên kết và timeline date/title-link; `sync-js-versions --check` PASS (233 file version, 315 file scan); `build-web-bundle --check` PASS; `git diff --check` PASS. Screenshot `/private/tmp/iflux-news-browser-evidence/author-{1440,390}.png` đã xem trực quan.
- **Commit:** chưa có; không stage/commit/deploy. HEAD lúc bắt đầu `8705717`; giữ nguyên các thay đổi/xóa khác trong worktree.
- **Còn lại/lưu ý cho AI tiếp theo:** chưa áp dụng prompt v2 vào DB/runtime. Nguồn iFlux ưu tiên hiện là chỉ dẫn prompt, nhưng context builder chưa truy vấn danh sách bài iFlux liên quan để cung cấp cho model; cần bổ sung nguồn ứng viên trước khi bảo đảm được ưu tiên này. Rà lại generated hash refs cùng asset files khi chuẩn bị release; không stage các thay đổi khác ngoài nhiệm vụ. Bài PNJ Production cũ chưa được cập nhật nội dung/metadata nguồn trong lần này.

## 2026-10-13 18:30:00 +07:00 — Codex — hoàn thành biên tập thủ công và publish bài RSS PNJ

- **Nhiệm vụ/trạng thái:** hoàn thành theo chỉ dẫn đã làm rõ; Codex tự biên tập theo Prompt, không gọi AI programmatic.
- **Phạm vi:** `docs/AI-News-Programmatic-Prompt.md` (đọc làm chuẩn); Admin article/event-case API hiện có; Production article `post_rss_mv6fxaoz_01sao5`. Không sửa source code.
- **Trước → sau:** bài CafeF `published_rss`, title “Một thành viên HĐQT PNJ xin từ nhiệm trước thềm Đại hội cổ đông bất thường” → bài chính thức “PNJ nhận đơn từ nhiệm của thành viên HĐQT trước đại hội bất thường”; mô tả 75 từ, mở đầu nêu rõ đề nghị miễn nhiệm chưa được thông qua, 4 H2, nhận định iFlux 599 ký tự, SEO title/description mới. Giữ cover/variants và credit CafeF, nguồn ngoài CafeF, mã PNJ, danh mục Doanh nghiệp. Tác giả chuyển sang `Admin`. Slug cũ được giữ theo hành vi `updateArticle` để URL ổn định.
- **Liên kết:** Topic để trống vì danh sách Topic trending trả rỗng; comparison null vì nội dung quản trị nhân sự không có chỉ tiêu tài chính phù hợp. Trước đó không có timeline/case PNJ; tạo hồ sơ event group 5 cho việc thay đổi vai trò và đề nghị miễn nhiệm của ông Đào Trung Kiên, gồm 4 mốc ngày 27/9, 10/10, 13/10 và dự kiến 21/10/2026; mỗi mốc có URL/quote từ CafeF. Article `event_case_ids` liên kết đúng hồ sơ.
- **Kiểm tra:** Admin login và PUT thành công; public API GET 200 cho status `published`, author tier/label/display `admin`/`Admin`/`Admin`, H2=4, timeline=4 (mỗi mốc có bằng chứng), comparison null, `robots=index,follow`; canonical trùng URL slug hiện hữu. Sitemap trả 200 và chứa canonical URL bài. Related entity feed trả 6 bài, category feed trả 6 bài (đều lazy preview theo API); bài đứng đầu entity feed là bài tổng hợp thị trường nhưng có đoạn PNJ và mã PNJ được nêu trực tiếp. Comment count hiện 0; Story/topic không có nên UI không dựng section cùng chủ đề. `git diff --check -- AI_Handoff.md` PASS.
- **Commit:** không có commit code; bài và timeline được cập nhật trên Production qua Admin API; chỉ Handoff local được sửa.
- **Còn lại/lưu ý:** chưa gọi Google Search Console và không khẳng định Google đã index; bài thường được sitemap phát hiện, không dùng Indexing API cho Article. Topic-related section không có dữ liệu vì không có Topic. AI programmatic A/B riêng vẫn để người dùng kiểm thử sau; không lấy lần biên tập thủ công này làm kết quả model.

## 2026-10-13 18:17:00 +07:00 — Codex — kiểm tra lại A/B test bài RSS PNJ

- **Nhiệm vụ/trạng thái:** bị chặn trước khi chạy model; đăng nhập Admin Production thành công nhưng không tạo được job.
- **Phạm vi:** đọc `AI_Handoff.md` và trạng thái Git; đọc API public bài ứng viên; xác thực Admin bằng `/api/admin/auth/login` và gửi yêu cầu tạo đúng một job cho bài PNJ. Không sửa code, publish hoặc gửi yêu cầu index.
- **Trước → sau:** chọn lại bài `post_rss_mv6fxaoz_01sao5`, “Một thành viên HĐQT PNJ xin từ nhiệm trước thềm Đại hội cổ đông bất thường” (`published_rss`, CafeF, mã PNJ, có ảnh). GET bài trả 200 và xác thực Admin trả 200. POST `/api/news/admin/ai/jobs` trả 400 `AI chưa bật hoặc bài không phải nguồn RSS đang chờ`; public payload xác nhận nguồn CafeF/RSS và trạng thái `published_rss`, do đó cần kiểm tra cờ `NEWS_AI_ENABLED`/cấu hình runtime Production. Không thể kết luận chắc chắn nhánh nguyên nhân từ thông báo gộp này. Không lưu thông tin đăng nhập/token.
- **Kiểm tra:** Git branch `staging`, HEAD `8705717`, `5a999f4`, `fe1ac80`; working tree có nhiều thay đổi/xóa ngoài phạm vi, được giữ nguyên. Public article GET 200; admin login 200; enqueue trả 400; không có job tạo ra. Lượt gọi model trước nhận HTTP 429; nguyên nhân quota/billing/rate limit chưa được xác định. Key cục bộ từng dùng đã bị lộ ở lượt trước, không đọc lại hoặc tái sử dụng.
- **Commit:** chưa có; chỉ cập nhật nhật ký này.
- **Còn lại/lưu ý:** xác minh `NEWS_AI_ENABLED=true` và `OPENAI_API_KEY` mới trong cấu hình runtime Production (không in/ghi secret), đồng thời xác minh quota/model GPT-5.4. Sau khi cấu hình đúng, enqueue lại bài này, kiểm tra đầu ra `needs_review` (semantic/media rights cần người duyệt), đối chiếu dữ kiện và các khối optional; chỉ khi duyệt đạt mới chuyển bài thành `published`, kiểm tra canonical/sitemap rồi gửi sitemap qua Search Console. Topic không có thì bỏ qua; sự kiện nhân sự có thể đề xuất timeline nếu đủ bằng chứng; so sánh tài chính không phù hợp thì bỏ qua. Hiện bài vẫn `published_rss`, không được index và chưa sửa đổi.

## 2026-10-13 18:15:00 +07:00 — Codex — fix fallback gắn mã/mobile đã deploy Production

- **Nhiệm vụ/trạng thái:** hoàn thành; CI Production thành công.
- **Phạm vi:** `backend/src/modules/news/news-entity-resolve.service.js`, `backend/tests/unit/news-editorial.test.js`, `User_Web/iflux-web-ui/mobile-nav.js`, `User_Web/tests/news-editorial.spec.cjs`.
- **Trước → sau:** resolver cũ chỉ lấy tên/alias từ Market Master nên tiêu đề “Cổ phiếu PNJ…” bị bỏ mã PNJ. Fallback nay chỉ nhận mã có trong Master khi title/lead định danh rõ (“mã/cổ phiếu CODE”, `$CODE`, `(CODE)`), không quét mã trần toàn thân bài. Nguyên nhân chip mobile mất: bản Production cũ xóa `entities.innerHTML` và đặt `hidden` mỗi lần `ensureArticleIxBottomSlot()` được gọi; resize do URL bar lúc cuộn gọi lại hàm này. Hàm hiện chỉ tạo slot lần đầu, giữ chip ở các lần gọi sau và giữ article bar khi bài còn mounted dù AppShell tạm mất context.
- **Kiểm tra:** unit release 43/43; browser editorial desktop/mobile PASS, gồm regression resize; `sync-js-versions --check`, `build-web-bundle --check`, `diff --check` PASS. CI workflow [38388413812](https://github.com/gmtpv9-iflux/iflux/actions/runs/38388413812) kết luận success; `/tin-tuc`, `/admin/login`, template registry và JS trả HTTP 200; hash JS Production khớp release.
- **Commit:** staging `5a999f4`; Production code `639ddd9`; Handoff `3b9f005`. Push `production` đã kích hoạt CI.
- **Còn lại/lưu ý:** bài RSS cũ không tự re-resolve; backfill `backfillArticleEntities` cần review riêng trước khi chạy. A/B AI vẫn chờ khắc phục HTTP 429 của OpenAI và dùng xác thực Admin hợp lệ; không có bài nào được publish/index bởi lần deploy này. Worktree staging còn thay đổi/xóa ngoài phạm vi và được giữ nguyên.

## 2026-10-13 17:58:00 +07:00 — Codex — Production đã nhận release; A/B bị chặn bởi API/quyền Admin

- **Nhiệm vụ/trạng thái:** push Production hoàn thành; smoke public PASS; A/B GPT thật bị chặn trước khi tạo bài hoặc publish.
- **Phạm vi:** release `b9de079` + Handoff `aaa6c9a`; chỉ đọc API public và asset production. Không thay đổi bài viết hay dữ liệu Production.
- **Trước → sau:** code chưa phát hành → `github/production` cập nhật tới `aaa6c9a`; asset widget bài viết có timeline/so sánh được xác nhận HTTP 200. Các URL `/tin-tuc`, `/admin/login`, template registry đều HTTP 200. API RSS trả 50 bài.
- **Bài ứng viên:** `post_rss_mv6fxaoz_01sao5`, “Một thành viên HĐQT PNJ xin từ nhiệm trước thềm Đại hội cổ đông bất thường”; published_rss, source CafeF, 1.857 ký tự body, ảnh có sẵn, PNJ đúng trong Market Master; nêu các mốc 27/9, 10/10, đại hội dự kiến 21/10. Topic/Story list public đang rỗng (0); timeline PNJ không có milestone. Bài cổ phiếu PNJ tăng cận trần khác bị gắn nhầm VCI/FPT/SSI/VIB/VIX — cần lưu ý sửa resolver/ingest và kiểm chứng bằng test.
- **Kiểm tra:** unit 13/13, PostgreSQL integration 10/10, browser desktop/mobile PASS; JS version/bundle PASS. Một lần gọi GPT-5.4 bằng key cục bộ nhận HTTP 429; không ghi response/key. Endpoint job AI Production trả 403 `Admin key required`. GitHub CLI chưa đăng nhập nên không đọc được trạng thái Actions; asset live đã xác nhận.
- **Commit:** staging `fe1ac80`; Production `b9de079`; Handoff Production `aaa6c9a`.
- **Kết quả A/B:** chưa có output AI; bài vẫn `published_rss`, không sửa, không đổi slug, không đưa sitemap, không yêu cầu Google index. Cần xử lý quota/rate-limit của OpenAI và cấp quyền Admin qua cơ chế đăng nhập an toàn; sau đó enqueue/review job, đối chiếu đầu ra rồi mới publish và kiểm tra sitemap/Search Console.

## 2026-10-13 17:46:00 +07:00 — Codex — chuẩn bị release commit sau khi hòa giải Production

- **Nhiệm vụ/trạng thái:** commit `fe1ac80` đã tạo trên staging; đang hoàn thiện commit release dựa trên `github/production` tại `2f04e4a`.
- **Phạm vi:** checkout riêng `/private/tmp/iflux-production-release`. Cherry-pick gặp 57 conflict: 53 chỉ khác asset hash và được giữ theo Production rồi đồng bộ lại; 4 file có nội dung khác, giữ hành vi Production và ghép riêng mount timeline/so sánh trong bài. Không sửa/xóa worktree của người dùng.
- **Trước → sau:** không thể áp trực tiếp commit staging → có bản release dựa trên Production, giữ phần code Production và tích hợp logic editorial AI, template widgets cần thiết.
- **Kiểm tra:** unit 13/13 PASS; integration PostgreSQL 10/10 PASS; browser desktop/mobile PASS; sync JS versions và web bundle PASS; cần kiểm tra lại diff cuối trước khi commit.
- **Commit:** `fe1ac80` trên staging. Release commit chưa tạo.
- **Còn lại:** hoàn tất review commit release; sau đó push Production để chạy CI/deploy. Chỉ tiếp tục A/B sau khi runtime/key/auth thực tế xác nhận; RSS không index, bài thử chỉ chuyển published khi đủ điều kiện.

## 2026-10-13 17:48:00 +07:00 — Codex — release commit đã tạo, chờ push Production

- **Nhiệm vụ/trạng thái:** hoàn thành hòa giải nhánh; đang chờ push để CI triển khai Production.
- **Phạm vi:** commit release `b9de079` dựa trên Production `2f04e4a`, áp dụng commit Codex `fe1ac80`; giữ các thay đổi Production và đồng bộ lại asset hashes.
- **Trước → sau:** staging thay đổi chưa phát hành và có xung đột với Production → release commit riêng tích hợp backend AI/editorial, prompt, migration và widgets, không đưa 64 commit staging vào release.
- **Kiểm tra:** unit 13/13, PostgreSQL integration 10/10, browser desktop/mobile PASS; JS version và bundle check PASS; `diff --check` PASS.
- **Commit:** `fe1ac80` (staging), `b9de079` (Production release candidate).
- **Còn lại:** push nhánh `production`, theo dõi GitHub Actions và kiểm tra runtime/database. Chưa có xác nhận API key/auth production, nên chưa chạy A/B thật, chưa publish bài và chưa gửi Search Console sitemap.

## 2026-10-13 17:40:00 +07:00 — Codex — xác nhận phạm vi commit

- **Nhiệm vụ/trạng thái:** chuẩn bị commit riêng phần news/editorial AI để phát hành trên nhánh Production; đang làm.
- **Phạm vi:** 122 đường dẫn liệt kê trong `docs/AI-News-Change-Inventory.md`; đã đối chiếu staged paths đúng tuyệt đối với inventory. Không stage 796 đường dẫn khác, bao gồm các file xóa và thay đổi người dùng/Claude.
- **Trước → sau:** working tree có thay đổi hỗn hợp → index Git chỉ có các thay đổi Codex thuộc bài viết/AI, gồm prompt và migration 083.
- **Kiểm tra:** `git diff --cached --check` PASS; 122/122 paths khớp, không thừa/thiếu. Kiểm thử ghi ở mục 17:34.
- **Commit:** chưa có; sắp tạo commit `feat(news): prepare RSS editorial AI preview pipeline`.
- **Còn lại:** sau commit, áp dụng riêng commit này lên production base và xác minh CI/deploy trước khi chạy A/B. Production API key/runtime config chưa được xác nhận; không chép key local.







## 2026-10-13 17:34:00 +07:00 — Codex — chuẩn bị commit riêng cho nhánh release

- **Nhiệm vụ/trạng thái:** đóng gói prompt tự động qua migration 083; kiểm thử xong phần hiện tại, đang chuẩn bị commit Codex trước khi cherry-pick lên nhánh `production`.
- **Phạm vi commit:** chỉ các path ghi trong `docs/AI-News-Change-Inventory.md` cộng migration `083_news_editorial_prompt.sql` đã thêm vào inventory. Không stage file deleted, `.cursor`, Environment Map, Product Vision/ảnh hoặc file ngoài danh sách.
- **Trước → sau:** production artifact trước không mang docs và ai_prompts thiếu prompt → migration 083 đăng ký prompt mặc định, giữ prompt đã chỉnh. Thay đổi AI/product chỉ ở nhánh staging chưa phát hành.
- **Kiểm tra:** unit42/42 PASS; PostgreSQL migration+integration10/10 PASS; browser fixture desktop/mobile PASS; asset-version/bundle PASS; `diff --check` PASS. Ref `github/production` vừa fetch; merge base `fa0dc24`, nhánh staging mới hơn 7 commits; release chỉ cherry-pick commit Codex để giữ phạm vi.
- **Commit:** chưa có, dự kiến `feat(news): prepare RSS editorial AI preview pipeline`; cập nhật ID sau khi commit. Không push staging; push production sẽ kích hoạt CI release thật.
- **Sau commit:** worktree riêng tại production, cherry-pick, kiểm tra conflict/runtime/migration/deploy gate. A/B cần key và cấu hình sẵn ở production; local `.env` không tự được copy. Chỉ tiến hành test với data thật khi API/admin/auth khả dụng; Google index yêu cầu Search Console sitemap route, không dùng Indexing API cho tin thường.

## 2026-10-13 17:32:14 +07:00 — Codex — đang đóng gói prompt cho release production

- **Nhiệm vụ/trạng thái:** migration job đã có nhưng backend production artifact không mang thư mục docs; đang thêm registration an toàn prompt vào migration để A/B không phụ thuộc thao tác DB thủ công.
- **Phạm vi trước khi sửa:** `backend/migrations/083_*`, fixture migration integration; chưa sửa file thuộc người dùng khác. Giữ prompt registry `ai_prompts`, ON CONFLICT giữ nguyên prompt Admin hiện hữu.
- **Trước → sau:** 082 tạo queue nhưng production ai_prompts không tự có news-editorial-v1 → migration 083 tạo active prompt mặc định khi chưa có, không ghi đè prompt đã quản lý; test DB xác nhận.
- **Kiểm tra:** migrations 081/082 + pipeline 10/10 trước thay đổi; chạy lại sau 083.
- **Commit/deploy:** chưa có. Cần kiểm tra nguồn 083 và migration deploy workflow trước khi commit.

## 2026-10-13 17:27:13 +07:00 — Codex — đang chuẩn bị production deploy rồi A/B test RSS

- **Nhiệm vụ/trạng thái:** người dùng chỉ rõ DB local không có RSS thật và yêu cầu deploy Production trước rồi A/B test theo prompt; đang làm.
- **Phạm vi:** deploy boundary/release workflow, nhánh `production`, chỉ các file Codex trong [AI-News-Change-Inventory.md](docs/AI-News-Change-Inventory.md), migrations 081/082, post-deploy smoke và nguồn RSS production cho đúng một bài. Không stage 773 file đã xóa hoặc thay đổi người dùng ngoài inventory.
- **Trước → sau:** local `iflux_dev` thiếu `news_posts`, AI thật chưa chạy; xác định Production branch/runtime, rà diff/migrations, deploy đúng quy trình đã xác nhận; sau đó chọn RSS thật nhiều dữ liệu, chạy extract/compose, kiểm tra output, sitemap và Google discovery. Chỉ publish bài nếu bài thử đạt điều kiện đã mô tả.
- **Kiểm tra trước deploy:** unit42/42, DB fixture10/10, browser desktop/mobile, asset/bundle checks đều PASS; chưa có smoke Production. DB local không có bảng `news_posts`; backend/.env local, không phải Production.
- **Commit:** chưa có. Người dùng đã yêu cầu rõ deploy Production sau kiểm thử chuẩn; GitHub Actions push branch production triển khai runtime `iflux.vn`/API :3003. Không dùng Push khi chưa xác định base/đúng diff và kiểm tra migrations.
- **Lưu ý:** RSS không được gửi Indexing API. Bài tin thường dùng sitemap/Search Console; bài news tin không đủ điều kiện Indexing API JobPosting/BroadcastEvent. Không khẳng định đã index cho đến khi kiểm chứng Search Console. Bài hiện đổi URL khi publish theo yêu cầu A/B này; cập nhật canonical/slug theo route thực tế.

## 2026-10-13 17:25:21 +07:00 — Codex — đang làm A/B test một bài RSS

- **Nhiệm vụ/trạng thái:** chọn bài `published_rss` có dữ liệu tốt nhất trong DB local, chạy prompt hai bước bằng model thật nếu có thể, đối chiếu thiếu dữ liệu và báo cáo. Chỉ chuyển bài chính thức/index hoặc phát hành khi test đạt và đường môi trường/Google hợp lệ; đang làm.
- **Phạm vi:** trước mắt chỉ đọc DB `localhost/iflux_dev`; bài được chọn, job AI test và báo cáo trong `docs/AI-News-AB-Test-Report.md`. Nếu phải đổi code, ghi riêng module trước khi sửa. Không đọc dữ liệu production hoặc sửa bài thật.
- **Trước → sau dự kiến:** chưa có A/B trên bài RSS thật → có đầu vào/đầu ra và đối chiếu prompt rõ nguồn, thiếu gì, hành động nếu dữ liệu có. Không tự coi `localhost` là staging/production.
- **Kiểm tra ban đầu:** `backend/.env` trỏ `localhost`, `APP_ENV=local`, `NEWS_AI_ENABLED=false`; AI thật chưa gọi. HEAD `c50c0ce`, branch staging; working tree chứa nhiều thay đổi Codex và thay đổi người dùng đã ghi phía dưới, chưa stage/commit.
- **Commit:** chưa có. **Cảnh báo cho AI tiếp theo:** Google Indexing API chỉ dùng cho `JobPosting` hoặc live broadcast hợp lệ; article thường phải qua sitemap/Search Console. README xác định deploy production là push branch `production` kích hoạt CI; tuyệt đối không làm trước khi A/B đạt và review phạm vi riêng.

## 2026-10-13 17:17:17 +07:00 — Codex — hoàn thành slice local, toàn pipeline còn gap

- **Nhiệm vụ/trạng thái:** hoàn thành thiết lập handoff, slice bài viết/UI và tích hợp AI hai bước ở chế độ preview/review; **chưa hoàn thành/nghiệm thu toàn bộ auto-publish**.
- **Phạm vi:** toàn bộ file Codex đã đăng ký ở các mục dưới; mới thêm `docs/AI-News-Programmatic-Prompt.md`, `docs/AI-News-Integration.md`, `docs/AI-News-Change-Inventory.md`, module ai contract/provider, news context/jobs, migration `082_news_ai_jobs.sql`, script đăng ký prompt, config/server/.env.example, routes/RSS và tests. Danh sách file xem inventory; không bao gồm các thay đổi có sẵn của người dùng/Claude.
- **Trước → sau:** RSS vẫn public nhưng tuyệt đối không đăng ký index/sitemap; official giữ URL khi đổi title. Có template timeline/comparison, mobile TOC/comments đúng vị trí, related entity → Story → category và lazy date list/Back. AI chưa có provider/contract/job → có Responses adapter mặc định GPT‑5.4, JSON Schema + Zod, extract→context→compose preview, snapshot source/prompt/model/schema, checkpoint/retry/backoff/lease/fencing/quota 10 jobs/ngày UTC mặc định. Reuse ai_prompts/scheduler/catalog/news/media, không kho financial facts riêng.
- **Secret theo yêu cầu mới:** xác nhận `backend/.env` hiện có `OPENAI_API_KEY` đã điền và cấu hình DB/JWT, chỉ kiểm tra trạng thái, không in giá trị. Đây là file env backend dùng chung; không tạo/sửa thêm env runtime. File mẫu không phải env thứ hai; infra/staging/staging.env là cấu hình triển khai. Git ignore .env đã kiểm tra. Chưa xác nhận hiệu lực key bằng API thật; không thể xác định lịch sử tạo file ignored từ Git.
- **Kiểm tra cuối:** unit **42/42 PASS**; PostgreSQL tạm **10/10 PASS** với migrations 081/082, gồm quota/HTTP guards/AI mock 429 + checkpoint + concurrent claim + source unchanged. Browser fixture **PASS desktop1440/mobile390**: templates/runtime, TOC/comments/lazy related/date list/Header Back. Asset versions và global bundle **PASS**; diff --check PASS. Screenshots `/private/tmp/iflux-news-browser-evidence/`. Không tính health suite cần server localhost:3001 vào số PASS. Chưa kiểm chứng staging/live/model thật.
- **Commit liên quan:** chưa có; không stage/commit/push/deploy, chưa chạy migration trên DB dự án. HEAD khi bắt đầu `c50c0ce`, branch staging. Giữ nguyên 773 đường dẫn deleted và các diff ngoài task có sẵn.
- **Gap bắt buộc cho AI tiếp theo:** semantic claim/fact gate (quote matching chưa đủ), semantic dedup/ghép hồ sơ đăng ký–kết quả/pháp lý/dự án qua nhiều nguồn, mẹ/con/brand/alias, corrections/confidence/roles đầy đủ, lịch sử cùng loại, quyền/readiness ảnh + AI section image mapping, transaction publish/link/outbox, UI review AI, staging và eval model thật. P/E/P/B/Room NN chưa có adapter đã chứng minh; chỉ market_cap/shares_outstanding available. Source unique URL/cross-source dedup còn thiếu. Key có giá trị không đồng nghĩa model/quota đã dùng được.
- **Publish/index:** worker chỉ ghi jobs, luôn needs_review khi compose xong, không sửa/publish source, không tạo case/mốc tự động. Chưa có client Google submission; nguồn không được gửi index. Hướng đúng cho bài tin là sitemap/Search Console, không giả JobPosting/BroadcastEvent để dùng Indexing API.
- **Tiếp theo:** đọc readiness doc/prompt; kiểm thử thật có kiểm soát local/staging khi cấu hình/migrations/prompt sẵn sàng, hoàn thiện gap trước mở auto-publish. Bật NEWS_AI_ENABLED có thể quét cả RSS cũ chưa enqueue, bị giới hạn batch/quota; chưa có allowlist UI. Claude cần báo người dùng trước nếu sửa scope Codex; đọc lại nhật ký hiện tại trước prepend, giữ mọi mục.

## 2026-10-13 — Codex — đang làm cấu hình secret và kiểm thử AI giả lập

- **Nhiệm vụ/trạng thái:** dùng biến `OPENAI_API_KEY` theo chỉ định người dùng; chỉ kiểm thử giả lập, không đọc giá trị key; đang làm.
- **Phạm vi bổ sung:** `backend/.env.example`, `backend/scripts/register-news-ai-prompt.js`, module `ai/{news-ai.contract,openai-responses.provider}.js`, news context/jobs, migration `082_news_ai_jobs.sql`, config/server/routes/tests và docs tích hợp. 082 này là job queue, không phải kho metric đã gỡ.
- **Trước → sau:** prompt chưa có tài liệu/contract → đã lưu đầy đủ tài liệu; đang thêm hai bước có schema, prompt snapshot/version/hash, job retry/lease và hàng chờ kiểm tra. Reuse ai_prompts hiện hữu, scheduler hiện hữu; queue core chỉ là shell nên job news dùng PostgreSQL, không dựng broker khác.
- **Kiểm tra:** integration bài viết 9/9 PASS; xác nhận local dotenv dùng backend/.env khi cwd backend, Git ignore .env; production dùng shared/.env theo script, không truy cập/sửa secret.
- **Commit:** chưa có. **Việc còn lại:** tests AI giả lập/DB, browser, cập nhật gap và hướng dẫn cấu hình. Không tự bật auto-publish và không deploy.

## 2026-10-13 — Codex — đang làm chuẩn bị và tích hợp AI hai bước

- **Nhiệm vụ/trạng thái:** lưu nguyên prompt mới của người dùng, rà yêu cầu, bổ sung contract extract/compose và tích hợp OpenAI có kiểm soát; đang làm.
- **Phạm vi:** tài liệu `docs/AI-News-*`, backend news (service/routes/RSS), config/server, migration job AI mới, backend tests. Giữ nguyên phạm vi UI và các thay đổi Codex đã ghi bên dưới; không đụng thay đổi bên khác.
- **Trước → sau dự kiến:** có nền tảng article/widget nhưng chưa có prompt/contract/provider/job AI → prompt có version, schema hai bước, context từ dữ liệu thật, hàng chờ bền vững và chạy thử không publish. Chưa xác nhận đủ điều kiện auto-publish; không tự bật khi còn gap kiểm chứng.
- **Kiểm tra:** đọc lại nhật ký, AGENTS, Git và commit mới nhất. Cần sửa fixture HTTP và chạy lại kiểm thử; không có API-key tool, không đọc/in secret.
- **Commit:** chưa có. **Việc còn lại:** đối chiếu gap, kiểm thử provider bằng transport giả lập và end-to-end DB riêng, bàn giao cấu hình/kết quả thật; không deploy production.

## 2026-10-13 16:51:36 +07:00 — Codex — đang làm đóng đường tự xuất bản từ API User cũ

- **Nhiệm vụ/trạng thái:** rà gate chính thức khi chỉ Admin/AI backend được chuyển published; đang làm.
- **Phạm vi bổ sung trước khi sửa:** `backend/src/modules/news/news.service.js` (chưa có diff từ bên khác tại lúc đọc); routes/tests news đã thuộc phạm vi Codex.
- **Trước → sau dự kiến:** API User cũ có thể gửi status published, nhánh không category mặc định published → User chỉ lưu draft/pending, phải qua bước biên tập chính thức; public list không cho truy vấn draft/pending. Không thay đổi các seed cũ trong slice này.
- **Kiểm tra hiện tại:** unit38/38, PostgreSQL7/7 và browser fixture desktop/mobile PASS trước sửa này. Bổ sung HTTP/API test, kiểm tra giữ cover.variants và ảnh đã import. **Commit:** chưa có.
- **Việc còn lại:** chạy kiểm chứng lại, handoff cuối; không publish/deploy và không chạm các thay đổi người dùng/Claude có sẵn.

## 2026-10-13 16:45:40 +07:00 — Codex — đang làm đồng bộ asset versions

- **Nhiệm vụ/trạng thái:** chạy công cụ bắt buộc `sync-js-versions.mjs` cho các JS/CSS đã sửa; đang làm.
- **Phạm vi bổ sung:** các manifest/features/runtime loader/widget wrapper và HTML User_Web tham chiếu asset thay đổi. Đây là cập nhật hash do công cụ sinh, không thay nghiệp vụ của các trang đó. Danh sách cụ thể lấy từ diff sau khi chạy; không stage thay đổi có sẵn của người dùng/Claude.
- **Trước → sau:** version cũ lệch nội dung → hash và chuỗi import đồng bộ. `--check` đã chỉ ra các tham chiếu cần sửa. Bundle CSS global đang PASS, không cần regenerate bundle khi nguồn global không đổi.
- **Kết quả kiểm tra hiện tại:** toàn bộ unit **38/38 PASS**; browser desktop đã đi qua preview/article/group/Back, lượt mobile đang sửa fixture bình luận (`body`, không phải `content`), chưa coi cả bộ browser PASS. Backend integration cần chạy lại diff cuối.
- **Commit:** chưa có. **Việc còn lại:** kiểm tra diff hash-only ở file ngoài feature, browser mobile, integration, tài liệu và handoff cuối; báo người dùng trước nếu nhật ký có AI khác đăng ký phạm vi trùng.

## 2026-10-13 16:35:02 +07:00 — Codex — đang làm kiểm chứng và mở rộng phạm vi UI

- **Nhiệm vụ/trạng thái:** tiếp tục slice bài viết; đang làm kiểm chứng browser và sửa đúng owner Header Back.
- **Phạm vi bổ sung trước khi sửa:** `User_Web/iflux-web-ui/iflux-web-ui.js`, `news-ui.js`, test mới `User_Web/tests/news-editorial.spec.cjs`; các file đã ghi ở mục trước tiếp tục thuộc phạm vi Codex.
- **Trước → sau dự kiến:** Back hiện chỉ khởi tạo trong mobile-nav (desktop không nạp) → chuyển cùng một implementation về core header dùng chung, xóa owner cũ; không tạo hai nút/handler. Khung tác giả hiện hardcode “Chuyên gia tài chính / 5+ năm kinh nghiệm” không có dữ liệu → bỏ các nhận định không có căn cứ.
- **Kiểm tra:** đã đọc lại nhật ký, Git và HEAD; hai file UI bổ sung chưa có diff tại lúc kiểm tra. Sẽ kiểm tra desktop/mobile, lazy nhóm, Back và template bằng fixture; chưa báo PASS browser.
- **Commit:** chưa có. **Việc còn lại:** chạy tests, cập nhật versions/bundle, tài liệu, handoff kết thúc. Claude cần báo người dùng trước nếu cần sửa các file này.

## 2026-10-13 16:33:06 +07:00 — Codex — hoàn thành thiết lập bàn giao

- **Nhiệm vụ:** thiết lập nhật ký chung và quy tắc phối hợp theo yêu cầu người dùng. **Trạng thái:** hoàn thành phần thiết lập; công việc bài viết/AI bên dưới vẫn đang làm.
- **Phạm vi:** `AI_Handoff.md`, `AGENTS.md`, `CLAUDE.md` ở gốc repo.
- **Trước → sau:** chưa có nhật ký/CLAUDE.md và AGENTS chỉ có tùy chọn ngôn ngữ → đã tạo nhật ký timeline mới nhất ở đầu, ghi toàn bộ phạm vi Codex đang sửa; giữ tùy chọn tiếng Việt trong AGENTS, thêm đủ 5 quy tắc vào cả AGENTS và CLAUDE.
- **Kiểm tra:** đã đọc lại file hiện tại và Git/6 commit mới nhất trước khi ghi; kiểm tra đủ 5 quy tắc, đủ các trường bàn giao, lịch sử mục đầu tiên được giữ nguyên. CLAUDE.md chưa tồn tại nên được tạo mới, không thay thế hướng dẫn cũ.
- **Commit:** chưa có; chưa stage/push/deploy.
- **Lưu ý cho Claude:** đọc mục đang làm phía dưới trước khi sửa code; báo người dùng nếu cần đụng phạm vi đó. RSS tuyệt đối không được gửi đăng ký index/đưa vào sitemap; chỉ published chính thức mới đi vào luồng index. Không khôi phục kho số liệu so sánh riêng đã gỡ.
- **Việc còn lại:** Codex tiếp tục kiểm chứng task bài viết; cập nhật nhật ký trước bàn giao/commit tiếp theo.

## 2026-10-13 16:29:43 +07:00 — Codex — đang làm

### Nhiệm vụ và trạng thái
- Thiết lập nhật ký phối hợp theo yêu cầu người dùng; tạo file này trước khi bổ sung hướng dẫn AGENTS.md/CLAUDE.md.
- Đang triển khai nền tảng bài RSS → biên tập chính thức, SEO, timeline, so sánh và bài liên quan. Chưa hoàn tất kiểm chứng toàn bộ; không coi các diff hiện tại là bản đã nghiệm thu.
- Chưa gọi AI, chưa commit/push, chưa deploy hoặc migrate DB dự án/staging/production.

### Quy tắc nghiệp vụ mới nhất của người dùng
- `published_rss`: lưu DB, hiển thị User Web/Admin, **KHÔNG gửi đăng ký Google index, KHÔNG đưa vào sitemap; luôn noindex**. Không được metadata ghi đè thành index. Chỉ bài đã chuyển sang `published` mới đi vào luồng index. “Không đủ điều kiện index” là cách diễn đạt trước đó chưa rõ, không phải cho phép đăng ký RSS rồi chờ Google quyết định.
- Sửa tiêu đề không làm thay đổi URL đã cấp.
- Chủ đề là optional, dùng Topic/Story hình thành từ thống kê hashtag Cộng đồng; không sáng tác ID. Thảo luận chưa xác minh không trở thành dữ kiện sự kiện.
- So sánh là optional: AI đề xuất mục đích, chỉ tiêu thông tin doanh nghiệp, danh sách mã và **một** phạm vi Ngành/Hệ sinh thái/Câu chuyện liên quan. Backend kiểm tra membership và lấy số liệu CSDL hiện hữu; không nhận số liệu tự tạo từ AI, không tạo kho dữ liệu tài chính song song. P/E/P/B/Room NN chỉ bật adapter khi xác nhận được nguồn thật.
- Thứ tự đề xuất theo mô tả mới nhất: cùng thực thể → cùng chủ đề → cùng danh mục. Mỗi nhóm một section + Xem tất cả; lazy load. Danh sách nhóm dùng cùng logic lọc, tải theo ngày, có Back header. Bình luận mobile nằm trước các nhóm.
- Timeline và so sánh dùng Template/DS, runtime loader/pipeline hiện hữu; public không dùng dữ liệu demo. Giữ cơ chế import/convert/regeneration ảnh.

### Phạm vi Codex đang xử lý — cần báo người dùng trước nếu AI khác muốn sửa chung
- Backend news: `backend/src/modules/news/news-articles.service.js`, `news-entity-resolve.service.js`, `news-feed.service.js`, `news.routes.js`, `rss-ingest.service.js`; file mới `news-events.service.js`.
- SEO: `backend/src/modules/seo-platform/seo-platform.service.js`; test sitemap hiện hữu. Đã đọc `backend/src/modules/sitemap/providers/posts.js`, chưa sửa file này vì đã chỉ chọn published.
- Market: file mới `backend/src/modules/market/market-comparisons.service.js`, đọc `stocks`, quan hệ danh mục và `market_sot_audit` hiện hữu.
- Migration mới: `backend/migrations/081_news_event_timeline.sql`. Đề xuất 082_market_verified_metrics đã được tạo trong quá trình làm rồi **gỡ trước commit**, theo quyết định người dùng không tạo kho số liệu song song; chưa chạy migration đó trên DB nào.
- Dependencies: `backend/package.json`, `backend/package-lock.json` (sanitize-html).
- Backend tests: file mới `backend/tests/integration/news-editorial.test.js`, `backend/tests/unit/news-editorial.test.js`; sửa `backend/tests/unit/seo-platform-sitemap.test.js`.
- User Web: `User_Web/iflux-web-ui/{entity-detail-center.js,iflux-news-api-bridge.js,mobile-nav.js,news-daily-feed.js,news-page.js,news-post-page.js,news.css}`, `runtime/mount-published-widgets.js`, `widgets/{news-page,news-post-page,stock-page}/index.js`.
- Admin: `Admin_Design_system/app/news/content/{article-edit-page.js,article-html-contract.js,edit.html}`.
- Templates: `design_system/05_templates/templates.json`, `03_diverging-bars/diverging-bars.js`, mới `17_event-timeline/{event-timeline.js,event-timeline.css}`, `18_stock-comparison/stock-comparison.js`; preview mới `patterns/event-timeline/index.html`.
- Tài liệu mới: `docs/AI-News-Context-Audit.md`, `docs/AI-News-Master-Plan.md`, `docs/AI-News-Article-Implementation.md`; cần cập nhật các tài liệu này theo phạm vi so sánh vừa thay đổi.

### Đã làm / thay đổi trước → sau trong working tree
- RSS robots từng cho seo.robots override → buộc noindex nếu trạng thái khác published; sitemap candidates chỉ published. Đang rà generic SEO contract/head/HTTP cùng một rule. Chưa thấy client Google Indexing API trong backend/src/scripts/.github đã tìm; hiện kiểm soát sitemap/robots, không được báo đã gửi Google khi chưa có submission thực tế.
- updateArticle từng tính lại slug theo title → giữ current.slug; editor không gửi slug mới. Event publication chỉ khi chuyển sang published.
- Related từng trộn danh mục/Story/mã và fallback tin bất kỳ → tách nhóm, kiểm tra cùng thực thể/Story/danh mục, loại bài hiện tại/draft, loại lặp giữa preview groups; keyset cursor và ngày Asia/Ho_Chi_Minh.
- Tab sự kiện từng empty-only → đọc hồ sơ/mốc có nguồn và chỉ hiện hồ sơ được bài published sử dụng. Hồ sơ không bị xóa theo Topic/Story. Thêm Admin chọn hồ sơ và nhập mốc có nguồn; chưa phải pipeline AI tự động hoàn chỉnh.
- Chưa có template sự kiện/so sánh → hai template dùng IfxTemplates, component Timeline/Table và plot phân kỳ hiện hữu, cùng đường mount preview/runtime, data rỗng public không lấy demo.
- So sánh bản đầu giới hạn cùng ngành/metric nhập riêng → chuyển contract mục đích + một scope + danh sách mã, lấy dữ liệu canonical stocks; snapshot lúc publish. Hiện xác nhận source có market_cap/shares_outstanding; P/E/P/B/Room NN chưa có adapter đã kiểm chứng.
- HTML Admin có sanitizer nhưng backend không bao phủ → thêm sanitize-html tại lưu/đọc bài và RSS; giữ alt/data-media-asset-id/ảnh hợp lệ/figure/table; cho internal links hợp lệ trong contract Admin.
- Resolver gắn tên ngắn nằm trong tên pháp nhân khác → bỏ match lồng trong tên dài của mã khác, vẫn giữ mention độc lập. Fixture tổng hợp đã qua; chưa có xác nhận bài lỗi cụ thể trên DB thật.
- Mục lục mobile thêm ngay trước thân bài, cùng danh sách H2 với sidebar desktop; thêm nhận định optional 400–600 ký tự.

### Kết quả kiểm tra tại thời điểm bàn giao này
- PostgreSQL tạm: **7/7 test integration PASS** ở lượt chạy trước các sửa gần nhất (generic SEO contract, sanitizer và resolver); cần chạy lại sau khi hoàn thiện. Đã kiểm tra status/index, URL/event publish, Story hợp lệ, related groups, cursor ngày/timestamp trùng, null/0/retry/conflict, case sống sau Topic DELETE, scope so sánh và snapshot ổn định.
- Unit riêng `backend/tests/unit/news-editorial.test.js`: **3/3 PASS** sau sửa đường dẫn test, gồm sanitizer/ảnh, template không demo public/null/0/cột âm, resolver tên lồng nhau. Chưa chạy lại toàn bộ unit sau lượt này.
- Test sitemap gốc đã có lỗi kỳ vọng 9 trang tĩnh trong khi inventory là 10; chạy lại với source SEO từ HEAD xác nhận lỗi có trước. Đã cập nhật kỳ vọng 10 để khớp inventory; cần xác nhận full suite.
- `npm test` ban đầu có hai health test phụ thuộc server localhost:3001 và bị sandbox chặn; chưa coi health integration đã PASS.
- Đã kiểm tra cú pháp nhiều file; cần kiểm tra lại diff cuối. Chưa có browser/desktop/mobile evidence, chưa chạy asset-version/bundle check cuối.
- sanitize-html đã cài thành công; không chạy npm audit fix hàng loạt.

### Commit và trạng thái Git
- Commit Codex: **chưa có**. Branch `staging`; HEAD tại lúc đọc: `c50c0ce` (2026-10-10 00:13:35 +07:00).
- 6 commit mới nhất đã đọc: c50c0ce, 479d92a, a8cc935, cb7a547, 67f554d, 6e18350.
- Trước Codex đã có 773 đường dẫn bị xóa, thay đổi `.cursor/rules/ssh-deployment-boundary.mdc`, `docs/SoT — Environment Map (Live Production, Staging 1, Staging 2).md`, thư mục untracked `docs/Product Vision/` và ảnh `kien-truc-4-tang-preview-1.jpg`. **Không phải thay đổi Codex; không hoàn tác, stage hoặc commit chung.** AGENTS.md là file Codex tạo từ yêu cầu lưu ngôn ngữ trước đó.
- Git fsmonitor mặc định báo IPC error; dùng `git -c core.fsmonitor=false ...`, không đổi config chung.

### Việc còn lại / lưu ý cho AI tiếp theo
1. Hoàn tất kiểm thử, browser desktop/mobile/lazy/back/template parity; kiểm tra route/API middleware, cache/robots/sitemap mọi đường.
2. Rà lại công bố so sánh và tài liệu theo rule chính thức mới, metric catalog + provenance/period/unit; không phục hồi migration 082 hay endpoint nhập số liệu riêng.
3. Chạy sync-js-versions và build-web-bundle theo governance, kiểm tra diff phát sinh thuộc task; cập nhật tài liệu và nhật ký trước commit.
4. AI provider/GPT‑5.4 chưa tích hợp; người dùng đang đăng ký. Source intake, jobs bền vững, semantic facts/review tự động và eval còn trong roadmap, không báo đã hoàn thành toàn bộ AI workflow.
5. PostgreSQL tạm được tạo có phép tại `/private/tmp/iflux-news-pg-20261013`, localhost:55483; tests dùng schema `news_editorial_test_<pid>` rồi DROP riêng schema đó. Không dùng DATABASE_URL dự án. Cần stop instance tạm khi xong.
6. Browser cache có Chromium, Playwright có trong npm cache local; chưa thêm dependency browser vào repo. Thư mục `backend/tests/fixtures/` mới tạo còn trống; dùng cho fixture hoặc dọn khi kết thúc, không để folder rỗng vô cớ.
7. Claude cần đọc nhật ký này và báo người dùng trước nếu muốn sửa phạm vi Codex đang làm ở trên. Codex phải làm tương tự với phạm vi Claude ghi sau này. Không tự commit/push/deploy chỉ vì có nhật ký.
