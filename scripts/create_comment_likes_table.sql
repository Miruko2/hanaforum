-- 首先检查表是否存在，如果不存在则创建
CREATE TABLE IF NOT EXISTS public.comment_likes (
  id UUID NOT NULL DEFAULT uuid_generate_v4() PRIMARY KEY,
  comment_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(comment_id, user_id)
);

-- 添加外键约束（如果表存在，这些语句可能会失败，可以忽略）
DO $$
BEGIN
  BEGIN
    ALTER TABLE public.comment_likes 
    ADD CONSTRAINT fk_comment_likes_comment_id 
    FOREIGN KEY (comment_id) 
    REFERENCES public.comments(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
  
  BEGIN
    ALTER TABLE public.comment_likes 
    ADD CONSTRAINT fk_comment_likes_user_id 
    FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 启用行级安全策略
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
  FOR SELECT TO anon, authenticated USING (true);

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id); 