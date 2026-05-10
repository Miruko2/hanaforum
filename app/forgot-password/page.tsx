import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ForgotPasswordPage() {
  // 百叶窗效果样式
  const blindsOverlayStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundImage: `repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, 0.15),
      rgba(0, 0, 0, 0.15) 2px,
      rgba(0, 0, 0, 0.03) 2px,
      rgba(0, 0, 0, 0.03) 4px
    )`,
    pointerEvents: 'none' as const,
    zIndex: 0,
    backdropFilter: 'blur(0.7px)',
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative">
      {/* 百叶窗效果 */}
      <div style={blindsOverlayStyle}></div>
      
      <div className="w-full max-w-md p-6 rounded-xl glass-card neon-border z-10 relative">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold text-lime-400">重置密码</h1>
          <p className="text-gray-400">
            密码重置功能正在开发中
          </p>
          <p className="text-sm text-gray-500">
            如需重置密码，请联系管理员
          </p>
          <Link href="/login">
            <Button className="w-full bg-lime-600 hover:bg-lime-700 text-white">
              返回登录
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
} 