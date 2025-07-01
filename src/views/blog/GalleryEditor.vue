<template>
  <div class="gallery-editor">
    <!-- 头部操作栏 -->
    <div class="editor-header">
      <div class="header-left">
        <el-button @click="goBack" icon="ArrowLeft">返回列表</el-button>
        <h1>{{ isEditing ? '编辑图集' : '新建图集' }}</h1>
      </div>
      <div class="header-right">
        <el-button @click="handlePreview" :disabled="!formData.title">预览</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ isEditing ? '更新' : '发布' }}
        </el-button>
      </div>
    </div>

    <!-- 编辑器内容 -->
    <div class="editor-content">
      <el-row :gutter="24">
        <!-- 左侧编辑区 -->
        <el-col :span="16">
          <div class="edit-section">
            <!-- 基本信息 -->
            <el-card class="section-card">
              <template #header>
                <span class="section-title">基本信息</span>
              </template>
              
              <el-form :model="formData" :rules="formRules" ref="formRef" label-width="80px">
                <el-form-item label="图集标题" prop="title">
                  <el-input 
                    v-model="formData.title" 
                    placeholder="请输入图集标题"
                    maxlength="100"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="图集描述" prop="description">
                  <el-input
                    v-model="formData.description"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入图集描述"
                    maxlength="500"
                    show-word-limit
                  />
                </el-form-item>

                <el-form-item label="分类">
                  <el-select
                    v-model="formData.category"
                    placeholder="选择分类"
                    filterable
                    allow-create
                    clearable
                    style="width: 200px"
                  >
                    <el-option
                      v-for="category in categories"
                      :key="category.name"
                      :label="category.name"
                      :value="category.name"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="标签">
                  <div class="tag-input-container">
                    <el-tag
                      v-for="tag in formData.tags"
                      :key="tag"
                      closable
                      @close="removeTag(tag)"
                      class="tag-item"
                    >
                      {{ tag }}
                    </el-tag>
                    <el-input
                      v-if="tagInputVisible"
                      ref="tagInputRef"
                      v-model="tagInputValue"
                      class="tag-input"
                      size="small"
                      @keyup.enter="addTag"
                      @blur="addTag"
                    />
                    <el-button v-else class="tag-add-btn" size="small" @click="showTagInput">
                      + 添加标签
                    </el-button>
                  </div>
                </el-form-item>
              </el-form>
            </el-card>

            <!-- 图片管理 -->
            <el-card class="section-card">
              <template #header>
                <div class="section-header">
                  <span class="section-title">图片管理</span>
                  <div class="section-actions">
                    <el-button type="primary" @click="addImages">
                      <el-icon><Plus /></el-icon>
                      添加图片
                    </el-button>
                  </div>
                </div>
              </template>

              <!-- 已选择的图片预览 -->
              <div v-if="formData.images.length > 0" class="images-preview">
                <div
                  v-for="(image, index) in formData.images"
                  :key="index"
                  class="image-item"
                  :class="{ 'is-cover': index === coverImageIndex }"
                >
                  <div class="image-preview">
                    <el-image
                      :src="image.imageUrl"
                      fit="cover"
                      class="preview-image"
                    >
                      <template #error>
                        <div class="image-error">
                          <el-icon><Picture /></el-icon>
                          <div>加载失败</div>
                        </div>
                      </template>
                    </el-image>
                    
                    <!-- 封面标识 -->
                    <div v-if="index === coverImageIndex" class="cover-badge">
                      <el-icon><Star /></el-icon>
                      封面
                    </div>
                    
                    <!-- 操作按钮 -->
                    <div class="image-actions">
                      <el-button-group>
                        <el-button 
                          size="small" 
                          type="primary" 
                          :disabled="index === coverImageIndex"
                          @click="setCoverImage(index)"
                        >
                          <el-icon><Star /></el-icon>
                        </el-button>
                        <el-button size="small" @click="editImage(index)">
                          <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button 
                          size="small" 
                          type="danger"
                          @click="removeImage(index)"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </el-button-group>
                    </div>
                  </div>
                  
                  <div class="image-info">
                    <div class="image-title">{{ image.title || '未命名' }}</div>
                    <div class="image-description">{{ image.description || '无描述' }}</div>
                  </div>
                </div>
              </div>
              
              <div v-else class="empty-images">
                <el-icon class="empty-icon"><Picture /></el-icon>
                <div class="empty-text">还没有添加任何图片</div>
                <div class="empty-hint">点击上方按钮添加图片</div>
              </div>
            </el-card>
          </div>
        </el-col>

        <!-- 右侧设置区 -->
        <el-col :span="8">
          <div class="settings-section">
            <!-- 发布设置 -->
            <el-card class="section-card">
              <template #header>
                <span class="section-title">发布设置</span>
              </template>
              
              <div class="setting-item">
                <label>状态</label>
                <el-radio-group v-model="formData.status" size="small">
                  <el-radio-button value="published">已发布</el-radio-button>
                  <el-radio-button value="draft">草稿</el-radio-button>
                </el-radio-group>
              </div>

              <div class="setting-item">
                <label>排序</label>
                <el-input-number 
                  v-model="formData.sort" 
                  :min="0" 
                  :max="9999"
                  size="small"
                />
              </div>
            </el-card>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 文件选择器 - 封面图片 -->
    <FileSelector
      v-model="coverImagePickerVisible"
      title="选择封面图片"
      :multiple="false"
      fileType="image"
      @select="handleCoverImageSelect"
    />

    <!-- 文件选择器 - 图集图片 -->
    <FileSelector
      v-model="imagePickerVisible"
      title="选择图片"
      :multiple="true"
      fileType="image"
      :maxFiles="20"
      @select="handleImagesSelect"
    />

    <!-- 文件选择对话框 -->
    <el-dialog
      v-model="showFileSelector"
      title="选择图片文件"
      width="80%"
      max-height="80vh"
      :close-on-click-modal="false"
    >
      <div class="file-selector-dialog">
        <!-- 文件夹导航 -->
        <div class="file-nav">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item @click="navigateToFolder(null)">
              <el-icon><HomeFilled /></el-icon>
              根目录
            </el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="folder in breadcrumbPath"
              :key="folder.id"
              @click="navigateToFolder(folder.id)"
              class="breadcrumb-link"
            >
              {{ folder.name }}
            </el-breadcrumb-item>
          </el-breadcrumb>
          
          <el-input
            v-model="fileSearchQuery"
            placeholder="搜索图片文件..."
            clearable
            style="width: 300px"
            @input="handleFileSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>

        <!-- 文件夹列表 -->
        <div v-if="fileFolders.length > 0" class="folders-section">
          <h4>文件夹</h4>
          <div class="folders-list">
            <div
              v-for="folder in fileFolders"
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

        <!-- 图片文件网格 -->
        <div class="files-section">
          <div class="section-header">
            <h4>图片文件</h4>
            <div class="selection-info">
              已选择 {{ selectedFiles.length }} 个文件
              <el-button
                v-if="selectedFiles.length > 0"
                type="danger"
                size="small"
                @click="selectedFiles = []"
              >
                清空选择
              </el-button>
            </div>
          </div>
          
          <div v-if="fileLoading" class="loading-container">
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
              :class="{ selected: selectedFiles.some(f => f.id === file.id) }"
              @click="toggleFileSelection(file)"
            >
              <div class="file-preview">
                <el-image
                  :src="file.url"
                  fit="cover"
                  class="file-image"
                >
                  <template #error>
                    <div class="image-error">
                      <el-icon><Picture /></el-icon>
                    </div>
                  </template>
                </el-image>
                
                <!-- 选中标识 -->
                <div v-if="selectedFiles.some(f => f.id === file.id)" class="selected-badge">
                  <el-icon><Check /></el-icon>
                </div>
              </div>
              <div class="file-info">
                <div class="file-name" :title="file.name">{{ file.name }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showFileSelector = false">取消</el-button>
          <el-button 
            type="primary" 
            :disabled="selectedFiles.length === 0"
            @click="confirmFileSystemSelection"
          >
            确认选择 ({{ selectedFiles.length }})
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 图片编辑对话框 -->
    <el-dialog
      v-model="showImageEditor"
      title="编辑图片信息"
      width="500px"
    >
      <el-form :model="editingImage" ref="imageFormRef" label-width="80px" v-if="editingImage">
        <el-form-item label="预览">
          <img :src="editingImage.imageUrl" class="preview-image" />
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="editingImage.title" placeholder="图片标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingImage.description" type="textarea" placeholder="图片描述" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showImageEditor = false">取消</el-button>
        <el-button type="primary" @click="saveImageEdit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, FolderOpened, Upload, HomeFilled, Search, Loading, Picture, Star, Edit, Delete, Close, Folder, Check } from '@element-plus/icons-vue'
import { fileApi, galleryApi, galleryCategoryApi } from '../../lib/api'
import FileSelector from '../../components/FileSelector.vue'

// 路由和响应式数据
const route = useRoute()
const router = useRouter()
const formRef = ref()
const imageFormRef = ref()
const tagInputRef = ref()

// 编辑状态
const isEditing = computed(() => !!route.params.id)
const galleryId = computed(() => route.params.id as string)

// 表单数据
const formData = reactive({
  title: '',
  description: '',
  category: '',
  tags: [] as string[],
  status: 'published' as 'published' | 'draft',
  sort: 0,
  images: [] as Array<{
    title: string
    description?: string
    imageUrl: string
    sort: number
  }>
})

// 其他状态
const saving = ref(false)
const categories = ref([])
const coverImageIndex = ref(0)
const pendingFiles = ref([] as Array<{ name: string; url: string }>)

// 对话框状态
const showFileSelector = ref(false)
const showImageEditor = ref(false)

// 标签输入
const tagInputVisible = ref(false)
const tagInputValue = ref('')

// 图片编辑
const editingImage = ref(null)
const editingImageIndex = ref(-1)

// 文件管理系统相关
const fileLoading = ref(false)
const fileFolders = ref([])
const filesList = ref([])
const selectedFiles = ref([])
const currentFolderId = ref(null)
const breadcrumbPath = ref([])
const fileSearchQuery = ref('')
const allFolders = ref([])
let fileSearchTimer = null

// 文件选择器状态
const coverImagePickerVisible = ref(false)
const imagePickerVisible = ref(false)

// 计算属性 - 只显示图片文件
const imageFiles = computed(() => {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp']
  return filesList.value.filter(file => 
    imageExtensions.some(ext => 
      file.extension && file.extension.toLowerCase() === ext.toLowerCase() ||
      file.name.toLowerCase().endsWith(ext)
    )
  )
})

// 表单验证规则
const formRules = {
  title: [
    { required: true, message: '请输入图集标题', trigger: 'blur' }
  ]
}

// 生命周期
onMounted(async () => {
  await Promise.all([
    loadCategories(),
    loadAllFolders()
  ])
  
  if (isEditing.value) {
    await loadGallery()
  } else {
    // 新建时初始化一个空的图片数组
    formData.images = []
  }
})

// 方法定义
const loadCategories = async () => {
  try {
    console.log('开始加载图库分类...')
    const result = await galleryCategoryApi.getList()
    console.log('分类加载结果:', result)
    categories.value = result
    if (categories.value.length === 0) {
      console.warn('没有找到任何图库分类')
      ElMessage.warning('暂无图库分类，请先创建分类')
    } else {
      console.log(`成功加载 ${categories.value.length} 个分类`)
    }
  } catch (error) {
    console.error('加载分类失败:', error)
    ElMessage.error('加载分类失败，请检查网络连接')
  }
}

const loadGallery = async () => {
  try {
    const gallery = await galleryApi.getById(galleryId.value)
    // 更新表单数据
    formData.title = gallery.title
    formData.description = gallery.description
    formData.category = gallery.category
    formData.tags = gallery.tags || []
    formData.status = gallery.status
    formData.sort = gallery.sort || 0
    formData.images = gallery.images?.map((img: any) => ({
      title: img.title || '',
      description: img.description || '',
      imageUrl: img.url,
      sort: img.sort || 0
    })) || []
    
    // 设置封面图片索引
    if (gallery.coverImage) {
      const coverIndex = formData.images.findIndex(img => img.imageUrl === gallery.coverImage)
      if (coverIndex !== -1) {
        coverImageIndex.value = coverIndex
      }
    }
  } catch (error) {
    console.error('加载图集失败:', error)
    ElMessage.error('加载图集失败')
  }
}

const goBack = () => {
  router.push('/admin/gallery')
}

const handleSave = async () => {
  try {
    await formRef.value?.validate()
    
    saving.value = true
    
    if (isEditing.value) {
      await galleryApi.update(galleryId.value, formData)
      ElMessage.success('图集更新成功')
      // 编辑成功后跳转到图库管理页面
      router.push('/admin/gallery')
    } else {
      await galleryApi.create(formData)
      ElMessage.success('图集创建成功')
      // 创建成功后跳转到图库管理页面
      router.push('/admin/gallery')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handlePreview = () => {
  // 预览功能
  console.log('预览图集:', formData)
}

// 标签管理
const showTagInput = () => {
  tagInputVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

const addTag = () => {
  const tag = tagInputValue.value.trim()
  if (tag && !formData.tags.includes(tag)) {
    formData.tags.push(tag)
  }
  tagInputValue.value = ''
  tagInputVisible.value = false
}

const removeTag = (tag: string) => {
  const index = formData.tags.indexOf(tag)
  if (index > -1) {
    formData.tags.splice(index, 1)
  }
}

// 图片管理
const handleFileChange = (uploadFile: any) => {
  const file = uploadFile.raw
  if (file && file.type.startsWith('image/')) {
    uploadImageToFileSystem(file)
  }
}

// 上传图片到文件系统
const uploadImageToFileSystem = async (file: File) => {
  // 检查文件大小 (5MB限制)
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过5MB')
    return
  }
  
  // 检查文件类型
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件')
    return
  }
  
  try {
    // 显示上传中提示
    const loadingMessage = ElMessage({
      message: `正在上传图片 ${file.name}...`,
      type: 'info',
      duration: 0
    })
    
    // 使用fileApi上传到文件系统，可以指定文件夹
    const uploadedFile = await fileApi.uploadFile(file, currentFolderId.value || undefined)
    
    loadingMessage.close()
    
    if (uploadedFile && uploadedFile.url) {
      // 添加到待添加队列
      pendingFiles.value.push({
        name: file.name,
        url: uploadedFile.url
      })
      ElMessage.success(`图片 ${file.name} 上传成功`)
    } else {
      throw new Error('上传失败，未获得文件URL')
    }
  } catch (error) {
    console.error('图片上传失败:', error)
    ElMessage.error(`图片上传失败: ${error.message || '未知错误'}`)
  }
}

const removePendingFile = (index: number) => {
  pendingFiles.value.splice(index, 1)
}

const confirmFileSelection = () => {
  const newImages = pendingFiles.value.map((file, index) => ({
    title: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
    description: '',
    imageUrl: file.url,
    sort: formData.images.length + index
  }))
  
  formData.images.push(...newImages)
  pendingFiles.value = []
  showFileSelector.value = false
}

const setCoverImage = (index: number) => {
  coverImageIndex.value = index
}

const editImage = (index: number) => {
  editingImageIndex.value = index
  editingImage.value = { ...formData.images[index] }
  showImageEditor.value = true
}

const saveImageEdit = () => {
  if (editingImageIndex.value >= 0 && editingImage.value) {
    Object.assign(formData.images[editingImageIndex.value], editingImage.value)
    showImageEditor.value = false
  }
}

const removeImage = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定删除这张图片吗？', '提示', {
      type: 'warning'
    })
    
    formData.images.splice(index, 1)
    
    // 调整封面索引
    if (coverImageIndex.value >= index && coverImageIndex.value > 0) {
      coverImageIndex.value--
    }
  } catch (error) {
    // 用户取消
  }
}

