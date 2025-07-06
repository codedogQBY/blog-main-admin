import WebSee from '@websee/core';
import performance from '@websee/performance';
import recordscreen from '@websee/recordscreen';

// 全局变量存储 webSee 实例
let webseeInstance: any = null;

// web-see 配置
export const webseeConfig = {
  // 基础配置
  dsn: 'http://localhost:3001/logs/report',
  apikey: 'blog-admin',
  userId: 'anonymous',
  
  // 错误监控配置
  error: {
    // 忽略一些常见的非关键错误
    ignore: [
      /Script error/,
      /ResizeObserver loop limit exceeded/,
      /Network request failed/,
    ],
  },
  
  // 上报配置
  report: {
    // 批量上报
    batch: true,
    batchSize: 10,
    batchDelay: 3000,
  },
  
  // 设备信息收集
  device: {
    collect: true,
  },
  
  // 用户行为追踪
  behavior: {
    collect: true,
    // 记录页面访问
    pageView: true,
    // 记录用户点击
    click: true,
  },
}

// 初始化web-see监控
export function initWebSee(userId?: string) {
  if (webseeInstance) {
    return webseeInstance;
  }

  try {
    // 使用配置初始化
    const config = {
      ...webseeConfig,
      userId: userId || webseeConfig.userId,
    };
    
    webseeInstance = WebSee.init(config);

    // 注册性能监控插件
    webseeInstance.use(performance);
    
    // 注册录屏插件
    webseeInstance.use(recordscreen);
    
    // 自定义长任务监听器，只上报大于500ms的长任务
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            // 只处理大于500ms的长任务
            if (entry.duration > 500) {
              webseeInstance.log({
                type: 'longTask',
                message: `Long task detected: ${entry.duration}ms`,
                data: {
                  duration: entry.duration,
                  startTime: entry.startTime,
                  name: entry.name,
                  entryType: entry.entryType,
                  url: window.location.href,
                  userAgent: navigator.userAgent,
                  timestamp: Date.now()
                }
              });
            }
          });
        });
        
        // 开始观察长任务
        longTaskObserver.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Failed to setup custom long task observer:', error);
      }
    }
    
    console.log('WebSee monitoring initialized successfully');
    
    return webseeInstance;
  } catch (error) {
    console.error('Failed to initialize WebSee monitoring:', error);
    return null;
  }
}

// 手动上报错误
export function reportError(error: Error, context?: any) {
  if (!webseeInstance) return;
  
  webseeInstance.log({
    type: 'custom',
    message: error.message,
    error: error,
    data: context
  });
}

// 手动上报自定义日志
export function reportLog(message: string, data?: any) {
  if (!webseeInstance) return;
  
  webseeInstance.log({
    type: 'custom',
    message,
    data
  });
}

// 手动上报性能数据
export function reportPerformance(performanceData: any) {
  if (!webseeInstance) return;
  
  webseeInstance.log({
    type: 'custom',
    message: 'Custom Performance Data',
    data: performanceData
  });
}

export default webseeInstance; 