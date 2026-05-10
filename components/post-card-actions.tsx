"use client"

import { useCallback, memo } from "react"
import { MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import LikeButton from "./ui/like-button"

interface PostCardActionsProps {
  liked: boolean
  likeCount: number
  commentsCount: number
  isLiking: boolean
  onLike: (e: React.MouseEvent) => void
  onComment: (e: React.MouseEvent) => void
}

// 使用memo包装组件减少不必要的重渲染
const PostCardActions = memo(function PostCardActions({
  liked,
  likeCount,
  commentsCount,
  isLiking,
  onLike,
  onComment
}: PostCardActionsProps) {
  // 优化点击处理函数，使用passive触摸事件
  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    
    // 防止快速连点触发多次
    if (isLiking) return
    
    // 添加触觉反馈（如果设备支持）
    if (window.navigator && 'vibrate' in window.navigator) {
      try {
        navigator.vibrate(10) // 非常短的触觉反馈
      } catch (e) {
        // 忽略错误
      }
    }
    
    onLike(e)
  }, [onLike, isLiking])

  const handleCommentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onComment(e)
  }, [onComment])

  return (
    <div className="flex items-center gap-2 ml-2">
      <LikeButton
        liked={liked}
        count={likeCount}
        isLoading={isLiking}
        onClick={handleLikeClick}
        size="sm"
        className="py-1 px-2"
      />

      <button 
        className="flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-black/20 backdrop-blur-sm border border-white/10 text-white/80 hover:bg-white/10 transition-all" 
        onClick={handleCommentClick}
        aria-label="查看评论"
      >
        <MessageSquare className="h-3 w-3" />
        <span>{commentsCount}</span>
      </button>
    </div>
  )
})

// 添加显示名称以便于调试
PostCardActions.displayName = 'PostCardActions'

export default PostCardActions 