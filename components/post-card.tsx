"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { ThumbsUp, MessageSquare, X, Trash2, MoreVertical, AlertCircle, Shield, ImageOff, Clock } from "lucide-react"
import type { Post } from "@/lib/types"
import { cn } from "@/lib/utils"
import { createPortal } from "react-dom"
import { likePost, unlikePost, checkUserLiked } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import CommentList from "./comment/comment-list"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

interface PostCardProps {
  post: Post
  isActive: boolean
  onClick: () => void
  onClose: () => void
  onPostUpdated: (postId: string, updates: Partial<Post>) => void
  onPostDeleted?: (postId: string) => void
}

export default function PostCard({ post, isActive, onClick, onClose, onPostUpdated, onPostDeleted }: PostCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count)
  const [isMounted, setIsMounted] = useState(false)
  const [isLiking, setIsLiking] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageRatio, setImageRatio] = useState(16 / 9) // 默认宽高比
  const [retryCount, setRetryCount] = useState(0)
  const [isNewPost, setIsNewPost] = useState(false)
  const [username, setUsername] = useState<string | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()
  const { toast } = useToast()
  const imageRetryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 硬编码管理员ID，确保管理员功能正常工作
  const adminId = "4345c6d0-05eb-4bc3-ba50-1cfa1dee2c41" // 您的用户ID

  // 使用useMemo优化计算属性
  const isAuthor = useMemo(() => user && post.user_id === user.id, [user, post.user_id])
  const isAdmin = useMemo(() => user && user.id === adminId, [user, adminId])
  const canDelete = useMemo(() => user && (isAuthor || isAdmin), [user, isAuthor, isAdmin])

  // 格式化日期 - 使用useMemo缓存结果
  const formattedDate = useMemo(() => {
    return post.created_at ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: zhCN }) : ""
  }, [post.created_at])

  // 判断是否为横向图片 - 使用useMemo缓存结果
  const isLandscape = useMemo(() => imageRatio > 1.2, [imageRatio])

  // 客户端挂载检查
  useEffect(() => {
    setIsMounted(true)

    // 检查是否是新发布的帖子（5分钟内）
    if (post.created_at) {
      const postTime = new Date(post.created_at).getTime()
      const now = new Date().getTime()
      const fiveMinutesInMs = 5 * 60 * 1000
      setIsNewPost(now - postTime < fiveMinutesInMs)
    }

    return () => {
      setIsMounted(false)
      if (imageRetryTimeoutRef.current) {
        clearTimeout(imageRetryTimeoutRef.current)
      }
    }
  }, [post.created_at])

  // 获取用户名 - 使用防抖优化
  useEffect(() => {
    const fetchUsername = async () => {
      if (!post.user_id) return

      try {
        const { data, error } = await supabase.from("profiles").select("username").eq("id", post.user_id).single()

        if (error) {
          console.error("获取用户信息失败:", error)
          return
        }

        if (data) {
          setUsername(data.username || null)
        }
      } catch (error) {
        console.error("获取用户名时出错:", error)
      }
    }

    // 使用requestIdleCallback优化非关键任务
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      // @ts-ignore - TypeScript可能不认识requestIdleCallback
      window.requestIdleCallback(() => {
        fetchUsername()
      })
    } else {
      // 降级处理
      setTimeout(fetchUsername, 100)
    }
  }, [post.user_id])

  // 检查用户是否已点赞 - 修复类型问题
  useEffect(() => {
    const checkLiked = async () => {
      if (!user) return

      try {
        // 修复：确保返回值是布尔类型
        const hasLiked = await checkUserLiked(post.id, user.id)
        // 明确设置为布尔值
        setLiked(hasLiked === true)
      } catch (error) {
        console.error("检查点赞状态失败:", error)
        // 出错时默认为未点赞
        setLiked(false)
      }
    }

    // 使用requestIdleCallback优化非关键任务
    if (user) {
      if (typeof window !== "undefined" && "requestIdleCallback" in window) {
        // @ts-ignore - TypeScript可能不认识requestIdleCallback
        window.requestIdleCallback(() => {
          checkLiked()
        })
      } else {
        // 降级处理
        setTimeout(checkLiked, 100)
      }
    }
  }, [post.id, user])

  // 预加载图片以获取宽高比，并实现自动重试 - 使用useCallback优化
  const loadImage = useCallback(() => {
    if (!post.image_url) return

    console.log(`尝试加载图片 (${retryCount + 1}/5):`, post.image_url)

    // 修复：使用 window.Image 而不是 Image
    if (typeof window === "undefined") return

    const img = new window.Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      console.log("图片加载成功:", post.image_url)
      setImageRatio(img.width / img.height)
      setImageLoaded(true)
      setImageError(false)
      setRetryCount(0) // 重置重试计数
    }
    img.onerror = () => {
      console.error(`图片加载失败 (${retryCount + 1}/5):`, post.image_url)

      // 如果是新帖子且重试次数小于5，则继续重试
      if (isNewPost && retryCount < 4) {
        const nextRetryDelay = Math.min(2000 * Math.pow(2, retryCount), 30000) // 指数退避，最长30秒
        console.log(`将在 ${nextRetryDelay}ms 后重试...`)

        setRetryCount((prev) => prev + 1)
        imageRetryTimeoutRef.current = setTimeout(loadImage, nextRetryDelay)
      } else {
        setImageError(true)
      }
    }
    // 确保 image_url 不为 undefined
    if (post.image_url) {
      img.src = post.image_url
    }
  }, [post.image_url, retryCount, isNewPost])

  useEffect(() => {
    if (post.image_url) {
      // 使用IntersectionObserver延迟加载图片，直到卡片进入视口
      if (typeof window !== "undefined" && "IntersectionObserver" in window) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0].isIntersecting) {
              loadImage()
              observer.disconnect()
            }
          },
          { threshold: 0.1 },
        )

        if (cardRef.current) {
          observer.observe(cardRef.current)
        }

        return () => {
          observer.disconnect()
          if (imageRetryTimeoutRef.current) {
            clearTimeout(imageRetryTimeoutRef.current)
          }
        }
      } else {
        // 降级处理
        loadImage()

        return () => {
          if (imageRetryTimeoutRef.current) {
            clearTimeout(imageRetryTimeoutRef.current)
          }
        }
      }
    }
  }, [post.image_url, loadImage])

  // 处理点赞 - 使用useCallback优化，添加乐观更新
  const handleLike = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation()

      if (!user) {
        toast({
          title: "请先登录",
          description: "点赞前请先登录账号",
          variant: "destructive",
        })
        return
      }

      if (isLiking) return

      try {
        setIsLiking(true)

        // 乐观更新UI
        const newLikedState = !liked
        setLiked(newLikedState)
        const newLikeCount = newLikedState
          ? likeCount !== undefined
            ? likeCount + 1
            : 1
          : likeCount !== undefined
            ? likeCount - 1
            : 0
        setLikeCount(newLikeCount)

        // 通知父组件更新
        onPostUpdated(post.id, {
          likes_count: newLikeCount,
        })

        // 执行实际API调用
        if (newLikedState) {
          await likePost(post.id, user.id)
        } else {
          await unlikePost(post.id, user.id)
        }
      } catch (error) {
        console.error("点赞操作失败:", error)

        // 恢复之前的状态
        setLiked(!liked)
        const originalLikeCount = liked
          ? likeCount !== undefined
            ? likeCount + 1
            : 1
          : likeCount !== undefined
            ? likeCount - 1
            : 0
        setLikeCount(originalLikeCount)

        // 通知父组件恢复
        onPostUpdated(post.id, {
          likes_count: originalLikeCount,
        })

        toast({
          title: "操作失败",
          description: "点赞操作失败，请稍后重试",
          variant: "destructive",
        })
      } finally {
        setIsLiking(false)
      }
    },
    [user, isLiking, liked, likeCount, post.id, onPostUpdated, toast],
  )

  // 处理评论点击 - 使用useCallback优化
  const handleComment = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      // 点击评论按钮时，打开帖子详情
      if (!isActive) {
        onClick()
      }
    },
    [isActive, onClick],
  )

  // 处理卡片点击 - 使用useCallback优化
  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!isActive) {
        onClick()
      }
    },
    [isActive, onClick],
  )

  // 处理评论添加后的回调 - 使用useCallback优化
  const handleCommentAdded = useCallback(() => {
    // 局部更新评论计数而不是刷新整个列表
    onPostUpdated(post.id, {
      comments_count: post.comments_count !== undefined ? post.comments_count + 1 : 1,
    })
  }, [post.id, post.comments_count, onPostUpdated])

  // 处理删除帖子 - 使用useCallback优化
  const handleDeletePost = useCallback(async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "删除帖子前请先登录账号",
        variant: "destructive",
      })
      return
    }

    // 检查是否有权限删除
    if (!isAuthor && !isAdmin) {
      toast({
        title: "权限不足",
        description: "您没有权限删除此帖子",
        variant: "destructive",
      })
      return
    }

    try {
      setIsDeleting(true)

      // 直接删除帖子
      const { error: deleteError } = await supabase.from("posts").delete().eq("id", post.id)

      if (deleteError) {
        throw deleteError
      }

      toast({
        title: "删除成功",
        description: "帖子已成功删除",
      })

      // 关闭详情页面（如果打开）
      if (isActive) {
        onClose()
      }

      // 通知父组件删除帖子
      if (onPostDeleted) {
        onPostDeleted(post.id)
      }
    } catch (error: any) {
      console.error("删除帖子失败:", error)

      // 更详细的错误处理
      let errorMessage = "删除帖子时出现错误，请稍后重试"

      if (error.message) {
        errorMessage = error.message
      }

      toast({
        title: "删除失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteAlert(false)
    }
  }, [user, isAuthor, isAdmin, post.id, isActive, onClose, onPostDeleted, toast])

  // 处理图片加载错误 - 使用useCallback优化
  const handleImageError = useCallback(() => {
    console.error("图片加载失败 (Image组件):", post.image_url)

    // 如果是新帖子且重试次数小于5，则继续重试
    if (isNewPost && retryCount < 4) {
      setRetryCount((prev) => prev + 1)
    } else {
      setImageError(true)
    }
  }, [post.image_url, isNewPost, retryCount])

  // 处理图片加载成功 - 使用useCallback优化
  const handleImageLoad = useCallback(() => {
    console.log("图片加载成功 (Image组件):", post.image_url)
    setImageLoaded(true)
    setImageError(false)
    setRetryCount(0) // 重置重试计数
  }, [post.image_url])

  // 渲染正常卡片 - 使用useMemo优化
  const renderCard = useMemo(
    () => (
      <div
        ref={cardRef}
        className="post-card will-change-transform"
        onClick={handleCardClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn("glass-card", isHovered && "scale-[1.02] transition-transform duration-300")}>
          {/* 图片区域 - 修复：使用相对定位和负边距消除间隙 */}
          <div
            className="relative w-full bg-gray-800/60 image-glow"
            style={{
              // 根据图片比例设置高度，保持响应式
              paddingBottom: post.image_url
                ? isLandscape
                  ? "56.25%" // 横向图片使用16:9比例
                  : `${(1 / imageRatio) * 100}%` // 竖向图片使用实际比例
                : "56.25%", // 无图片时使用16:9比例
            }}
          >
            {post.image_url ? (
              <div className="absolute inset-0">
                {!imageError ? (
                  <>
                    <Image
                      src={post.image_url || "/placeholder.svg"}
                      alt={post.title || "帖子图片"}
                      fill
                      className={cn(
                        "object-cover transition-opacity duration-300",
                        imageLoaded ? "opacity-100" : "opacity-0",
                      )}
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      crossOrigin="anonymous"
                      unoptimized={true} // 禁用Next.js的图片优化，直接使用原始URL
                      loading="lazy" // 使用懒加载
                      sizes="(max-width: 768px) 100vw, 50vw" // 优化响应式加载
                    />
                    {!imageLoaded && !imageError && (
                      <div className="image-loading">
                        <div className="image-loading-spinner"></div>
                        {isNewPost && retryCount > 0 && (
                          <div className="image-loading-text">
                            <Clock className="h-3 w-3" />
                            <span>图片处理中...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="image-error">
                    <ImageOff className="h-5 w-5 mb-1" />
                    <span>图片加载失败</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-lime-400 text-3xl group-hover:text-lime-300 transition-colors duration-300">
                {post.imageContent || "+"}
              </div>
            )}

            {/* 管理员标识 */}
            {isAdmin && !isAuthor && (
              <div className="admin-badge">
                <Shield className="h-2 w-2" />
                <span>管理员</span>
              </div>
            )}

            {/* 帖子操作菜单 - 对所有帖子都显示删除按钮（如果是管理员） */}
            {(isAuthor || isAdmin) && (
              <div className="menu-button">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-full h-full flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-900/90 border-gray-800 text-white">
                    <DropdownMenuItem
                      className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer text-xs py-1"
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteAlert(true)
                      }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      {isAdmin && !isAuthor ? "管理员删除" : "删除帖子"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* 内容区域 - 修复：使用负边距消除间隙 */}
          <div className="card-content frosted-glass mt-[-1px]">
            <h3 className="card-title">{post.title}</h3>

            <div className="card-meta">
              <span className="card-category">{post.category}</span>

              <div className="card-actions">
                <button
                  className={cn("card-action-btn", liked && "active", isLiking && "opacity-70")}
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  <ThumbsUp className="h-3 w-3" />
                  <span>{likeCount}</span>
                </button>

                <button className="card-action-btn" onClick={handleComment}>
                  <MessageSquare className="h-3 w-3" />
                  <span>{post.comments_count}</span>
                </button>
              </div>
            </div>

            <p className="card-description">{post.description || post.content}</p>

            <div className="card-footer">
              <span className="card-author">{username || post.username || "匿名用户"}</span>
              <span className="card-time">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    [
      handleCardClick,
      isHovered,
      post.image_url,
      isLandscape,
      imageRatio,
      imageError,
      imageLoaded,
      handleImageLoad,
      handleImageError,
      post.title,
      post.imageContent,
      isAdmin,
      isAuthor,
      post.category,
      liked,
      isLiking,
      handleLike,
      likeCount,
      handleComment,
      post.comments_count,
      post.description,
      post.content,
      username,
      post.username,
      formattedDate,
      retryCount,
      isNewPost,
    ],
  )

  // 渲染激活状态的卡片 - 使用useMemo优化
  const renderActiveCard = useMemo(() => {
    if (!isMounted) return null

    return createPortal(
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

        {/* 修复：确保模态框可以滚动 */}
        <div
          className="relative max-w-2xl w-full max-h-[80vh] m-4 rounded-xl glass-card active content-glass animate-in fade-in zoom-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 关闭按钮 */}
          <button
            className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 hover:text-lime-400 transition-colors duration-300"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          {/* 帖子操作菜单 - 对所有帖子都显示删除按钮（如果是管理员） */}
          {(isAuthor || isAdmin) && (
            <div className="absolute top-3 right-12 z-10">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70 hover:text-lime-400 transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-900/90 border-gray-800 text-white">
                  <DropdownMenuItem
                    className="text-red-400 hover:text-red-300 focus:text-red-300 cursor-pointer"
                    onClick={() => setShowDeleteAlert(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isAdmin && !isAuthor ? "管理员删除" : "删除帖子"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {/* 管理员标识 */}
          {isAdmin && !isAuthor && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-lime-900/70 text-lime-400 p-1.5 rounded-md flex items-center text-xs">
                <Shield className="h-4 w-4 mr-1" />
                管理员模式
              </div>
            </div>
          )}

          {/* 修复：使用可滚动容器包装内容 */}
          <div className="overflow-y-auto max-h-[80vh] overscroll-contain">
            <div className="relative w-full bg-gray-800" style={{ maxHeight: "60vh" }}>
              {post.image_url ? (
                !imageError ? (
                  <div
                    className="relative w-full"
                    style={{
                      paddingBottom: isLandscape ? "56.25%" : `${(1 / imageRatio) * 100}%`,
                      maxHeight: "60vh",
                    }}
                  >
                    <Image
                      src={post.image_url || "/placeholder.svg"}
                      alt={post.title || "帖子图片"}
                      fill
                      className="object-contain"
                      priority={isActive} // 只有在激活状态下才使用priority
                      crossOrigin="anonymous"
                      unoptimized={true} // 禁用Next.js的图片优化，直接使用原始URL
                      onError={handleImageError}
                    />
                    {!imageLoaded && !imageError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800">
                        <div className="w-8 h-8 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        {isNewPost && (
                          <div className="text-sm text-lime-400 flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>图片处理中，请稍候...</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="relative w-full flex flex-col items-center justify-center bg-gray-800 text-red-400"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <ImageOff className="h-10 w-10 mb-2" />
                    <p>图片加载失败</p>
                  </div>
                )
              ) : (
                <div
                  className="relative w-full flex items-center justify-center bg-gray-800"
                  style={{ aspectRatio: "16/9" }}
                >
                  <div className="text-lime-400 text-5xl">{post.imageContent || "+"}</div>
                </div>
              )}
            </div>

            <div className="p-5 frosted-glass mt-[-1px]">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-white neon-text">{post.title}</h3>
                <span className="text-lime-400 text-sm font-medium px-3 py-1 rounded-full bg-lime-950/50 border border-lime-800/50">
                  {post.category}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
                <span>{username || post.username || "匿名用户"}</span>
                <span>{formattedDate}</span>
              </div>

              <p className="text-gray-200 text-sm leading-relaxed mb-6 whitespace-pre-line">
                {post.description || post.content}
              </p>

              <div className="flex justify-between items-center pt-4 border-t border-white/10">
                <div className="flex items-center space-x-4 text-gray-300 text-sm">
                  <button
                    className={cn(
                      "flex items-center space-x-1.5 transition-colors duration-300 px-2 py-1 rounded-full",
                      liked ? "text-lime-400 bg-lime-950/30" : "hover:text-lime-400",
                      isLiking && "opacity-70",
                    )}
                    onClick={handleLike}
                    disabled={isLiking}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{likeCount}</span>
                  </button>

                  <button
                    className="flex items-center space-x-1.5 hover:text-lime-400 transition-colors duration-300 px-2 py-1 rounded-full hover:bg-lime-950/30"
                    onClick={handleComment}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>{post.comments_count}</span>
                  </button>
                </div>
              </div>

              {/* 评论区 */}
              <CommentList postId={post.id} onCommentAdded={handleCommentAdded} />
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )
  }, [
    isMounted,
    onClose,
    isAuthor,
    isAdmin,
    post.image_url,
    imageError,
    isLandscape,
    imageRatio,
    handleImageError,
    imageLoaded,
    isNewPost,
    post.imageContent,
    post.title,
    post.category,
    username,
    post.username,
    formattedDate,
    post.description,
    post.content,
    liked,
    isLiking,
    handleLike,
    likeCount,
    handleComment,
    post.comments_count,
    post.id,
    handleCommentAdded,
    isActive,
  ])

  return (
    <>
      {renderCard}
      {isActive && renderActiveCard}

      {/* 删除确认对话框 */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              {isAdmin && !isAuthor ? "管理员删除" : "确认删除"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              你确定要删除这篇帖子吗？此操作无法撤销，帖子及其相关评论将被永久删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-900 hover:bg-red-800 text-white"
              onClick={handleDeletePost}
              disabled={isDeleting}
            >
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
