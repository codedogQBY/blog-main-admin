<template>
  <div class="file-selector">
    <div class="selector-header">
      <div class="breadcrumb">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item @click="navigateToFolder(null)">
            <el-icon><Folder /></el-icon>
            根目录
          </el-breadcrumb-item>
          <el-breadcrumb-item
            v-for="folder in breadcrumbPath"
            :key="folder.id"
            @click="navigateToFolder(folder.id)"
          >
            {{ folder.name }}
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="search-box">
        <el-input
          v-model="searchQuery"
          placeholder="搜索文件..."
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <div class="selector-body">
      <!-- 文件夹列表 -->
      <div v-if="folders.length > 0" class="folders-section">
        <h4>文件夹</h4>
        <div class="folders-grid">
          <div
            v-for="folder in folders"
            :key="folder.id"
            class="folder-item"
            @click="navigateToFolder(folder.id)"
          >
            <el-icon class="folder-icon"><Folder /></el-icon>
            <span class="folder-name">{{ folder.name }}</span>
            <span class="file-count">({{ folder._count?.files || 0 }})</span>
          </div>
        </div>
      </div>

      <!-- 图片文件列表 -->
      <div class="files-section">
        <h4>图片文件</h4>
        <div v-if="loading" class="loading-container">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>加载中...</span>
        </div>
        <div v-else-if="imageFiles.length === 0" class="empty-container">
          <el-icon><Picture /></el-icon>
          <span>当前文件夹没有图片文件</span>
        </div>
        <div v-else class="files-grid">
          <div
            v-for="file in imageFiles"
            :key="file.id"
            class="file-item"
            :class="{ selected: selectedFile?.id === file.id }"
            @click="selectFile(file)"
          >
            <div class="file-preview">
              <el-image
                :src="file.url"
                fit="cover"
                lazy
                :preview-src-list="[file.url]"
                :hide-on-click-modal="true"
              >
                <template #error>
                  <div class="image-error">
                    <el-icon><Picture /></el-icon>
                  </div>
                </template>
              </el-image>
            </div>
            <div class="file-info">
              <div class="file-name" :title="file.name">{{ file.name }}</div>
              <div class="file-meta">
                <span class="file-size">{{ formatFileSize(file.size) }}</span>
                <span class="file-date">{{ formatDate(file.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="selector-footer">
      <div class="selected-info">
        <template v-if="selectedFile">
          已选择: {{ selectedFile.name }} ({{ formatFileSize(selectedFile.size) }})
        </template>
        <template v-else>
          请选择一个图片文件
        </template>
      </div>
      <div class="action-buttons">
        <el-button @click="$emit('close')">取消</el-button>
        <el-button 
          type="primary" 
          :disabled="!selectedFile"
          @click="confirmSelect"
        >
          确认选择
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Folder, Search, Loading, Picture } from '@element-plus/icons-vue'
import { api } from '../../../lib/api'

// Props & Emits
const emit = defineEmits(['select', 'close'])

// 响应式数据
const loading = ref(false)
const folders = ref([])
const files = ref([])
const selectedFile = ref(null)
const currentFolderId = ref(null)
const breadcrumbPath = ref([])
const searchQuery = ref('')
let searchTimer: number | null = null

// 计算属性 - 只显示图片文件
const imageFiles = computed(() => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
  return files.value.filter(file => 
    imageExtensions.some(ext => 
      file.extension.toLowerCase() === ext ||
      file.name.toLowerCase().endsWith(ext)
    )
  )
})

// 方法
const loadFolders = async (parentId = null) => {
  try {
    const response = await api.getFolders(parentId)
    folders.value = response
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
      search: searchQuery.value || undefined
    }
    const response = await api.getFiles(params)
    files.value = response
  } catch (error) {
    console.error('加载文件失败:', error)
    ElMessage.error('加载文件失败')
  } finally {
    loading.value = false
  }
}

const navigateToFolder = async (folderId) => {
  currentFolderId.value = folderId
  selectedFile.value = null
  
  // 更新面包屑路径
  if (folderId === null) {
    breadcrumbPath.value = []
  } else {
    // 构建面包屑路径
    await buildBreadcrumbPath(folderId)
  }
  
  await Promise.all([
    loadFolders(folderId),
    loadFiles(folderId)
  ])
}

const buildBreadcrumbPath = async (folderId) => {
  try {
    const path = []
    let currentId = folderId
    
    while (currentId) {
      const folders = await api.getFolders()
      const folder = folders.find(f => f.id === currentId)
      if (folder) {
        path.unshift(folder)
        currentId = folder.parentId
      } else {
        break
      }
    }
    
    breadcrumbPath.value = path
  } catch (error) {
    console.error('构建路径失败:', error)
  }
}

const selectFile = (file) => {
  selectedFile.value = file
}

const confirmSelect = () => {
  if (selectedFile.value) {
    emit('select', selectedFile.value)
  }
}

const handleSearch = () => {
  // 防抖搜索
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    loadFiles(currentFolderId.value)
  }, 300)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('zh-CN')
}

// 监听搜索查询变化
watch(searchQuery, () => {
  if (!searchQuery.value) {
    loadFiles(currentFolderId.value)
  }
})

// 生命周期
onMounted(() => {
  navigateToFolder(null)
})
</script>

<style scoped>
.file-selector {
  height: 600px;
  display: flex;
  flex-direction: column;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-bottom: 1px solid #e4e7ed;
}

.breadcrumb {
  flex: 1;
}

.search-box {
  width: 300px;
}

.selector-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
}

.folders-section,
.files-section {
  margin-bottom: 24px;
}

.folders-section h4,
.files-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
}

.folders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.folder-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.folder-item:hover {
  border-color: #409eff;
  background-color: #ecf5ff;
}

.folder-icon {
  font-size: 18px;
  color: #ffa502;
  margin-right: 8px;
}

.folder-name {
  flex: 1;
  font-weight: 500;
}

.file-count {
  color: #909399;
  font-size: 12px;
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 16px;
}

.file-item {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.file-item:hover {
  border-color: #409eff;
}

.file-item.selected {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.file-preview {
  width: 100%;
  height: 120px;
  overflow: hidden;
}

.file-preview .el-image {
  width: 100%;
  height: 100%;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: #f5f7fa;
  color: #909399;
}

.file-info {
  padding: 8px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.loading-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #909399;
}

.loading-container .el-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.empty-container .el-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.selector-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #e4e7ed;
}

.selected-info {
  color: #606266;
  font-size: 14px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style> 