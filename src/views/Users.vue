<template>
  <div class="modern-users-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><UserFilled /></el-icon>
          用户管理
        </h1>
        <p class="page-subtitle">管理系统用户和权限分配</p>
      </div>
      <div class="header-right">
        <PermissionCheck permission="user.create">
          <el-button 
            type="primary" 
            @click="showCreateDialog"
            class="create-btn"
          >
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </PermissionCheck>
      </div>
    </div>

    <!-- 搜索和筛选区域 -->
    <div class="search-section">
      <el-card class="search-card" shadow="never">
        <div class="search-form">
          <div class="search-row">
            <div class="search-item">
              <el-input
                v-model="searchText"
                placeholder="搜索用户名或邮箱..."
                class="search-input"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
            
            <div class="search-item">
              <el-select
                v-model="roleFilter"
                placeholder="选择角色"
                clearable
                @change="handleSearch"
                class="role-filter"
              >
                <el-option
                  v-for="role in roles"
                  :key="role.id"
                  :label="role.name"
                  :value="role.id"
                />
              </el-select>
            </div>

            <div class="search-actions">
              <el-button @click="resetSearch" class="reset-btn">
                <el-icon><Refresh /></el-icon>
                重置
              </el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon total">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总用户数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon active">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.active }}</div>
            <div class="stat-label">活跃用户</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon admin">
            <el-icon><Key /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.admin }}</div>
            <div class="stat-label">管理员</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon new">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.newToday }}</div>
            <div class="stat-label">今日新增</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="list-section">
      <el-card class="list-card" shadow="never">
        <template #header>
          <div class="list-header">
            <div class="header-info">
              <span class="result-count">共 {{ total }} 个用户</span>
            </div>
          </div>
        </template>

        <div v-loading="loading" class="user-list">
          <div 
            v-for="user in users" 
            :key="user.id" 
            class="user-item"
          >
            <div class="user-avatar">
              <el-avatar 
                :size="56" 
                :src="(user as any).avatar"
                class="avatar"
              >
                {{ user.name?.charAt(0) }}
              </el-avatar>
            </div>
            
            <div class="user-info">
              <div class="user-header">
                <h3 class="user-name">{{ user.name }}</h3>
                <div class="user-badges">
                  <el-tag v-if="user.isSuperAdmin" type="danger" size="small">超级管理员</el-tag>
                  <el-tag v-else-if="user.role" type="primary" size="small">{{ user.role.name }}</el-tag>
                  <el-tag v-else type="info" size="small">无角色</el-tag>
                </div>
              </div>
              
              <div class="user-details">
                <div class="detail-item">
                  <el-icon><Message /></el-icon>
                  <span>{{ user.mail }}</span>
                </div>
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDate(user.createdAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="user-actions">
              <PermissionCheck :permissions="['user.update', 'user.update.basic']">
                <el-button type="primary" size="small" @click="editUser(user)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </PermissionCheck>
              <PermissionCheck permission="user.delete">
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteUser(user)" 
                  :disabled="user.isSuperAdmin && !authStore.user?.isSuperAdmin"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </PermissionCheck>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && users.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><UserFilled /></el-icon>
          </div>
          <h3 class="empty-title">暂无用户</h3>
          <p class="empty-description">
            {{ searchText ? '没有找到匹配的用户' : '还没有创建任何用户' }}
          </p>
        </div>

        <!-- 分页 -->
        <div v-if="users.length > 0" class="pagination-section">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handleCurrentChange"
            @size-change="handleSizeChange"
            class="pagination"
          />
        </div>
      </el-card>
    </div>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="600px"
      @close="resetForm"
      class="user-dialog"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
        class="user-form"
      >
        <div class="form-row">
          <el-form-item label="用户名" prop="name">
            <el-input v-model="userForm.name" placeholder="请输入用户名" />
          </el-form-item>
          
          <el-form-item label="邮箱" prop="mail">
            <el-input v-model="userForm.mail" placeholder="请输入邮箱" />
          </el-form-item>
        </div>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            :placeholder="isEdit ? '留空则不修改密码' : '请输入密码'"
            show-password
          />
        </el-form-item>
        
        <div class="form-row">
          <PermissionCheck permission="user.manage.role">
            <el-form-item label="角色">
              <el-select v-model="userForm.roleId" placeholder="请选择角色" clearable>
                <el-option
                  v-for="role in roles"
                  :key="role.id"
                  :label="role.name"
                  :value="role.id"
                />
              </el-select>
            </el-form-item>
          </PermissionCheck>
          
          <PermissionCheck permission="user.manage.superadmin">
            <el-form-item label="超级管理员">
              <el-switch v-model="userForm.isSuperAdmin" />
            </el-form-item>
          </PermissionCheck>
        </div>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitForm">
            {{ isEdit ? '更新' : '创建' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { 
  UserFilled, 
  Plus, 
  Search, 
  Refresh, 
  Check, 
  Key, 
  Clock, 
  Message, 
  Calendar, 
  Edit, 
  Delete 
} from '@element-plus/icons-vue'
import { userApi, roleApi } from '../lib/api'
import { useAuthStore } from '../lib/store'
import PermissionCheck from '../components/PermissionCheck.vue'
import type { User, Role } from '../lib/api'

// 获取认证状态
const authStore = useAuthStore()

// 数据状态
const loading = ref(false)
const submitting = ref(false)
const users = ref<User[]>([])
const roles = ref<Role[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const roleFilter = ref('')

// 搜索防抖
let searchTimeout: NodeJS.Timeout | null = null

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const userFormRef = ref<FormInstance>()

// 表单数据
const userForm = reactive({
  id: '',
  name: '',
  mail: '',
  password: '',
  roleId: '',
  isSuperAdmin: false
})

// 统计数据
const stats = computed(() => ({
  total: users.value.length,
  active: users.value.filter(u => !u.isSuperAdmin).length,
  admin: users.value.filter(u => u.isSuperAdmin).length,
  newToday: users.value.filter(u => {
    const today = new Date().toDateString()
    return new Date(u.createdAt).toDateString() === today
  }).length
}))

// 表单验证规则
const userRules: FormRules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  mail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { 
      validator: (rule, value, callback) => {
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'))
        } else if (value && value.length < 6) {
          callback(new Error('密码长度不能少于6位'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ]
}

// 初始化
onMounted(async () => {
  await loadRoles()
  await loadUsers()
})

// 加载用户列表
const loadUsers = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchText.value || undefined,
      roleId: roleFilter.value || undefined
    }
    
    const data = await userApi.getList(params as any)
    users.value = Array.isArray(data) ? data : data.data || []
    total.value = typeof data === 'object' && 'total' in data ? (data as any).total || 0 : users.value.length
  } catch (error) {
    ElMessage.error('加载用户列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载角色列表
const loadRoles = async () => {
  try {
    const data = await roleApi.getList()
    roles.value = Array.isArray(data) ? data : (data as any).data || []
  } catch (error) {
    console.error('加载角色列表失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 300)
}

// 重置搜索
const resetSearch = () => {
  searchText.value = ''
  roleFilter.value = ''
  currentPage.value = 1
  loadUsers()
}

// 分页处理
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadUsers()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadUsers()
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑用户
const editUser = (user: User) => {
  isEdit.value = true
  Object.assign(userForm, {
    id: user.id,
    name: user.name,
    mail: user.mail,
    password: '',
    roleId: (user as any).roleId || user.role?.id || '',
    isSuperAdmin: user.isSuperAdmin || false
  })
  dialogVisible.value = true
}

// 删除用户
const deleteUser = async (user: User) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除用户 "${user.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await userApi.delete(user.id)
    ElMessage.success('删除成功')
    loadUsers()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 提交表单
const submitForm = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    submitting.value = true
    
    const userData = { ...userForm }
    const { password, ...userDataWithoutPassword } = userData
    const finalUserData = isEdit.value && !userData.password ? userDataWithoutPassword : userData
    
    if (isEdit.value) {
      await userApi.update(userData.id, finalUserData)
      ElMessage.success('更新成功')
    } else {
      // 确保新用户创建时有密码
      await userApi.create(userData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadUsers()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(userForm, {
    id: '',
    name: '',
    mail: '',
    password: '',
    roleId: '',
    isSuperAdmin: false
  })
  userFormRef.value?.resetFields()
}

// 格式化日期
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.modern-users-page {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;

      .title-icon {
        color: #3b82f6;
        font-size: 32px;
      }
    }

    .page-subtitle {
      margin: 0;
      color: #64748b;
      font-size: 16px;
    }
  }

  .header-right {
    .create-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      }
    }
  }
}

.search-section {
  margin-bottom: 24px;

  .search-card {
    border-radius: 16px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    :deep(.el-card__body) {
      padding: 24px;
    }

    .search-form {
      .search-row {
        display: flex;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;

        .search-item {
          flex: 1;
          min-width: 200px;

          .search-input,
          .role-filter {
            width: 100%;

            :deep(.el-input__wrapper),
            :deep(.el-select__wrapper) {
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.2s ease;

              &:hover {
                border-color: #3b82f6;
              }

              &.is-focus {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              }
            }
          }
        }

        .search-actions {
          .reset-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 12px;
            color: #64748b;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;

            &:hover {
              color: #3b82f6;
              border-color: #3b82f6;
              background: #f8fafc;
            }
          }
        }
      }
    }
  }
}

.stats-section {
  margin-bottom: 24px;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      }

      .stat-icon {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        color: white;

        &.total {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.active {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        }

        &.admin {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        &.new {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        }
      }

      .stat-content {
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-label {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
  }
}

.list-section {
  .list-card {
    border-radius: 16px;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

    :deep(.el-card__header) {
      padding: 24px 24px 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    :deep(.el-card__body) {
      padding: 0;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-info {
        .result-count {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }
      }
    }
  }

  .user-list {
    .user-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.2s ease;

      &:hover {
        background: #f8fafc;
      }

      &:last-child {
        border-bottom: none;
      }

      .user-avatar {
        flex-shrink: 0;

        .avatar {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-weight: 600;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
      }

      .user-info {
        flex: 1;
        min-width: 0;

        .user-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .user-name {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }

          .user-badges {
            display: flex;
            gap: 8px;
          }
        }

        .user-details {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;

          .detail-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #64748b;

            .el-icon {
              color: #94a3b8;
              font-size: 16px;
            }
          }
        }
      }

      .user-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;

        .el-button {
          border-radius: 8px;
          font-weight: 500;
        }
      }
    }
  }
}

.empty-state {
  text-align: center;
  padding: 80px 24px;

  .empty-icon {
    font-size: 64px;
    color: #d1d5db;
    margin-bottom: 16px;
  }

  .empty-title {
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
  }

  .empty-description {
    color: #6b7280;
    margin: 0;
  }
}

.pagination-section {
  padding: 24px;
  border-top: 1px solid #f1f5f9;

  .pagination {
    display: flex;
    justify-content: center;

    :deep(.el-pagination) {
      .el-pager li {
        border-radius: 8px;
        margin: 0 2px;
      }

      .btn-prev,
      .btn-next {
        border-radius: 8px;
      }
    }
  }
}

.user-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
  }

  :deep(.el-dialog__header) {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #f1f5f9;
  }

  :deep(.el-dialog__body) {
    padding: 24px;
  }

  .user-form {
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }

    :deep(.el-form-item) {
      margin-bottom: 20px;

      .el-input__wrapper,
      .el-select__wrapper {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;

        &:hover {
          border-color: #3b82f6;
        }

        &.is-focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;

    .el-button {
      border-radius: 8px;
      font-weight: 500;
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .stats-section .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }

  .user-list .user-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .user-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}

@media (max-width: 768px) {
  .modern-users-page {
    padding: 16px;
  }

  .search-section .search-card .search-form .search-row {
    flex-direction: column;
    gap: 12px;

    .search-item {
      min-width: 100%;
    }
  }

  .stats-section .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style> 