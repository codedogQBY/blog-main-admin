<!-- FileSelector.vue -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="80%"
    class="file-selector-dialog"
    @close="handleClose"
  >
    <!-- 工具栏 -->
    <div class="file-selector-toolbar">
      <!-- 导航区域 -->
      <div class="navigation">
        <el-button @click="navigateToFolder(null)">
          <el-icon><HomeFilled /></el-icon>
          根目录
        </el-button>
        <div v-for="folder in breadcrumbPath" :key="folder.id">
          <span class="separator">/</span>
          <el-button @click="navigateToFolder(folder.id)">
            {{ folder.name }}
          </el-button>
        </div>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件..."
          @keyup.enter="handleSearch"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button @click="refreshFiles" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 文件浏览区域 -->
    <div class="file-browser">
      <!-- 文件夹列表 -->
      <div class="folders-list">
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="folder-item"
          @click="navigateToFolder(folder.id)"
        >
          <el-icon><FolderOpened /></el-icon>
          <span>{{ folder.name }}</span>
        </div>
      </div>

      <!-- 文件网格 -->
      <div class="files-grid">
        <div
          v-for="file in filteredFiles"
          :key="file.id"
          class="file-item"
          :class="{ selected: isFileSelected(file) }"
        >
          <!-- 预览图片 -->
          <div class="file-preview" @click="toggleFileSelection(file)">
            <el-image
              v-if="isImage(file)"
              :src="file.url"
              :alt="file.name"
              fit="cover"
              lazy
              :preview-src-list="[]"
              :initial-index="0"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
            <div v-else class="file-icon">
              <el-icon><Document /></el-icon>
            </div>
            <!-- 选中标记 -->
            <div class="file-check" v-show="isFileSelected(file)">
              <el-icon><Check /></el-icon>
            </div>
          </div>
          <!-- 文件信息 -->
          <div class="file-info">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-meta">
              <span class="file-size">{{ formatFileSize(file.size) }}</span>
              <span class="file-date">{{ formatDate(file.createdAt) }}</span>
            </div>
          </div>
          <!-- 预览按钮 -->
          <div class="file-actions">
            <el-button
              v-if="isImage(file)"
              type="text"
              size="small"
              @click="previewImage(file)"
            >
              <el-icon><ZoomIn /></el-icon>
              预览
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="filteredFiles.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">🖼️</div>
          <p>{{ searchQuery ? '暂无匹配的文件' : '暂无文件' }}</p>
        </div>
      </div>

      <!-- 加载中状态 -->
      <div v-if="loading" class="loading-overlay">
        <el-icon class="loading"><Loading /></el-icon>
      </div>
    </div>

    <!-- 分页 -->
    <div class="pagination-container">
      <el-pagination
        :current-page="pagination.page"
        :page-size="pagination.pageSize"
        :page-sizes="[12, 24, 36, 48]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handlePageChange"
        @update:current-page="(val) => pagination.page = val"
        @update:page-size="(val) => pagination.pageSize = val"
      />
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="selected-info" v-if="props.multiple">
          已选择 {{ selectedFiles.length }} 个文件
        </div>
        <div class="action-buttons">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleConfirm">
            确认选择
          </el-button>
        </div>
      </div>
    </template>

    <!-- 图片预览对话框 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewImageUrl]"
      :initial-index="0"
      @close="closePreview"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  HomeFilled, 
  Search, 
  FolderOpened, 
  Document, 
  Check, 
  Loading, 
  Picture,
  Refresh,
  ZoomIn
} from '@element-plus/icons-vue'
import { filesApi } from '../api/files'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '选择文件'
  },
  multiple: {
    type: Boolean,
    default: false
  },
  fileType: {
    type: String,
    default: 'all'
  },
  maxFiles: {
    type: Number,
    default: 20
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'select'])

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})
const loading = ref(false)
const folders = ref([])
const files = ref([])
const selectedFiles = ref([])
const currentFolderId = ref(null)
const breadcrumbPath = ref([])
const searchQuery = ref('')
const pagination = ref({
  page: 1,
  pageSize: 24,
  total: 0
})
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 计算属性
const filteredFiles = computed(() => {
  let result = files.value
  
  // 根据文件类型过滤
  if (props.fileType === 'image') {
    result = result.filter(file => isImage(file))
  } else if (props.fileType === 'document') {
    result = result.filter(file => !isImage(file))
  }
  
  return result
})

// 方法
const isImage = (file: any) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
  return imageExtensions.some(ext => 
    file.extension?.toLowerCase() === ext ||
    file.name.toLowerCase().endsWith(ext)
  )
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

const loadFolders = async (parentId = null) => {
  try {
    const response = await filesApi.getFolders({ parentId })
    folders.value = response.data || []
  } catch (error) {
    console.error('加载文件夹失败:', error)
    ElMessage.error('加载文件夹失败')
  }
}

