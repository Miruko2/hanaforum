"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, ImageIcon, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPortal } from "react-dom"

interface CreatePostModalProps {
  onClose: () => void
}

export default function CreatePostModal({ onClose }: CreatePostModalProps) {
  const [content, setContent] = useState("")
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const previousOverflow = useRef<string>("")

  // 客户端挂载检查
  useEffect(() => {
    setIsMounted(true)
    // 保存当前overflow值并锁定背景滚动
    previousOverflow.current = document.body.style.overflow
    document.body.style.overflow = "hidden"
    document.body.style.touchAction = "none" // 防止移动端滚动

    return () => {
      setIsMounted(false)
      // 恢复背景滚动
      document.body.style.overflow = previousOverflow.current
      document.body.style.touchAction = ""
    }
  }, [])

  // 监听ESC键关闭模态框
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 处理发送帖子
  const handleSubmit = () => {
    // 这里可以添加发送帖子的逻辑
    console.log({ title, content, category, imagePreview })
    onClose()
  }

  // 点击上传图片按钮
  const handleImageButtonClick = () => {
    fileInputRef.current?.click()
  }

  if (!isMounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      <div
        ref={modalRef}
        className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto m-4 rounded-xl glass-card active content-glass animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          className="absolute top-3 right-3 z-10 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70 hover:text-lime-400 transition-colors duration-300"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-5 frosted-glass">
          <h3 className="text-xl font-semibold text-white mb-5 neon-text">创建新帖子</h3>

          <div className="space-y-4">
            {/* 标题输入 */}
            <div>
              <Label htmlFor="post-title" className="text-lime-400 mb-1 block">
                标题
              </Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入帖子标题..."
                className="bg-black/30 border-gray-800 focus:border-lime-500/50 text-white focus:ring-lime-500/30"
              />
            </div>

            {/* 分类输入 */}
            <div>
              <Label htmlFor="post-category" className="text-lime-400 mb-1 block">
                分类
              </Label>
              <Input
                id="post-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="输入帖子分类..."
                className="bg-black/30 border-gray-800 focus:border-lime-500/50 text-white focus:ring-lime-500/30"
              />
            </div>

            {/* 内容输入 */}
            <div>
              <Label htmlFor="post-content" className="text-lime-400 mb-1 block">
                内容
              </Label>
              <Textarea
                id="post-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="分享你的想法..."
                className="min-h-[150px] bg-black/30 border-gray-800 focus:border-lime-500/50 text-white focus:ring-lime-500/30"
              />
            </div>

            {/* 图片预览 */}
            {imagePreview && (
              <div className="relative mt-4 rounded-lg overflow-hidden border border-lime-500/30">
                <img
                  src={imagePreview || "/placeholder.svg"}
                  alt="Preview"
                  className="w-full h-auto max-h-[200px] object-contain"
                />
                <button
                  className="absolute top-2 right-2 rounded-full bg-black/70 p-1 text-white hover:text-lime-400"
                  onClick={() => setImagePreview(null)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* 隐藏的文件输入 */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
              id="image-upload"
            />

            {/* 操作按钮 */}
            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleImageButtonClick}
                className="border-lime-500/50 text-lime-400 hover:bg-lime-950/50 hover:text-lime-300"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                上传图片
              </Button>

              <Button
                type="button"
                onClick={handleSubmit}
                className="bg-lime-500 hover:bg-lime-600 text-black font-medium shadow-lg hover:shadow-lime-500/30"
                disabled={!title.trim() || !content.trim()}
              >
                <Send className="h-4 w-4 mr-2" />
                发布帖子
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
