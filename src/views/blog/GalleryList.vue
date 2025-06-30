<template>
  <div class="gallery-list">
    <div class="header-actions">
      <div class="title-section">
        <h2>图集管理</h2>
        <p class="subtitle">管理网站图集内容</p>
      </div>
      <div class="action-buttons">
        <el-button type="primary" @click="createGallery">
          <el-icon><Plus /></el-icon>
          新建图集
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="filters">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-input
            v-model="searchForm.title"
            placeholder="搜索图集标题"
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
            v-model="searchForm.category"
            placeholder="选择分类"
            clearable
            @change="handleSearch"
          >
            <el-option
              v-for="category in categories"
              :key="category.name"
              :label="category.name"
              :value="category.name"
            />
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-select
            v-model="searchForm.status"
            placeholder="状态"
            clearable
            @change="handleSearch"
          >
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-col>
      </el-row>
    </div>

    <!-- 图集列表 -->
    <el-table
      v-loading="loading"
      :data="galleryItems"
      style="width: 100%"
    >
      <el-table-column label="封面" width="120">
        <template #default="scope">
          <div class="cover-preview">
            <el-image
              :src="scope.row.coverImage || (scope.row.images?.[0]?.imageUrl)"
              fit="cover"
              class="preview-image"
              :preview-src-list="scope.row.images?.map((img: any) => img.imageUrl) || []"
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div class="image-count">
              {{ scope.row.images?.length || 0 }} 张
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="title" label="图集标题" min-width="200">
        <template #default="scope">
          <div class="title-cell">
            <div class="title">{{ scope.row.title }}</div>
            <div class="description" v-if="scope.row.description">
              {{ scope.row.description.substring(0, 80) }}{{ scope.row.description.length > 80 ? '...' : '' }}
            </div>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="category" label="分类" width="120">
        <template #default="scope">
          <el-tag v-if="scope.row.category" type="info">
            {{ scope.row.category }}
          </el-tag>
          <span v-else class="text-muted">未分类</span>
        </template>
      </el-table-column>

      <el-table-column label="标签" width="150">
        <template #default="scope">
          <div class="tags-cell">
            <el-tag
              v-for="tag in scope.row.tags?.slice(0, 2)"
              :key="tag"
              size="small"
              class="tag-item"
            >
              {{ tag }}
            </el-tag>
            <span v-if="scope.row.tags?.length > 2" class="more-tags">
              +{{ scope.row.tags.length - 2 }}
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="scope.row.status === 'published' ? 'success' : 'warning'">
            {{ scope.row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="sort" label="排序" width="80" align="center">
        <template #default="scope">
          <span>{{ scope.row.sort || 0 }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="scope">
          {{ formatDate(scope.row.createdAt) }}
        </template>
      </el-table-column>

      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button link type="primary" @click="viewGallery(scope.row)">
            预览
          </el-button>
          <el-button link type="primary" @click="editGallery(scope.row)">
            编辑
          </el-button>
          <el-button link type="danger" @click="deleteGallery(scope.row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="currentGallery?.title"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="currentGallery" class="gallery-preview">
        <div class="gallery-info">
          <p><strong>分类：</strong>{{ currentGallery.category || '无' }}</p>
          <p><strong>标签：</strong>{{ currentGallery.tags?.join(', ') || '无' }}</p>
          <p><strong>描述：</strong>{{ currentGallery.description || '无描述' }}</p>
          <p><strong>图片数量：</strong>{{ currentGallery.images?.length || 0 }} 张</p>
        </div>
        
        <div class="image-gallery">
          <div 
            v-for="(image, index) in currentGallery.images" 
            :key="index"
            class="gallery-image-item"
          >
            <el-image
              :src="image.imageUrl"
              fit="cover"
              class="gallery-image"
              :preview-src-list="currentGallery.images.map(img => img.imageUrl)"
              :initial-index="index"
            />
            <div class="image-caption">
              <div class="image-title">{{ image.title || '无标题' }}</div>
              <div class="image-description">{{ image.description || '无描述' }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Picture } from '@element-plus/icons-vue'
import { api, type Gallery, type GalleryCategory } from '../../lib/api'

const router = useRouter()

// 响应式数据
const loading = ref(false)
const galleryItems = ref<Gallery[]>([])
const categories = ref<GalleryCategory[]>([])
const showPreviewDialog = ref(false)
const currentGallery = ref<Gallery | null>(null)

// 搜索表单
const searchForm = reactive({
  title: '',
  category: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

// 方法
const loadGalleryItems = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      title: searchForm.title || undefined,
      category: searchForm.category || undefined,
      status: searchForm.status || undefined
    }
    
    const response = await api.getGalleryItems(params)
    galleryItems.value = response.items || []
    pagination.total = response.total
  } catch (error) {
    console.error('加载图集失败:', error)
    ElMessage.error('加载图集失败')
  } finally {
    loading.value = false
  }
}

const loadCategories = async () => {
  try {
    const response = await api.getGalleryCategories()
    categories.value = response.filter(cat => cat.isEnabled)
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  loadGalleryItems()
}

const resetSearch = () => {
  Object.assign(searchForm, {
    title: '',
    category: '',
    status: ''
  })
  pagination.page = 1
  loadGalleryItems()
}

const handleSizeChange = (val: number) => {
  pagination.limit = val
  loadGalleryItems()
}

const handleCurrentChange = (val: number) => {
  pagination.page = val
  loadGalleryItems()
}

const createGallery = () => {
  router.push('/admin/gallery/create')
}

const editGallery = (gallery: Gallery) => {
  router.push(`/admin/gallery/edit/${gallery.id}`)
}

const viewGallery = (gallery: Gallery) => {
  currentGallery.value = gallery
  showPreviewDialog.value = true
}

const deleteGallery = async (gallery: Gallery) => {
  try {
    await ElMessageBox.confirm(
      `确认删除图集 "${gallery.title}"？此操作将删除图集中的所有图片。`,
      '删除确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await api.deleteGalleryItem(gallery.id)
    ElMessage.success('删除成功')
    loadGalleryItems()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  loadGalleryItems()
  loadCategories()
})
</script>

<style scoped>
.gallery-list {
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

.cover-preview {
  position: relative;
}

.preview-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
}

.image-count {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 24px;
  border-radius: 8px;
}

.title-cell .title {
  font-weight: 600;
  margin-bottom: 4px;
}

.title-cell .description {
  color: #666;
  font-size: 12px;
  line-height: 1.4;
}

.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tag-item {
  margin: 0;
}

.more-tags {
  color: #909399;
  font-size: 12px;
}

.text-muted {
  color: #909399;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.gallery-preview {
  max-height: 70vh;
  overflow-y: auto;
}

.gallery-info {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.gallery-info p {
  margin: 8px 0;
}

.image-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.gallery-image-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.gallery-image {
  width: 100%;
  height: 150px;
}

.image-caption {
  padding: 12px;
  background: white;
}

.image-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.image-description {
  color: #666;
  font-size: 14px;
}
</style> 