'use strict';

function buildVerificationOtpEmail({ code, displayName, expiryMinutes }) {
  const name = displayName || 'bạn';
  const minutes = expiryMinutes || 15;
  const subject = '[IFLUX] MÃ XÁC MINH TÀI KHOẢN CỦA BẠN';

  const text =
    `Xác minh tài khoản iFlux\n\n` +
    `Xin chào ${name},\n\n` +
    `Cảm ơn bạn đã đăng ký tài khoản iFlux. Vui lòng sử dụng mã xác minh bên dưới để hoàn tất quá trình đăng ký.\n\n` +
    `Mã xác minh của bạn: ${code}\n\n` +
    `Mã có hiệu lực trong ${minutes} phút.\n\n` +
    `Nếu bạn không thực hiện yêu cầu đăng ký này, vui lòng bỏ qua email. Không chia sẻ mã xác minh này với bất kỳ ai.\n\n` +
    `Trân trọng,\n` +
    `Đội ngũ iFlux\n\n` +
    `Email tự động được gửi từ hệ thống iFlux. Vui lòng không trả lời email này.`;

  const html =
    `<div style="font-family:'Public Sans',Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#1f2430">` +
      `<p style="font-size:20px;font-weight:700;color:#696cff;margin:0 0 24px">iFlux</p>` +
      `<h1 style="font-size:20px;font-weight:700;color:#1f2430;margin:0 0 16px">Xác minh tài khoản iFlux</h1>` +
      `<p style="font-size:14px;line-height:1.6;margin:0 0 12px">Xin chào <strong>${name}</strong>,</p>` +
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
