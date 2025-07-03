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

  // 如果是登录页且已登录，重定向到管理页
  if (to.path === '/login' && authStore.isAuthenticated) {
    next('/admin')
    return
  }

  const requiresAuth = to.meta.requiresAuth !== false

  // 如果不需要认证，直接通过
  if (!requiresAuth) {
    next()
    return
  }

  // 检查认证状态
  if (!authStore.isAuthenticated) {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        const success = await authStore.checkAuth()
        if (success) {
          next()
          return
        } else {
          next('/login')
          return
        }
      } catch (error) {
        localStorage.removeItem('accessToken')
        next('/login')
        return
      }
    } else {
      next('/login')
      return
    }
  }

  // 检查权限
  const requiredPermissions = to.meta.permissions
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasPermission = requiredPermissions.every(p => authStore.hasPermission(p))
    
    if (!hasPermission) {
      next('/403')
      return
    }
  }

  next()
})

export default router 