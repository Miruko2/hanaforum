"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { LogOut, User, Settings, Menu, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function Navbar() {
  const pathname = usePathname()
  const { user, signOut, isAdmin } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 确保组件在客户端渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // 返回一个占位符，避免水合不匹配
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="w-full h-6 bg-gray-800/50 animate-pulse rounded"></div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-gray-900/80 backdrop-blur-md border-b border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-lime-400 mr-8">
              萤火虫之国
            </Link>

            {/* 桌面导航 */}
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/"
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === "/"
                    ? "bg-lime-900/20 text-lime-400"
                    : "text-gray-300 hover:text-lime-400 hover:bg-lime-900/10",
                )}
              >
                首页
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === "/admin"
                      ? "bg-lime-900/20 text-lime-400"
                      : "text-gray-300 hover:text-lime-400 hover:bg-lime-900/10",
                  )}
                >
                  管理
                </Link>
              )}
              <Link
                href="/profile"
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === "/profile"
                    ? "bg-lime-900/20 text-lime-400"
                    : "text-gray-300 hover:text-lime-400 hover:bg-lime-900/10",
                )}
              >
                个人中心
              </Link>
            </nav>
          </div>

          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="flex h-full w-full items-center justify-center rounded-full bg-lime-900/30 text-lime-400">
                      {user.user_metadata?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-gray-900 border-gray-800 text-gray-200">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-lime-400">
                        {user.user_metadata?.username || "用户"}
                        {isAdmin && <span className="ml-2 text-xs bg-red-900 text-red-200 px-1 rounded">管理员</span>}
                      </p>
                      <p className="text-xs leading-none text-gray-400">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-gray-800 hover:text-lime-400 focus:bg-gray-800"
                    asChild
                  >
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      <span>个人中心</span>
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem
                      className="cursor-pointer hover:bg-gray-800 hover:text-lime-400 focus:bg-gray-800"
                      asChild
                    >
                      <Link href="/admin">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>管理面板</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gray-800" />
                  <DropdownMenuItem
                    className="cursor-pointer text-red-400 hover:bg-gray-800 hover:text-red-300 focus:bg-gray-800"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>退出登录</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden md:flex space-x-2">
                <Button asChild variant="ghost" className="text-gray-300 hover:text-lime-400">
                  <Link href="/login">登录</Link>
                </Button>
                <Button asChild variant="outline" className="border-lime-700 text-lime-400 hover:bg-lime-900/20">
                  <Link href="/register">注册</Link>
                </Button>
              </div>
            )}

            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden ml-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* 移动端菜单 */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900/95 border-b border-gray-800">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col space-y-2">
              <Link
                href="/"
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === "/"
                    ? "bg-lime-900/20 text-lime-400"
                    : "text-gray-300 hover:text-lime-400 hover:bg-lime-900/10",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                首页
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    pathname === "/admin"
                      ? "bg-lime-900/20 text-lime-400"
                      : "text-gray-300 hover:text-lime-400 hover:bg-lime-900/10",
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  管理
                </Link>
              )}
              <Link
                href="/profile"
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === "/profile"
                    ? "bg-lime-900/20 text-lime-400"
                    : "text-gray-300 hover:text-lime-400 hover:bg-lime-900/10",
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                个人中心
              </Link>
              {!user && (
                <>
                  <Link
                    href="/login"
                    className="px-3 py-2 text-sm font-medium rounded-md text-gray-300 hover:text-lime-400 hover:bg-lime-900/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="px-3 py-2 text-sm font-medium rounded-md text-lime-400 bg-lime-900/20 hover:bg-lime-900/30"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    注册
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
