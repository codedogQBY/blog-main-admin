import request from '../lib/api'

export interface FriendLink {
  id: string
  name: string
  url: string
  logo?: string
  description?: string
  status: number
  order: number
  createdAt: string
  updatedAt: string
}

// 获取友链列表
export function getFriendLinks(params: { page: number; pageSize: number; status?: number; search?: string }) {
  return request.get<{ items: FriendLink[]; total: number }>('/friend-links/admin', { params })
}

// 获取友链详情
export function getFriendLink(id: string) {
  return request.get<FriendLink>(`/friend-links/admin/${id}`)
}

// 创建友链
export function createFriendLink(data: Omit<FriendLink, 'id' | 'createdAt' | 'updatedAt'>) {
  return request.post<FriendLink>('/friend-links/admin', data)
}

// 更新友链
export function updateFriendLink(id: string, data: Partial<Omit<FriendLink, 'id' | 'createdAt' | 'updatedAt'>>) {
  return request.put<FriendLink>(`/friend-links/admin/${id}`, data)
}

// 删除友链
export function deleteFriendLink(id: string) {
  return request.delete(`/friend-links/admin/${id}`)
}

// 更新友链排序
export function updateFriendLinkOrder(id: string, order: number) {
  return request.put(`/friend-links/admin/${id}/order`, { order })
}

// 更新友链状态
export function updateFriendLinkStatus(id: string, status: number) {
  return request.put(`/friend-links/admin/${id}/status`, { status })
} 