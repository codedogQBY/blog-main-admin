<template>
  <div class="gallery-category-list">
    <div class="header-actions">
      <div class="title-section">
        <h2>图库分类管理</h2>
        <p class="subtitle">管理图库分类配置</p>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="showCreateDialog = true">
          <el-icon><Plus /></el-icon>
          新增分类
        </el-button>
      </div>
    </div>

    <!-- 搜索过滤 -->
    <div class="filters">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.name"
            placeholder="搜索分类名称"
            clearable
            @clear="handleSearch"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.enabled"
            placeholder="状态"
            clearable
            @change="handleSearch"
          >
            <el-option label="启用" :value="true" />
            <el-option label="禁用" :value="false" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 分类列表 -->
    <el-table
      v-loading="loading"
      :data="categories"
      style="width: 100%"
      row-key="name"
    >
      <el-table-column prop="name" label="分类名称" min-width="200">
        <template #default="scope">
          <div class="category-name">
            <el-icon v-if="!scope.row.enabled" class="disabled-icon"><Warning /></el-icon>
            <span>{{ scope.row.name }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="description" label="描述" min-width="300">
        <template #default="scope">
          <span class="description-text">
            {{ scope.row.description || '暂无描述' }}
          </span>
        </template>
      </el-table-column>

      <el-table-column prop="imageCount" label="图片数量" width="120" align="center">
        <template #default="scope">
          <el-tag type="info">{{ scope.row.imageCount || 0 }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="enabled" label="状态" width="100" align="center">
        <template #default="scope">
          <el-switch
            v-model="scope.row.enabled"
            @change="toggleCategoryStatus(scope.row)"
          />
        </template>
      </el-table-column>

      <el-table-column prop="sort" label="排序" width="100" align="center">
        <template #default="scope">
          <span>{{ scope.row.sort || 0 }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="scope">
          {{ formatDate(scope.row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="150" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="editCategory(scope.row)">
            编辑
          </el-button>
          <el-button 
            link 
            type="danger" 
            @click="deleteCategory(scope.row)"
            :disabled="scope.row.imageCount > 0"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingCategory ? '编辑分类' : '新增分类'"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="name">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入分类名称"
            :disabled="!!editingCategory"
          />
          <div class="form-tips" v-if="editingCategory">
            注意：分类名称创建后不能修改
          </div>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>

        <el-form-item label="排序" prop="sort">
          <el-input-number
            v-model="formData.sort"
            :min="0"
            :max="999"
            placeholder="数字越小排序越靠前"
          />
        </el-form-item>

        <el-form-item label="状态" prop="enabled">
          <el-radio-group v-model="formData.enabled">
            <el-radio :value="true">启用</el-radio>
            <el-radio :value="false">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitting">
          {{ editingCategory ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Warning } from '@element-plus/icons-vue'
import { api } from '../../lib/api'

// 响应式数据
const loading = ref(false)
const submitting = ref(false)
const categories = ref([])
const showCreateDialog = ref(false)
const editingCategory = ref(null)
const formRef = ref()

// 搜索表单
const searchForm = reactive({
  name: '',
  enabled: null
})

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  sort: 0,
  enabled: true
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分类名称长度在 1 到 50 个字符', trigger: 'blur' }
  ]
}

// 方法
const loadCategories = async () => {
  try {
    loading.value = true
    const params = {
      name: searchForm.name || undefined,
      enabled: searchForm.enabled
    }
    
    const response = await api.getGalleryCategories(params)
    // 字段名映射：将后端的 isEnabled 映射为前端的 enabled
    categories.value = response.map(category => {
      const backendData = category as any
      return {
        ...category,
        enabled: backendData.isEnabled !== undefined ? backendData.isEnabled : category.enabled
      }
    }).sort((a, b) => (a.sort || 0) - (b.sort || 0))
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  loadCategories()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    name: '',
    enabled: null
  })
  loadCategories()
}

const editCategory = (category: any) => {
  editingCategory.value = category
  Object.assign(formData, {
    name: category.name,
    description: category.description || '',
    sort: category.sort || 0,
    enabled: category.enabled
  })
  showCreateDialog.value = true
}

const deleteCategory = async (category: any) => {
  if (category.imageCount > 0) {
    ElMessage.warning('该分类下还有图片，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认删除分类 "${category.name}"？`,
      '删除确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await api.deleteGalleryCategory(category.name)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const toggleCategoryStatus = async (category: any) => {
  try {
    // 发送完整的分类数据，只更新enabled字段
    const updateData = {
      name: category.name,
      description: category.description,
      sort: category.sort || 0,
      enabled: category.enabled
    }
    
    await api.updateGalleryCategory(category.name, updateData)
    ElMessage.success(`${category.enabled ? '启用' : '禁用'}成功`)
    loadCategories()
  } catch (error) {
    console.error('更新状态失败:', error)
    ElMessage.error('更新状态失败')
    // 回滚状态
    category.enabled = !category.enabled
  }
}

const submitForm = async () => {
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const data = { ...formData }
    
    if (editingCategory.value) {
      await api.updateGalleryCategory(editingCategory.value.name, data)
      ElMessage.success('更新成功')
    } else {
      await api.createGalleryCategory(data)
      ElMessage.success('创建成功')
    }
    
    showCreateDialog.value = false
    loadCategories()
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('操作失败')
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  editingCategory.value = null
  Object.assign(formData, {
    name: '',
    description: '',
    sort: 0,
    enabled: true
  })
  formRef.value?.resetFields()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.gallery-category-list {
  padding: 24px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title-section h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.subtitle {
  margin: 4px 0 0 0;
  color: #666;
}

.filters {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.disabled-icon {
  color: #f56c6c;
}

.description-text {
  color: #666;
}

.form-tips {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style> 