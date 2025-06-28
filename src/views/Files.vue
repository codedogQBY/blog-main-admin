<template>
  <div class="modern-file-manager">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <div class="page-title">
            <el-icon class="title-icon"><Folder /></el-icon>
            <h1>文件管理</h1>
          </div>
          <div class="page-subtitle">管理您的文件和文件夹</div>
        </div>
        <div class="header-actions">
          <el-button type="primary" @click="showUploadDialog = true" class="action-btn primary">
            <el-icon><Upload /></el-icon>
            上传文件
          </el-button>
          <el-button @click="showCreateFolderDialog = true" class="action-btn">
            <el-icon><FolderAdd /></el-icon>
            新建文件夹
          </el-button>
          <el-button @click="refreshFiles" class="action-btn">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </div>
    </div>

    <!-- 导航面包屑 -->
    <div class="navigation-section">
      <el-breadcrumb separator="/" class="modern-breadcrumb">
        <el-breadcrumb-item @click="navigateToFolder(null)" class="breadcrumb-item">
          <el-icon><House /></el-icon>
          <span>根目录</span>
        </el-breadcrumb-item>
        <el-breadcrumb-item 
          v-for="folder in breadcrumbPath" 
          :key="folder.id"
          @click="navigateToFolder(folder.id)"
          class="breadcrumb-item"
        >
          {{ folder.name }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar-section">
      <div class="toolbar-left">
        <div class="view-stats">
          <span class="stat-item">
            <el-icon><Folder /></el-icon>
            {{ filteredFolders.length }} 个文件夹
          </span>
          <span class="stat-item">
            <el-icon><Document /></el-icon>
            {{ filteredFiles.length }} 个文件
          </span>
        </div>
      </div>
      <div class="toolbar-right">
        <!-- 文件夹筛选 -->
        <el-select 
          v-model="currentFolderId" 
          placeholder="筛选文件夹"
          clearable
          class="filter-select"
          @change="navigateToFolder"
        >
          <el-option label="全部文件" :value="null" />
          <el-option 
            v-for="folder in flatFolderList" 
            :key="folder.id" 
            :label="folder.fullPath" 
            :value="folder.id"
          />
        </el-select>
        <!-- 搜索框 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索文件..."
          class="search-input"
          clearable
          @input="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-area">
      <!-- 文件夹网格 -->
      <div v-if="filteredFolders.length > 0" class="folders-section">
        <h3 class="section-title">
          <el-icon><Folder /></el-icon>
          文件夹
        </h3>
        <div class="folder-grid">
          <div 
            v-for="folder in filteredFolders" 
            :key="folder.id" 
            class="folder-card"
            @dblclick="navigateToFolder(folder.id)"
          >
            <div class="card-content">
              <div class="folder-icon">
                <el-icon><Folder /></el-icon>
              </div>
              <div class="folder-info">
                <div class="folder-name">{{ folder.name }}</div>
                <div class="folder-meta">
                  {{ folder._count?.files || 0 }} 个文件
                </div>
              </div>
            </div>
            <div class="card-actions">
              <el-dropdown trigger="click" @command="handleFolderAction">
                <el-button text class="action-trigger">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item :command="`edit-${folder.id}`">
                      <el-icon><Edit /></el-icon>重命名
                    </el-dropdown-item>
                    <el-dropdown-item :command="`delete-${folder.id}`" divided>
                      <el-icon><Delete /></el-icon>删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- 文件列表 -->
      <div v-if="filteredFiles.length > 0" class="files-section">
        <h3 class="section-title">
          <el-icon><Document /></el-icon>
          文件
        </h3>
        <div class="file-list">
          <div 
            v-for="file in filteredFiles" 
            :key="file.id" 
            class="file-item"
          >
            <div class="file-preview">
              <img 
                v-if="isImageFile(file.name)" 
                :src="file.url" 
                :alt="file.name"
                class="file-thumbnail"
              />
              <div v-else class="file-icon-wrapper">
                <el-icon v-if="isVideoFile(file.name)" class="file-icon video"><VideoPlay /></el-icon>
                <el-icon v-else class="file-icon document"><Document /></el-icon>
              </div>
            </div>
            <div class="file-details">
              <div class="file-name">{{ file.name }}</div>
              <div class="file-meta">
                <span class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(file.createdAt) }}
                </span>
                <span class="meta-item">
                  <el-icon><SetUp /></el-icon>
                  {{ formatFileSize(file.size) }}
                </span>
                <span v-if="file.uploader" class="meta-item">
                  <el-icon><User /></el-icon>
                  {{ file.uploader.name }}
                </span>
              </div>
            </div>
            <div class="file-actions">
              <el-button size="small" @click="previewFileHandler(file)" class="action-btn preview">
                <el-icon><View /></el-icon>
                预览
              </el-button>
              <el-button size="small" @click="downloadFile(file)" class="action-btn download">
                <el-icon><Download /></el-icon>
                下载
              </el-button>
              <el-button size="small" type="danger" @click="deleteFile(file.id)" class="action-btn delete">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="filteredFiles.length === 0 && filteredFolders.length === 0 && !loading" class="empty-state">
        <div class="empty-content">
          <div class="empty-icon">
            <el-icon><FolderOpened /></el-icon>
          </div>
          <h3>{{ searchKeyword ? '没有找到匹配的文件' : '当前文件夹为空' }}</h3>
          <p>{{ searchKeyword ? '尝试使用不同的关键词搜索' : '上传第一个文件开始使用' }}</p>
          <el-button v-if="!searchKeyword" type="primary" @click="showUploadDialog = true" class="empty-action">
            <el-icon><Upload /></el-icon>
            上传第一个文件
          </el-button>
        </div>
      </div>
    </div>

    <!-- 上传文件对话框 -->
    <el-dialog 
      v-model="showUploadDialog" 
      title="上传文件" 
      width="600px"
      @close="closeUploadDialog"
      class="upload-dialog"
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
              v-for="folder in flatFolderList" 
              :key="folder.id" 
              :label="folder.fullPath" 
              :value="folder.id"
            />
          </el-select>
        </div>

        <!-- 文件上传区域 -->
        <div class="upload-section">
          <label class="section-label">选择文件：</label>
          <el-upload
            ref="uploadRef"
            drag
            multiple
            :auto-upload="false"
            :on-change="handleFileChange"
            :show-file-list="true"
            accept="*/*"
            class="upload-area"
          >
            <div class="upload-content">
              <el-icon class="upload-icon"><UploadFilled /></el-icon>
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
          <el-button @click="closeUploadDialog" class="cancel-btn">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitUpload"
            :loading="uploading"
            :disabled="selectedFiles.length === 0"
            class="confirm-btn"
          >
            {{ uploading ? '上传中...' : '开始上传' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 新建文件夹对话框 -->
    <el-dialog 
      v-model="showCreateFolderDialog" 
      title="新建文件夹" 
      width="400px" 
      class="create-dialog"
      @close="resetCreateFolderForm"
    >
      <el-form :model="folderForm" label-width="80px">
        <el-form-item label="文件夹名" required>
          <el-input v-model="folderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeCreateFolderDialog">取消</el-button>
          <el-button type="primary" @click="createFolder">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 编辑文件夹对话框 -->
    <el-dialog 
      v-model="showEditFolderDialog" 
      title="编辑文件夹" 
      width="400px" 
      class="edit-dialog"
      @close="resetEditFolderForm"
    >
      <el-form :model="editFolderForm" label-width="80px">
        <el-form-item label="文件夹名" required>
          <el-input v-model="editFolderForm.name" placeholder="请输入文件夹名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeEditFolderDialog">取消</el-button>
          <el-button type="primary" @click="updateFolder">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 移动文件对话框 -->
    <el-dialog 
      v-model="showMoveFileDialog" 
      title="移动文件" 
      width="400px" 
      class="move-dialog"
      @close="resetMoveFileForm"
    >
      <el-form :model="moveFileForm" label-width="80px">
        <el-form-item label="目标文件夹">
          <el-tree-select
            v-model="moveFileForm.folderId"
            :data="folderTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="选择目标文件夹（留空为根目录）"
            clearable
            check-strictly
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeMoveFileDialog">取消</el-button>
          <el-button type="primary" @click="confirmMoveFile">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 文件预览对话框 -->
    <el-dialog 
      v-model="showPreviewDialog" 
      title="文件预览" 
      width="80%" 
      class="preview-dialog"
      @close="resetPreviewData"
    >
      <div class="preview-content">
        <img 
          v-if="previewFileData.type === 'image'" 
          :src="previewFileData.url" 
          class="preview-image"
        />
        <video 
          v-else-if="previewFileData.type === 'video'" 
          :src="previewFileData.url" 
          controls 
          class="preview-video"
        />
        <div v-else class="unsupported-preview">
          <el-icon class="unsupported-icon"><Document /></el-icon>
          <h3>不支持预览此文件类型</h3>
          <p>{{ previewFileData.name }}</p>
          <el-button type="primary" @click="downloadFile(previewFileData)" class="download-btn">
            <el-icon><Download /></el-icon>
            下载文件
          </el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Upload, 
  FolderAdd, 
  Refresh, 
  Folder, 
  Document, 
  UploadFilled,
  House,
  Edit,
  Delete,
  VideoPlay,
  Search,
  MoreFilled,
  Calendar,
  SetUp,
  User,
  View,
  Download,
  FolderOpened
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/lib/store'
import { fileApi } from '@/lib/api'

// 状态管理
const authStore = useAuthStore()
const loading = ref(false)
const files = ref([])
const folders = ref([])
const currentFolderId = ref<string | null>(null)
const searchKeyword = ref('')
const showUploadDialog = ref(false)
const showCreateFolderDialog = ref(false)
const showEditFolderDialog = ref(false)
const showMoveFileDialog = ref(false)
const showPreviewDialog = ref(false)
const uploadRef = ref()
const uploading = ref(false)
const selectedFiles = ref<File[]>([])
const uploadTargetFolderId = ref<string | null>(null)
const folderTree = ref([])
const breadcrumbPath = ref([])

// 表单数据
const folderForm = reactive({
  name: ''
})

const editFolderForm = reactive({
  id: '',
  name: ''
})

const moveFileForm = reactive({
  fileId: '',
  folderId: null
})

const previewFileData = ref({
  name: '',
  url: '',
  type: ''
})

// 计算属性 - 扁平化文件夹列表
const flatFolderList = computed(() => {
  const flatten = (folders: any[], prefix = '') => {
    const result = []
    for (const folder of folders) {
      const fullPath = prefix ? `${prefix}/${folder.name}` : folder.name
      result.push({
        ...folder,
        fullPath
      })
      if (folder.children && folder.children.length > 0) {
        result.push(...flatten(folder.children, fullPath))
      }
    }
    return result
  }
  return flatten(folderTree.value)
})

// 计算属性 - 过滤后的文件列表
const filteredFiles = computed(() => {
  if (!searchKeyword.value) return files.value
  return files.value.filter((file: any) => 
    file.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 计算属性 - 过滤后的文件夹列表
const filteredFolders = computed(() => {
  if (!searchKeyword.value) return folders.value
  return folders.value.filter((folder: any) => 
    folder.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 工具函数
const isImageFile = (filename: string) => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension && imageExtensions.includes(extension)
}

const isVideoFile = (filename: string) => {
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi']
  const extension = filename.split('.').pop()?.toLowerCase()
  return extension && videoExtensions.includes(extension)
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 数据获取
const refreshFiles = async () => {
  loading.value = true
  try {
    const [filesResponse, foldersResponse] = await Promise.all([
      fileApi.getFiles({ folderId: currentFolderId.value }),
      fileApi.getFolders(currentFolderId.value)
    ])
    
    files.value = filesResponse || []
    folders.value = foldersResponse || []
  } catch (error) {
    ElMessage.error('获取文件列表失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const loadFolderTree = async () => {
  try {
    const allFolders = await fileApi.getFolders()
    folderTree.value = buildFolderTree(allFolders)
  } catch (error) {
    console.error('加载文件夹树失败:', error)
  }
}

const buildFolderTree = (folders: any[], parentId: string | null = null): any[] => {
  return folders
    .filter(folder => folder.parentId === parentId)
    .map(folder => ({
      ...folder,
      children: buildFolderTree(folders, folder.id)
    }))
}

const loadBreadcrumbPath = async (folderId: string | null) => {
  breadcrumbPath.value = []
  if (!folderId) return
  
  try {
    // 递归获取父文件夹路径
    let currentId = folderId
    const path = []
    
    while (currentId) {
      const allFolders = await fileApi.getFolders()
      const folder = allFolders.find(f => f.id === currentId)
      if (folder) {
        path.unshift(folder)
        currentId = folder.parentId
      } else {
        break
      }
    }
    
    breadcrumbPath.value = path
  } catch (error) {
    console.error('加载面包屑路径失败:', error)
  }
}

// 导航
const navigateToFolder = async (folderId: string | null) => {
  currentFolderId.value = folderId
  await loadBreadcrumbPath(folderId)
  refreshFiles()
}

// 文件夹操作
const createFolder = async () => {
  if (!folderForm.name.trim()) {
    ElMessage.warning('请输入文件夹名称')
    return
  }

  try {
    await fileApi.createFolder({
      name: folderForm.name,
      parentId: currentFolderId.value
    })
    ElMessage.success('文件夹创建成功')
    closeCreateFolderDialog()
    refreshFiles()
    loadFolderTree()
  } catch (error) {
    ElMessage.error('创建文件夹失败')
    console.error(error)
  }
}

const editFolder = (folder: any) => {
  editFolderForm.id = folder.id
  editFolderForm.name = folder.name
  showEditFolderDialog.value = true
}

const updateFolder = async () => {
  if (!editFolderForm.name.trim()) {
    ElMessage.warning('请输入文件夹名称')
    return
  }

  try {
    await fileApi.updateFolder(editFolderForm.id, {
      name: editFolderForm.name
    })
    ElMessage.success('文件夹更新成功')
    closeEditFolderDialog()
    refreshFiles()
    loadFolderTree()
    loadBreadcrumbPath(currentFolderId.value)
  } catch (error) {
    ElMessage.error('更新文件夹失败')
    console.error(error)
  }
}

const deleteFolder = async (folder: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件夹 "${folder.name}" 吗？此操作将同时删除文件夹内的所有文件。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await fileApi.deleteFolder(folder.id)
    ElMessage.success('删除成功')
    refreshFiles()
    loadFolderTree()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

// 文件上传处理
const handleFileChange = (file: any, fileList: any[]) => {
  selectedFiles.value = fileList.map(item => item.raw).filter(Boolean)
}

const submitUpload = async () => {
  if (selectedFiles.value.length === 0) {
    ElMessage.warning('请选择要上传的文件')
    return
  }

  uploading.value = true
  let successCount = 0
  let failCount = 0

  try {
    for (const file of selectedFiles.value) {
      try {
        await fileApi.uploadFile(file, uploadTargetFolderId.value)
        successCount++
      } catch (error) {
        console.error('文件上传失败:', file.name, error)
        failCount++
      }
    }

    if (successCount > 0) {
      ElMessage.success(`成功上传 ${successCount} 个文件${failCount > 0 ? `，${failCount} 个失败` : ''}`)
      refreshFiles()
      loadFolderTree()
    }

    if (failCount > 0 && successCount === 0) {
      ElMessage.error('所有文件上传失败')
    }

    closeUploadDialog()
  } catch (error) {
    ElMessage.error('上传过程中发生错误')
    console.error(error)
  } finally {
    uploading.value = false
  }
}

// 关闭上传对话框并重置数据
const closeUploadDialog = () => {
  showUploadDialog.value = false
  selectedFiles.value = []
  uploadTargetFolderId.value = null
  uploading.value = false
}

// 重置创建文件夹表单
const resetCreateFolderForm = () => {
  folderForm.name = ''
}

// 关闭创建文件夹对话框
const closeCreateFolderDialog = () => {
  showCreateFolderDialog.value = false
  resetCreateFolderForm()
}

// 重置编辑文件夹表单
const resetEditFolderForm = () => {
  editFolderForm.id = ''
  editFolderForm.name = ''
}

// 关闭编辑文件夹对话框
const closeEditFolderDialog = () => {
  showEditFolderDialog.value = false
  resetEditFolderForm()
}

// 重置移动文件表单
const resetMoveFileForm = () => {
  moveFileForm.fileId = ''
  moveFileForm.folderId = null
}

// 关闭移动文件对话框
const closeMoveFileDialog = () => {
  showMoveFileDialog.value = false
  resetMoveFileForm()
}

// 重置预览数据
const resetPreviewData = () => {
  previewFileData.value = {
    name: '',
    url: '',
    type: ''
  }
}

const moveFile = (file: any) => {
  moveFileForm.fileId = file.id
  moveFileForm.folderId = file.folderId
  showMoveFileDialog.value = true
}

const confirmMoveFile = async () => {
  try {
    await fileApi.updateFile(moveFileForm.fileId, {
      folderId: moveFileForm.folderId
    })
    ElMessage.success('文件移动成功')
    closeMoveFileDialog()
    refreshFiles()
  } catch (error) {
    ElMessage.error('移动文件失败')
    console.error(error)
  }
}

const previewFileHandler = (file: any) => {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
  const videoExtensions = ['mp4', 'webm', 'ogg', 'mov']

  previewFileData.value = {
    ...file,
    type: imageExtensions.includes(extension) ? 'image' 
         : videoExtensions.includes(extension) ? 'video' 
         : 'other'
  }
  
  showPreviewDialog.value = true
}

const downloadFile = (file: any) => {
  const link = document.createElement('a')
  link.href = file.url
  link.download = file.name
  link.click()
}

const deleteFile = async (fileId: string) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除文件吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await fileApi.deleteFile(fileId)
    ElMessage.success('删除成功')
    refreshFiles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error(error)
    }
  }
}

const handleFolderAction = (command: string) => {
  const [action, folderId] = command.split('-')
  if (action === 'edit') {
    editFolder({ id: folderId, name: '' })
  } else if (action === 'delete') {
    deleteFolder(folderId)
  }
}

// 搜索处理
const handleSearch = () => {
  // 搜索是通过computed属性实现的，这里不需要额外处理
  // 可以添加防抖逻辑
}

// 生命周期
onMounted(() => {
  refreshFiles()
  loadFolderTree()
})
</script>

<style scoped lang="scss">
.modern-file-manager {
  background: #f8fafc;
  min-height: 100vh;
  padding: 0;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 40px;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto;
  }

  .header-left {
    .page-title {
      display: flex;
      align-items: center;
      margin-bottom: 8px;

      .title-icon {
        font-size: 32px;
        margin-right: 12px;
        color: rgba(255, 255, 255, 0.9);
      }

      h1 {
        margin: 0;
        font-size: 32px;
        font-weight: 700;
        color: white;
      }
    }

    .page-subtitle {
      color: rgba(255, 255, 255, 0.8);
      font-size: 16px;
      margin: 0;
    }
  }

  .header-actions {
    display: flex;
    gap: 12px;

    .action-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 600;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 2px solid rgba(255, 255, 255, 0.2);
      background: rgba(255, 255, 255, 0.1);
      color: white;
      backdrop-filter: blur(10px);

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.4);
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
      }

      &.primary {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);

        &:hover {
          background: white;
          color: #667eea;
          border-color: white;
        }
      }
    }
  }
}

.navigation-section {
  background: white;
  padding: 20px 40px;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  .modern-breadcrumb {
    max-width: 1400px;
    margin: 0 auto;

    :deep(.el-breadcrumb__item) {
      .breadcrumb-item {
        display: flex;
        align-items: center;
        gap: 6px;
        cursor: pointer;
        color: #64748b;
        transition: color 0.2s ease;

        &:hover {
          color: #667eea;
        }

        .el-icon {
          font-size: 16px;
        }
      }

      &:last-child .breadcrumb-item {
        color: #1e293b;
        font-weight: 600;
      }
    }
  }
}

.toolbar-section {
  background: white;
  padding: 20px 40px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .toolbar-left {
    .view-stats {
      display: flex;
      gap: 24px;

      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #64748b;
        font-size: 14px;
        font-weight: 500;

        .el-icon {
          color: #94a3b8;
          font-size: 16px;
        }
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: 16px;
    align-items: center;

    .filter-select,
    .search-input {
      width: 240px;

      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper) {
        border-radius: 10px;
        border: 1px solid #e2e8f0;
        transition: all 0.2s ease;

        &:hover {
          border-color: #667eea;
        }

        &.is-focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      }
    }
  }
}

.content-area {
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px;
  background: transparent;
  box-shadow: none;

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 24px 0;
    color: #1e293b;
    font-size: 20px;
    font-weight: 700;

    .el-icon {
      color: #667eea;
      font-size: 24px;
    }
  }

  .folders-section {
    margin-bottom: 48px;

    .folder-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;

      .folder-card {
        background: white;
        border-radius: 16px;
        padding: 24px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        border: 2px solid transparent;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
          border-radius: 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          transform: translateY(-8px);
          border-color: #667eea;
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);

          &::before {
            opacity: 1;
          }

          .card-actions {
            opacity: 1;
          }
        }

        .card-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          position: relative;
          z-index: 2;

          .folder-icon {
            width: 64px;
            height: 64px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);

            .el-icon {
              font-size: 32px;
              color: white;
            }
          }

          .folder-info {
            .folder-name {
              font-size: 16px;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 6px;
              line-height: 1.4;
            }

            .folder-meta {
              color: #64748b;
              font-size: 14px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;

              &::before {
                content: '📁';
                font-size: 12px;
              }
            }
          }
        }

        .card-actions {
          position: absolute;
          top: 16px;
          right: 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 3;

          .action-trigger {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #e2e8f0;
            color: #64748b;
            backdrop-filter: blur(10px);

            &:hover {
              background: white;
              color: #667eea;
              border-color: #667eea;
            }
          }
        }
      }
    }
  }

  .files-section {
    .file-list {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .file-item {
        background: white;
        border-radius: 16px;
        padding: 20px;
        display: flex;
        align-items: center;
        gap: 20px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        border: 2px solid transparent;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%);
          border-radius: 16px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        &:hover {
          transform: translateY(-4px);
          border-color: #667eea;
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15);

          &::before {
            opacity: 1;
          }

          .file-actions {
            opacity: 1;
          }
        }

        .file-preview {
          position: relative;
          width: 80px;
          height: 80px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          background: #f8fafc;
          border: 2px solid #e2e8f0;

          .file-thumbnail {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .file-icon-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);

            .file-icon {
              font-size: 32px;

              &.video {
                color: #10b981;
              }

              &.document {
                color: #6b7280;
              }
            }
          }
        }

        .file-details {
          flex: 1;
          min-width: 0;
          position: relative;
          z-index: 2;

          .file-name {
            font-size: 16px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 8px;
            word-break: break-all;
            line-height: 1.4;
          }

          .file-meta {
            display: flex;
            gap: 20px;
            font-size: 13px;
            color: #64748b;
            flex-wrap: wrap;

            .meta-item {
              display: flex;
              align-items: center;
              gap: 6px;

              .el-icon {
                font-size: 14px;
                color: #94a3b8;
              }
            }
          }
        }

        .file-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
          position: relative;
          z-index: 3;

          .action-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s ease;

            &.preview {
              background: #667eea;
              border-color: #667eea;
              color: white;

              &:hover {
                background: #5a67d8;
                transform: translateY(-1px);
              }
            }

            &.download {
              background: #10b981;
              border-color: #10b981;
              color: white;

              &:hover {
                background: #059669;
                transform: translateY(-1px);
              }
            }

            &.delete {
              background: #ef4444;
              border-color: #ef4444;
              color: white;

              &:hover {
                background: #dc2626;
                transform: translateY(-1px);
              }
            }
          }
        }
      }
    }
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    background: white;
    border-radius: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    .empty-content {
      text-align: center;

      .empty-icon {
        font-size: 80px;
        color: #94a3b8;
        margin-bottom: 24px;
        opacity: 0.6;
      }

      h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 600;
        color: #1e293b;
      }

      p {
        margin: 0 0 32px 0;
        font-size: 16px;
        color: #64748b;
        line-height: 1.6;
      }

      .empty-action {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        padding: 12px 24px;
        border-radius: 10px;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
        }
      }
    }
  }
}

