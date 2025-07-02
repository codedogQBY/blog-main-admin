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
        <PermissionCheck :permission="isEditing ? 'gallery.update' : 'gallery.create'">
          <el-button type="primary" @click="handleSave" :loading="saving">
            {{ isEditing ? '更新' : '发布' }}
          </el-button>
        </PermissionCheck>
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
                    <PermissionCheck permission="gallery.update">
                      <el-button type="primary" @click="addImages">
                        <el-icon><Plus /></el-icon>
                        添加图片
                      </el-button>
                    </PermissionCheck>
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
                          style="color: #409eff;"
                          :disabled="index === coverImageIndex"
                          @click="setCoverImage(index)"
                        >
                          <el-icon><Star /></el-icon>
                        </el-button>
                        <el-button size="small" @click="editImage(index)">
                          <el-icon><Edit /></el-icon>
                        </el-button>
                        <PermissionCheck permission="gallery.delete">
                          <el-button 
                            size="small" 
                            style="color: #f56c6c;"
                            @click="removeImage(index)"
                          >
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </PermissionCheck>
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

    <!-- 封面图片选择器 -->
    <FileSelector
      v-model="selectedCoverImage"
      :visible="coverImagePickerVisible"
      @update:visible="coverImagePickerVisible = $event"
      title="选择封面图片"
      :multiple="false"
      :max-files="1"
      fileType="image"
      @select="handleCoverImageSelect"
    />

    <!-- 图片选择器 -->
    <FileSelector
      v-model="selectedImages"
      :visible="imagePickerVisible"
      @update:visible="imagePickerVisible = $event"
      title="选择图片"
      :multiple="true"
      :max-files="20"
      fileType="image"
      @select="handleImageSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Plus, Picture, Star, Edit, Delete } from '@element-plus/icons-vue'
import PermissionCheck from '../../components/PermissionCheck.vue'
import FileSelector from '../../components/FileSelector.vue'
import { galleryApi } from '../../api'
import type { Gallery, GalleryImage, GalleryCategory } from '../../api'

// 编辑器中使用的图片类型
interface EditorGalleryImage extends Partial<GalleryImage> {
  title: string
  description?: string
  imageUrl: string
  sort: number
}

interface GalleryForm {
  title: string
  description: string
  category: string
  tags: string[]
  status: 'published' | 'draft'
  sort: number
  images: EditorGalleryImage[]
}

// 路由和响应式数据
const route = useRoute()
const router = useRouter()
const formRef = ref()
const saving = ref(false)
const categories = ref<GalleryCategory[]>([])
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()
const coverImageIndex = ref(0)

// 文件选择器状态
const coverImagePickerVisible = ref(false)
const selectedCoverImage = ref<string>('')
const imagePickerVisible = ref(false)
const selectedImages = ref<string[]>([])

// 表单数据
const formData = reactive<GalleryForm>({
  title: '',
  description: '',
  category: '',
  tags: [],
  status: 'draft',
  sort: 0,
  images: []
})

// 表单校验规则
const formRules = {
  title: [
    { required: true, message: '请输入图集标题', trigger: 'blur' },
    { min: 2, max: 100, message: '标题长度应在2-100个字符之间', trigger: 'blur' }
  ],
  description: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ]
}

// 编辑状态
const isEditing = computed(() => Boolean(route.params.id))

// 加载分类列表
const loadCategories = async () => {
  try {
    const response = await galleryApi.getList()
    if (response?.items) {
      categories.value = response.items.map(item => ({
        name: item.category || '',
        description: item.description,
        isEnabled: item.status === 'published',
        sort: item.sort,
        imageCount: item.images?.length,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    }
  } catch (error) {
    console.error('加载分类列表失败:', error)
    ElMessage.error('加载分类列表失败')
  }
}

// 初始化数据
const initData = async () => {
  const id = route.params.id
  if (id) {
    try {
      const response = await galleryApi.getById(id as string)
      if (response) {
        formData.title = response.title || ''
        formData.description = response.description || ''
        formData.category = response.category || ''
        formData.tags = response.tags || []
        formData.status = response.status || 'draft'
        formData.sort = response.sort || 0
        formData.images = response.images?.map((img, index) => ({
          ...img,
          sort: img.sort || index
        })) || []
      }
    } catch (error) {
      console.error('获取图集详情失败:', error)
      ElMessage.error('获取图集详情失败')
    }
  }
}

// 在组件挂载时初始化数据
onMounted(async () => {
  await Promise.all([
    loadCategories(),
    initData()
  ])
})

// 返回列表页
const goBack = () => {
  router.push('/gallery')
}

// 预览
const handlePreview = () => {
  // TODO: 实现预览功能
  ElMessage.info('预览功能开发中')
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    saving.value = true
    const data = {
      ...formData,
      coverImage: formData.images[coverImageIndex.value]?.imageUrl
    }
    
    if (isEditing.value) {
      await galleryApi.update(route.params.id as string, data)
      ElMessage.success('更新成功')
    } else {
      await galleryApi.create(data)
      ElMessage.success('创建成功')
    }
    
    router.push('/admin/gallery')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 标签相关方法
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
  tagInputVisible.value = false
  tagInputValue.value = ''
}

const removeTag = (tag: string) => {
  formData.tags = formData.tags.filter(t => t !== tag)
}

// 图片相关方法
const addImages = () => {
  imagePickerVisible.value = true
}

// 处理封面图片选择
const handleCoverImageSelect = (value: string | string[]) => {
  const imageUrl = Array.isArray(value) ? value[0] : value
  if (imageUrl && formData.images[coverImageIndex.value]) {
    formData.images[coverImageIndex.value].imageUrl = imageUrl
  }
  coverImagePickerVisible.value = false
}

// 处理图片选择
const handleImageSelect = (value: string | string[]) => {
  const imageUrls = Array.isArray(value) ? value : [value]
  const newImages: EditorGalleryImage[] = imageUrls.map((url, index) => ({
    title: '',
    description: '',
    imageUrl: url,
    sort: formData.images.length + index,
    id: `temp-${Date.now()}-${index}`, // 临时 ID，后端会替换
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'draft'
  }))
  formData.images.push(...newImages)
  imagePickerVisible.value = false
}

const removeImage = (index: number) => {
  ElMessageBox.confirm('确定要删除这张图片吗？', '提示', {
    type: 'warning'
  }).then(() => {
    formData.images.splice(index, 1)
    if (index === coverImageIndex.value) {
      coverImageIndex.value = 0
    } else if (index < coverImageIndex.value) {
      coverImageIndex.value--
    }
  })
}

const setCoverImage = (index: number) => {
  coverImageIndex.value = index
}

const editImage = (index: number) => {
  const image = formData.images[index]
  ElMessageBox.prompt('请输入图片标题', '编辑图片', {
    inputValue: image.title,
    inputPlaceholder: '请输入图片标题',
    confirmButtonText: '下一步',
    cancelButtonText: '取消'
  }).then(({ value: title }) => {
    // 先更新标题
    image.title = title
    // 继续编辑描述
    return ElMessageBox.prompt('请输入图片描述', '编辑图片', {
      inputValue: image.description,
      inputType: 'textarea',
      inputPlaceholder: '请输入图片描述',
      confirmButtonText: '确定',
      cancelButtonText: '取消'
    })
  }).then(({ value: description }) => {
    // 更新描述
    image.description = description
    ElMessage.success('编辑成功')
  }).catch(() => {
    // 用户取消操作，不做任何处理
  })
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