import { reportError, reportLog, reportPerformance } from './websee-config';

// 示例：在组件中手动上报错误
export function handleComponentError(error: Error, componentName: string) {
  reportError(error, {
    component: componentName,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  });
}

// 示例：上报用户行为
export function trackUserAction(action: string, data?: any) {
  reportLog(`User Action: ${action}`, {
    action,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
    ...data,
  });
}

// 示例：上报性能数据
export function trackCustomPerformance(metric: string, value: number) {
  reportPerformance({
    metric,
    value,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : '',
  });
}

// 示例：在API调用中上报错误
export async function apiCallWithErrorReporting(url: string, options?: RequestInit) {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = new Error(`API call failed: ${response.status} ${response.statusText}`);
      reportError(error, {
        url,
        status: response.status,
        statusText: response.statusText,
        method: options?.method || 'GET',
      });
      throw error;
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error) {
      reportError(error, {
        url,
        method: options?.method || 'GET',
      });
    }
    throw error;
  }
}

// 示例：在事件处理中上报错误
export function withErrorReporting<T extends (...args: any[]) => any>(
  fn: T,
  context?: string
): T {
  return ((...args: any[]) => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        reportError(error, {
          context,
          functionName: fn.name,
          arguments: args,
        });
      }
      throw error;
    }
  }) as T;
}

// Vue3 错误处理器
export function setupVueErrorHandler(app: any) {
  app.config.errorHandler = (error: Error, instance: any, info: string) => {
    reportError(error, {
      component: instance?.$options?.name || 'Unknown',
      info,
      url: typeof window !== 'undefined' ? window.location.href : '',
    });
    
    console.error('Vue Error:', error, instance, info);
  };
}

// 全局错误处理器
export function setupGlobalErrorHandlers() {
  // 处理未捕获的 Promise 错误
  window.addEventListener('unhandledrejection', (event) => {
    reportError(new Error(event.reason), {
      type: 'unhandledrejection',
      url: typeof window !== 'undefined' ? window.location.href : '',
    });
  });

  // 处理全局错误
  window.addEventListener('error', (event) => {
    reportError(event.error || new Error(event.message), {
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: typeof window !== 'undefined' ? window.location.href : '',
    });
  });
} 