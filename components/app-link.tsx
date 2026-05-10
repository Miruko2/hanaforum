'use client';

import { forwardRef, ReactNode } from 'react';
import { navigateTo } from '@/lib/app-navigation';

interface AppLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  replace?: boolean;
  delay?: number;
  [key: string]: any;
}

/**
 * AppLink - 一个简单的、直接的链接组件
 * 自动使用正确的导航方法
 */
const AppLink = forwardRef<HTMLAnchorElement, AppLinkProps>(({
  href,
  children,
  className,
  onClick,
  replace = false,
  delay = 0,
  ...rest
}, ref) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // 执行任何自定义点击处理
    if (onClick) {
      onClick(e);
    }
    
    // 使用我们的导航库
    navigateTo(href, { replace, delay });
  };
  
  return (
    <a
      ref={ref}
      href={href}
      onClick={handleClick}
      className={className}
      {...rest}
    >
      {children}
    </a>
  );
});

AppLink.displayName = 'AppLink';

export default AppLink; 