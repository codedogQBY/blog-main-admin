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
  perms?: RolePermission[]
}

export interface Permission {
  id: string
  name: string
  code: string
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
          localStorage.removeItem('accessToken')
          window.location.href = '/login'
        } else if (error.response?.status === 403) {
          // 403权限不足错误处理
          const errorMessage = error.response?.data?.message || '您没有权限执行此操作'
          import('element-plus').then(({ ElMessage }) => {
            ElMessage.error(errorMessage)
          })
          // 可以选择跳转到403页面或者只显示提示
          // window.location.href = '/403'
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
  async getRoles(): Promise<Role[]> {
    const response = await this.client.get<Role[]>('/roles')
    return response.data
  }

  async getRole(id: string): Promise<Role> {
    const response = await this.client.get<Role>(`/roles/${id}`)
    return response.data
  }

  async createRole(name: string): Promise<Role> {
    const response = await this.client.post<Role>('/roles', { name })
    return response.data
  }

  async updateRole(id: string, name: string): Promise<Role> {
    const response = await this.client.put<Role>(`/roles/${id}`, { name })
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
  async getPermissions(): Promise<Permission[]> {
    const response = await this.client.get<Permission[]>('/permissions')
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
}

// 创建实例
export const api = new ApiClient()

// 为了兼容性，也导出为ApiService
export const ApiService = api

// 默认导出
export default api 