'use strict';

/**
 * Tên hiển thị thật của user — dùng khi tạo Comment/actor name cho Share event.
 * req.user (auth middleware) CHỈ có id/tier/roles từ JWT (không nhúng display_name để JWT gọn,
 * tier/roles đổi theo thời gian nên JWT không cache được lâu) — mọi nơi trước đây đọc thẳng
 * user.display_name đều undefined, rơi vào fallback 'Thành viên' cho TẤT CẢ mọi người, không
 * phân biệt ai với ai. Hàm này tra DB 1 lần lấy đúng tên để lưu vào bản ghi Comment (đọc lại
 * sau này không cần JOIN users nữa — đúng tinh thần Comment tự chứa user_name tại thời điểm viết).
 */
const { query } = require('../core/database/connection');

async function resolveDisplayName(userId) {
  if (!userId) return 'Thành viên';
  try {
    const res = await query(
      `SELECT display_name, nickname FROM users WHERE id = $1 LIMIT 1`,
      [userId]
    );
    const row = res.rows[0];
    if (!row) return 'Thành viên';
    return row.display_name || row.nickname || 'Thành viên';
  } catch (e) {
    return 'Thành viên';
  }
}

module.exports = { resolveDisplayName };
