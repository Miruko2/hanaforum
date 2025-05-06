"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { ThumbsUp, MessageSquare, X } from "lucide-react"
import type { Post } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"

interface PostCardProps {
  post: Post
  isActive: boolean
  onClick: () => void
  onClose: () => void
}

export default function PostCard({ post, isActive, onClick, onClose }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [isMounted, setIsMounted] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // 客户端挂载检查
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setLiked(!liked)
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1))
  }

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Implement comment functionality
  }

  // 处理卡片点击
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isActive) {
      onClick()
    }
  }

  // 渲染正常卡片
  const renderCard = () => (
    <div
      ref={cardRef}
      className={cn("break-inside-avoid mb-4 group", isHovered && "z-10")}
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "w-full overflow-hidden rounded-xl glass-card neon-border",
          isHovered && "scale-[1.02] transition-transform duration-300",
        )}
      >
        <div className="relative w-full bg-gray-800/60 image-glow" style={{ paddingTop: `${post.imageRatio * 100}%` }}>
          <div className="absolute inset-0 flex items-center justify-center text-lime-400 text-4xl group-hover:text-lime-300 transition-colors duration-300">
            {post.imageContent || "+"}
          </div>
        </div>

        <div className="p-4 frosted-glass">
          <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-lime-50 transition-colors duration-300">
            {post.title}
          </h3>

          <div className="flex justify-between items-center mb-3">
            <span className="text-lime-500 text-sm font-medium group-hover:text-lime-400 transition-colors duration-300">
              {post.category}
            </span>

            <div className="flex items-center space-x-3 text-gray-400 text-sm">
              <button
                className={cn(
                  "flex items-center space-x-1 transition-colors duration-300",
                  liked ? "text-lime-500" : "hover:text-lime-400",
                )}
                onClick={handleLike}
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{likeCount}</span>
              </button>

              <button
                className="flex items-center space-x-1 hover:text-lime-400 transition-colors duration-300"
                onClick={handleComment}
              >
                <MessageSquare className="h-4 w-4" />
                <span>{post.comments}</span>
              </button>
            </div>
          </div>

          <p className="text-gray-300 text-sm line-clamp-2 group-hover:text-gray-200 transition-colors duration-300">
            {post.description}
          </p>
        </div>
      </div>
    </div>
  )

  // 渲染激活状态的卡片
  const renderActiveCard = () => {
    if (!isMounted) return null

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        <div
          className="relative max-w-2xl w-full max-h-[80vh] overflow-y-auto m-4 rounded-xl glass-card active content-glass animate-in fade-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 hover:text-lime-400 transition-colors duration-300"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="relative w-full bg-gray-800/80 image-glow"
            style={{ paddingTop: `${post.imageRatio * 100}%` }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-lime-400 text-5xl">
              {post.imageContent || "+"}
            </div>
          </div>

          <div className="p-5 frosted-glass">
            <h3 className="text-xl font-semibold text-white mb-3 neon-text">{post.title}</h3>

            <div className="flex justify-between items-center mb-4">
              <span className="text-lime-400 text-sm font-medium px-3 py-1 rounded-full bg-lime-950/50 border border-lime-800/50">
                {post.category}
              </span>

              <div className="flex items-center space-x-4 text-gray-300 text-sm">
                <button
                  className={cn(
                    "flex items-center space-x-1.5 transition-colors duration-300 px-2 py-1 rounded-full",
                    liked ? "text-lime-400 bg-lime-950/30" : "hover:text-lime-400",
                  )}
                  onClick={handleLike}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>{likeCount}</span>
                </button>

                <button
                  className="flex items-center space-x-1.5 hover:text-lime-400 transition-colors duration-300 px-2 py-1 rounded-full hover:bg-lime-950/30"
                  onClick={handleComment}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>{post.comments}</span>
                </button>
              </div>
            </div>

            <p className="text-gray-200 text-sm leading-relaxed">{post.description}</p>
          </div>
        </div>
      </div>,
      document.body,
    )
  }

  return (
    <>
      {renderCard()}
      {isActive && renderActiveCard()}
    </>
  )
}
