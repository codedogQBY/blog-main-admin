<template>
  <div class="tiptap-editor" :class="{ 'fullscreen': isFullscreen }">
    <!-- 工具栏 -->
    <TiptapEditorToolbar
      v-if="editor"
      :editor="editor"
      :isFullscreen="isFullscreen"
      :showSearchReplace="showSearchReplace"
      :searchText="searchText"
      :replaceText="replaceText"
      :searchMatches="searchMatches"
      :currentSearchIndex="currentSearchIndex"
      @insertTable="insertTable"
      @addImage="addImage"
      @addLink="addLink"
      @addYouTubeVideo="addYouTubeVideo"
      @showEmojiPicker="showEmojiPicker = true"
      @showMarkdownImport="showMarkdownImport"
      @toggleSearchReplace="showSearchReplace = !showSearchReplace"
      @toggleTableOfContents="showTableOfContents = !showTableOfContents"
      @toggleFullscreen="toggleFullscreen"
      @update:searchText="searchText = $event"
      @update:replaceText="replaceText = $event"
      @findNext="findNext"
      @findPrevious="findPrevious"
      @replaceOne="replaceOne"
      @replaceAll="replaceAll"
      @closeSearchReplace="showSearchReplace = false"
    />

    <!-- 主要内容区域 -->
    <div class="editor-main">
      <!-- 侧边栏：目录 -->
      <TiptapEditorTableOfContents
        :showTableOfContents="showTableOfContents"
        :tableOfContents="tableOfContents"
        @close="showTableOfContents = false"
        @scrollToHeading="scrollToHeading"
      />

      <!-- 编辑器内容 -->
      <div class="editor-content">
        <editor-content :editor="editor" />
        
        <!-- 表格右键菜单 -->
        <TiptapEditorTableContextMenu
          :visible="showTableContextMenu"
          :position="tableMenuPosition"
          :editor="editor"
          :canMergeCells="editor?.can().mergeCells() || false"
          :canSplitCell="editor?.can().splitCell() || false"
          @action="handleTableAction"
          @close="hideTableMenu"
        />
      </div>

      <!-- 预览模式 -->
      <div v-if="showPreview" class="editor-preview">
        <div class="preview-content" v-html="previewHtml"></div>
      </div>
    </div>

    <!-- 表情选择器 -->
    <TiptapEditorEmojiPicker
      :showEmojiPicker="showEmojiPicker"
      @close="showEmojiPicker = false"
      @insertEmoji="insertEmoji"
    />

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

    <!-- Markdown导入对话框 -->
    <el-dialog
      v-model="showMarkdownDialog"
      title="导入Markdown"
      width="60%"
      class="markdown-import-dialog"
    >
      <el-input
        v-model="markdownContent"
        type="textarea"
        :rows="15"
        placeholder="粘贴Markdown内容到这里..."
        style="font-family: 'Fira Code', monospace; font-size: 14px;"
      />
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showMarkdownDialog = false">取消</el-button>
          <el-button @click="clearMarkdownContent">清空</el-button>
          <el-button type="primary" @click="importMarkdown">导入</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import TiptapImage from '@tiptap/extension-image'
import TiptapLink from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import YouTube from '@tiptap/extension-youtube'
import { createLowlight } from 'lowlight'

// 导入常用语言支持
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import python from 'highlight.js/lib/languages/python'
import java from 'highlight.js/lib/languages/java'
import cpp from 'highlight.js/lib/languages/cpp'
import csharp from 'highlight.js/lib/languages/csharp'
import go from 'highlight.js/lib/languages/go'
import rust from 'highlight.js/lib/languages/rust'
import php from 'highlight.js/lib/languages/php'
import ruby from 'highlight.js/lib/languages/ruby'
import css from 'highlight.js/lib/languages/css'
import scss from 'highlight.js/lib/languages/scss'
import html from 'highlight.js/lib/languages/xml'
import vue from 'highlight.js/lib/languages/xml'
import jsx from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import powershell from 'highlight.js/lib/languages/powershell'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'

import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Minus, Trash2 } from 'lucide-vue-next'
import { fileApi } from '../../lib/api'
import FileSelector, {type FileType} from '../FileSelector.vue'

// 导入拆分的组件
import TiptapEditorToolbar from './TiptapEditorToolbar.vue'
import TiptapEditorTableOfContents from './TiptapEditorTableOfContents.vue'
import TiptapEditorEmojiPicker from './TiptapEditorEmojiPicker.vue'
import TiptapEditorTableContextMenu from './TiptapEditorTableContextMenu.vue'

