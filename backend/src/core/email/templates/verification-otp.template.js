'use strict';

function buildVerificationOtpEmail({ code, displayName }) {
  const name = displayName || 'bạn';
  const subject = `${code} — Mã xác thực đăng ký iFlux`;
  const text =
    `Xin chào ${name},\n\n` +
    `Mã xác thực đăng ký iFlux của bạn là: ${code}\n\n` +
    `Mã có hiệu lực 15 phút. Không chia sẻ mã này với ai.\n\n` +
    `— iFlux`;

  const html =
    `<div style="font-family:Public Sans,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">` +
    `<h2 style="color:#696cff;margin:0 0 16px">Xác thực email iFlux</h2>` +
    `<p>Xin chào <strong>${name}</strong>,</p>` +
    `<p>Mã xác thực đăng ký của bạn:</p>` +
    `<p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#333;margin:24px 0">${code}</p>` +
    `<p style="color:#666;font-size:14px">Mã có hiệu lực <strong>15 phút</strong>. Không chia sẻ mã với ai.</p>` +
    `<hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>` +
    `<p style="color:#999;font-size:12px">Nếu bạn không đăng ký iFlux, hãy bỏ qua email này.</p>` +
    `</div>`;

  return { subject, text, html };
}

module.exports = { buildVerificationOtpEmail };
