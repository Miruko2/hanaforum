"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase, testConnection } from "@/lib/supabaseClient"
import { checkIsAdmin } from "@/lib/supabaseClient"
import type { User } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  isAdmin: boolean
  loading: boolean
  connectionStatus: "connected" | "disconnected" | "checking"
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, username: string) => Promise<{ error: any; data: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAdmin: false,
  loading: true,
  connectionStatus: "checking",
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const { toast } = useToast()

  // 测试数据库连接
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus("checking")
        const result = await testConnection()

        if (result.success) {
          setConnectionStatus("connected")
          console.log("数据库连接成功，延迟:", result.latency, "ms")
        } else {
          setConnectionStatus("disconnected")
          console.error("数据库连接失败:", result.error)
          toast({
            title: "连接错误",
            description: "无法连接到数据库，部分功能可能不可用",
            variant: "destructive",
          })
        }
      } catch (err) {
        setConnectionStatus("disconnected")
        console.error("检查连接时出错:", err)
      }
    }

    checkConnection()

    // 定期检查连接状态
    const intervalId = setInterval(checkConnection, 60000) // 每分钟检查一次

    return () => clearInterval(intervalId)
  }, [toast])

  useEffect(() => {
    // 获取当前会话
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error("获取会话错误:", error)
          setLoading(false)
          return
        }

        if (data.session) {
          setUser(data.session.user)

          // 检查用户是否是管理员
          const adminStatus = await checkIsAdmin(data.session.user.id)
          setIsAdmin(adminStatus)
        }
      } catch (err) {
        console.error("获取会话时出错:", err)
      } finally {
        setLoading(false)
      }
    }

    // 设置认证状态变化监听器
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("认证状态变化:", event)
      if (session) {
        setUser(session.user)

        // 检查用户是否是管理员
        const adminStatus = await checkIsAdmin(session.user.id)
        setIsAdmin(adminStatus)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })

    getSession()

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      // 先检查连接状态
      if (connectionStatus !== "connected") {
        const connectionTest = await testConnection()
        if (!connectionTest.success) {
          toast({
            title: "连接错误",
            description: "无法连接到服务器，请检查网络连接后重试",
            variant: "destructive",
          })
          return { error: new Error("无法连接到服务器") }
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: "登录失败",
          description: error.message,
          variant: "destructive",
        })
      }

      return { error }
    } catch (error: any) {
      console.error("登录错误:", error)
      toast({
        title: "登录失败",
        description: error.message || "登录过程中发生错误",
        variant: "destructive",
      })
      return { error }
    }
  }

  const signUp = async (email: string, password: string, username: string) => {
    try {
      // 先检查连接状态
      if (connectionStatus !== "connected") {
        const connectionTest = await testConnection()
        if (!connectionTest.success) {
          toast({
            title: "连接错误",
            description: "无法连接到服务器，请检查网络连接后重试",
            variant: "destructive",
          })
          return { error: new Error("无法连接到服务器"), data: null }
        }
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
        },
      })

      if (error) {
        toast({
          title: "注册失败",
          description: error.message,
          variant: "destructive",
        })
        return { error, data: null }
      }

      if (!data.user) {
        return { error: null, data }
      }

      // 创建用户资料
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: data.user.id,
          username,
          email,
        },
      ])

      if (profileError) {
        console.error("创建用户资料错误:", profileError)
        toast({
          title: "注册成功但创建资料失败",
          description: "您的账户已创建，但个人资料设置失败",
          variant: "destructive",
        })
        return { error: profileError, data }
      }

      toast({
        title: "注册成功",
        description: "您的账户已成功创建",
      })
      return { data, error: null }
    } catch (error: any) {
      console.error("注册错误:", error)
      toast({
        title: "注册失败",
        description: error.message || "注册过程中发生错误",
        variant: "destructive",
      })
      return { error, data: null }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      toast({
        title: "已退出登录",
        description: "您已成功退出登录",
      })
    } catch (error: any) {
      console.error("登出错误:", error)
      toast({
        title: "退出登录失败",
        description: error.message || "退出登录过程中发生错误",
        variant: "destructive",
      })
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast({
          title: "重置密码失败",
          description: error.message,
          variant: "destructive",
        })
      } else {
        toast({
          title: "重置密码邮件已发送",
          description: "请检查您的邮箱，按照邮件中的指示重置密码",
        })
      }

      return { error }
    } catch (error: any) {
      console.error("重置密码错误:", error)
      toast({
        title: "重置密码失败",
        description: error.message || "重置密码过程中发生错误",
        variant: "destructive",
      })
      return { error }
    }
  }

  const value = {
    user,
    isAdmin,
    loading,
    connectionStatus,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
