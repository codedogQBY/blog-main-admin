import apiClient from '@/lib/api'

export const filesApi = {
  // 获取文件列表
  async listFiles(path: string = '/') {
    const response = await apiClient.get('/files/upyun/list', { params: { path } })
    return response.data
  },

  // 上传文件
  async uploadFile(file: File, path: string = '/') {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('path', path)
    
    const response = await apiClient.post('/files/upyun/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  },

  // 创建文件夹
  async createFolder(path: string) {
    const response = await apiClient.post('/files/upyun/folder', { path })
    return response.data
  },

  // 删除文件或文件夹
  async deleteFile(path: string) {
    const response = await apiClient.delete('/files/upyun/file', { params: { path } })
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