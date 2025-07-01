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
  FolderOpened
} from '@element-plus/icons-vue'

interface Props {
  isCollapse?: boolean
}

interface MenuItem {
  path: string
  title: string
  icon: any
  permission: string
  order: number
  children?: MenuItem[]
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
  
  // 2. 内容管理
  {
    path: '/admin/content',
    title: '内容管理',
    icon: Document,
    permission: '',
    order: 2,
    children: [
      {
        path: '/admin/articles',
        title: '文章管理',
        icon: Document,
        permission: 'article.read',
        order: 1
      },
      {
        path: '/admin/categories',
        title: '分类管理',
        icon: Collection,
        permission: 'category.read',
        order: 2
      },
      {
        path: '/admin/tags',
        title: '标签管理',
        icon: PriceTag,
        permission: 'tag.read',
        order: 3
      },
      {
        path: '/admin/gallery',
        title: '图库管理',
        icon: Picture,
        permission: 'gallery.read',
        order: 4
      },
      {
        path: '/admin/gallery-categories',
        title: '图库分类',
        icon: Collection,
        permission: 'gallery.category.read',
        order: 5
      },
      {
        path: '/admin/diary-notes',
        title: '随记管理',
        icon: Notebook,
        permission: 'diary.read',
        order: 6
      }
    ]
  },
  
  // 3. 互动管理
  {
    path: '/admin/interaction',
    title: '互动管理',
    icon: Comment,
    permission: '',
    order: 3,
    children: [
      {
        path: '/admin/interactions',
        title: '评论管理',
        icon: ChatDotRound,
        permission: 'interaction.read',
        order: 1
      },
      {
        path: '/admin/sticky-notes',
        title: '留言管理',
        icon: EditPen,
        permission: 'sticky-note.read',
        order: 2
      }
    ]
  },
  
  // 4. 个性化设置
  {
    path: '/admin/customization',
    title: '个性化',
    icon: Setting,
    permission: '',
    order: 4,
    children: [
      {
        path: '/admin/diary-signatures',
        title: '签名管理',
        icon: Stamp,
        permission: 'diary.signature.read',
        order: 1
      },
      {
        path: '/admin/about',
        title: '关于页面',
        icon: UserFilled,
        permission: 'about.read',
        order: 2
      }
    ]
  },
  
  // 5. 文件管理
  {
    path: '/admin/files',
    title: '文件管理',
    icon: Folder,
    permission: 'file.read',
    order: 5
  },
  
  // 6. 系统管理
  {
    path: '/admin/system',
    title: '系统管理',
    icon: Management,
    permission: '',
    order: 6,
    children: [
      {
        path: '/admin/users',
        title: '用户管理',
        icon: UserFilled,
        permission: 'user.read',
        order: 1
      },
      {
        path: '/admin/roles',
        title: '角色管理', 
        icon: User,
        permission: 'role.read',
        order: 2
      },
      {
        path: '/admin/permissions',
        title: '权限管理',
        icon: Key,
        permission: 'permission.read',
        order: 3
      },
      {
        path: '/admin/permission-groups',
        title: '权限组管理',
        icon: FolderOpened,
        permission: 'permission.group.read',
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
  border: none;
  background: transparent;
  height: 100%;

  // 菜单项样式
  .menu-item,
  .sub-menu-item {
    margin: 4px 12px;
    border-radius: 8px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    color: rgba(255, 255, 255, 0.8);
    border: none !important;

    &::before {
      display: none;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1) !important;
      color: white;
      transform: translateX(4px);
    }

    &.is-active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      
      .menu-icon {
        color: white;
      }
    }

    .menu-icon {
      color: rgba(255, 255, 255, 0.7);
      font-size: 18px;
      transition: color 0.3s ease;
    }

    .menu-title {
      font-weight: 500;
      font-size: 14px;
    }
  }

  // 子菜单样式
  .sub-menu {
    margin: 4px 12px;

    :deep(.el-sub-menu__title) {
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.8);
      padding: 0 20px;
      height: 48px;
      line-height: 48px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: rgba(255, 255, 255, 0.1) !important;
        color: white;
        transform: translateX(4px);
      }

      .menu-icon {
        color: rgba(255, 255, 255, 0.7);
        font-size: 18px;
      }

      .menu-title {
        font-weight: 500;
        font-size: 14px;
      }
    }

    :deep(.el-sub-menu__icon-arrow) {
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      transition: transform 0.3s ease;
    }

    &.is-opened {
      :deep(.el-sub-menu__icon-arrow) {
        transform: rotateZ(90deg);
      }
    }
  }

  // 子菜单项容器
  :deep(.el-menu) {
    background: transparent;
  }

  // 子菜单项特殊样式
  .sub-menu-item {
    margin: 2px 16px;
    padding-left: 24px;
    border-radius: 6px;
    font-size: 13px;
    
    .menu-icon {
      font-size: 16px;
    }
    
    &:hover {
      transform: translateX(2px);
    }
  }

  // 折叠状态
  &.el-menu--collapse {
    .menu-item,
    .sub-menu-item {
      margin: 4px 8px;
      
      .menu-title {
        display: none;
      }
    }
  }
}

.no-permission {
  text-align: center;
  padding: 40px 20px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;

  .el-icon {
    font-size: 48px;
    margin-bottom: 16px;
    color: rgba(255, 255, 255, 0.3);
  }

  p {
    margin: 0;
  }
}
</style> 