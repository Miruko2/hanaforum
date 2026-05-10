"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Send } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"
import { useSimpleAuth } from "@/contexts/auth-context-simple"
import { useToast } from "@/hooks/use-toast"

/** 一条弹幕在数据库中的结构 */
interface LiveComment {
  id: string
  user_id: string
  username: string
  content: string
  created_at: string
}

type NeonColor = "cyan" | "green" | "pink" | "yellow" | "red"

interface DisplayComment extends LiveComment {
  colorCls: NeonColor
  prefix: string
  typedChars: number
  done: boolean
}

const NEON_COLORS: NeonColor[] = ["cyan", "green", "pink", "yellow", "red"]
const PREFIX_POOL: Record<NeonColor, string[]> = {
  cyan: [">>>", "<<<"],
  green: ["///", ">>>"],
  pink: ["###", "<<<"],
  yellow: [":::"],
  red: ["[!]"],
}

function hashColor(str: string): NeonColor {
  let h = 0
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) | 0
  return NEON_COLORS[Math.abs(h) % NEON_COLORS.length]
}

function pickPrefix(color: NeonColor, seed: string): string {
  const pool = PREFIX_POOL[color]
  let h = 0
  for (const ch of seed) h = (h * 13 + ch.charCodeAt(0)) | 0
  return pool[Math.abs(h) % pool.length]
}

const MAX_DISPLAY = 50
const MAX_LENGTH = 50
const TYPE_SPEED_MS = 85 // 人类打字感
const TRANSITION_MS = 550 // 卷帘入场/退场时长

