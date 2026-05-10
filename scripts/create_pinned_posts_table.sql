-- 创建置顶帖子元数据表
CREATE TABLE IF NOT EXISTS public.pinned_posts (
  post_id UUID PRIMARY KEY REFERENCES public.posts(id) ON DELETE CASCADE,
  pinned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  pinned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 添加安全策略
ALTER TABLE public.pinned_posts ENABLE ROW LEVEL SECURITY;

-- 只有管理员可以管理置顶帖子（添加/删除）
CREATE POLICY "管理员可管理置顶帖子" ON public.pinned_posts
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users
      WHERE user_id = auth.uid()
    )
  );

-- 所有人可以查看置顶帖子信息
CREATE POLICY "所有人可查看置顶帖子" ON public.pinned_posts
  FOR SELECT USING (true);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_pinned_posts_pinned_at ON public.pinned_posts(pinned_at DESC);

-- 添加评论
COMMENT ON TABLE public.pinned_posts IS '存储置顶帖子元数据，避免修改原始posts表结构';
COMMENT ON COLUMN public.pinned_posts.post_id IS '被置顶的帖子ID';
COMMENT ON COLUMN public.pinned_posts.pinned_at IS '置顶时间';
COMMENT ON COLUMN public.pinned_posts.pinned_by IS '执行置顶操作的管理员ID'; 