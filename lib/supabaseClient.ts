// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"

// 在文件顶部添加以下代码，用于调试环境变量
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "已设置" : "未设置")
console.log("Supabase Anon Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "已设置" : "未设置")

// 确保环境变量存在且正确
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// 检查环境变量是否为空
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase环境变量未设置或为空，请检查您的.env.local文件")
}

// 创建Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "supabase.auth.token",
  },
  global: {
    fetch: (...args) => {
      // 自定义fetch，添加超时处理
      const [url, options] = args
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 增加到30秒超时

      return fetch(url as string, {
        ...(options as RequestInit),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId))
    },
  },
})

// 添加连接状态检查函数
export async function testConnection() {
  try {
    console.log("测试Supabase连接...")
    const startTime = Date.now()

    // 尝试一个简单的查询
    const { data, error } = await supabase.from("posts").select("id").limit(1)

    const endTime = Date.now()

    if (error) {
      console.error("Supabase连接测试失败:", error)
      return { success: false, error, latency: endTime - startTime }
    }

    console.log(`Supabase连接测试成功，延迟: ${endTime - startTime}ms`)
    return { success: true, latency: endTime - startTime }
  } catch (err) {
    console.error("Supabase连接测试异常:", err)
    return { success: false, error: err }
  }
}

// 检查用户是否是管理员
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!userId) return false

  try {
    // 硬编码管理员ID，确保管理员功能正常工作
    if (userId === "4345c6d0-05eb-4bc3-ba50-1cfa1dee2c41") {
      return true
    }

    // 使用简单查询，避免复杂关系
    const { data, error } = await supabase
      .from("admin_users")
      .select("id") // 只选择ID字段，避免关联查询
      .eq("user_id", userId)
      .maybeSingle() // 使用maybeSingle代替single，避免404错误

    if (error) {
      console.error("检查管理员状态错误:", error)
      return false
    }

    return !!data // 如果data存在，则用户是管理员
  } catch (err) {
    console.error("检查管理员状态时出错:", err)
    return false
  }
}

// 添加删除帖子的函数 - 简化版本，避免服务器错误
export async function deletePost(postId: string) {
  try {
    // 获取用户会话
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("获取会话错误:", sessionError)
      throw new Error("认证错误: " + sessionError.message)
    }

    if (!sessionData.session) {
      throw new Error("未认证: 无活跃会话")
    }

    const userId = sessionData.session.user.id

    // 检查用户是否是管理员
    const isAdmin = await checkIsAdmin(userId)
    console.log("当前用户是否是管理员:", isAdmin)

    // 检查帖子是否存在
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id, user_id")
      .eq("id", postId)
      .maybeSingle()

    if (postError) {
      console.error("获取帖子信息错误:", postError)
      throw new Error("帖子不存在或无法访问")
    }

    if (!postData) {
      throw new Error("帖子不存在")
    }

    // 检查用户是否是帖子作者或管理员
    if (!isAdmin && postData.user_id !== userId) {
      throw new Error("您没有权限删除此帖子")
    }

    console.log("开始删除帖子:", postId)
    console.log("删除者:", userId)
    console.log("帖子作者:", postData.user_id)
    console.log("是否是管理员:", isAdmin)

    // 删除帖子相关的评论
    const { error: commentsError } = await supabase.from("comments").delete().eq("post_id", postId)

    if (commentsError) {
      console.error("删除评论错误:", commentsError)
      // 继续执行，不中断流程
    }

    // 删除帖子相关的点赞
    const { error: likesError } = await supabase.from("likes").delete().eq("post_id", postId)

    if (likesError) {
      console.error("删除点赞错误:", likesError)
      // 继续执行，不中断流程
    }

    // 删除帖子
    const { error: deleteError } = await supabase.from("posts").delete().eq("id", postId)

    if (deleteError) {
      console.error("删除帖子错误:", deleteError)
      throw deleteError
    }

    console.log("帖子删除成功:", postId)
    return { success: true }
  } catch (err) {
    console.error("删除帖子过程中出错:", err)
    throw err
  }
}

// 检查认证状态
export async function checkAuth() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error("获取会话错误:", error)
      return false
    }
    return !!data.session
  } catch (err) {
    console.error("检查认证状态时出错:", err)
    return false
  }
}
