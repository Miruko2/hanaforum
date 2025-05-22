import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期为相对时间（例如：3小时前）
 * @param dateString - ISO格式的日期字符串
 * @returns 格式化后的相对时间字符串
 */
export function formatDate(dateString: string): string {
  if (!dateString) return ""

  try {
    const date = new Date(dateString)
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN })
  } catch (error) {
    console.error("日期格式化错误:", error)
    return dateString
  }
}

/**
 * 截断文本到指定长度，并添加省略号
 * @param text - 要截断的文本
 * @param maxLength - 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

/**
 * 生成随机ID
 * @returns 随机ID字符串
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}
