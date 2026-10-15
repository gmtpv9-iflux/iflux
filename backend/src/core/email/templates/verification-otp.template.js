'use strict';

function buildVerificationOtpEmail({ code, displayName, expiryMinutes }) {
  const name = displayName || 'bạn';
  const minutes = expiryMinutes || 15;
  const subject = '[IFLUX] MÃ XÁC MINH TÀI KHOẢN CỦA BẠN';

  const nameUpper = name.toUpperCase();

  /* Unicode Mathematical Bold digits (U+1D7CE…1D7D7) — plain text không có khái niệm in đậm
     thật, nhưng đây là ký tự Unicode THẬT KHÁC với chữ số thường (không phải markup/style) nên
     mọi nơi hiển thị text thuần — kể cả banner thông báo đẩy Gmail/iOS Mail — đều vẽ đậm được,
     vì bản thân con chữ đã "đậm" ở tầng ký tự. Chỉ áp dụng cho CHỮ SỐ: bảng Unicode này không có
     chữ cái có dấu tiếng Việt (Ã, Á…) — nếu cố "đậm hoá" cả nhãn "MÃ XÁC MINH" sẽ phải bỏ dấu
     hoặc ghép ký tự tổ hợp, rủi ro vỡ font trên nhiều điện thoại — nên nhãn giữ chữ thường, chỉ
     mã số (thứ cần nổi bật nhất) được đậm thật. */
  var BOLD_DIGITS = ['𝟎', '𝟏', '𝟐', '𝟑', '𝟒', '𝟓', '𝟔', '𝟕', '𝟖', '𝟗'];
  var codeBold = String(code).replace(/[0-9]/g, function (d) { return BOLD_DIGITS[Number(d)]; });

  /* Dòng đầu = "MÃ XÁC MINH: ..." (trước cả lời chào, tự xuống dòng riêng) — notification
     preview của mail client (Gmail app, iOS Mail...) lấy từ vài chữ đầu bản text này, nên mã
     cần lộ diện ngay dòng đầu, tách dòng rõ. Bản HTML (mở mail ra mới thấy) có khối mã lớn tô
     đậm riêng, không lặp dòng này. */
  const text =
    `MÃ XÁC MINH: ${codeBold}\n\n` +
    `Xin chào ${nameUpper},\n\n` +
    `Cảm ơn bạn đã đăng ký tài khoản iFlux. Vui lòng sử dụng mã xác minh bên dưới để hoàn tất quá trình đăng ký.\n\n` +
    `Mã có hiệu lực trong ${minutes} phút.\n\n` +
    `Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email. Không chia sẻ mã xác minh này với bất kỳ ai.\n\n` +
    `Trân trọng,\n` +
    `Đội ngũ iFlux\n\n` +
    `Email tự động được gửi từ hệ thống iFlux. Vui lòng không trả lời email này.`;

  const html =
    `<div style="font-family:'Public Sans',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f2430">` +
      `<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Xin chào <strong>${nameUpper}</strong>,</p>` +
      `<p style="font-size:14px;line-height:1.6;margin:0 0 24px">Cảm ơn bạn đã đăng ký tài khoản iFlux. Vui lòng sử dụng mã xác minh bên dưới để hoàn tất quá trình đăng ký.</p>` +
      `<p style="font-size:12px;font-weight:700;letter-spacing:1px;color:#666;margin:0 0 8px">MÃ XÁC MINH</p>` +
      `<p style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1f2430;background:#f5f6fa;border-radius:8px;padding:16px 0;text-align:center;margin:0 0 16px">${code}</p>` +
      `<p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 24px">Mã có hiệu lực trong <strong>${minutes} phút</strong>.</p>` +
      `<p style="font-size:13px;color:#666;line-height:1.6;margin:0 0 24px">Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email. Không chia sẻ mã xác minh này với bất kỳ ai.</p>` +
      `<p style="font-size:14px;line-height:1.6;margin:0 0 32px">Trân trọng,<br/>Đội ngũ iFlux</p>` +
      `<hr style="border:none;border-top:1px solid #eee;margin:0 0 16px"/>` +
      `<p style="color:#999;font-size:12px;line-height:1.6;margin:0">Email tự động được gửi từ hệ thống iFlux. Vui lòng không trả lời email này.</p>` +
    `</div>`;

  return { subject, text, html };
}

module.exports = { buildVerificationOtpEmail };
