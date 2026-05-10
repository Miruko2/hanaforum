"use client"

import React, { lazy, Suspense } from 'react'

// 性能仪表盘的懒加载实现
const PerformanceDashboardLazy = lazy(() => 
  import('@/components/performance-dashboard').then(mod => ({
    default: mod.default
  }))
)

// 评论表单的懒加载实现
const CommentFormLazy = lazy(() => 
  import('@/components/comment/comment-form').then(mod => ({
    default: mod.default
  }))
)

// 创建帖子模态框的懒加载实现
const CreatePostModalLazy = lazy(() => 
  import('@/components/create-post-modal').then(mod => ({
    default: mod.default
  }))
)

// 性能仪表盘的包装组件
export function PerformanceDashboard(props: React.ComponentProps<typeof PerformanceDashboardLazy>) {
  return (
    <Suspense fallback={null}>
      <PerformanceDashboardLazy {...props} />
    </Suspense>
  )
}

// 评论表单的包装组件
export function CommentForm(props: React.ComponentProps<typeof CommentFormLazy>) {
  return (
    <Suspense fallback={<div className="animate-pulse bg-gray-800/50 h-20 rounded-md"></div>}>
      <CommentFormLazy {...props} />
    </Suspense>
  )
}

// 创建帖子模态框的包装组件
export function CreatePostModal(props: React.ComponentProps<typeof CreatePostModalLazy>) {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />
      <div className="relative animate-pulse bg-gray-800/50 w-full max-w-md h-64 rounded-xl"></div>
    </div>}>
      <CreatePostModalLazy {...props} />
    </Suspense>
  )
} 