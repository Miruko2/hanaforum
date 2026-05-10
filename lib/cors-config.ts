// CORS配置文件 - 处理多个域名的访问控制
// 支持https://momotalk.miruko.fun和http://156.224.19.44:3000以及Android应用

/**
 * 默认CORS头配置，允许访问必要的Supabase资源
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // 使用动态替换，这只是一个占位符
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, Origin, Accept, X-Requested-With',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Max-Age': '3600',
}

/**
 * 获取适用于请求来源的允许域名
 * @param requestOrigin 请求的Origin头
 * @returns 应该在响应中使用的Access-Control-Allow-Origin值
 */
export const getAllowedOrigin = (requestOrigin: string | null): string => {
  const allowedOrigins = [
    'https://momotalk.miruko.fun',
    'http://momotalk.miruko.fun',
    'http://156.224.19.44:3000',
    'http://156.224.19.44',
    'http://localhost:3000',
    'capacitor://localhost',
    'http://localhost'
  ];
  
  // 检测是否是Android应用中的请求
  const isAndroidApp = typeof window !== 'undefined' && 
    (window.navigator.userAgent.includes('Android') || 
     window.navigator.userAgent.includes('capacitor'));
  
  // 应用环境放宽CORS限制
  if (isAndroidApp) {
    return requestOrigin || '*';
  }
  
  // 如果请求来源在允许列表中，返回该来源
  if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  
  // IP访问环境放宽限制
  if (isIpAccess() && requestOrigin) {
    return requestOrigin;
  }
  
  // 默认返回主域名
  return 'https://momotalk.miruko.fun';
}

/**
 * 根据请求来源生成完整的CORS头
 * @param requestOrigin 请求的Origin头
 * @returns 完整的CORS头对象
 */
export const generateCorsHeaders = (requestOrigin: string | null): Record<string, string> => {
  // 检测环境
  const isHttps = isHttpsEnvironment();
  const isApp = typeof window !== 'undefined' && 
    (window.navigator.userAgent.includes('Android') || 
     window.navigator.userAgent.includes('capacitor'));
  const isIp = isIpAccess();
  
  // 根据环境定制CORS头
  let headers = {...corsHeaders};
  
  // 设置允许的来源
  headers['Access-Control-Allow-Origin'] = getAllowedOrigin(requestOrigin);
  
  // 在Android应用环境中，强制允许凭证
  if (isApp) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  // 在IP访问环境中，更保守地设置凭证
  else if (isIp) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  // 在HTTPS环境中，要求具体来源
  else if (isHttps) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  return headers;
}

/**
 * 判断当前环境是否为HTTPS
 * 仅在浏览器环境中有效
 */
export const isHttpsEnvironment = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }
  return false;
}

/**
 * 判断当前环境是否为IP直接访问
 * 仅在浏览器环境中有效
 */
export const isIpAccess = (): boolean => {
  if (typeof window !== 'undefined') {
    return /^http:\/\/\d+\.\d+\.\d+\.\d+/.test(window.location.href);
  }
  return false;
}

/**
 * 判断是否在Android应用环境中
 */
export const isAndroidApp = (): boolean => {
  if (typeof window !== 'undefined') {
    return window.navigator.userAgent.includes('Android') || 
           window.navigator.userAgent.includes('capacitor');
  }
  return false;
}

/**
 * 获取当前请求的Origin
 */
export const getCurrentOrigin = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://momotalk.miruko.fun';
} 