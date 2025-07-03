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
  permissionsLoaded: boolean
  currentAuthCheck: Promise<boolean> | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    permissions: [],
    menus: [],
    tokenCheckInterval: null,
    permissionsLoaded: false,
    currentAuthCheck: null as Promise<boolean> | null
  }),

  getters: {
    // 检查是否有指定权限
    hasPermission: (state) => (permission: string): boolean => {
      console.log('[Permission Check]', {
        permission,
        user: state.user,
        permissionsLoaded: state.permissionsLoaded,
        permissions: state.permissions
      })
      
      if (!state.user || !state.permissionsLoaded) return false
      // 超级管理员拥有所有权限
      if (state.user.isSuperAdmin) return true
      return state.permissions.includes(permission) || state.permissions.includes('*')
    },

    // 获取用户权限列表
    userPermissions: (state) => {
      if (!state.permissionsLoaded || !state.user) return []
      return state.permissions
    },

    // 获取可访问的菜单
    accessibleMenus: (state) => {
      if (!state.user || !state.permissionsLoaded) return []
      
      return state.menus.filter(menu => {
        // 超级管理员可以访问所有菜单
        if (state.user?.isSuperAdmin) return true
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
        await this.updatePermissions()
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
    async updatePermissions() {
      console.log('[Permissions] Starting permission update', {
        user: this.user,
        currentPermissions: this.permissions
      })

      if (!this.user) {
        console.log('[Permissions] No user, clearing permissions')
        this.permissions = []
        this.permissionsLoaded = false
        return
      }

      try {
        if (this.user.isSuperAdmin) {
          console.log('[Permissions] User is superadmin, granting all permissions')
          this.permissions = ['*']
          this.permissionsLoaded = true
          return
        }

        // 从用户角色中提取权限
        console.log('[Permissions] Extracting permissions from role:', this.user.role)
        const permissions = new Set<string>()
        if (this.user.role && this.user.role.perms) {
          this.user.role.perms.forEach((rolePerm: any) => {
            if (rolePerm.permission) {
              permissions.add(rolePerm.permission.code)
            }
          })
        }
        this.permissions = Array.from(permissions)
        this.permissionsLoaded = true
        
        console.log('[Permissions] Permissions updated successfully', {
          permissions: this.permissions,
          permissionsLoaded: this.permissionsLoaded
        })
      } catch (error) {
        console.error('[Permissions] Failed to update permissions:', error)
        // 权限更新失败时不要清除现有权限
        throw error
      }
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
      console.log('[Auth Check] Starting auth check', {
        loading: this.loading,
        currentState: {
          isAuthenticated: this.isAuthenticated,
          hasUser: !!this.user,
          permissionsLoaded: this.permissionsLoaded
        }
      })

      // 如果已经有正在进行的认证检查，返回该Promise
      if (this.currentAuthCheck) {
        console.log('[Auth Check] Using existing auth check promise')
        return this.currentAuthCheck
      }
      
      this.loading = true
      
      // 创建新的认证检查Promise
      this.currentAuthCheck = (async () => {
        try {
          const token = localStorage.getItem('accessToken')
          console.log('[Auth Check] Token exists:', !!token)
          
          if (!token) {
            console.log('[Auth Check] No token found, resetting state')
            this.resetState()
            return false
          }

          // 获取用户信息
          console.log('[Auth Check] Fetching user profile')
          const response = await authApi.getProfile()
          console.log('[Auth Check] Profile received:', response)
          
          this.user = response
          this.isAuthenticated = true
          
          // 加载权限
          console.log('[Auth Check] Loading permissions')
          await this.updatePermissions()
          
          console.log('[Auth Check] Auth check completed successfully', {
            user: this.user,
            isAuthenticated: this.isAuthenticated,
            permissionsLoaded: this.permissionsLoaded,
            permissions: this.permissions
          })
          
          return true
        } catch (error: any) {
          console.error('[Auth Check] Failed:', {
            error,
            status: error?.response?.status,
            message: error?.message
          })
          // 只有在401错误时才清除状态
          if (error?.response?.status === 401) {
            console.log('[Auth Check] 401 error, resetting state')
            this.resetState()
          }
          return false
        } finally {
          this.loading = false
          this.currentAuthCheck = null
        }
      })()

      return this.currentAuthCheck
    },

    resetState() {
      console.log('[Auth] Resetting state')
      this.user = null
      this.isAuthenticated = false
      this.permissions = []
      this.menus = []
      this.permissionsLoaded = false
      this.currentAuthCheck = null
      localStorage.removeItem('accessToken')
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