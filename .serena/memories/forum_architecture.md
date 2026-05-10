# 论坛项目架构

## 核心数据模型

项目使用Supabase作为后端，主要数据模型包括：

1. **帖子(Posts)**
   - 主要字段：id, user_id, title, content, image_url, likes_count, comments_count, created_at
   - 支持图片上传和显示
   - 支持置顶功能(isPinned字段)

2. **评论(Comments)**
   - 主要字段：id, user_id, post_id, content, parent_id, created_at
   - 支持嵌套回复(通过parent_id)
   - 支持点赞功能

3. **用户(Users)**
   - 使用Supabase Auth管理用户身份
   - 特殊用户：管理员(通过hardcoded ID识别)

## 组件架构

1. **帖子相关**
   - `PostCard`: 单个帖子卡片，包含帖子内容和操作按钮
   - `PostGrid`: 帖子网格容器，负责布局和分页
   - `VirtualPostList`: 虚拟滚动优化的帖子列表
   - `PostDetailModal`: 帖子详情模态框
   - `PostCardImage`: 帖子图片组件，处理图片优化和加载
   - `PostCardContent`: 帖子内容显示组件
   - `PostCardActions`: 帖子操作按钮组件

2. **评论相关**
   - `CommentList`: 评论列表容器，处理评论加载和实时订阅
   - `CommentItem`: 单个评论项，显示评论内容和回复
   - `CommentForm`: 评论输入表单

3. **状态管理**
   - `PostsProvider`: 管理所有帖子状态，包括获取、缓存、分页和实时更新
   - `SimpleAuthContext`: 简化的认证上下文，管理用户登录状态

## 关键技术特性

1. **性能优化**
   - 虚拟滚动实现(VirtualPostList)
   - 图片优化和延迟加载
   - 数据缓存策略(postCache)
   - 乐观更新UI

2. **实时功能**
   - 使用Supabase实时订阅帖子和评论更新
   - 离线状态处理和重连机制
   - 乐观更新与服务器数据同步

3. **UI体验优化**
   - 平滑动画效果(使用Framer Motion)
   - 响应式设计，适配移动和桌面
   - 加载状态和错误处理