"use client"

import { useState, useEffect, type ReactNode } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { SimpleAuthProvider } from "@/contexts/auth-context-simple"
import { PostsProvider } from "@/contexts/posts-context"
import PageTransition from "@/components/page-transition"
import Script from "next/script"
import dynamic from "next/dynamic"

// NotificationProvider 需要同步加载（Navigation 和页面都依赖其 Context）
import { NotificationProvider } from "@/contexts/notification-context"

// 延迟加载非首屏必需的纯 UI 组件
const Navigation = dynamic(() => import("@/components/navigation"), { ssr: false })
const Toaster = dynamic(
  () => import("@/components/ui/toaster").then(mod => ({ default: mod.Toaster })),
  { ssr: false }
)

// 延迟加载包装器
function LazyMount({ children, delay = 150 }: { children: ReactNode; delay?: number }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(t)
  }, [delay])
  if (!mounted) return null
  return <>{children}</>
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <SimpleAuthProvider>
        <PostsProvider>
          <Script id="page-refresh-detection" strategy="beforeInteractive">
            {`
              if (typeof sessionStorage !== 'undefined') {
                const modalOpen = sessionStorage.getItem('modalOpen');
                if (modalOpen === 'true') {
                  sessionStorage.setItem('pageRefreshed', 'true');
                }
                const scrollPos = sessionStorage.getItem('forumScrollPosition');
                if (scrollPos) {
                  window.addEventListener('load', function() {
                    setTimeout(function() {
                      window.scrollTo({ top: parseInt(scrollPos, 10), behavior: 'auto' });
                    }, 100);
                  });
                }
              }
            `}
          </Script>

          {/* NotificationProvider 必须包裹所有使用 useNotifications 的组件（Navigation、页面等） */}
          <NotificationProvider>
            {/* 首屏内容：立即渲染 */}
            <PageTransition>
              {children}
            </PageTransition>

            {/* 延迟加载：导航栏 */}
            <LazyMount delay={100}>
              <Navigation />
            </LazyMount>

            {/* Toaster 延迟加载 */}
            <LazyMount delay={200}>
              <Toaster />
            </LazyMount>
          </NotificationProvider>
        </PostsProvider>
      </SimpleAuthProvider>
    </ThemeProvider>
  )
}
