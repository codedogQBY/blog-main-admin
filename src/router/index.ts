import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../lib/store'
import { PERMISSIONS } from '../lib/permissions'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string;
    icon?: string;
    permissions?: string[];
    requiresAuth?: boolean;
  }
}

const routes = [
  {
    path: '/',
    redirect: '/admin'
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/403',
    component: () => import('../views/403.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/admin',
    name: 'Dashboard',
    component: () => import('../views/Dashboard.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('../views/DashboardHome.vue'),
        meta: {
          title: '仪表盘',
          icon: 'House',
          permissions: [PERMISSIONS.DASHBOARD.READ]
        }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: {
          title: '用户管理',
          permissions: [PERMISSIONS.USER.READ]
        }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('../views/Roles.vue'),
        meta: {
          title: '角色管理',
          permissions: [PERMISSIONS.ROLE.READ]
        }
      },
      {
        path: 'permissions',
        name: 'Permissions',
        component: () => import('../views/Permissions.vue'),
        meta: {
          title: '权限管理',
          icon: 'Lock',
          permissions: [PERMISSIONS.PERMISSION.READ]
        }
      },
      {
        path: 'permission-groups',
        name: 'PermissionGroups',
        component: () => import('../views/PermissionGroups.vue'),
        meta: {
          title: '权限组管理',
          icon: 'FolderOpened',
          permissions: [PERMISSIONS.PERMISSION.GROUP.READ]
        }
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('../views/blog/ArticleList.vue'),
        meta: {
          title: '文章管理',
          permissions: [PERMISSIONS.ARTICLE.READ]
        }
      },
      {
        path: 'articles/create',
        name: 'ArticleCreate',
        component: () => import('../views/blog/ArticleEditor.vue'),
        meta: {
          title: '创作文章',
          permissions: [PERMISSIONS.ARTICLE.CREATE]
        }
      },
      {
        path: 'articles/edit/:id',
        name: 'ArticleEdit',
        component: () => import('../views/blog/ArticleEditor.vue'),
        meta: {
          title: '编辑文章',
          permissions: [PERMISSIONS.ARTICLE.UPDATE]
        }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('../views/blog/CategoryList.vue'),
        meta: {
          title: '分类管理',
          permissions: [PERMISSIONS.ARTICLE.CATEGORY.READ]
        }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import('../views/blog/TagList.vue'),
        meta: {
          title: '标签管理',
          permissions: [PERMISSIONS.ARTICLE.TAG.READ]
        }
      },
      {
        path: 'interactions',
        name: 'Interactions',
        component: () => import('../views/blog/InteractionList.vue'),
        meta: {
          title: '交互管理',
          permissions: [PERMISSIONS.INTERACTION.READ]
        }
      },
      {
        path: 'gallery',
        name: 'Gallery',
        component: () => import('../views/blog/GalleryList.vue'),
        meta: {
          title: '图库管理',
          permissions: [PERMISSIONS.GALLERY.READ]
        }
      },
      {
        path: 'gallery/create',
        name: 'GalleryCreate',
        component: () => import('../views/blog/GalleryEditor.vue'),
        meta: {
          title: '创建图集',
          permissions: [PERMISSIONS.GALLERY.CREATE]
        }
      },
      {
        path: 'gallery/edit/:id',
        name: 'GalleryEdit',
        component: () => import('../views/blog/GalleryEditor.vue'),
        meta: {
          title: '编辑图集',
          permissions: [PERMISSIONS.GALLERY.UPDATE]
        }
      },
      {
        path: 'gallery-categories',
        name: 'GalleryCategories',
        component: () => import('../views/blog/GalleryCategoryList.vue'),
        meta: {
          title: '图库分类管理',
          permissions: [PERMISSIONS.GALLERY.CATEGORY.READ]
        }
      },
      {
        path: 'sticky-notes',
        name: 'StickyNotes',
        component: () => import('../views/StickyNotes.vue'),
        meta: {
          title: '留言管理',
          permissions: [PERMISSIONS.STICKY_NOTE.READ]
        }
      },
      {
        path: 'diary-notes',
        name: 'DiaryNotes',
        component: () => import('../views/DiaryNotes.vue'),
        meta: {
          title: '随记管理',
          permissions: [PERMISSIONS.DIARY.READ]
        }
      },
      {
        path: 'diary-signatures',
        name: 'DiarySignatures',
        component: () => import('../views/DiarySignatures.vue'),
        meta: {
          title: '签名管理',
          permissions: [PERMISSIONS.DIARY.SIGNATURE.READ]
        }
      },
      {
        path: 'files',
        name: 'Files',
        component: () => import('../views/Files.vue'),
        meta: {
          title: '文件管理',
          permissions: [PERMISSIONS.FILE.READ]
        }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('../views/About.vue'),
        meta: {
          title: '关于页面配置',
          permissions: [PERMISSIONS.ABOUT.READ]
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
  
  console.log('[Router Guard] Navigation started', {
    to: to.path,
    from: from.path,
    requiresAuth: to.meta.requiresAuth,
    permissions: to.meta.permissions,
    currentState: {
      isAuthenticated: authStore.isAuthenticated,
      hasUser: !!authStore.user,
      permissionsLoaded: authStore.permissionsLoaded
    }
  })

  // 如果是登录页且已登录，重定向到管理页
  if (to.path === '/login' && authStore.isAuthenticated) {
    console.log('[Router Guard] Authenticated user trying to access login page, redirecting to admin')
    next('/admin')
    return
  }

  const requiresAuth = to.meta.requiresAuth !== false

  // 如果不需要认证，直接通过
  if (!requiresAuth) {
    console.log('[Router Guard] Page does not require auth, proceeding')
    next()
    return
  }

  // 检查认证状态
  if (!authStore.isAuthenticated || !authStore.user) {
    console.log('[Router Guard] Not authenticated or no user, checking token')
    const token = localStorage.getItem('accessToken')
    if (!token) {
      console.log('[Router Guard] No token found, redirecting to login')
      next('/login')
      return
    }

    try {
      console.log('[Router Guard] Token found, attempting to check auth')
      const success = await authStore.checkAuth()
      if (!success) {
        console.log('[Router Guard] Auth check failed, redirecting to login')
        next('/login')
        return
      }
      console.log('[Router Guard] Auth check successful')
    } catch (error: any) {
      console.error('[Router Guard] Auth check error:', {
        error,
        status: error?.response?.status
      })
      // 只有在认证失败时才跳转到登录页
      if (error?.response?.status === 401) {
        console.log('[Router Guard] 401 error, redirecting to login')
        next('/login')
        return
      }
      // 其他错误可能是网络问题，让用户停留在当前页面
      console.log('[Router Guard] Non-401 error, staying on current page')
      return
    }
  }

  // 确保权限已加载
  if (!authStore.permissionsLoaded && !authStore.user?.isSuperAdmin) {
    console.log('[Router Guard] Permissions not loaded, attempting to load')
    try {
      await authStore.updatePermissions()
      console.log('[Router Guard] Permissions loaded successfully')
    } catch (error: any) {
      console.error('[Router Guard] Permission loading error:', {
        error,
        status: error?.response?.status
      })
      // 如果是认证失败，跳转到登录页
      if (error?.response?.status === 401) {
        console.log('[Router Guard] 401 error while loading permissions, redirecting to login')
        next('/login')
      } else {
        // 其他错误（如权限加载失败）跳转到403
        console.log('[Router Guard] Permission loading failed, redirecting to 403')
        next('/403')
      }
      return
    }
  }

  // 检查权限
  const requiredPermissions = to.meta.permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    console.log('[Router Guard] Checking required permissions:', {
      required: requiredPermissions,
      current: authStore.permissions
    })
    
    const hasPermission = requiredPermissions.every(p => authStore.hasPermission(p))
    
    if (!hasPermission) {
      console.log('[Router Guard] Permission check failed, redirecting to 403')
      next('/403')
      return
    }
    console.log('[Router Guard] Permission check passed')
  }

  console.log('[Router Guard] All checks passed, proceeding to route:', to.path)
  next()
})

export default router 