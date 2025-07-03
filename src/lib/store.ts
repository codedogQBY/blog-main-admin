import { defineStore } from 'pinia'
import { authApi } from './api'
import type { User } from './api'

export interface MenuConfig {
  id: string
  title: string
  icon: string
  path: string
  permission: string
  children?: MenuConfig[]
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  permissions: string[]
  menus: MenuConfig[]
  tokenCheckInterval: number | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    permissions: [],
    menus: [],
    tokenCheckInterval: null
  }),

  getters: {
    // 检查是否有指定权限
    hasPermission: (state) => (permission: string): boolean => {
      if (!state.user) return false
      // 超级管理员拥有所有权限
      if (state.user.isSuperAdmin) return true
      return state.permissions.includes(permission) || state.permissions.includes('*')
    },

    // 获取用户权限列表
    userPermissions: (state) => {
      return state.permissions
    },

    // 获取可访问的菜单
    accessibleMenus: (state) => {
      return state.menus.filter(menu => {
        if (!state.user) return false
        // 超级管理员可以访问所有菜单
        if (state.user.isSuperAdmin) return true
        return state.permissions.includes(menu.permission) || state.permissions.includes('*')
      })
    }
  },

  actions: {
    async login(mail: string, password: string) {
      this.loading = true
      try {
        const response = await authApi.login({ mail, password })
        localStorage.setItem('accessToken', response.accessToken)
        await this.fetchProfile()
        this.startTokenCheck()
        return true
      } catch (error) {
        console.error('登录失败:', error)
        return false
      } finally {
        this.loading = false
      }
    },

    async fetchProfile() {
      try {
        const profile = await authApi.getProfile()
        this.user = profile
        this.isAuthenticated = true
        this.updatePermissions()
        this.generateMenus()
      } catch (error: any) {
        if (error?.response?.status === 401) {
          this.logout()
        }
      }
    },

    // fetchUserProfile 是 fetchProfile 的别名，用于兼容性
    async fetchUserProfile() {
      return this.fetchProfile()
    },

    // 更新用户权限列表
    updatePermissions() {
      if (!this.user) {
        this.permissions = []
        return
      }

      if (this.user.isSuperAdmin) {
        this.permissions = ['*'] // 超级管理员拥有所有权限
        return
      }

      // 从用户角色中提取权限
      const permissions = new Set<string>()
      if (this.user.role && this.user.role.perms) {
        this.user.role.perms.forEach((rolePerm: any) => {
          if (rolePerm.permission) {
            permissions.add(rolePerm.permission.code)
          }
        })
      }
      this.permissions = Array.from(permissions)
    },

    // 生成动态菜单
    generateMenus() {
      this.menus = [
        {
          id: 'users',
          title: '用户管理',
          icon: 'User',
          path: '/users',
          permission: 'user.read'
        },
        {
          id: 'roles',
          title: '角色管理',
          icon: 'UserFilled',
          path: '/roles',
          permission: 'role.read'
        },
        {
          id: 'permissions',
          title: '权限管理',
          icon: 'Key',
          path: '/permissions',
          permission: 'permission.read'
        }
      ]
    },

    logout() {
      localStorage.removeItem('accessToken')
      this.user = null
      this.isAuthenticated = false
      this.permissions = []
      this.menus = []
      this.stopTokenCheck()
    },

    async checkAuth() {
      const token = localStorage.getItem('accessToken')
      if (!token) {
        this.logout()
        return false
      }

      try {
        await this.fetchProfile()
        this.startTokenCheck()
        return true
      } catch (error: any) {
        if (error?.response?.status === 401) {
          this.logout()
        }
        return false
      }
    },

    // 启动 token 有效性检查
    startTokenCheck() {
      // 清除之前的检查
      this.stopTokenCheck()
      
      // 每 5 分钟检查一次 token 有效性
      this.tokenCheckInterval = window.setInterval(async () => {
        const token = localStorage.getItem('accessToken')
        if (token && this.isAuthenticated) {
          try {
            await authApi.getProfile()
          } catch (error: any) {
            if (error?.response?.status === 401) {
              console.warn('Token 已过期，请重新登录')
              this.logout()
            }
          }
        }
      }, 5 * 60 * 1000) // 5 分钟
    },

    // 停止 token 检查
    stopTokenCheck() {
      if (this.tokenCheckInterval) {
        clearInterval(this.tokenCheckInterval)
        this.tokenCheckInterval = null
      }
    }
  }
}) 