// 文件管理系统相关方法
const loadFolders = async (parentId = null) => {
  try {
    const response = await fileApi.getFolders(parentId)
    fileFolders.value = response
  } catch (error) {
    console.error('加载文件夹失败:', error)
    ElMessage.error('加载文件夹失败')
  }
}

// 加载所有文件夹（用于下拉框）
const loadAllFolders = async () => {
  try {
    const response = await fileApi.getFolders()
    allFolders.value = response
  } catch (error) {
    console.error('加载文件夹列表失败:', error)
  }
}

const loadFiles = async (folderId = null) => {
  try {
    fileLoading.value = true
    const params = {
      folderId,
      search: fileSearchQuery.value || undefined
    }
    const response = await fileApi.getFiles(params)
    filesList.value = response
  } catch (error) {
    console.error('加载文件失败:', error)
    ElMessage.error('加载文件失败')
  } finally {
    fileLoading.value = false
  }
}

const navigateToFolder = async (folderId) => {
  currentFolderId.value = folderId
  selectedFiles.value = []
  
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
    
    // 从当前文件夹往上遍历到根目录
    while (currentId) {
      const folders = await fileApi.getFolders()
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
    console.error('构建面包屑失败:', error)
  }
}

const toggleFileSelection = (file) => {
  const index = selectedFiles.value.findIndex(f => f.id === file.id)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file)
  }
}

