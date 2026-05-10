import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.firefly.forum',
  appName: '萤火虫之国',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true, // 允许HTTP明文通信，便于调试
    allowNavigation: ['*'],
  },
  android: {
    allowMixedContent: true, // 允许混合内容便于调试
    captureInput: false, // 修改为 false 以解决中文输入问题
    webContentsDebuggingEnabled: true, // 启用WebView调试
    initialFocus: true,
    backgroundColor: "#FFFFFF",
  },
  plugins: {
    CapacitorCookies: {
      enabled: true, // 确保启用Cookie
    },
    CapacitorHttp: {
      enabled: true,
    },
    WebView: {
      serverAssets: ['public'],
      allowFileAccess: true,
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#488AFF",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  loggingBehavior: 'debug',
};

export default config;
