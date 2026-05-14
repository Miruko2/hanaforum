/** Hanako AI 主播系统常量 */

/** 情绪枚举 */
export type HanakoEmotion =
  | "neutral"
  | "happy"
  | "shy"
  | "jealous"
  | "worried"
  | "yandere"
  | "surprised"
  | "sleepy"

export const EMOTIONS: HanakoEmotion[] = [
  "neutral",
  "happy",
  "shy",
  "jealous",
  "worried",
  "yandere",
  "surprised",
  "sleepy",
]

/** 情绪对应的霓虹颜色（用于前端显示） */
export const EMOTION_COLORS: Record<HanakoEmotion, string> = {
  neutral: "#67e8f9",   // cyan
  happy: "#a3e635",     // lime
  shy: "#f9a8d4",       // pink
  jealous: "#fbbf24",   // amber
  worried: "#93c5fd",   // blue
  yandere: "#f87171",   // red
  surprised: "#fde047", // yellow
  sleepy: "#a78bfa",    // purple
}

/** Hanako 的固定用户 ID（对应 auth.users 和 public.users 中的记录） */
export const HANAKO_USER_ID = "a3015a8e-9f17-4716-bac2-b8cfeb636a23"

/** Hanako 的用户名 */
export const HANAKO_USERNAME = "hanako"

/** 触发 AI 回复的正则（不区分大小写） */
export const TRIGGER_REGEX = /@hanako|@花子/i

/** 每用户冷却时间（毫秒） */
export const USER_COOLDOWN_MS = 15_000

/** 全局窗口时间（毫秒） */
export const GLOBAL_WINDOW_MS = 30_000

/** 全局窗口内最大调用次数 */
export const GLOBAL_MAX_CALLS = 10

/** AI 回复最大 token */
export const MAX_REPLY_TOKENS = 200

/**
 * 允许与 hanako 对话的用户 ID 白名单
 * 空数组 = 不限制（所有人都能聊）
 * 填入 user_id 后只有这些用户的 @hanako 会触发 AI
 */
export const ALLOWED_USER_IDS: string[] = [
  "4345c6d0-05eb-4bc3-ba50-1cfa1dee2c41", // miruko2
]