const handleFileSearch = () => {
  if (fileSearchTimer) {
    clearTimeout(fileSearchTimer)
  }
  fileSearchTimer = setTimeout(() => {
    loadFiles(currentFolderId.value)
  }, 300)
}

const confirmFileSystemSelection = () => {
  const newImages = selectedFiles.value.map((file, index) => ({
    title: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
    description: '',
    imageUrl: file.url,
    sort: formData.images.length + index
  }))
  
  formData.images.push(...newImages)
  selectedFiles.value = []
  showFileSelector.value = false
  ElMessage.success(`已添加 ${newImages.length} 张图片`)
}

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 当打开文件选择器时，加载根目录
const openFileSelector = async () => {
  try {
    showFileSelector.value = true
    selectedFiles.value = []
    await navigateToFolder(null)
  } catch (error) {
    console.error('打开文件选择器失败:', error)
    ElMessage.error('打开文件选择器失败')
  }
}

// 选择封面图片
const selectCoverImage = () => {
  // 提供两种选择方式
  ElMessageBox.confirm(
    '请选择封面图片的方式',
    '选择封面图片',
    {
      confirmButtonText: '上传新图片',
      cancelButtonText: '从文件库选择',
      distinguishCancelAndClose: true,
      type: 'info'
    }
  ).then(() => {
    // 选择上传文件
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = false
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const file = target.files?.[0]
      if (!file) return
      
      // 检查文件大小 (5MB限制)
      if (file.size > 5 * 1024 * 1024) {
        ElMessage.error('图片大小不能超过5MB')
        return
      }
      
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        ElMessage.error('请选择图片文件')
        return
      }
      
      try {
        // 显示上传中提示
        const loadingMessage = ElMessage({
          message: '正在上传封面图片...',
          type: 'info',
          duration: 0
        })
        
        // 上传文件
        const uploadedFile = await fileApi.uploadFile(file)
        
        loadingMessage.close()
        
        if (uploadedFile && uploadedFile.url) {
          formData.images[coverImageIndex.value].imageUrl = uploadedFile.url
          ElMessage.success('封面图片上传成功')
        } else {
          throw new Error('上传失败，未获得文件URL')
        }
      } catch (error) {
        console.error('封面图片上传失败:', error)
        ElMessage.error('封面图片上传失败: ' + ((error as Error).message || '未知错误'))
      }
    }
    
    input.click()
  }).catch((action) => {
    if (action === 'cancel') {
      // 从文件库选择
      coverImagePickerVisible.value = true
    }
  })
}

