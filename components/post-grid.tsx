"use client"

import { useState, useEffect } from "react"
import PostCard from "./post-card"
import type { Post } from "@/lib/types"
import { subscribeToPostsUpdates } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

export default function PostGrid() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    setLoading(true)

    // 使用实时订阅替代单次加载
    const unsubscribe = subscribeToPostsUpdates((fetchedPosts) => {
      setPosts(fetchedPosts)
      setLoading(false)
    })

    // 清理函数
    return () => {
      unsubscribe()
    }
  }, [])

  const handlePostClick = (postId: string) => {
    setActivePostId(postId)
  }

  const handleClosePost = () => {
    setActivePostId(null)
  }

  const handlePostUpdated = (postId: string, updates: Partial<Post>) => {
    setPosts((prevPosts) => prevPosts.map((post) => (post.id === postId ? { ...post, ...updates } : post)))
  }

  const handlePostDeleted = (postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-12 w-12 text-lime-500 animate-spin" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-4">
        <div className="text-4xl mb-4">🌱</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">暂无帖子</h3>
        <p className="text-gray-500">成为第一个发帖的用户吧！</p>
      </div>
    )
  }

  // 将帖子分为左右两列
  const leftPosts = posts.filter((_, index) => index % 2 === 0)
  const rightPosts = posts.filter((_, index) => index % 2 === 1)

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: "12px",
        padding: "12px",
        width: "100%",
      }}
    >
      <div>
        {leftPosts.map((post) => (
          <div key={post.id} style={{ marginBottom: "12px" }}>
            <PostCard
              post={post}
              isActive={activePostId === post.id}
              onClick={() => handlePostClick(post.id)}
              onClose={handleClosePost}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          </div>
        ))}
      </div>
      <div>
        {rightPosts.map((post) => (
          <div key={post.id} style={{ marginBottom: "12px" }}>
            <PostCard
              post={post}
              isActive={activePostId === post.id}
              onClick={() => handlePostClick(post.id)}
              onClose={handleClosePost}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
