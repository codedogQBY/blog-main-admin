<template>
  <div class="modern-categories-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><FolderOpened /></el-icon>
          分类管理
        </h1>
        <p class="page-subtitle">管理文章分类和层级结构</p>
      </div>
      <div class="header-right">
        <PermissionCheck permission="category.create">
          <el-button 
            type="primary" 
            @click="showCreateDialog"
            class="create-btn"
          >
            <el-icon><Plus /></el-icon>
            新增分类
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
                placeholder="搜索分类名称或描述..."
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
                v-model="statusFilter"
                placeholder="选择状态"
                clearable
                @change="handleSearch"
                class="status-filter"
              >
                <el-option label="启用" value="enabled" />
                <el-option label="禁用" value="disabled" />
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
            <el-icon><FolderOpened /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总分类数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon enabled">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.enabled }}</div>
            <div class="stat-label">启用分类</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon articles">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.articles }}</div>
            <div class="stat-label">文章总数</div>
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

    <!-- 分类列表 -->
    <div class="list-section">
      <el-card class="list-card" shadow="never">
        <template #header>
          <div class="list-header">
            <div class="header-info">
              <span class="result-count">共 {{ total }} 个分类</span>
            </div>
          </div>
        </template>

        <div v-loading="loading" class="category-list">
          <div 
            v-for="category in categories" 
            :key="category.id" 
            class="category-item"
          >
            <div class="category-icon">
              <div class="category-avatar">
                <el-icon><FolderOpened /></el-icon>
              </div>
            </div>
            
            <div class="category-info">
              <div class="category-header">
                <h3 class="category-name">{{ category.name }}</h3>
                <div class="category-badges">
                  <el-tag 
                    :type="category.status === 'enabled' ? 'success' : 'danger'" 
                    size="small"
                  >
                    {{ category.status === 'enabled' ? '启用' : '禁用' }}
                  </el-tag>
                  <el-tag type="info" size="small">
                    {{ category.articleCount || 0 }} 篇文章
                  </el-tag>
                </div>
              </div>
              
              <div class="category-details">
                <div class="detail-item" v-if="category.description">
                  <el-icon><Document /></el-icon>
                  <span>{{ category.description }}</span>
                </div>
                <div class="detail-item" v-if="category.parentCategory">
                  <el-icon><Connection /></el-icon>
                  <span>父分类：{{ category.parentCategory.name }}</span>
                </div>
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDate(category.createdAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="category-actions">
              <PermissionCheck permission="category.update">
                <el-button type="primary" size="small" @click="editCategory(category)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </PermissionCheck>
              <PermissionCheck permission="category.delete">
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteCategory(category)"
                  :disabled="category.articleCount > 0"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </PermissionCheck>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && categories.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><FolderOpened /></el-icon>
          </div>
          <h3 class="empty-title">暂无分类</h3>
          <p class="empty-description">
            {{ searchText ? '没有找到匹配的分类' : '还没有创建任何分类' }}
          </p>
        </div>

        <!-- 分页 -->
        <div v-if="categories.length > 0" class="pagination-section">
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

    <!-- 创建/编辑分类对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="600px"
      @close="resetForm"
      class="category-dialog"
    >
      <el-form
        ref="categoryFormRef"
        :model="categoryForm"
        :rules="categoryRules"
        label-width="100px"
        class="category-form"
      >
        <div class="form-row">
          <el-form-item label="分类名称" prop="name">
            <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
          </el-form-item>
          
          <el-form-item label="分类别名" prop="slug">
            <el-input v-model="categoryForm.slug" placeholder="请输入分类别名，用于URL" />
          </el-form-item>
        </div>
        
        <el-form-item label="分类描述">
          <el-input
            v-model="categoryForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入分类描述"
          />
        </el-form-item>
        
        <div class="form-row">
          <el-form-item label="父分类">
            <el-select
              v-model="categoryForm.parentId"
              placeholder="选择父分类（可选）"
              clearable
              class="parent-select"
            >
              <el-option
                v-for="parent in availableParents"
                :key="parent.id"
                :label="parent.name"
                :value="parent.id"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="状态">
            <el-switch
              v-model="categoryForm.status"
              active-value="enabled"
              inactive-value="disabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </div>
        
        <el-form-item label="排序">
          <el-input-number
            v-model="categoryForm.sort"
            :min="0"
            :max="9999"
            placeholder="排序值，数值越小越靠前"
          />
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
  FolderOpened, 
  Plus, 
  Search, 
  Refresh, 
  Check, 
  Document, 
  Clock, 
  Calendar, 
  Edit, 
  Delete,
  Connection
} from '@element-plus/icons-vue'
import { categoryApi } from '../../lib/api'
import PermissionCheck from '../../components/PermissionCheck.vue'
import type { Category } from '../../lib/api'

