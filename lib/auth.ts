// lib/auth.ts
import { supabase } from "@/lib/supabaseClient"

export async function checkAuth() {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error("认证检查错误:", error)
      return false
    }

    if (!data.session) {
      console.warn("No session found")
      return false
    }

    return true
  } catch (err) {
    console.error("检查认证状态时出错:", err)
    return false
  }
}
