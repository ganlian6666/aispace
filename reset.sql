-- 彻底删除表（相当于格式化），这样重建后 ID 会自动从 1 开始
DROP TABLE IF EXISTS submissions;
DROP TABLE IF EXISTS likes;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS site_status;

-- 不需要手动删 sqlite_sequence，删表后它会自动清理
