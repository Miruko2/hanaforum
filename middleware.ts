// middleware.ts
import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  try {
    // 检查环境变量是否存在
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase环境变量缺失，跳过认证检查")
      return res // 如果环境变量缺失，继续处理请求而不是阻止
    }

    // 创建Supabase服务器客户端
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get: (name) => req.cookies.get(name)?.value,
        set: (name, value, options) => {
          res.cookies.set({ name, value, ...options })
        },
        remove: (name, options) => {
          res.cookies.set({ name, value: "", ...options })
        },
      },
    })

    // 尝试获取会话，如果失败则继续处理请求
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      // 如果用户未登录且尝试访问受保护的路由，重定向到登录页
      if (!session && req.nextUrl.pathname.startsWith("/profile")) {
        const redirectUrl = new URL("/login", req.url)
        return NextResponse.redirect(redirectUrl)
      }
    } catch (sessionError) {
      console.error("获取会话失败:", sessionError)
      // 继续处理请求
    }
  } catch (error) {
    console.error("中间件执行错误:", error)
    // 出错时继续处理请求，而不是阻止
    return res
  }

  return res
}

// 只对特定路径应用中间件
export const config = {
  matcher: ["/profile/:path*"],
}
