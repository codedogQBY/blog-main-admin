<template>
  <el-menu
    :default-active="activeMenu"
    mode="vertical"
    class="dynamic-menu"
    :collapse="isCollapse"
    :unique-opened="true"
    router
  >
    <div v-for="menu in accessibleMenus" :key="menu.path">
      <el-menu-item 
        v-if="!menu.children || menu.children.length === 0"
        :index="menu.path"
        class="menu-item"
      >
        <el-icon v-if="menu.icon" class="menu-icon">
          <component :is="menu.icon" />
        </el-icon>
        <span class="menu-title">{{ menu.title }}</span>
      </el-menu-item>
      
      <el-sub-menu v-else :index="menu.path" class="sub-menu">
        <template #title>
          <el-icon v-if="menu.icon" class="menu-icon">
            <component :is="menu.icon" />
          </el-icon>
          <span class="menu-title">{{ menu.title }}</span>
        </template>
        
        <el-menu-item 
          v-for="child in menu.children"
          :key="child.path"
          :index="child.path"
          class="sub-menu-item"
        >
          <el-icon v-if="child.icon" class="menu-icon">
            <component :is="child.icon" />
          </el-icon>
          <span class="menu-title">{{ child.title }}</span>
        </el-menu-item>
      </el-sub-menu>
    </div>
    
    <!-- 没有权限的提示 -->
    <div v-if="accessibleMenus.length === 0" class="no-permission">
      <el-icon><Lock /></el-icon>
      <p>暂无可访问的菜单</p>
    </div>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../lib/store'
import { 
  UserFilled, 
  User, 
  Lock, 
  Setting,
  Key,
  Document,
  EditPen,
  Collection,
  PriceTag,
  HomeFilled,
  Folder,
  ChatDotRound,
  Notebook,
  Stamp,
  Management,
  Files,
  Comment,
  Picture,
  FolderOpened,
  DocumentCopy,
  Warning,
  Link
} from '@element-plus/icons-vue'
import { PERMISSIONS } from '../lib/permissions'

interface Props {
  isCollapse?: boolean
}

interface MenuItem {
  title: string
  path?: string
  icon?: any
  permission?: string
  order?: number
  children?: MenuItem[]
  permissions?: string[]
}

defineProps<Props>()

const route = useRoute()
const authStore = useAuthStore()

