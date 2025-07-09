import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../lib/store'
import { PERMISSIONS } from '../lib/permissions'
import FriendLinks from '@/views/blog/FriendLinks.vue'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import PermissionCheck from '@/components/PermissionCheck.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    icon?: string;
    permissions?: string | string[];
    requiresAuth?: boolean;
    requiresSetup2FA?: boolean;
  }
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/admin/setup-2fa',
      name: 'Setup2FA',
      component: () => import('../views/Setup2FA.vue'),
      meta: { requiresAuth: true, requiresSetup2FA: true }
    },
    {
      path: '/admin',
      name: 'AdminLayout',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Dashboard',
          component: () => import('../views/DashboardHome.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('../views/Users.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.USER.READ] }
        },
        {
          path: 'roles',
          name: 'Roles',
          component: () => import('../views/Roles.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.ROLE.READ] }
        },
        {
          path: 'user-info',
          name: 'UserInfo',
          component: () => import('@/views/UserInfo.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.USERINFO.READ] }
        },
        {
          path: 'permissions',
          name: 'Permissions',
          component: () => import('../views/Permissions.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.PERMISSION.READ] }
        },
        {
          path: 'permission-groups',
          name: 'PermissionGroups',
          component: () => import('../views/PermissionGroups.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.PERMISSION.GROUP.READ] }
        },
        {
          path: 'two-factor',
          name: 'TwoFactorManagement',
          component: () => import('../views/TwoFactorManagement.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.TWO_FACTOR.READ] }
        },
        {
          path: 'articles',
          name: 'Articles',
          component: () => import('../views/blog/ArticleList.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.ARTICLE.READ] }
        },
        {
          path: 'articles/create',
          name: 'ArticleCreate',
          component: () => import('../views/blog/ArticleEditor.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.ARTICLE.CREATE] }
        },
        {
          path: 'articles/edit/:id',
          name: 'ArticleEdit',
          component: () => import('../views/blog/ArticleEditor.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.ARTICLE.UPDATE] }
        },
        {
          path: 'categories',
          name: 'Categories',
          component: () => import('../views/Categories.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.ARTICLE.CATEGORY.READ] }
        },
        {
          path: 'tags',
          name: 'Tags',
          component: () => import('../views/blog/TagList.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.ARTICLE.TAG.READ] }
        },
        {
          path: 'gallery',
          name: 'Gallery',
          component: () => import('../views/blog/GalleryList.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.GALLERY.READ] }
        },
        {
          path: 'gallery/create',
          name: 'GalleryCreate',
          component: () => import('../views/blog/GalleryEditor.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.GALLERY.CREATE] }
        },
        {
          path: 'gallery/edit/:id',
          name: 'GalleryEdit',
          component: () => import('../views/blog/GalleryEditor.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.GALLERY.UPDATE] }
        },
        {
          path: 'gallery-categories',
          name: 'GalleryCategories',
          component: () => import('../views/blog/GalleryCategoryList.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.GALLERY.CATEGORY.READ] }
        },
        {
          path: 'diary-notes',
          name: 'DiaryNotes',
          component: () => import('../views/DiaryNotes.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.DIARY.READ] }
        },
        {
          path: 'sticky-notes',
          name: 'StickyNotes',
          component: () => import('../views/StickyNotes.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.STICKY_NOTE.READ] }
        },
        {
          path: 'interactions',
          name: 'Interactions',
          component: () => import('../views/blog/InteractionList.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.INTERACTION.READ] }
        },
        {
          path: 'files',
          name: 'Files',
          component: () => import('../views/Files.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.FILE.READ] }
        },
        {
          path: 'about',
          name: 'About',
          component: () => import('../views/About.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.ABOUT.READ] }
        },
        {
          path: 'diary-signatures',
          name: 'DiarySignatures',
          component: () => import('../views/DiarySignatures.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.DIARY.SIGNATURE.READ] }
        },
        {
          path: 'friend-links',
          name: 'FriendLinks',
          component: () => import('../views/blog/FriendLinks.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.FRIEND_LINK.READ] }
        },
        {
          path: 'monitoring/logs',
          name: 'SystemLogs',
          component: () => import('../views/monitoring/SystemLogs.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.LOG.READ] }
        },
        {
          path: 'monitoring/alerts',
          name: 'SystemAlerts',
          component: () => import('../views/monitoring/SystemAlerts.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.ALERT.READ] }
        },
        {
          path: 'monitoring/performance',
          name: 'PerformanceAnalysis',
          component: () => import('../views/monitoring/PerformanceAnalysis.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.PERFORMANCE.READ] }
        },
        {
          path: 'monitoring/test',
          name: 'MonitoringTest',
          component: () => import('../views/monitoring/MonitoringTest.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.LOG.READ] }
        },
        {
          path: 'system-config',
          name: 'SystemConfig',
          component: () => import('../views/SystemConfig.vue'),
          meta: { requiresAuth: true, permissions: [PERMISSIONS.SYSTEM.CONFIG.UPDATE] }
        }
      ]
    },
    {
      path: '/403',
      name: '403',
      component: () => import('../views/403.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      redirect: '/admin'
    }
  ]
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 检查是否需要认证
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // 尝试从localStorage获取token并验证
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        await authStore.checkAuth()
      } catch (error) {
        console.error('认证检查失败:', error)
      }
    }
    
    // 如果仍未认证，重定向到登录页
    if (!authStore.isAuthenticated) {
      next({ path: '/login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  // 已登录用户访问登录页时的处理
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/admin')
    return
  }
  
  // 检查是否需要设置2FA
  if (authStore.isAuthenticated && authStore.needsSetup2FA && to.path !== '/admin/setup-2fa') {
    next('/admin/setup-2fa')
    return
  }
  
  // 检查页面权限
  if (to.meta.requiresAuth && authStore.isAuthenticated && to.meta.permissions) {
    const requiredPermissions = Array.isArray(to.meta.permissions) 
      ? to.meta.permissions 
      : [to.meta.permissions]
    
    const hasPermission = requiredPermissions.some(permission => 
      authStore.hasPermission(permission)
    )
    
    if (!hasPermission) {
      console.log('[Router] Permission denied for route:', to.path, {
        required: requiredPermissions,
        userPermissions: authStore.userPermissions
      })
      next('/403')
      return
    }
  }
  
  next()
})

export default router 