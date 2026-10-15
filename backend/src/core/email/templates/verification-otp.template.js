'use strict';

function buildVerificationOtpEmail({ code, displayName, expiryMinutes }) {
  const name = displayName || 'bạn';
  const minutes = expiryMinutes || 15;
  const subject = '[IFLUX] MÃ XÁC MINH TÀI KHOẢN CỦA BẠN';

  const nameUpper = name.toUpperCase();

  /* Dòng đầu = "Mã xác minh của bạn: ..." (trước cả lời chào) — notification preview của mail
     client (Gmail app, iOS Mail...) lấy từ vài chữ đầu bản text này, nên mã cần lộ diện ngay
     dòng đầu. Plain text không hỗ trợ in đậm thật (giới hạn nền tảng, không phải thiếu sót) —
     đây là cách duy nhất "làm nổi" mã trong thông báo đẩy ở tầng text. Bản HTML (mở mail ra mới
     thấy) có khối mã lớn tô đậm riêng, không lặp dòng này. */
  const text =
    `Mã xác minh của bạn: ${code}\n\n` +
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
      `<p style="font-size:12px;font-weight:700;letter-spacing:1px;color:#666;margin:0 0 8px">MÃ XÁC MINH CỦA BẠN</p>` +
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
