"use client"

import { useEffect, useState } from "react"
import { AnimatePresence } from "framer-motion"
import PostGrid from "@/components/post-grid"
import CinemaMode from "@/components/cinema-mode"
import BackgroundEffects from "@/components/background-effects"
import FloatingActionButton from "@/components/floating-action-button"
import { useSimpleAuth } from "@/contexts/auth-context-simple"
import { usePosts } from "@/contexts/posts-context"
import { isValidCategory, CATEGORY_LABELS } from "@/lib/categories"
import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

/** 从当前 URL 的 ?category=xxx 读合法分类值，不合法就返回 null */
function readCategoryFromURL(): string | null {
  if (typeof window === "undefined") return null
  const params = new URLSearchParams(window.location.search)
  const raw = params.get("category")
  return isValidCategory(raw) ? raw : null
}

export default function HomePage() {
  const { loading, user } = useSimpleAuth()
  const { setCategory, state } = usePosts()

  // 使用本地 state 跟踪 URL 上的分类（首次渲染从 URL 读）
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  // 影院模式开关
  const [cinemaMode, setCinemaMode] = useState(false)

  // 监听导航栏派发的 cinema-mode-toggle 事件
  useEffect(() => {
    const onToggle = (e: Event) => {
      const detail = (e as CustomEvent<{ on: boolean }>).detail
      setCinemaMode(!!detail?.on)
    }
    window.addEventListener("cinema-mode-toggle", onToggle)
    return () => window.removeEventListener("cinema-mode-toggle", onToggle)
  }, [])

  // 同步影院模式状态给导航栏（用于按钮高亮）
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("cinema-mode-changed", { detail: { on: cinemaMode } }),
    )
  }, [cinemaMode])

  // 客户端挂载后读一次 URL，并监听浏览器前进/后退（popstate）
  useEffect(() => {
    setActiveCategory(readCategoryFromURL())
    const onPop = () => setActiveCategory(readCategoryFromURL())
    window.addEventListener("popstate", onPop)
    // 自定义事件，让导航栏切换分类时通知到首页（见 navigation.tsx）
    window.addEventListener("category-changed", onPop)
    return () => {
      window.removeEventListener("popstate", onPop)
      window.removeEventListener("category-changed", onPop)
    }
  }, [])

  // 同步到 Context
  useEffect(() => {
    if (activeCategory !== state.category) {
      setCategory(activeCategory)
    }
  }, [activeCategory, state.category, setCategory])

  // 百叶窗效果样式
  const blindsOverlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.15),
      rgba(0, 0, 0, 0.15) 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    )`,
    pointerEvents: 'none' as const,
    zIndex: 0,
    backdropFilter: 'blur(0.7px)',
  }

  if (loading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center">
        {/* 百叶窗效果 */}
        <div style={blindsOverlayStyle}></div>
        <div className="text-center space-y-4 relative z-10">
          <Loader2 className="h-8 w-8 animate-spin text-lime-400 mx-auto" />
          <p className="text-gray-400">正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative">
      {/* 百叶窗效果 */}
      <div style={blindsOverlayStyle}></div>

      <AnimatePresence mode="wait">
        {cinemaMode ? (
          <motion.div
            key="cinema"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="relative z-10 pt-24"
          >
            <CinemaMode posts={state.posts} />
          </motion.div>
        ) : (
          <motion.main
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="container mx-auto px-4 pt-24 pb-8 max-w-7xl z-10 relative"
          >
            {/* 当前分类提示（仅过滤时显示） */}
            {activeCategory && (
              <motion.div
                className="mb-6 flex items-center gap-3 text-white/80"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                key={activeCategory}
              >
                <div
                  className="h-8 w-1 bg-lime-400 rounded-full"
                  style={{ boxShadow: "0 0 16px rgba(132,204,22,0.5)" }}
                />
                <span className="text-sm tracking-widest uppercase text-white/50">分类</span>
                <span className="text-xl font-semibold">
                  {CATEGORY_LABELS[activeCategory] || activeCategory}
                </span>
              </motion.div>
            )}

            {/* 帖子列表 */}
            <motion.section
              className="mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <PostGrid />
            </motion.section>
          </motion.main>
        )}
      </AnimatePresence>

      <FloatingActionButton />
    </div>
  )
}
