/**
 * 简单的内存限流器（适用于 serverless 单实例场景）
 * 如果部署到多实例环境，需要换成 Redis 方案
 */

import {
  USER_COOLDOWN_MS,
  GLOBAL_WINDOW_MS,
  GLOBAL_MAX_CALLS,
} from "./constants"

/** 每用户上次触发时间 */
const userLastCall = new Map<string, number>()

/** 全局调用时间戳队列 */
const globalCalls: number[] = []

/** 清理过期的全局调用记录 */
function pruneGlobalCalls() {
  const cutoff = Date.now() - GLOBAL_WINDOW_MS
  while (globalCalls.length > 0 && globalCalls[0] < cutoff) {
    globalCalls.shift()
  }
}

/**
 * 检查是否允许本次 AI 调用
 * @returns { allowed: boolean, reason?: string }
 */
export function checkRateLimit(userId: string): { allowed: boolean; reason?: string } {
  const now = Date.now()

  // 用户级冷却
  const lastCall = userLastCall.get(userId)
  if (lastCall && now - lastCall < USER_COOLDOWN_MS) {
    const waitSec = Math.ceil((USER_COOLDOWN_MS - (now - lastCall)) / 1000)
    return { allowed: false, reason: `请等待 ${waitSec} 秒后再 @hanako` }
  }

  // 全局级限流
  pruneGlobalCalls()
  if (globalCalls.length >= GLOBAL_MAX_CALLS) {
    return { allowed: false, reason: "hanako 正在忙，请稍后再试" }
  }

  return { allowed: true }
}

/** 记录一次成功调用 */
export function recordCall(userId: string) {
  const now = Date.now()
  userLastCall.set(userId, now)
  globalCalls.push(now)

  // 防止内存泄漏：清理超过 5 分钟的用户记录
  if (userLastCall.size > 500) {
    const cutoff = now - 5 * 60 * 1000
    for (const [uid, ts] of userLastCall) {
      if (ts < cutoff) userLastCall.delete(uid)
    }
  }
}
