"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import CreatePostModal from "@/components/create-post-modal"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export default function FloatingActionButton() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // 修改 handleButtonClick 函数，使用缓存的认证状态
  const handleButtonClick = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "发布帖子前请先登录账号",
      })
      router.push("/login")
      return
    }

    // 直接打开模态框，避免不必要的认证检查
    // 认证状态已经在 AuthProvider 中处理
    setIsModalOpen(true)
  }

  const handlePostCreated = () => {
    // 刷新页面或通知父组件更新帖子列表
    window.location.reload()
  }

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-lime-500 hover:bg-lime-600 text-black shadow-lg hover:shadow-lime-500/30 hover:scale-110 transition-all duration-300 backdrop-blur-sm"
        onClick={handleButtonClick}
      >
        <Plus className="h-6 w-6" />
        <span className="absolute inset-0 rounded-full bg-lime-400/20 animate-ping"></span>
      </Button>

      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} onPostCreated={handlePostCreated} />}
    </>
  )
}
