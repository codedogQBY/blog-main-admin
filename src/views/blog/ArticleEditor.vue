<template>
  <div class="modern-article-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-button 
          class="back-button" 
          @click="handleBack"
          text
        >
          <el-icon><ArrowLeft /></el-icon>
          返回列表
        </el-button>
        
        <div class="save-indicator">
          <div v-if="isSaving" class="saving">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>保存中...</span>
          </div>
          <div v-else-if="lastSaved" class="saved">
            <el-icon class="saved-icon"><Check /></el-icon>
            <span>{{ saveStatusText }}</span>
          </div>
          <div v-else class="unsaved">
            <el-icon><Clock /></el-icon>
            <span>未保存</span>
          </div>
        </div>
      </div>
      
      <div class="toolbar-right">
        <el-button @click="handlePreview" class="preview-btn">
          <el-icon><View /></el-icon>
          预览
        </el-button>
        <el-button @click="saveDraft" class="draft-btn">
          <el-icon><Document /></el-icon>
          保存草稿
        </el-button>
        <el-button 
          type="primary" 
          @click="handlePublish"
          :loading="publishing"
          class="publish-btn"
        >
          <el-icon><Upload /></el-icon>
          {{ form.published ? '更新文章' : '发布文章' }}
        </el-button>
      </div>
    </div>

    <!-- 编辑器主体 -->
    <div class="editor-body">
      <!-- 左侧编辑区 -->
      <div class="editor-main">
        <!-- 文章标题 -->
        <div class="title-section">
          <el-input
            v-model="form.title"
            placeholder="请输入文章标题..."
            class="title-input"
            size="large"
            maxlength="100"
            show-word-limit
            @input="handleTitleChange"
          />
        </div>

        <!-- 内容编辑器 -->
        <div class="content-editor">
          <TiptapEditor
            v-model="form.content"
            placeholder="开始创作你的精彩内容..."
            @update:modelValue="handleContentChange"
            class="tiptap-wrapper"
          />
        </div>
      </div>

      <!-- 右侧设置面板 -->
      <div class="settings-panel">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <el-icon><Setting /></el-icon>
              <span>发布设置</span>
            </div>
          </template>

          <!-- 封面图片 -->
          <div class="setting-group">
            <div class="setting-label">
              <el-icon><Picture /></el-icon>
              <span>封面图片</span>
            </div>
            <div class="cover-upload-area">
              <div v-if="form.coverImage" class="cover-preview">
                <img :src="form.coverImage" alt="封面" class="cover-image" />
                <div class="cover-overlay">
                  <el-button @click="selectCoverImage" size="small" type="primary">
                    <el-icon><Edit /></el-icon>
                    更换
                  </el-button>
                </div>
              </div>
              <div v-else class="upload-area" @click="selectCoverImage">
                <el-icon class="upload-icon"><Plus /></el-icon>
                <div class="upload-text">选择封面图片</div>
                <div class="upload-hint">支持 JPG、PNG 格式</div>
              </div>
              <el-button 
                v-if="form.coverImage" 
                @click="form.coverImage = ''"
                class="remove-cover"
                size="small"
                text
                type="danger"
              >
                <el-icon><Delete /></el-icon>
                移除封面
              </el-button>
            </div>
          </div>

          <!-- 文章摘要 -->
          <div class="setting-group">
            <div class="setting-label">
              <el-icon><Reading /></el-icon>
              <span>文章摘要</span>
            </div>
            <el-input
              v-model="form.excerpt"
              type="textarea"
              :rows="3"
              placeholder="请输入文章摘要，用于搜索和分享..."
              maxlength="200"
              show-word-limit
              @input="handleChange"
              class="excerpt-input"
            />
          </div>

          <!-- 分类选择 -->
          <div class="setting-group">
            <div class="setting-label">
              <el-icon><Collection /></el-icon>
              <span>分类</span>
            </div>
            <el-select
              v-model="form.categoryId"
              placeholder="选择文章分类"
              filterable
              @change="handleChange"
              class="category-select"
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id"
              />
            </el-select>
          </div>

          <!-- 标签选择 -->
          <div class="setting-group">
            <div class="setting-label">
              <el-icon><PriceTag /></el-icon>
              <span>标签</span>
            </div>
            <el-select
              v-model="form.tags"
              multiple
              filterable
              allow-create
              placeholder="选择或创建标签"
              @change="handleTagChange"
              class="tag-select"
            >
              <el-option
                v-for="tag in tags"
                :key="tag.id"
                :label="tag.name"
                :value="tag.name"
              />
            </el-select>
          </div>

          <!-- SEO设置 -->
          <div class="setting-group">
            <div class="setting-label">
              <el-icon><Search /></el-icon>
              <span>SEO优化</span>
            </div>
            <div class="seo-inputs">
              <el-input
                v-model="form.seoKeywords"
                placeholder="SEO关键词，用逗号分隔"
                @input="handleChange"
                class="seo-input"
              />
              <el-input
                v-model="form.seoDescription"
                type="textarea"
                :rows="2"
                placeholder="SEO描述"
                maxlength="160"
                show-word-limit
                @input="handleChange"
                class="seo-input"
              />
            </div>
          </div>

          <!-- 发布状态 -->
          <div class="setting-group">
            <div class="setting-label">
              <el-icon><Switch /></el-icon>
              <span>发布状态</span>
            </div>
            <el-switch
              v-model="form.published"
              active-text="已发布"
              inactive-text="草稿"
              @change="handleChange"
              class="publish-switch"
            />
          </div>
        </el-card>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      title="文章预览"
      width="80%"
      :close-on-click-modal="false"
      class="preview-dialog"
    >
      <div class="preview-container">
        <article class="preview-article">
          <header class="article-header">
            <h1 class="article-title">{{ form.title || '无标题' }}</h1>
            <div class="article-meta">
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>{{ userStore.user?.name }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Collection /></el-icon>
                <span>{{ getCategoryName(form.categoryId) }}</span>
              </div>
              <div class="meta-item">
                <el-icon><PriceTag /></el-icon>
                <span>{{ form.tags?.join('、') || '无标签' }}</span>
              </div>
            </div>
          </header>
          <div class="article-content" v-html="form.content"></div>
        </article>
      </div>
    </el-dialog>

    <!-- 封面图片选择器 -->
    <el-dialog
      v-model="coverImagePickerVisible"
      title="选择封面图片"
      width="80%"
      :close-on-click-modal="false"
      class="cover-image-picker-dialog"
    >
      <div class="cover-image-picker-content">
        <!-- 工具栏 -->
        <div class="picker-toolbar">
          <el-input
            v-model="coverImageSearchTerm"
            placeholder="搜索图片..."
            clearable
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="refreshCoverImageList" :loading="coverImageLoading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        
        <!-- 图片网格 -->
        <div class="image-grid" v-loading="coverImageLoading">
          <div
            v-for="image in filteredCoverImages"
            :key="image.id"
            class="image-item"
            :class="{ selected: selectedCoverImage === image.url }"
            @click="selectCoverImageItem(image)"
          >
            <img :src="image.url" :alt="image.name" loading="lazy" />
            <div class="image-overlay">
              <div class="check-icon">✓</div>
            </div>
            <div class="image-info">
              <div class="image-name">{{ image.name }}</div>
              <div class="image-size">{{ formatFileSize(image.size) }}</div>
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="filteredCoverImages.length === 0 && !coverImageLoading" class="empty-state">
            <div class="empty-icon">🖼️</div>
            <p>{{ coverImageSearchTerm ? '暂无匹配的图片' : '暂无图片文件' }}</p>
          </div>
        </div>
      </div>
      
      <!-- 底部操作栏 -->
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelCoverImageSelection">取消</el-button>
          <el-button type="primary" @click="confirmCoverImageSelection">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  ArrowLeft,
  View,
  Document,
  Upload,
  Loading,
  Plus,
  Setting,
  Picture,
  Edit,
  Delete,
  Reading,
  Collection,
  PriceTag,
  Search,
  Switch,
  User,
  Check,
  Clock,
  Refresh
} from '@element-plus/icons-vue'
import TiptapEditor from '@/components/TiptapEditor.vue'
import { articleApi, categoryApi, tagApi, fileApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'

const route = useRoute()
const router = useRouter()
const userStore = useAuthStore()

// 表单数据
const form = reactive({
  title: '',
  content: '',
  excerpt: '',
  coverImage: '',
  categoryId: '',
  tags: [] as string[],
  seoKeywords: '',
  seoDescription: '',
  published: false
})

// 状态管理
const isSaving = ref(false)
const publishing = ref(false)
const lastSaved = ref<Date | null>(null)
const previewVisible = ref(false)
const hasUnsavedChanges = ref(false)

// 数据
const categories = ref<any[]>([])
const tags = ref<any[]>([])
const isEditing = ref(false)
const articleId = ref<string | null>(null)

// 自动保存相关
let autoSaveTimer: NodeJS.Timeout | null = null
const CACHE_KEY = 'article-draft'
const AUTO_SAVE_INTERVAL = 30000 // 30秒自动保存

// 计算属性
const saveStatusText = computed(() => {
  if (isSaving.value) return '保存中...'
  if (lastSaved.value) {
    const diff = Date.now() - lastSaved.value.getTime()
    if (diff < 60000) return '刚刚保存'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前保存`
    return lastSaved.value.toLocaleTimeString()
  }
  return ''
})

// 获取分类名称
const getCategoryName = (categoryId: string) => {
  const category = categories.value.find(c => c.id === categoryId)
  return category?.name || '未分类'
}

// 初始化
onMounted(async () => {
  await loadData()
  
  // 检查是否是编辑模式
  if (route.params.id) {
    isEditing.value = true
    articleId.value = route.params.id as string
    await loadArticle()
  } else {
    // 新建模式，尝试恢复草稿
    restoreDraft()
  }
  
  // 启动自动保存
  startAutoSave()
})

// 清理
onBeforeUnmount(() => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
})

// 监听页面离开
window.addEventListener('beforeunload', (e) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = '您有未保存的更改，确定要离开吗？'
  }
})

// 加载基础数据
const loadData = async () => {
  try {
    const [categoriesRes, tagsRes] = await Promise.all([
      categoryApi.getList(),
      tagApi.getList()
    ])
    
    categories.value = Array.isArray(categoriesRes) ? categoriesRes : categoriesRes.data || []
    tags.value = Array.isArray(tagsRes) ? tagsRes : tagsRes.data || []
  } catch (error) {
    ElMessage.error('加载数据失败')
    console.error(error)
  }
}

// 加载文章数据
const loadArticle = async () => {
  try {
    const article = await articleApi.getById(articleId.value!)
    Object.assign(form, {
      title: article.title,
      content: article.content,
      excerpt: article.excerpt,
      coverImage: article.coverImage,
      categoryId: article.categoryId,
      tags: article.tags?.map(t => t.name) || [],
      seoKeywords: article.seoKeywords || '',
      seoDescription: article.seoDescription || '',
      published: article.published
    })
    
    // 清除未保存标记
    hasUnsavedChanges.value = false
  } catch (error) {
    ElMessage.error('加载文章失败')
    console.error(error)
  }
}

// 变更处理
const handleChange = () => {
  hasUnsavedChanges.value = true
}

const handleTitleChange = () => {
  handleChange()
}

const handleContentChange = () => {
  handleChange()
}

const handleTagChange = (value: (string | number)[]) => {
  // 确保 tags 总是字符串数组
  form.tags = value.map(v => String(v))
  handleChange()
}

// 封面图片选择
const selectCoverImage = () => {
  // 提供两种选择方式，与TiptapEditor保持一致
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
    uploadNewCoverImage()
  }).catch((action) => {
    if (action === 'cancel') {
      // 选择从文件库选择
      showCoverImagePicker()
    }
    // 如果是其他情况（如用户点击X关闭），不显示错误
  })
}

// 上传新的封面图片到文件系统
const uploadNewCoverImage = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.multiple = false
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
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
      
      // 使用fileApi上传到文件系统
      const uploadedFile = await fileApi.uploadFile(file)
      
      loadingMessage.close()
      
      if (uploadedFile && uploadedFile.url) {
        // 确保使用HTTP协议
        const imageUrl = uploadedFile.url.replace('https://', 'http://')
        form.coverImage = imageUrl
        handleChange()
        ElMessage.success('封面图片上传成功')
      } else {
        throw new Error('上传失败，未获得文件URL')
      }
    } catch (error) {
      console.error('封面图片上传失败:', error)
      ElMessage.error('封面图片上传失败: ' + (error.message || '未知错误'))
    }
  }
  
  input.click()
}

// 封面图片选择器状态
const coverImagePickerVisible = ref(false)
const coverImageList = ref<any[]>([])
const coverImageSearchTerm = ref('')
const coverImageLoading = ref(false)
const selectedCoverImage = ref<string>('')

// 显示封面图片选择器
const showCoverImagePicker = async () => {
  coverImagePickerVisible.value = true
  await loadCoverImageList()
}

// 加载封面图片列表
const loadCoverImageList = async () => {
  coverImageLoading.value = true
  try {
    // 使用fileApi获取图片文件
    const files = await fileApi.getFiles({ type: 'image' })
    
    if (!files || !Array.isArray(files)) {
      ElMessage.warning('获取图片列表失败')
      return
    }
    
    // 过滤并转换数据格式
    coverImageList.value = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
      .map(file => ({
        id: file.id,
        name: file.name,
        size: file.size || 0,
        url: file.url ? file.url.replace('https://', 'http://') : ''
      }))

    if (coverImageList.value.length === 0) {
      ElMessage.warning('图片库中暂无图片，请先上传图片')
    }
  } catch (error) {
    console.error('获取图片列表失败:', error)
    ElMessage.error('获取图片列表失败: ' + (error.message || error))
  } finally {
    coverImageLoading.value = false
  }
}

// 过滤后的封面图片列表
const filteredCoverImages = computed(() => {
  if (!coverImageSearchTerm.value) {
    return coverImageList.value
  }
  return coverImageList.value.filter(image => 
    image.name.toLowerCase().includes(coverImageSearchTerm.value.toLowerCase())
  )
})

// 选择封面图片
const selectCoverImageItem = (image: any) => {
  // 如果点击的是已选中的图片，则取消选择
  if (selectedCoverImage.value === image.url) {
    selectedCoverImage.value = ''
  } else {
    selectedCoverImage.value = image.url
  }
}

// 确认选择封面图片
const confirmCoverImageSelection = () => {
  if (!selectedCoverImage.value) {
    ElMessage.warning('请选择一张图片')
    return
  }
  
  form.coverImage = selectedCoverImage.value
  handleChange()
  closeCoverImagePicker()
  ElMessage.success('封面图片设置成功')
}

// 取消选择封面图片
const cancelCoverImageSelection = () => {
  closeCoverImagePicker()
}

// 关闭封面图片选择器并清空数据
const closeCoverImagePicker = () => {
  coverImagePickerVisible.value = false
  selectedCoverImage.value = ''
  coverImageSearchTerm.value = ''
  coverImageList.value = []
  coverImageLoading.value = false
}

// 刷新封面图片列表
const refreshCoverImageList = async () => {
  await loadCoverImageList()
  ElMessage.success('图片列表已刷新')
}

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 保存草稿
const saveDraft = async () => {
  if (isSaving.value) return
  
  isSaving.value = true
  try {
    const articleData = {
      ...form,
      published: false
    }
    
    if (isEditing.value && articleId.value) {
      await articleApi.update(articleId.value, articleData)
    } else {
      const newArticle = await articleApi.create(articleData)
      articleId.value = newArticle.id
      isEditing.value = true
      // 更新URL，但不触发路由跳转
      history.replaceState(null, '', `/admin/articles/edit/${newArticle.id}`)
    }
    
    lastSaved.value = new Date()
    hasUnsavedChanges.value = false
    clearDraft() // 清除本地缓存
    ElMessage.success('草稿保存成功')
  } catch (error) {
    ElMessage.error('保存失败')
    console.error(error)
  } finally {
    isSaving.value = false
  }
}

// 发布文章
const handlePublish = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('请输入文章标题')
    return
  }
  
  if (!form.content.trim()) {
    ElMessage.warning('请输入文章内容')
    return
  }
  
  if (!form.categoryId) {
    ElMessage.warning('请选择文章分类')
    return
  }
  
  publishing.value = true
  try {
    const articleData = {
      ...form,
      published: true
    }
    
    if (isEditing.value && articleId.value) {
      await articleApi.update(articleId.value, articleData)
    } else {
      const newArticle = await articleApi.create(articleData)
      articleId.value = newArticle.id
    }
    
    hasUnsavedChanges.value = false
    clearDraft()
    ElMessage.success('发布成功')
    router.push('/admin/articles')
  } catch (error) {
    ElMessage.error('发布失败')
    console.error(error)
  } finally {
    publishing.value = false
  }
}

// 预览
const handlePreview = () => {
  previewVisible.value = true
}

// 返回
const handleBack = async () => {
  if (hasUnsavedChanges.value) {
    try {
      await ElMessageBox.confirm(
        '您有未保存的更改，确定要离开吗？',
        '提示',
        {
          confirmButtonText: '离开',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    } catch {
      return
    }
  }
  
  router.push('/admin/articles')
}

// 自动保存
const startAutoSave = () => {
  autoSaveTimer = setInterval(() => {
    if (hasUnsavedChanges.value && (form.title.trim() || form.content.trim())) {
      saveToDraft()
    }
  }, AUTO_SAVE_INTERVAL)
}

// 保存到本地缓存
const saveToDraft = () => {
  const draftData = {
    ...form,
    timestamp: Date.now()
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(draftData))
}

// 从本地缓存恢复
const restoreDraft = () => {
  try {
    const draftData = localStorage.getItem(CACHE_KEY)
    if (draftData) {
      const parsed = JSON.parse(draftData)
      const now = Date.now()
      const draftAge = now - parsed.timestamp
      
      // 如果草稿不超过24小时
      if (draftAge < 24 * 60 * 60 * 1000) {
        ElMessageBox.confirm(
          '发现未保存的草稿，是否恢复？',
          '恢复草稿',
          {
            confirmButtonText: '恢复',
            cancelButtonText: '放弃',
            type: 'info'
          }
        ).then(() => {
          Object.assign(form, parsed)
          hasUnsavedChanges.value = true
          ElMessage.success('草稿已恢复')
        }).catch(() => {
          clearDraft()
        })
      } else {
        clearDraft()
      }
    }
  } catch (error) {
    console.error('恢复草稿失败:', error)
    clearDraft()
  }
}

// 清除草稿缓存
const clearDraft = () => {
  localStorage.removeItem(CACHE_KEY)
}

// 监听表单变化，实时保存到缓存
watch(form, () => {
  if (hasUnsavedChanges.value) {
    saveToDraft()
  }
}, { deep: true })
</script>

<style scoped lang="scss">
.modern-article-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8fafc;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  z-index: 10;
  flex-shrink: 0;

  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 24px;

    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #64748b;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 8px;
      transition: all 0.2s ease;

      &:hover {
        color: #3b82f6;
        background: #f1f5f9;
      }
    }

    .save-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;

      .saving {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #3b82f6;

        .is-loading {
          animation: rotate 1s linear infinite;
        }
      }

      .saved {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #10b981;

        .saved-icon {
          color: #10b981;
        }
      }

      .unsaved {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #f59e0b;
      }
    }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;

    .preview-btn,
    .draft-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 500;
      color: #64748b;
      border: 1px solid #e2e8f0;
      background: white;
      transition: all 0.2s ease;

      &:hover {
        color: #3b82f6;
        border-color: #3b82f6;
        background: #f8fafc;
      }
    }

    .publish-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 20px;
      border-radius: 8px;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
      }
    }
  }
}

.editor-body {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 24px;
  overflow: hidden;
  min-height: 0;
}

.editor-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
  overflow: hidden;

  .title-section {
    flex-shrink: 0;
    
    .title-input {
      :deep(.el-input__wrapper) {
        border: none;
        background: white;
        border-radius: 12px;
        padding: 20px 24px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        transition: all 0.2s ease;

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        &.is-focus {
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .el-input__inner {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.3;
          border: none;
          
          &::placeholder {
            color: #94a3b8;
            font-weight: 400;
          }
        }
      }
    }
  }

  .content-editor {
    flex: 1;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    overflow: hidden;
    transition: all 0.2s ease;
    min-height: 0;
    display: flex;
    flex-direction: column;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .tiptap-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      
      :deep(.tiptap-editor) {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        border: none;
        border-radius: 0;
        box-shadow: none;
        
        .editor-content {
          flex: 1;
          overflow-y: auto;
          min-height: 200px;
        }
      }
    }
  }
}

.settings-panel {
  width: 320px;
  flex-shrink: 0;
  overflow-y: auto;
  max-height: 100%;

  .panel-card {
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: none;
    
    :deep(.el-card__header) {
      padding: 20px 24px 16px;
      border-bottom: 1px solid #f1f5f9;
    }

    :deep(.el-card__body) {
      padding: 24px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;

      .el-icon {
        color: #3b82f6;
      }
    }

    .setting-group {
      margin-bottom: 24px;

      &:last-child {
        margin-bottom: 0;
      }

      .setting-label {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 600;
        color: #374151;

        .el-icon {
          color: #6b7280;
          font-size: 16px;
        }
      }

      .cover-upload-area {
        .cover-preview {
          position: relative;
          width: 100%;
          height: 160px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;

          .cover-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .cover-overlay {
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
            color: white;
            font-size: 20px;

            &:hover {
              opacity: 1;
            }
          }
        }

        .upload-area {
          width: 100%;
          height: 160px;
          border: 2px dashed #d1d5db;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #f9fafb;

          &:hover {
            border-color: #3b82f6;
            background: #f8fafc;
          }

          .upload-icon {
            font-size: 32px;
            color: #9ca3af;
            margin-bottom: 8px;
          }

          .upload-text {
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 4px;
          }

          .upload-hint {
            font-size: 12px;
            color: #9ca3af;
          }
        }
      }

      .remove-cover {
        margin-top: 8px;
        width: 100%;
        color: #ef4444;

        &:hover {
          background: #fef2f2;
        }
      }
    }

    .excerpt-input,
    .category-select,
    .tag-select,
    .seo-input {
      width: 100%;

      :deep(.el-input__wrapper),
      :deep(.el-select__wrapper) {
        border-radius: 8px;
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

    .seo-inputs {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .publish-switch {
      :deep(.el-switch__label) {
        font-size: 14px;
        font-weight: 500;
      }
    }
  }
}

.preview-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }

  :deep(.el-dialog__header) {
    padding: 24px 24px 16px;
    border-bottom: 1px solid #f1f5f9;
  }

  :deep(.el-dialog__body) {
    padding: 0;
  }

  .preview-container {
    max-height: 70vh;
    overflow-y: auto;
    padding: 24px;

    .preview-article {
      max-width: 800px;
      margin: 0 auto;

      .article-header {
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 1px solid #e2e8f0;

        .article-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 16px 0;
          line-height: 1.2;
        }

        .article-meta {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;

          .meta-item {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
            color: #64748b;

            .el-icon {
              color: #94a3b8;
            }
          }
        }
      }

      .article-content {
        line-height: 1.8;
        color: #374151;
        font-size: 16px;

        :deep(h1),
        :deep(h2),
        :deep(h3),
        :deep(h4),
        :deep(h5),
        :deep(h6) {
          margin: 32px 0 16px 0;
          font-weight: 600;
          color: #1e293b;
        }

        :deep(p) {
          margin: 16px 0;
        }

        :deep(img) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 20px 0;
        }

        :deep(pre) {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          overflow-x: auto;
          margin: 20px 0;
        }

        :deep(blockquote) {
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          margin: 20px 0;
          color: #64748b;
          font-style: italic;
        }
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* 封面图片选择器样式 */
:deep(.cover-image-picker-dialog) {
  .el-dialog {
    border-radius: 16px;
    overflow: hidden;
  }

  .el-dialog__header {
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

  .el-dialog__body {
    padding: 0;
  }

  .cover-image-picker-content {
    max-height: 600px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
    
    .picker-toolbar {
      display: flex;
      gap: 16px;
      padding: 20px 24px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      align-items: center;

      .el-input {
        :deep(.el-input__wrapper) {
          border-radius: 8px;
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

      .el-button {
        border-radius: 8px;
        border: 1px solid #d1d5db;
        color: #6b7280;
        
        &:hover {
          border-color: #667eea;
          color: #667eea;
        }
      }
    }
    
    .image-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 20px;
      overflow-y: auto;
      max-height: 480px;
      padding: 24px;
      background: #f8fafc;

      /* 美化滚动条 */
      &::-webkit-scrollbar {
        width: 8px;
      }
      
      &::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
        
        &:hover {
          background: #a8a8a8;
        }
      }

      .image-item {
        background: white;
        border-radius: 16px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        border: 3px solid transparent;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
        }

        &:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 12px 32px rgba(102, 126, 234, 0.3);
          
          &::before {
            opacity: 1;
          }
          
          .image-overlay {
            opacity: 1;
          }
        }

        &.selected {
          border-color: #667eea;
          box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
          
          &::before {
            opacity: 1;
            background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          }
          
          .image-overlay {
            opacity: 1;
            
            .check-icon {
              opacity: 1;
              transform: scale(1);
            }
          }
        }

        img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          display: block;
          transition: transform 0.3s ease;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 2;
          
          .check-icon {
            width: 40px;
            height: 40px;
            background: #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
            opacity: 0;
            transform: scale(0.5);
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
          }
        }

        .image-info {
          padding: 16px;
          background: white;
          position: relative;
          z-index: 3;
          
          .image-name {
            font-size: 14px;
            color: #1e293b;
            font-weight: 600;
            margin-bottom: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            line-height: 1.4;
          }

          .image-size {
            font-size: 12px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 4px;
            
            &::before {
              content: '📁';
              font-size: 10px;
            }
          }
        }
      }
      
      .empty-state {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 24px;
        color: #64748b;
        background: #f8fafc;

        .empty-icon {
          font-size: 64px;
          margin-bottom: 16px;
          opacity: 0.5;
          color: #94a3b8;
        }

        p {
          margin: 0;
          font-size: 16px;
          font-weight: 500;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 20px 24px;
    background: white;
    border-top: 1px solid #e2e8f0;
    
    .el-button {
      border-radius: 8px;
      padding: 10px 24px;
      font-weight: 600;
      
      &.el-button--primary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border: none;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
        }
      }
      
      &.el-button--default {
        border: 1px solid #d1d5db;
        color: #6b7280;
        
        &:hover {
          border-color: #667eea;
          color: #667eea;
        }
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .settings-panel {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .editor-body {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .settings-panel {
    width: 100%;
    order: -1;
  }
  
  .editor-toolbar {
    padding: 12px 16px;
    
    .toolbar-left,
    .toolbar-right {
      gap: 8px;
    }
    
    .toolbar-right {
      .preview-btn,
      .draft-btn,
      .publish-btn {
        padding: 6px 12px;
        font-size: 13px;
      }
    }
  }
  
  .editor-main .title-section .title-input {
    :deep(.el-input__wrapper) {
      padding: 16px 20px;
      
      .el-input__inner {
        font-size: 24px;
      }
    }
  }
}
</style> 