import request from '@/lib/api'

export const DashboardAPI = {
  // 获取统计数据
  getStats() {
    return request.get('/dashboard/stats')
  },

  // 获取最近活动
  getRecentActivities() {
    return request.get('/dashboard/recent-activities')
  },

  // 获取趋势数据
  getTrend() {
    return request.get('/dashboard/trend')
  },
} 