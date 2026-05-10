// app-pull-refresh.js - Android应用下拉刷新功能
// 支持用户手势下拉刷新数据

(function() {
  console.log('📱 Android应用下拉刷新功能初始化');
  
  // 检查是否在应用环境中
  const isAppEnvironment = () => {
    return typeof window !== 'undefined' && 
      (window.navigator.userAgent.includes('capacitor') || 
       window.navigator.userAgent.includes('android') ||
       /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  };
  
  // 如果不是应用环境，不执行后续代码
  if (!isAppEnvironment()) {
    console.log('非应用环境，跳过下拉刷新功能');
    return;
  }

  // 状态变量
  let startY = 0;
  let currentY = 0;
  let refreshDistance = 150; // 增加下拉触发距离，避免误触
  let maxPullDistance = 200; // 最大下拉距离
  let isDragging = false;
  let isRefreshing = false;
  let refreshIndicator = null;
  let refreshTimeout = null;
  let isEnabled = true; // 控制下拉刷新是否启用
  let disableRefreshOnCurrentPage = false; // 在当前页面上禁用下拉刷新
  
  // 检查是否在特定区域(表单，登录页等)禁用下拉刷新
  function shouldDisableInCurrentContext() {
    // 检查URL路径 - 在所有关键页面上禁用
    if (window.location.pathname === '/login' || 
        window.location.pathname === '/register' || 
        window.location.pathname.includes('/edit') ||
        window.location.pathname.includes('/create') ||
        window.location.pathname.includes('/post') ||
        window.location.pathname.includes('/admin') ||
        window.location.pathname.includes('/profile')) {
      return true;
    }
    
    // 如果全局应用刷新状态已禁用重定向，禁用下拉刷新
    if (window.appRefreshState && window.appRefreshState.disableAutoRedirect) {
      return true;
    }
    
    // 检查当前是否有激活的表单元素
    const activeElement = document.activeElement;
    if (activeElement && 
        (activeElement.tagName === 'INPUT' || 
         activeElement.tagName === 'TEXTAREA' || 
         activeElement.tagName === 'SELECT' ||
         activeElement.contentEditable === 'true' ||
         activeElement.isContentEditable)) {
      return true;
    }
    
    // 检查是否在模态框或对话框中
    const modalElements = document.querySelectorAll('[role="dialog"], .modal, .dialog, [aria-modal="true"]');
    if (modalElements.length > 0) {
      return true;
    }
    
    // 检查是否有表单在页面上
    const forms = document.querySelectorAll('form, [role="form"]');
    for (const form of forms) {
      // 检查表单是否在可视区域内
      const rect = form.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        return true; // 表单在可视区域内
      }
    }
    
    // 检查登录/注册/发帖相关元素是否存在
    if (document.querySelector('#login-form, .login-form, #register-form, .register-form, #post-form, .post-form, [data-form-type="login"], [data-form-type="register"], [data-form-type="post"]')) {
      return true;
    }
    
    // 查找是否有带"登录"、"注册"、"发帖"文本的元素
    const pageText = document.body.innerText.toLowerCase();
    if (pageText.includes('登录') && (pageText.includes('密码') || pageText.includes('邮箱'))) {
      return true; // 可能是登录页面
    }
    
    return disableRefreshOnCurrentPage; // 返回全局禁用标志
  }
  
  // 创建刷新指示器
  function createRefreshIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'app-refresh-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.1);
      transform: translateY(-100%);
      transition: transform 0.2s;
      z-index: 9999;
      border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    `;
    
    // 添加旋转图标
    const spinner = document.createElement('div');
    spinner.className = 'refresh-spinner';
    spinner.style.cssText = `
      width: 24px;
      height: 24px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
    `;
    
    // 添加文本
    const text = document.createElement('div');
    text.className = 'refresh-text';
    text.textContent = '下拉刷新';
    text.style.cssText = `
      margin-left: 12px;
      color: white;
      font-size: 14px;
      font-weight: bold;
    `;
    
    indicator.appendChild(spinner);
    indicator.appendChild(text);
    document.body.appendChild(indicator);
    
    return indicator;
  }
  
  // 设置旋转动画
  function setSpinnerAnimation(isAnimating) {
    const spinner = refreshIndicator.querySelector('.refresh-spinner');
    if (spinner) {
      if (isAnimating) {
        spinner.style.animation = 'app-refresh-spin 1.2s infinite linear';
        
        // 添加动画样式
        if (!document.getElementById('refresh-animation-style')) {
          const style = document.createElement('style');
          style.id = 'refresh-animation-style';
          style.textContent = `
            @keyframes app-refresh-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `;
          document.head.appendChild(style);
        }
      } else {
        spinner.style.animation = '';
      }
    }
  }
  
  // 更新刷新指示器状态
  function updateRefreshIndicator(distance) {
    if (!refreshIndicator) {
      refreshIndicator = createRefreshIndicator();
    }
    
    // 计算下拉百分比
    const pullPercentage = Math.min(distance / refreshDistance, 1);
    const text = refreshIndicator.querySelector('.refresh-text');
    
    if (isRefreshing) {
      text.textContent = '正在刷新...';
      refreshIndicator.style.transform = `translateY(0)`;
      setSpinnerAnimation(true);
    } else {
      const translateY = Math.min(distance * 0.5, maxPullDistance * 0.5);
      refreshIndicator.style.transform = `translateY(${translateY}px)`;
      
      if (pullPercentage >= 1) {
        text.textContent = '释放立即刷新';
      } else {
        text.textContent = '下拉刷新';
      }
      setSpinnerAnimation(false);
    }
  }
  
  // 执行刷新
  function performRefresh() {
    if (isRefreshing) return;
    
    isRefreshing = true;
    updateRefreshIndicator(refreshDistance);
    
    console.log('📱 执行下拉刷新');
    
    // 如果有应用刷新方法，通知暂停刷新30秒
    if (window.appRefresh && window.appRefresh.pauseFor) {
      window.appRefresh.pauseFor(30000);
    }
    
    // 调用app-data-refresh.js中的刷新函数
    if (window.appRefresh && typeof window.appRefresh.refresh === 'function') {
      // 使用应用刷新模块进行刷新
      window.appRefresh.refresh(true)
        .then(success => {
          console.log('下拉刷新结果:', success ? '成功' : '失败');
          finishRefresh();
        })
        .catch(() => {
          console.error('下拉刷新出错');
          finishRefresh();
        });
    } else {
      // 无刷新模块情况下，直接刷新页面
      console.log('找不到应用刷新模块，将重新加载页面');
      refreshTimeout = setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }
  
  // 完成刷新
  function finishRefresh() {
    if (refreshTimeout) {
      clearTimeout(refreshTimeout);
      refreshTimeout = null;
    }
    
    if (!isRefreshing) return;
    
    // 延迟结束刷新动画
    setTimeout(() => {
      isRefreshing = false;
      
      // 收起刷新指示器
      if (refreshIndicator) {
        refreshIndicator.style.transform = 'translateY(-100%)';
        setSpinnerAnimation(false);
      }
    }, 500);
  }
  
  // 触摸事件处理
  function handleTouchStart(e) {
    // 检查是否应该在当前上下文中禁用下拉刷新
    if (!isEnabled || shouldDisableInCurrentContext()) {
      return;
    }
    
    // 只在页面顶部启用下拉刷新
    if (window.scrollY > 10) return;
    
    // 记录开始位置
    startY = e.touches[0].clientY;
    currentY = startY;
    isDragging = true;
  }
  
  function handleTouchMove(e) {
    if (!isDragging || !isEnabled) return;
    
    // 再次检查是否应禁用(动态检查)
    if (shouldDisableInCurrentContext()) {
      isDragging = false;
      return;
    }
    
    // 更新当前位置
    currentY = e.touches[0].clientY;
    
    // 计算下拉距离
    const pullDistance = currentY - startY;
    
    // 只处理向下拖动
    if (pullDistance <= 10) { // 增加最小阈值
      isDragging = false;
      updateRefreshIndicator(0);
      return;
    }
    
    // 阻止默认滚动行为，仅在明确需要下拉刷新时
    if (pullDistance > 10 && window.scrollY <= 5) {
      e.preventDefault();
      
      // 计算阻尼效果的拉动距离
      const dampedDistance = Math.pow(pullDistance, 0.8);
      
      // 更新刷新指示器
      if (pullDistance > 20) { // 只有大于20px才显示指示器
        updateRefreshIndicator(dampedDistance);
      }
    }
  }
  
  function handleTouchEnd() {
    if (!isDragging || !isEnabled) return;
    
    // 计算下拉距离
    const pullDistance = currentY - startY;
    
    // 检查是否达到刷新触发距离
    if (pullDistance >= refreshDistance && window.scrollY <= 5) {
      // 触发刷新
      performRefresh();
    } else {
      // 未达到触发距离，恢复初始状态
      if (refreshIndicator) {
        refreshIndicator.style.transform = 'translateY(-100%)';
      }
    }
    
    isDragging = false;
  }
  
  // 初始化下拉刷新功能
  function initialize() {
    // 检查当前页面是否应该禁用下拉刷新
    disableRefreshOnCurrentPage = shouldDisableInCurrentContext();
    
    // 如果当前页面应该禁用下拉刷新，直接退出
    if (disableRefreshOnCurrentPage) {
      console.log('当前页面不适合下拉刷新，已禁用');
      return;
    }
    
    // 监听路由变化
    if (typeof window !== 'undefined') {
      let currentPath = window.location.pathname;
      
      // 检查URL变化
      setInterval(() => {
        const newPath = window.location.pathname;
        if (newPath !== currentPath) {
          currentPath = newPath;
          // 检查新页面是否应该禁用下拉刷新
          disableRefreshOnCurrentPage = shouldDisableInCurrentContext();
          console.log('路由变化，下拉刷新状态:', disableRefreshOnCurrentPage ? '已禁用' : '已启用');
        }
      }, 1000);
    }
    
    // 添加触摸事件监听
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });
    
    // 监听表单元素获取焦点，禁用下拉刷新
    document.addEventListener('focusin', (e) => {
      if (e.target.tagName === 'INPUT' || 
          e.target.tagName === 'TEXTAREA' || 
          e.target.tagName === 'SELECT' ||
          e.target.isContentEditable) {
        console.log('表单元素获得焦点，临时禁用下拉刷新');
        isEnabled = false;
        
        // 如果有全局刷新控制，禁用重定向
        if (window.appRefresh && window.appRefresh.disableRedirect) {
          window.appRefresh.disableRedirect();
        }
      }
    }, true);
    
    // 监听表单元素失去焦点，恢复下拉刷新
    document.addEventListener('focusout', (e) => {
      // 确保不是点击到了另一个表单元素
      const newFocusElement = document.activeElement;
      if (!(newFocusElement.tagName === 'INPUT' || 
            newFocusElement.tagName === 'TEXTAREA' || 
            newFocusElement.tagName === 'SELECT' ||
            newFocusElement.isContentEditable)) {
        
        // 只有当前页面不在禁用列表中才恢复
        if (!shouldDisableInCurrentContext()) {
          console.log('表单元素失去焦点，恢复下拉刷新');
          isEnabled = true;
        }
      }
    }, true);
    
    console.log('📱 下拉刷新功能已初始化');
  }
  
  // 延迟初始化，确保DOM和其他脚本加载完成
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initialize, 500));
  } else {
    setTimeout(initialize, 500);
  }
})(); 