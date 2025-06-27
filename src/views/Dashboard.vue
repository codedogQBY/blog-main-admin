<template>
  <el-container class="dashboard-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '240px'" class="sidebar">
      <div class="logo-container">
        <div v-if="!isCollapse" class="logo">
          <h2>博客管理</h2>
        </div>
        <div v-else class="logo-mini">
          <span>B</span>
        </div>
      </div>
      
      <div class="menu-container">
        <DynamicMenu :is-collapse="isCollapse" />
      </div>
    </el-aside>

    <!-- 主内容区 -->
    <el-container>
      <!-- 顶栏 -->
      <el-header class="header">
        <div class="header-left">
          <el-button
            :icon="isCollapse ? Expand : Fold"
            @click="toggleCollapse"
            text
            size="large"
          />
          
          <!-- 面包屑导航 -->
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item>控制台</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPageTitle">{{ currentPageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <!-- 用户权限信息 -->
          <div class="user-role" v-if="authStore.user">
            <el-tag v-if="authStore.user.isSuperAdmin" type="danger" size="small">超级管理员</el-tag>
            <el-tag v-else-if="authStore.user.role" type="info" size="small">{{ authStore.user.role.name }}</el-tag>
          </div>
          
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
              <span v-if="authStore.user" class="username">{{ authStore.user.name }}</span>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="refresh" divided>刷新权限</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主内容 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Fold, Expand } from '@element-plus/icons-vue'
import { useAuthStore } from '../lib/store'
import DynamicMenu from '../components/DynamicMenu.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const isCollapse = ref(false)

// 当前页面标题
const currentPageTitle = computed(() => {
  return route.meta.title as string || ''
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const handleCommand = async (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人信息功能开发中')
      break
    case 'refresh':
      try {
        await authStore.fetchUserProfile()
        ElMessage.success('权限信息已刷新')
      } catch (error) {
        ElMessage.error('刷新权限失败')
      }
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        authStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      })
      break
  }
}
</script>

<style scoped>
.dashboard-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  transition: width 0.3s;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.logo-container {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #434a50;
  margin-bottom: 1px;
  flex-shrink: 0;
}

.logo h2 {
  color: white;
  font-size: 18px;
  margin: 0;
}

.logo-mini span {
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.menu-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.header {
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.breadcrumb {
  margin-left: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-role {
  margin-right: 8px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.user-info:hover {
  background-color: #f5f5f5;
}

.username {
  margin-left: 8px;
  color: #333;
  font-size: 14px;
}

.main-content {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

/* 动态菜单样式适配 */
.menu-container :deep(.dynamic-menu) {
  background-color: #304156;
}

.menu-container :deep(.el-menu-item) {
  color: #bfcbd9;
  background-color: transparent;
}

.menu-container :deep(.el-menu-item:hover) {
  background-color: rgba(64, 158, 255, 0.2);
}

.menu-container :deep(.el-menu-item.is-active) {
  background-color: #409eff;
  color: white;
}

.menu-container :deep(.el-sub-menu__title) {
  color: #bfcbd9;
}

.menu-container :deep(.el-sub-menu__title:hover) {
  background-color: rgba(64, 158, 255, 0.2);
}
</style> 