<template>
  <div class="modern-permissions-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Lock /></el-icon>
          权限管理
        </h1>
        <p class="page-subtitle">管理系统权限和访问控制</p>
      </div>
      <div class="header-right">
        <PermissionCheck permission="permission.sync">
          <el-button 
            type="warning" 
            @click="syncPermissions"
            class="sync-btn"
            :loading="syncing"
          >
            <el-icon><Refresh /></el-icon>
            同步权限
          </el-button>
        </PermissionCheck>
        <PermissionCheck permission="permission.create">
          <el-button 
            type="primary" 
            @click="showCreateDialog"
            class="create-btn"
          >
            <el-icon><Plus /></el-icon>
            新增权限
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
                placeholder="搜索权限名称或代码..."
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
                v-model="groupFilter"
                placeholder="选择权限组"
                clearable
                @change="handleSearch"
                class="group-filter"
              >
                <el-option
                  v-for="group in permissionGroups"
                  :key="group.id"
                  :label="group.name"
                  :value="group.id"
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
            <el-icon><Lock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总权限数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon groups">
            <el-icon><FolderOpened /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.groups }}</div>
            <div class="stat-label">权限分组</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon assigned">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.assigned }}</div>
            <div class="stat-label">已分配权限</div>
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

    <!-- 权限列表 -->
    <div class="list-section">
      <el-card class="list-card" shadow="never">
        <template #header>
          <div class="list-header">
            <div class="header-info">
              <span class="result-count">共 {{ total }} 个权限</span>
            </div>
          </div>
        </template>

        <div v-loading="loading" class="permission-list">
          <div 
            v-for="permission in permissions" 
            :key="permission.id" 
            class="permission-item"
          >
            <div class="permission-icon">
              <div class="permission-avatar">
                <el-icon><Lock /></el-icon>
              </div>
            </div>
            
            <div class="permission-info">
              <div class="permission-header">
                <h3 class="permission-name">{{ permission.name }}</h3>
                <div class="permission-badges">
                  <el-tag type="primary" size="small">
                    {{ permission.groupName || '未分组' }}
                  </el-tag>
                  <el-tag type="info" size="small" class="code-tag">
                    {{ permission.code }}
                  </el-tag>
                </div>
              </div>
              
              <div class="permission-details">
                <div class="detail-item">
                  <el-icon><Document /></el-icon>
                  <span>{{ permission.description || '暂无描述' }}</span>
                </div>
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDate(permission.createdAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="permission-actions">
              <PermissionCheck permission="permission.update">
                <el-button type="primary" size="small" @click="editPermission(permission)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </PermissionCheck>
              <PermissionCheck permission="permission.delete">
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deletePermission(permission)"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </PermissionCheck>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && permissions.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <h3 class="empty-title">暂无权限</h3>
          <p class="empty-description">
            {{ searchText ? '没有找到匹配的权限' : '还没有创建任何权限' }}
          </p>
        </div>

        <!-- 分页 -->
        <div v-if="permissions.length > 0" class="pagination-section">
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

    <!-- 创建/编辑权限对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      width="600px"
      @close="resetForm"
      class="permission-dialog"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionRules"
        label-width="100px"
        class="permission-form"
      >
        <div class="form-row">
          <el-form-item label="权限名称" prop="name">
            <el-input v-model="permissionForm.name" placeholder="请输入权限名称" />
          </el-form-item>
          
          <el-form-item label="权限代码" prop="code">
            <el-input v-model="permissionForm.code" placeholder="请输入权限代码，如：user.create" />
          </el-form-item>
        </div>
        
        <el-form-item label="权限描述" prop="description">
          <el-input
            v-model="permissionForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限描述"
          />
        </el-form-item>
        
        <el-form-item label="权限分组">
          <el-select
            v-model="permissionForm.groupId"
            placeholder="选择权限组"
            clearable
            class="group-select"
          >
            <el-option
              v-for="group in permissionGroups"
              :key="group.id"
              :label="group.name"
              :value="group.id"
            />
          </el-select>
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

    <!-- 权限组管理对话框 -->
    <el-dialog
      v-model="groupDialogVisible"
      :title="isEditGroup ? '编辑权限组' : '新增权限组'"
      width="600px"
      @close="resetGroupForm"
      class="permission-dialog"
    >
      <el-form
        ref="groupFormRef"
        :model="groupForm"
        :rules="groupRules"
        label-width="100px"
        class="permission-form"
      >
        <div class="form-row">
          <el-form-item label="组名称" prop="name">
            <el-input v-model="groupForm.name" placeholder="请输入权限组名称" />
          </el-form-item>
          
          <el-form-item label="组代码" prop="code">
            <el-input v-model="groupForm.code" placeholder="请输入权限组代码" />
          </el-form-item>
        </div>
        
        <el-form-item label="组描述" prop="description">
          <el-input
            v-model="groupForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入权限组描述"
          />
        </el-form-item>
        
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="groupForm.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="groupDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitting" @click="submitGroupForm">
            {{ isEditGroup ? '更新' : '创建' }}
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
  Lock, 
  Plus, 
  Search, 
  Refresh, 
  FolderOpened, 
  UserFilled, 
  Clock, 
  Document, 
  Calendar, 
  Edit, 
  Delete 
} from '@element-plus/icons-vue'
import { permissionApi, permissionGroupApi } from '../lib/api'
import PermissionCheck from '../components/PermissionCheck.vue'
import type { Permission, PermissionGroup } from '../lib/api'

