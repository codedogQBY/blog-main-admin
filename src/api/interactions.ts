import api from '../lib/api'

export interface Like {
  id: string
  targetType: string
  targetId: string
  fingerprint: string
  createdAt: string
  userInfo: {
    nickname: string
    location: string
    country: string
    deviceType: string
    browser: string
    ipAddress: string
    joinedAt: string
  } | null
}

export interface Comment {
  id: string
  content: string
  targetType: string
  targetId: string
  author: string
  email: string
  fingerprint: string
  createdAt: string
  parentId: string | null
  isDeleted: boolean
  userInfo: {
    nickname: string
    location: string
    country: string
    deviceType: string
    browser: string
    ipAddress: string
    email: string
    joinedAt: string
  } | null
  repliesCount: number
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
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  hasMore: boolean
  page: number
  limit: number
}

// 获取点赞列表
export const getLikes = (params: {
  page?: number
  limit?: number
  targetType?: string
  targetId?: string
}) => {
  return api.get<{ likes: Like[] } & Omit<PaginatedResponse<Like>, 'data'>>('/interactions/admin/likes', { params })
}

// 获取评论列表
export const getComments = (params: {
  page?: number
  limit?: number
  targetType?: string
  targetId?: string
  search?: string
}) => {
  return api.get<{ comments: Comment[] } & Omit<PaginatedResponse<Comment>, 'data'>>('/interactions/admin/comments', { params })
}

// 删除评论
export const deleteComment = (id: string) => {
  return api.delete(`/interactions/admin/comments/${id}`)
}

// 删除点赞
export const deleteLike = (id: string) => {
  return api.delete(`/interactions/admin/likes/${id}`)
}

// 获取统计信息
export const getInteractionStats = () => {
  return api.get<InteractionStats>('/interactions/admin/stats')
} 