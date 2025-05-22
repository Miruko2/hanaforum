// components/auth/register-form.tsx
"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [username, setUsername] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // 注册用户，并将用户名添加到用户元数据中
      await signUp(email, password, username)

      // 注册成功后重定向到登录页
      router.push("/login")
    } catch (err: any) {
      setError(err.message || "注册失败")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto glass-card p-6 rounded-xl">
      <h2 className="text-2xl font-bold text-center text-lime-400 mb-6">注册</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="space-y-2">
          <Label htmlFor="username">用户名</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="bg-black/30 border-gray-800 focus:border-lime-500/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">邮箱</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-black/30 border-gray-800 focus:border-lime-500/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-black/30 border-gray-800 focus:border-lime-500/50"
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-lime-500 hover:bg-lime-600 text-black">
          {loading ? "注册中..." : "注册"}
        </Button>
      </form>
    </div>
  )
}
