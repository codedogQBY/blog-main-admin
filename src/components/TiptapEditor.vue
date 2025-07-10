<template>
  <div class="tiptap-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar" v-if="editor">
      <div class="toolbar-group">
        <button
          @click="editor.chain().focus().toggleBold().run()"
          :class="{ 'is-active': editor.isActive('bold') }"
          class="toolbar-button"
          title="粗体 (Ctrl+B)"
        >
          <el-icon><Bold /></el-icon>
        </button>
        <button
          @click="editor.chain().focus().toggleItalic().run()"
          :class="{ 'is-active': editor.isActive('italic') }"
          class="toolbar-button"
          title="斜体 (Ctrl+I)"
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
        <button
          @click="editor.chain().focus().toggleCode().run()"
          :class="{ 'is-active': editor.isActive('code') }"
          class="toolbar-button"
          title="行内代码"
        >
          <span style="font-family: monospace; font-weight: bold;">`</span>
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
          @click="editor.chain().focus().setHorizontalRule().run()"
          class="toolbar-button"
          title="水平分割线"
        >
          <span style="font-weight: bold;">---</span>
        </button>
        <el-select
          v-if="editor.isActive('codeBlock')"
          :model-value="getCurrentLanguage()"
          @change="setCodeBlockLanguage"
          size="small"
          class="language-select"
          placeholder="语言"
        >
          <el-option label="JavaScript" value="javascript" />
          <el-option label="TypeScript" value="typescript" />
          <el-option label="Python" value="python" />
          <el-option label="Java" value="java" />
          <el-option label="CSS" value="css" />
          <el-option label="HTML" value="html" />
          <el-option label="JSON" value="json" />
          <el-option label="SQL" value="sql" />
          <el-option label="Bash" value="bash" />
          <el-option label="Plain Text" value="text" />
        </el-select>
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

    <!-- 文件选择器 -->
    <FileSelector
      :visible="imagePickerVisible"
      @update:model-value="selectedImage = $event"
      @update:visible="imagePickerVisible = $event"
      title="选择图片"
      :multiple="false"
      fileType="image"
      :maxFiles="1"
      @select="handleImageSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, reactive } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
// 导入常用语言支持
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import css from 'highlight.js/lib/languages/css'
import html from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
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
import { fileApi } from '../lib/api'
import FileSelector, {type FileType} from './FileSelector.vue'

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

// 注册语言支持
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('java', java)
lowlight.register('css', css)
lowlight.register('html', html)
lowlight.register('json', json)
lowlight.register('sql', sql)
lowlight.register('bash', bash)

const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [
    StarterKit.configure({
      // 启用 Markdown 快捷键
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      // 支持 Markdown 语法
      blockquote: {},
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      listItem: {},
      codeBlock: {
        languageClassPrefix: 'language-',
      },
      code: {
        HTMLAttributes: {
          class: 'inline-code',
        },
      },
      horizontalRule: {},
    }),
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
      defaultLanguage: 'javascript',
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    emit('change', html)
    updatePreview(html)
  },
  // 添加键盘快捷键支持
  editorProps: {
    handleKeyDown: (view, event) => {
      // 支持 Markdown 语法快捷输入
      if (event.key === ' ') {
        const { state } = view
        const { selection } = state
        const { $from } = selection
        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
        
        // 检查 Markdown 语法
        if (textBefore === '#') {
          editor.value?.chain().focus().toggleHeading({ level: 1 }).run()
          return true
        } else if (textBefore === '##') {
          editor.value?.chain().focus().toggleHeading({ level: 2 }).run()
          return true
        } else if (textBefore === '###') {
          editor.value?.chain().focus().toggleHeading({ level: 3 }).run()
          return true
        } else if (textBefore === '>') {
          editor.value?.chain().focus().toggleBlockquote().run()
          return true
        } else if (textBefore === '-' || textBefore === '*') {
          editor.value?.chain().focus().toggleBulletList().run()
          return true
        } else if (/^\d+\./.test(textBefore)) {
          editor.value?.chain().focus().toggleOrderedList().run()
          return true
        } else if (textBefore === '```') {
          editor.value?.chain().focus().toggleCodeBlock().run()
          return true
        }
      }
      return false
    },
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
const selectedImage = ref('')

// 添加图片
const addImage = () => {
  imagePickerVisible.value = true
}

// 处理图片选择
const handleImageSelect = (file: FileType | FileType[]) => {
  if (file && editor.value) {
    editor.value.chain().focus().setImage({ src: (file as FileType).url }).run()
  }
}

