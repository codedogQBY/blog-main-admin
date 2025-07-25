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
        <PermissionCheck permission="article.update">
          <el-button @click="saveDraft" class="draft-btn">
            <el-icon><Document /></el-icon>
            保存草稿
          </el-button>
        </PermissionCheck>
        <PermissionCheck :permission="form.published ? 'article.update' : 'article.create'">
          <el-button 
            type="primary" 
            @click="handlePublish"
            :loading="publishing"
            class="publish-btn"
          >
            <el-icon><Upload /></el-icon>
            {{ form.published ? '更新文章' : '发布文章' }}
          </el-button>
        </PermissionCheck>
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
            <div class="excerpt-input-group">
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
              <el-button 
                type="primary" 
                size="small"
                @click="generateExcerpt"
                :disabled="!form.title || !form.content || isGeneratingExcerpt"
                :loading="isGeneratingExcerpt"
                class="generate-excerpt-btn"
              >
                <el-icon v-if="!isGeneratingExcerpt"><Refresh /></el-icon>
                {{ isGeneratingExcerpt ? '生成中...' : 'AI生成' }}
              </el-button>
            </div>
          </div>

          <!-- 文章别名 -->
          <div class="setting-group">
            <div class="setting-label">
              <el-icon><Link /></el-icon>
              <span>文章别名</span>
            </div>
            <div class="slug-input-group">
              <el-input
                v-model="form.slug"
                placeholder="文章别名，用于URL"
                :disabled="slugLocked"
                @input="handleChange"
                class="slug-input"
              />
              <div class="slug-buttons">
              <el-button 
                type="primary" 
                size="small"
                @click="generateSlug"
                  :disabled="!form.title || isGeneratingSlug"
                  :loading="isGeneratingSlug"
                class="generate-slug-btn"
              >
                  <el-icon v-if="!isGeneratingSlug"><Refresh /></el-icon>
                  {{ isGeneratingSlug ? '生成中...' : 'AI生成' }}
              </el-button>
              <el-button 
                type="info" 
                size="small"
                @click="toggleSlugLock"
                class="lock-slug-btn"
              >
                <el-icon><Lock v-if="slugLocked" /><Unlock v-else /></el-icon>
                {{ slugLocked ? '解锁' : '锁定' }}
              </el-button>
              </div>
            </div>
            <div class="slug-preview" v-if="form.slug">
              <span class="preview-label">预览URL：</span>
              <span class="preview-url">{{ getSlugPreview() }}</span>
              <div v-if="slugConfidence > 0" class="confidence-indicator">
                <span class="confidence-label">AI置信度：</span>
                <span class="confidence-value" :class="getConfidenceClass()">
                  {{ Math.round(slugConfidence * 100) }}%
                </span>
              </div>
            </div>
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
              <el-button 
                type="primary" 
                size="small"
                @click="generateSEO"
                :disabled="!form.title || !form.content || isGeneratingSEO"
                :loading="isGeneratingSEO"
                class="generate-seo-btn"
              >
                <el-icon v-if="!isGeneratingSEO"><Refresh /></el-icon>
                {{ isGeneratingSEO ? '生成中...' : 'AI生成' }}
              </el-button>
            </div>
            <div class="seo-inputs">
              <el-input
                v-model="form.metaTitle"
                placeholder="SEO标题（留空则使用文章标题）"
                @input="handleChange"
                class="seo-input"
              />
              <el-input
                v-model="form.metaDescription"
                type="textarea"
                :rows="2"
                placeholder="SEO描述（留空则使用文章摘要）"
                maxlength="160"
                show-word-limit
                @input="handleChange"
                class="seo-input"
              />
              <el-input
                v-model="form.metaKeywords"
                placeholder="SEO关键词，用逗号分隔"
                @input="handleChange"
                class="seo-input"
              />
              <el-input
                v-model="form.canonicalUrl"
                placeholder="规范链接（留空则使用默认URL）"
                @input="handleChange"
                class="seo-input"
              />
            </div>
          </div>

          <!-- 阅读时间设置 -->
          <div class="setting-group">
            <div class="setting-label">
              <el-icon><Timer /></el-icon>
              <span>阅读时间</span>
            </div>
            <div class="read-time-inputs">
              <el-input-number
                v-model="form.readTime"
                :min="1"
                size="default"
                @change="handleChange"
                style="width: 60%;"
                class="read-time-input"
              >
                <template #suffix>
                  <span class="read-time-unit">分钟</span>
                </template>
              </el-input-number>
              <el-button
                text
                type="primary"
                @click="estimateReadTime"
                class="estimate-btn"
              >
                <el-icon><Refresh /></el-icon>
                重新估算
              </el-button>
            </div>
            <div class="read-time-tip">
              系统会根据文章内容自动估算阅读时间，您也可以手动调整
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

    <!-- 文件选择器 -->
    <FileSelector
      :visible="coverImagePickerVisible"
      @update:model-value="selectedCoverImage = $event"
      @update:visible="coverImagePickerVisible = $event"
      title="选择封面图片"
      :multiple="false"
      :max-files="1"
      fileType="image"
      @select="handleCoverImageSelect"
    />
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
  Timer,
  Refresh,
  Link,
  Lock,
  Unlock
} from '@element-plus/icons-vue'
import TiptapEditor from '@/components/editor/TiptapEditor.vue'
import FileSelector, {type FileType} from '@/components/FileSelector.vue'
import { articleApi, categoryApi, tagApi, fileApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import PermissionCheck from '@/components/PermissionCheck.vue'
import type { CreateArticleRequest, UpdateArticleRequest } from '@/lib/api'

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
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  canonicalUrl: '',
  published: false,
  readTime: 1,
  slug: ''
})

