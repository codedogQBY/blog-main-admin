<template>
  <div class="permissions-container">
    <div class="page-header">
      <h2>权限管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="syncPermissions">
          <el-icon><Refresh /></el-icon>
          同步权限
        </el-button>
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增权限
        </el-button>
      </div>
    </div>

    <!-- 权限列表 -->
    <el-card class="table-card">
      <el-table
        :data="permissions"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="权限名称" min-width="200" />
        <el-table-column prop="code" label="权限代码" min-width="200">
          <template #default="{ row }">
            <el-tag type="info">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editPermission(row)">
              编辑
            </el-button>
            <el-button type="danger" size="small" @click="deletePermission(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑权限对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="permissionFormRef"
        :model="permissionForm"
        :rules="permissionRules"
        label-width="100px"
      >
        <el-form-item label="权限名称" prop="name">
          <el-input v-model="permissionForm.name" placeholder="请输入权限名称" />
        </el-form-item>
        
        <el-form-item label="权限代码" prop="code">
          <el-input 
            v-model="permissionForm.code" 
            placeholder="请输入权限代码，如: user.read" 
            :disabled="isEdit"
          />
          <div class="form-tip">
            权限代码格式建议：模块.操作，如 user.read、role.create 等
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitForm">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { api } from '../lib/api'
import type { Permission } from '../lib/api'

// 数据状态
const loading = ref(false)
const submitting = ref(false)
const permissions = ref<Permission[]>([])

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const permissionFormRef = ref<FormInstance>()

// 表单数据
const permissionForm = reactive({
  id: '',
  name: '',
  code: ''
})

// 表单验证规则
const permissionRules: FormRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入权限代码', trigger: 'blur' },
    { 
      pattern: /^[a-zA-Z][a-zA-Z0-9]*(\.[a-zA-Z][a-zA-Z0-9]*)*$/,
      message: '权限代码格式不正确，应为模块.操作的形式',
      trigger: 'blur'
    }
  ]
}

// 方法
const fetchPermissions = async () => {
  loading.value = true
  try {
    permissions.value = await api.getPermissions()
  } catch (error) {
    ElMessage.error('获取权限列表失败')
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const editPermission = (permission: Permission) => {
  isEdit.value = true
  permissionForm.id = permission.id
  permissionForm.name = permission.name
  permissionForm.code = permission.code
  dialogVisible.value = true
}

const resetForm = () => {
  permissionFormRef.value?.resetFields()
  Object.assign(permissionForm, {
    id: '',
    name: '',
    code: ''
  })
}

const submitForm = async () => {
  if (!permissionFormRef.value) return
  
  await permissionFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        if (isEdit.value) {
          await api.updatePermission(permissionForm.id, {
            name: permissionForm.name,
            code: permissionForm.code
          })
          ElMessage.success('权限更新成功')
        } else {
          await api.createPermission(permissionForm.code, permissionForm.name)
          ElMessage.success('权限创建成功')
        }
        
        dialogVisible.value = false
        fetchPermissions()
      } catch (error: any) {
        const message = error.response?.data?.message || (isEdit.value ? '权限更新失败' : '权限创建失败')
        ElMessage.error(message)
      } finally {
        submitting.value = false
      }
    }
  })
}

const deletePermission = (permission: Permission) => {
  ElMessageBox.confirm(
    `确定要删除权限 "${permission.name}" (${permission.code}) 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await api.deletePermission(permission.id)
      ElMessage.success('权限删除成功')
      fetchPermissions()
    } catch (error) {
      ElMessage.error('权限删除失败')
    }
  })
}

const syncPermissions = async () => {
  ElMessageBox.confirm(
    '同步权限将会自动扫描代码中的权限注解并创建相应的权限记录，确定要执行吗？',
    '确认同步权限',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(async () => {
    const loadingInstance = ElMessage({
      message: '正在同步权限...',
      type: 'info',
      duration: 0
    })
    
    try {
      const result = await api.syncPermissions()
      loadingInstance.close()
      ElMessage.success(`权限同步成功！新增 ${result.created} 个权限，总计 ${result.total} 个权限`)
      fetchPermissions()
    } catch (error) {
      loadingInstance.close()
      ElMessage.error('权限同步失败')
    }
  })
}

// 生命周期
onMounted(() => {
  fetchPermissions()
})
</script>

<style scoped>
.permissions-container {
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

.header-actions {
  display: flex;
  gap: 12px;
}

.table-card {
  .el-card__body {
    padding: 0;
  }
}

.form-tip {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style> 