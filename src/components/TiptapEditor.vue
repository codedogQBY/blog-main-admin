<template>
  <div class="tiptap-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar" v-if="editor">
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          class="toolbar-button"
          title="粗体"
        >
          <el-icon><Bold /></el-icon>
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          class="toolbar-button"
          title="斜体"
        >
          <el-icon><Italic /></el-icon>
        </button>
        <button
          @click="editor.chain().focus().toggleStrike().run()"
          :class="{ 'is-active': editor.isActive('strike') }"
          class="toolbar-button"
          title="删除线"
        >
          <el-icon><Strikethrough /></el-icon>
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
          class="toolbar-button"
          title="标题1"
        >
          H1
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
          class="toolbar-button"
          title="标题2"
        >
          H2
        </button>
        <button
          @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
          :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
          class="toolbar-button"
          title="标题3"
        >
          H3
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBulletList().run()"
          :class="{ 'is-active': editor.isActive('bulletList') }"
          class="toolbar-button"
          title="无序列表"
        >
          <el-icon><List /></el-icon>
        </button>
        <button
          @click="editor.chain().focus().toggleOrderedList().run()"
          :class="{ 'is-active': editor.isActive('orderedList') }"
          class="toolbar-button"
          title="有序列表"
        >
          <el-icon><ListOrdered /></el-icon>
        </button>
        <button
          @click="editor.chain().focus().toggleBlockquote().run()"
          :class="{ 'is-active': editor.isActive('blockquote') }"
          class="toolbar-button"
          title="引用"
        >
          <el-icon><Quote /></el-icon>
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleCodeBlock().run()"
          :class="{ 'is-active': editor.isActive('codeBlock') }"
          class="toolbar-button"
          title="代码块"
        >
          <el-icon><Code /></el-icon>
        </button>
        <button
          @click="addImage"
          class="toolbar-button"
          title="插入图片"
        >
          <el-icon><ImageIcon /></el-icon>
        </button>
        <button
          @click="addLink"
          class="toolbar-button"
          title="插入链接"
        >
          <el-icon><LinkIcon /></el-icon>
        </button>
      </div>

      <div class="toolbar-separator"></div>

      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().undo().run()"
          :disabled="!editor.can().chain().focus().undo().run()"
          class="toolbar-button"
          title="撤销"
        >
          <el-icon><Undo /></el-icon>
        </button>
        <button
          @click="editor.chain().focus().redo().run()"
          :disabled="!editor.can().chain().focus().redo().run()"
          class="toolbar-button"
          title="重做"
        >
          <el-icon><Redo /></el-icon>
        </button>
      </div>

      <!-- 字数统计 -->
      <div class="character-count" v-if="editor">
        {{ editor.storage.characterCount.characters() }} 字符
        {{ editor.storage.characterCount.words() }} 单词
      </div>
    </div>

    <!-- 编辑器内容 -->
    <div class="editor-content">
      <editor-content :editor="editor" />
    </div>

    <!-- 预览模式 -->
    <div v-if="showPreview" class="editor-preview">
      <div class="preview-content" v-html="previewHtml"></div>
    </div>

    <!-- 图片选择器对话框 -->
    <el-dialog
      v-model="imagePickerVisible"
      title="选择图片"
      width="80%"
      :close-on-click-modal="false"
      class="image-picker-dialog"
    >
      <div class="image-picker-content">
        <div class="picker-toolbar">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索图片..."
            clearable
            @input="handleSearch"
            style="width: 300px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button @click="refreshImageList" :loading="loadingImages">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        
        <div class="image-grid" v-loading="loadingImages">
          <div
            v-for="image in filteredImages"
            :key="image.name"
            :class="['image-item', { 'selected': selectedImage?.name === image.name }]"
            @click="selectImage(image)"
          >
            <img :src="image.url" :alt="image.name" />
            <div class="image-overlay">
              <div class="check-icon">✓</div>
            </div>
            <div class="image-info">
              <div class="image-name">{{ image.name }}</div>
              <div class="image-size">{{ formatFileSize(image.size) }}</div>
            </div>
          </div>
        </div>
        
        <div v-if="filteredImages.length === 0 && !loadingImages" class="empty-state">
          <el-icon class="empty-icon"><Picture /></el-icon>
          <p>暂无图片文件</p>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="closeImagePicker">取消</el-button>
          <el-button 
            type="primary" 
            @click="insertSelectedImage"
            :disabled="!selectedImage"
          >
            插入图片
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  List,
  ListOrdered,
  Quote,
  Code,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  Bold,
  Italic,
  Strikethrough
} from 'lucide-vue-next'
import {
  Search,
  Refresh,
  Picture
} from '@element-plus/icons-vue'
import { fileApi } from '@/lib/api'

