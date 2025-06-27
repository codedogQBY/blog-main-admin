<template>
  <div class="roles-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        新增角色
      </el-button>
    </div>

    <!-- 角色列表 -->
    <el-card class="table-card">
      <el-table
        :data="roles"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="角色名称" width="200" />
        <el-table-column label="权限数量" width="120">
          <template #default="{ row }">
            {{ row.perms?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="权限列表" min-width="300">
          <template #default="{ row }">
            <div v-if="row.perms?.length" class="permissions-tags">
              <el-tag
                v-for="perm in row.perms.slice(0, 5)"
                :key="perm.permission.id"
                size="small"
                style="margin-right: 8px; margin-bottom: 4px;"
              >
                {{ perm.permission.name }}
              </el-tag>
              <el-tag v-if="row.perms.length > 5" size="small" type="info">
                +{{ row.perms.length - 5 }}个
              </el-tag>
            </div>
            <span v-else class="text-gray">无权限</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="300">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editRole(row)">
              编辑
            </el-button>
            <el-button type="warning" size="small" @click="managePermissions(row)">
              权限管理
            </el-button>
            <el-button type="danger" size="small" @click="deleteRole(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑角色对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
      width="400px"
      @close="resetForm"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="80px"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="请输入角色名称" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 权限管理对话框 -->
    <el-dialog
      v-model="permissionDialogVisible"
      title="权限管理"
      width="600px"
      @close="resetPermissionForm"
    >
      <div class="permission-section">
        <h4>为角色 "{{ currentRole?.name }}" 分配权限</h4>
        <el-divider />
        
        <div class="permission-list">
          <el-checkbox-group v-model="selectedPermissions">
            <div
              v-for="permission in permissions"
              :key="permission.id"
              class="permission-item"
            >
              <el-checkbox :label="permission.id">
                <div class="permission-info">
                  <span class="permission-name">{{ permission.name }}</span>
                  <el-tag size="small" type="info">{{ permission.code }}</el-tag>
                </div>
              </el-checkbox>
            </div>
          </el-checkbox-group>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="permissionSubmitting" @click="submitPermissions">
          保存权限
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { api } from '../lib/api'
import type { Role, Permission } from '../lib/api'

// 数据状态
const loading = ref(false)
const submitting = ref(false)
const permissionSubmitting = ref(false)
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])

// 对话框状态
const dialogVisible = ref(false)
const permissionDialogVisible = ref(false)
const isEdit = ref(false)
const roleFormRef = ref<FormInstance>()
const currentRole = ref<Role | null>(null)
const selectedPermissions = ref<string[]>([])

// 表单数据
const roleForm = reactive({
  id: '',
  name: ''
})

// 表单验证规则
const roleRules: FormRules = {
  name: [
    { required: true, message: '请输入角色名称', trigger: 'blur' }
  ]
}

// 方法
const fetchRoles = async () => {
  loading.value = true
  try {
    roles.value = await api.getRoles()
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  } finally {
    loading.value = false
  }
}

const fetchPermissions = async () => {
  try {
    permissions.value = await api.getPermissions()
  } catch (error) {
    ElMessage.error('获取权限列表失败')
  }
}

const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const editRole = (role: Role) => {
  isEdit.value = true
  roleForm.id = role.id
  roleForm.name = role.name
  dialogVisible.value = true
}

const resetForm = () => {
  roleFormRef.value?.resetFields()
  Object.assign(roleForm, {
    id: '',
    name: ''
  })
}

const submitForm = async () => {
  if (!roleFormRef.value) return
  
  await roleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          await api.updateRole(roleForm.id, roleForm.name)
          ElMessage.success('角色更新成功')
        } else {
          await api.createRole(roleForm.name)
          ElMessage.success('角色创建成功')
        }
        
        dialogVisible.value = false
        fetchRoles()
      } catch (error) {
        ElMessage.error(isEdit.value ? '角色更新失败' : '角色创建失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const deleteRole = (role: Role) => {
  ElMessageBox.confirm(
    `确定要删除角色 "${role.name}" 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await api.deleteRole(role.id)
      ElMessage.success('角色删除成功')
      fetchRoles()
    } catch (error) {
      ElMessage.error('角色删除失败')
    }
  })
}

const managePermissions = async (role: Role) => {
  currentRole.value = role
  selectedPermissions.value = role.perms?.map(p => p.permission.id) || []
  permissionDialogVisible.value = true
}

const resetPermissionForm = () => {
  currentRole.value = null
  selectedPermissions.value = []
}

const submitPermissions = async () => {
  if (!currentRole.value) return
  
  permissionSubmitting.value = true
  try {
    await api.setRolePermissions(currentRole.value.id, selectedPermissions.value)
    ElMessage.success('权限设置成功')
    permissionDialogVisible.value = false
    fetchRoles()
  } catch (error) {
    ElMessage.error('权限设置失败')
  } finally {
    permissionSubmitting.value = false
  }
}

// 生命周期
onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>

<style scoped>
.roles-container {
  background: white;
  padding: 24px;
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  color: #333;
}

.table-card {
  .el-card__body {
    padding: 0;
  }
}

.permissions-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.text-gray {
  color: #999;
}

.permission-section h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.permission-list {
  max-height: 400px;
  overflow-y: auto;
}

.permission-item {
  display: block;
  margin-bottom: 12px;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #f0f0f0;
}

.permission-item:hover {
  background-color: #f9f9f9;
}

.permission-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.permission-name {
  font-weight: 500;
  color: #333;
}
</style> 