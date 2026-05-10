"use client"

import dynamic from "next/dynamic"

// 弹幕墙依赖 NotificationProvider / SimpleAuth / Realtime，
// 这些在 SSG 预渲染时不可用，因此跳过 SSR
const LiveWallContent = dynamic(
  () => import("@/components/live-wall-content"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center bg-black text-pink-300 font-mono">
        正在接入信号...
      </div>
    ),
  },
)

export default function LiveWallPage() {
  return <LiveWallContent />
}
