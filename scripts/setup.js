// 这个脚本会展示需要在Supabase中执行的SQL语句

console.log(`
=== 创建评论点赞表SQL脚本 ===

请在Supabase控制台的SQL编辑器中运行以下SQL:

-- 创建评论点赞表
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 添加安全策略
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "评论点赞可被已认证用户创建" ON public.comment_likes;
DROP POLICY IF EXISTS "评论点赞可被创建者删除" ON public.comment_likes;
DROP POLICY IF EXISTS "评论点赞对所有人可见" ON public.comment_likes;

-- 创建新策略
CREATE POLICY "评论点赞可被已认证用户创建" ON public.comment_likes 
  FOR INSERT TO authenticated WITH CHECK (true);
  
CREATE POLICY "评论点赞可被创建者删除" ON public.comment_likes 
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
  
CREATE POLICY "评论点赞对所有人可见" ON public.comment_likes 
  FOR SELECT USING (true);

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
`);

console.log(`
=== 使用说明 ===
1. 登录Supabase控制台 (https://app.supabase.com)
2. 打开你的项目
3. 点击左侧菜单中的"SQL编辑器"
4. 创建新查询
5. 粘贴上面的SQL脚本
6. 执行脚本
7. 回到应用，评论点赞功能应该就能正常工作了
`); 