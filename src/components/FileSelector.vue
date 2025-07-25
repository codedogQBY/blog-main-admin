<!-- FileSelector.vue -->
<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="80%"
    class="file-selector-dialog"
    :z-index="2000"
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

      <!-- 操作区域 -->
      <div class="action-area">
        <!-- 上传按钮 -->
        <el-button type="primary" @click="showUploadDialog = true">
          <el-icon><Upload /></el-icon>
          上传文件
        </el-button>

        <!-- 新建文件夹按钮 -->
        <el-button @click="showCreateFolderDialog">
          <el-icon><FolderAdd /></el-icon>
          新建文件夹
        </el-button>

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
    </div>

    <!-- 上传进度展示 -->
    <div v-if="uploadingFiles.length > 0" class="upload-progress">
      <div v-for="file in uploadingFiles" :key="file.uid" class="upload-item">
        <div class="upload-info">
          <span class="filename">{{ file.name }}</span>
          <span class="progress">{{ file.percentage }}%</span>
        </div>
        <el-progress :percentage="file.percentage" />
      </div>
    </div>

    <!-- 文件列表区域 -->
    <div class="file-list-container">
      <!-- 文件夹列表 -->
      <div v-if="folders.length > 0" class="folder-grid">
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="folder-item"
          @click="navigateToFolder(folder.id)"
          @dblclick="handleFolderSelect(folder)"
        >
          <el-icon class="folder-icon"><Folder /></el-icon>
          <span class="folder-name">{{ folder.name }}</span>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="file-grid">
        <div
          v-for="file in files"
          :key="file.id"
          class="file-item"
          @click="handleFileSelect(file)"
        >
          <div class="file-preview">
            <img v-if="isImageFile(file)" :src="file.url" :alt="file.name" />
            <el-icon class="file-icon" v-else>
              <Document v-if="isDocumentFile(file)" />
              <VideoPlay v-else-if="isVideoFile(file)" />
              <Files v-else />
            </el-icon>
            <!-- 选中标记 -->
            <div class="file-check" v-show="selectedFileIds.includes(file.id)">
              <el-icon><Check /></el-icon>
            </div>
            <!-- 预览按钮 -->
            <div v-if="isImageFile(file)" class="preview-action">
              <el-button
                type="primary"
                circle
                size="small"
                class="preview-button"
                @click.stop="handlePreview(file)"
              >
                <el-icon class="preview-icon">
                  <ZoomIn />
                </el-icon>
              </el-button>
            </div>
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

      <!-- 空状态 -->
      <el-empty
        v-if="folders.length === 0 && files.length === 0"
        description="暂无文件"
      />

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
          layout="prev, pager, next"
        />
      </div>
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="selected-info" v-if="props.multiple">
          已选择 {{ selectedFileIds.length }} 个文件
        </div>
        <div class="action-buttons">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleConfirm">
            确认选择
          </el-button>
        </div>
      </div>
    </template>

    <!-- 图片预览 -->
    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewImageUrl]"
      :initial-index="0"
      @close="previewVisible = false"
    />

    <!-- 新建文件夹对话框 -->
    <el-dialog
      v-model="createFolderVisible"
      title="新建文件夹"
      width="30%"
      append-to-body
    >
      <el-form :model="folderForm" label-width="80px">
        <el-form-item label="文件夹名">
          <el-input 
            v-model="folderForm.name"
            placeholder="请输入文件夹名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createFolderVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateFolder">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 上传文件对话框 -->
    <el-dialog
      v-model="showUploadDialog"
      title="上传文件"
      width="500px"
      append-to-body
      @close="closeUploadDialog"
    >
      <div class="upload-dialog-content">
        <!-- 文件夹选择 -->
        <div class="upload-section">
          <label class="section-label">选择目标文件夹：</label>
          <el-select
            v-model="uploadTargetFolderId"
            placeholder="请选择文件夹（留空为根目录）"
            clearable
            class="folder-select"
          >
            <el-option label="根目录" :value="null" />
            <el-option
              v-for="folder in folders"
              :key="folder.id"
              :label="folder.name"
              :value="folder.id"
            />
          </el-select>
        </div>

        <!-- 文件上传区域 -->
        <div class="upload-section">
          <label class="section-label">选择文件：</label>
          <el-upload
            ref="uploadRef"
            class="upload-area"
            drag
            multiple
            :auto-upload="false"
            :show-file-list="true"
            accept="*/*"
            :on-change="handleFileChange"
            :on-remove="handleFileChange"
          >
            <div class="upload-content">
              <el-icon class="upload-icon"><Upload /></el-icon>
              <div class="upload-text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <div class="upload-tip">
                支持多文件上传，单个文件大小不超过 50MB
              </div>
            </div>
          </el-upload>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeUploadDialog">取消</el-button>
          <el-button
            type="primary"
            @click="submitUpload"
            :disabled="!uploadFileList.length"
          >
            开始上传
          </el-button>
        </div>
      </template>
    </el-dialog>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits, onMounted, withDefaults } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  HomeFilled, 
  Search, 
  FolderOpened,
  FolderAdd,
  Document, 
  Check, 
  Loading, 
  Picture,
  Refresh,
  ZoomIn,
  Upload,
  Folder,
  VideoPlay,
  Files
} from '@element-plus/icons-vue'
import { filesApi } from '../api/files'
import { useAuthStore } from '../lib/store'

