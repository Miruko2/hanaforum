"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { useSimpleAuth } from "@/contexts/auth-context-simple"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

const CreatePostModal = dynamic(() => import("@/components/create-post-modal"), { ssr: false })

interface FloatingActionButtonProps {
  onPostCreated?: () => void
}

export default function FloatingActionButton({ onPostCreated }: FloatingActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { user } = useSimpleAuth()
  const router = useRouter()
  const { toast } = useToast()

  // 修改 handleButtonClick 函数
  const handleButtonClick = async () => {
    if (!user) {
      toast({
        title: "请先登录",
        description: "发布帖子前请先登录账号",
      })
      
      // 使用标准的 Next.js 导航
      router.push('/login')
      return
    }

    // 直接打开模态框，避免不必要的认证检查
    setIsModalOpen(true)
  }

  const handlePostCreated = () => {
    console.log('[发帖] 帖子创建成功，触发UI更新');
    
    // 关闭模态框
    setIsModalOpen(false);
    
    // 如果有传入的回调函数，优先使用
    if (onPostCreated) {
      onPostCreated();
    } else {
      // 显示成功消息
      toast({
        title: "发布成功",
        description: "帖子已发布，正在刷新列表...",
        duration: 3000,
      });
    }
  }

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-lime-500 hover:bg-lime-600 text-black shadow-lg hover:shadow-lime-500/30 hover:scale-110 transition-all duration-300 backdrop-blur-sm gpu-accelerated z-[999]"
        style={{ zIndex: 999 }} // 使用内联样式确保高优先级
        onClick={handleButtonClick}
      >
        <Plus className="h-6 w-6" />
        <span className="absolute inset-0 rounded-full bg-lime-400/20 animate-ping animation-optimized"></span>
      </Button>

      {isModalOpen && <CreatePostModal onClose={() => setIsModalOpen(false)} onPostCreated={handlePostCreated} />}
    </>
  )
}