export default function LiveWallContent() {
  const router = useRouter()
  const { user } = useSimpleAuth()
  const { toast } = useToast()

  // 入场 / 退场状态
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)

  const [comments, setComments] = useState<DisplayComment[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // 入场：下一帧触发 translateY(0)，让 CSS 过渡能跑起来
  useEffect(() => {
    const rafId = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(rafId)
  }, [])

  // 退场：播完动画再真正跳回
  const handleBack = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(() => router.push("/"), TRANSITION_MS)
  }, [closing, router])

  // ESC 键也触发退场
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleBack()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [handleBack])

  const toDisplay = useCallback(
    (c: LiveComment, isNew: boolean): DisplayComment => {
      const colorCls = hashColor(c.id)
      return {
        ...c,
        colorCls,
        prefix: pickPrefix(colorCls, c.id),
        typedChars: isNew ? 0 : c.content.length,
        done: !isNew,
      }
    },
    [],
  )

  // 初次加载
  useEffect(() => {
    let alive = true
    ;(async () => {
      const { data, error } = await supabase
        .from("live_comments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(MAX_DISPLAY)
      if (!alive) return
      if (error) {
        console.warn("[LiveWall] 初次拉取失败:", error.message)
        return
      }
      const ordered = (data ?? []).reverse()
      setComments(ordered.map((c) => toDisplay(c as LiveComment, false)))
    })()
    return () => {
      alive = false
    }
  }, [toDisplay])

  // 实时订阅
  useEffect(() => {
    const channel = supabase
      .channel("live_comments_page")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "live_comments" },
        (payload) => {
          const c = payload.new as LiveComment
          setComments((prev) => {
            if (prev.some((x) => x.id === c.id)) return prev
            const next = [...prev, toDisplay(c, true)]
            return next.length > MAX_DISPLAY
              ? next.slice(next.length - MAX_DISPLAY)
              : next
          })
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "live_comments" },
        (payload) => {
          const id = (payload.old as LiveComment).id
          setComments((prev) => prev.filter((c) => c.id !== id))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [toDisplay])

  // 打字机推进
  useEffect(() => {
    const hasPending = comments.some((c) => !c.done)
    if (!hasPending) return
    const timer = setInterval(() => {
      setComments((prev) =>
        prev.map((c) => {
          if (c.done) return c
          const next = c.typedChars + 1
          return next >= c.content.length
            ? { ...c, typedChars: c.content.length, done: true }
            : { ...c, typedChars: next }
        }),
      )
    }, TYPE_SPEED_MS)
    return () => clearInterval(timer)
  }, [comments])

  // 自动滚底部
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [comments.length])

  // 发送
  const handleSend = useCallback(async () => {
    const content = input.trim()
    if (!content || sending) return
    if (!user) {
      toast({
        title: "需要登录",
        description: "请登录后再发弹幕",
        variant: "destructive",
      })
      return
    }
    if (content.length > MAX_LENGTH) return

    try {
      setSending(true)
      const username =
        user.user_metadata?.username ||
        (user.email ? user.email.split("@")[0] : "匿名")

      const { error } = await supabase.from("live_comments").insert([
        { user_id: user.id, username, content },
      ])
      if (error) throw error
      setInput("")
    } catch (err: any) {
      console.error("[LiveWall] 发送失败:", err)
      toast({
        title: "发送失败",
        description: err?.message || "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }, [input, sending, user, toast])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const placeholder = user ? "> 发送弹幕... (Enter 发送)" : "> 登录后发送弹幕"

  // 展示态：已挂载且未关闭
  const shown = mounted && !closing

  return (
    <div className={`live-wall-page ${shown ? "live-wall-shown" : ""}`}>
      {/* 纯黑底 + 极淡青色扫描线 */}
      <div className="live-wall-bg-scanlines" aria-hidden />
      <div className="live-wall-bg-vignette" aria-hidden />

      {/* 顶部 */}
      <header className="live-wall-header">
        <button
          type="button"
          onClick={handleBack}
          className="live-wall-back"
          aria-label="返回"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>ESC</span>
        </button>

        <div className="live-wall-title">
          <span className="live-wall-dot" />
          <span className="live-wall-title-main">LIVE · 弹幕墙</span>
          <span className="live-wall-title-sub">FIREFLY NATION</span>
        </div>

        <div className="live-wall-count">
          {comments.length.toString().padStart(2, "0")} / {MAX_DISPLAY}
        </div>
      </header>

      {/* 消息区 */}
      <main ref={listRef} className="live-wall-feed">
        {comments.length === 0 ? (
          <div className="live-wall-empty">
            <span className="neon-cyan">&gt;&gt;&gt;</span>
            <span className="ml-3 opacity-60">等待第一条消息...</span>
            <span className="live-wall-cursor" />
          </div>
        ) : (
          comments.map((c, i) => (
            <div key={c.id} className="live-wall-line">
              <span
                className={`live-wall-prefix neon-${c.colorCls} flicker-part`}
                style={{ ["--flicker-delay" as any]: (i * 0.41) % 7 }}
              >
                {c.prefix}
              </span>
              <span
                className={`live-wall-user neon-${c.colorCls} flicker-part`}
                style={{ ["--flicker-delay" as any]: (i * 0.73 + 2.1) % 7 }}
              >
                &gt;&gt; {c.username}:
              </span>
              <span
                className={`neon-${c.colorCls} flicker-part`}
                style={{ ["--flicker-delay" as any]: (i * 1.19 + 4.3) % 7 }}
              >
                {c.content.slice(0, c.typedChars)}
                {!c.done && <span className="live-wall-cursor typing" />}
              </span>
            </div>
          ))
        )}
      </main>

      {/* 输入框 */}
      <footer className="live-wall-footer">
        <form
          className={`live-wall-input-wrap ${inputFocused ? "is-focused" : ""}`}
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
        >
          <span className="live-wall-input-prefix">&gt;</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_LENGTH))}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={!user || sending}
            maxLength={MAX_LENGTH}
            className="live-wall-input"
          />
          <span className="live-wall-input-count">
            {input.length}/{MAX_LENGTH}
          </span>
          <button
            type="submit"
            disabled={!user || sending || !input.trim()}
            className="live-wall-send"
            aria-label="发送"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}