/* 对话框样式 */
.upload-dialog,
.create-dialog,
.edit-dialog,
.move-dialog,
.preview-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 24px;
    border-bottom: none;

    .el-dialog__title {
      color: white;
      font-size: 18px;
      font-weight: 600;
    }

    .el-dialog__headerbtn {
      .el-dialog__close {
        color: white;
        font-size: 20px;

        &:hover {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }

  :deep(.el-dialog__body) {
    padding: 32px;
    background: #f8fafc;
  }
}

.upload-dialog-content {
  .upload-section {
    margin-bottom: 24px;

    .section-label {
      display: block;
      margin-bottom: 12px;
      font-weight: 600;
      color: #374151;
      font-size: 15px;
    }

    .folder-select {
      width: 100%;

      :deep(.el-select__wrapper) {
        border-radius: 10px;
        border: 1px solid #d1d5db;
        transition: all 0.2s ease;

        &:hover {
          border-color: #667eea;
        }

        &.is-focus {
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      }
    }

    .upload-area {
      border: 2px dashed #d1d5db;
      border-radius: 12px;
      padding: 48px;
      text-align: center;
      transition: all 0.3s ease;
      background: white;

      &:hover {
        border-color: #667eea;
        background: #f8fafc;
      }

      .upload-content {
        display: flex;
        flex-direction: column;
        align-items: center;

        .upload-icon {
          font-size: 64px;
          color: #94a3b8;
          margin-bottom: 20px;
        }

        .upload-text {
          font-size: 18px;
          color: #374151;
          margin-bottom: 8px;
          font-weight: 500;

          em {
            color: #667eea;
            font-style: normal;
            font-weight: 600;
          }
        }

        .upload-tip {
          color: #6b7280;
          font-size: 14px;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  background: white;
  border-top: 1px solid #e2e8f0;

  .cancel-btn,
  .confirm-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.2s ease;
  }

  .cancel-btn {
    background: #f3f4f6;
    border-color: #d1d5db;
    color: #6b7280;

    &:hover {
      background: #e5e7eb;
      border-color: #9ca3af;
      color: #374151;
    }
  }

  .confirm-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    color: white;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }

    &:disabled {
      background: #d1d5db;
      color: #9ca3af;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
}

.preview-content {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 12px;

  .preview-image,
  .preview-video {
    max-width: 100%;
    max-height: 500px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .unsupported-preview {
    padding: 60px 20px;
    color: #64748b;

    .unsupported-icon {
      font-size: 80px;
      margin-bottom: 20px;
      color: #94a3b8;
      opacity: 0.6;
    }

    h3 {
      margin: 0 0 12px 0;
      font-size: 20px;
      font-weight: 600;
      color: #1e293b;
    }

    p {
      margin: 0 0 24px 0;
      font-size: 16px;
      color: #64748b;
    }

    .download-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      padding: 12px 24px;
      border-radius: 10px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-area {
    padding: 32px;

    .folders-section .folder-grid {
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 24px 20px;

    .header-content {
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }

    .header-actions {
      flex-wrap: wrap;
      justify-content: center;
    }
  }

  .navigation-section,
  .toolbar-section {
    padding: 16px 20px;
  }

  .toolbar-section {
    flex-direction: column;
    gap: 16px;

    .toolbar-right {
      width: 100%;
      justify-content: center;
      flex-wrap: wrap;

      .filter-select,
      .search-input {
        width: 100%;
        max-width: 300px;
      }
    }
  }

  .content-area {
    padding: 20px;

    .folders-section .folder-grid {
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;
    }

    .files-section .file-list .file-item {
      flex-direction: column;
      text-align: center;
      gap: 16px;

      .file-actions {
        opacity: 1;
        justify-content: center;
        flex-wrap: wrap;
      }
    }
  }
}
</style> 