// 导入工具函数
import { 
  parseMarkdownAndInsert, 
  findMatches, 
  updateTableOfContents as utilsUpdateTableOfContents 
} from './tiptap-utils'

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

// 状态变量
const isFullscreen = ref(false)
const showSearchReplace = ref(false)
const showTableOfContents = ref(false)
const showEmojiPicker = ref(false)
const searchText = ref('')
const replaceText = ref('')
const tableOfContents = ref<Array<{id: string, text: string, level: number}>>([])

// 搜索相关
const currentSearchIndex = ref(0)
const searchMatches = ref<Array<{from: number, to: number}>>([])

// 表格右键菜单
const showTableContextMenu = ref(false)
const tableMenuPosition = ref({ x: 0, y: 0 })

// 图片选择器相关
const imagePickerVisible = ref(false)
const selectedImage = ref('')

// Markdown导入相关
const showMarkdownDialog = ref(false)
const markdownContent = ref('')

// 创建 lowlight 实例并注册语言
const lowlight = createLowlight()
lowlight.register('javascript', javascript)
lowlight.register('typescript', typescript)
lowlight.register('python', python)
lowlight.register('java', java)
lowlight.register('cpp', cpp)
lowlight.register('csharp', csharp)
lowlight.register('go', go)
lowlight.register('rust', rust)
lowlight.register('php', php)
lowlight.register('ruby', ruby)
lowlight.register('css', css)
lowlight.register('scss', scss)
lowlight.register('html', html)
lowlight.register('vue', vue)
lowlight.register('jsx', jsx)
lowlight.register('json', json)
lowlight.register('xml', xml)
lowlight.register('sql', sql)
lowlight.register('bash', bash)
lowlight.register('powershell', powershell)
lowlight.register('dockerfile', dockerfile)
lowlight.register('yaml', yaml)
lowlight.register('markdown', markdown)

const editor = useEditor({
  content: props.modelValue,
  editable: !props.readonly,
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4, 5, 6] },
      blockquote: {},
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
      listItem: {},
      codeBlock: { languageClassPrefix: 'language-' },
      code: { HTMLAttributes: { class: 'inline-code' } },
      horizontalRule: {},
    }),
    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({ nested: true }),
    YouTube.configure({ controls: false, nocookie: true }),
    TiptapImage.configure({ inline: true, allowBase64: true }),
    TiptapLink.configure({
      openOnClick: false,
      HTMLAttributes: { class: 'editor-link' }
    }),
    Placeholder.configure({ placeholder: props.placeholder }),
    CharacterCount,
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: 'javascript',
      HTMLAttributes: { class: 'code-block-wrapper' }
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    emit('change', html)
    updatePreview(html)
    updateTableOfContents()
  },
  editorProps: {
    handlePaste: (view, event, slice) => {
      const clipboardData = event.clipboardData
      if (!clipboardData) return false
      
      const text = clipboardData.getData('text/plain')
      if (!text) return false
      
      const hasMarkdown = /^#{1,6}\s+|^\s*[-*+]\s+|^\s*\d+\.\s+|^\s*>\s+|^```|^\s*\|.*\|.*\||\*\*.*\*\*|~~.*~~|`[^`]+`|\[.*?\]\(.*?\)|^---+$|^===+$|^\s*- \[[x ]\]/m.test(text)
      
      if (hasMarkdown) {
        parseMarkdownAndInsert(text, editor.value, view)
        return true
      }
      
      return false
    },
    handleKeyDown: (view, event) => {
      // Markdown 语法快捷输入
      if (event.key === ' ') {
        const { state } = view
        const { selection } = state
        const { $from } = selection
        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
        
        // 处理各种 Markdown 语法
        const markdownPatterns = [
          { pattern: '######', action: () => editor.value?.chain().focus().deleteRange({ from: $from.pos - 6, to: $from.pos }).setHeading({ level: 6 }).run() },
          { pattern: '#####', action: () => editor.value?.chain().focus().deleteRange({ from: $from.pos - 5, to: $from.pos }).setHeading({ level: 5 }).run() },
          { pattern: '####', action: () => editor.value?.chain().focus().deleteRange({ from: $from.pos - 4, to: $from.pos }).setHeading({ level: 4 }).run() },
          { pattern: '###', action: () => editor.value?.chain().focus().deleteRange({ from: $from.pos - 3, to: $from.pos }).setHeading({ level: 3 }).run() },
          { pattern: '##', action: () => editor.value?.chain().focus().deleteRange({ from: $from.pos - 2, to: $from.pos }).setHeading({ level: 2 }).run() },
          { pattern: '#', action: () => editor.value?.chain().focus().deleteRange({ from: $from.pos - 1, to: $from.pos }).setHeading({ level: 1 }).run() },
          { pattern: '>', action: () => editor.value?.chain().focus().deleteRange({ from: $from.pos - 1, to: $from.pos }).setBlockquote().run() },
          { pattern: '```', action: () => editor.value?.chain().focus().deleteRange({ from: $from.pos - 3, to: $from.pos }).setCodeBlock().run() }
        ]
        
        for (const { pattern, action } of markdownPatterns) {
          if (textBefore === pattern) {
            action()
            return true
          }
        }
        
        // 处理列表
        if (textBefore === '-' || textBefore === '*') {
          editor.value?.chain().focus().deleteRange({ from: $from.pos - 1, to: $from.pos }).toggleBulletList().run()
          return true
        }
        
        // 处理任务列表
        if (textBefore === '- [ ]' || textBefore === '- [x]') {
          editor.value?.chain().focus().deleteRange({ from: $from.pos - textBefore.length, to: $from.pos }).toggleTaskList().run()
          return true
        }
        
        // 处理有序列表
        if (/^(\d+)\./.test(textBefore)) {
          const match = textBefore.match(/^(\d+)\./)
          if (match) {
            editor.value?.chain().focus().deleteRange({ from: $from.pos - match[0].length, to: $from.pos }).toggleOrderedList().run()
            return true
          }
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
    setTimeout(() => {
      updateTableOfContents()
    }, 100)
  }
})

// 监听只读状态
watch(() => props.readonly, (readonly) => {
  if (editor.value) {
    editor.value.setEditable(!readonly)
  }
})

// 监听搜索文本变化
watch(searchText, () => {
  if (searchText.value) {
    searchMatches.value = findMatches(searchText.value, editor.value)
    currentSearchIndex.value = 0
  } else {
    searchMatches.value = []
    currentSearchIndex.value = 0
  }
})

const updatePreview = (html: string) => {
  previewHtml.value = html
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

const insertTable = () => {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
}

const addImage = () => {
  imagePickerVisible.value = true
}

const handleImageSelect = (file: FileType | FileType[]) => {
  if (file && editor.value) {
    editor.value.chain().focus().setImage({ src: (file as FileType).url }).run()
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
      if (value === '') {
        editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }
      editor.value.chain().focus().extendMarkRange('link').setLink({ href: value }).run()
    }
  }).catch(() => {})
}