// 获取当前代码块的语言
const getCurrentLanguage = () => {
  if (editor.value && editor.value.isActive('codeBlock')) {
    return editor.value.getAttributes('codeBlock').language || 'javascript'
  }
  return 'javascript'
}

// 设置代码块语言
const setCodeBlockLanguage = (language: string) => {
  if (editor.value && editor.value.isActive('codeBlock')) {
    editor.value.chain().focus().updateAttributes('codeBlock', { language }).run()
  }
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

<style scoped lang="scss">
/* 主编辑器容器 */
.tiptap-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;

  /* 工具栏 */
  .editor-toolbar {
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    background: #f8fafc;
    position: sticky;
    top: 0;
    z-index: 2;

    .toolbar-group {
      display: flex;
      align-items: center;
      gap: 4px;

      .toolbar-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border: none;
        background: transparent;
        border-radius: 6px;
        color: #64748b;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 15px;
        padding: 0;

        &:hover {
          background: #e2e8f0;
          color: #334155;
        }

        &.is-active {
          background: #e0e7ff;
          color: #4f46e5;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;

          &:hover {
            background: transparent;
          }
        }

        .el-icon {
          font-size: 18px;
        }
      }

      .language-select {
        width: 120px;
        margin-left: 4px;
      }
    }

    .toolbar-separator {
      width: 1px;
      height: 24px;
      background: #e2e8f0;
      margin: 0 4px;
    }

    .character-count {
      margin-left: auto;
      font-size: 13px;
      color: #64748b;
      white-space: nowrap;
    }
  }

  /* 编辑器内容区域 */
  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;

    :deep(.ProseMirror) {
      min-height: 500px;
      outline: none;
      font-size: 16px;
      line-height: 1.8;
      color: #334155;

      > * + * {
        margin-top: 1em;
      }

      p {
        margin: 1em 0;
      }

      h1 {
        font-size: 2.25em;
        font-weight: 700;
        line-height: 1.3;
        margin: 1.5em 0 0.5em;
        color: #1e293b;
      }

      h2 {
        font-size: 1.875em;
        font-weight: 600;
        line-height: 1.3;
        margin: 1.5em 0 0.5em;
        color: #1e293b;
      }

      h3 {
        font-size: 1.5em;
        font-weight: 600;
        line-height: 1.3;
        margin: 1.5em 0 0.5em;
        color: #1e293b;
      }

      ul, ol {
        padding-left: 1.5em;
        margin: 1em 0;

        li {
          margin: 0.5em 0;
        }
      }

      blockquote {
        border-left: 4px solid #4f46e5;
        padding-left: 1em;
        margin: 1.5em 0;
        color: #64748b;
        font-style: italic;
      }

      pre {
        background: #f8fafc;
        border-radius: 8px;
        padding: 16px;
        margin: 1.5em 0;
        overflow-x: auto;
        font-family: 'Fira Code', monospace;
        font-size: 0.9em;
        line-height: 1.6;

        code {
          background: none;
          padding: 0;
          border-radius: 0;
          color: inherit;
          font-size: inherit;
        }
      }

      code {
        background: #f1f5f9;
        padding: 0.2em 0.4em;
        border-radius: 4px;
        font-family: 'Fira Code', monospace;
        font-size: 0.9em;
        color: #4f46e5;
      }

      img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        margin: 1.5em 0;
      }

      hr {
        border: none;
        border-top: 2px solid #e2e8f0;
        margin: 2em 0;
      }

      a {
        color: #4f46e5;
        text-decoration: none;
        border-bottom: 1px dashed #4f46e5;
        transition: all 0.2s ease;

        &:hover {
          color: #6366f1;
          border-bottom-style: solid;
        }
      }

      &.resize-cursor {
        cursor: ew-resize;
      }

      &.ProseMirror-selectednode {
        outline: 2px solid #4f46e5;
        border-radius: 4px;
      }

      &.is-empty::before {
        content: attr(data-placeholder);
        float: left;
        color: #94a3b8;
        pointer-events: none;
        height: 0;
      }
    }
  }

  /* 预览区域 */
  .editor-preview {
    flex: 1;
    overflow-y: auto;
    padding: 24px 32px;
    background: white;

    .preview-content {
      max-width: 800px;
      margin: 0 auto;
    }
  }
}

/* 文件选择器样式 */
:deep(.file-selector-dialog) {
  .el-dialog {
    border-radius: 12px;
    overflow: hidden;
  }

  .el-dialog__header {
    margin: 0;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
  }

  .el-dialog__body {
    padding: 24px;
  }
}
</style> 