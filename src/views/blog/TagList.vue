<template>
  <div class="modern-tags-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><CollectionTag /></el-icon>
          标签管理
        </h1>
        <p class="page-subtitle">管理文章标签和分类标记</p>
      </div>
      <div class="header-right">
        <PermissionCheck permission="tag.create">
          <el-button 
            type="primary" 
            @click="showCreateDialog"
            class="create-btn"
          >
            <el-icon><Plus /></el-icon>
            新增标签
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
                placeholder="搜索标签名称或描述..."
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
                v-model="colorFilter"
                placeholder="选择颜色"
                clearable
                @change="handleSearch"
                class="color-filter"
              >
                <el-option
                  v-for="color in tagColors"
                  :key="color.value"
                  :label="color.label"
                  :value="color.value"
                >
                  <div class="color-option">
                    <div class="color-dot" :style="{ backgroundColor: color.value }"></div>
                    <span>{{ color.label }}</span>
                  </div>
                </el-option>
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
            <el-icon><CollectionTag /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总标签数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon used">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.used }}</div>
            <div class="stat-label">已使用标签</div>
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

    <!-- 标签列表 -->
    <div class="list-section">
      <el-card class="list-card" shadow="never">
        <template #header>
          <div class="list-header">
            <div class="header-info">
              <span class="result-count">共 {{ total }} 个标签</span>
            </div>
          </div>
        </template>

        <div v-loading="loading" class="tag-list">
          <div 
            v-for="tag in tags" 
            :key="tag.id" 
            class="tag-item"
          >
            <div class="tag-icon">
              <div 
                class="tag-avatar" 
                :style="{ backgroundColor: tag.color || '#6b7280' }"
              >
                <el-icon><CollectionTag /></el-icon>
              </div>
            </div>
            
            <div class="tag-info">
              <div class="tag-header">
                <h3 class="tag-name">{{ tag.name }}</h3>
                <div class="tag-badges">
                  <el-tag 
                    :color="tag.color" 
                    size="small"
                    class="color-tag"
                  >
                    {{ tag.color || '默认' }}
                  </el-tag>
                  <el-tag type="info" size="small">
                    {{ tag.articleCount || 0 }} 篇文章
                  </el-tag>
                </div>
              </div>
              
              <div class="tag-details">
                <div class="detail-item" v-if="tag.description">
                  <el-icon><Document /></el-icon>
                  <span>{{ tag.description }}</span>
                </div>
                <div class="detail-item" v-if="tag.slug">
                  <el-icon><Link /></el-icon>
                  <span>别名：{{ tag.slug }}</span>
                </div>
                <div class="detail-item">
                  <el-icon><Calendar /></el-icon>
                  <span>{{ formatDate(tag.createdAt) }}</span>
                </div>
              </div>
            </div>
            
            <div class="tag-actions">
              <PermissionCheck permission="tag.update">
                <el-button type="primary" size="small" @click="editTag(tag)">
                  <el-icon><Edit /></el-icon>
                  编辑
                </el-button>
              </PermissionCheck>
              <PermissionCheck permission="tag.delete">
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="deleteTag(tag)"
                  :disabled="tag.articleCount > 0"
                >
                  <el-icon><Delete /></el-icon>
                  删除
                </el-button>
              </PermissionCheck>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && tags.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><CollectionTag /></el-icon>
          </div>
          <h3 class="empty-title">暂无标签</h3>
          <p class="empty-description">
            {{ searchText ? '没有找到匹配的标签' : '还没有创建任何标签' }}
          </p>
        </div>

        <!-- 分页 -->
        <div v-if="tags.length > 0" class="pagination-section">
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

    <!-- 创建/编辑标签对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑标签' : '新增标签'"
      width="600px"
      @close="resetForm"
      class="tag-dialog"
    >
      <el-form
        ref="tagFormRef"
        :model="tagForm"
        :rules="tagRules"
        label-width="100px"
        class="tag-form"
      >
        <div class="form-row">
          <el-form-item label="标签名称" prop="name">
            <el-input v-model="tagForm.name" placeholder="请输入标签名称" />
          </el-form-item>
          
          <el-form-item label="标签别名" prop="slug">
            <el-input v-model="tagForm.slug" placeholder="请输入标签别名，用于URL" />
          </el-form-item>
        </div>
        
        <el-form-item label="标签描述">
          <el-input
            v-model="tagForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入标签描述"
          />
        </el-form-item>
        
        <div class="form-row">
          <el-form-item label="标签颜色">
            <div class="color-picker-section">
              <el-color-picker 
                v-model="tagForm.color" 
                :predefine="predefineColors"
                show-alpha
              />
              <span class="color-preview">{{ tagForm.color || '默认颜色' }}</span>
            </div>
          </el-form-item>
          
          <el-form-item label="排序">
            <el-input-number
              v-model="tagForm.sort"
              :min="0"
              :max="9999"
              placeholder="排序值，数值越小越靠前"
            />
          </el-form-item>
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
  CollectionTag, 
  Plus, 
  Search, 
  Refresh, 
  Check, 
  Document, 
  Clock, 
  Calendar, 
  Edit, 
  Delete,
  Link
} from '@element-plus/icons-vue'
import { tagApi } from '../../lib/api'
import PermissionCheck from '../../components/PermissionCheck.vue'
import type { Tag } from '../../lib/api'