// slug 锁定状态
const slugLocked = ref(true)
// slug 置信度
const slugConfidence = ref(0)

// 状态管理
const isSaving = ref(false)
const publishing = ref(false)
const lastSaved = ref<Date | null>(null)
const previewVisible = ref(false)
const hasUnsavedChanges = ref(false)

// AI生成loading状态
const isGeneratingSlug = ref(false)
const isGeneratingExcerpt = ref(false)
const isGeneratingSEO = ref(false)

// 数据
const categories = ref<any[]>([])
const tags = ref<any[]>([])
const isEditing = ref(false)
const articleId = ref<string | null>(null)

// 自动保存相关
let autoSaveTimer: NodeJS.Timeout | null = null
let contentChangeTimer: NodeJS.Timeout | null = null
const CACHE_KEY = 'article-draft'
const AUTO_SAVE_INTERVAL = 5000 // 5秒自动保存
const CONTENT_CHANGE_DEBOUNCE = 1000 // 内容变化防抖时间

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

// 监听页面离开
const handleBeforeUnload = (e: BeforeUnloadEvent) => {
  if (hasUnsavedChanges.value && (form.title.trim() || form.content.trim())) {
    // 自动保存为草稿
    autoSaveAsDraft()
    e.preventDefault()
    e.returnValue = '您有未保存的更改，已自动保存为草稿。确定要离开吗？'
  }
}

// 键盘快捷键处理
let saveInProgress = false

const handleKeyDown = (event: KeyboardEvent) => {
  // 检测 Cmd/Ctrl + S 快捷键
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault()
    
    // 防止重复触发
    if (saveInProgress) {
      return
    }
    
    saveInProgress = true
    
    if (form.title.trim() || form.content.trim()) {
      saveToDraft()
      lastSaved.value = new Date()
      hasUnsavedChanges.value = false
      ElMessage.success('已保存到本地')
    } else {
      ElMessage.warning('请先输入标题或内容')
    }
    
    // 延迟重置状态，防止快速重复触发
    setTimeout(() => {
      saveInProgress = false
    }, 1000)
  }
}

