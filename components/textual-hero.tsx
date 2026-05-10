"use client"

import type { Post } from "@/lib/types"
import { CATEGORY_LABELS } from "@/lib/categories"

/**
 * 各彩带的日文/英文文案。内容无意义，仅作装饰性氛围。
 * 每条都用足够长的重复串，保证无缝滚动。
 */
const BAND_PHRASES = [
  "ホタル  FIREFLY  ホタル  FIREFLY  ホタル  NIGHT",
  "夜空 の 詩  •  NEON NATION  •  夜空 の 詩",
  "スレッド  THREAD  ネオン  NEON  スレッド  THREAD",
  "集まり  •  蛍 の 国  •  GATHERING  •  集まり",
  "メッセージ  MESSAGE  投稿  POSTS  ようこそ",
  "ホタル  •  CONNECT  •  ネオン  •  NIGHT  •  蛍光",
]

interface TextualHeroProps {
  post: Post
}

export default function TextualHero({ post }: TextualHeroProps) {
  const titleLength = post.title?.length ?? 0
  const titleSizeClass =
    titleLength <= 6
      ? "text-5xl md:text-6xl"
      : titleLength <= 14
        ? "text-4xl md:text-5xl"
        : "text-3xl md:text-4xl"

  const categoryLabel = CATEGORY_LABELS[post.category] || post.category
  const year = post.created_at ? new Date(post.created_at).getFullYear() : ""

  const fallbackSymbols = ["◇", "△", "□", "○", "+"]
  const watermark =
    post.imageContent ||
    fallbackSymbols[
      Math.abs([...post.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) %
        fallbackSymbols.length
    ]

  // 按 id 稳定挑一组装饰字。1-4 字均可，CSS 按数量自动排版
  const backdropVariants: string[][] = [
    ["仮", "想", "通", "貨"],
    ["夜", "空"],
    ["蛍"],
    ["ホ", "タ", "ル"],
    ["投", "稿"],
    ["N", "0", "4"],
    ["夜"],
    ["蛍", "の", "国"],
    ["メ", "ッ", "セ", "ー"],
    ["空"],
  ]
  const variantIndex =
    Math.abs([...post.id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) %
    backdropVariants.length
  const backdropChars = backdropVariants[variantIndex]

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#160a12] md:rounded-l-[24px]">
      {/* 最底层：装饰字，按数量自动排版（1=大字 / 2=左右 / 3=三角 / 4=方阵） */}
      <div
        className="absolute inset-0 pointer-events-none select-none hero-backdrop"
        aria-hidden
      >
        <div className="hero-backdrop-grid" data-count={backdropChars.length}>
          {backdropChars.map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </div>
      </div>

      {/* 中层：倾斜彩带容器 */}
      <div className="absolute inset-[-20%] hero-bands-tilted" aria-hidden>
        {BAND_PHRASES.map((phrase, i) => (
          <div key={i} className={`hero-band hero-band-${i + 1}`}>
            {/* 文本复制两次确保无缝滚动 */}
            <span className="hero-band-text">{phrase.repeat(6)}</span>
            <span className="hero-band-text">{phrase.repeat(6)}</span>
          </div>
        ))}
      </div>

      {/* 百叶窗扫描线 */}
      <div className="absolute inset-0 hero-scanlines pointer-events-none" aria-hidden />

      {/* 超大水印符号 */}
      <div
        className="pointer-events-none select-none absolute text-white/[0.1] font-light leading-none mix-blend-overlay"
        style={{
          top: "-8%",
          right: "-10%",
          fontSize: "clamp(200px, 30vw, 360px)",
        }}
        aria-hidden
      >
        {watermark}
      </div>

      {/* 标题 hero 区 */}
      <div className="relative h-full flex flex-col justify-center p-8 md:p-10">
        <div
          className="w-1 h-10 md:h-12 bg-pink-400 mb-5 rounded-full"
          style={{ boxShadow: "0 0 24px rgba(244, 114, 182, 0.8)" }}
        />
        <h2
          className={`${titleSizeClass} font-bold text-white leading-[1.1] tracking-tight line-clamp-6`}
          style={{ textShadow: "0 2px 30px rgba(0,0,0,0.7), 0 0 16px rgba(244, 114, 182, 0.2)" }}
        >
          {post.title}
        </h2>
        <div className="mt-6 flex items-center gap-3 text-[11px] text-white/60 tracking-[0.25em] uppercase">
          <span>{categoryLabel}</span>
          <span className="flex-1 max-w-[60px] h-px bg-pink-400/40" />
          {year && <span>{year}</span>}
        </div>
      </div>
    </div>
  )
}
