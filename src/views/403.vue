<template>
  <div class="error-page">
    <div class="error-content">
      <div class="error-code">
        <span>4</span>
        <div class="lock-icon">
          <el-icon><Lock /></el-icon>
        </div>
        <span>3</span>
      </div>
      <h2 class="error-title">访问被拒绝</h2>
      <p class="error-desc">抱歉，您没有权限访问此页面</p>
      <p class="error-contact">如需访问权限，请联系系统管理员</p>
      <div class="error-actions">
        <el-button type="primary" @click="router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回上一页
        </el-button>
        <el-button @click="router.push('/admin')">
          <el-icon><HomeFilled /></el-icon>
          回到首页
        </el-button>
      </div>
      <div class="error-info" v-if="authStore.user">
        <p>当前用户：{{ authStore.user.name }}</p>
        <p>用户角色：{{ authStore.user.role?.name || '无角色' }}</p>
        <p v-if="authStore.user.isSuperAdmin" class="super-admin-tag">
          <el-tag type="danger">超级管理员</el-tag>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../lib/store'
import { Lock, ArrowLeft, HomeFilled } from '@element-plus/icons-vue'

const router = useRouter()
const authStore = useAuthStore()
</script>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.error-content {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  max-width: 90%;
  width: 500px;
}

.error-code {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.lock-icon {
  margin: 0 1rem;
  background: #409eff;
  color: white;
  width: 5rem;
  height: 5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.35);
}

.lock-icon :deep(.el-icon) {
  font-size: 2.5rem;
}

.error-title {
  font-size: 2rem;
  color: #303133;
  margin: 1rem 0;
  font-weight: 600;
}

.error-desc {
  color: #606266;
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.error-contact {
  color: #909399;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.error-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
}

.error-actions .el-button {
  min-width: 120px;
}

.error-info {
  text-align: left;
  background: #f5f7fa;
  padding: 1rem;
  border-radius: 0.5rem;
  margin-top: 2rem;
}

.error-info p {
  margin: 0.5rem 0;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.super-admin-tag {
  justify-content: center;
  margin-top: 1rem !important;
}

@media (max-width: 640px) {
  .error-code {
    font-size: 4rem;
  }
  
  .lock-icon {
    width: 3.5rem;
    height: 3.5rem;
  }
  
  .lock-icon :deep(.el-icon) {
    font-size: 1.75rem;
  }
  
  .error-title {
    font-size: 1.5rem;
  }
  
  .error-actions {
    flex-direction: column;
  }
  
  .error-actions .el-button {
    width: 100%;
  }
}
</style> 