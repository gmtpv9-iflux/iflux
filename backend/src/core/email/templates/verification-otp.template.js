'use strict';

function buildVerificationOtpEmail({ code, displayName, expiryMinutes }) {
  const nameUpper = String(displayName || 'bạn').toUpperCase();
  const minutes = expiryMinutes || 15;
  const subject = '[IFLUX] MÃ XÁC MINH TÀI KHOẢN CỦA BẠN';

  /* Unicode Mathematical Sans-Bold (digit U+1D7EC…F5, chữ cái U+1D5D4…1D607) — plain text không
     có khái niệm in đậm thật, nhưng đây là ký tự Unicode THẬT KHÁC với ký tự thường (không phải
     markup/style) nên mọi nơi hiển thị text thuần — kể cả banner thông báo đẩy Gmail/iOS Mail —
     đều vẽ đậm được, vì bản thân con chữ đã "đậm" ở tầng ký tự. CHỈ áp dụng cho số và chữ cái La
     Tinh không dấu (mã OTP, chữ "iFlux"): bảng Unicode này không có chữ cái có dấu tiếng Việt —
     "Đội ngũ" phải giữ chữ thường (ghép dấu tổ hợp lên ký tự toán học rủi ro vỡ font nhiều máy). */
  function boldSans(s) {
    return String(s).replace(/[A-Za-z0-9]/g, function (c) {
      var code = c.charCodeAt(0);
      if (c >= '0' && c <= '9') return String.fromCodePoint(0x1D7EC + (code - 48));
      if (c >= 'A' && c <= 'Z') return String.fromCodePoint(0x1D5D4 + (code - 65));
      return String.fromCodePoint(0x1D5EE + (code - 97));
    });
  }

  /* Owner: đậm Sans-Bold đã lên đúng trên thông báo đẩy nhưng kích thước vẫn nhỏ — banner
     thông báo do OS/app mail tự vẽ đồng loạt cho cả dòng text thuần, không có CSS nào chỉnh
     riêng cỡ chữ 1 đoạn trong đó. Thử Unicode Fullwidth Forms (U+FF00–FFEF, dịch nguyên khối
     ASCII in được +0xFEE0) — KHÁC hẳn Sans-Bold: đây không phải "đậm" mà là ký tự thiết kế
     RỘNG GẤP ĐÔI (cỡ ô CJK) nên thường trông "to" hơn rõ rệt ở mọi font, kể cả font notification
     không có glyph riêng cho dải này (vẫn rơi về fallback nhưng fallback đó vẫn giữ chiều rộng
     full — layout engine tôn trọng độ rộng ký tự, không chỉ tôn trọng "kiểu chữ"). Áp dụng cho
     RIÊNG mã OTP (thứ Owner phàn nàn nhỏ) — chữ ký "Đội ngũ iFlux" giữ Sans-Bold như cũ. */
  function fullwidth(s) {
    return String(s).replace(/[\x21-\x7e]/g, function (c) {
      return String.fromCodePoint(c.charCodeAt(0) + 0xFEE0);
    });
  }
  var codeBold = fullwidth(code);

  /* Owner: giữ lời chào (Claude từng bỏ nhầm khi rút gọn — đã phục hồi), chỉ rút gọn phần sau.
     Mã tách dòng riêng, đậm thật bằng Unicode. */
  const text =
    `Xin chào ${nameUpper},\n\n` +
    `Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã dưới đây để hoàn tất đăng ký.\n\n` +
    `MÃ XÁC MINH\n` +
    `${codeBold}\n\n` +
    `Mã có hiệu lực trong ${minutes} phút. Không chia sẻ mã này với bất kỳ ai.\n\n` +
    `Trân trọng,\n` +
    `Đội ngũ ${boldSans('iFlux')}\n\n` +
    `Email tự động được gửi từ hệ thống iFlux. Vui lòng không trả lời email này.`;

  /* Mã trong khối HTML CŨNG dùng codeBold (Unicode), không chỉ dựa font-weight CSS: nhiều app
     mail (Gmail…) tạo preview thông báo đẩy bằng cách BÓC HTML ra text thô (mất hết CSS/thẻ),
     không ưu tiên phần text/plain riêng — nếu chỉ đậm bằng CSS ở đây, bóc ra sẽ về số thường,
     mất đậm. Dùng ký tự Unicode thật thì bóc kiểu gì mã vẫn đậm. */
  const html =
    `<div style="font-family:'Public Sans',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f2430">` +
      `<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Xin chào <strong>${nameUpper}</strong>,</p>` +
      `<p style="font-size:14px;line-height:1.6;margin:0 0 24px">Cảm ơn bạn đã đăng ký tài khoản. Vui lòng sử dụng mã dưới đây để hoàn tất đăng ký.</p>` +
      `<p style="font-size:12px;font-weight:700;letter-spacing:1px;color:#666;margin:0 0 8px">MÃ XÁC MINH</p>` +
      `<p style="font-size:44px;font-weight:700;letter-spacing:8px;color:#1f2430;background:#f5f6fa;border-radius:8px;padding:16px 0;text-align:center;margin:0 0 16px">${codeBold}</p>` +
      `<p style="font-size:13px;color:#1b3587;line-height:1.6;margin:0 0 24px">Mã có hiệu lực trong <strong>${minutes} phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>` +
      `<p style="font-size:14px;line-height:1.6;margin:0 0 32px">Trân trọng,<br/><strong>Đội ngũ iFlux</strong></p>` +
      `<hr style="border:none;border-top:1px solid #eee;margin:0 0 16px"/>` +
      `<p style="color:#999;font-size:12px;line-height:1.6;margin:0">Email tự động được gửi từ hệ thống iFlux. Vui lòng không trả lời email này.</p>` +
    `</div>`;

  return { subject, text, html };
}

module.exports = { buildVerificationOtpEmail };
