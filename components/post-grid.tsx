"use client"

import { useState, useEffect, useRef } from "react"
import PostCard from "@/components/post-card"
import { generateMockPosts } from "@/lib/mock-data"
import type { Post } from "@/lib/types"

export default function PostGrid() {
  const [posts, setPosts] = useState<Post[]>([])
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const previousOverflow = useRef<string>("")

  useEffect(() => {
    // Generate mock posts
    setPosts(generateMockPosts(24))
  }, [])

  // 处理帖子点击
  const handlePostClick = (postId: string) => {
    setActivePostId(postId)
    // 保存当前overflow值并锁定背景滚动
    previousOverflow.current = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none" // 防止移动端滚动
  }

  // 处理帖子关闭
  const handlePostClose = () => {
    setActivePostId(null)
    // 恢复背景滚动
    document.body.style.overflow = previousOverflow.current
    document.body.style.touchAction = ""
  }

  // 监听ESC键关闭帖子
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activePostId) {
        handlePostClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      // 确保在组件卸载时恢复滚动
      if (activePostId) {
        document.body.style.overflow = ""
        document.body.style.touchAction = ""
      }
    }
  }, [activePostId])

  return (
    <div
      className={`p-4 max-w-7xl mx-auto min-h-[calc(100vh-56px)] content-glass rounded-xl ${
        activePostId ? "active-content" : ""
      }`}
    >
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isActive={post.id === activePostId}
            onClick={() => handlePostClick(post.id)}
            onClose={handlePostClose}
          />
        ))}
      </div>
    </div>
  )
}
