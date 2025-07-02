import request from '@/lib/api'

export interface UserInfo {
  userAgent?: string
  deviceType?: string
  ipAddress?: string
  country?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
  deviceModel?: string
  osName?: string
  osVersion?: string
  browserName?: string
  browserVersion?: string
  screenWidth?: number
  screenHeight?: number
  language?: string
  languages?: string
  nickname?: string
  email?: string
}

export interface Like {
  id: string
  targetType: string
  targetId: string
  fingerprint: string
  userInfo: UserInfo
  createdAt: string
  deleting?: boolean
}

export interface Comment {
  id: string
  content: string
  targetType: string
  targetId: string
  fingerprint: string
  author?: string
  email?: string
  userInfo: UserInfo
  createdAt: string
  repliesCount: number
  isDeleted: boolean
  deleting?: boolean
}

export interface CommentTypeStats {
  type: string
  count: number
}

export interface DailyTrendStats {
  date: string
  count: number
}

export interface TopCommenter {
  fingerprint: string
  author: string
  count: number
}

export interface TopContent {
  type: string
  id: string
  title: string
  count: number
}

export interface CommentStats {
  byType: CommentTypeStats[]
  dailyTrend: DailyTrendStats[]
  topCommenters: TopCommenter[]
  topContent: TopContent[]
}

export interface InteractionStats {
  overview: {
    totalLikes: number
    totalComments: number
    totalUsers: number
    todayLikes: number
    todayComments: number
  }
  topTargets: Array<{
    targetType: string
    targetId: string
    likesCount: number
  }>
  recentActivity: Array<{
    action: string
    targetType: string
    targetId: string
    timestamp: string
    fingerprint: string
  }>
  commentStats: CommentStats
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  hasMore: boolean
  page: number
  limit: number
}

// 获取点赞列表
export function getLikes(params: { page?: number; limit?: number; targetType?: string }) {
  return request.get<{ likes: Like[]; total: number }>('/interactions/admin/likes', { params })
}

// 获取评论列表
export function getComments(params: { page?: number; limit?: number; targetType?: string; search?: string }) {
  return request.get<{ comments: Comment[]; total: number }>('/interactions/admin/comments', { params })
}

// 删除评论
export function deleteComment(id: string) {
  return request.delete(`/interactions/admin/comments/${id}`)
}

// 删除点赞
export function deleteLike(id: string) {
  return request.delete(`/interactions/admin/likes/${id}`)
}

// 获取统计信息
export function getInteractionStats() {
  return request.get<InteractionStats>('/interactions/admin/stats')
} 