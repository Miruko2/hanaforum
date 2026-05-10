-- 仅创建 user_profiles 表的简化脚本
-- 在 Supabase SQL 编辑器中运行此脚本

-- 创建 user_profiles 表
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

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow read access to all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to delete their own profile" ON public.user_profiles;

-- 创建新策略
CREATE POLICY "Allow read access to all user profiles" ON public.user_profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to create their own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON public.user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 添加表注释
COMMENT ON TABLE public.user_profiles IS '用户资料表，存储用户的显示名称和头像等信息';
COMMENT ON COLUMN public.user_profiles.user_id IS '关联到 auth.users 表的用户ID';
COMMENT ON COLUMN public.user_profiles.username IS '用户显示名称';
COMMENT ON COLUMN public.user_profiles.avatar_url IS '用户头像URL';

-- 验证创建结果
SELECT 
    'user_profiles' as table_name,
    '✅ 创建成功' as status,
    COUNT(*) as current_records
FROM public.user_profiles;