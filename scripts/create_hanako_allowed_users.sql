-- 创建 hanako_allowed_users 表，用于存储允许与 AI 对话的用户白名单
CREATE TABLE IF NOT EXISTS hanako_allowed_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  added_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_hanako_allowed_users_user_id ON hanako_allowed_users(user_id);

-- 启用 RLS
ALTER TABLE hanako_allowed_users ENABLE ROW LEVEL SECURITY;

-- 允许 anon 和 service_role 读取（用于 API 检查）
CREATE POLICY "Allow read for all" ON hanako_allowed_users
  FOR SELECT USING (true);

-- 允许 authenticated 用户插入（管理员操作）
CREATE POLICY "Allow insert for authenticated" ON hanako_allowed_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 允许 authenticated 用户删除（管理员操作）
CREATE POLICY "Allow delete for authenticated" ON hanako_allowed_users
  FOR DELETE USING (auth.role() = 'authenticated');

-- 插入现有白名单用户
INSERT INTO hanako_allowed_users (user_id) VALUES
  ('4345c6d0-05eb-4bc3-ba50-1cfa1dee2c41'), -- miruko2
  ('e4f655b1-d2f7-43fa-ad17-8627296c148c')  -- 闲猫
ON CONFLICT (user_id) DO NOTHING;
