# Bài viết RSS, index và nội dung liên quan — implementation slice

## 1. Overview
Task Objective: RSS hiển thị nhưng không được đăng ký index, không vào sitemap, luôn noindex; bài chính thức giữ URL, có timeline sự kiện có nguồn và ba nhóm liên quan đúng thứ tự.

Task Roadmap: khảo sát → sửa trạng thái/URL và API → template timeline → tích hợp article/list → kiểm chứng và bàn giao. Current Phase Objective: thực hiện phạm vi người dùng vừa yêu cầu, chưa gọi AI thật hay deploy. Phase Contribution: chuẩn bị đường publish/context/UI để tích hợp GPT‑5.4 sau. Exit preview: test backend/frontend, template parity, version/bundle check.

## 2. Objective
`published_rss` tiếp tục đọc được trên User Web/Admin, luôn noindex và ngoài sitemap dù metadata yêu cầu index. Chỉ `published` đủ điều kiện index; noindex chủ động của Admin vẫn được giữ. Sửa title không sửa slug. Lưu biên tập chưa đồng nghĩa duyệt xuất bản: dùng hành động Xuất bản hiện có để chuyển chính thức.

## 3. Scope
SEO contract/sitemap; article mutation; Story đã hình thành; event data/API/template; related groups; list lazy theo ngày; header back; mobile comments. Đã bổ sung provider/pipeline AI preview theo yêu cầu tiếp theo; xem AI-News-Integration.md.

## 4. Evidence / Impact Analysis
| Feature | Owner/files/functions | Consumer/storage/API | Decision |
| --- | --- | --- | --- |
| Index | seo-platform.service resolveArticleContract/articleOverridesFromCandidate, sitemap/providers/posts | article head/headers/sitemap | Modify rule trạng thái, reuse contract |
| URL | news-articles.service updateArticle/normalizeArticleInput | Admin edit, canonical, former_slugs | Modify giữ current slug; bỏ slugify title từ editor payload |
| Related | news-feed.service listFeed/fetchCommunityRows, news.routes feed | news-post-page, news-page, DailyFeed, API bridge | Modify owner hiện hữu; bỏ related mixed/expert section cũ |
| Timeline | DS 04_components/16_timeline, pattern order-detail, DS 05_templates/README và templates.json, runtime mount-published-widgets | contextual article widget | New template capability, component/pipeline reuse; không copy renderer vào article |
| Event facts | Không thấy hồ sơ/mốc trong source; story chỉ là thảo luận | article event_case_ids, timeline API | New schema/service có ownership news events; không biến ngày bài thành event; không phụ thuộc Topic CASCADE |
| Navigation/list | news-page, news-daily-feed, platform-boot context | /tin-tuc query group, Shell header/back | Modify current page/feed, không thêm page runtime |

Template tuân README hiện hành `design_system/05_templates/README.md` và yêu cầu trực tiếp của người dùng, cụ thể hơn mô tả folder cũ trong Canonical UI Architecture. Template có demo chỉ cho preview; public dùng data thật, rỗng không hiện demo.

## 5. Deliverables
Sửa service/gate đúng owner; template dùng một render qua IfxTemplates và preview pattern; public timeline chỉ dữ kiện được duyệt có bằng chứng, gắn hồ sơ cụ thể; ba section thực thể → chủ đề → danh mục, mỗi section một batch + Xem tất cả; list mỗi batch một section ngày, có back Header. Admin/API có đường nhập/gắn hồ sơ; AI sau dùng cùng contract, chỉ chọn Story hiện hữu hợp lệ.

## 6. Gap
Đã có adapter GPT‑5.4/Structured Outputs, contract và PostgreSQL jobs preview; chưa gọi model thật. Đã khóa override noindex RSS. Chưa đủ semantic quality gate/ghép hồ sơ/ảnh/transaction để tự publish; giới hạn chi tiết theo AI-News-Integration.md.

## 7. Out of Scope
Không production deploy, chưa gọi AI thật, không khôi phục file người dùng xóa, không tái triển khai Topic engine. RSS tuyệt đối không gửi đăng ký index; chỉ published được xét sitemap. Chưa có Search Console submission client và chưa kiểm chứng Google index thật.

## 8. Exit
- [x] RSS không thể override index; official có thể đủ điều kiện, URL ổn định.
- [x] Timeline có schema/evidence và dùng template chung preview/runtime, không demo public.
- [x] Related groups và lazy date list đúng; mobile comments trước groups; header back.
- [x] Kiểm thử behavior, asset versions và tài liệu bàn giao.

## 9. Open Items
Unit42/42 và PostgreSQL10/10 PASS trên DB tạm; browser fixture desktop/mobile PASS; asset version/bundle PASS. Chưa migrate DB dự án/staging, chưa kiểm chứng dữ liệu thật. Secret dùng chung backend/.env; chưa gọi API thật. Xem bảng readiness trong AI-News-Integration.md.

## 10. Phase Verdict
Slice article/UI và pipeline AI preview đã kiểm chứng local. **Auto-publish đã triển khai 2026-10-16** (Owner bật/tắt + chọn model tại Admin → Thiết lập SEO → AI Programmatic SEO; chỉ publish khi output qua hết kiểm tra nội dung, có review_reasons thật thì luôn rơi về needs_review dù đã bật). [Tài liệu tích hợp và gap](./AI-News-Integration.md). Prompt không còn ở file riêng — sửa trực tiếp trong DB qua Admin.