const loadFiles = async (folderId = null) => {
  try {
    loading.value = true
    const params = {
      folderId,
      search: searchQuery.value || undefined,
      type: props.fileType === 'all' ? undefined : props.fileType as 'image' | 'document' | 'other',
      page: pagination.value.page,
      pageSize: pagination.value.pageSize
    }
    const response = await filesApi.getFiles(params)
    files.value = response.data || []
    pagination.value.total = response.total || 0
  } catch (error) {
    console.error('加载文件失败:', error)
    ElMessage.error('加载文件失败')
  } finally {
    loading.value = false
  }
}

const refreshFiles = async () => {
  await loadFiles(currentFolderId.value)
  ElMessage.success('文件列表已刷新')
}

const navigateToFolder = async (folderId: string | null) => {
  currentFolderId.value = folderId
  selectedFiles.value = []
  
  // 更新面包屑路径
  if (folderId === null) {
    breadcrumbPath.value = []
  } else {
    try {
      const response = await filesApi.getFolderBreadcrumb(folderId)
      breadcrumbPath.value = response || []
    } catch (error) {
      console.error('获取文件夹路径失败:', error)
      ElMessage.error('获取文件夹路径失败')
    }
  }
  
  await Promise.all([
    loadFolders(folderId),
    loadFiles(folderId)
  ])
}

const isFileSelected = (file: any) => {
  return selectedFiles.value.some(f => f.id === file.id)
}

const toggleFileSelection = (file: any) => {
  if (!props.multiple) {
    selectedFiles.value = [file]
    return
  }

  const index = selectedFiles.value.findIndex(f => f.id === file.id)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    if (props.maxFiles && selectedFiles.value.length >= props.maxFiles) {
      ElMessage.warning(`最多只能选择 ${props.maxFiles} 个文件`)
      return
    }
    selectedFiles.value.push(file)
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  loadFiles(currentFolderId.value)
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  loadFiles(currentFolderId.value)
}

const handleSizeChange = (size: number) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  loadFiles(currentFolderId.value)
}

const handleConfirm = () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请至少选择一个文件')
    return
  }
  emit('select', props.multiple ? selectedFiles.value : selectedFiles.value[0])
  handleClose()
}

const handleClose = () => {
  dialogVisible.value = false
  selectedFiles.value = []
  searchQuery.value = ''
  files.value = []
  pagination.value.page = 1
  pagination.value.total = 0
  currentFolderId.value = null
  breadcrumbPath.value = []
}

// 监听对话框显示状态
watch(dialogVisible, (newValue) => {
  if (newValue) {
    // 重置状态并加载数据
    selectedFiles.value = []
    currentFolderId.value = null
    breadcrumbPath.value = []
    pagination.value.page = 1
    loadFolders(null)
    loadFiles(null)
  }
})

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

const previewImage = (file: any) => {
  previewImageUrl.value = file.url
  previewVisible.value = true
}

const closePreview = () => {
  previewVisible.value = false
}
</script>

<script lang="ts">
// 添加默认导出
export default {
  name: 'FileSelector'
}
</script>

<style scoped>
.file-selector-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

.file-selector-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  margin-right: 0;
  border-bottom: none;
}

.file-selector-dialog :deep(.el-dialog__title) {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.file-selector-dialog :deep(.el-dialog__headerbtn) {
  top: 18px;
  right: 18px;
}

.file-selector-dialog :deep(.el-dialog__close) {
  color: white;
  font-size: 20px;
}

.file-selector-dialog :deep(.el-dialog__close:hover) {
  color: rgba(255, 255, 255, 0.8);
}

.file-selector-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.file-selector-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
}

.navigation {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.search-box {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-box .el-input {
  width: 300px;
}

.file-browser {
  position: relative;
  min-height: 400px;
  max-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  padding: 24px;
}

.folders-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  background: white;
}

.folder-item:hover {
  border-color: #667eea;
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.folder-item .el-icon {
  color: #667eea;
  font-size: 16px;
}

.files-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  overflow-y: auto;
  padding-right: 8px;
}

.files-grid::-webkit-scrollbar {
  width: 8px;
}

.files-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.files-grid::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.files-grid::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.file-item {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  background: white;
}

.file-preview {
  position: relative;
  width: 100%;
  height: 120px;
  overflow: hidden;
  cursor: pointer;
}

.file-preview:hover::before {
  opacity: 0.1;
}

.file-preview::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1;
  pointer-events: none;
}

.file-check {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: #409eff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 2;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.file-info {
  padding: 12px;
  background: white;
  position: relative;
  z-index: 2;
  cursor: default;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.loading {
  font-size: 24px;
  animation: rotate 1s linear infinite;
  color: #667eea;
}

.pagination-container {
  display: flex;
  justify-content: center;
  padding: 20px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.selected-info {
  color: #64748b;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.file-actions {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.file-item:hover .file-actions {
  opacity: 1;
}

.file-actions .el-button {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border: none;
  padding: 4px 8px;
  height: 24px;
  border-radius: 4px;
  color: #1e293b;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-actions .el-button:hover {
  background: white;
  color: #409eff;
}

.file-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
}

.file-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style> 