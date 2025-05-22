"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabaseClient"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, RefreshCw, AlertCircle } from "lucide-react"

export default function AdminDebug() {
  const { user, isAdmin } = useAuth()
  const [adminRecord, setAdminRecord] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return

      setLoading(true)
      setError(null)

      try {
        // 直接从数据库查询管理员记录
        const { data, error } = await supabase.from("admin_users").select("*").eq("user_id", user.id).maybeSingle()

        if (error) {
          console.error("查询管理员记录错误:", error)
          setError(error.message)
          setAdminRecord(null)
        } else {
          setAdminRecord(data)
          console.log("管理员记录:", data)
        }
      } catch (err: any) {
        console.error("检查管理员状态时出错:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    checkAdminStatus()
  }, [user, refreshKey])

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const forceSetAdmin = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      // 检查是否已经是管理员
      const { data: existingAdmin } = await supabase
        .from("admin_users")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()

      if (existingAdmin) {
        console.log("用户已经是管理员")
      } else {
        // 添加为管理员
        const { error } = await supabase.from("admin_users").insert([{ user_id: user.id }])

        if (error) {
          console.error("添加管理员记录错误:", error)
          setError(error.message)
        } else {
          console.log("成功添加为管理员")
        }
      }

      // 刷新状态
      handleRefresh()
    } catch (err: any) {
      console.error("设置管理员时出错:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-500 flex items-center">
            <AlertCircle className="mr-2 h-5 w-5" />
            未登录
          </CardTitle>
          <CardDescription>您需要登录才能查看管理员状态</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className={isAdmin ? "text-green-500" : "text-gray-500"}>
          <div className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            管理员状态调试
          </div>
        </CardTitle>
        <CardDescription>检查和修复管理员权限问题</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="font-semibold">用户ID:</div>
          <div className="font-mono text-sm break-all">{user.id}</div>

          <div className="font-semibold">前端状态:</div>
          <div className={isAdmin ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
            {isAdmin ? "是管理员" : "不是管理员"}
          </div>

          <div className="font-semibold">数据库记录:</div>
          <div className={adminRecord ? "text-green-500 font-semibold" : "text-red-500 font-semibold"}>
            {loading ? "加载中..." : adminRecord ? "记录存在" : "记录不存在"}
          </div>
        </div>

        {error && <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 rounded-md">错误: {error}</div>}

        {adminRecord && (
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="font-semibold mb-2">管理员记录详情:</div>
            <pre className="text-xs overflow-auto">{JSON.stringify(adminRecord, null, 2)}</pre>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          刷新状态
        </Button>
        <Button onClick={forceSetAdmin} disabled={loading || !!adminRecord}>
          <Shield className="mr-2 h-4 w-4" />
          {adminRecord ? "已是管理员" : "强制设为管理员"}
        </Button>
      </CardFooter>
    </Card>
  )
}
