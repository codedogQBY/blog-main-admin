<template>
  <div class="article-form">
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      size="default"
    >
      <el-row :gutter="20">
        <el-col :span="16">
          <el-form-item label="文章标题" prop="title">
            <el-input 
              v-model="form.title" 
              placeholder="请输入文章标题"
              @blur="generateSlug"
            />
          </el-form-item>

          <el-form-item label="文章别名" prop="slug">
            <el-input 
              v-model="form.slug" 
              placeholder="文章别名，用于URL"
            />
          </el-form-item>

          <el-form-item label="文章摘要" prop="excerpt">
            <el-input 
              v-model="form.excerpt" 
              type="textarea" 
              :rows="3"
              placeholder="请输入文章摘要"
            />
          </el-form-item>

          <el-form-item label="文章内容" prop="content">
            <TiptapEditor 
              v-model="form.content" 
              :height="500"
              placeholder="请输入文章内容"
            />
          </el-form-item>
        </el-col>

        <el-col :span="8">
          <el-card class="settings-card">
            <template #header>
              <span>文章设置</span>
            </template>

            <el-form-item label="发布状态" prop="published">
              <el-switch 
                v-model="form.published"
                active-text="发布"
                inactive-text="草稿"
              />
            </el-form-item>

            <el-form-item label="文章分类" prop="categoryId">
              <el-select v-model="form.categoryId" placeholder="选择分类">
                <el-option
                  v-for="category in categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="文章标签">
              <el-select
                v-model="form.tagIds"
                multiple
                filterable
                allow-create
                placeholder="选择或创建标签"
                @change="handleTagChange"
              >
                <el-option
                  v-for="tag in tags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                />
              </el-select>
            </el-form-item>

            <el-form-item label="阅读时间">
              <el-input-number 
                v-model="form.readTime" 
                :min="1" 
                :max="999"
                controls-position="right"
              />
              <span style="margin-left: 8px; color: #909399;">分钟</span>
            </el-form-item>

            <el-form-item label="发布时间" v-if="form.published">
              <el-date-picker
                v-model="form.publishedAt"
                type="datetime"
                placeholder="选择发布时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>

            <el-form-item label="SEO关键词">
              <el-input 
                v-model="form.seoKeywords" 
                type="textarea" 
                :rows="2"
                placeholder="SEO关键词，用逗号分隔"
              />
            </el-form-item>

            <el-form-item label="SEO描述">
              <el-input 
                v-model="form.seoDescription" 
                type="textarea" 
                :rows="3"
                placeholder="SEO描述"
              />
            </el-form-item>
          </el-card>
        </el-col>
      </el-row>
    </el-form>

    <div class="form-actions">
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="handleSaveDraft">保存草稿</el-button>
      <el-button type="primary" @click="handleSave">
        {{ form.published ? '发布文章' : '保存文章' }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue'
import { ElMessage, FormInstance } from 'element-plus'
import TiptapEditor from '@/components/TiptapEditor.vue'
import { articleApi, tagApi } from '@/api'

interface Article {
  id?: string
  title: string
  content: string
  excerpt: string
  slug: string
  published: boolean
  publishedAt?: string
  views: number
  readTime: number
  categoryId: string
  tagIds: string[]
  seoKeywords?: string
  seoDescription?: string
}

interface Category {
  id: string
  name: string
  description: string
  slug: string
}

interface Tag {
  id: string
  name: string
}

interface Props {
  article?: Article | null
  categories: Category[]
}

interface Emits {
  (e: 'success'): void
  (e: 'cancel'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const tags = ref<Tag[]>([])

const form = reactive<Article>({
  title: '',
  content: '',
  excerpt: '',
  slug: '',
  published: false,
  publishedAt: '',
  views: 0,
  readTime: 5,
  categoryId: '',
  tagIds: [],
  seoKeywords: '',
  seoDescription: ''
})

const rules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 1, max: 200, message: '标题长度在 1 到 200 个字符', trigger: 'blur' }
  ],
  slug: [
    { required: true, message: '请输入文章别名', trigger: 'blur' },
    { pattern: /^[a-z0-9-]+$/, message: '别名只能包含小写字母、数字和短横线', trigger: 'blur' }
  ],
  excerpt: [
    { required: true, message: '请输入文章摘要', trigger: 'blur' },
    { max: 500, message: '摘要长度不能超过 500 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入文章内容', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择文章分类', trigger: 'change' }
  ]
}

// 获取标签列表
const getTags = async () => {
  try {
    const response = await tagApi.getList()
    tags.value = Array.isArray(response) ? response : []
  } catch (error) {
    console.error('获取标签列表失败:', error)
    tags.value = []
  }
}

// 生成slug
const generateSlug = () => {
  if (form.title && !form.slug) {
    // 简单的中文转拼音slug生成（这里使用简化版本）
    const slug = form.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '')

    // 如果是中文，生成一个基于时间的slug
    if (/[\u4e00-\u9fa5]/.test(form.title)) {
      const timestamp = Date.now().toString(36)
      form.slug = `article-${timestamp}`
    } else {
      form.slug = slug
    }
  }
}