export interface FileType {
  id: string
  name: string
  url: string
  size: number
  extension?: string
  createdAt: string
  folderId?: string | null
}

export interface FolderType {
  id: string
  name: string
  parentId: string | null
  fullPath?: string
}

// Props
export interface Props {
  modelValue?: string | string[] | FileType | FileType[] | null
  visible: boolean
  title?: string
  multiple?: boolean
  fileType?: 'all' | 'image' | 'document' | 'other'
  maxFiles?: number
  defaultFolderId?: string | null
  onSelect?: (files: FileType | FileType[]) => void
  onFolderSelect?: (folder: FolderType) => void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => '',
  visible: false,
  title: '选择文件',
  multiple: false,
  fileType: 'all',
  maxFiles: undefined,
  defaultFolderId: null,
  onSelect: undefined,
  onFolderSelect: undefined
})

// Emits
const emit = defineEmits([
  'update:modelValue',
  'select',
  'update:visible'
])

// 弹窗显示状态由外部visible控制
const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val)
})

// 响应式数据
const loading = ref(false)
const folders = ref<FolderType[]>([])
const files = ref<FileType[]>([])
const selectedFileIds = ref<string[]>([])
const currentFolderId = ref<string | null>(null)
const breadcrumbPath = ref<FolderType[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(8)
const total = ref(0)
const previewVisible = ref(false)
const previewImageUrl = ref('')

// 上传相关
const uploadRef = ref<any>()
const uploadingFiles = ref<Array<{
  uid: string
  name: string
  percentage: number
}>>([])
const showUploadDialog = ref(false)
const uploadTargetFolderId = ref<string | null>(null)
const uploadFileList = ref<any[]>([])

const authStore = useAuthStore()
const uploadUrl = `${import.meta.env.VITE_API_URL}/files/upload`
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('accessToken')}`
}))
const uploadData = computed(() => ({
  folderId: currentFolderId.value || undefined
}))

// 文件夹创建相关
const createFolderVisible = ref(false)
const folderForm = ref({
  name: ''
})

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
const isImage = (file: FileType) => {
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

const loadFolders = async (parentId: string | null = null) => {
  try {
    const response = await filesApi.getFolders({ parentId })
    folders.value = response.data || []
  } catch (error) {
    console.error('加载文件夹失败:', error)
    ElMessage.error('加载文件夹失败')
  }
}

const loadFiles = async (folderId: string | null = null) => {
  loading.value = true
  try {
    const response = await filesApi.getFiles({
      folderId,
      page: currentPage.value,
      pageSize: pageSize.value,
      search: searchQuery.value
    })
    files.value = response.data
    total.value = response.total
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
  selectedFileIds.value = []
  
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

const isFileSelected = (file: FileType) => {
  return selectedFileIds.value.some(f => f === file.id)
}

const toggleFileSelection = (file: FileType) => {
  if (!props.multiple) {
    selectedFileIds.value = [file.id]
    return
  }

  const index = selectedFileIds.value.findIndex(f => f === file.id)
  if (index > -1) {
    selectedFileIds.value.splice(index, 1)
  } else {
    if (props.maxFiles && selectedFileIds.value.length >= props.maxFiles) {
      ElMessage.warning(`最多只能选择 ${props.maxFiles} 个文件`)
      return
    }
    selectedFileIds.value.push(file.id)
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadFiles(currentFolderId.value)
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadFiles(currentFolderId.value)
}

const handleConfirm = () => {
  const selectedFiles = files.value.filter(file => selectedFileIds.value.includes(file.id))
  if (selectedFiles.length === 0) {
    ElMessage.warning('请选择文件')
    return
  }

  const result = props.multiple ? selectedFiles : selectedFiles[0]
  emit('update:modelValue', props.multiple ? selectedFiles.map(f => f.id) : selectedFiles[0].id)
  emit('select', result)
  // 移除 props.onSelect 的重复调用，只保留 emit('select')
  handleClose()
}

const handleClose = () => {
  dialogVisible.value = false
  selectedFileIds.value = []
  searchQuery.value = ''
  files.value = []
  currentPage.value = 1
  total.value = 0
  currentFolderId.value = null
  breadcrumbPath.value = []
}

// 监听对话框显示状态
watch(dialogVisible, (newValue) => {
  if (newValue) {
    // 重置状态并加载数据
    selectedFileIds.value = []
    currentFolderId.value = null
    breadcrumbPath.value = []
    currentPage.value = 1
    loadFolders(null)
    loadFiles(null)
  }
})

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

const handlePreview = (file: FileType) => {
  if (isImageFile(file)) {
    previewImageUrl.value = file.url
    previewVisible.value = true
  }
}

// 文件选择和上传
const handleFileChange = (file: any, fileList: any[]) => {
  console.log('File changed:', file, fileList)
  
  // 去重逻辑：只保留唯一的文件（基于 uid）
  const uniqueFiles = fileList.filter((file, index, self) => 
    index === self.findIndex(f => f.uid === file.uid)
  )
  
  uploadFileList.value = uniqueFiles
}

const submitUpload = async () => {
  if (!uploadFileList.value.length) {
    ElMessage.error('请选择要上传的文件')
    return
  }

  // 再次去重：基于文件名和大小
  const uniqueFiles = uploadFileList.value.filter((file, index, self) => 
    index === self.findIndex(f => 
      f.name === file.name && f.size === file.size
    )
  )

  // 显示确认对话框
  try {
    await ElMessageBox.confirm(
      `确定要上传 ${uniqueFiles.length} 个文件吗？`,
      '确认上传',
      { type: 'warning' }
    )
  } catch {
    return // 用户取消
  }

  const uploadPromises = uniqueFiles.map(async (fileInfo) => {
    try {
      // 添加到上传列表
      const uid = Math.random().toString(36).substring(2)
      uploadingFiles.value.push({
        uid,
        name: fileInfo.name,
        percentage: 0
      })

      // 上传文件
      const formData = new FormData()
      formData.append('file', fileInfo.raw)
      if (uploadTargetFolderId.value) {
        formData.append('folderId', uploadTargetFolderId.value)
      }

      const response = await filesApi.uploadFile(fileInfo.raw, uploadTargetFolderId.value)

      // 更新上传进度
      const uploadingFile = uploadingFiles.value.find(f => f.uid === uid)
      if (uploadingFile) {
        uploadingFile.percentage = 100
      }

      return response
    } catch (error) {
      console.error('上传文件失败:', error)
      ElMessage.error(`上传文件 ${fileInfo.name} 失败`)
      throw error
    }
  })

  try {
    await Promise.all(uploadPromises)
    ElMessage.success('文件上传成功')
    showUploadDialog.value = false
    uploadingFiles.value = []
    uploadFileList.value = []
    if (uploadRef.value) {
      uploadRef.value.clearFiles()
    }
    refreshFiles()
  } catch (error) {
    console.error('部分文件上传失败:', error)
  }
}

// 关闭上传对话框时清理状态
const closeUploadDialog = () => {
  showUploadDialog.value = false
  uploadingFiles.value = []
  uploadFileList.value = []
  if (uploadRef.value) {
    uploadRef.value.clearFiles()
  }
}

// 文件夹相关方法
const showCreateFolderDialog = () => {
  createFolderVisible.value = true
  folderForm.value.name = ''
}

const handleCreateFolder = async () => {
  if (!folderForm.value.name) {
    ElMessage.warning('请输入文件夹名称')
    return
  }

  try {
    await filesApi.createFolder({
      name: folderForm.value.name,
      parentId: currentFolderId.value
    })
    ElMessage.success('文件夹创建成功')
    createFolderVisible.value = false
    folderForm.value.name = ''
    await loadFolders(currentFolderId.value)
  } catch (error) {
    console.error('创建文件夹失败:', error)
    ElMessage.error('创建文件夹失败')
  }
}

// 文件类型判断
const isImageFile = (file: FileType) => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  return imageExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
}

const isDocumentFile = (file: FileType) => {
  const docExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt']
  return docExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
}

const isVideoFile = (file: FileType) => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov']
  return videoExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
}

// 文件选择相关
const handleFileSelect = (file: FileType) => {
  if (props.multiple) {
    const index = selectedFileIds.value.indexOf(file.id)
    if (index > -1) {
      selectedFileIds.value.splice(index, 1)
    } else {
      selectedFileIds.value.push(file.id)
    }
  } else {
    selectedFileIds.value = [file.id]
  }
}

const handleFolderSelect = (folder: FolderType) => {
  if (props.onFolderSelect) {
    props.onFolderSelect(folder)
  }
  handleClose()
}

// 初始化
onMounted(async () => {
  if (props.defaultFolderId) {
    await navigateToFolder(props.defaultFolderId)
  } else {
    await Promise.all([
      loadFolders(),
      loadFiles()
    ])
  }
})

// 监听搜索关键词变化
watch(searchQuery, () => {
  handleSearch()
})

// 监听当前页变化
watch(currentPage, () => {
  loadFiles(currentFolderId.value)
})

// 监听文件夹变化
watch(currentFolderId, () => {
  uploadTargetFolderId.value = currentFolderId.value
})

// 监听上传对话框关闭
watch(showUploadDialog, (newValue) => {
  if (!newValue) {
    closeUploadDialog()
  }
})
</script>

<script lang="ts">
// 添加默认导出
export default {
  name: 'FileSelector'
}
</script>

<style lang="scss" scoped>
.file-selector-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
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

.action-area {
  display: flex;
  align-items: center;
  gap: 12px;

  .search-box {
    display: flex;
    gap: 8px;
  }
}

.search-box {
  display: flex;
  gap: 16px;
  align-items: center;
}

.search-box .el-input {
  width: 300px;
}

.file-list-container {
  padding: 20px 40px;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.folder-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.folder-item {
  height: 72px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  background: #fff;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 6px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);
  }

  .folder-icon {
    font-size: 24px;
    color: #909399;
  }

  .folder-name {
    font-size: 12px;
    color: #606266;
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.2;
  }
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  margin: 0;
}

.file-item {
  position: relative;
  height: 220px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .preview-action {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }

    .file-preview::after {
      opacity: 1;
    }
  }
  
  .file-preview {
    position: relative;
    width: 100%;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 4px;
    background: #f5f7fa;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .file-icon {
      font-size: 48px;
      color: #909399;
    }

    // 选中打勾标记
    .file-check {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      background: var(--el-color-primary);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      z-index: 3;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    }
  }

  // 预览按钮
  .preview-action {
    position: absolute;
    top: 70px;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 3;

    .preview-button {
      width: 36px;
      height: 36px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--el-color-primary);
      border: none;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);

      &:hover {
        transform: scale(1.1);
        background: var(--el-color-primary-light-3);
      }

      .preview-icon {
        font-size: 20px;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }

  .file-info {
    padding: 12px;
    height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    .file-name {
      font-size: 14px;
      color: #606266;
      margin-bottom: 4px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: center;
    }

    .file-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #909399;
      padding: 0 4px;

      .file-size,
      .file-date {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.pagination-container {
  margin-top: auto;
  padding: 20px 0;
  display: flex;
  justify-content: center;
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

.upload-progress {
  margin: 12px 0;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 4px;

  .upload-item {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }

    .upload-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 14px;

      .filename {
        color: #666;
      }

      .progress {
        color: #409eff;
      }
    }
  }
}

.upload-dialog-content {
  .upload-section {
    margin-bottom: 20px;

    .section-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .folder-select {
      width: 100%;
    }
  }

  .upload-area {
    width: 100%;
    
    :deep(.el-upload) {
      width: 100%;
    }

    :deep(.el-upload-dragger) {
      width: 100%;
      height: 200px;
    }
  }

  .upload-content {
    padding: 20px;
    text-align: center;

    .upload-icon {
      font-size: 48px;
      color: #909399;
      margin-bottom: 12px;
    }

    .upload-text {
      font-size: 16px;
      color: #606266;
      margin-bottom: 8px;

      em {
        color: #409eff;
        font-style: normal;
      }
    }

    .upload-tip {
      font-size: 12px;
      color: #909399;
    }
  }
}

// 移除之前的预览对话框样式
.preview-dialog,
.preview-image {
  display: none;
}
</style> 