// app/profile/page.tsx
"use client"

import { useSimpleAuth } from "@/contexts/auth-context-simple"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabaseClient"
import Navbar from "@/components/navbar"
import BackgroundEffects from "@/components/background-effects"
import { Bell, LogOut, ChevronRight, Camera, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ProfilePage() {
  const { user, signOut } = useSimpleAuth()
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        // 先从 metadata 取 username
        if (user.user_metadata?.username) {
          setUsername(user.user_metadata.username)
        }
        // 从 profiles 表取 avatar_url 和 username
        const { data, error } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", user.id)
          .single()
        if (!error && data) {
          if (data.username) setUsername(data.username)
          setAvatarUrl(data.avatar_url || null)
        }
        setLoading(false)
      }
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // 验证文件类型
    if (!file.type.startsWith("image/")) {
      alert("请选择图片文件")
      return
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("图片大小不能超过 5MB")
      return
    }

    setUploading(true)

    try {
      // 生成唯一文件名: userId/timestamp.ext
      const ext = file.name.split(".").pop() || "jpg"
      const filePath = `${user.id}/${Date.now()}.${ext}`

      // 上传到 avatars bucket
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) {
        console.error("上传失败:", uploadError)
        alert("头像上传失败: " + uploadError.message)
        setUploading(false)
        return
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl

      // 更新 profiles 表
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id)

      if (updateError) {
        console.error("更新头像URL失败:", updateError)
        alert("头像上传成功但更新记录失败")
      } else {
        setAvatarUrl(publicUrl)
      }
    } catch (err) {
      console.error("头像上传异常:", err)
      alert("上传出错，请重试")
    } finally {
      setUploading(false)
      // 清空 input 以便重复选择同一文件
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen">
        <BackgroundEffects />
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-400">加载中...</div>
        </div>
      </main>
    )
  }

  const avatarLetter =
    username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"

  return (
    <main className="min-h-screen">
      <BackgroundEffects />
      <Navbar />

      <div className="flex items-center justify-center min-h-screen px-4 pt-20">
        <div className="w-full max-w-lg space-y-6">
          {/* 用户信息卡片 */}
          <div className="profile-glass rounded-2xl p-10">
            <div className="flex flex-col items-center space-y-4">
              {/* 头像区域 */}
              <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
                {/* 头像外圈 lime 色光环，hover 时亮起 */}
                <div
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    boxShadow:
                      "0 0 0 2px rgba(132,204,22,0.4), 0 0 30px rgba(132,204,22,0.5)",
                  }}
                />
                <div className="w-28 h-28 rounded-full overflow-hidden bg-lime-900/30 flex items-center justify-center border border-white/10 transition-transform duration-300 group-hover:scale-[1.03]">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="头像"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-lime-400">
                      {avatarLetter}
                    </span>
                  )}
                </div>
                {/* 悬浮遮罩 */}
                <div className="absolute inset-0 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              <h2 className="text-2xl font-bold text-white">
                {username || "用户"}
              </h2>
              <p className="text-sm text-white/50">{user?.email}</p>
            </div>
          </div>

          {/* 选项列表 */}
          <div className="profile-glass rounded-2xl">
            <button
              className="profile-menu-item"
              onClick={handleAvatarClick}
            >
              <div className="flex items-center space-x-3">
                <Camera className="w-5 h-5 text-lime-400" />
                <span className="text-white">编辑头像</span>
              </div>
              <ChevronRight className="profile-menu-arrow w-5 h-5 text-white/40" />
            </button>

            <div className="h-px bg-white/5 mx-6" />

            <button
              className="profile-menu-item"
              onClick={() => router.push("/notifications")}
            >
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-lime-400" />
                <span className="text-white">通知</span>
              </div>
              <ChevronRight className="profile-menu-arrow w-5 h-5 text-white/40" />
            </button>

            <div className="h-px bg-white/5 mx-6 md:hidden" />

            <button
              className="profile-menu-item md:hidden"
              onClick={() => router.push("/live")}
            >
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-lime-400" />
                <span className="text-white">弹幕墙</span>
              </div>
              <ChevronRight className="profile-menu-arrow w-5 h-5 text-white/40" />
            </button>

            <div className="h-px bg-white/5 mx-6 md:hidden" />

            <button
              className="profile-menu-item danger"
              onClick={handleSignOut}
            >
              <div className="flex items-center space-x-3">
                <LogOut className="w-5 h-5 text-red-400" />
                <span className="text-red-400">退出登录</span>
              </div>
              <ChevronRight className="profile-menu-arrow w-5 h-5 text-white/40" />
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
