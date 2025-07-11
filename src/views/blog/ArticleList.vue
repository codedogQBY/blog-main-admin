<template>
  <div class="modern-article-list">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">
          <el-icon class="title-icon"><Document /></el-icon>
          文章管理
        </h1>
        <p class="page-subtitle">创建和管理您的博客文章</p>
      </div>
      <div class="header-right">
        <PermissionCheck permission="article.create">
            <el-button 
            type="primary" 
            @click="handleCreate"
            class="create-btn"
          >
            <el-icon><EditPen /></el-icon>
            创建文章
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
                v-model="searchForm.search"
                placeholder="搜索文章标题、内容..."
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
                v-model="searchForm.categoryId"
                placeholder="选择分类"
                clearable
                @change="handleSearch"
                class="category-filter"
              >
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </div>

            <div class="search-item">
              <el-select
                v-model="searchForm.status"
                placeholder="发布状态"
                clearable
                @change="handleSearch"
                class="status-filter"
              >
                <el-option label="已发布" value="published" />
                <el-option label="草稿" value="draft" />
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
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.total }}</div>
            <div class="stat-label">总文章数</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon published">
            <el-icon><Check /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.published }}</div>
            <div class="stat-label">已发布</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon draft">
            <el-icon><EditPen /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.draft }}</div>
            <div class="stat-label">草稿</div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon views">
            <el-icon><View /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.totalViews }}</div>
            <div class="stat-label">总阅读量</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文章列表 -->
    <div class="list-section">
      <el-card class="list-card" shadow="never">
        <template #header>
          <div class="list-header">
            <div class="header-info">
              <span class="result-count">共 {{ pagination.total }} 篇文章</span>
            </div>
            <div class="header-actions">
              <el-button-group class="view-toggle">
                <el-button 
                  :type="viewMode === 'list' ? 'primary' : ''"
                  @click="viewMode = 'list'"
                  size="small"
                >
                  <el-icon><List /></el-icon>
                </el-button>
                <el-button 
                  :type="viewMode === 'grid' ? 'primary' : ''"
                  @click="viewMode = 'grid'"
                  size="small"
                >
                  <el-icon><Grid /></el-icon>
                </el-button>
              </el-button-group>
            </div>
          </div>
        </template>

        <!-- 列表视图 -->
        <div v-if="viewMode === 'list'" class="list-view">
          <div v-loading="loading" class="article-list">
            <div 
              v-for="article in articles" 
              :key="article.id" 
              class="article-item"
              @click="handleEdit(article.id)"
            >
              <div class="article-cover">
                <img 
                  v-if="article.coverImage" 
                  :src="article.coverImage" 
                  :alt="article.title"
                  class="cover-image"
                />
                <div v-else class="cover-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
              </div>
              
              <div class="article-content">
                <div class="article-header">
                  <h3 class="article-title">{{ article.title }}</h3>
                  <div class="article-meta">
                    <span class="meta-item">
                      <el-icon><User /></el-icon>
                      {{ article.author?.name }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Collection /></el-icon>
                      {{ article.category?.name }}
                    </span>
                    <span class="meta-item">
                      <el-icon><Calendar /></el-icon>
                      {{ formatDate(article.createdAt) }}
                    </span>
                  </div>
                </div>
                
                <p class="article-excerpt">{{ article.excerpt || '暂无摘要' }}</p>
                
                <div class="article-tags" v-if="article.tags?.length">
                  <el-tag 
                    v-for="tag in article.tags" 
                    :key="tag.id"
                    size="small"
                    class="tag-item"
                  >
                    {{ tag.tag.name }}
                  </el-tag>
                </div>
              </div>
              
              <div class="article-status">
                <el-tag 
                  :type="article.published ? 'success' : 'warning'"
                  class="status-tag"
                >
                  {{ article.published ? '已发布' : '草稿' }}
                </el-tag>
                
                <div class="article-stats">
                  <div class="stat-item">
                    <el-icon><View /></el-icon>
                    <span>{{ article.views || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <el-icon><ChatLineSquare /></el-icon>
                    <span>{{ article._count?.comments || 0 }}</span>
                  </div>
                  <div class="stat-item">
                    <el-icon><Star /></el-icon>
                    <span>{{ article._count?.likes || 0 }}</span>
                  </div>
                </div>
              </div>
              
              <div class="article-actions">
                <el-dropdown @command="handleCommand" trigger="hover">
                  <el-button text class="action-btn">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <PermissionCheck permission="article.update">
                        <el-dropdown-item :command="`edit:${article.id}`">
                          <el-icon><Edit /></el-icon>
                          编辑
                        </el-dropdown-item>
                      </PermissionCheck>
                      <PermissionCheck permission="article.update">
                        <el-dropdown-item :command="`copy:${article.id}`">
                          <el-icon><CopyDocument /></el-icon>
                          复制
                        </el-dropdown-item>
                      </PermissionCheck>
                      <PermissionCheck permission="article.update">
                        <el-dropdown-item :command="`toggle:${article.id}`">
                          <el-icon><Switch /></el-icon>
                          {{ article.published ? '取消发布' : '发布' }}
                        </el-dropdown-item>
                      </PermissionCheck>
                      <PermissionCheck permission="article.delete">
                        <el-dropdown-item :command="`delete:${article.id}`" class="danger-item">
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-dropdown-item>
                      </PermissionCheck>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-else class="grid-view">
          <div v-loading="loading" class="article-grid">
            <div 
              v-for="article in articles" 
              :key="article.id" 
              class="article-card"
            >
              <div class="card-cover">
                <img 
                  v-if="article.coverImage" 
                  :src="article.coverImage" 
                  :alt="article.title"
                  class="cover-image"
                />
                <div v-else class="cover-placeholder">
                  <el-icon><Picture /></el-icon>
                </div>
                <PermissionCheck permission="article.update">
                    <div class="card-overlay">
                    <el-button 
                      type="primary" 
                      @click="handleEdit(article.id)"
                      class="edit-btn"
                    >
                      <el-icon><Edit /></el-icon>
                      编辑
                    </el-button>
                  </div>
                </PermissionCheck>
              </div>
              
              <div class="card-content">
                  <div class="card-header">
                  <h3 class="card-title">{{ article.title }}</h3>
                  <el-tag 
                    :type="article.published ? 'success' : 'warning'"
                    size="small"
                  >
                    {{ article.published ? '已发布' : '草稿' }}
                  </el-tag>
                </div>
                
                <p class="card-excerpt">{{ article.excerpt || '暂无摘要' }}</p>
                
                <div class="card-meta">
                  <span class="meta-item">
                    <el-icon><User /></el-icon>
                    {{ article.author?.name }}
                  </span>
                  <span class="meta-item">
                    <el-icon><Calendar /></el-icon>
                    {{ formatDate(article.createdAt) }}
                  </span>
                </div>
                
                <div class="card-footer">
                  <div class="card-stats">
                    <div class="stat-item">
                      <el-icon><View /></el-icon>
                      <span>{{ article.views || 0 }}</span>
                    </div>
                    <div class="stat-item">
                      <el-icon><ChatLineSquare /></el-icon>
                      <span>{{ article._count?.comments || 0 }}</span>
                    </div>
                    <div class="stat-item">
                      <el-icon><Star /></el-icon>
                      <span>{{ article._count?.likes || 0 }}</span>
                    </div>
                  </div>
                  
                  <el-dropdown @command="handleCommand">
                    <el-button text size="small">
                      <el-icon><MoreFilled /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <PermissionCheck permission="article.update">
                          <el-dropdown-item :command="`edit:${article.id}`">
                            <el-icon><Edit /></el-icon>
                            编辑
                          </el-dropdown-item>
                        </PermissionCheck>
                        <PermissionCheck permission="article.update">
                          <el-dropdown-item :command="`copy:${article.id}`">
                            <el-icon><CopyDocument /></el-icon>
                            复制
                          </el-dropdown-item>
                        </PermissionCheck>
                        <PermissionCheck permission="article.update">
                          <el-dropdown-item :command="`toggle:${article.id}`">
                            <el-icon><Switch /></el-icon>
                            {{ article.published ? '取消发布' : '发布' }}
                          </el-dropdown-item>
                        </PermissionCheck>
                        <PermissionCheck permission="article.delete">
                          <el-dropdown-item :command="`delete:${article.id}`" class="danger-item">
                            <el-icon><Delete /></el-icon>
                            删除
                          </el-dropdown-item>
                        </PermissionCheck>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && articles.length === 0" class="empty-state">
          <div class="empty-icon">
            <el-icon><Document /></el-icon>
          </div>
          <h3 class="empty-title">暂无文章</h3>
          <p class="empty-description">
            {{ searchForm.search ? '没有找到匹配的文章' : '还没有创建任何文章' }}
          </p>
          <el-button 
            v-if="!searchForm.search" 
            type="primary" 
            @click="handleCreate"
            class="empty-action"
          >
            <el-icon><EditPen /></el-icon>
            创建第一篇文章
          </el-button>
        </div>

        <!-- 分页 -->
        <div v-if="articles.length > 0" class="pagination-section">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.limit"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="handlePageChange"
            @size-change="handleSizeChange"
            class="pagination"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import PermissionCheck from '@/components/PermissionCheck.vue'
import { articleApi, categoryApi } from '@/lib/api'

const router = useRouter()

// 状态管理
const loading = ref(false)
const viewMode = ref<'list' | 'grid'>('list')

// 搜索表单
const searchForm = reactive({
  search: '',
  categoryId: '',
  status: ''
})

// 数据
const articles = ref<any[]>([])
const categories = ref<any[]>([])

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 统计数据
const stats = ref({
  total: 0,
  published: 0,
  draft: 0,
  totalViews: 0
})

// 搜索防抖
let searchTimeout: NodeJS.Timeout | null = null

// 初始化
onMounted(async () => {
  await loadCategories()
  await loadArticles()
  await loadStats()
})

// 加载分类列表
const loadCategories = async () => {
  try {
    const data = await categoryApi.getList()
    categories.value = Array.isArray(data) ? data : data.data || []
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载文章列表
const loadArticles = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      search: searchForm.search || undefined,
      categoryId: searchForm.categoryId || undefined,
      published: searchForm.status === 'published' ? true : 
                 searchForm.status === 'draft' ? false : undefined
    }
    
    const data = await articleApi.getAdminList(params)
    
    if (data && typeof data === 'object') {
      articles.value = data.data || (data as any).articles || []
      pagination.total = data.total || (data as any).pagination?.total || 0
    } else {
      articles.value = Array.isArray(data) ? data : []
      pagination.total = articles.value.length
    }
  } catch (error) {
    ElMessage.error('加载文章列表失败')
    console.error('加载文章失败:', error)
    articles.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

// 加载统计数据
const loadStats = async () => {
  try {
    // 这里应该调用统计API，暂时使用文章列表计算
    stats.value = {
      total: articles.value.length,
      published: articles.value.filter(a => a.published).length,
      draft: articles.value.filter(a => !a.published).length,
      totalViews: articles.value.reduce((sum, a) => sum + (a.views || 0), 0)
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 搜索处理
const handleSearch = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  searchTimeout = setTimeout(() => {
    pagination.page = 1
    loadArticles()
  }, 300)
}

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    search: '',
    categoryId: '',
    status: ''
  })
  pagination.page = 1
  loadArticles()
}

// 分页处理
const handlePageChange = (page: number) => {
  pagination.page = page
  loadArticles()
}

const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  loadArticles()
}

// 操作处理
const handleCreate = () => {
  router.push('/admin/articles/create')
}

const handleEdit = (id: string) => {
  router.push(`/admin/articles/edit/${id}`)
}

const handleCommand = async (command: string) => {
  const [action, id] = command.split(':')
  
  switch (action) {
    case 'edit':
      handleEdit(id)
      break
      
    case 'copy':
      await handleCopy(id)
      break
      
    case 'toggle':
      await handleTogglePublish(id)
      break
      
    case 'delete':
      await handleDelete(id)
      break
  }
}

// 复制文章
const handleCopy = async (id: string) => {
  try {
    const article = await articleApi.getById(id)
    const { id: articleId, createdAt, updatedAt, ...articleData } = article
    const newArticle = {
      ...articleData,
      title: `${article.title} - 副本`,
      published: false,
      tags: article.tags?.map((tag: any) => tag.tag?.name || tag.name || tag) || []
    }
    
    await articleApi.create(newArticle)
    ElMessage.success('文章复制成功')
    loadArticles()
  } catch (error) {
    ElMessage.error('复制文章失败')
    console.error(error)
  }
}

// 切换发布状态
const handleTogglePublish = async (id: string) => {
  try {
    const article = articles.value.find(a => a.id === id)
    if (!article) return
    
    await articleApi.update(id, {
      published: !article.published
    })
    
    ElMessage.success(article.published ? '取消发布成功' : '发布成功')
    loadArticles()
  } catch (error) {
    ElMessage.error('操作失败')
    console.error(error)
  }
}

// 删除文章
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这篇文章吗？此操作不可恢复。',
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await articleApi.delete(id)
    ElMessage.success('删除成功')
    loadArticles()
    loadStats()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 工具函数
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}
</script>

<style scoped lang="scss">
.modern-article-list {
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
        color: #3b82f6;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
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

          .search-input {
            :deep(.el-input__wrapper) {
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.2s ease;

              &:hover {
                border-color: #3b82f6;
              }

              &.is-focus {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              }
            }
          }

          .category-filter,
          .status-filter {
            width: 100%;

            :deep(.el-select__wrapper) {
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              transition: all 0.2s ease;

              &:hover {
                border-color: #3b82f6;
              }

              &.is-focus {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
              color: #3b82f6;
              border-color: #3b82f6;
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.published {
          background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        }

        &.draft {
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        }

        &.views {
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

      .header-actions {
        .view-toggle {
          :deep(.el-button) {
            border-radius: 8px;
            
            &:first-child {
              border-top-right-radius: 0;
              border-bottom-right-radius: 0;
            }
            
            &:last-child {
              border-top-left-radius: 0;
              border-bottom-left-radius: 0;
            }
          }
        }
      }
    }
  }
}

// 列表视图样式
.list-view {
  .article-list {
    .article-item {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #f8fafc;
      }

      &:last-child {
        border-bottom: none;
      }

      .article-cover {
        width: 120px;
        height: 80px;
        border-radius: 12px;
        overflow: hidden;
        flex-shrink: 0;

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-placeholder {
          width: 100%;
          height: 100%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 24px;
        }
      }

      .article-content {
        flex: 1;
        min-width: 0;

        .article-header {
          margin-bottom: 12px;

          .article-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0 0 8px 0;
            line-height: 1.3;
            
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }

          .article-meta {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;

            .meta-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 13px;
              color: #64748b;

              .el-icon {
                color: #94a3b8;
                font-size: 14px;
              }
            }
          }
        }

        .article-excerpt {
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 12px 0;
          
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .article-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;

          .tag-item {
            background: #f1f5f9;
            color: #64748b;
            border: none;
            font-size: 12px;
          }
        }
      }

      .article-status {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;

        .status-tag {
          font-weight: 500;
        }

        .article-stats {
          display: flex;
          gap: 12px;

          .stat-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #64748b;

            .el-icon {
              color: #94a3b8;
              font-size: 14px;
            }
          }
        }
      }

      .article-actions {
        flex-shrink: 0;

        .action-btn {
          color: #64748b;
          font-size: 18px;
          
          &:hover {
            color: #3b82f6;
          }
        }
      }
    }
  }
}

