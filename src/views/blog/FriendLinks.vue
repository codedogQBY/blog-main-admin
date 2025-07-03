<template>
  <div class="friend-links-page">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="never">
      <div class="search-form">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="全部" clearable>
              <el-option label="正常" :value="1" />
              <el-option label="禁用" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索">
            <el-input
              v-model="searchForm.search"
              placeholder="搜索名称或描述"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 操作栏 -->
    <div class="toolbar">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        添加友链
      </el-button>
    </div>

    <!-- 列表 -->
    <el-card shadow="never">
      <el-table
        v-loading="loading"
        :data="friendLinks"
        style="width: 100%"
        row-key="id"
      >
        <el-table-column prop="name" label="名称" min-width="120">
          <template #default="{ row }">
            <div class="link-info">
              <el-avatar
                v-if="row.logo"
                :size="32"
                :src="row.logo"
                class="link-logo"
              />
              <span class="link-name">{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="链接" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <el-link :href="row.url" target="_blank" type="primary">{{ row.url }}</el-link>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="order" label="排序" width="150">
          <template #default="{ row }">
            <el-input-number
              v-model="row.order"
              :min="0"
              :max="999"
              size="small"
              @change="(value: number) => handleOrderChange(row.id, value)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              :active-value="1"
              :inactive-value="0"
              @change="(value: number) => handleStatusChange(row.id, value)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '添加友链' : '编辑友链'"
      width="600px"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入友链名称" />
        </el-form-item>
        <el-form-item label="链接" prop="url">
          <el-input v-model="form.url" placeholder="请输入友链地址" />
        </el-form-item>
        <el-form-item label="Logo" prop="logo">
          <div class="logo-input">
            <el-input v-model="form.logo" style="width: 300px;" placeholder="请输入Logo地址" />
            <el-button @click="handleSelectFile">选择文件</el-button>
            <el-image
              v-if="form.logo"
              :src="form.logo || ''"
              class="logo-preview"
              :preview-src-list="form.logo ? [form.logo] : []"
            />
          </div>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入友链描述"
          />
        </el-form-item>
        <el-form-item label="排序" prop="order">
          <el-input-number
            v-model="form.order"
            :min="0"
            :max="999"
            placeholder="请输入排序值"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :value="1">正常</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 文件选择器 -->
    <FileSelector
      v-model:visible="fileSelectorVisible"
      :model-value="form.logo"
      title="选择图片"
      file-type="image"
      :multiple="false"
      :max-files="1"
      @select="handleFileSelected"
      @update:model-value="(val) => form.logo = val"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { FormInstance } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getFriendLinks,
  createFriendLink,
  updateFriendLink,
  deleteFriendLink,
  updateFriendLinkOrder,
  updateFriendLinkStatus,
  type FriendLink
} from '@/api/friend-links'
import FileSelector, {type FileType } from '@/components/FileSelector.vue'
import { formatDate } from '@/lib/utils'

// 搜索表单
const searchForm = ref({
  status: undefined as number | undefined,
  search: ''
})

// 列表数据
const loading = ref(false)
const friendLinks = ref<FriendLink[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 加载列表数据
const loadData = async () => {
  loading.value = true
  try {
    const res = await getFriendLinks({
      page: page.value,
      pageSize: pageSize.value,
      status: searchForm.value.status,
      search: searchForm.value.search
    })
    friendLinks.value = res.data.items
    total.value = res.data.total
  } catch (error) {
    console.error('获取友链列表失败:', error)
    ElMessage.error('获取友链列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索和重置
const handleSearch = () => {
  page.value = 1
  loadData()
}

const resetSearch = () => {
  searchForm.value.status = undefined
  searchForm.value.search = ''
  handleSearch()
}

// 分页
const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadData()
}

const handlePageChange = (val: number) => {
  page.value = val
  loadData()
}

// 表单相关
const dialogVisible = ref(false)
const dialogType = ref<'add' | 'edit'>('add')
const submitting = ref(false)
const formRef = ref<FormInstance>()
const form = ref({
  name: '',
  url: '',
  logo: '',
  description: '',
  order: 0,
  status: 1
})

const rules = {
  name: [
    { required: true, message: '请输入友链名称', trigger: 'blur' },
    { max: 50, message: '长度不能超过50个字符', trigger: 'blur' }
  ],
  url: [
    { required: true, message: '请输入友链地址', trigger: 'blur' },
    { type: 'url', message: '请输入正确的URL地址', trigger: 'blur' }
  ],
  logo: [
    { type: 'url', message: '请输入正确的URL地址', trigger: 'blur' }
  ],
  description: [
    { max: 255, message: '长度不能超过255个字符', trigger: 'blur' }
  ]
}

// 添加友链
const handleAdd = () => {
  dialogType.value = 'add'
  form.value = {
    name: '',
    url: '',
    logo: '',
    description: '',
    order: 0,
    status: 1
  }
  dialogVisible.value = true
}

// 编辑友链
const handleEdit = (row: FriendLink) => {
  dialogType.value = 'edit'
  form.value = {
    name: row.name,
    url: row.url,
    logo: row.logo || '',
    description: row.description || '',
    order: row.order,
    status: row.status
  }
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate()
  
  submitting.value = true
  try {
    if (dialogType.value === 'add') {
      await createFriendLink(form.value)
      ElMessage.success('添加成功')
    } else {
      const currentLink = friendLinks.value.find(item => 
        item.name === form.value.name && 
        item.url === form.value.url
      )
      if (!currentLink) {
        ElMessage.error('未找到要编辑的友链')
        return
      }
      await updateFriendLink(currentLink.id, form.value)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('保存友链失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

// 删除友链
const handleDelete = async (row: FriendLink) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该友链吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteFriendLink(row.id)
    ElMessage.success('删除成功')
    if (friendLinks.value.length === 1 && page.value > 1) {
      page.value--
    }
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除友链失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 更新排序
const handleOrderChange = async (id: string, order: number) => {
  try {
    await updateFriendLinkOrder(id, order)
    ElMessage.success('更新排序成功')
  } catch (error) {
    console.error('更新排序失败:', error)
    ElMessage.error('更新排序失败')
    loadData() // 重新加载数据，恢复原值
  }
}

// 更新状态
const handleStatusChange = async (id: string, status: number) => {
  try {
    await updateFriendLinkStatus(id, status)
    ElMessage.success('更新状态成功')
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    loadData() // 重新加载数据，恢复原值
  }
}

// 文件选择器
const fileSelectorVisible = ref(false)

const handleSelectFile = () => {
  fileSelectorVisible.value = true
}

const handleFileSelected = (file: FileType) => {
  form.value.logo = file.url
  fileSelectorVisible.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.friend-links-page {
  .search-card {
    margin-bottom: 16px;
    
    :deep(.el-card__body) {
      padding: 16px;
    }
  }
  
  .toolbar {
    margin-bottom: 16px;
    display: flex;
    justify-content: flex-start;
  }
  
  .link-info {
    display: flex;
    align-items: center;
    gap: 8px;
    
    .link-logo {
      flex-shrink: 0;
    }
    
    .link-name {
      flex: 1;
      min-width: 0;
    }
  }
  
  .pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .logo-input {
    display: flex;
    align-items: flex-start;
    gap: 8px;

    .el-input {
      flex: 1;
    }

    .logo-preview {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
    }
  }
}
</style> 