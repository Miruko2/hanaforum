"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { formatDate, cn } from "@/lib/utils"
import { useSimpleAuth } from "@/contexts/auth-context-simple"
import { Reply, MoreVertical, ThumbsUp } from "lucide-react"
import type { Comment } from "@/lib/types"
import CommentForm from "./comment-form"
import { checkCommentLiked, likeComment, unlikeComment, getCommentLikesCount } from "@/lib/supabase"
import { supabase } from "@/lib/supabaseClient"

export interface CommentItemProps {
  comment: Comment
  postId: string
  onCommentAdded?: (comment: Comment | null) => void
  level?: number
  isOptimistic?: boolean
  isPinned?: boolean  // 是否是置顶帖子
  isAdmin?: boolean   // 当前用户是否是管理员
}

export default function CommentItem({ 
  comment, 
  postId, 
  onCommentAdded, 
  level = 0, 
  isOptimistic = false,
  isPinned = false,
  isAdmin = false
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(comment.likes_count || comment.likes || 0)
  const [isLiking, setIsLiking] = useState(false)
  const { user } = useSimpleAuth()

  // 最大嵌套层级
  const MAX_NESTING_LEVEL = 3

  // 限制嵌套回复层级并检查置顶帖子权限
  const canReply = level < MAX_NESTING_LEVEL && (!isPinned || isAdmin)

  // 获取用户名首字母作为头像备用显示
  const getInitial = (username?: string) => {
    return username ? username.charAt(0).toUpperCase() : "U"
  }

  // 用户名显示逻辑
  const displayName = comment.user?.username || comment.username || "匿名用户"

  // 头像URL
  const avatarUrl = comment.user?.avatar_url || `/placeholder.svg?height=32&width=32&query=avatar`

  // 检查用户是否已点赞该评论
  useEffect(() => {
    if (!user || isOptimistic) return

    const checkLikeStatus = async () => {
      try {
        const liked = await checkCommentLiked(comment.id, user.id)
        setIsLiked(!!liked)
      } catch (err) {
        console.error("获取点赞状态失败:", err)
      }
    }

    checkLikeStatus()
  }, [comment.id, user, isOptimistic])

  // 获取最新的点赞数
  useEffect(() => {
    if (isOptimistic) return
    
    const fetchLikesCount = async () => {
      try {
        const count = await getCommentLikesCount(comment.id)
        setLikesCount(count)
      } catch (err) {
        console.error("获取评论点赞数失败:", err)
      }
    }
    
    fetchLikesCount()
    
    // 创建实时订阅
    const channel = supabase
      .channel(`comment-likes-${comment.id}`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'comment_likes',
          filter: `comment_id=eq.${comment.id}` 
        }, 
        async () => {
          // 当有点赞变化时，重新获取点赞数
          fetchLikesCount()
        })
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [comment.id])

  // 处理评论点赞/取消点赞
  const handleLikeToggle = async () => {
    if (!user) {
      alert("请先登录后再点赞")
      return
    }

    if (isLiking || isOptimistic) return
    
    try {
      setIsLiking(true)
      
      // 立即更新UI状态，提升响应速度
      const newLikeStatus = !isLiked
      setIsLiked(newLikeStatus)
      setLikesCount(prev => newLikeStatus ? prev + 1 : Math.max(0, prev - 1))
      
      // 同步到数据库
      if (newLikeStatus) {
        await likeComment(comment.id, user.id)
      } else {
        await unlikeComment(comment.id, user.id)
      }
      
      // 更新成功后，重新获取最新点赞数（可选）
      const updatedCount = await getCommentLikesCount(comment.id)
      setLikesCount(updatedCount)
      
    } catch (err) {
      console.error("处理评论点赞失败:", err)
      // 发生错误时恢复原状态
      setIsLiked(!isLiked)
      setLikesCount(prev => !isLiked ? prev + 1 : Math.max(0, prev - 1))
    } finally {
      setIsLiking(false)
    }
  }

  return (
    <div className={`p-4 rounded-lg bg-black/20 border border-gray-800/50 ${level > 0 ? "ml-6" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 avatar-hover-effect">
          <AvatarImage src={avatarUrl || "/placeholder.svg"} />
          <AvatarFallback>{getInitial(displayName)}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-200">{displayName}</span>
            <span className="text-xs text-gray-500">{formatDate(comment.created_at)}</span>
          </div>

          <p className="mt-2 text-gray-300">{comment.content}</p>

          <div className="mt-2 flex items-center gap-4">
            <button 
              className={`flex items-center gap-1 text-xs ${isLiked ? 'text-lime-500' : 'text-gray-500 hover:text-lime-500'}`}
              onClick={handleLikeToggle}
              disabled={isLiking || !user || isOptimistic}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{likesCount}</span>
            </button>

            {canReply && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-lime-500"
              >
                <Reply className="h-3.5 w-3.5" />
                <span>回复</span>
              </button>
            )}
          </div>

          {/* 回复表单 */}
          {showReplyForm && (
            <div className="mt-3">
              <CommentForm
                postId={postId}
                parentId={comment.id}
                isReply
                replyingTo={displayName}
                onCommentAdded={(newReply) => {
                  setShowReplyForm(false)
                  if (onCommentAdded) onCommentAdded(newReply)
                }}
                onCancel={() => setShowReplyForm(false)}
                isPinned={isPinned}
                isAdmin={isAdmin}
              />
            </div>
          )}

          {/* 渲染子评论/回复 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  postId={postId}
                  onCommentAdded={onCommentAdded}
                  level={level + 1}
                  isPinned={isPinned}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
