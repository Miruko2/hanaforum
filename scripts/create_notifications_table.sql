-- 创建通知表
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('like_post', 'comment_post', 'like_comment')),
  post_id UUID,
  comment_id UUID,
  actor_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- 确保类型和相关ID的组合有意义
  CONSTRAINT valid_notification_type CHECK (
    (type = 'like_post' AND post_id IS NOT NULL AND comment_id IS NULL) OR
    (type = 'comment_post' AND post_id IS NOT NULL AND comment_id IS NULL) OR
    (type = 'like_comment' AND comment_id IS NOT NULL)
  ),
  
  -- 添加外键约束
  CONSTRAINT fk_user_id FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_post_id FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_id FOREIGN KEY (comment_id) REFERENCES public.comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_actor_id FOREIGN KEY (actor_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 启用行级安全策略
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "通知只对接收者可见" ON public.notifications;
DROP POLICY IF EXISTS "通知只能由系统创建" ON public.notifications;
DROP POLICY IF EXISTS "通知只能由接收者更新" ON public.notifications;

-- 创建安全策略
CREATE POLICY "通知只对接收者可见" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "通知只能由系统创建" ON public.notifications 
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "通知只能由接收者更新" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);

-- 创建索引以提高查询效率
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON public.notifications(post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_comment_id ON public.notifications(comment_id) WHERE comment_id IS NOT NULL; 