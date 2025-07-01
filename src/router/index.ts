import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../lib/store'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue'),
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
        meta: { title: '控制台' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('../views/Users.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'roles',
        name: 'Roles',
        component: () => import('../views/Roles.vue'),
        meta: { title: '角色管理' }
      },
      {
        path: 'permissions',
        name: 'Permissions',
        component: () => import('../views/Permissions.vue'),
        meta: { title: '权限管理' }
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('../views/blog/ArticleList.vue'),
        meta: { title: '文章管理' }
      },
      {
        path: 'articles/create',
        name: 'ArticleCreate',
        component: () => import('../views/blog/ArticleEditor.vue'),
        meta: { title: '创作文章' }
      },
      {
        path: 'articles/edit/:id',
        name: 'ArticleEdit',
        component: () => import('../views/blog/ArticleEditor.vue'),
        meta: { title: '编辑文章' }
      },
      {
        path: 'categories',
        name: 'Categories',
        component: () => import('../views/blog/CategoryList.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'tags',
        name: 'Tags',
        component: () => import('../views/blog/TagList.vue'),
        meta: { title: '标签管理' }
      },
      {
        path: 'interactions',
        name: 'Interactions',
        component: () => import('../views/blog/InteractionList.vue'),
        meta: { title: '交互管理' }
      },
      {
        path: 'gallery',
        name: 'Gallery',
        component: () => import('../views/blog/GalleryList.vue'),
        meta: { title: '图库管理' }
      },
      {
        path: 'gallery/create',
        name: 'GalleryCreate',
        component: () => import('../views/blog/GalleryEditor.vue'),
        meta: { title: '创建图集' }
      },
      {
        path: 'gallery/edit/:id',
        name: 'GalleryEdit',
        component: () => import('../views/blog/GalleryEditor.vue'),
        meta: { title: '编辑图集' }
      },
      {
        path: 'gallery-categories',
        name: 'GalleryCategories',
        component: () => import('../views/blog/GalleryCategoryList.vue'),
        meta: { title: '图库分类管理' }
      },
      {
        path: 'sticky-notes',
        name: 'StickyNotes',
        component: () => import('../views/StickyNotes.vue'),
        meta: { title: '留言管理' }
      },
      {
        path: 'diary-notes',
        name: 'DiaryNotes',
        component: () => import('../views/DiaryNotes.vue'),
        meta: { title: '随记管理' }
      },
      {
        path: 'diary-signatures',
        name: 'DiarySignatures',
        component: () => import('../views/DiarySignatures.vue'),
        meta: { title: '签名管理' }
      },
      {
        path: 'files',
        name: 'Files',
        component: () => import('../views/Files.vue'),
        meta: { title: '文件管理' }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('../views/About.vue'),
        meta: { title: '关于页面配置' }
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
  const requiresAuth = to.meta.requiresAuth !== false

  // 如果需要认证但当前未认证，先检查是否有有效的token
  if (requiresAuth && !authStore.isAuthenticated) {
    const token = localStorage.getItem('accessToken')
    if (token) {
      try {
        // 尝试验证token并获取用户信息
        await authStore.checkAuth()
        // 如果验证成功，继续导航
        if (authStore.isAuthenticated) {
          next()
          return
        }
      } catch (error) {
        console.error('Token验证失败:', error)
        // Token无效，清除并跳转到登录页
        localStorage.removeItem('accessToken')
      }
    }
    // 没有token或token无效，跳转到登录页
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/admin')
  } else {
    next()
  }
})

export default router 