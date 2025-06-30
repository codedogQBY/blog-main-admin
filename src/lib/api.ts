import axios from 'axios'
import type { AxiosResponse } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

export interface User {
  id: string
  name: string
  mail: string
  isSuperAdmin: boolean
  role?: Role
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  perms?: RolePermission[]
  users?: User[]
  permissions?: Permission[]
  userCount?: number
}

export interface Permission {
  id: string
  name: string
  code: string
  group?: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface RolePermission {
  roleId: string
  permissionId: string
  permission: Permission
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface LoginRequest {
  mail: string
  password: string
}

export interface LoginResponse {
  accessToken: string
}

export interface RegisterRequest {
  name: string
  mail: string
  password: string
  code: string
}

// 博客相关接口
export interface Article {
  id: string
  title: string
  content: string
  excerpt: string
  slug: string
  published: boolean
  publishedAt?: string
  views: number
  readTime: number
  createdAt: string
  updatedAt: string
  categoryId: string
  authorId: string
  category: {
    id: string
    name: string
  }
  author: {
    id: string
    name: string
  }
  tags: Array<{
    id: string
    tag: {
      id: string
      name: string
    }
  }>
  _count?: {
    comments: number
    likes: number
  }
  seoKeywords?: string
  seoDescription?: string
}

export interface Category {
  id: string
  name: string
  description?: string
  slug: string
  parentId?: string
  status?: string
  sort?: number
  articleCount?: number
  createdAt: string
  updatedAt: string
  parentCategory?: Category
  _count?: {
    articles: number
  }
}

export interface Tag {
  id: string
  name: string
  slug?: string
  description?: string
  color?: string
  sort?: number
  articleCount?: number
  createdAt: string
  updatedAt: string
  _count?: {
    articles: number
  }
}

export interface ArticleListParams {
  page?: number
  pageSize?: number
  title?: string
  categoryId?: string
  published?: boolean
}

export interface CategoryListParams {
  page?: number
  pageSize?: number
  name?: string
}

export interface FileFolder {
  id: string
  name: string
  path: string
  parentId?: string
  createdAt: string
  updatedAt: string
  parent?: FileFolder
  children?: FileFolder[]
  _count?: {
    files: number
  }
}

export interface FileItem {
  id: string
  name: string
  filename: string
  path: string
  url: string
  size: number
  mimetype: string
  extension: string
  folderId?: string
  uploadedBy: string
  createdAt: string
  updatedAt: string
  folder?: FileFolder
  uploader?: {
    id: string
    name: string
    mail: string
  }
}

export interface FileStats {
  totalFiles: number
  totalSize: number
  filesByType: Array<{
    extension: string
    _count: {
      extension: number
    }
  }>
}

// 图库相关接口
export interface GalleryImage {
  id: string
  title: string
  description?: string
  imageUrl: string
  category?: string
  tags?: string[]
  status: 'published' | 'draft'
  createdAt: string
  updatedAt: string
  fileId?: string
}

// 新增：图集中的单张图片接口
export interface GalleryImageItem {
  title: string
  description?: string
  imageUrl: string
  sort: number
}

// 新增：图集接口
export interface Gallery {
  id: string
  title: string
  description?: string
  category?: string
  tags: string[]
  coverImage?: string
  images: GalleryImageItem[]
  status: 'published' | 'draft'
  sort: number
  createdAt: string
  updatedAt: string
}

export interface GalleryCategory {
  name: string
  description?: string
  isEnabled: boolean
  sort?: number
  imageCount?: number
  createdAt: string
  updatedAt: string
}

export interface GalleryCategoryStats {
  totalCategories: number
  enabledCategories: number
  totalImages: number
  averageImagesPerCategory: number
}

class ApiClient {
  private client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
  })

