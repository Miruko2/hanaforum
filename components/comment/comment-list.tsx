"use client"

import { useState, useEffect } from "react"
import { getComments } from "@/lib/supabase"
import type { Comment } from "@/lib/types"
import CommentItem from "./comment-item"
import CommentForm from "./comment-form"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface CommentListProps {
  postId: string
  onCommentAdded?: () => void
}

export default function CommentList({ postId, onCommentAdded }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  // 获取评论数据
  const fetchComments = async () => {
    try {
      setLoading(true)
      const commentsData = await getComments(postId)
      setComments(commentsData)
      setError(null)
    } catch (err) {
      console.error("获取评论失败:", err)
      setError("获取评论失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  // 初始加载评论
  useEffect(() => {
    if (postId) {
      fetchComments()
    }
  }, [postId])

  // 处理新评论添加
  const handleCommentAdded = () => {
    fetchComments()
    if (onCommentAdded) {
      onCommentAdded()
    }
  }

  // 处理登录按钮点击
  const handleLoginClick = () => {
    router.push("/login")
  }

  // 计算总评论数（包括回复）
  const countTotalComments = (comments: Comment[]): number => {
    let count = comments.length

    for (const comment of comments) {
      if (comment.replies && comment.replies.length > 0) {
        count += comment.replies.length
      }
    }

    return count
  }

  const totalComments = countTotalComments(comments)

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-white neon-text flex items-center">
        评论区
        {!loading && !error && <span className="ml-2 text-sm text-gray-400">({totalComments})</span>}
      </h3>

      {/* 评论表单 */}
      {user ? (
        <CommentForm postId={postId} onCommentAdded={handleCommentAdded} />
      ) : (
        <div className="p-4 rounded-lg bg-black/30 border border-lime-900/30">
          <p className="text-gray-400 text-sm mb-2">登录后参与评论</p>
          <Button onClick={handleLoginClick} className="bg-lime-500 hover:bg-lime-600 text-black text-sm">
            登录
          </Button>
        </div>
      )}

      {/* 评论列表 */}
      <div className="space-y-4 mt-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-lime-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-red-900/20 border border-red-900/30">
            <p className="text-red-400 text-sm">{error}</p>
            <Button
              onClick={fetchComments}
              variant="outline"
              className="mt-2 text-xs border-red-900/50 text-red-400 hover:bg-red-900/30"
            >
              重试
            </Button>
          </div>
        ) : comments.length === 0 ? (
          <div className="p-6 rounded-lg bg-black/20 border border-gray-800/30 text-center">
            <p className="text-gray-400">暂无评论，来发表第一条评论吧！</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} onCommentAdded={handleCommentAdded} />
          ))
        )}
      </div>
    </div>
  )
}