// 定义所有可能的菜单项（重新组织后的结构）
const allMenuItems: MenuItem[] = [
  // 1. 控制台
  {
    path: '/admin',
    title: '控制台',
    icon: HomeFilled,
    permission: '',
    order: 1
  },
  
  // 2. 个人设置
  {
    path: '/admin/profile',
    title: '个人设置',
    icon: UserFilled,
    permission: '',
    order: 2
  },
  
  // 3. 内容管理
  {
    path: '/admin/content',
    title: '内容管理',
    icon: Document,
    permission: '',
    order: 3,
    children: [
      {
        path: '/admin/articles',
        title: '文章管理',
        icon: Document,
        permission: PERMISSIONS.ARTICLE.READ,
        order: 1
      },
      {
        path: '/admin/categories',
        title: '分类管理',
        icon: Collection,
        permission: PERMISSIONS.ARTICLE.CATEGORY.READ,
        order: 2
      },
      {
        path: '/admin/tags',
        title: '标签管理',
        icon: PriceTag,
        permission: PERMISSIONS.ARTICLE.TAG.READ,
        order: 3
      },
      {
        path: '/admin/gallery',
        title: '图库管理',
        icon: Picture,
        permission: PERMISSIONS.GALLERY.READ,
        order: 4
      },
      {
        path: '/admin/gallery-categories',
        title: '图库分类',
        icon: Collection,
        permission: PERMISSIONS.GALLERY.CATEGORY.READ,
        order: 5
      },
      {
        path: '/admin/diary-notes',
        title: '随记管理',
        icon: Notebook,
        permission: PERMISSIONS.DIARY.READ,
        order: 6
      }
    ]
  },
  
  // 4. 互动管理
  {
    path: '/admin/interaction',
    title: '互动管理',
    icon: Comment,
    permission: '',
    order: 4,
    children: [
      {
        path: '/admin/interactions',
        title: '评论管理',
        icon: ChatDotRound,
        permission: PERMISSIONS.INTERACTION.READ,
        order: 1
      },
      {
        path: '/admin/sticky-notes',
        title: '留言管理',
        icon: EditPen,
        permission: PERMISSIONS.STICKY_NOTE.READ,
        order: 2
      }
    ]
  },
  
  // 5. 个性化设置
  {
    path: '/admin/customization',
    title: '个性化',
    icon: Setting,
    permission: '',
    order: 5,
    children: [
      {
        path: '/admin/diary-signatures',
        title: '签名管理',
        icon: Stamp,
        permission: PERMISSIONS.DIARY.SIGNATURE.READ,
        order: 1
      },
      {
        path: '/admin/about',
        title: '关于页面',
        icon: UserFilled,
        permission: PERMISSIONS.ABOUT.READ,
        order: 2
      }
    ]
  },
  
  // 6. 文件管理
  {
    path: '/admin/files',
    title: '文件管理',
    icon: Folder,
    permission: PERMISSIONS.FILE.READ,
    order: 6
  },
  
  // 7. 系统管理
  {
    path: '/admin/system',
    title: '系统管理',
    icon: Management,
    permission: '',
    order: 7,
    children: [
      {
        path: '/admin/users',
        title: '用户管理',
        icon: UserFilled,
        permission: PERMISSIONS.USER.READ,
        order: 1
      },
      {
        path: '/admin/roles',
        title: '角色管理', 
        icon: User,
        permission: PERMISSIONS.ROLE.READ,
        order: 2
      },
      {
        path: '/admin/permissions',
        title: '权限管理',
        icon: Key,
        permission: PERMISSIONS.PERMISSION.READ,
        order: 3
      },
      {
        path: '/admin/permission-groups',
        title: '权限组管理',
        icon: FolderOpened,
        permission: PERMISSIONS.PERMISSION.GROUP.READ,
        order: 4
      },
      {
        path: '/admin/two-factor',
        title: '2FA管理',
        icon: Lock,
        permission: PERMISSIONS.TWO_FACTOR.READ,
        order: 5
      }
    ]
  },
  
  // 8. 友链管理
  {
    title: '友链管理',
    path: '/blog/friend-links',
    icon: Link,
    permissions: [PERMISSIONS.FRIEND_LINK.READ]
  },
  
  // 9. 系统监控
  {
    path: '/admin/monitoring',
    title: '系统监控',
    icon: Warning,
    permission: '',
    order: 8,
    children: [
      {
        path: '/admin/monitoring/logs',
        title: '系统日志',
        icon: DocumentCopy,
        permission: PERMISSIONS.LOG.READ,
        order: 1
      },
      {
        path: '/admin/monitoring/alerts',
        title: '系统告警',
        icon: Warning,
        permission: PERMISSIONS.ALERT.READ,
        order: 2
      },
      {
        path: '/admin/monitoring/performance',
        title: '性能分析',
        icon: Management,
        permission: PERMISSIONS.PERFORMANCE.READ,
        order: 3
      },
      {
        path: '/admin/monitoring/test',
        title: '监控测试',
        icon: Setting,
        permission: PERMISSIONS.LOG.READ,
        order: 4
      }
    ]
  }
]

