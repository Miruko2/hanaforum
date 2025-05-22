// app/profile/page.tsx
"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Navbar from "@/components/navbar"
import BackgroundEffects from "@/components/background-effects"

export default function ProfilePage() {
  const { user } = useAuth()
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        // 首先尝试从用户元数据中获取用户名
        if (user.user_metadata?.username) {
          setUsername(user.user_metadata.username)
          setLoading(false)
          return
        }

        // 如果元数据中没有，则从profiles表中获取
        const { data, error } = await supabase.from("profiles").select("username").eq("id", user.id).single()

        if (!error && data) {
          setUsername(data.username || "")
        }

        setLoading(false)
      }

      fetchProfile()
    }
  }, [user])

  const updateProfile = async () => {
    if (!user) return

    setUpdating(true)
    setMessage("")

    try {
      // 更新profiles表
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: user.id,
        username,
        updated_at: new Date().toISOString(),
      })

      if (profileError) throw profileError

      // 同时更新用户元数据
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { username },
      })

      if (metadataError) throw metadataError

      setMessage("资料已更新")
    } catch (error: any) {
      setMessage(`错误: ${error.message}`)
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <BackgroundEffects />
        <Navbar />
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <div>加载中...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen">
      <BackgroundEffects />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto glass-card p-6 rounded-xl">
          <h2 className="text-2xl font-bold text-center text-lime-400 mb-6">个人资料</h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ""}
                disabled
                className="bg-black/30 border-gray-800"
              />
            </div>

            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-black/30 border-gray-800 focus:border-lime-500/50"
              />
            </div>

            {message && (
              <div className={`text-sm ${message.includes("错误") ? "text-red-500" : "text-green-500"}`}>{message}</div>
            )}

            <Button
              onClick={updateProfile}
              disabled={updating}
              className="w-full bg-lime-500 hover:bg-lime-600 text-black"
            >
              {updating ? "更新中..." : "更新资料"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}
