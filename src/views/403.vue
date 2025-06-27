<template>
  <div class="error-container">
    <div class="error-content">
      <div class="error-icon">
        <el-icon size="120"><Lock /></el-icon>
      </div>
      <h1 class="error-title">403</h1>
      <h2 class="error-subtitle">权限不足</h2>
      <p class="error-description">
        抱歉，您没有权限访问此页面。<br>
        请联系管理员获取相应权限，或检查您的登录状态。
      </p>
      <div class="error-actions">
        <el-button type="primary" @click="goBack">返回上一页</el-button>
        <el-button @click="goHome">回到首页</el-button>
        <el-button @click="refreshPermissions">刷新权限</el-button>
      </div>
      <div class="error-info">
        <p>当前用户：{{ authStore.user?.name || '未登录' }}</p>
        <p>用户角色：{{ authStore.user?.role?.name || '无角色' }}</p>
        <p v-if="authStore.user?.isSuperAdmin" class="super-admin-tag">
          <el-tag type="danger">超级管理员</el-tag>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { Lock } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../lib/store'

const router = useRouter()
const authStore = useAuthStore()

const goBack = () => {
  router.back()
}

const goHome = () => {
  router.push('/')
}

const refreshPermissions = async () => {
  try {
    await authStore.fetchUserProfile()
    ElMessage.success('权限已刷新')
    // 如果有来源页面，尝试重新访问
    const fromPath = router.currentRoute.value.query.from as string
    if (fromPath) {
      router.push(fromPath)
    } else {
      goHome()
    }
  } catch (error) {
    ElMessage.error('刷新权限失败')
  }
}
</script>

<style scoped>
.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.error-content {
  text-align: center;
  background: white;
  padding: 60px 40px;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.error-icon {
  color: #f56c6c;
  margin-bottom: 24px;
}

.error-title {
  font-size: 72px;
  font-weight: bold;
  color: #f56c6c;
  margin: 0 0 16px 0;
  line-height: 1;
}

.error-subtitle {
  font-size: 28px;
  color: #333;
  margin: 0 0 16px 0;
  font-weight: 500;
}

.error-description {
  color: #666;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 32px;
}

.error-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 32px;
}

.error-info {
  padding-top: 24px;
  border-top: 1px solid #eee;
  color: #999;
  font-size: 14px;
}

.error-info p {
  margin: 8px 0;
}

.super-admin-tag {
  margin-top: 12px;
}

@media (max-width: 768px) {
  .error-content {
    padding: 40px 24px;
  }
  
  .error-title {
    font-size: 56px;
  }
  
  .error-subtitle {
    font-size: 24px;
  }
  
  .error-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .error-actions .el-button {
    width: 100%;
    max-width: 200px;
  }
}
</style> 