// 数据状态
const loading = ref(false)
const submitting = ref(false)
const syncing = ref(false)
const permissions = ref<Permission[]>([])
const permissionGroups = ref<PermissionGroup[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const groupFilter = ref('')

// 搜索防抖
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const permissionFormRef = ref<FormInstance>()

// 权限组对话框状态
const groupDialogVisible = ref(false)
const isEditGroup = ref(false)
const groupFormRef = ref<FormInstance>()

// 表单数据
const permissionForm = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  groupId: ''
})

// 权限组表单数据
const groupForm = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  sort: 0
})

// 表单验证规则
const permissionRules: FormRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' },
    { 
      pattern: /^[a-zA-Z][a-zA-Z0-9._]*$/, 
      message: '权限代码只能包含字母、数字、点和下划线，且必须以字母开头', 
      trigger: 'blur' 
    }
  ]
}

// 权限组表单验证规则
const groupRules: FormRules = {
  name: [
    { required: true, message: '请输入权限组名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限组代码', trigger: 'blur' },
    { 
      pattern: /^[a-zA-Z][a-zA-Z0-9._]*$/, 
      message: '权限组代码只能包含字母、数字、点和下划线，且必须以字母开头', 
      trigger: 'blur' 
    }
  ]
}

// 统计数据
const stats = computed(() => ({
  total: total.value,
  groups: permissionGroups.value.length,
  assigned: permissions.value.filter(p => p._count?.roles && p._count.roles > 0).length,
  newToday: permissions.value.filter(p => {
    const today = new Date().toDateString()
    return new Date(p.createdAt).toDateString() === today
  }).length
}))

// 初始化
onMounted(async () => {
  await Promise.all([
    loadPermissions(),
    loadPermissionGroups()
  ])
})

// 加载权限组列表
const loadPermissionGroups = async () => {
  try {
    const { items } = await permissionGroupApi.getList({ page: 1, pageSize: 1000 });
    permissionGroups.value = items;
  } catch (error) {
    console.error('加载权限组列表失败:', error);
    ElMessage.error('加载权限组列表失败');
  }
}

// 加载权限列表
const loadPermissions = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchText.value || undefined,
      groupId: groupFilter.value || undefined
    }
    
    const { items, total: totalCount } = await permissionApi.getList(params)
    permissions.value = items
    total.value = totalCount
  } catch (error) {
    ElMessage.error('加载权限列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 搜索处理
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadPermissions()
  }, 300)
}

// 重置搜索
const resetSearch = () => {
  searchText.value = ''
  groupFilter.value = ''
  currentPage.value = 1
  loadPermissions()
}

// 分页处理
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadPermissions()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadPermissions()
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑权限
const editPermission = (permission: Permission) => {
  isEdit.value = true;
  Object.assign(permissionForm, {
    id: permission.id,
    name: permission.name,
    code: permission.code,
    description: permission.description || '',
    groupId: permission.groupId || ''
  });
  dialogVisible.value = true;
};

// 删除权限
const deletePermission = async (permission: Permission) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限 "${permission.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await permissionApi.delete(permission.id)
    ElMessage.success('删除成功')
    loadPermissions()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 提交表单
