import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createServerSupabaseClient() {
  // 检查环境变量是否存在
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // 如果环境变量不存在，返回一个模拟客户端
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase环境变量缺失，返回模拟客户端")
    // 返回一个模拟客户端，避免构建失败
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      },
    } as any
  }

  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => {
        const cookie = cookieStore.get(name)
        return cookie?.value
      },
      set: (name, value, options) => {
        // 这个环境只允许读取cookies
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // 忽略set cookie错误
        }
      },
      remove: (name, options) => {
        try {
          cookieStore.set({ name, value: "", ...options })
        } catch (error) {
          // 忽略remove cookie错误
        }
      },
    },
  })
}