// 初始化
onMounted(async () => {
  // 添加页面离开监听
  window.addEventListener('beforeunload', handleBeforeUnload)
  
  // 添加键盘事件监听器
  document.addEventListener('keydown', handleKeyDown)
  
  // 添加路由离开监听
  const handleRouteLeave = () => {
    if (hasUnsavedChanges.value && (form.title.trim() || form.content.trim())) {
      autoSaveAsDraft()
    }
  }
  
  // 监听路由变化
  router.beforeEach((to, from, next) => {
    if (from.path.includes('/admin/articles/edit') && hasUnsavedChanges.value && (form.title.trim() || form.content.trim())) {
      autoSaveAsDraft()
    }
    next()
  })
  
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
  // 移除页面离开监听
  window.removeEventListener('beforeunload', handleBeforeUnload)
  
  // 移除键盘事件监听
  document.removeEventListener('keydown', handleKeyDown)
  
  // 清理定时器
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
  }
  if (contentChangeTimer) {
    clearTimeout(contentChangeTimer)
  }
  
  // 离开页面时自动保存为草稿
  if (hasUnsavedChanges.value && (form.title.trim() || form.content.trim())) {
    autoSaveAsDraft()
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
      tags: article.tags?.map(t => t.tag.name) || [],
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      metaKeywords: article.metaKeywords || '',
      canonicalUrl: article.canonicalUrl || '',
      published: article.published,
      slug: article.slug || ''
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
  hasUnsavedChanges.value = true
  // 立即保存到本地缓存
  saveToDraft()
  
  // 如果 slug 没有被锁定且为空，自动生成
  if (!slugLocked.value && !form.slug && form.title.trim()) {
    // 延迟生成，避免用户输入时频繁更新
    setTimeout(() => {
      if (!slugLocked.value && !form.slug && form.title.trim()) {
        generateSlug()
      }
    }, 1000)
  }
}

const handleContentChange = (newContent?: string) => {
  if (newContent !== undefined) {
    form.content = newContent
  }
  
  // 防抖处理内容变化
  if (contentChangeTimer) {
    clearTimeout(contentChangeTimer)
  }
  
  contentChangeTimer = setTimeout(() => {
    hasUnsavedChanges.value = true
    // 立即保存到本地缓存
    saveToDraft()
  }, CONTENT_CHANGE_DEBOUNCE)
}

const handleTagChange = (value: (string | number)[]) => {
  // 确保 tags 总是字符串数组
  form.tags = value.map(v => String(v))
  hasUnsavedChanges.value = true
  // 立即保存到本地缓存
  saveToDraft()
}

// 封面图片选择器状态
const coverImagePickerVisible = ref(false)
const selectedCoverImage = ref('')

// 选择封面图片
const selectCoverImage = () => {
  coverImagePickerVisible.value = true
}

// 处理封面图片选择
const handleCoverImageSelect = (files: FileType | FileType[]) => {
  const file = Array.isArray(files) ? files[0] : files
  if (file) {
    form.coverImage = file.url
    hasUnsavedChanges.value = true
    // 立即保存到本地缓存
    saveToDraft()
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
    const articleData: CreateArticleRequest = {
      title: form.title,
      content: form.content,
      excerpt: form.excerpt,
      coverImage: form.coverImage,
      categoryId: form.categoryId,
      tags: form.tags,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      metaKeywords: form.metaKeywords,
      canonicalUrl: form.canonicalUrl,
      published: form.published,
      readTime: form.readTime,
      slug: form.slug
    }
    
    if (isEditing.value && articleId.value) {
      await articleApi.update(articleId.value, articleData as UpdateArticleRequest)
    } else {
      const newArticle = await articleApi.create(articleData)
      articleId.value = newArticle.id
    }
    
    hasUnsavedChanges.value = false
    clearDraft()
    ElMessage.success(form.published ? '发布成功' : '保存草稿成功')
    router.push('/admin/articles')
  } catch (error) {
    ElMessage.error(form.published ? '发布失败' : '保存草稿失败')
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
  if (hasUnsavedChanges.value && (form.title.trim() || form.content.trim())) {
    try {
      await ElMessageBox.confirm(
        '您有未保存的更改，将自动保存为草稿。确定要离开吗？',
        '提示',
        {
          confirmButtonText: '离开',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      // 用户确认离开，自动保存为草稿
      await autoSaveAsDraft()
    } catch {
      return
    }
  }
  
  router.push('/admin/articles')
}



// 自动保存为草稿（离开页面时调用）
const autoSaveAsDraft = async () => {
  if (!form.title.trim() && !form.content.trim()) {
    return // 如果标题和内容都为空，不保存
  }
  
  try {
    // 确保保存为草稿状态
    const originalPublished = form.published
    form.published = false
    
    const articleData: CreateArticleRequest = {
      title: form.title || '未命名文章',
      content: form.content || '',
      excerpt: form.excerpt,
      coverImage: form.coverImage,
      categoryId: form.categoryId,
      tags: form.tags,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      metaKeywords: form.metaKeywords,
      canonicalUrl: form.canonicalUrl,
      published: false, // 强制保存为草稿
      readTime: form.readTime,
      slug: form.slug
    }
    
    if (isEditing.value && articleId.value) {
      await articleApi.update(articleId.value, articleData as UpdateArticleRequest)
    } else {
      const newArticle = await articleApi.create(articleData)
      articleId.value = newArticle.id
      isEditing.value = true
    }
    
    // 恢复原来的发布状态（如果用户没有修改的话）
    if (originalPublished !== form.published) {
      form.published = originalPublished
    }
    
    hasUnsavedChanges.value = false
    clearDraft() // 清除本地缓存
    console.log('自动保存草稿成功')
  } catch (error) {
    console.error('自动保存草稿失败:', error)
  }
}

// 自动保存到本地缓存
const startAutoSave = () => {
  autoSaveTimer = setInterval(() => {
    if (hasUnsavedChanges.value && (form.title.trim() || form.content.trim())) {
      saveToDraft()
      // 更新保存状态显示
      lastSaved.value = new Date()
    }
  }, AUTO_SAVE_INTERVAL)
}

// 保存草稿
const saveDraft = async () => {
  if (isSaving.value) return
  
  isSaving.value = true
  try {
    const articleData: CreateArticleRequest = {
      title: form.title,
      content: form.content,
      excerpt: form.excerpt,
      coverImage: form.coverImage,
      categoryId: form.categoryId,
      tags: form.tags,
      metaTitle: form.metaTitle,
      metaDescription: form.metaDescription,
      metaKeywords: form.metaKeywords,
      canonicalUrl: form.canonicalUrl,
      published: false, // 保存为草稿
      readTime: form.readTime,
      slug: form.slug
    }
    
    if (isEditing.value && articleId.value) {
      await articleApi.update(articleId.value, articleData as UpdateArticleRequest)
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

// 保存到本地缓存
const saveToDraft = () => {
  try {
    const draftData = {
      ...form,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(draftData))
    
    // 更新保存状态（但不显示消息，避免打扰用户）
    if (!lastSaved.value) {
      lastSaved.value = new Date()
    }
  } catch (error) {
    console.warn('保存草稿到本地失败:', error)
  }
}

// 从本地缓存恢复
const restoreDraft = () => {
  const draftStr = localStorage.getItem(CACHE_KEY)
  if (!draftStr) return

  try {
    const draftData = JSON.parse(draftStr)
    const timestamp = draftData.timestamp
    delete draftData.timestamp

    // 如果草稿超过24小时，不恢复
    if (Date.now() - timestamp > 24 * 60 * 60 * 1000) {
      clearDraft()
      return
    }

    // 确保关键字段有有效值
    const safeDraftData = {
      ...draftData,
      title: draftData.title || '',
      content: draftData.content || '',
      excerpt: draftData.excerpt || '',
      coverImage: draftData.coverImage || '',
      categoryId: draftData.categoryId || '',
      tags: Array.isArray(draftData.tags) ? draftData.tags : [],
      metaTitle: draftData.metaTitle || '',
      metaDescription: draftData.metaDescription || '',
      metaKeywords: draftData.metaKeywords || '',
      canonicalUrl: draftData.canonicalUrl || '',
      published: Boolean(draftData.published),
      readTime: Number(draftData.readTime) || 1,
      slug: draftData.slug || ''
    }
    
    Object.assign(form, safeDraftData)
    hasUnsavedChanges.value = true
    ElMessage.info('已恢复未保存的草稿')
  } catch (error) {
    console.error('恢复草稿失败:', error)
    clearDraft()
  }
}

// 清除本地缓存
const clearDraft = () => {
  localStorage.removeItem(CACHE_KEY)
}



// 监听表单变化，实时保存到缓存
watch(form, () => {
  if (hasUnsavedChanges.value) {
    saveToDraft()
  }
}, { deep: true })

// 估算阅读时间
const estimateReadTime = () => {
  if (!form.content) {
    form.readTime = 1
    return
  }

  // 移除HTML标签
  const plainText = form.content.replace(/<[^>]+>/g, '')
  
  // 计算中文字符数（每分钟300字）
  const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g)?.length || 0
  const chineseTime = chineseChars / 300

  // 计算英文单词数（每分钟200词）
  const englishWords = plainText.match(/[a-zA-Z]+/g)?.length || 0
  const englishTime = englishWords / 200

  // 计算图片数（每张10秒）
  const images = (form.content.match(/<img[^>]+>/g)?.length || 0)
  const imageTime = (images * 10) / 60

  // 计算代码块数（每块30秒）
  const codeBlocks = (form.content.match(/<pre[^>]*>[\s\S]*?<\/pre>/g)?.length || 0)
  const codeTime = (codeBlocks * 30) / 60

  // 总时间（分钟）
  const totalTime = Math.max(1, Math.ceil(chineseTime + englishTime + imageTime + codeTime))
  
  form.readTime = totalTime
}

// 监听内容变化，自动估算阅读时间
watch(() => form.content, () => {
  estimateReadTime()
}, { deep: true })

// 生成文章别名
const generateSlug = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('请先输入文章标题')
    return
  }
  
  isGeneratingSlug.value = true
  
  try {
    // 调用AI生成slug
    const result = await articleApi.generateSlugWithAI(form.title, form.content)
    
    if (result.slug) {
      form.slug = result.slug
      slugConfidence.value = result.confidence
      handleChange()
      ElMessage.success('AI已生成文章别名')
    } else {
      generateLocalSlug()
    }
  } catch (error) {
    console.error('AI生成slug失败:', error)
    ElMessage.warning('AI生成失败，使用本地生成方式')
    generateLocalSlug()
  } finally {
    isGeneratingSlug.value = false
  }
}

// 生成文章摘要
const generateExcerpt = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('请先输入文章标题')
    return
  }
  
  if (!form.content.trim()) {
    ElMessage.warning('请先输入文章内容')
    return
  }
  
  isGeneratingExcerpt.value = true
  
  try {
    // 调用AI生成摘要
    const result = await articleApi.generateExcerptWithAI(form.title, form.content)
    
    if (result.excerpt) {
      form.excerpt = result.excerpt
      handleChange()
      ElMessage.success('AI已生成文章摘要')
    }
  } catch (error) {
    console.error('AI生成摘要失败:', error)
    ElMessage.warning('AI生成摘要失败')
  } finally {
    isGeneratingExcerpt.value = false
  }
}

// 生成SEO内容
const generateSEO = async () => {
  if (!form.title.trim()) {
    ElMessage.warning('请先输入文章标题')
    return
  }
  
  if (!form.content.trim()) {
    ElMessage.warning('请先输入文章内容')
    return
  }
  
  isGeneratingSEO.value = true
  
  try {
    // 调用AI生成SEO内容
    const result = await articleApi.generateSEOWithAI(form.title, form.content)
    
    if (result.metaTitle && result.metaDescription && result.metaKeywords) {
      form.metaTitle = result.metaTitle
      form.metaDescription = result.metaDescription
      form.metaKeywords = result.metaKeywords
      handleChange()
      ElMessage.success('AI已生成SEO内容')
    }
  } catch (error) {
    console.error('AI生成SEO内容失败:', error)
    ElMessage.warning('AI生成SEO内容失败')
  } finally {
    isGeneratingSEO.value = false
  }
}

// 本地生成slug（作为AI的备选方案）
const generateLocalSlug = () => {
  let slug = form.title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/\s+/g, '-') // 空格替换为连字符
    .replace(/-+/g, '-') // 多个连字符替换为单个
    .replace(/^-+|-+$/g, '') // 移除首尾连字符
  
  // 如果 slug 为空，使用默认值
  if (!slug) {
    slug = 'untitled-article'
  }
  
  form.slug = slug
  handleChange()
  ElMessage.success('文章别名已生成')
}

// 获取文章别名预览
const getSlugPreview = () => {
  if (!form.slug) {
    return '未生成文章别名'
  }
  
  // 构建完整的预览URL - 使用前端的博客URL结构
  const baseUrl = window.location.origin
  return `${baseUrl}/blog/${form.slug}`
}

// 切换文章别名锁定状态
const toggleSlugLock = () => {
  slugLocked.value = !slugLocked.value
  handleChange()
}

// 获取置信度样式类
const getConfidenceClass = () => {
  if (slugConfidence.value >= 0.8) return 'high-confidence'
  if (slugConfidence.value >= 0.6) return 'medium-confidence'
  return 'low-confidence'
}
</script>

<style scoped lang="scss">
.modern-article-editor {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8fafc;

  .editor-toolbar {
    height: 64px;
    padding: 0 24px;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 10;

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
    overflow: hidden;
    height: calc(100vh - 64px);

    .editor-main {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      height: 100%;

      .title-section {
        margin-bottom: 24px;
        
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
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 250px);

        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .tiptap-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          
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
              padding: 20px;
              min-height: 500px;
            }
          }
        }
      }
    }

    .settings-panel {
      width: 360px;
      padding: 24px 24px 24px 0;
      overflow-y: auto;
      height: 100%;

      .panel-card {
        height: auto;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: white;
        position: relative;

        :deep(.el-card__header) {
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
        }

        :deep(.el-card__body) {
          padding: 20px;
          overflow-y: visible;
        }
      }

      .panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;

        .el-icon {
          font-size: 18px;
          color: #64748b;
        }
      }

      .setting-group {
        &:not(:last-child) {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
        }

        .setting-label {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 12px;
          color: #64748b;
          font-weight: 500;
          font-size: 14px;

          .el-icon {
            font-size: 16px;
          }

          .generate-seo-btn {
            margin-left: auto;
            padding: 4px 8px;
            height: 24px;
            border-radius: 4px;
            font-size: 11px;
            
            .el-icon {
              margin-right: 2px;
            }
          }
        }

        .cover-upload-area {
          .cover-preview {
            position: relative;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 8px;

            .cover-image {
              width: 100%;
              height: 160px;
              object-fit: cover;
              display: block;
            }

            .cover-overlay {
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transition: opacity 0.2s ease;

              .el-button {
                transform: translateY(10px);
                transition: transform 0.2s ease;
              }
            }

            &:hover {
              .cover-overlay {
                opacity: 1;

                .el-button {
                  transform: translateY(0);
                }
              }
            }
          }

          .upload-area {
            border: 2px dashed #e2e8f0;
            border-radius: 8px;
            padding: 32px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              border-color: #3b82f6;
              background: #f8fafc;

              .upload-icon {
                color: #3b82f6;
                transform: scale(1.1);
              }
            }

            .upload-icon {
              font-size: 32px;
              color: #94a3b8;
              margin-bottom: 12px;
              transition: all 0.2s ease;
            }

            .upload-text {
              color: #64748b;
              font-size: 14px;
              font-weight: 500;
              margin-bottom: 4px;
            }

            .upload-hint {
              color: #94a3b8;
              font-size: 12px;
            }
          }

          .remove-cover {
            margin-top: 8px;
            width: 100%;
            justify-content: center;
          }
        }

        .excerpt-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;

        .excerpt-input {
            width: 100%;
            
          :deep(.el-textarea__inner) {
            border-radius: 8px;
            border: 1px solid #e2e8f0;
            transition: all 0.2s ease;

            &:hover {
              border-color: #3b82f6;
            }

            &:focus {
              border-color: #3b82f6;
              box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
          }
          }

          .generate-excerpt-btn {
            align-self: flex-end;
            padding: 6px 12px;
            height: 28px;
            border-radius: 6px;
            font-size: 12px;
            
            .el-icon {
              margin-right: 4px;
            }
          }
        }

        .excerpt-input {
          width: 100%;
        }

        .category-select,
        .tag-select {
          width: 100%;

          :deep(.el-input__wrapper) {
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

          .seo-input {
            :deep(.el-input__wrapper),
            :deep(.el-textarea__inner) {
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              transition: all 0.2s ease;

              &:hover {
                border-color: #3b82f6;
              }

              &:focus {
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
              }
            }
          }
        }

        .read-time-inputs {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;

          .read-time-input {
            width: 120px;
          }

          .read-time-unit {
            margin-left: 4px;
            color: #666;
          }

          .estimate-btn {
            padding: 0;
            height: auto;
          }
        }

        .read-time-tip {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .slug-input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;

          .slug-input {
            width: 100%;
          }

          .slug-buttons {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }

          .generate-slug-btn,
          .lock-slug-btn {
            padding: 6px 12px;
            height: 28px;
            border-radius: 6px;
            font-size: 12px;
            
            .el-icon {
              margin-right: 4px;
            }
          }
        }

        .slug-preview {
          margin-top: 8px;
          padding: 8px 12px;
          background: #f8fafc;
          border-radius: 6px;
          font-size: 12px;
          color: #64748b;
          border: 1px solid #e2e8f0;
          
          .preview-label {
            font-weight: 500;
            color: #475569;
          }
          
          .preview-url {
            color: #667eea;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            word-break: break-all;
          }
          
          .confidence-indicator {
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            
            .confidence-label {
              color: #64748b;
            }
            
            .confidence-value {
              font-weight: 600;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              
              &.high-confidence {
                background: #dcfce7;
                color: #166534;
              }
              
              &.medium-confidence {
                background: #fef3c7;
                color: #92400e;
              }
              
              &.low-confidence {
                background: #fee2e2;
                color: #991b1b;
              }
            }
          }
        }
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