// 数据状态
const loading = ref(false)
const submitting = ref(false)
const categories = ref<Category[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const statusFilter = ref('')

// 搜索防抖
let searchTimeout: NodeJS.Timeout | null = null

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const categoryFormRef = ref<FormInstance>()

// 表单数据
const categoryForm = reactive({
  id: '',
  name: '',
  slug: '',
  description: '',
  parentId: '',
  status: 'enabled',
  sort: 0
})

// 可用的父分类
const availableParents = computed(() => {
  return categories.value.filter(cat => 
    cat.id !== categoryForm.id && 
    cat.status === 'enabled'
  )
})

// 统计数据
const stats = computed(() => ({
  total: categories.value.length,
  enabled: categories.value.filter(c => c.status === 'enabled').length,
  articles: categories.value.reduce((sum, c) => sum + (c.articleCount || 0), 0),
  newToday: categories.value.filter(c => {
    const today = new Date().toDateString()
    return new Date(c.createdAt).toDateString() === today
  }).length
}))

// 表单验证规则
const categoryRules: FormRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' }
  ],
  slug: [
    { 
      pattern: /^[a-zA-Z0-9-_\u4e00-\u9fa5]*$/, 
      message: '分类别名只能包含字母、数字、横线、下划线和中文', 
      trigger: 'blur' 
    }
  ]
}

// 初始化
onMounted(async () => {
  await loadCategories()
})

// 加载分类列表
const loadCategories = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchText.value || undefined,
      status: statusFilter.value || undefined
    }
    
    const data = await categoryApi.getAdminList(params)
    categories.value = Array.isArray(data) ? data : data.data || []
    total.value = typeof data === 'object' ? data.total || 0 : categories.value.length
  } catch (error) {
    ElMessage.error('加载分类列表失败')
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
    loadCategories()
  }, 300)
}

// 重置搜索
const resetSearch = () => {
  searchText.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  loadCategories()
}

// 分页处理
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadCategories()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadCategories()
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑分类
const editCategory = (category: Category) => {
  isEdit.value = true
  Object.assign(categoryForm, {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description || '',
    parentId: category.parentId || '',
    status: category.status,
    sort: category.sort || 0
  })
  dialogVisible.value = true
}

// 删除分类
const deleteCategory = async (category: Category) => {
  if (category.articleCount > 0) {
    ElMessage.warning('该分类下还有文章，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除分类 "${category.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await categoryApi.delete(category.id)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 提交表单
const submitForm = async () => {
  if (!categoryFormRef.value) return
  
  try {
    await categoryFormRef.value.validate()
    submitting.value = true
    
    const categoryData = { ...categoryForm }
    
    // 处理parentId：如果为空字符串，则设置为null
    if (!categoryData.parentId || categoryData.parentId === '') {
      categoryData.parentId = null
    }
    
    if (isEdit.value) {
      await categoryApi.update(categoryData.id, categoryData)
      ElMessage.success('更新成功')
    } else {
      await categoryApi.create(categoryData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadCategories()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(categoryForm, {
    id: '',
    name: '',
    slug: '',
    description: '',
    parentId: '',
    status: 'enabled',
    sort: 0
  })
  categoryFormRef.value?.resetFields()
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
.modern-categories-page {
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
          min-width: 200px;

          .search-input,
          .status-filter {
            width: 100%;

            :deep(.el-input__wrapper),
            :deep(.el-select__wrapper) {
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

        &.enabled {
          background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        }

        &.articles {
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        }

        &.new {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
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

  .category-list {
    .category-item {
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

      .category-icon {
        flex-shrink: 0;

        .category-avatar {
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

      .category-info {
        flex: 1;
        min-width: 0;

        .category-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .category-name {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }

          .category-badges {
            display: flex;
            gap: 8px;
          }
        }

        .category-details {
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

      .category-actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;

        .el-button {
          border-radius: 8px;
          font-weight: 500;

          &:disabled {
            opacity: 0.5;
          }
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

.category-dialog {
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

  .category-form {
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
          border-color: #f59e0b;
        }

        &:focus,
        &.is-focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }
      }
    }

    .parent-select {
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

  .category-list .category-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .category-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}

@media (max-width: 768px) {
  .modern-categories-page {
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