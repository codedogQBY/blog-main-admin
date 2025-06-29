<template>
  <div class="modern-roles-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Key /></el-icon>
          角色管理
        </h1>
        <p class="page-subtitle">管理系统角色和权限配置</p>
      </div>
      <div class="header-right">
        <PermissionCheck permission="role.create">
          <el-button 
            type="primary" 
            @click="showCreateDialog"
            class="create-btn"
          >
            <el-icon><Plus /></el-icon>
            新增角色
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
                placeholder="搜索角色名称或描述..."
                class="search-input"
                clearable
                @input="handleSearch"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
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
            <el-icon><Key /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总角色数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon active">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.withUsers }}</div>
            <div class="stat-label">已分配角色</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon permissions">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalPermissions }}</div>
            <div class="stat-label">总权限数</div>
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

    <!-- 角色列表 -->
    <div class="list-section">
      <el-card class="list-card" shadow="never">
        <template #header>
          <div class="list-header">
            <div class="header-info">
              <span class="result-count">共 {{ total }} 个角色</span>
            </div>
          </div>
        </template>

        <div v-loading="loading" class="role-list">
          <div 
            v-for="role in roles" 
            :key="role.id" 
            class="role-item"
          >
            <div class="role-icon">
              <div class="role-avatar">
                <el-icon><Key /></el-icon>
              </div>
            </div>
            
            <div class="role-info">
              <div class="role-header">
                <h3 class="role-name">{{ role.name }}</h3>
                <div class="role-badges">
                  <el-tag type="primary" size="small">
                    {{ role.permissions?.length || 0 }} 个权限
                  </el-tag>
                  <el-tag type="info" size="small">
                    {{ role.userCount ?? 0 }} 个用户
                  </el-tag>
                </div>
              </div>
              
              <div class="role-details">
                <div class="detail-item">
                  <el-icon><Document /></el-icon>
                  <span>{{ role.description || '暂无描述' }}</span>
                </div>
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDate(role.createdAt) }}</span>
                </div>
              </div>
              
              <div v-if="role.permissions?.length" class="role-permissions">
                <div class="permissions-label">权限列表：</div>
                <div class="permissions-list">
                  <el-tag 
                    v-for="permission in role.permissions.slice(0, 5)" 
                    :key="permission.id"
                    size="small"
                    class="permission-tag"
                  >
                    {{ permission.name }}
                  </el-tag>
                  <el-tag 
                    v-if="role.permissions.length > 5"
                    size="small"
                    type="info"
                    class="more-tag"
                  >
                    +{{ role.permissions.length - 5 }} 更多
                  </el-tag>
                </div>
              </div>
            </div>
            
            <div class="role-actions">
              <PermissionCheck permission="role.update">
                <el-button type="primary" size="small" @click="editRole(role)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </PermissionCheck>
              <PermissionCheck permission="role.delete">
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteRole(role)"
                  :disabled="role.userCount > 0"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </PermissionCheck>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && roles.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><Key /></el-icon>
          </div>
          <h3 class="empty-title">暂无角色</h3>
          <p class="empty-description">
            {{ searchText ? '没有找到匹配的角色' : '还没有创建任何角色' }}
          </p>
        </div>

        <!-- 分页 -->
        <div v-if="roles.length > 0" class="pagination-section">
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

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="800px"
      @close="resetForm"
      class="role-dialog"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="100px"
        class="role-form"
      >
        <div class="form-row">
          <el-form-item label="角色名称" prop="name">
            <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
          </el-form-item>
        </div>
        
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </el-form-item>
        
        <el-form-item label="权限配置">
          <div class="permissions-section">
            <div class="permissions-header">
              <el-checkbox 
                v-model="allPermissionsSelected"
                :indeterminate="isIndeterminate"
                @change="handleCheckAllChange"
              >
                全选
              </el-checkbox>
              <span class="selected-count">
                已选择 {{ selectedPermissions.length }} / {{ allPermissions.length }}
              </span>
            </div>
            
            <div class="permissions-groups">
              <div 
                v-for="group in permissionGroups" 
                :key="group.name"
                class="permission-group"
              >
                <div class="group-header">
                  <el-checkbox
                    :model-value="isGroupSelected(group)"
                    :indeterminate="isGroupIndeterminate(group)"
                    @change="(val) => handleGroupChange(group, val)"
                  >
                    {{ group.name }}
                  </el-checkbox>
                </div>
                <div class="group-permissions">
                  <el-checkbox
                    v-for="permission in group.permissions"
                    :key="permission.id"
                    v-model="selectedPermissions"
                    :label="permission.id"
                    class="permission-checkbox"
                  >
                    {{ permission.name }}
                  </el-checkbox>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
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
  Key, 
  Plus, 
  Search, 
  Refresh, 
  Check, 
  Lock, 
  Clock, 
  Document, 
  Calendar, 
  Edit, 
  Delete 
} from '@element-plus/icons-vue'
import { roleApi, permissionApi } from '../lib/api'
import PermissionCheck from '../components/PermissionCheck.vue'
import type { Role, Permission } from '../lib/api'

