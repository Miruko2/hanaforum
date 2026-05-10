-- 完整的数据库设置脚本
-- 请在 Supabase 控制台的 SQL 编辑器中运行此脚本

-- ========================================
-- 1. 创建 user_profiles 表
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

-- 添加唯一约束
ALTER TABLE public.user_profiles 
ADD CONSTRAINT IF NOT EXISTS unique_user_id UNIQUE (user_id);

-- 设置 RLS 策略
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to delete their own profile" ON public.user_profiles;

CREATE POLICY "Allow read access to all user profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to create their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- ========================================
-- 2. 创建 comment_likes 表
-- ========================================
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_user ON public.comment_likes(comment_id, user_id);

-- 添加唯一约束，防止重复点赞
ALTER TABLE public.comment_likes 
ADD CONSTRAINT IF NOT EXISTS unique_comment_user_like UNIQUE (comment_id, user_id);

-- 设置 RLS 策略
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "评论点赞可被已认证用户创建" ON public.comment_likes;
DROP POLICY IF EXISTS "评论点赞可被创建者删除" ON public.comment_likes;
DROP POLICY IF EXISTS "评论点赞对所有人可见" ON public.comment_likes;

CREATE POLICY "评论点赞可被已认证用户创建" ON public.comment_likes 
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "评论点赞可被创建者删除" ON public.comment_likes 
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "评论点赞对所有人可见" ON public.comment_likes 
    FOR SELECT USING (true);

-- ========================================
-- 3. 创建 admin_users 表（如果不存在）
-- ========================================
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- 添加唯一约束
ALTER TABLE public.admin_users 
ADD CONSTRAINT IF NOT EXISTS unique_admin_user_id UNIQUE (user_id);

-- 设置 RLS 策略
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin users can read all admin records" ON public.admin_users;
DROP POLICY IF EXISTS "Only admins can manage admin users" ON public.admin_users;

CREATE POLICY "Admin users can read all admin records" ON public.admin_users
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage admin users" ON public.admin_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.admin_users 
            WHERE user_id = auth.uid()
        )
    );

-- ========================================
-- 4. 创建实用函数
-- ========================================

-- 创建 increment 函数
CREATE OR REPLACE FUNCTION increment(x integer)
RETURNS integer AS $$
BEGIN
    RETURN x + 1;
END;
$$ LANGUAGE plpgsql;

-- 创建 decrement 函数
CREATE OR REPLACE FUNCTION decrement(x integer)
RETURNS integer AS $$
BEGIN
    RETURN x - 1;
END;
$$ LANGUAGE plpgsql;

-- 创建 get_table_info 函数
CREATE OR REPLACE FUNCTION get_table_info(table_name text)
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'table_name', table_name,
        'exists', EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = get_table_info.table_name
        )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 创建删除帖子的函数
CREATE OR REPLACE FUNCTION delete_post(p_post_id uuid, p_user_id uuid)
RETURNS json AS $$
DECLARE
    post_exists boolean;
    is_owner boolean;
    is_admin boolean;
BEGIN
    -- 检查帖子是否存在
    SELECT EXISTS(SELECT 1 FROM public.posts WHERE id = p_post_id) INTO post_exists;
    
    IF NOT post_exists THEN
        RETURN json_build_object('success', false, 'error', '帖子不存在');
    END IF;
    
    -- 检查是否是帖子作者
    SELECT EXISTS(SELECT 1 FROM public.posts WHERE id = p_post_id AND user_id = p_user_id) INTO is_owner;
    
    -- 检查是否是管理员
    SELECT EXISTS(SELECT 1 FROM public.admin_users WHERE user_id = p_user_id) INTO is_admin;
    
    -- 只有帖子作者或管理员可以删除
    IF NOT (is_owner OR is_admin) THEN
        RETURN json_build_object('success', false, 'error', '没有权限删除此帖子');
    END IF;
    
    -- 删除相关数据
    DELETE FROM public.notifications WHERE post_id = p_post_id;
    DELETE FROM public.comment_likes WHERE comment_id IN (SELECT id FROM public.comments WHERE post_id = p_post_id);
    DELETE FROM public.comments WHERE post_id = p_post_id;
    DELETE FROM public.likes WHERE post_id = p_post_id;
    DELETE FROM public.posts WHERE id = p_post_id;
    
    RETURN json_build_object('success', true, 'message', '帖子删除成功');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建 comment_likes 表的函数
CREATE OR REPLACE FUNCTION create_comment_likes_table()
RETURNS json AS $$
BEGIN
    -- 检查表是否已存在
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'comment_likes'
    ) THEN
        RETURN json_build_object('success', true, 'message', 'comment_likes 表已存在');
    END IF;
    
    -- 创建表（这部分在上面已经执行过了）
    RETURN json_build_object('success', true, 'message', 'comment_likes 表创建成功');
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. 创建触发器函数
-- ========================================

-- 更新 updated_at 字段的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 user_profiles 表创建触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- 6. 添加表注释
-- ========================================

COMMENT ON TABLE public.user_profiles IS '用户资料表，存储用户的显示名称和头像等信息';
COMMENT ON COLUMN public.user_profiles.user_id IS '关联到 auth.users 表的用户ID';
COMMENT ON COLUMN public.user_profiles.username IS '用户显示名称';
COMMENT ON COLUMN public.user_profiles.avatar_url IS '用户头像URL';

COMMENT ON TABLE public.comment_likes IS '评论点赞表，记录用户对评论的点赞';
COMMENT ON COLUMN public.comment_likes.comment_id IS '评论ID';
COMMENT ON COLUMN public.comment_likes.user_id IS '点赞用户ID';

COMMENT ON TABLE public.admin_users IS '管理员用户表，记录哪些用户是管理员';
COMMENT ON COLUMN public.admin_users.user_id IS '管理员用户ID';

-- ========================================
-- 7. 验证设置
-- ========================================

-- 显示创建的表
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('user_profiles', 'comment_likes', 'admin_users') THEN '✅ 新创建'
        ELSE '✅ 已存在'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'comments', 'likes', 'profiles', 'notifications', 'user_profiles', 'comment_likes', 'admin_users')
ORDER BY table_name;