// 计算用户有权限访问的菜单
const accessibleMenus = computed(() => {
  const userPermissions = authStore.userPermissions || []
  const isSuperAdmin = authStore.user?.isSuperAdmin
  
  return allMenuItems
    .filter(menu => {
      // 超级管理员可以访问所有菜单
      if (isSuperAdmin) return true
      
      // 检查菜单权限
      if (menu.permission) {
        return userPermissions.includes(menu.permission)
      }
      
      // 对于有子菜单的项，检查是否有任何子菜单权限
      if (menu.children && menu.children.length > 0) {
        return menu.children.some(child => 
          child.permission ? userPermissions.includes(child.permission) : true
        )
      }
      
      return true // 对于没有权限要求的菜单（如控制台），默认显示
    })
    .map(menu => {
      // 过滤子菜单
      if (menu.children && menu.children.length > 0) {
        const accessibleChildren = menu.children.filter(child =>
          isSuperAdmin || !child.permission || userPermissions.includes(child.permission)
        ).sort((a, b) => (a.order || 999) - (b.order || 999))
        
        // 如果没有可访问的子菜单，则不显示父菜单
        return accessibleChildren.length > 0 ? { ...menu, children: accessibleChildren } : null
      }
      return menu
    })
    .filter(menu => menu !== null) // 移除为null的菜单项
    .sort((a, b) => (a.order || 999) - (b.order || 999))
})

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped lang="scss">
.dynamic-menu {
  background: transparent;
  border: none;
  padding: 8px;
  
  :deep(.el-menu) {
    border: none;
    background: transparent;
  }
  
  .menu-item,
  :deep(.el-sub-menu) {
    height: 40px;
    line-height: 40px;
    margin: 4px 0;
    border-radius: 6px;
    color: #64748b;
    transition: all 0.2s ease;
    
    &:hover {
      color: #1e293b;
      background: #f3f4f6;
    }
    
    &.is-active {
      color: #1e293b;
      background: #f3f4f6;
      font-weight: 500;
    }
    
    .menu-icon {
      font-size: 16px;
      margin-right: 12px;
      color: #64748b;
    }
    
    .menu-title {
      font-size: 14px;
    }
  }
  
  :deep(.el-sub-menu) {
    height: auto;
    margin: 0;
    
    .el-sub-menu__title {
      height: 40px;
      line-height: 40px;
      margin: 4px 0;
      padding: 0 16px !important;
      color: #64748b;
      border-radius: 6px;
      
      &:hover {
        color: #1e293b;
        background: #f3f4f6;
      }
      
      .menu-icon {
        color: #64748b;
      }
    }
    
    &.is-opened {
      > .el-sub-menu__title {
        color: #1e293b;
        background: #f3f4f6;
        
        .menu-icon {
          color: #1e293b;
        }
      }
      
      > .el-menu {
        padding: 0;
        background: transparent;
      }
    }
    
    .el-menu {
      padding: 0;
      background: transparent;
      
      .el-menu-item {
        height: 36px;
        line-height: 36px;
        padding-left: 48px !important;
        margin: 2px 0;
      }
    }
  }
  
  // 折叠状态
  &.el-menu--collapse {
    width: 64px;
    padding: 8px 4px;
    
    .menu-item,
    :deep(.el-sub-menu) {
      .el-sub-menu__title {
        padding: 0 20px !important;
      }
      
      .menu-icon {
        margin: 0;
      }
      
      .menu-title {
        display: none;
      }
    }
  }
}

// 弹出的子菜单样式
:deep(.el-menu--popup) {
  min-width: 180px;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .el-menu-item {
    height: 36px;
    line-height: 36px;
    margin: 2px 0;
    padding: 0 16px;
    border-radius: 4px;
    
    &:hover {
      color: #1e293b;
      background: #f3f4f6;
    }
    
    &.is-active {
      color: #1e293b;
      background: #f3f4f6;
      font-weight: 500;
    }
  }
}

.no-permission {
  text-align: center;
  padding: 40px 20px;
  color: #64748b;
  font-size: 14px;

  .el-icon {
    font-size: 32px;
    margin-bottom: 12px;
    color: #94a3b8;
  }

  p {
    margin: 0;
  }
}
</style> 