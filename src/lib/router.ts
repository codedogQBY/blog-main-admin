import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './store'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('../views/403.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/users'
      },
      {
        path: '/users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: { 
          requiresAuth: true,
          permission: 'user.read',
          title: '用户管理'
        }
      },
      {
        path: '/roles',
        name: 'Roles',
        component: () => import('../views/Roles.vue'),
        meta: { 
          requiresAuth: true,
          permission: 'role.read',
          title: '角色管理'
        }
      },
      {
        path: '/permissions',
        name: 'Permissions',
        component: () => import('../views/Permissions.vue'),
        meta: { 
          requiresAuth: true,
          permission: 'permission.read',
          title: '权限管理'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      await authStore.checkAuth()
      if (!authStore.isAuthenticated) {
        next('/login')
        return
      }
    }

    // 处理首页重定向，基于用户权限选择可访问的第一个页面
    if (to.path === '/' || (to.path === '' && to.name === 'Dashboard')) {
      const accessibleMenus = authStore.accessibleMenus
      if (accessibleMenus.length > 0) {
        next(accessibleMenus[0].path)
        return
      } else {
        // 如果用户没有任何页面权限，跳转到403
        ElMessage.error('您没有访问任何页面的权限')
        next('/403')
        return
      }
    }

    // 检查页面权限
    if (to.meta.permission) {
      const hasPermission = authStore.hasPermission(to.meta.permission as string)
      if (!hasPermission) {
        ElMessage.error('您没有访问此页面的权限')
        next('/403')
        return
      }
    }
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    next('/')
    return
  }
  
  next()
})

export default router 