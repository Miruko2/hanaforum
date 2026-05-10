/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  swcMinify: true,
  
  // 开发环境：不使用静态导出，支持中间件和认证
  // output: 'export', // 在开发环境中禁用
  // trailingSlash: true,
  // skipTrailingSlashRedirect: true,
  // distDir: 'out',
  
  // 性能优化配置
  compress: true,
  poweredByHeader: false,
  
  // 编译优化
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 开发环境启用图像优化
  images: {
    // unoptimized: false, // 开发环境启用优化
    domains: [
      'localhost',
      'images.unsplash.com',
      'source.unsplash.com',
      'picsum.photos',
      'placehold.co',
      'placekitten.com',
      'dummyimage.com',
      'via.placeholder.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 实验性功能
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'http://localhost:3000',
        'https://localhost:3000',
        '*'
      ],
      bodySizeLimit: '2mb',
    },
    scrollRestoration: true,
    optimizeCss: true,
  },
  
  // 开发环境的头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ]
  },
}

export default nextConfig 