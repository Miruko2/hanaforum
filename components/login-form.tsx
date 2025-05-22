"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn, connectionStatus } = useAuth()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("请填写所有必填字段")
      return
    }

    // 检查连接状态
    if (connectionStatus === "disconnected") {
      toast({
        title: "连接错误",
        description: "无法连接到服务器，请检查网络连接后重试",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const { error } = await signIn(email, password)

      if (error) {
        setError(error.message || "登录失败，请检查您的凭据")
      } else {
        router.push("/")
      }
    } catch (err: any) {
      setError(err.message || "登录过程中发生错误")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6 p-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold text-lime-400">欢迎回来</h1>
        <p className="text-gray-400">请登录您的账号</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-md bg-red-900/30 text-red-400 text-sm">{error}</div>}

        {connectionStatus === "checking" && (
          <div className="p-3 rounded-md bg-yellow-900/30 text-yellow-400 text-sm flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            正在检查连接状态...
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 focus:border-lime-500 text-white"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">密码</Label>
            <Link href="/forgot-password" className="text-xs text-lime-400 hover:text-lime-300">
              忘记密码?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-gray-800/50 border-gray-700 focus:border-lime-500 text-white"
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-lime-600 hover:bg-lime-700 text-white"
          disabled={isLoading || connectionStatus === "checking"}
        >
          {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {isLoading ? "登录中..." : "登录"}
        </Button>
      </form>
      <div className="text-center text-sm">
        <span className="text-gray-400">还没有账号? </span>
        <Link href="/register" className="text-lime-400 hover:text-lime-300">
          立即注册
        </Link>
      </div>
    </div>
  )
}
