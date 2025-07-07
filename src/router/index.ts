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
    permissions?: string[];
    requiresAuth?: boolean;
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
      path: '/admin',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/profile',
      name: 'UserProfile',
      component: () => import('../views/UserProfile.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/users',
      name: 'Users',
      component: () => import('../views/Users.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/roles',
      name: 'Roles',
      component: () => import('../views/Roles.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/permissions',
      name: 'Permissions',
      component: () => import('../views/Permissions.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/permission-groups',
      name: 'PermissionGroups',
      component: () => import('../views/PermissionGroups.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/two-factor',
      name: 'TwoFactorManagement',
      component: () => import('../views/TwoFactorManagement.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/articles',
      name: 'Articles',
      component: () => import('../views/blog/ArticleList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/categories',
      name: 'Categories',
      component: () => import('../views/Categories.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/tags',
      name: 'Tags',
      component: () => import('../views/blog/TagList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/gallery',
      name: 'Gallery',
      component: () => import('../views/blog/GalleryList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/gallery-categories',
      name: 'GalleryCategories',
      component: () => import('../views/blog/GalleryCategoryList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/diary-notes',
      name: 'DiaryNotes',
      component: () => import('../views/DiaryNotes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/sticky-notes',
      name: 'StickyNotes',
      component: () => import('../views/StickyNotes.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/interactions',
      name: 'Interactions',
      component: () => import('../views/blog/InteractionList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/files',
      name: 'Files',
      component: () => import('../views/Files.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/about',
      name: 'About',
      component: () => import('../views/About.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/diary-signatures',
      name: 'DiarySignatures',
      component: () => import('../views/DiarySignatures.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/friend-links',
      name: 'FriendLinks',
      component: () => import('../views/blog/FriendLinks.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/monitoring/logs',
      name: 'SystemLogs',
      component: () => import('../views/monitoring/SystemLogs.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/monitoring/alerts',
      name: 'SystemAlerts',
      component: () => import('../views/monitoring/SystemAlerts.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/monitoring/performance',
      name: 'PerformanceAnalysis',
      component: () => import('../views/monitoring/PerformanceAnalysis.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin/monitoring/test',
      name: 'MonitoringTest',
      component: () => import('../views/monitoring/MonitoringTest.vue'),
      meta: { requiresAuth: true }
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/admin')
  } else {
    next()
  }
})

export default router 