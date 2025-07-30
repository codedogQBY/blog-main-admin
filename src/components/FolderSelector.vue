<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="60%"
    class="folder-selector-dialog"
    :z-index="2000"
    @close="handleClose"
  >
    <!-- 工具栏 -->
    <div class="folder-selector-toolbar">
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
        <!-- 新建文件夹按钮 -->
        <el-button @click="showCreateFolderDialog">
          <el-icon><FolderAdd /></el-icon>
          新建文件夹
        </el-button>

        <!-- 刷新按钮 -->
        <el-button @click="refreshFolders" :loading="loading">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 文件夹列表区域 -->
    <div class="folder-list-container">
      <!-- 根目录选项 -->
      <div class="folder-grid">
        <div 
          class="folder-item" 
          :class="{ selected: selectedFolderId === null }"
          @click="handleFolderSelect(null)"
        >
          <el-icon class="folder-icon"><HomeFilled /></el-icon>
          <span class="folder-name">根目录</span>
          <div class="folder-check" v-show="selectedFolderId === null">
            <el-icon><Check /></el-icon>
          </div>
        </div>
        
        <!-- 文件夹列表 -->
        <div
          v-for="folder in folders"
          :key="folder.id"
          class="folder-item"
          :class="{ selected: selectedFolderId === folder.id }"
          @click="handleFolderSelect(folder.id)"
          @dblclick="navigateToFolder(folder.id)"
        >
          <el-icon class="folder-icon"><Folder /></el-icon>
          <span class="folder-name">{{ folder.name }}</span>
          <div class="folder-check" v-show="selectedFolderId === folder.id">
            <el-icon><Check /></el-icon>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <el-empty
        v-if="folders.length === 0"
        description="当前文件夹为空"
      />
    </div>

    <!-- 对话框底部按钮 -->
    <template #footer>
      <div class="dialog-footer">
        <div class="selected-info">
          已选择：{{ getSelectedFolderName() }}
        </div>
        <div class="action-buttons">
          <el-button @click="handleClose">取消</el-button>
          <el-button type="primary" @click="handleConfirm">
            确认选择
          </el-button>
        </div>
      </div>
    </template>

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
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, defineProps, defineEmits, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  HomeFilled, 
  FolderAdd,
  Check, 
  Refresh,
  Folder
} from '@element-plus/icons-vue'
import { filesApi } from '../api/files'

export interface FolderType {
  id: string
  name: string
  parentId: string | null
  fullPath?: string
}

// Props
export interface Props {
  visible: boolean
  title?: string
  defaultFolderId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  title: '选择文件夹',
  defaultFolderId: null
})

// Emits
const emit = defineEmits([
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
const selectedFolderId = ref<string | null>(null)
const currentFolderId = ref<string | null>(null)
const breadcrumbPath = ref<FolderType[]>([])

// 文件夹创建相关
const createFolderVisible = ref(false)
const folderForm = ref({
  name: ''
})

// 方法
const loadFolders = async (parentId: string | null = null) => {
  loading.value = true
  try {
    const response = await filesApi.getFolders({ parentId })
    folders.value = response.data || []
  } catch (error) {
    console.error('加载文件夹失败:', error)
    ElMessage.error('加载文件夹失败')
  } finally {
    loading.value = false
  }
}

const refreshFolders = async () => {
  await loadFolders(currentFolderId.value)
  ElMessage.success('文件夹列表已刷新')
}

const navigateToFolder = async (folderId: string | null) => {
  currentFolderId.value = folderId
  
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
  
  await loadFolders(folderId)
}

const handleFolderSelect = (folderId: string | null) => {
  selectedFolderId.value = folderId
}

const getSelectedFolderName = () => {
  if (selectedFolderId.value === null) {
    return '根目录'
  }
  
  const folder = folders.value.find(f => f.id === selectedFolderId.value)
  return folder?.name || '未知文件夹'
}

const handleConfirm = () => {
  const result = {
    id: selectedFolderId.value,
    name: getSelectedFolderName(),
    parentId: currentFolderId.value
  }
  
  emit('select', result)
  handleClose()
}

const handleClose = () => {
  dialogVisible.value = false
  selectedFolderId.value = null
  currentFolderId.value = null
  breadcrumbPath.value = []
}

// 监听对话框显示状态
watch(dialogVisible, (newValue) => {
  if (newValue) {
    // 重置状态并加载数据
    selectedFolderId.value = props.defaultFolderId || null
    currentFolderId.value = null
    breadcrumbPath.value = []
    loadFolders(null)
  }
})

// 文件夹创建相关方法
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

// 初始化
onMounted(async () => {
  await loadFolders()
})
</script>

<style lang="scss" scoped>
.folder-selector-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.folder-selector-toolbar {
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

.separator {
  margin: 0 4px;
  color: #909399;
}

.action-area {
  display: flex;
  align-items: center;
  gap: 12px;
}

.folder-list-container {
  padding: 20px 40px;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.folder-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}

.folder-item {
  position: relative;
  height: 120px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px 12px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);
  }

  &.selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    background: #f0f9ff;
  }

  .folder-icon {
    font-size: 32px;
    color: #909399;
  }

  .folder-name {
    font-size: 14px;
    color: #606266;
    text-align: center;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    line-height: 1.4;
  }

  .folder-check {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 20px;
    height: 20px;
    background: var(--el-color-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
  }
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
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>