# REQUEST — Canonical CSS Ownership & Scope Normalization

## 1. Bối cảnh

Canonical iFlux Design System đang được xây dựng để trở thành Global Design System duy nhất của toàn hệ thống.

Trong quá trình xây dựng và đối chiếu các Reference Patterns, phát hiện nhiều CSS có các vấn đề:

- CSS được đặt ở scope quá cao;
- responsibility không đúng owner;
- Component/Page/Widget-specific CSS bị đưa vào Global Design System;
- nhiều selector/class được tạo nhưng gần như không tạo giá trị;
- nhiều property ở lớp thấp hơn override property đã có ở lớp cao hơn;
- có những trường hợp khi vô hiệu toàn bộ CSS của class thì giao diện lại đúng hoặc đẹp hơn;
- CSS bị phát triển theo hướng cộng thêm override thay vì loại bỏ root cause;
- một responsibility có nhiều nơi cùng định nghĩa;
- utility class được tạo quá nhiều cho những nhu cầu rất cục bộ;
- CSS của Pattern/Reference có nguy cơ trở thành một Design System thứ hai.

Điều này tạo:

- CSS thừa;
- cascade khó kiểm soát;
- specificity conflict;
- override chain;
- ownership không rõ;
- tăng chi phí tải CSS;
- khó migration;
- khó cleanup legacy;
- khó xác định Source of Truth.

---

## 2. Mục tiêu

Chuẩn hóa toàn bộ CSS theo nguyên tắc:

> Một responsibility = một owner = một canonical source.

Mỗi CSS rule phải nằm ở phạm vi nhỏ nhất nhưng vẫn đúng với trách nhiệm thực tế của nó.

Canonical Global Design System chỉ được chứa những CSS thực sự:

- global;
- generic;
- semantic;
- domain-independent;
- platform-independent;
- reusable;
- có responsibility rõ.

Không được đưa CSS lên Global chỉ vì tiện dùng.

---

## 3. CSS ownership hierarchy

Toàn hệ thống sử dụng ownership hierarchy:

GLOBAL DESIGN SYSTEM
→ PLATFORM
→ MODULE / FEATURE
→ PAGE
→ WIDGET

Hiện tại Sub-01 chỉ đang xây:

GLOBAL DESIGN SYSTEM.

Các scope Platform / Module / Page / Widget không thuộc Global Design System.

---

## 4. Mục tiêu của đợt normalization hiện tại

Audit từng CSS file trong Canonical Design System.

Với từng file phải:

1. xác định responsibility;
2. inventory toàn bộ rule;
3. trace consumer;
4. classify ownership;
5. xác định rule đúng Global hay không;
6. chuyển rule sai owner về đúng scope;
7. loại bỏ duplicate/redundant CSS;
8. phát hiện override giữa các scope;
9. loại bỏ unnecessary override;
10. cập nhật Reference Patterns;
11. regression;
12. khóa file trước khi xử lý file tiếp theo.

Không xử lý CSS hàng loạt thiếu kiểm soát.

---

## 5. Phạm vi áp dụng trước

Giai đoạn hiện tại chỉ áp dụng normalization trên:

- Canonical Design System;
- Canonical P6 Reference Patterns;
- Sandbox/Catalog tương ứng.

Các Reference Patterns hiện tại được dùng làm môi trường integration test để xác định:

- Design System đang có gì;
- CSS nào đang sai owner;
- CSS nào đang thiếu;
- CSS nào thừa;
- CSS nào đang override lẫn nhau.

Chưa migration production Admin trong đợt này.

---

## 6. Phạm vi tiếp theo

Sau khi:

- Global Design System đã normalize;
- Reference Patterns PASS;
- CSS ownership sạch;
- regression PASS;

mới áp dụng cùng Rules + Solution này vào migration thực tế.

Thứ tự downstream:

Canonical Design System
→ Reference Patterns
→ Admin / Database / Backend migration
→ Admin regression + legacy cleanup
→ User Web migration.

---

## 7. Kết quả mong muốn

Sau normalization:

- Global CSS chỉ còn đúng Global responsibility;
- local CSS chỉ chứa đúng local responsibility;
- không có duplicate owner;
- không có override chain vô nghĩa;
- không có global utility chỉ phục vụ một vài cell/field;
- Pattern không redefine Global Design System;
- Widget không leak CSS ra ngoài;
- CSS tải theo đúng scope;
- việc disable một local class không còn vô tình làm UI đẹp hơn do loại bỏ override sai.

Mục tiêu cuối:

> CSS càng xuống scope thấp càng ít responsibility và càng chính xác với consumer thực tế.