// 处理封面图片选择
const handleCoverImageSelect = (file: any) => {
  if (file?.url) {
    formData.images[coverImageIndex.value].imageUrl = file.url
    ElMessage.success('封面图片设置成功')
  }
  coverImagePickerVisible.value = false
}

// 添加图片
const addImages = () => {
  // 提供两种选择方式
  ElMessageBox.confirm(
    '请选择添加图片的方式',
    '添加图片',
    {
      confirmButtonText: '上传新图片',
      cancelButtonText: '从文件库选择',
      distinguishCancelAndClose: true,
      type: 'info'
    }
  ).then(() => {
    // 选择上传文件
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement
      const files = Array.from(target.files || [])
      if (files.length === 0) return
      
      // 检查文件数量限制
      if (files.length > 20) {
        ElMessage.error('一次最多只能上传20张图片')
        return
      }
      
      // 检查每个文件
      for (const file of files) {
        // 检查文件大小 (5MB限制)
        if (file.size > 5 * 1024 * 1024) {
          ElMessage.error(`图片 ${file.name} 大小超过5MB`)
          return
        }
        
        // 检查文件类型
        if (!file.type.startsWith('image/')) {
          ElMessage.error(`文件 ${file.name} 不是图片格式`)
          return
        }
      }
      
      try {
        // 显示上传中提示
        const loadingMessage = ElMessage({
          message: '正在上传图片...',
          type: 'info',
          duration: 0
        })
        
        // 上传所有文件
        const uploadPromises = files.map(file => 
          fileApi.uploadFile(file)
        )
        
        const uploadedFiles = await Promise.all(uploadPromises)
        
        loadingMessage.close()
        
        // 添加到图片列表
        const newImages = uploadedFiles
          .filter(file => file && file.url)
          .map((file, index) => ({
            title: files[index].name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
            description: '',
            imageUrl: file.url,
            sort: formData.images.length + index
          }))
        
        formData.images.push(...newImages)
        ElMessage.success(`成功上传 ${newImages.length} 张图片`)
      } catch (error) {
        console.error('图片上传失败:', error)
        ElMessage.error('图片上传失败: ' + ((error as Error).message || '未知错误'))
      }
    }
    
    input.click()
  }).catch((action) => {
    if (action === 'cancel') {
      // 从文件库选择
      imagePickerVisible.value = true
    }
  })
}

