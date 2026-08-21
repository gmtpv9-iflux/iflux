'use strict';

const { getPool, query } = require('../../core/database/connection');
const mediaImport = require('./media-import.service');

/**
 * Quét các bài viết có trạng thái media là PENDING hoặc FAILED (dưới mức tối đa tối đa)
 * để tự động kích hoạt tiến trình tải và tối ưu hóa hình ảnh.
 */
async function runAutoImportWorker(config) {
  if (config.MEDIA_IMPORT_AUTO_ENABLED === false) {
    return;
  }

  const client = await getPool().connect();
  let lockedIds = [];

  try {
    await client.query('BEGIN');

    // 1. Quét tìm bài viết thỏa mãn: PENDING, FAILED (chưa quá 3 lần), hoặc PROCESSING bị kẹt > 15 phút
    const res = await client.query(
      `SELECT id FROM news_posts
       WHERE media_status = 'PENDING'
          OR (media_status = 'FAILED' AND media_retry_count < $1)
          OR (media_status = 'PROCESSING' AND updated_at < NOW() - INTERVAL '15 minutes')
       LIMIT $2
       FOR UPDATE SKIP LOCKED`,
      [config.MEDIA_IMPORT_MAX_RETRY || 3, config.MEDIA_IMPORT_BATCH_SIZE || 5]
    );

    if (res.rows && res.rows.length) {
      lockedIds = res.rows.map(r => r.id);

      // 2. Chuyển trạng thái sang PROCESSING để xác nhận nhận việc
      await client.query(
        `UPDATE news_posts 
         SET media_status = 'PROCESSING', updated_at = NOW() 
         WHERE id = ANY($1::varchar[])`,
        [lockedIds]
      );
    }

    // Commit transaction ngay lập tức để giải phóng Row Lock,
    // tránh giữ DB lock quá lâu trong thời gian tải ảnh qua HTTP bên ngoài.
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    client.release();
    throw err;
  }

  client.release();

  // 3. Xử lý tải ảnh ngoài giao dịch cơ sở dữ liệu chính
  for (let i = 0; i < lockedIds.length; i++) {
    const articleId = lockedIds[i];
    try {
      // Gọi trực tiếp bộ máy xử lý ảnh hiện hữu (Single Source of Truth)
      await mediaImport.importArticle(config, articleId, { admin_id: 'system_auto' });

      // Đánh dấu hoàn tất khi bài viết đã được nội địa hóa ảnh sạch sẽ 100%
      await query(
        `UPDATE news_posts 
         SET media_status = 'COMPLETED', media_last_error = NULL, updated_at = NOW() 
         WHERE id = $1`,
        [articleId]
      );
    } catch (err) {
      // Tăng số lần thử lại và lưu vết lỗi phục vụ theo dõi
      await query(
        `UPDATE news_posts 
         SET media_status = 'FAILED', 
             media_retry_count = media_retry_count + 1, 
             media_last_error = $2,
             updated_at = NOW() 
         WHERE id = $1`,
        [articleId, (err && err.message) || 'Unknown import error']
      );
    }
  }
}

module.exports = { runAutoImportWorker };