interface Props {
  modelValue?: string
  placeholder?: string
  readonly?: boolean
  showPreview?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '开始写作...',
  readonly: false,
  showPreview: false
})

const emit = defineEmits<Emits>()

const previewHtml = ref('')

// 创建 lowlight 实例
const lowlight = createLowlight()

const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [
    StarterKit,
    TiptapImage.configure({
      inline: true,
      allowBase64: true,
    }),
    TiptapLink.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link',
      },
    }),
    Placeholder.configure({
      placeholder: props.placeholder,
    }),
    CharacterCount,
    CodeBlockLowlight.configure({
      lowlight,
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    emit('change', html)
    updatePreview(html)
  },
})

// 监听外部数据变化
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    editor.value.commands.setContent(newValue, false)
  }
})

// 监听只读状态
watch(() => props.readonly, (readonly) => {
  if (editor.value) {
    editor.value.setEditable(!readonly)
  }
})

const updatePreview = (html: string) => {
  previewHtml.value = html
}

// 图片选择器相关
const imagePickerVisible = ref(false)
const loadingImages = ref(false)
const imageList = ref<any[]>([])
const selectedImage = ref<any>(null)
const searchKeyword = ref('')

// 过滤后的图片列表
const filteredImages = computed(() => {
  if (!searchKeyword.value) return imageList.value
  return imageList.value.filter(image => 
    image.name.toLowerCase().includes(searchKeyword.value.toLowerCase())
  )
})

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / (1024 * 1024)).toFixed(1) + ' MB'
}

// 加载图片列表
const loadImageList = async () => {
  loadingImages.value = true
  try {
    // 获取所有文件，过滤出图片文件
    const files = await fileApi.getFiles({ type: 'image' })
    
    if (files && Array.isArray(files)) {
      imageList.value = files
        .filter((file: any) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name))
        .map((file: any) => ({
          ...file,
          // 确保使用HTTP协议
          url: file.url ? file.url.replace('https://', 'http://') : `http://beal-blog-main.test.upcdn.net${file.path}`
        }))
    }
  } catch (error) {
    console.error('加载图片列表失败:', error)
    ElMessage.error('加载图片列表失败')
  } finally {
    loadingImages.value = false
  }
}

// 刷新图片列表
const refreshImageList = () => {
  loadImageList()
}

// 搜索处理
const handleSearch = () => {
  // 搜索是通过computed属性实现的，这里不需要额外处理
}

// 选择图片
const selectImage = (image: any) => {
  // 如果点击的是已选中的图片，则取消选择
  if (selectedImage.value && selectedImage.value.name === image.name) {
    selectedImage.value = null
  } else {
    selectedImage.value = image
  }
}

// 插入选中的图片
const insertSelectedImage = () => {
  if (selectedImage.value && editor.value) {
    editor.value.chain().focus().setImage({ src: selectedImage.value.url }).run()
    closeImagePicker()
    ElMessage.success('图片插入成功')
  }
}

// 关闭图片选择器并清空数据
const closeImagePicker = () => {
  imagePickerVisible.value = false
  selectedImage.value = null
  searchKeyword.value = ''
  imageList.value = []
  loadingImages.value = false
}

const addImage = () => {
  // 提供三种选择方式
  ElMessageBox.confirm(
    '请选择插入图片的方式',
    '插入图片',
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
          message: '正在上传图片...',
          type: 'info',
          duration: 0
        })
        
        // 上传文件
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', 'articles') // 指定文章图片文件夹
        
        const response = await fetch('/api/files/upyun/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
        
        loadingMessage.close()
        
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data?.url) {
            // 确保使用HTTP协议
            const imageUrl = result.data.url.replace('https://', 'http://')
            // 插入图片到编辑器
            editor.value?.chain().focus().setImage({ src: imageUrl }).run()
            ElMessage.success('图片上传成功')
          } else {
            throw new Error(result.message || '上传失败')
          }
        } else {
          throw new Error('上传请求失败')
        }
      } catch (error) {
        console.error('图片上传失败:', error)
        ElMessage.error('图片上传失败: ' + error.message)
      }
    }
    
    input.click()
  }).catch((action) => {
    if (action === 'cancel') {
      // 选择从文件库选择
      imagePickerVisible.value = true
      loadImageList()
    } else if (action === 'close') {
      // 输入URL选项
      ElMessageBox.prompt('请输入图片URL', '插入图片', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputPattern: /^https?:\/\/.+/,
        inputErrorMessage: '请输入有效的图片URL'
      }).then(({ value }) => {
        if (value && editor.value) {
          editor.value.chain().focus().setImage({ src: value }).run()
        }
      }).catch(() => {
        // 用户取消，不显示错误
      })
    }
    // 如果是其他情况（如用户点击X关闭），不显示错误
  })
}

