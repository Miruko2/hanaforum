'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-6xl font-bold text-red-500 mb-4">500</h1>
            <h2 className="text-2xl font-semibold text-white mb-2">服务器错误</h2>
            <p className="text-gray-400">抱歉，服务器遇到了一个错误。</p>
          </div>
          
          <div className="space-y-4">
            <button
              onClick={reset}
              className="inline-block px-6 py-3 bg-lime-500 hover:bg-lime-600 text-black font-medium rounded-lg transition-colors duration-200"
            >
              重试
            </button>
            
            <div>
              <a 
                href="/"
                className="text-lime-400 hover:text-lime-300 underline"
              >
                返回首页
              </a>
            </div>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-8 text-left text-sm">
              <summary className="text-gray-400 cursor-pointer">错误详情</summary>
              <pre className="mt-2 p-4 bg-gray-900 rounded text-red-400 overflow-auto">
                {error.message}
              </pre>
            </details>
          )}
        </div>
      </body>
    </html>
  )
} 