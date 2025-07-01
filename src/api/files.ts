import apiClient from '@/lib/api'

export interface FileQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  folderId?: string | null;
  type?: 'image' | 'document' | 'other' | 'all';
}

export interface FolderQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  parentId?: string | null;
}

export const filesApi = {
  // 获取文件列表
  async listFiles(path: string = '/') {
    const response = await apiClient.get('/files/upyun/list', { params: { path } })
    return response.data
  },

  // 获取文件列表（新系统）
  async getFiles(params: FileQueryParams = {}) {
    const response = await apiClient.get('/files', { params })
    return response.data
  },

  // 获取文件夹列表
  async getFolders(params: FolderQueryParams = {}) {
    const response = await apiClient.get('/files/folders', { params })
    return response.data
  },

  // 获取文件夹树（用于导航）
  async getFolderTree() {
    const response = await apiClient.get('/files/folders/tree')
    return response.data
  },

  // 获取文件夹面包屑路径
  async getFolderBreadcrumb(folderId: string) {
    const response = await apiClient.get(`/files/folders/${folderId}/breadcrumb`)
    return response.data
  },

  // 创建文件夹
  async createFolder(data: { name: string; parentId?: string | null }) {
    const response = await apiClient.post('/files/folders', data)
    return response.data
  },

  // 更新文件夹
  async updateFolder(id: string, data: { name: string; parentId?: string | null }) {
    const response = await apiClient.put(`/files/folders/${id}`, data)
    return response.data
  },

  // 删除文件夹
  async deleteFolder(id: string) {
    const response = await apiClient.delete(`/files/folders/${id}`)
    return response.data
  },

  // 上传文件
  async uploadFile(file: File, folderId?: string | null) {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId) {
      formData.append('folderId', folderId)
    }
    
    const response = await apiClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // 更新文件
  async updateFile(id: string, data: { name?: string; folderId?: string | null }) {
    const response = await apiClient.put(`/files/${id}`, data)
    return response.data
  },

  // 删除文件
  async deleteFile(id: string) {
    const response = await apiClient.delete(`/files/${id}`)
    return response.data
  },

  // 获取文件统计信息
  async getStats() {
    const response = await apiClient.get('/files/stats')
    return response.data
  },

  // 获取文件信息
  async getFileInfo(path: string) {
    const response = await apiClient.get('/files/upyun/info', { params: { path } })
    return response.data
  },

  // 下载文件
  async downloadFile(path: string) {
    const response = await apiClient.get('/files/upyun/download', { 
      params: { path },
      responseType: 'blob'
    })
    return response.data
  }
} 