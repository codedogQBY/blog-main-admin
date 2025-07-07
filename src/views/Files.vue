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
          <PermissionCheck permission="file.create">
            <el-button type="primary" @click="showUploadDialog = true" class="action-btn primary">
              <el-icon><Upload /></el-icon>
              上传文件
            </el-button>
          </PermissionCheck>
          <PermissionCheck permission="file.create">
            <el-button @click="showCreateFolderDialog = true" class="action-btn">
              <el-icon><FolderAdd /></el-icon>
              新建文件夹
            </el-button>
          </PermissionCheck>
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
          <el-option label="全部文件" value="" />
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
                    <PermissionCheck permission="file.update">
                      <el-dropdown-item :command="`edit-${folder.id}`">
                        <el-icon><Edit /></el-icon>重命名
                      </el-dropdown-item>
                    </PermissionCheck>
                    <PermissionCheck permission="file.delete">
                      <el-dropdown-item :command="`delete-${folder.id}`" divided>
                        <el-icon><Delete /></el-icon>删除
                      </el-dropdown-item>
                    </PermissionCheck>
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
        <div class="file-grid">
          <div 
            v-for="file in filteredFiles" 
            :key="file.id" 
            class="file-card"
            :class="{ 'is-image': isImageFile(file.name) }"
          >
            <div class="card-content" @click="previewFileHandler(file)">
              <div class="file-preview">
                <img 
                  v-if="isImageFile(file.name)" 
                  :src="file.url" 
                  :alt="file.name"
                  class="file-thumbnail"
                />
                <div v-else class="file-icon">
                  <el-icon v-if="isVideoFile(file.name)"><VideoPlay /></el-icon>
                  <el-icon v-else><Document /></el-icon>
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
            <div class="card-actions">
              <el-dropdown trigger="click">
                <el-button text class="action-trigger">
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <PermissionCheck permission="file.read">
                      <el-dropdown-item @click="previewFileHandler(file)">
                        <el-icon><View /></el-icon>预览
                      </el-dropdown-item>
                      <el-dropdown-item @click="downloadFile(file)">
                        <el-icon><Download /></el-icon>下载
                      </el-dropdown-item>
                    </PermissionCheck>
                    <PermissionCheck permission="file.update">
                      <el-dropdown-item @click="moveFile(file)">
                        <el-icon><FolderOpened /></el-icon>移动
                      </el-dropdown-item>
                    </PermissionCheck>
                    <PermissionCheck permission="file.delete">
                      <el-dropdown-item @click="deleteFile(file.id)" divided>
                        <el-icon><Delete /></el-icon>删除
                      </el-dropdown-item>
                    </PermissionCheck>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
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

      <!-- 在文件列表底部添加分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model="pagination.page"
          :page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
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
      width="500px" 
      class="move-dialog"
      @close="closeMoveFileDialog"
    >
      <div class="move-file-form">
        <p class="file-name">文件名：{{ moveFileForm.fileName }}</p>
        <el-form label-width="100px">
          <el-form-item label="目标文件夹">
            <el-select
              v-model="moveFileForm.targetFolderId"
              placeholder="选择目标文件夹"
              clearable
              class="w-full"
            >
              <el-option label="根目录" value="" />
              <el-option
                v-for="folder in flatFolderList"
                :key="folder.id"
                :label="folder.fullPath"
                :value="folder.id"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeMoveFileDialog">取消</el-button>
          <el-button type="primary" @click="confirmMoveFile">确认</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 文件预览对话框 -->
    <el-dialog
      v-model="showPreviewDialog"
      :title="previewFile?.name"
      class="preview-dialog"
      :close-on-click-modal="true"
      :show-close="true"
      @close="closePreviewDialog"
    >
      <div class="preview-content">
        <!-- 图片预览 -->
        <template v-if="isImageFile(previewFile?.name)">
          <img
            :src="previewFile?.url"
            :alt="previewFile?.name"
            class="preview-image"
            @load="handleImageLoad"
          />
        </template>

        <!-- 视频预览 -->
        <template v-else-if="isVideoFile(previewFile?.name)">
          <video
            :src="previewFile?.url"
            class="preview-video"
            controls
            autoplay
          ></video>
        </template>

        <!-- 文本预览 -->
        <template v-else-if="isTextFile(previewFile?.name)">
          <pre class="preview-text">{{ previewFileContent }}</pre>
        </template>

        <!-- 不支持的文件类型 -->
        <template v-else>
          <div class="unsupported-preview">
            <el-icon><Document /></el-icon>
            <div class="unsupported-text">暂不支持预览此类型的文件</div>
            <div class="file-info">
              文件类型: {{ getFileExtension(previewFile?.name) || '未知' }}<br>
              文件大小: {{ formatFileSize(previewFile?.size) }}
            </div>
            <el-button type="primary" @click="downloadFile(previewFile)">
              下载文件
            </el-button>
          </div>
        </template>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
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
import { filesApi as fileApi } from '@/api/files'
import PermissionCheck from '@/components/PermissionCheck.vue'