// 处理图片选择
const handleImagesSelect = (files: any[]) => {
  if (Array.isArray(files) && files.length > 0) {
    const newImages = files.map(file => ({
      title: file.name.replace(/\.[^/.]+$/, ''), // 移除文件扩展名
      description: '',
      imageUrl: file.url,
      sort: formData.images.length + files.indexOf(file)
    }))
    formData.images.push(...newImages)
    ElMessage.success(`已添加 ${files.length} 张图片`)
  }
  imagePickerVisible.value = false
}
</script>

<style scoped lang="scss">
.gallery-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;

  .editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: white;
    border-bottom: 1px solid #e4e7ed;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      h1 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;

    .section-card {
      margin-bottom: 20px;

      .section-title {
        font-weight: 600;
        color: #303133;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .section-actions {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .tag-input-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;

    .tag-item {
      margin-right: 8px;
    }

    .tag-input {
      width: 120px;
    }

    .tag-add-btn {
      border-style: dashed;
    }
  }

  .image-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;

    .image-item {
      border: 2px solid #e4e7ed;
      border-radius: 8px;
      overflow: hidden;
      transition: all 0.3s;

      &.is-cover {
        border-color: #409eff;
        box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
      }

      .image-container {
        position: relative;

        img {
          width: 100%;
          height: 180px;
          object-fit: cover;
        }

        .cover-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #409eff;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }

        .image-actions {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          opacity: 0;
          transition: opacity 0.3s;

          .el-button-group {
            display: flex;
            justify-content: center;
            gap: 4px;
            
            .el-button {
              backdrop-filter: blur(12px);
              background: rgba(0, 0, 0, 0.7) !important;
              border: 1px solid rgba(255, 255, 255, 0.2) !important;
              color: white !important;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
              padding: 6px 8px;
              min-height: 32px;
              border-radius: 6px;
              
              &:hover {
                background: rgba(0, 0, 0, 0.8) !important;
                border-color: rgba(255, 255, 255, 0.3) !important;
                transform: translateY(-1px);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
              }
              
              &:disabled {
                background: rgba(108, 117, 125, 0.7) !important;
                color: rgba(255, 255, 255, 0.5) !important;
              }
              
              &.el-button--primary {
                background: rgba(64, 158, 255, 0.9) !important;
                border-color: rgba(64, 158, 255, 0.5) !important;
                
                &:hover {
                  background: rgba(64, 158, 255, 1) !important;
                  border-color: rgba(64, 158, 255, 0.8) !important;
                }
              }
              
              &.el-button--danger {
                background: rgba(245, 63, 63, 0.9) !important;
                border-color: rgba(245, 63, 63, 0.5) !important;
                
                &:hover {
                  background: rgba(245, 63, 63, 1) !important;
                  border-color: rgba(245, 63, 63, 0.8) !important;
                }
              }
              
              .el-icon {
                color: inherit !important;
              }
            }
          }
        }

        &:hover .image-actions {
          opacity: 1;
        }
      }

      .image-info {
        padding: 12px;

        .image-title {
          font-weight: 600;
          margin-bottom: 4px;
          color: #303133;
        }

        .image-desc {
          font-size: 12px;
          color: #909399;
          line-height: 1.4;
        }
      }
    }
  }

  .empty-images {
    text-align: center;
    padding: 40px;
  }

  .setting-item {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #303133;
    }
  }

  .preview-image {
    width: 100px;
    height: 100px;
    object-fit: cover;
    border-radius: 4px;
  }

  /* 文件选择器样式 */
  .simple-file-selector {
    padding: 20px;
  }

  .pending-files {
    margin-top: 20px;
  }

  .pending-files h4 {
    margin-bottom: 16px;
    font-size: 16px;
    font-weight: 600;
  }

  .file-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .file-item {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    overflow: hidden;
  }

  .file-preview {
    width: 100%;
    height: 120px;
    object-fit: cover;
  }

  .file-info {
    padding: 12px;
  }

  .file-name {
    font-size: 14px;
    margin-bottom: 8px;
    word-break: break-all;
  }

  /* 新增的文件管理对话框样式 */
  .file-selector-dialog {
    .file-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid #e4e7ed;

      .breadcrumb-link {
        cursor: pointer;
        &:hover {
          color: #409eff;
        }
      }
    }

    .folders-section, .files-section {
      margin-bottom: 24px;

      h4 {
        margin: 0 0 16px 0;
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 16px;

        .selection-info {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #606266;
        }
      }
    }

    .folders-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 12px;
      margin-bottom: 20px;

      .folder-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border: 1px solid #e4e7ed;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #409eff;
          background-color: #f0f7ff;
        }

        .folder-icon {
          color: #409eff;
          margin-right: 8px;
          font-size: 16px;
        }

        .folder-name {
          flex: 1;
          font-weight: 500;
        }

        .file-count {
          color: #909399;
          font-size: 12px;
        }
      }
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 16px;

      .file-item {
        border: 2px solid #e4e7ed;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          border-color: #409eff;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        &.selected {
          border-color: #409eff;
          box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
        }

        .file-preview {
          position: relative;

          .file-image {
            width: 100%;
            height: 120px;
          }

          .selected-badge {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            background: #409eff;
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          }

          .image-error {
            width: 100%;
            height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #f5f7fa;
            color: #909399;

            .el-icon {
              font-size: 24px;
              margin-bottom: 4px;
            }
          }
        }

        .file-info {
          padding: 8px 12px;

          .file-name {
            font-size: 12px;
            font-weight: 500;
            color: #303133;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 4px;
          }

          .file-meta {
            font-size: 11px;
            color: #909399;

            .file-size {
              margin-right: 8px;
            }
          }
        }
      }
    }

    .loading-container, .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #909399;

      .el-icon {
        font-size: 32px;
        margin-bottom: 12px;
      }
    }
  }

  /* 更新的图片预览区域样式 */
  .images-preview {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;

    .image-item {
      border: 2px solid #e4e7ed;
      border-radius: 12px;
      overflow: hidden;
      transition: all 0.3s;
      background: white;

      &.is-cover {
        border-color: #409eff;
        box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.1);
      }

      .image-preview {
        position: relative;
        height: 200px;

        .preview-image {
          width: 100%;
          height: 100%;
        }

        .cover-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #409eff, #67c23a);
          color: white;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .image-actions {
          position: absolute;
          bottom: 12px;
          left: 12px;
          right: 12px;
          opacity: 0;
          transition: opacity 0.3s;

          .el-button-group {
            display: flex;
            justify-content: center;
            
            .el-button {
              backdrop-filter: blur(8px);
              background: rgba(255, 255, 255, 0.9);
              border: none;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
          }
        }

        &:hover .image-actions {
          opacity: 1;
        }
      }

      .image-info {
        padding: 16px;

        .image-title {
          font-weight: 600;
          margin-bottom: 8px;
          color: #303133;
          font-size: 14px;
        }

        .image-description {
          font-size: 12px;
          color: #909399;
          line-height: 1.4;
        }
      }
    }
  }

  /* 待上传文件区域样式 */
  .pending-files {
    margin-top: 20px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 8px;
    border: 1px dashed #d0d7de;

    h4 {
      margin: 0 0 16px 0;
      color: #303133;
      font-size: 16px;
    }

    .pending-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 12px;
      margin-bottom: 16px;

      .pending-item {
        position: relative;
        text-align: center;

        .pending-preview {
          width: 100%;
          height: 80px;
          border-radius: 6px;
        }

        .pending-name {
          font-size: 12px;
          margin-top: 8px;
          color: #606266;
          word-break: break-all;
        }

        .remove-btn {
          position: absolute;
          top: -6px;
          right: -6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          padding: 0;
          min-height: auto;
        }
      }
    }

    .pending-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    }
  }

  /* 空状态样式 */
  .empty-images {
    text-align: center;
    padding: 60px 20px;
    color: #909399;

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      color: #d0d7de;
    }

    .empty-text {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 8px;
      color: #606266;
    }

    .empty-hint {
      font-size: 14px;
      color: #909399;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}
</style> 