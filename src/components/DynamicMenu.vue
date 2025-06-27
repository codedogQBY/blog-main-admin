<template>
  <el-menu
    :default-active="activeMenu"
    mode="vertical"
    class="dynamic-menu"
    :collapse="isCollapse"
    :unique-opened="true"
    router
  >
    <template v-for="menu in accessibleMenus" :key="menu.path">
      <el-menu-item 
        v-if="!menu.children || menu.children.length === 0"
        :index="menu.path"
      >
        <el-icon v-if="menu.icon">
          <component :is="menu.icon" />
        </el-icon>
        <span>{{ menu.title }}</span>
      </el-menu-item>
      
      <el-sub-menu v-else :index="menu.path">
        <template #title>
          <el-icon v-if="menu.icon">
            <component :is="menu.icon" />
          </el-icon>
          <span>{{ menu.title }}</span>
        </template>
        
        <el-menu-item 
          v-for="child in menu.children"
          :key="child.path"
          :index="child.path"
        >
          <el-icon v-if="child.icon">
            <component :is="child.icon" />
          </el-icon>
          <span>{{ child.title }}</span>
        </el-menu-item>
      </el-sub-menu>
    </template>
    
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
  Document
} from '@element-plus/icons-vue'

interface Props {
  isCollapse?: boolean
}

defineProps<Props>()

const route = useRoute()
const authStore = useAuthStore()

// 定义所有可能的菜单项
const allMenuItems = [
  {
    path: '/users',
    title: '用户管理',
    icon: UserFilled,
    permission: 'user.read',
    order: 1
  },
  {
    path: '/roles',
    title: '角色管理', 
    icon: User,
    permission: 'role.read',
    order: 2
  },
  {
    path: '/permissions',
    title: '权限管理',
    icon: Key,
    permission: 'permission.read',
    order: 3
  },
  {
    path: '/system',
    title: '系统设置',
    icon: Setting,
    children: [
      {
        path: '/system/config',
        title: '基础配置',
        icon: Setting,
        permission: 'system.config'
      },
      {
        path: '/system/logs',
        title: '操作日志',
        icon: Document,
        permission: 'system.logs'
      }
    ],
    order: 4
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
      
      return false
    })
    .map(menu => {
      // 过滤子菜单
      if (menu.children && menu.children.length > 0) {
        const accessibleChildren = menu.children.filter(child =>
          isSuperAdmin || !child.permission || userPermissions.includes(child.permission)
        )
        return { ...menu, children: accessibleChildren }
      }
      return menu
    })
    .sort((a, b) => (a.order || 999) - (b.order || 999))
})

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})
</script>

<style scoped>
.dynamic-menu {
  border: none;
  background: transparent;
}

.dynamic-menu .el-menu-item {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.2s;
}

.dynamic-menu .el-menu-item:hover {
  background: rgba(64, 158, 255, 0.1);
}

.dynamic-menu .el-menu-item.is-active {
  background: #409eff;
  color: white;
}

.dynamic-menu .el-sub-menu__title {
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.2s;
}

.dynamic-menu .el-sub-menu__title:hover {
  background: rgba(64, 158, 255, 0.1);
}

.no-permission {
  text-align: center;
  padding: 40px 20px;
  color: #999;
  font-size: 14px;
}

.no-permission .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
  color: #ddd;
}

.no-permission p {
  margin: 0;
}
</style> 