// 数据状态
const loading = ref(false)
const submitting = ref(false)
const tags = ref<Tag[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchText = ref('')
const colorFilter = ref('')

// 搜索防抖
let searchTimeout: NodeJS.Timeout | null = null

// 对话框状态
const dialogVisible = ref(false)
const isEdit = ref(false)
const tagFormRef = ref<FormInstance>()

// 表单数据
const tagForm = reactive({
  id: '',
  name: '',
  slug: '',
  description: '',
  color: '',
  sort: 0
})

// 预定义颜色
const predefineColors = [
  '#ff4757',
  '#ff6b81',
  '#ff9ff3',
  '#54a0ff',
  '#5f27cd',
  '#00d2d3',
  '#ff9f43',
  '#10ac84',
  '#ee5a24',
  '#0abde3',
  '#3742fa',
  '#2f3542'
]

// 标签颜色选项
const tagColors = computed(() => [
  { label: '红色', value: '#ff4757' },
  { label: '粉色', value: '#ff6b81' },
  { label: '紫色', value: '#5f27cd' },
  { label: '蓝色', value: '#54a0ff' },
  { label: '青色', value: '#0abde3' },
  { label: '绿色', value: '#10ac84' },
  { label: '橙色', value: '#ff9f43' },
  { label: '灰色', value: '#6b7280' }
])

// 统计数据
const stats = computed(() => ({
  total: tags.value.length,
  used: tags.value.filter(t => t.articleCount && t.articleCount > 0).length,
  articles: tags.value.reduce((sum, t) => sum + (t.articleCount || 0), 0),
  newToday: tags.value.filter(t => {
    const today = new Date().toDateString()
    return new Date(t.createdAt).toDateString() === today
  }).length
}))

// 表单验证规则
const tagRules: FormRules = {
  name: [
    { required: true, message: '请输入标签名称', trigger: 'blur' }
  ],
  slug: [
    { 
      pattern: /^[a-zA-Z0-9-_\u4e00-\u9fa5]*$/, 
      message: '标签别名只能包含字母、数字、横线、下划线和中文', 
      trigger: 'blur' 
    }
  ]
}

// 初始化
onMounted(async () => {
  await loadTags()
})

// 加载标签列表
const loadTags = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchText.value || undefined,
      color: colorFilter.value || undefined
    }
    
    const data = await tagApi.getList(params)
    tags.value = Array.isArray(data) ? data : data.data || []
    total.value = typeof data === 'object' ? data.total || 0 : tags.value.length
  } catch (error) {
    ElMessage.error('加载标签列表失败')
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
    loadTags()
  }, 300)
}

// 重置搜索
const resetSearch = () => {
  searchText.value = ''
  colorFilter.value = ''
  currentPage.value = 1
  loadTags()
}

// 分页处理
const handleCurrentChange = (page: number) => {
  currentPage.value = page
  loadTags()
}

const handleSizeChange = (size: number) => {
  pageSize.value = size
  currentPage.value = 1
  loadTags()
}

// 显示创建对话框
const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
}

// 编辑标签
const editTag = (tag: Tag) => {
  isEdit.value = true
  Object.assign(tagForm, {
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    description: tag.description || '',
    color: tag.color || '',
    sort: tag.sort || 0
  })
  dialogVisible.value = true
}

// 删除标签
const deleteTag = async (tag: Tag) => {
  if (tag.articleCount > 0) {
    ElMessage.warning('该标签下还有文章，无法删除')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除标签 "${tag.name}" 吗？此操作不可恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await tagApi.delete(tag.id)
    ElMessage.success('删除成功')
    loadTags()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 提交表单
const submitForm = async () => {
  if (!tagFormRef.value) return
  
  try {
    await tagFormRef.value.validate()
    submitting.value = true
    
    const tagData = { ...tagForm }
    
    if (isEdit.value) {
      await tagApi.update(tagData.id, tagData)
      ElMessage.success('更新成功')
    } else {
      await tagApi.create(tagData)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadTags()
  } catch (error) {
    ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    console.error(error)
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(tagForm, {
    id: '',
    name: '',
    slug: '',
    description: '',
    color: '',
    sort: 0
  })
  tagFormRef.value?.resetFields()
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
.modern-tags-page {
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
        color: #06b6d4;
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
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4);
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
          .color-filter {
            width: 100%;

            :deep(.el-input__wrapper),
            :deep(.el-select__wrapper) {
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.2s ease;

              &:hover {
                border-color: #06b6d4;
              }

              &.is-focus {
                border-color: #06b6d4;
                box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
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
              color: #06b6d4;
              border-color: #06b6d4;
              background: #f8fafc;
            }
          }
        }
      }
    }
  }
}

.color-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .color-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid #e2e8f0;
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
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
        }

        &.used {
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

  .tag-list {
    .tag-item {
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

      .tag-icon {
        flex-shrink: 0;

        .tag-avatar {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
      }

      .tag-info {
        flex: 1;
        min-width: 0;

        .tag-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .tag-name {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }

          .tag-badges {
            display: flex;
            gap: 8px;

            .color-tag {
              color: white;
              border: none;
            }
          }
        }

        .tag-details {
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

      .tag-actions {
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

.tag-dialog {
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

  .tag-form {
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
          border-color: #06b6d4;
        }

        &:focus,
        &.is-focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
        }
      }
    }

    .color-picker-section {
      display: flex;
      align-items: center;
      gap: 12px;

      .color-preview {
        font-size: 14px;
        color: #64748b;
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

  .tag-list .tag-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .tag-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
}

@media (max-width: 768px) {
  .modern-tags-page {
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