const submitForm = async () => {
  if (!permissionFormRef.value) return;
  
  try {
    await permissionFormRef.value.validate();
    submitting.value = true;
    
    const permissionData = {
      name: permissionForm.name,
      code: permissionForm.code,
      description: permissionForm.description,
      groupId: permissionForm.groupId || undefined
    };
    
    if (isEdit.value) {
      await permissionApi.update(permissionForm.id, permissionData);
      ElMessage.success('更新成功');
    } else {
      await permissionApi.create(permissionData);
      ElMessage.success('创建成功');
    }
    
    dialogVisible.value = false;
    loadPermissions();
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败');
    console.error(error);
  } finally {
    submitting.value = false;
  }
};

// 重置表单
const resetForm = () => {
  Object.assign(permissionForm, {
    id: '',
    name: '',
    code: '',
    description: '',
    groupId: ''
  })
  permissionFormRef.value?.resetFields()
}

// 同步权限
const syncPermissions = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要同步权限吗？这将从代码中扫描并创建新的权限。',
      '同步确认',
      {
        confirmButtonText: '同步',
        cancelButtonText: '取消',
        type: 'info'
      }
    )
    
    syncing.value = true
    const result = await permissionApi.sync()
    ElMessage.success(`同步完成！新增 ${result.created} 个权限，总计 ${result.total} 个权限`)
    await Promise.all([
      loadPermissions(),
      loadPermissionGroups()
    ])
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('同步失败')
      console.error(error)
    }
  } finally {
    syncing.value = false
  }
}

// 显示创建权限组对话框
const showCreateGroupDialog = () => {
  isEditGroup.value = false
  groupDialogVisible.value = true
}

// 编辑权限组
const editGroup = (group: PermissionGroup) => {
  isEditGroup.value = true
  Object.assign(groupForm, {
    id: group.id,
    name: group.name,
    code: group.code,
    description: group.description || '',
    sort: group.sort || 0
  })
  groupDialogVisible.value = true
}

// 删除权限组
const deleteGroup = async (group: PermissionGroup) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限组 "${group.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await permissionGroupApi.delete(group.id)
    ElMessage.success('删除成功')
    await Promise.all([
      loadPermissions(),
      loadPermissionGroups()
    ])
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 提交权限组表单
const submitGroupForm = async () => {
  if (!groupFormRef.value) return
  
  try {
    await groupFormRef.value.validate()
    submitting.value = true
    
    const groupData = { ...groupForm }
    
    if (isEditGroup.value) {
      await permissionGroupApi.update(groupData.id, groupData)
      ElMessage.success('更新成功')
    } else {
      await permissionGroupApi.create(groupData)
      ElMessage.success('创建成功')
    }
    
    groupDialogVisible.value = false
    await Promise.all([
      loadPermissions(),
      loadPermissionGroups()
    ])
  } catch (error) {
    ElMessage.error(isEditGroup.value ? '更新失败' : '创建失败')
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 重置权限组表单
const resetGroupForm = () => {
  Object.assign(groupForm, {
    id: '',
    name: '',
    code: '',
    description: '',
    sort: 0
  })
  groupFormRef.value?.resetFields()
}

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return '-'
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) return '-'
  
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}
</script>

<style scoped lang="scss">
.modern-permissions-page {
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
        color: #8b5cf6;
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
    display: flex;
    gap: 12px;
    
    .sync-btn {
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

    .create-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
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
          .group-filter {
            width: 100%;

            :deep(.el-input__wrapper),
            :deep(.el-select__wrapper) {
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.2s ease;

              &:hover {
                border-color: #8b5cf6;
              }

              &.is-focus {
                border-color: #8b5cf6;
                box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
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
              color: #8b5cf6;
              border-color: #8b5cf6;
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
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        &.groups {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        }

        &.assigned {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        }

        &.new {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
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

  .permission-list {
    .permission-item {
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

      .permission-icon {
        flex-shrink: 0;

        .permission-avatar {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
        }
      }

      .permission-info {
        flex: 1;
        min-width: 0;

        .permission-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .permission-name {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }

          .permission-badges {
            display: flex;
            gap: 8px;

            .code-tag {
              font-family: 'Monaco', 'Consolas', monospace;
              font-size: 12px;
              background: #f1f5f9;
              color: #475569;
              border: 1px solid #e2e8f0;
            }
          }
        }

        .permission-details {
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

      .permission-actions {
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

.permission-dialog {
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

  .permission-form {
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
      .el-textarea__inner,
      .el-select__wrapper {
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;

        &:hover {
          border-color: #8b5cf6;
        }

        &:focus,
        &.is-focus {
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }
      }
    }

    .group-select {
      width: 100%;
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

  .permission-list .permission-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .permission-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}

@media (max-width: 768px) {
  .modern-permissions-page {
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