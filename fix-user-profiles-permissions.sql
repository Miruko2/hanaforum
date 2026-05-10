-- 修复 user_profiles 表权限问题
-- 在 Supabase SQL 编辑器中运行此脚本

-- 1. 确保 user_profiles 表启用了 RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 2. 删除所有现有策略（如果存在）
DROP POLICY IF EXISTS "Allow read access to all user profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to create their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Allow users to delete their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.user_profiles;

-- 3. 创建新的权限策略
-- 允许所有人读取用户资料（用于显示用户名）
CREATE POLICY "Enable read access for all users" ON public.user_profiles
    FOR SELECT USING (true);

-- 允许认证用户创建自己的资料
CREATE POLICY "Enable insert for authenticated users only" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的资料
CREATE POLICY "Enable update for users based on user_id" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- 允许用户删除自己的资料
CREATE POLICY "Enable delete for users based on user_id" ON public.user_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- 4. 验证权限设置
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    'RLS enabled' as status
FROM pg_tables 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 5. 显示当前策略
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles' AND schemaname = 'public';

-- 6. 测试查询权限
SELECT 
    'user_profiles permission test' as test_name,
    COUNT(*) as record_count,
    'Should be accessible now' as expected_result
FROM public.user_profiles;