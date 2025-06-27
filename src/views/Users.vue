<template>
  <div class="users-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <PermissionCheck permission="user.create">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增用户
        </el-button>
      </PermissionCheck>
    </div>

    <!-- 搜索区域 -->
    <div class="search-section">
      <el-input
        v-model="searchText"
        placeholder="搜索用户名或邮箱"
        style="width: 300px"
        clearable
        @change="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
    </div>

    <!-- 用户列表 -->
    <el-card class="table-card">
      <el-table
        :data="users"
        v-loading="loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="用户名" width="150" />
        <el-table-column prop="mail" label="邮箱" width="250" />
        <el-table-column label="角色" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.role" type="info">{{ row.role.name }}</el-tag>
            <span v-else class="text-gray">无角色</span>
          </template>
        </el-table-column>
        <PermissionCheck permission="user.view.sensitive">
          <el-table-column label="超级管理员" width="120">
            <template #default="{ row }">
              <el-tag v-if="row.isSuperAdmin" type="danger">是</el-tag>
              <span v-else>否</span>
            </template>
          </el-table-column>
        </PermissionCheck>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="200">
          <template #default="{ row }">
            <PermissionCheck :permissions="['user.update', 'user.update.basic']">
              <el-button type="primary" size="small" @click="editUser(row)">
                编辑
              </el-button>
            </PermissionCheck>
            <PermissionCheck permission="user.delete">
              <el-button type="danger" size="small" @click="deleteUser(row)" :disabled="row.isSuperAdmin && !authStore.user?.isSuperAdmin">
                删除
              </el-button>
            </PermissionCheck>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入用户名" />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="mail">
          <el-input v-model="userForm.mail" placeholder="请输入邮箱" />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            :placeholder="isEdit ? '留空则不修改密码' : '请输入密码'"
            show-password
          />
        </el-form-item>
        
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
import { Plus, Search } from '@element-plus/icons-vue'
import { api } from '../lib/api'
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

// 方法
const fetchUsers = async () => {
  loading.value = true
  try {
    const result = await api.getUsers(currentPage.value, pageSize.value, searchText.value)
    users.value = result.data
    total.value = result.pagination.total
  } catch (error) {
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    roles.value = await api.getRoles()
  } catch (error) {
    ElMessage.error('获取角色列表失败')
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchUsers()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchUsers()
}

const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

const editUser = (user: User) => {
  isEdit.value = true
  userForm.id = user.id
  userForm.name = user.name
  userForm.mail = user.mail
  userForm.password = ''
  userForm.roleId = user.role?.id || ''
  userForm.isSuperAdmin = user.isSuperAdmin
  dialogVisible.value = true
}

const resetForm = () => {
  userFormRef.value?.resetFields()
  Object.assign(userForm, {
    id: '',
    name: '',
    mail: '',
    password: '',
    roleId: '',
    isSuperAdmin: false
  })
}

const submitForm = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const data = {
          name: userForm.name,
          mail: userForm.mail,
          password: userForm.password || undefined,
          roleId: userForm.roleId || undefined,
          isSuperAdmin: userForm.isSuperAdmin
        }
        
        if (isEdit.value) {
          await api.updateUser(userForm.id, data)
          ElMessage.success('用户更新成功')
        } else {
          await api.createUser({ ...data, password: userForm.password })
          ElMessage.success('用户创建成功')
        }
        
        dialogVisible.value = false
        fetchUsers()
      } catch (error) {
        ElMessage.error(isEdit.value ? '用户更新失败' : '用户创建失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

const deleteUser = (user: User) => {
  ElMessageBox.confirm(
    `确定要删除用户 "${user.name}" 吗？此操作不可恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(async () => {
    try {
      await api.deleteUser(user.id)
      ElMessage.success('用户删除成功')
      fetchUsers()
    } catch (error) {
      ElMessage.error('用户删除失败')
    }
  })
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<style scoped>
.users-container {
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

.search-section {
  margin-bottom: 16px;
}

.table-card {
  .el-card__body {
    padding: 0;
  }
}

.pagination-container {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

.text-gray {
  color: #999;
}
</style> 