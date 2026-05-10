"use client"

import { useMemo, useState, useCallback } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import type { Post } from "@/lib/types"
import PostDetailModal from "./post-detail-modal"
import NeonMarquee from "./neon-marquee"
import { useSimpleAuth } from "@/contexts/auth-context-simple"
import { useIsMobile } from "@/hooks/use-mobile"

interface CinemaModeProps {
  posts: Post[]
}

/**
 * 首页"影院模式"：5 列斜向的海报墙，奇数列向下滚/偶数列向上滚。
 * 鼠标悬停在某列上时整列停滚。点击卡片打开详情模态框。
 */
export default function CinemaMode({ posts }: CinemaModeProps) {
  const { user, isAdmin } = useSimpleAuth()
  const isMobile = useIsMobile()
  const [activePostId, setActivePostId] = useState<string | null>(null)

  // 只挑有图的帖子
  const withImage = useMemo(() => posts.filter(p => !!p.image_url), [posts])

  // 均分成 N 列。每列再复制一份拼在自身之后，做无缝循环
  // 桌面 7 列，移动端 4 列（空间太挤降档）
  const columns = useMemo(() => {
    const COLS = isMobile ? 4 : 7
    const buckets: Post[][] = Array.from({ length: COLS }, () => [])
    withImage.forEach((p, i) => {
      buckets[i % COLS].push(p)
    })
    return buckets
  }, [withImage, isMobile])

  const activePost = useMemo(
    () => (activePostId ? withImage.find(p => p.id === activePostId) ?? null : null),
    [activePostId, withImage],
  )

  const handleCardClick = useCallback((postId: string) => {
    setActivePostId(postId)
  }, [])

  const handleClose = useCallback(() => {
    setActivePostId(null)
  }, [])

  // 帖子太少，给友好提示
  if (withImage.length < 5) {
    return (
      <div className="flex items-center justify-center py-24 text-white/60">
        有图帖子太少，暂时无法启动影院模式
      </div>
    )
  }

  return (
    <>
      {/* 整块容器：顶部霓虹条 + 舞台 + 底部霓虹条，总高约为视口高度减去导航栏 */}
      <div
        className="relative w-full flex flex-col"
        style={{ height: "calc(100vh - 110px)" }}
      >
        {/* 顶部霓虹跑马灯（向左滚） */}
        <NeonMarquee direction="left" duration={42} />

        {/* 中间舞台：海报墙 */}
        <div className="cinema-stage relative flex-1 overflow-hidden">
          <div className="cinema-tilted absolute inset-0">
            <div className="cinema-cols h-full w-full flex gap-2 md:gap-2.5">
              {columns.map((col, colIdx) => {
                // 奇数列向下滚(0% → -50%)，偶数列向上滚(-50% → 0%)
                const goingDown = colIdx % 2 === 0
                // 每列有不同的速度，节奏更有机
                const durations = [55, 62, 50, 68, 58, 64, 52]
                const duration = durations[colIdx % durations.length]

                return (
                  <div key={colIdx} className="cinema-col flex-1 relative">
                    <div
                      className={`cinema-col-track ${goingDown ? "scroll-down" : "scroll-up"}`}
                      style={{ animationDuration: `${duration}s` }}
                    >
                      {/* 两份一样的卡片首尾相接，保证 translate -50% 回到原位时无缝 */}
                      {[...col, ...col].map((post, i) => (
                        <CinemaCard
                          key={`${post.id}-${i}`}
                          post={post}
                          onClick={() => handleCardClick(post.id)}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 顶部/底部羽化遮罩，让海报墙和霓虹条过渡更柔 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/80 to-transparent z-10" />
        </div>

        {/* 底部霓虹跑马灯（向右滚） */}
        <NeonMarquee direction="right" duration={48} />
      </div>

      {/* 帖子详情模态框 */}
      {activePost && (
        <PostDetailModal
          post={activePost}
          isOpen={!!activePost}
          onClose={handleClose}
          onLike={() => {}}
          onCommentAdded={() => {}}
          liked={false}
          likeCount={activePost.likes_count ?? 0}
          isLiking={false}
          username={activePost.username ?? "匿名"}
          avatarUrl={activePost.users?.avatar_url ?? null}
          isMobile={isMobile}
          isAdmin={isAdmin}
        />
      )}
    </>
  )
}

/** 影院模式下单张卡片：图占满 + 底部渐变蒙层叠标题/用户名 */
function CinemaCard({ post, onClick }: { post: Post; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="cinema-card group relative w-full aspect-[3/4] rounded-lg overflow-hidden block text-left border border-white/10"
    >
      {post.image_url ? (
        <Image
          src={post.image_url}
          alt={post.title}
          fill
          sizes="(max-width: 768px) 40vw, 15vw"
          quality={55}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-pink-900/40 to-purple-900/40" />
      )}

      {/* 底部渐变蒙层 + 文字（紧凑版） */}
      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
        <h4 className="text-white font-medium text-[11px] md:text-xs leading-tight line-clamp-2 mb-0.5">
          {post.title}
        </h4>
        <p className="text-white/50 text-[10px] truncate">{post.username}</p>
      </div>
    </button>
  )
}
