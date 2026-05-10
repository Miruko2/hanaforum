# 项目概述

这是一个基于Next.js 13的现代论坛/社交平台项目，使用App Router模式构建。项目结合了Web和移动应用功能，包括Capacitor用于Android端部署。

## 主要技术栈

- **前端框架**: Next.js 14
- **UI组件**: 使用Radix UI基础组件和自定义Tailwind CSS样式
- **样式**: Tailwind CSS
- **状态管理**: React Context (见`contexts/posts-context.tsx`等)
- **动画**: Framer Motion
- **后端/数据**: Supabase (身份验证和数据存储)
- **移动适配**: Capacitor (Android)
- **其他库**: 
  - next-themes (暗色/亮色模式)
  - react-virtualized/react-window (虚拟滚动)
  - lucide-react (图标)

## 项目结构

项目使用标准的Next.js App Router结构:

- `/app/` - 页面路由和布局
- `/components/` - UI组件
- `/contexts/` - 上下文提供者
- `/lib/` - 工具函数和API调用
- `/public/` - 静态资源
- `/styles/` - 全局样式
- `/android/` - Android应用配置

## 主要功能

1. **帖子系统**:
   - 帖子列表和详情视图
   - 支持图片帖子
   - 置顶帖子功能
   - 虚拟滚动优化

2. **评论系统**:
   - 实时评论更新
   - 评论点赞
   - 乐观更新UI

3. **用户系统**:
   - 简单的登录/注册
   - 用户身份验证
   - 权限管理(管理员功能)

4. **移动应用**:
   - 使用Capacitor适配Android
   - 响应式设计

5. **性能优化**:
   - 图片优化
   - 数据缓存
   - 虚拟列表优化