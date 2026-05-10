/**
 * 帖子分类的权威定义。新增或改名只改这里。
 * value 是数据库里存的字段值，label 是 UI 显示的中文名。
 */

export type CategoryValue = "general" | "nsfw" | "game" | "code" | "life" | "help"

export interface CategoryDef {
  value: CategoryValue
  label: string
  /** 菜单里每一项的装饰符号，不是 emoji 以保持站内极简风 */
  glyph: string
}

export const CATEGORIES: readonly CategoryDef[] = [
  { value: "general", label: "综合", glyph: "◇" },
  { value: "nsfw",    label: "色图", glyph: "✿" },
  { value: "game",    label: "游戏", glyph: "▲" },
  { value: "code",    label: "代码", glyph: "◻" },
  { value: "life",    label: "生活", glyph: "○" },
  { value: "help",    label: "求助", glyph: "?" },
] as const

/** 快查表：{ general: "综合", nsfw: "色图", ... } */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map(c => [c.value, c.label]),
)

/** 用于验证 URL 参数是否是合法分类 */
export function isValidCategory(v: string | null | undefined): v is CategoryValue {
  if (!v) return false
  return CATEGORIES.some(c => c.value === v)
}
