<template>
  <div class="profile-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><User /></el-icon>
          个人信息
        </h1>
        <p class="page-subtitle">管理您的个人信息和账户设置</p>
      </div>
    </div>

    <div class="profile-content">
      <el-row :gutter="20">
        <!-- 基本信息卡片 -->
        <el-col :span="16">
          <el-card class="info-card">
            <template #header>
              <div class="card-header">
                <span>基本信息</span>
              </div>
            </template>
            
            <el-form 
              :model="profileForm" 
              :rules="profileRules" 
              ref="profileFormRef"
              label-width="100px"
              class="profile-form"
            >
              <el-form-item label="用户名" prop="name">
                <el-input 
                  v-model="profileForm.name" 
                  placeholder="请输入用户名"
                  :disabled="profileLoading"
                />
              </el-form-item>
              
              <el-form-item label="邮箱">
                <el-input 
                  v-model="profileForm.mail" 
                  placeholder="邮箱已绑定，无法修改"
                  disabled
                />
                <div class="form-tip">
                  <el-text type="info" size="small">邮箱已强制绑定，无法修改</el-text>
                </div>
              </el-form-item>
              
              <el-form-item label="当前密码" prop="currentPassword" v-if="showPasswordFields">
                <el-input 
                  v-model="profileForm.currentPassword" 
                  type="password" 
                  placeholder="请输入当前密码"
                  show-password
                  :disabled="profileLoading"
                />
              </el-form-item>
              
              <el-form-item label="新密码" prop="newPassword" v-if="showPasswordFields">
                <el-input 
                  v-model="profileForm.newPassword" 
                  type="password" 
                  placeholder="请输入新密码"
                  show-password
                  :disabled="profileLoading"
                />
              </el-form-item>
              
              <el-form-item label="确认密码" prop="confirmPassword" v-if="showPasswordFields">
                <el-input 
                  v-model="profileForm.confirmPassword" 
                  type="password" 
                  placeholder="请再次输入新密码"
                  show-password
                  :disabled="profileLoading"
                />
              </el-form-item>
              
              <el-form-item>
                <div class="form-actions">
                  <el-button 
                    type="primary" 
                    @click="handleUpdateProfile"
                    :loading="profileLoading"
                  >
                    更新信息
                  </el-button>
                  <el-button 
                    v-if="!showPasswordFields"
                    @click="togglePasswordFields"
                  >
                    修改密码
                  </el-button>
                  <el-button 
                    v-if="showPasswordFields"
                    @click="cancelPasswordChange"
                  >
                    取消修改密码
                  </el-button>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </el-col>
        
        <!-- 账户信息卡片 -->
        <el-col :span="8">
          <el-card class="account-card">
            <template #header>
              <div class="card-header">
                <span>账户信息</span>
              </div>
            </template>
            
            <div class="account-info">
              <div class="info-item">
                <span class="label">账户类型:</span>
                <el-tag v-if="userStore.user?.isSuperAdmin" type="danger">
                  超级管理员
                </el-tag>
                <el-tag v-else type="primary">
                  {{ userStore.user?.role?.name || '普通用户' }}
                </el-tag>
              </div>
              
              <div class="info-item">
                <span class="label">注册时间:</span>
                <span class="value">{{ formatDate(userStore.user?.createdAt) }}</span>
              </div>
              
              <div class="info-item">
                <span class="label">最后更新:</span>
                <span class="value">{{ formatDate(userStore.user?.updatedAt) }}</span>
              </div>
              
              <div class="info-item" v-if="userStore.user?.role">
                <span class="label">角色权限:</span>
                <div class="permissions-list">
                  <el-tag 
                    v-for="permission in getUserPermissions()"
                    :key="permission"
                    size="small"
                    style="margin: 2px;"
                  >
                    {{ permission }}
                  </el-tag>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import { useRouter } from 'vue-router'

const userStore = useAuthStore()
const router = useRouter()

// 表单数据
const profileForm = reactive({
  name: '',
  mail: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单引用和状态
const profileFormRef = ref()
const profileLoading = ref(false)
const showPasswordFields = ref(false)

// 表单验证规则
const profileRules = reactive({
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度应为2-20个字符', trigger: 'blur' }
  ],
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度应为6-20个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== profileForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 初始化表单数据
const initForm = () => {
  if (userStore.user) {
    profileForm.name = userStore.user.name
    profileForm.mail = userStore.user.mail
  }
}

// 切换密码修改字段显示
const togglePasswordFields = () => {
  showPasswordFields.value = true
  // 重置密码字段
  profileForm.currentPassword = ''
  profileForm.newPassword = ''
  profileForm.confirmPassword = ''
}

// 取消密码修改
const cancelPasswordChange = () => {
  showPasswordFields.value = false
  profileForm.currentPassword = ''
  profileForm.newPassword = ''
  profileForm.confirmPassword = ''
  
  // 清除密码字段的验证错误
  if (profileFormRef.value) {
    profileFormRef.value.clearValidate(['currentPassword', 'newPassword', 'confirmPassword'])
  }
}

// 更新个人信息
const handleUpdateProfile = async () => {
  if (!profileFormRef.value || !userStore.user) return
  
  try {
    // 验证表单
    await profileFormRef.value.validate()
    
    // 确认操作
    await ElMessageBox.confirm(
      showPasswordFields.value 
        ? '确定要更新个人信息和密码吗？' 
        : '确定要更新个人信息吗？',
      '确认更新',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    profileLoading.value = true
    
    // 准备更新数据 - 只包含允许修改的字段
    const updateData: { name?: string; password?: string } = {
      name: profileForm.name
    }
    
    // 如果要修改密码，添加密码字段
    if (showPasswordFields.value && profileForm.newPassword) {
      updateData.password = profileForm.newPassword
    }
    
    // 调用API更新用户信息
    await authApi.updateProfile(updateData)
    
    // 重新获取用户信息
    await userStore.fetchProfile()
    
    // 重置表单状态
    if (showPasswordFields.value) {
      cancelPasswordChange()
    }
    
    ElMessage.success('个人信息更新成功')
    
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('更新个人信息失败:', error)
      ElMessage.error(error?.response?.data?.message || '更新个人信息失败')
    }
  } finally {
    profileLoading.value = false
  }
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 获取用户权限
const getUserPermissions = () => {
  if (userStore.user?.isSuperAdmin) {
    return ['超级管理员权限']
  }
  return userStore.permissions.length > 0 ? userStore.permissions : ['暂无权限']
}

// 初始化
onMounted(() => {
  initForm()
})
</script>

<style scoped>
.profile-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  flex-direction: column;
}

.page-title {
  display: flex;
  align-items: center;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.title-icon {
  margin-right: 8px;
  font-size: 24px;
  color: #409eff;
}

.page-subtitle {
  color: #909399;
  margin: 0;
  font-size: 14px;
}

.profile-content {
  min-height: 400px;
}

.info-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.profile-form {
  padding: 20px 0;
}

.form-tip {
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.account-card,
.security-card {
  height: fit-content;
}

.account-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.label {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.value {
  font-size: 14px;
  color: #303133;
}

.permissions-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.security-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}

.security-item:last-child {
  border-bottom: none;
}

.security-item-content {
  flex: 1;
}

.security-item-title {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.security-item-desc {
  font-size: 12px;
  color: #909399;
}

:deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-input__wrapper) {
  transition: all 0.3s ease;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #409eff inset;
}
</style>