// 状态管理
const authStore = useAuthStore()
const loading = ref(false)
const files = ref<any[]>([])
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
const folderTree = ref<any[]>([])
const breadcrumbPath = ref<any[]>([])
const fileCurrentPage = ref(1)
const folderCurrentPage = ref(1)
const previewFile = ref<any>(null)
const previewFileContent = ref('')

// 分页相关
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
})

// 表单数据
const folderForm = reactive({
  name: ''
})

const editFolderForm = reactive({
  id: '',
  name: ''
})

const moveFileForm = ref({
  fileId: '',
  fileName: '',
  targetFolderId: null as string | null
})

// 计算属性 - 扁平化文件夹列表
const flatFolderList = ref<any[]>([])

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
const isImageFile = (filename?: string) => {
  if (!filename) return false
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
  return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

const isVideoFile = (filename?: string) => {
  if (!filename) return false
  const videoExtensions = ['.mp4', '.webm', '.ogg']
  return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

const isTextFile = (filename?: string) => {
  if (!filename) return false
  const textExtensions = ['.txt', '.md', '.json', '.js', '.ts', '.html', '.css', '.scss', '.vue', '.jsx', '.tsx']
  return textExtensions.some(ext => filename.toLowerCase().endsWith(ext))
}

const getFileExtension = (filename?: string) => {
  if (!filename) return ''
  const parts = filename.split('.')
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : ''
}

const formatFileSize = (size?: number) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(2)} ${units[index]}`
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

// 数据获取
const refreshFiles = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      search: searchKeyword.value,
      folderId: currentFolderId.value
    }
    
    const [filesResponse, foldersResponse] = await Promise.all([
      fileApi.getFiles(params),
      fileApi.getFolders({ ...params, parentId: currentFolderId.value })
    ])

    // 更新文件列表
    files.value = filesResponse.data || []
    pagination.value = {
      page: filesResponse.page,
      pageSize: filesResponse.pageSize,
      total: filesResponse.total,
      totalPages: filesResponse.totalPages
    }

    // 更新当前文件夹的子文件夹
    folders.value = foldersResponse.data || []
  } catch (error) {
    console.error('加载文件列表失败:', error)
    files.value = []
    folders.value = []
  } finally {
    loading.value = false
  }
}

const loadFolderTree = async () => {
  try {
    const data = await fileApi.getFolderTree()
    if (Array.isArray(data)) {
      folderTree.value = data
      // 构建扁平化的文件夹列表，用于选择器
      const flattenFolders = (folders: any[], parentPath = '') => {
        return folders.reduce((acc: any[], folder) => {
          const fullPath = parentPath ? `${parentPath}/${folder.name}` : folder.name
          acc.push({ ...folder, fullPath })
          if (folder.children && folder.children.length > 0) {
            acc.push(...flattenFolders(folder.children, fullPath))
          }
          return acc
        }, [])
      }
      flatFolderList.value = flattenFolders(data)
    } else {
      console.error('获取到的文件夹数据格式不正确:', data)
      folderTree.value = []
      flatFolderList.value = []
    }
  } catch (error) {
    console.error('加载文件夹树失败:', error)
    folderTree.value = []
    flatFolderList.value = []
  }
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
  currentFolderId.value = folderId === '' ? null : folderId
  await loadBreadcrumbPath(currentFolderId.value)
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
  moveFileForm.value = {
    fileId: '',
    fileName: '',
    targetFolderId: null
  }
}

// 关闭移动文件对话框
const closeMoveFileDialog = () => {
  showMoveFileDialog.value = false
  resetMoveFileForm()
}

// 重置预览数据
const resetPreviewData = () => {
  previewFile.value = null
  previewFileContent.value = ''
}

const moveFile = (file: any) => {
  moveFileForm.value = {
    fileId: file.id,
    fileName: file.name,
    targetFolderId: file.folderId
  }
  showMoveFileDialog.value = true
}

const confirmMoveFile = async () => {
  try {
    await fileApi.updateFile(moveFileForm.value.fileId, {
      folderId: moveFileForm.value.targetFolderId
    })
    ElMessage.success('文件移动成功')
    showMoveFileDialog.value = false
    refreshFiles()
  } catch (error) {
    console.error('移动文件失败:', error)
    ElMessage.error('移动文件失败')
  }
}

const previewFileHandler = async (file: any) => {
  previewFile.value = file
  showPreviewDialog.value = true

  // 如果是文本文件，尝试获取内容
  if (isTextFile(file.name)) {
    try {
      const response = await fetch(file.url)
      previewFileContent.value = await response.text()
    } catch (error) {
      console.error('Failed to load text file:', error)
      previewFileContent.value = '无法加载文件内容'
    }
  }
}

const closePreviewDialog = () => {
  showPreviewDialog.value = false
  previewFile.value = null
  previewFileContent.value = ''
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

// 处理分页变化
const handlePageChange = (newPage: number) => {
  pagination.value.page = newPage
  refreshFiles()
}

const handleSizeChange = (newSize: number) => {
  pagination.value.pageSize = newSize
  pagination.value.page = 1
  refreshFiles()
}

// 监听
watch(() => [currentFolderId.value, searchKeyword.value], () => {
  fileCurrentPage.value = 1
  folderCurrentPage.value = 1
  refreshFiles()
})

// 生命周期
onMounted(() => {
  navigateToFolder(null)
  loadFolderTree()
})

const handleImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  if (img.naturalWidth < img.width || img.naturalHeight < img.height) {
    img.style.boxShadow = 'none'
    img.style.border = '1px solid #e4e7ed'
  }
}
</script>

<style scoped lang="scss">
.modern-file-manager {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.page-header {
  margin-bottom: 24px;
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  .page-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;

    h1 {
      font-size: 24px;
      margin: 0;
      font-weight: 600;
      color: #1a1a1a;
    }

    .title-icon {
      font-size: 24px;
      color: #409eff;
    }
  }

  .page-subtitle {
    color: #666;
    font-size: 14px;
  }
}

.header-actions {
  display: flex;
  gap: 12px;

  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}

.navigation-section {
  margin-bottom: 16px;
  padding: 12px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.toolbar-section {
  margin-bottom: 16px;
  padding: 12px 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left {
  .view-stats {
    display: flex;
    gap: 16px;
    
    .stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;
      
      .el-icon {
        color: #409eff;
      }
    }
  }
}

.toolbar-right {
  display: flex;
  gap: 12px;
  
  .filter-select {
    width: 200px;
  }
  
  .search-input {
    width: 240px;
  }
}

.content-area {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  padding: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 16px;
  font-size: 16px;
  font-weight: 500;
  color: #1a1a1a;

  .el-icon {
    color: #409eff;
  }
}

.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.folder-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid #e4e7ed;

  &:hover {
    background: #f0f2f5;
    transform: translateY(-2px);
  }

  .card-content {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;

    .folder-icon {
      font-size: 24px;
      color: #409eff;
      flex-shrink: 0;
    }

    .folder-info {
      min-width: 0;

      .folder-name {
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .folder-meta {
        font-size: 12px;
        color: #666;
      }
    }
  }
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.file-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-image .file-preview {
    height: 140px;
    padding: 0;
    background: #f5f7fa;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .card-content {
    cursor: pointer;

    .file-preview {
      height: 100px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      background: #f8f9fa;

      .file-icon {
        font-size: 32px;
        color: #409eff;
      }

      img.file-thumbnail {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }

    .file-info {
      padding: 12px;

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-meta {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;

        .file-size {
          color: #409eff;
        }
      }
    }
  }

  .card-actions {
    border-top: 1px solid #e4e7ed;
    padding: 8px;
    display: flex;
    justify-content: flex-end;

    .action-trigger {
      padding: 4px 8px;
    }
  }
}

.pagination-container {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
  display: flex;
  justify-content: center;
}

.move-file-form {
  padding: 20px;
}

.file-name {
  margin-bottom: 20px;
  font-weight: 500;
  color: #1a1a1a;
}

.w-full {
  width: 100%;
}

.modern-breadcrumb {
  :deep(.breadcrumb-item) {
    cursor: pointer;
    color: #409eff;
    
    &:hover {
      color: #66b1ff;
    }
  }
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;

  .empty-content {
    max-width: 400px;
    margin: 0 auto;
  }

  .empty-icon {
    margin-bottom: 20px;
    
    .el-icon {
      font-size: 64px;
      color: #c0c4cc;
    }
  }

  h3 {
    font-size: 18px;
    font-weight: 500;
    color: #303133;
    margin: 0 0 12px 0;
    line-height: 1.4;
  }

  p {
    font-size: 14px;
    color: #909399;
    margin: 0 0 24px 0;
    line-height: 1.5;
  }

  .empty-action {
    .el-icon {
      margin-right: 8px;
    }
  }
}

.preview-dialog {
  :deep(.el-dialog) {
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    margin: 0 !important;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  :deep(.el-dialog__body) {
    flex: 1;
    overflow: auto;
    padding: 0;
  }

  .preview-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    padding: 20px;
    background: #f8f9fa;

    .preview-image {
      max-width: 100%;
      max-height: calc(90vh - 120px);
      object-fit: contain;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .preview-video {
      max-width: 100%;
      max-height: calc(90vh - 120px);
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .preview-text {
      width: 100%;
      max-height: calc(90vh - 120px);
      overflow: auto;
      padding: 20px;
      background: #fff;
      border-radius: 4px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      font-family: monospace;
      white-space: pre-wrap;
      word-break: break-all;
    }

    .unsupported-preview {
      text-align: center;
      padding: 40px 20px;

      .el-icon {
        font-size: 48px;
        color: #909399;
        margin-bottom: 16px;
      }

      .unsupported-text {
        color: #606266;
        margin-bottom: 20px;
      }

      .file-info {
        color: #909399;
        font-size: 14px;
        margin-bottom: 20px;
      }
    }
  }
}
</style> 