import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "论坛",
  description: "一个简单的论坛应用",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 确保背景图片URL正确，并添加一个不透明度叠加
  const bgStyle = {
    backgroundImage: "url('/mos-design-xGc2QsidjHA-unsplash.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
    position: "relative" as const,
  };

  // 添加半透明层，确保内容可读性
  const overlayStyle = {
    content: '""',
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.2)", // 轻微暗化背景
    zIndex: -1,
    pointerEvents: "none" as const,
  };

  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 预加载关键资源，加速首屏渲染 */}
        <link rel="preload" href="/mos-design-xGc2QsidjHA-unsplash.jpg" as="image" />
      </head>
      <body
        className={`${inter.className} bg-transparent`}
        style={bgStyle}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
