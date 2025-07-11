<template>
  <div class="admin-dashboard">
    <!-- 侧边栏 -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <el-icon><EditPen /></el-icon>
          </div>
          <span v-show="!sidebarCollapsed" class="logo-text">博客管理</span>
        </div>
        <el-button 
          class="collapse-btn"
          size="small"
          text
          @click="toggleSidebar"
        >
          <el-icon>
            <Expand v-if="sidebarCollapsed" />
            <Fold v-else />
          </el-icon>
        </el-button>
      </div>
      
      <div class="sidebar-content">
        <DynamicMenu :is-collapse="sidebarCollapsed" />
      </div>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶部导航栏 -->
      <header class="header">
        <div class="header-left">
          <div class="breadcrumb">
            <el-breadcrumb separator="/">
              <el-breadcrumb-item 
                v-for="item in breadcrumbItems" 
                :key="item.path"
                :to="item.path"
              >
                <el-icon v-if="item.icon"><component :is="item.icon" /></el-icon>
                {{ item.title }}
              </el-breadcrumb-item>
            </el-breadcrumb>
          </div>
        </div>
        
        <div class="header-right">
          <!-- 快捷操作 -->
          <div class="quick-actions">
            <el-tooltip content="创作新文章" placement="bottom">
              <el-button 
                class="action-btn" 
                text 
                @click="$router.push('/admin/articles/create')"
              >
                <el-icon><Plus /></el-icon>
              </el-button>
            </el-tooltip>
          </div>
          
          <!-- 通知 -->
          <el-badge :value="3" class="notification-badge">
            <el-button class="header-btn" text circle>
              <el-icon><Bell /></el-icon>
            </el-button>
          </el-badge>
          
          <!-- 用户信息 -->
          <el-dropdown @command="handleUserCommand" class="user-dropdown">
            <div class="user-info">
              <el-avatar 
                :size="36" 
                :src="(userStore.user as any)?.avatar" 
                class="user-avatar"
              >
                {{ userStore.user?.name?.charAt(0) }}
              </el-avatar>
              <div v-show="!sidebarCollapsed" class="user-details">
                <span class="user-name">{{ userStore.user?.name }}</span>
                <span class="user-role">管理员</span>
              </div>
              <el-icon class="dropdown-arrow"><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu class="user-menu">
                <el-dropdown-item command="profile">
                  <el-icon><Setting /></el-icon>
                  个人信息
                </el-dropdown-item>
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 页面内容 -->
      <main class="content">
        <div class="content-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  EditPen,
  Expand,
  Fold,
  Bell,
  ArrowDown,
  User,
  Setting,
  SwitchButton,
  HomeFilled,
  Plus,
  Document,
  Comment,
  Management,
  Folder
} from '@element-plus/icons-vue'
import DynamicMenu from '../components/DynamicMenu.vue'
import { useAuthStore } from '../lib/store'

const route = useRoute()
const router = useRouter()
const userStore = useAuthStore()

const sidebarCollapsed = ref(false)

// 当前路由标题
const currentRoute = computed(() => {
  return route.meta?.title as string
})

// 面包屑项目
const breadcrumbItems = computed(() => {
  const items = []
  const pathSegments = route.path.split('/').filter(Boolean)
  
  // 如果是首页，只显示控制台
  if (route.path === '/admin' || pathSegments.length <= 1) {
    items.push({ title: '控制台', path: '/admin', icon: 'HomeFilled' })
    return items
  }
  
  const segment = pathSegments[1] // admin之后的第一段
  
  // 根据路径构建层级面包屑
  if (segment === 'articles') {
    items.push({ title: '内容管理', path: '/admin/content' })
    items.push({ title: '文章管理', path: '/admin/articles' })
    if (pathSegments[2] === 'create') {
      items.push({ title: '创作文章', path: route.path })
    } else if (pathSegments[2] === 'edit') {
      items.push({ title: '编辑文章', path: route.path })
    }
  } else if (segment === 'categories') {
    items.push({ title: '内容管理', path: '/admin/content' })
    items.push({ title: '分类管理', path: '/admin/categories' })
  } else if (segment === 'tags') {
    items.push({ title: '内容管理', path: '/admin/content' })
    items.push({ title: '标签管理', path: '/admin/tags' })
  } else if (segment === 'gallery') {
    items.push({ title: '内容管理', path: '/admin/content' })
    items.push({ title: '图库管理', path: '/admin/gallery' })
    if (pathSegments[2] === 'create') {
      items.push({ title: '创建图集', path: route.path })
    } else if (pathSegments[2] === 'edit') {
      items.push({ title: '编辑图集', path: route.path })
    }
  } else if (segment === 'gallery-categories') {
    items.push({ title: '内容管理', path: '/admin/content' })
    items.push({ title: '图库分类', path: '/admin/gallery-categories' })
  } else if (segment === 'diary-notes') {
    items.push({ title: '内容管理', path: '/admin/content' })
    items.push({ title: '随记管理', path: '/admin/diary-notes' })
  } else if (segment === 'interactions') {
    items.push({ title: '互动管理', path: '/admin/interaction' })
    items.push({ title: '评论管理', path: '/admin/interactions' })
  } else if (segment === 'sticky-notes') {
    items.push({ title: '互动管理', path: '/admin/interaction' })
    items.push({ title: '留言管理', path: '/admin/sticky-notes' })
  } else if (segment === 'diary-signatures') {
    items.push({ title: '个性化', path: '/admin/customization' })
    items.push({ title: '签名管理', path: '/admin/diary-signatures' })
  } else if (segment === 'files') {
    items.push({ title: '文件管理', path: '/admin/files' })
  } else if (segment === 'users') {
    items.push({ title: '系统管理', path: '/admin/system' })
    items.push({ title: '用户管理', path: '/admin/users' })
  } else if (segment === 'roles') {
    items.push({ title: '系统管理', path: '/admin/system' })
    items.push({ title: '角色管理', path: '/admin/roles' })
  } else if (segment === 'permissions') {
    items.push({ title: '系统管理', path: '/admin/system' })
    items.push({ title: '权限管理', path: '/admin/permissions' })
  } else {
    // 对于其他页面，回退到控制台
    items.push({ title: '控制台', path: '/admin', icon: 'HomeFilled' })
    if (route.meta?.title) {
      items.push({ title: route.meta.title as string, path: route.path })
    }
  }
  
  return items
})

