#!/usr/bin/env node

// scripts/setup-capacitor.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
  console.log(`执行: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`命令执行失败: ${command}`);
    console.error(error.message);
    return false;
  }
}

function setupCapacitor() {
  console.log('🚀 开始设置 Capacitor 项目...\n');

  // 1. 构建 Next.js 项目
  console.log('📦 构建 Next.js 项目...');
  if (!runCommand('npm run build')) {
    process.exit(1);
  }

  // 2. 检查 android 目录是否存在
  const androidDir = path.join(process.cwd(), 'android');
  if (!fs.existsSync(androidDir)) {
    console.log('📱 添加 Android 平台...');
    if (!runCommand('npx cap add android')) {
      process.exit(1);
    }
  } else {
    console.log('✅ Android 平台已存在');
  }

  // 3. 同步项目
  console.log('🔄 同步 Capacitor 项目...');
  if (!runCommand('npx cap sync')) {
    process.exit(1);
  }

  console.log('\n🎉 Capacitor 设置完成！');
  console.log('\n可用的命令:');
  console.log('• npm run android:dev     - 在开发模式下运行 Android 应用');
  console.log('• npm run android:build   - 构建并运行 Android 应用');
  console.log('• npm run android:open    - 在 Android Studio 中打开项目');
  console.log('• npm run cap:sync        - 同步更改到原生项目');
  console.log('\n📝 注意事项:');
  console.log('• 确保已安装 Android Studio 和 JDK');
  console.log('• 首次运行可能需要在 Android Studio 中配置 SDK');
  console.log('• 如果遇到路由问题，应用程序现在使用静态路由处理');
}

if (require.main === module) {
  setupCapacitor();
}

module.exports = { setupCapacitor }; 