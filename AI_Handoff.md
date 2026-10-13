# Nhật ký bàn giao chung — Codex và Claude

Mục mới nhất ở đầu. Trước khi thêm mục: đọc lại file hiện tại, thêm phía trên các mục cũ và giữ nguyên lịch sử. Không ghi secret, API key hoặc dữ liệu riêng tư vào nhật ký.

## 2026-10-13 21:27:00 +07:00 — Codex — chuẩn bị phát hành metadata SEO, author widget và sửa mobile entity ownership

- **Nhiệm vụ/trạng thái:** đang làm theo yêu cầu Owner: phát hành metadata/canonical/index policy đã kiểm thử trước đó, sửa khung tác giả và lỗi bottom bar mobile, sau đó purge cache và smoke-test.
- **Phạm vi:** release cô lập dựa trên Production `3b9f005`; backend SEO/news, Admin article editor, User Web author widget/mobile entity hydration, browser regression test. Không đưa thay đổi khác từ worktree staging.
- **Trước → sau:** RSS giữ noindex và không vào sitemap; official publish mới chốt canonical/ngày/schema/meta description. Author source row vẫn có nhãn cũ và AI row. Root cause chip bị thay khi cuộn là `refreshTickerQuoteDom()` lấy `posts[0]` từ related lazy feed rồi ghi vào mobile bottom bar toàn cục; đã bỏ side effect đó, bottom strip do trang chi tiết hiện tại sở hữu.
- **Kiểm tra:** browser desktop/mobile PASS, gồm lazy related load không ghi đè mã bài hiện tại; SEO unit 5/5 PASS; PostgreSQL integration 11/11 PASS; JS version và web bundle checks PASS. Timeline template hiển thị ngày diễn ra/hiệu lực và tiêu đề link nguồn nội bộ. Đã đồng bộ asset versions/bundle; đang review diff trước commit.
- **Commit:** chưa có.
- **Còn lại/lưu ý:** hoàn tất checks, ghi commit trước khi push branch `production`; chờ CI deploy thành công rồi purge cache Cloudflare và smoke-test. Không ghi secret vào log.

## 2026-10-13 18:22:00 +07:00 — Codex — release Production fix fallback mã và chip mobile

- **Nhiệm vụ/trạng thái:** đã tạo release commit `639ddd9` dựa trên Production `aaa6c9a`; đang chờ push để CI triển khai theo yêu cầu Owner.
- **Phạm vi:** `backend/src/modules/news/news-entity-resolve.service.js`, `backend/tests/unit/news-editorial.test.js`, `User_Web/iflux-web-ui/mobile-nav.js`, `User_Web/tests/news-editorial.spec.cjs`, `AI_Handoff.md`. Không nhập các file ngoài phạm vi.
- **Trước → sau:** resolver bỏ mã cổ phiếu viết rõ trong tiêu đề/lead nếu mã không có trong alias pháp lý; fallback mới chỉ nhận mã từ Market Master có chỉ dấu rõ. Nguyên nhân chip mất đã xác định ở Production: `ensureArticleIxBottomSlot()` xóa `innerHTML` và đặt `hidden` mỗi lần chạy lại dù slot đã tồn tại; resize do URL bar lúc cuộn gọi hàm này. Giờ hàm idempotent, chỉ dựng slot lần đầu; khi article root vẫn mounted thì AppShell mất context cũng không render nav chung đè thanh bài. Giữ các mục A/B đã có trong handoff Production.
- **Kiểm tra:** backend unit 43/43 PASS; browser editorial desktop/mobile PASS, gồm test resize trên Production release checkout; `sync-js-versions --check`, `build-web-bundle --check`, `diff --check` PASS.
- **Commit:** staging `5a999f4`; Production `639ddd9` (nội dung fix tương đương, cherry-pick/resolve riêng trên base Production).
- **Còn lại/lưu ý:** chỉ push `production` qua GitHub để CI deploy; sau đó kiểm tra CI và public smoke. Không đụng các thay đổi/xóa không liên quan ở worktree staging. Local `OPENAI_API_KEY` cần được rotate sau khi bị lộ trong output công cụ; key không nằm trong patch/commit.

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