// 切换侧边栏
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

// 处理用户下拉菜单命令
const handleUserCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      router.push('/admin/profile')
      break
    case 'logout':
      try {
        await ElMessageBox.confirm(
          '确定要退出登录吗？',
          '退出确认',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            customClass: 'logout-confirm'
          }
        )
        
        userStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      } catch {
        // 用户取消
      }
      break
  }
}
</script>

<style scoped lang="scss">
.admin-dashboard {
  display: flex;
  height: 100vh;
  background: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  z-index: 100;
  
  &.collapsed {
    width: 64px;

    .logo {
      padding: 0 12px;
      justify-content: center;
      
      .logo-text {
        display: none;
      }
    }

    .sidebar-header {
      .collapse-btn {
        padding: 8px;
      }
    }
  }

  .sidebar-header {
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    border-bottom: 1px solid #e5e7eb;

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #1e293b;
      font-weight: 600;

      .logo-icon {
        width: 32px;
        height: 32px;
        background: #f3f4f6;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-icon {
          font-size: 18px;
          color: #1e293b;
        }
      }

      .logo-text {
        font-size: 16px;
      }
    }

    .collapse-btn {
      color: #64748b;
      padding: 8px;
      border-radius: 6px;
      cursor: pointer;
      
      &:hover {
        color: #1e293b;
        background: #f3f4f6;
      }
    }
  }

  .sidebar-content {
    height: calc(100vh - 64px);
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
  }
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  height: 72px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  z-index: 50;

  .header-left {
    .breadcrumb {
      :deep(.el-breadcrumb__item) {
        font-size: 14px;
        
        .el-breadcrumb__inner {
          color: #64748b;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          
          &:hover {
            color: #3b82f6;
          }
        }
        
        &:last-child .el-breadcrumb__inner {
          color: #1e293b;
          font-weight: 600;
        }
      }
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 16px;

    .quick-actions {
      display: flex;
      gap: 8px;

      .action-btn {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: #f1f5f9;
        color: #64748b;
        border: none;
        transition: all 0.2s ease;

        &:hover {
          background: #e2e8f0;
          color: #3b82f6;
          transform: translateY(-1px);
        }

        .el-icon {
          font-size: 18px;
        }
      }
    }

    .notification-badge {
      .header-btn {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: #f1f5f9;
        color: #64748b;
        border: none;
        transition: all 0.2s ease;
        
        &:hover {
          background: #e2e8f0;
          color: #3b82f6;
          transform: translateY(-1px);
        }

        .el-icon {
          font-size: 18px;
        }
      }
    }

    .user-dropdown {
      .user-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 16px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid transparent;

        &:hover {
          background: #f8fafc;
          border-color: #e2e8f0;
        }

        .user-avatar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .user-details {
          display: flex;
          flex-direction: column;
          text-align: left;

          .user-name {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
            line-height: 1.2;
          }

          .user-role {
            font-size: 12px;
            color: #64748b;
            line-height: 1.2;
          }
        }

        .dropdown-arrow {
          color: #94a3b8;
          font-size: 12px;
          transition: transform 0.2s ease;
        }
      }
    }
  }
}

.content {
  flex: 1;
  overflow: auto;
  background: #f8fafc;

  .content-wrapper {
    min-height: 100%;
    padding: 24px 32px;
  }
}

// 页面切换动画
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

// 用户菜单样式
:deep(.user-menu) {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  padding: 8px;

  .el-dropdown-menu__item {
    border-radius: 8px;
    margin: 2px 0;
    padding: 10px 12px;
    font-size: 14px;
    color: #374151;
    transition: all 0.2s ease;

    &:hover {
      background: #f8fafc;
      color: #3b82f6;
    }

    .el-icon {
      margin-right: 8px;
      font-size: 16px;
    }
  }
}

// 退出确认对话框样式
:deep(.logout-confirm) {
  border-radius: 12px;
  
  .el-message-box__header {
    padding: 24px 24px 16px;
  }

  .el-message-box__content {
    padding: 0 24px 24px;
  }

  .el-message-box__btns {
    padding: 16px 24px 24px;
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .sidebar {
    position: fixed;
    left: -280px;
    z-index: 1000;
    
    &.collapsed {
      left: 0;
      width: 72px;
    }
  }
  
  .main-container {
    margin-left: 0;
  }
  
  .header {
    padding: 0 20px;
    
    .user-details {
      display: none !important;
    }
  }
  
  .content-wrapper {
    padding: 20px;
  }
}

@media (max-width: 768px) {
  .header {
    .quick-actions {
      display: none;
    }
    
    .breadcrumb {
      display: none;
    }
  }
  
  .content-wrapper {
    padding: 16px;
  }
}
</style> 