const addYouTubeVideo = () => {
  ElMessageBox.prompt('请输入YouTube视频URL', '插入视频', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/,
    inputErrorMessage: '请输入有效的YouTube URL'
  }).then(({ value }) => {
    if (value && editor.value) {
      editor.value.chain().focus().setYoutubeVideo({ src: value }).run()
    }
  }).catch(() => {})
}

const insertEmoji = (emoji: string) => {
  if (editor.value) {
    editor.value.chain().focus().insertContent(emoji).run()
  }
  showEmojiPicker.value = false
}

const showMarkdownImport = () => {
  showMarkdownDialog.value = true
}

const clearMarkdownContent = () => {
  markdownContent.value = ''
}

const importMarkdown = () => {
  if (markdownContent.value && editor.value) {
    editor.value.chain().focus().clearContent().run()
    parseMarkdownAndInsert(markdownContent.value, editor.value, editor.value.view)
    showMarkdownDialog.value = false
    markdownContent.value = ''
    ElMessage.success('Markdown导入成功！')
  }
}

// 搜索功能
const findNext = () => {
  if (!searchText.value || !editor.value) return
  
  if (searchMatches.value.length === 0) {
    searchMatches.value = findMatches(searchText.value, editor.value)
  }
  
  if (searchMatches.value.length === 0) {
    ElMessage.info('未找到匹配内容')
    return
  }
  
  const match = searchMatches.value[currentSearchIndex.value]
  editor.value.chain().focus().setTextSelection({ from: match.from, to: match.to }).run()
  
  const view = editor.value.view
  view.dispatch(view.state.tr.scrollIntoView())
  
  currentSearchIndex.value = (currentSearchIndex.value + 1) % searchMatches.value.length
  
  ElMessage.success(`找到 ${searchMatches.value.length} 个匹配项，当前第 ${currentSearchIndex.value === 0 ? searchMatches.value.length : currentSearchIndex.value} 个`)
}

