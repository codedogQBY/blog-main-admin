<template>
  <div class="permission-groups-page">
    <div class="page-header">
      <h1>权限组管理</h1>
      <PermissionCheck permission="permission.group.create">
        <el-button type="primary" @click="showCreateDialog">
          <el-icon><Plus /></el-icon>
          新增权限组
        </el-button>
      </PermissionCheck>
    </div>

    <el-card class="search-card">
      <div class="search-form">
        <el-input
          v-model="searchText"
          placeholder="搜索权限组名称或代码..."
          @input="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="resetSearch">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
      </div>
    </el-card>

    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>共 {{ total }} 个权限组</span>
        </div>
      </template>

      <div class="group-list">
        <div v-for="group in groups" :key="group.id" class="group-item">
          <div class="group-info">
            <h3>{{ group.name }}</h3>
            <div class="group-meta">
              <el-tag size="small">{{ group.code }}</el-tag>
              <span class="permission-count">{{ group._count?.permissions ?? 0 }} 个权限</span>
            </div>
            <p class="description">{{ group.description || '暂无描述' }}</p>
          </div>
          
          <div class="group-actions">
            <PermissionCheck permission="permission.group.update">
              <el-button type="primary" size="small" @click="editGroup(group)">
                编辑
              </el-button>
            </PermissionCheck>
            <PermissionCheck permission="permission.group.delete">
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteGroup(group)"
                :disabled="(group._count?.permissions ?? 0) > 0"
              >
                删除
              </el-button>
            </PermissionCheck>
          </div>
        </div>

        <div v-if="!loading && groups.length === 0" class="empty-state">
          <el-empty :description="searchText ? '没有找到匹配的权限组' : '暂无权限组'" />
        </div>
      </div>

      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑权限组' : '新增权限组'"
      width="500px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="代码" prop="code">
          <el-input v-model="form.code" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" rows="3" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ isEdit ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { permissionGroupApi, type PermissionGroup } from '../lib/api'
import PermissionCheck from '../components/PermissionCheck.vue'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const searchText = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const groups = ref<PermissionGroup[]>([])

const form = reactive({
  id: '',
  name: '',
  code: '',
  description: '',
  sort: 0
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [
    { required: true, message: '请输入代码', trigger: 'blur' },
    { pattern: /^[a-z][a-z0-9._]*$/, message: '代码必须以小写字母开头，只能包含小写字母、数字、点和下划线', trigger: 'blur' }
  ]
}

const formRef = ref()

const loadGroups = async () => {
  loading.value = true
  try {
    const res = await permissionGroupApi.getList({
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchText.value
    })
    groups.value = res.items
    total.value = res.total
  } catch (error) {
    console.error(error)
    ElMessage.error('加载权限组失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadGroups()
}

const resetSearch = () => {
  searchText.value = ''
  currentPage.value = 1
  loadGroups()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadGroups()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadGroups()
}

const resetForm = () => {
  form.id = ''
  form.name = ''
  form.code = ''
  form.description = ''
  form.sort = 0
  formRef.value?.resetFields()
}

const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const editGroup = (group: any) => {
  isEdit.value = true
  Object.assign(form, group)
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    if (isEdit.value) {
      await permissionGroupApi.update(form.id, {
        name: form.name,
        code: form.code,
        description: form.description,
        sort: form.sort
      })
      ElMessage.success('更新成功')
    } else {
      await permissionGroupApi.create({
        name: form.name,
        code: form.code,
        description: form.description,
        sort: form.sort
      })
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadGroups()
  } catch (error) {
    console.error(error)
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
  } finally {
    submitting.value = false
  }
}

const deleteGroup = async (group: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限组"${group.name}"吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await permissionGroupApi.delete(group.id)
    ElMessage.success('删除成功')
    loadGroups()
  } catch (error) {
    if (error !== 'cancel') {
      console.error(error)
      ElMessage.error('删除失败')
    }
  }
}

loadGroups()
</script>

<style scoped lang="scss">
.permission-groups-page {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  .search-card {
    margin-bottom: 20px;

    .search-form {
      display: flex;
      gap: 16px;
      align-items: center;

      .el-input {
        max-width: 300px;
      }
    }
  }

  .group-list {
    .group-item {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .group-info {
        flex: 1;

        h3 {
          margin: 0 0 8px;
          font-size: 16px;
          font-weight: 600;
        }

        .group-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .permission-count {
            color: var(--el-text-color-secondary);
            font-size: 14px;
          }
        }

        .description {
          margin: 0;
          color: var(--el-text-color-secondary);
          font-size: 14px;
        }
      }

      .group-actions {
        display: flex;
        gap: 8px;
      }
    }
  }

  .empty-state {
    padding: 40px 0;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style> 