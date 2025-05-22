"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Send, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { addComment } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface CommentFormProps {
  postId: string
  parentId?: string
  onCommentAdded: () => void
  onCancel?: () => void
  isReply?: boolean
  replyingTo?: string
}

export default function CommentForm({
  postId,
  parentId,
  onCommentAdded,
  onCancel,
  isReply = false,
  replyingTo,
}: CommentFormProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  // 处理评论提交 - 使用useCallback优化，添加乐观更新
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!user) {
        toast({
          title: "请先登录",
          description: "发表评论前请先登录账号",
          variant: "destructive",
        })
        return
      }

      if (!content.trim()) {
        toast({
          title: "评论内容不能为空",
          variant: "destructive",
        })
        return
      }

      try {
        setIsSubmitting(true)

        // 保存评论内容的副本，然后立即清空输入框
        const commentContent = content
        setContent("")

        // 立即通知父组件评论已添加，实现乐观更新
        onCommentAdded()

        // 如果是回复模式，调用取消回复
        if (isReply && onCancel) {
          onCancel()
        }

        // 显示成功消息
        toast({
          title: isReply ? "回复成功" : "评论成功",
          description: isReply ? "您的回复已发布" : "您的评论已发布",
        })

        // 后台执行实际的API调用
        await addComment(postId, user.id, commentContent, parentId)
      } catch (error: any) {
        console.error(isReply ? "发表回复失败:" : "发表评论失败:", error)
        toast({
          title: isReply ? "回复失败" : "评论失败",
          description: error.message || "发表时出现错误，请稍后重试",
          variant: "destructive",
        })
      } finally {
        setIsSubmitting(false)
      }
    },
    [user, content, postId, parentId, isReply, onCommentAdded, onCancel, toast],
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {isReply && replyingTo && (
        <div className="flex items-center text-xs text-lime-400 mb-1">
          <span>回复给 {replyingTo}</span>
        </div>
      )}

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={isReply ? `回复 ${replyingTo || ""}...` : "写下你的评论..."}
        className="min-h-[80px] bg-black/30 border-gray-800 focus:border-lime-500/50 text-white focus:ring-lime-500/30 resize-none"
        disabled={isSubmitting}
      />

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
            disabled={isSubmitting}
          >
            取消
          </Button>
        )}

        <Button
          type="submit"
          size="sm"
          className="bg-lime-500 hover:bg-lime-600 text-black"
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              发送中...
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 mr-1" />
              {isReply ? "回复" : "发表评论"}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