const findPrevious = () => {
  if (!searchText.value || !editor.value) return
  
  if (searchMatches.value.length === 0) {
    searchMatches.value = findMatches(searchText.value, editor.value)
  }
  
  if (searchMatches.value.length === 0) {
    ElMessage.info('未找到匹配内容')
    return
  }
  
  currentSearchIndex.value = currentSearchIndex.value === 0 ? searchMatches.value.length - 1 : currentSearchIndex.value - 1
  
  const match = searchMatches.value[currentSearchIndex.value]
  editor.value.chain().focus().setTextSelection({ from: match.from, to: match.to }).run()
  
  const view = editor.value.view
  view.dispatch(view.state.tr.scrollIntoView())
  
  ElMessage.success(`找到 ${searchMatches.value.length} 个匹配项，当前第 ${currentSearchIndex.value + 1} 个`)
}

const replaceOne = () => {
  if (!editor.value || !searchText.value || searchMatches.value.length === 0) return
  
  const { from, to } = editor.value.state.selection
  const currentMatch = searchMatches.value[currentSearchIndex.value === 0 ? searchMatches.value.length - 1 : currentSearchIndex.value - 1]
  
  if (from === currentMatch.from && to === currentMatch.to) {
    editor.value.chain().focus().deleteSelection().insertContent(replaceText.value).run()
    
    setTimeout(() => {
      searchMatches.value = findMatches(searchText.value, editor.value)
      if (searchMatches.value.length > 0) {
        findNext()
      } else {
        ElMessage.success('替换完成，没有更多匹配项')
      }
    }, 100)
  } else {
    findNext()
  }
}

const replaceAll = () => {
  if (!editor.value || !searchText.value || searchMatches.value.length === 0) return
  
  const matches = [...searchMatches.value]
  let replaceCount = 0
  
  matches.reverse().forEach(match => {
    editor.value?.chain()
      .focus()
      .setTextSelection(match)
      .deleteSelection()
      .insertContent(replaceText.value)
      .run()
    replaceCount++
  })
  
  searchMatches.value = []
  currentSearchIndex.value = 0
  
  if (replaceCount > 0) {
    ElMessage.success(`已替换 ${replaceCount} 处`)
  } else {
    ElMessage.info('未找到匹配内容')
  }
}

// 目录功能
const updateTableOfContents = () => {
  if (!editor.value) return
  
  tableOfContents.value = utilsUpdateTableOfContents(editor.value)
}

