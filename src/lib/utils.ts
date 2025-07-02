/**
 * 格式化日期
 * @param dateString ISO 日期字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * 格式化数字
 * @param num 数字
 * @returns 格式化后的字符串
 */
export const formatNumber = (num: number) => {
  return new Intl.NumberFormat('zh-CN').format(num)
}

/**
 * 防抖函数
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
export const debounce = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let timer: number | null = null
  return function (this: any, ...args: Parameters<T>) {
    if (timer) clearTimeout(timer)
    timer = window.setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param fn 需要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流后的函数
 */
export const throttle = <T extends (...args: any[]) => any>(fn: T, delay: number) => {
  let lastTime = 0
  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      fn.apply(this, args)
      lastTime = now
    }
  }
}

/**
 * 复制文本到剪贴板
 * @param text 要复制的文本
 * @returns Promise<void>
 */
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (err) {
    console.error('复制失败:', err)
    return false
  }
}

/**
 * 获取文件扩展名
 * @param filename 文件名
 * @returns 扩展名（小写）
 */
export const getFileExtension = (filename: string) => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @returns 格式化后的字符串
 */
export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 生成随机字符串
 * @param length 字符串长度
 * @returns 随机字符串
 */
export const generateRandomString = (length: number) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 检查是否为有效的电子邮件地址
 * @param email 电子邮件地址
 * @returns boolean
 */
export const isValidEmail = (email: string) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * 检查是否为有效的URL
 * @param url URL字符串
 * @returns boolean
 */
export const isValidUrl = (url: string) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 获取URL参数
 * @param url URL字符串
 * @returns Record<string, string>
 */
export const getUrlParams = (url: string) => {
  const params = new URLSearchParams(new URL(url).search)
  const result: Record<string, string> = {}
  for (const [key, value] of params.entries()) {
    result[key] = value
  }
  return result
}

/**
 * 检查对象是否为空
 * @param obj 对象
 * @returns boolean
 */
export const isEmptyObject = (obj: Record<string, any>) => {
  return Object.keys(obj).length === 0
}

/**
 * 深度克隆对象
 * @param obj 要克隆的对象
 * @returns 克隆后的对象
 */
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as unknown as T
  }

  return Object.fromEntries(
    Object.entries(obj as Record<string, any>).map(([key, value]) => [
      key,
      deepClone(value)
    ])
  ) as T
} 