import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-full max-w-md mx-auto p-6 rounded-xl border border-lime-500/20 bg-black/40 text-center">
        <h2 className="text-3xl font-bold text-lime-400 mb-6">404 - 页面未找到</h2>
        <p className="text-white mb-8">抱歉，您请求的页面不存在或已被移动。</p>
        <Link
          href="/"
          className="inline-flex px-4 py-2 rounded-md bg-lime-500 hover:bg-lime-600 text-black font-medium transition-colors"
        >
          返回首页
        </Link>
      </div>
    </main>
  )
}