const scrollToHeading = (id: string) => {
  if (!editor.value) return
  
  const parts = id.split('-')
  const headingText = parts.slice(1, -1).join('-').toLowerCase()
  
  const doc = editor.value.state.doc
  let targetPos = null
  
  doc.descendants((node: any, pos: number) => {
    if (node.type.name === 'heading' && node.textContent.toLowerCase().replace(/\s+/g, '-') === headingText) {
      targetPos = pos
      return false
    }
  })
  
  if (targetPos !== null) {
    const view = editor.value.view
    const coords = view.coordsAtPos(targetPos)
    
    const editorContainer = view.dom.closest('.editor-content')
    if (editorContainer && coords) {
      const containerRect = editorContainer.getBoundingClientRect()
      const scrollTop = editorContainer.scrollTop + coords.top - containerRect.top - 100
      editorContainer.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
    
    const tr = view.state.tr.scrollIntoView()
    view.dispatch(tr)
    view.focus()
  } else {
    const editorElement = editor.value.view.dom
    const headings = editorElement.querySelectorAll('h1, h2, h3, h4, h5, h6')
    
    for (const heading of headings) {
      if (heading.textContent && heading.textContent.toLowerCase().replace(/\s+/g, '-') === headingText) {
        heading.scrollIntoView({ behavior: 'smooth', block: 'start' })
        break
      }
    }
  }
}

// 表格右键菜单功能
const hideTableMenu = () => {
  showTableContextMenu.value = false
}

const handleTableAction = (action: string) => {
  if (!editor.value) return
  
  const actions: { [key: string]: () => void } = {
    addColumnBefore: () => editor.value?.chain().focus().addColumnBefore().run(),
    addColumnAfter: () => editor.value?.chain().focus().addColumnAfter().run(),
    deleteColumn: () => editor.value?.chain().focus().deleteColumn().run(),
    addRowBefore: () => editor.value?.chain().focus().addRowBefore().run(),
    addRowAfter: () => editor.value?.chain().focus().addRowAfter().run(),
    deleteRow: () => editor.value?.chain().focus().deleteRow().run(),
    mergeCells: () => editor.value?.can().mergeCells() && editor.value?.chain().focus().mergeCells().run(),
    splitCell: () => editor.value?.can().splitCell() && editor.value?.chain().focus().splitCell().run(),
    toggleHeaderRow: () => editor.value?.chain().focus().toggleHeaderRow().run(),
    toggleHeaderColumn: () => editor.value?.chain().focus().toggleHeaderColumn().run(),
    deleteTable: () => editor.value?.chain().focus().deleteTable().run()
  }
  
  actions[action]?.()
}

const handleGlobalClick = () => {
  hideTableMenu()
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  
  // 延迟一点时间等待编辑器初始化完成
  setTimeout(() => {
    if (editor.value) {
      const editorElement = editor.value.view.dom
      editorElement.addEventListener('contextmenu', (e) => {
        const target = e.target as HTMLElement
        const tableCell = target.closest('td, th')
        
        if (tableCell && editor.value?.isActive('table')) {
          e.preventDefault()
          
          tableMenuPosition.value = {
            x: e.clientX,
            y: e.clientY
          }
          showTableContextMenu.value = true
        }
      })
      
      // 初始化目录
      if (props.modelValue) {
        updatePreview(props.modelValue)
        // 确保编辑器内容已渲染再更新目录
        setTimeout(() => {
          updateTableOfContents()
        }, 200)
      } else {
        // 即使没有初始内容也要初始化目录
        updateTableOfContents()
      }
    }
  }, 100)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick)
  
  if (editor.value) {
    editor.value.destroy()
  }
  
  if (isFullscreen.value) {
    document.body.style.overflow = ''
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
  position: relative;

  &.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    border-radius: 0;
    height: 100vh;
  }

  /* 主要内容区域 */
  .editor-main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* 编辑器内容区域 */
  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 24px;

    :deep(.ProseMirror) {
      min-height: 400px;
      outline: none;
      font-size: 16px;
      line-height: 1.8;
      color: #334155;
      padding-top: 0;

      > * + * {
        margin-top: 0.5em;
      }

      > *:first-child {
        margin-top: 0;
      }

      p {
        margin: 0.4em 0;
      }

      h1 {
        font-size: 2.25em;
        font-weight: 700;
        line-height: 1.3;
        margin: 0.8em 0 0.3em;
        color: #1e293b;
      }

      h2 {
        font-size: 1.875em;
        font-weight: 600;
        line-height: 1.3;
        margin: 0.8em 0 0.3em;
        color: #1e293b;
      }

      h3 {
        font-size: 1.5em;
        font-weight: 600;
        line-height: 1.3;
        margin: 0.8em 0 0.3em;
        color: #1e293b;
      }

      ul, ol {
        padding-left: 1.5em;
        margin: 0.6em 0;

        li {
          margin: 0.3em 0;
        }
      }

      /* 任务列表样式 */
      ul[data-type="taskList"] {
        list-style: none;
        padding-left: 0;

        li {
          display: flex;
          align-items: center;
          margin: 0.3em 0;

          > label {
            flex: 0 0 auto;
            margin-right: 0.5em;
            user-select: none;
            display: flex;
            align-items: center;
          }

          > div {
            flex: 1 1 auto;
            line-height: 1.5;
          }

          input[type="checkbox"] {
            margin: 0;
            vertical-align: middle;
          }
        }

        li[data-checked="true"] > div {
          text-decoration: line-through;
          color: #9ca3af;
        }
      }

      /* 表格样式 */
      table {
        border-collapse: collapse;
        margin: 1.5em 0;
        table-layout: fixed;
        width: 100%;

        td, th {
          border: 1px solid #d1d5db;
          padding: 8px 12px;
          text-align: left;
          vertical-align: top;
          position: relative;
          min-width: 1em;

          > * {
            margin: 0;
          }
        }

        th {
          background: #f9fafb;
          font-weight: 600;
        }

        .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }

        .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background: #4f46e5;
          pointer-events: none;
          opacity: 0;
        }

        .tableWrapper {
          overflow-x: auto;
        }

        &.resize-cursor {
          cursor: ew-resize;
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
        background: #1e293b;
        border-radius: 12px;
        padding: 20px;
        margin: 1.5em 0;
        overflow-x: auto;
        font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
        font-size: 0.9em;
        line-height: 1.6;
        position: relative;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

        code {
          background: none;
          padding: 0;
          border-radius: 0;
          color: #e2e8f0;
          font-size: inherit;
          font-family: inherit;
          display: block;
          white-space: pre;
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

      .iframe-wrapper {
        text-align: center;
        margin: 2em 0;

        iframe {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

/* Markdown导入对话框样式 */
.markdown-import-dialog {
  .el-dialog__body {
    padding: 20px;
  }
  
  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
}
</style>