// 数据状态
const loading = ref(false)
const submitting = ref(false)
const roles = ref<Role[]>([])
const allPermissions = ref<Permission[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchText = ref('')

// 搜索防抖
let searchTimeout: number | null = null

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const roleFormRef = ref<FormInstance>()

// 表单数据
const roleForm = reactive({
  id: '',
  name: '',
  description: ''
})

// 权限选择
const selectedPermissions = ref<string[]>([])

// 统计数据
const stats = computed(() => ({
  total: roles.value.length,
  withUsers: roles.value.filter(r => r.userCount && r.userCount > 0).length,
  totalPermissions: allPermissions.value.length,
  newToday: roles.value.filter(r => {
    const today = new Date().toDateString()
    return new Date(r.createdAt).toDateString() === today
  }).length
}))

// 权限分组
const permissionGroups = computed(() => {
  const groups: { [key: string]: Permission[] } = {}
  allPermissions.value.forEach(permission => {
    const groupName = permission.group || '其他'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(permission)
  })
  
  return Object.entries(groups).map(([name, permissions]) => ({
    name,
    permissions
  }))
})

// 全选状态
const allPermissionsSelected = computed({
  get: () => selectedPermissions.value.length === allPermissions.value.length,
  set: (val) => {
    if (val) {
      selectedPermissions.value = allPermissions.value.map(p => p.id)
    } else {
      selectedPermissions.value = []
    }
  }
})

// 半选状态
const isIndeterminate = computed(() => {
  const selected = selectedPermissions.value.length
  return selected > 0 && selected < allPermissions.value.length
})

// 表单验证规则
const roleRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

// 初始化
onMounted(async () => {
  await loadPermissions()
  await loadRoles()
})

// 加载角色列表
const loadRoles = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchText.value || undefined
    }
    
    const data = await roleApi.getList(params)
    const rawRoles = Array.isArray(data) ? data : (data as any)?.data || []
    
    // 处理数据结构，将后端的 perms 和 users 转换为前端期望的格式
    roles.value = rawRoles.map((role: any) => ({
      ...role,
      permissions: role.perms?.map((rp: any) => rp.permission) || [],
      userCount: role.users?.length || 0
    }))
    
    total.value = Array.isArray(data) ? roles.value.length : (data as any)?.total || 0
  } catch (error) {
    ElMessage.error('加载角色列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 加载权限列表
const loadPermissions = async () => {
  try {
    // 加载所有权限，不使用分页限制
    const data = await permissionApi.getList({ pageSize: 1000 })
    allPermissions.value = Array.isArray(data) ? data : (data as any)?.data || []
  } catch (error) {
    console.error('加载权限列表失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadRoles()
  }, 300)
}

// 重置搜索
const resetSearch = () => {
  searchText.value = ''
  currentPage.value = 1
  loadRoles()
}

// 分页处理
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadRoles()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadRoles()
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  selectedPermissions.value = []
  dialogVisible.value = true
}

// 编辑角色
const editRole = (role: Role) => {
  isEdit.value = true
  Object.assign(roleForm, {
    id: role.id,
    name: role.name,
    description: role.description || ''
  })
  selectedPermissions.value = role.permissions?.map((p: any) => p.id) || []
  dialogVisible.value = true
}

// 删除角色
const deleteRole = async (role: Role) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await roleApi.delete(role.id)
    ElMessage.success('删除成功')
    loadRoles()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 权限组选择处理
const isGroupSelected = (group: { permissions: Permission[] }) => {
  return group.permissions.every(p => selectedPermissions.value.includes(p.id))
}

const isGroupIndeterminate = (group: { permissions: Permission[] }) => {
  const selectedInGroup = group.permissions.filter(p => selectedPermissions.value.includes(p.id))
  return selectedInGroup.length > 0 && selectedInGroup.length < group.permissions.length
}

const handleGroupChange = (group: { permissions: Permission[] }, checked: boolean) => {
  if (checked) {
    group.permissions.forEach(p => {
      if (!selectedPermissions.value.includes(p.id)) {
        selectedPermissions.value.push(p.id)
      }
    })
  } else {
    selectedPermissions.value = selectedPermissions.value.filter(id => 
      !group.permissions.some(p => p.id === id)
    )
  }
}

// 全选处理
const handleCheckAllChange = (checked: boolean) => {
  allPermissionsSelected.value = checked
}

// 提交表单
const submitForm = async () => {
  if (!roleFormRef.value) return
  
  try {
    await roleFormRef.value.validate()
    submitting.value = true
    
    const roleData = {
      ...roleForm,
      permissionIds: selectedPermissions.value
    }
    
    if (isEdit.value) {
      await roleApi.update(roleData.id, roleData)
      ElMessage.success('更新成功')
    } else {
      await roleApi.create(roleData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadRoles()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(roleForm, {
    id: '',
    name: '',
    description: ''
  })
  selectedPermissions.value = []
  roleFormRef.value?.resetFields()
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
.modern-roles-page {
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
        color: #f59e0b;
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
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
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
          min-width: 300px;

          .search-input {
            width: 100%;

            :deep(.el-input__wrapper) {
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.2s ease;

              &:hover {
                border-color: #f59e0b;
              }

              &.is-focus {
                border-color: #f59e0b;
                box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
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
              color: #f59e0b;
              border-color: #f59e0b;
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
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        &.active {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        }

        &.permissions {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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

  .role-list {
    .role-item {
      display: flex;
      align-items: flex-start;
      gap: 20px;
      padding: 24px;
      border-bottom: 1px solid #f1f5f9;
      transition: all 0.2s ease;

      &:hover {
        background: #f8fafc;
      }

      &:last-child {
        border-bottom: none;
      }

      .role-icon {
        flex-shrink: 0;

        .role-avatar {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
      }

      .role-info {
        flex: 1;
        min-width: 0;

        .role-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .role-name {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }

          .role-badges {
            display: flex;
            gap: 8px;
          }
        }

        .role-details {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-bottom: 12px;

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

        .role-permissions {
          .permissions-label {
            font-size: 13px;
            color: #64748b;
            margin-bottom: 8px;
          }

          .permissions-list {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;

            .permission-tag {
              background: #f1f5f9;
              color: #475569;
              border: 1px solid #e2e8f0;
            }

            .more-tag {
              background: #f8fafc;
              color: #64748b;
              border: 1px solid #e2e8f0;
            }
          }
        }
      }

      .role-actions {
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

.role-dialog {
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

  .role-form {
    .form-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    :deep(.el-form-item) {
      margin-bottom: 20px;

      .el-input__wrapper,
      .el-textarea__inner {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;

        &:hover {
          border-color: #f59e0b;
        }

        &:focus,
        &.is-focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
      }
    }

    .permissions-section {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      background: #f8fafc;

      .permissions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e2e8f0;

        .selected-count {
          font-size: 14px;
          color: #64748b;
        }
      }

      .permissions-groups {
        .permission-group {
          margin-bottom: 20px;

          &:last-child {
            margin-bottom: 0;
          }

          .group-header {
            margin-bottom: 12px;

            :deep(.el-checkbox__label) {
              font-weight: 600;
              color: #374151;
            }
          }

          .group-permissions {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 8px;
            margin-left: 24px;

            .permission-checkbox {
              :deep(.el-checkbox__label) {
                font-size: 14px;
                color: #64748b;
              }
            }
          }
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

  .role-list .role-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .role-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}

@media (max-width: 768px) {
  .modern-roles-page {
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

  .role-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 0 auto;
    }

    .permissions-section .permissions-groups .permission-group .group-permissions {
      grid-template-columns: 1fr;
    }
  }
}
</style> 