const addLink = () => {
  const previousUrl = editor.value?.getAttributes('link').href

  ElMessageBox.prompt('请输入链接URL', '插入链接', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputValue: previousUrl,
    inputPattern: /^https?:\/\/.+/,
    inputErrorMessage: '请输入有效的URL'
  }).then(({ value }) => {
    if (value && editor.value) {
      // 如果有选中文本，就给选中文本添加链接，否则插入链接文本
      if (value === '') {
        editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }

      editor.value.chain().focus().extendMarkRange('link').setLink({ href: value }).run()
    }
  }).catch(() => {
    // 用户取消
  })
}

onMounted(() => {
  if (props.modelValue && editor.value) {
    updatePreview(props.modelValue)
  }
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style scoped>
.tiptap-editor {
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-wrap: wrap;
  gap: 4px;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.toolbar-button:hover {
  background: #e6f7ff;
  color: #409eff;
}

.toolbar-button.is-active {
  background: #409eff;
  color: white;
}

.toolbar-button:disabled {
  color: #c0c4cc;
  cursor: not-allowed;
}

.toolbar-button:disabled:hover {
  background: transparent;
  color: #c0c4cc;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: #e4e7ed;
  margin: 0 8px;
}

.character-count {
  margin-left: auto;
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

.editor-content {
  min-height: 300px;
}

.editor-preview {
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.preview-content {
  padding: 16px;
  min-height: 200px;
}

/* 图片选择器样式 */
.image-picker-dialog {
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
    padding: 0;
  }

  .image-picker-content {
    max-height: 600px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: #f8fafc;
  }

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
  }

  .empty-state {
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
</style>

<style>
/* ProseMirror 编辑器样式 */
.ProseMirror {
  padding: 16px;
  outline: none;
  min-height: 300px;
  line-height: 1.6;
  font-size: 14px;
  color: #333;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #adb5bd;
  pointer-events: none;
  height: 0;
}

.ProseMirror h1,
.ProseMirror h2,
.ProseMirror h3,
.ProseMirror h4,
.ProseMirror h5,
.ProseMirror h6 {
  margin: 1.5em 0 0.5em;
  font-weight: 600;
  line-height: 1.3;
}

.ProseMirror h1 {
  font-size: 2em;
  border-bottom: 2px solid #eee;
  padding-bottom: 0.3em;
}

.ProseMirror h2 {
  font-size: 1.5em;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.3em;
}

.ProseMirror h3 {
  font-size: 1.25em;
}

.ProseMirror code {
  background: #f6f8fa;
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  color: #e83e8c;
}

.ProseMirror pre {
  background: #f6f8fa;
  border-radius: 6px;
  padding: 12px 16px;
  overflow-x: auto;
  margin: 1em 0;
}

.ProseMirror pre code {
  background: none;
  padding: 0;
  color: #333;
}

.ProseMirror blockquote {
  border-left: 4px solid #dfe2e5;
  margin: 1em 0;
  padding-left: 16px;
  color: #6a737d;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5em;
  margin: 1em 0;
}

.ProseMirror li {
  margin: 0.5em 0;
}

.ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin: 1em 0;
}

.ProseMirror .editor-link {
  color: #409eff;
  text-decoration: none;
}

.ProseMirror .editor-link:hover {
  text-decoration: underline;
}

/* 高亮语法 */
.ProseMirror .hljs {
  color: #333;
}

.ProseMirror .hljs-keyword,
.ProseMirror .hljs-selector-tag,
.ProseMirror .hljs-title,
.ProseMirror .hljs-section,
.ProseMirror .hljs-doctag,
.ProseMirror .hljs-name,
.ProseMirror .hljs-strong {
  font-weight: bold;
}

.ProseMirror .hljs-comment {
  color: #998;
  font-style: italic;
}

.ProseMirror .hljs-string,
.ProseMirror .hljs-title,
.ProseMirror .hljs-section,
.ProseMirror .hljs-built_in,
.ProseMirror .hljs-literal,
.ProseMirror .hljs-type,
.ProseMirror .hljs-addition,
.ProseMirror .hljs-tag,
.ProseMirror .hljs-quote,
.ProseMirror .hljs-name,
.ProseMirror .hljs-selector-id,
.ProseMirror .hljs-selector-class {
  color: #d14;
}

.ProseMirror .hljs-number,
.ProseMirror .hljs-symbol,
.ProseMirror .hljs-bullet,
.ProseMirror .hljs-link,
.ProseMirror .hljs-meta,
.ProseMirror .hljs-selector-attr,
.ProseMirror .hljs-selector-pseudo {
  color: #008080;
}
</style> 