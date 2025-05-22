"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { Reply, ThumbsUp } from "lucide-react"
import type { Comment } from "@/lib/types"

export interface CommentItemProps {
  comment: Comment
  postId: string
  onCommentAdded?: () => void
  level?: number
}

export default function CommentItem({ comment, postId, onCommentAdded, level = 0 }: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyContent, setReplyContent] = useState("")
  const { user } = useAuth()

  // 最大嵌套层级
  const MAX_NESTING_LEVEL = 3

  // 限制嵌套回复层级
  const canReply = level < MAX_NESTING_LEVEL

  // 回复处理函数
  const handleSubmitReply = async () => {
    if (!user || !replyContent.trim()) return

    try {
      // 这里应该是调用API添加回复的逻辑
      // 为了简化示例，我们假设这个函数存在
      // await addReply(postId, comment.id, user.id, replyContent)

      // 重置表单
      setReplyContent("")
      setShowReplyForm(false)

      // 通知父组件刷新评论
      if (onCommentAdded) {
        onCommentAdded()
      }
    } catch (error) {
      console.error("添加回复失败:", error)
    }
  }

  // 获取用户名首字母作为头像备用显示
  const getInitial = (username?: string) => {
    return username ? username.charAt(0).toUpperCase() : "U"
  }

  // 用户名显示逻辑
  const displayName = comment.user?.username || comment.username || "匿名用户"

  // 头像URL
  const avatarUrl = comment.user?.avatar_url || `/placeholder.svg?height=32&width=32&query=avatar`

  return (
    <div className={`p-4 rounded-lg bg-black/20 border border-gray-800/50 ${level > 0 ? "ml-6" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
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
            <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-lime-500">
              <ThumbsUp className="h-3.5 w-3.5" />
              <span>{comment.likes_count || comment.likes || 0}</span>
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
            <div className="mt-3 space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="写下你的回复..."
                className="resize-none h-20 bg-black/30 border-gray-800"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReplyForm(false)}
                  className="text-xs border-gray-700 text-gray-400 hover:bg-gray-800"
                >
                  取消
                </Button>
                <Button
                  size="sm"
                  onClick={handleSubmitReply}
                  disabled={!replyContent.trim()}
                  className="text-xs bg-lime-600 hover:bg-lime-700 text-black"
                >
                  回复
                </Button>
              </div>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