  constructor() {
    // 请求拦截器：添加token
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('accessToken')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    // 响应拦截器：处理401错误
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 只有在不是登录页面时才清除 token 并跳转
          if (!window.location.pathname.includes('/login')) {
            localStorage.removeItem('accessToken')
            // 使用 Vue Router 进行导航而不是直接修改 location
            if (window.location.pathname !== '/login') {
              console.warn('Token 已过期，正在跳转到登录页面')
              // 延迟跳转，避免频繁跳转
              setTimeout(() => {
                window.location.href = '/login'
              }, 100)
            }
          }
        } else if (error.response?.status === 403) {
          // 403权限不足错误处理
          const errorMessage = error.response?.data?.message || '您没有权限执行此操作'
          import('element-plus').then(({ ElMessage }) => {
            ElMessage.error(errorMessage)
          })
        } else if (error.response?.status >= 500) {
          // 服务器错误
          import('element-plus').then(({ ElMessage }) => {
            ElMessage.error('服务器错误，请稍后重试')
          })
        }
        return Promise.reject(error)
      }
    )
  }

  // 通用HTTP方法
  async get<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.get<T>(url, config)
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.post<T>(url, data, config)
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.put<T>(url, data, config)
  }

  async patch<T = any>(url: string, data?: any, config?: any): Promise<AxiosResponse<T>> {
    return this.client.patch<T>(url, data, config)
  }

  async delete<T = any>(url: string, config?: any): Promise<AxiosResponse<T>> {
    return this.client.delete<T>(url, config)
  }

  // 认证相关
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/login', data)
    return response.data
  }

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const response = await this.client.post<LoginResponse>('/auth/register', data)
    return response.data
  }

  async sendCode(mail: string): Promise<void> {
    await this.client.post('/auth/send-code', { mail })
  }

  async getProfile(): Promise<any> {
    const response = await this.client.get('/auth/profile')
    return response.data
  }

  // 用户管理
  async getUsers(page = 1, limit = 10, search?: string): Promise<PaginationResult<User>> {
    const params: any = { page, limit }
    if (search) params.search = search
    const response = await this.client.get<PaginationResult<User>>('/users', { params })
    return response.data
  }

  async getUser(id: string): Promise<User> {
    const response = await this.client.get<User>(`/users/${id}`)
    return response.data
  }

  async createUser(data: {
    name: string
    mail: string
    password: string
    roleId?: string
    isSuperAdmin?: boolean
  }): Promise<User> {
    const response = await this.client.post<User>('/users', data)
    return response.data
  }

  async updateUser(id: string, data: {
    name?: string
    mail?: string
    password?: string
    roleId?: string
    isSuperAdmin?: boolean
  }): Promise<User> {
    const response = await this.client.put<User>(`/users/${id}`, data)
    return response.data
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/users/${id}`)
  }

  async assignRole(userId: string, roleId: string | null): Promise<User> {
    const response = await this.client.post<User>(`/users/${userId}/role`, { roleId })
    return response.data
  }

  // 角色管理
  async getRoles(params?: { page?: number; pageSize?: number; search?: string }): Promise<Role[]> {
    const response = await this.client.get<Role[]>('/roles', { params })
    return response.data
  }

  async getRole(id: string): Promise<Role> {
    const response = await this.client.get<Role>(`/roles/${id}`)
    return response.data
  }

  async createRole(data: { name: string; description?: string; permissionIds?: string[] }): Promise<Role> {
    const response = await this.client.post<Role>('/roles', data)
    return response.data
  }

  async updateRole(id: string, data: { name?: string; description?: string; permissionIds?: string[] }): Promise<Role> {
    const response = await this.client.put<Role>(`/roles/${id}`, data)
    return response.data
  }

  async deleteRole(id: string): Promise<void> {
    await this.client.delete(`/roles/${id}`)
  }

  async setRolePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const response = await this.client.post<Role>(`/roles/${roleId}/permissions`, { permissionIds })
    return response.data
  }

  // 权限管理
  async getPermissions(params?: { page?: number; pageSize?: number; search?: string; group?: string }): Promise<{ data?: Permission[]; total?: number } | Permission[]> {
    const response = await this.client.get<{ data?: Permission[]; total?: number } | Permission[]>('/permissions', { params })
    return response.data
  }

  async getPermission(id: string): Promise<Permission> {
    const response = await this.client.get<Permission>(`/permissions/${id}`)
    return response.data
  }

  async createPermission(code: string, name: string): Promise<Permission> {
    const response = await this.client.post<Permission>('/permissions', { code, name })
    return response.data
  }

  async updatePermission(id: string, data: { code?: string; name?: string }): Promise<Permission> {
    const response = await this.client.put<Permission>(`/permissions/${id}`, data)
    return response.data
  }

  async deletePermission(id: string): Promise<void> {
    await this.client.delete(`/permissions/${id}`)
  }

  async syncPermissions(): Promise<{ created: number; total: number }> {
    const response = await this.client.post<{ created: number; total: number }>('/permissions/sync')
    return response.data
  }

  // 文章管理
  async getArticles(params?: ArticleListParams): Promise<{ data: Article[]; total: number }> {
    const response = await this.client.get<{ data: Article[]; total: number }>('/articles/admin/list', { params })
    return response.data
  }

  async getAdminArticles(params?: any): Promise<{ data: Article[]; total: number }> {
    const response = await this.client.get<{ data: Article[]; total: number }>('/articles/admin/list', { params })
    return response.data
  }

  async getArticle(id: string): Promise<Article> {
    const response = await this.client.get<Article>(`/articles/id/${id}`)
    return response.data
  }

  async createArticle(data: Partial<Article>): Promise<Article> {
    const response = await this.client.post<Article>('/articles', data)
    return response.data
  }

  async updateArticle(id: string, data: Partial<Article>): Promise<Article> {
    const response = await this.client.put<Article>(`/articles/${id}`, data)
    return response.data
  }

  async deleteArticle(id: string): Promise<void> {
    await this.client.delete(`/articles/${id}`)
  }

  // 分类管理
  async getCategories(params?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<{ data?: Category[]; total?: number } | Category[]> {
    const response = await this.client.get<{ data?: Category[]; total?: number } | Category[]>('/categories', { params })
    return response.data
  }

  async getCategoriesForAdmin(params?: { page?: number; pageSize?: number; search?: string; status?: string }): Promise<{ data?: Category[]; total?: number } | Category[]> {
    const response = await this.client.get<{ data?: Category[]; total?: number } | Category[]>('/categories/admin/list', { params })
    return response.data
  }

  async getCategory(id: string): Promise<Category> {
    const response = await this.client.get<Category>(`/categories/${id}`)
    return response.data
  }

  async createCategory(data: Partial<Category>): Promise<Category> {
    const response = await this.client.post<Category>('/categories', data)
    return response.data
  }

  async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const response = await this.client.put<Category>(`/categories/${id}`, data)
    return response.data
  }

  async deleteCategory(id: string): Promise<void> {
    await this.client.delete(`/categories/${id}`)
  }

  // 标签管理
  async getTags(params?: { page?: number; pageSize?: number; search?: string; color?: string }): Promise<{ data?: Tag[]; total?: number } | Tag[]> {
    const response = await this.client.get<{ data?: Tag[]; total?: number } | Tag[]>('/tags', { params })
    return response.data
  }

  async getTag(id: string): Promise<Tag> {
    const response = await this.client.get<Tag>(`/tags/${id}`)
    return response.data
  }

  async createTag(data: Partial<Tag>): Promise<Tag> {
    const response = await this.client.post<Tag>('/tags', data)
    return response.data
  }

  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    const response = await this.client.put<Tag>(`/tags/${id}`, data)
    return response.data
  }

  async deleteTag(id: string): Promise<void> {
    await this.client.delete(`/tags/${id}`)
  }

  // 文件管理
  async getFolders(parentId?: string): Promise<FileFolder[]> {
    const params = parentId ? { parentId } : {}
    const response = await this.client.get<FileFolder[]>('/files/folders', { params })
    return response.data
  }

  async createFolder(data: { name: string; parentId?: string }): Promise<FileFolder> {
    const response = await this.client.post<FileFolder>('/files/folders', data)
    return response.data
  }

  async updateFolder(id: string, data: { name?: string; parentId?: string }): Promise<FileFolder> {
    const response = await this.client.put<FileFolder>(`/files/folders/${id}`, data)
    return response.data
  }

  async deleteFolder(id: string): Promise<void> {
    await this.client.delete(`/files/folders/${id}`)
  }

  async getFiles(params?: { folderId?: string; search?: string; type?: string }): Promise<FileItem[]> {
    const response = await this.client.get<FileItem[]>('/files', { params })
    return response.data
  }

  async uploadFile(file: File, folderId?: string): Promise<FileItem> {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId) {
      formData.append('folderId', folderId)
    }
    
    const response = await this.client.post<FileItem>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async updateFile(id: string, data: { name?: string; folderId?: string }): Promise<FileItem> {
    const response = await this.client.put<FileItem>(`/files/${id}`, data)
    return response.data
  }

  async deleteFile(id: string): Promise<void> {
    await this.client.delete(`/files/${id}`)
  }

  async getFileStats(): Promise<FileStats> {
    const response = await this.client.get<FileStats>('/files/stats')
    return response.data
  }

  // 留言管理
  async getStickyNotes(params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<any> {
    const response = await this.client.get('/sticky-notes', { params })
    return response.data
  }

  async getStickyNotesForAdmin(params?: { page?: number; limit?: number; category?: string; search?: string }): Promise<any> {
    const response = await this.client.get('/sticky-notes/admin/list', { params })
    return response.data
  }

  async getStickyNote(id: string): Promise<any> {
    const response = await this.client.get(`/sticky-notes/${id}`)
    return response.data
  }

  async createStickyNote(data: any): Promise<any> {
    const response = await this.client.post('/sticky-notes', data)
    return response.data
  }

  async updateStickyNote(id: string, data: any): Promise<any> {
    const response = await this.client.patch(`/sticky-notes/${id}`, data)
    return response.data
  }

  async deleteStickyNote(id: string): Promise<void> {
    await this.client.delete(`/sticky-notes/${id}`)
  }

  async getStickyNoteCategories(): Promise<any> {
    const response = await this.client.get('/sticky-notes/categories')
    return response.data
  }

  async getStickyNoteStats(): Promise<any> {
    const response = await this.client.get('/sticky-notes/stats')
    return response.data
  }

  async getStickyNoteAdminStats(): Promise<any> {
    const response = await this.client.get('/sticky-notes/admin/stats')
    return response.data
  }

  // 图库管理
  async getGalleryItems(params?: { 
    page?: number; 
    limit?: number; 
    title?: string; 
    category?: string; 
    status?: string 
  }): Promise<{ items: Gallery[]; total: number; page: number; limit: number; hasMore: boolean }> {
    const response = await this.client.get('/gallery/admin/list', { params })
    return response.data
  }

  async getGalleryItem(id: string): Promise<Gallery> {
    const response = await this.client.get(`/gallery/admin/${id}`)
    return response.data
  }

  async createGalleryItem(data: Partial<Gallery>): Promise<Gallery> {
    const response = await this.client.post('/gallery/admin', data)
    return response.data
  }

  async updateGalleryItem(id: string, data: Partial<Gallery>): Promise<Gallery> {
    const response = await this.client.patch(`/gallery/admin/${id}`, data)
    return response.data
  }

  async deleteGalleryItem(id: string): Promise<void> {
    await this.client.delete(`/gallery/admin/${id}`)
  }

  async batchDeleteGalleryItems(ids: string[]): Promise<void> {
    await this.client.post('/gallery/admin/batch', {
      action: 'delete',
      ids
    })
  }

  async batchUpdateGalleryItems(ids: string[], data: Partial<Gallery>): Promise<void> {
    await this.client.post('/gallery/admin/batch', {
      action: 'update',
      ids,
      data
    })
  }

  async createGalleryFromFile(fileId: string, data: { title: string; description?: string; category?: string; tags?: string[] }): Promise<Gallery> {
    const response = await this.client.post('/gallery/admin/from-file', {
      fileId,
      ...data
    })
    return response.data
  }

  async getGalleryTags(): Promise<string[]> {
    const response = await this.client.get('/gallery/stats/tags')
    return response.data
  }

  // 图库分类管理
  async getGalleryCategories(params?: { name?: string; isEnabled?: boolean }): Promise<GalleryCategory[]> {
    // 暂时使用公开接口，避免认证问题
    const response = await this.client.get('/gallery-categories', { params })
    return response.data
  }

  async createGalleryCategory(data: Partial<GalleryCategory>): Promise<GalleryCategory> {
    const response = await this.client.post('/gallery-categories/admin', data)
    return response.data
  }

  async updateGalleryCategory(name: string, data: Partial<GalleryCategory>): Promise<GalleryCategory> {
    const response = await this.client.patch(`/gallery-categories/admin/${encodeURIComponent(name)}`, data)
    return response.data
  }

  async deleteGalleryCategory(name: string): Promise<void> {
    await this.client.delete(`/gallery-categories/admin/${encodeURIComponent(name)}`)
  }

  async getGalleryCategoryStats(): Promise<GalleryCategoryStats> {
    const response = await this.client.get('/gallery-categories/admin/stats')
    return response.data
  }
}

const apiClient = new ApiClient()

// 导出各个模块的API
export const authApi = {
  login: apiClient.login.bind(apiClient),
  register: apiClient.register.bind(apiClient),
  sendCode: apiClient.sendCode.bind(apiClient),
  getProfile: apiClient.getProfile.bind(apiClient),
}

export const userApi = {
  getList: apiClient.getUsers.bind(apiClient),
  getById: apiClient.getUser.bind(apiClient),
  create: apiClient.createUser.bind(apiClient),
  update: apiClient.updateUser.bind(apiClient),
  delete: apiClient.deleteUser.bind(apiClient),
  assignRole: apiClient.assignRole.bind(apiClient),
}

export const roleApi = {
  getList: apiClient.getRoles.bind(apiClient),
  getById: apiClient.getRole.bind(apiClient),
  create: apiClient.createRole.bind(apiClient),
  update: apiClient.updateRole.bind(apiClient),
  delete: apiClient.deleteRole.bind(apiClient),
  setPermissions: apiClient.setRolePermissions.bind(apiClient),
}

export const permissionApi = {
  getList: apiClient.getPermissions.bind(apiClient),
  getById: apiClient.getPermission.bind(apiClient),
  create: apiClient.createPermission.bind(apiClient),
  update: apiClient.updatePermission.bind(apiClient),
  delete: apiClient.deletePermission.bind(apiClient),
  sync: apiClient.syncPermissions.bind(apiClient),
}

export const articleApi = {
  getList: apiClient.getArticles.bind(apiClient),
  getAdminList: apiClient.getAdminArticles.bind(apiClient),
  getById: apiClient.getArticle.bind(apiClient),
  create: apiClient.createArticle.bind(apiClient),
  update: apiClient.updateArticle.bind(apiClient),
  delete: apiClient.deleteArticle.bind(apiClient),
}

export const categoryApi = {
  getList: apiClient.getCategories.bind(apiClient),
  getAdminList: apiClient.getCategoriesForAdmin.bind(apiClient),
  getById: apiClient.getCategory.bind(apiClient),
  create: apiClient.createCategory.bind(apiClient),
  update: apiClient.updateCategory.bind(apiClient),
  delete: apiClient.deleteCategory.bind(apiClient),
}

export const tagApi = {
  getList: apiClient.getTags.bind(apiClient),
  getById: apiClient.getTag.bind(apiClient),
  create: apiClient.createTag.bind(apiClient),
  update: apiClient.updateTag.bind(apiClient),
  delete: apiClient.deleteTag.bind(apiClient),
}

export const fileApi = {
  getFolders: apiClient.getFolders.bind(apiClient),
  createFolder: apiClient.createFolder.bind(apiClient),
  updateFolder: apiClient.updateFolder.bind(apiClient),
  deleteFolder: apiClient.deleteFolder.bind(apiClient),
  getFiles: apiClient.getFiles.bind(apiClient),
  uploadFile: apiClient.uploadFile.bind(apiClient),
  updateFile: apiClient.updateFile.bind(apiClient),
  deleteFile: apiClient.deleteFile.bind(apiClient),
  getStats: apiClient.getFileStats.bind(apiClient),
}

// 为了向后兼容，也导出 filesApi
export const filesApi = fileApi

export const stickyNoteApi = {
  getList: apiClient.getStickyNotes.bind(apiClient),
  getAdminList: apiClient.getStickyNotesForAdmin.bind(apiClient),
  getById: apiClient.getStickyNote.bind(apiClient),
  create: apiClient.createStickyNote.bind(apiClient),
  update: apiClient.updateStickyNote.bind(apiClient),
  delete: apiClient.deleteStickyNote.bind(apiClient),
  getCategories: apiClient.getStickyNoteCategories.bind(apiClient),
  getStats: apiClient.getStickyNoteStats.bind(apiClient),
  getAdminStats: apiClient.getStickyNoteAdminStats.bind(apiClient),
}

export const galleryApi = {
  getList: apiClient.getGalleryItems.bind(apiClient),
  getById: apiClient.getGalleryItem.bind(apiClient),
  create: apiClient.createGalleryItem.bind(apiClient),
  update: apiClient.updateGalleryItem.bind(apiClient),
  delete: apiClient.deleteGalleryItem.bind(apiClient),
  batchDelete: apiClient.batchDeleteGalleryItems.bind(apiClient),
  batchUpdate: apiClient.batchUpdateGalleryItems.bind(apiClient),
  createFromFile: apiClient.createGalleryFromFile.bind(apiClient),
  getTags: apiClient.getGalleryTags.bind(apiClient),
}

export const galleryCategoryApi = {
  getList: apiClient.getGalleryCategories.bind(apiClient),
  create: apiClient.createGalleryCategory.bind(apiClient),
  update: apiClient.updateGalleryCategory.bind(apiClient),
  delete: apiClient.deleteGalleryCategory.bind(apiClient),
  getStats: apiClient.getGalleryCategoryStats.bind(apiClient),
}

// 为了向后兼容，导出 api 作为命名导出
export const api = apiClient

export default apiClient 