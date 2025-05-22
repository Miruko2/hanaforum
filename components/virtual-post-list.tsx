"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import PostCard from "./post-card"
import type { Post } from "@/lib/types"
import { Loader2 } from "lucide-react"

interface VirtualPostListProps {
  posts: Post[]
  loadMorePosts?: () => Promise<void>
  hasMore?: boolean
  loading?: boolean
}

export default function VirtualPostList({
  posts,
  loadMorePosts,
  hasMore = false,
  loading = false,
}: VirtualPostListProps) {
  const [visiblePosts, setVisiblePosts] = useState<Post[]>([])
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [itemsPerRow, setItemsPerRow] = useState(4) // 默认每行4个
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement | null>(null)

  // 根据屏幕宽度计算每行显示的帖子数量
  useEffect(() => {
    const calculateItemsPerRow = () => {
      const width = window.innerWidth
      if (width < 640) return 1 // xs
      if (width < 768) return 2 // sm
      if (width < 1024) return 3 // md
      if (width < 1280) return 3 // lg
      return 4 // xl
    }

    const handleResize = () => {
      setItemsPerRow(calculateItemsPerRow())
    }

    // 初始计算
    handleResize()

    // 监听窗口大小变化
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // 设置无限滚动
  useEffect(() => {
    // 清理之前的观察器
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // 创建新的观察器
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasMore && !loading && loadMorePosts) {
          loadMorePosts()
        }
      },
      { threshold: 0.1 },
    )

    // 观察加载更多元素
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [hasMore, loading, loadMorePosts])

  // 初始化可见帖子
  useEffect(() => {
    if (posts.length > 0) {
      // 初始显示前12个帖子或所有帖子（如果少于12个）
      const initialCount = Math.min(12, posts.length)
      setVisiblePosts(posts.slice(0, initialCount))
    }
  }, [posts])

  // 处理帖子点击
  const handlePostClick = useCallback((postId: string) => {
    setActivePostId(postId)
  }, [])

  // 处理帖子关闭
  const handlePostClose = useCallback(() => {
    setActivePostId(null)
  }, [])

  // 处理帖子更新
  const handlePostUpdated = useCallback((updatedPostId: string, updatedData: Partial<Post>) => {
    setVisiblePosts((currentPosts) =>
      currentPosts.map((post) => {
        if (post.id === updatedPostId) {
          return { ...post, ...updatedData }
        }
        return post
      }),
    )
  }, [])

  // 处理帖子删除
  const handlePostDeleted = useCallback((deletedPostId: string) => {
    setVisiblePosts((currentPosts) => currentPosts.filter((post) => post.id !== deletedPostId))
  }, [])

  // 如果没有帖子，显示空状态
  if (posts.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">🌱</div>
        <h3 className="text-xl font-semibold text-white mb-2">还没有帖子</h3>
        <p className="text-gray-400 max-w-md">成为第一个发布帖子的人！点击右下角的"+"按钮创建新帖子。</p>
      </div>
    )
  }

  return (
    <div className="relative min-h-[200px]">
      {/* 帖子网格 */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visiblePosts.map((post) => (
          <div key={post.id} className="w-full h-full">
            <PostCard
              post={post}
              isActive={activePostId === post.id}
              onClick={() => handlePostClick(post.id)}
              onClose={handlePostClose}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          </div>
        ))}
      </div>

      {/* 加载更多指示器 */}
      <div ref={loadMoreRef} className="flex justify-center items-center py-8">
        {loading && <Loader2 className="h-6 w-6 text-lime-500 animate-spin" />}
        {!loading && hasMore && <div className="h-8" />}
      </div>
    </div>
  )
}