// 标签变化处理 - 修复初始化问题
const handleTagChange = async (values: (string | number)[]) => {
  if (!Array.isArray(values)) return
  
  // 转换为字符串数组
  const stringValues = values.map(v => String(v))
  
  // 找到新创建的标签（不在现有标签列表中的）
  const newTags = stringValues.filter(v => 
    !tags.value.find(t => t.id === v) && 
    typeof v === 'string' && 
    v.trim() !== ''
  )
  
  // 创建新标签
  if (newTags.length > 0) {
    for (const newTagName of newTags) {
      try {
        const newTag = await tagApi.create({ name: newTagName })
        // 添加到标签列表
        tags.value.push(newTag)
        
        // 更新表单中的标签ID
        const index = form.tagIds.indexOf(newTagName)
        if (index > -1) {
          form.tagIds[index] = newTag.id
        }
      } catch (error) {
        console.error('创建标签失败:', error)
        ElMessage.error(`创建标签"${newTagName}"失败`)
        // 移除创建失败的标签
        const failedIndex = form.tagIds.indexOf(newTagName)
        if (failedIndex > -1) {
          form.tagIds.splice(failedIndex, 1)
        }
      }
    }
  }
}

// 保存草稿
const handleSaveDraft = async () => {
  form.published = false
  await handleSave()
}

// 保存文章
const handleSave = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    loading.value = true

    const data = { ...form }
    
    // 如果发布，设置发布时间
    if (data.published && !data.publishedAt) {
      data.publishedAt = new Date().toISOString()
    }

    if (props.article?.id) {
      await articleApi.update(props.article.id, data)
      ElMessage.success('文章更新成功')
    } else {
      await articleApi.create(data)
      ElMessage.success('文章创建成功')
    }

    emit('success')
  } catch (error) {
    console.error('保存文章失败:', error)
    ElMessage.error('保存文章失败')
  } finally {
    loading.value = false
  }
}

// 取消
const handleCancel = () => {
  emit('cancel')
}

// 初始化表单数据
const initForm = () => {
  if (props.article) {
    Object.assign(form, {
      ...props.article,
      tagIds: props.article.tags?.map(tag => tag.id) || []
    })
  } else {
    Object.assign(form, {
      title: '',
      content: '',
      excerpt: '',
      slug: '',
      published: false,
      publishedAt: '',
      views: 0,
      readTime: 5,
      categoryId: '',
      tagIds: [],
      seoKeywords: '',
      seoDescription: ''
    })
  }
}

// 监听文章变化
watch(() => props.article, () => {
  initForm()
}, { immediate: true })

onMounted(() => {
  getTags()
})
</script>

<style scoped lang="scss">
.article-form {
  .settings-card {
    margin-bottom: 20px;
    
    :deep(.el-card__body) {
      padding: 20px;
    }
  }

  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ebeef5;
  }
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}
</style> 