// 网格视图样式
.grid-view {
  padding: 24px;

  .article-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;

    .article-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .card-cover {
        position: relative;
        height: 200px;
        overflow: hidden;

        .cover-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cover-placeholder {
          width: 100%;
          height: 100%;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 32px;
        }

        .card-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;

          .edit-btn {
            border-radius: 8px;
            font-weight: 500;
          }
        }

        &:hover .card-overlay {
          opacity: 1;
        }
      }

      .card-content {
        padding: 20px;

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 12px;

          .card-title {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
            line-height: 1.3;
            flex: 1;
            
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        }

        .card-excerpt {
          color: #64748b;
          font-size: 14px;
          line-height: 1.5;
          margin: 0 0 16px 0;
          
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 16px;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            color: #64748b;

            .el-icon {
              color: #94a3b8;
              font-size: 14px;
            }
          }
        }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .card-stats {
            display: flex;
            gap: 12px;

            .stat-item {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 13px;
              color: #64748b;

              .el-icon {
                color: #94a3b8;
                font-size: 14px;
              }
            }
          }
        }
      }
    }
  }
}

// 空状态样式
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
    margin: 0 0 24px 0;
  }

  .empty-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 500;
  }
}

// 分页样式
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

// 下拉菜单样式
:deep(.el-dropdown-menu) {
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  .el-dropdown-menu__item {
    border-radius: 8px;
    margin: 2px 0;
    
    &.danger-item {
      color: #ef4444;
      
      &:hover {
        background: #fef2f2;
      }
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

  .list-view .article-list .article-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;

    .article-cover {
      width: 100%;
      height: 160px;
    }

    .article-status {
      flex-direction: row;
      align-items: center;
      width: 100%;
      justify-content: space-between;
    }
  }

  .grid-view .article-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .modern-article-list {
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

  .grid-view .article-grid {
    grid-template-columns: 1fr;
  }
}
</style> 