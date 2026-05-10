"use client";

import dynamic from "next/dynamic";

// 通知页面依赖 NotificationProvider Context，SSG 预渲染时不可用
// 因此用 dynamic import 跳过 SSR，视觉效果完全一致
const NotificationsContent = dynamic(
  () => import("@/components/notifications-content"),
  { ssr: false, loading: () => <div className="py-12 text-center text-gray-500">加载中...</div> }
);

export default function NotificationsPage() {
  return <NotificationsContent />;
}
