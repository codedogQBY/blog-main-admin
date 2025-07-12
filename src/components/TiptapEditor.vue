<template>
  <div class="tiptap-editor" :class="{ 'fullscreen': isFullscreen }">
    <!-- 工具栏 -->
    <div class="editor-toolbar" v-if="editor">
      <!-- 第一行工具栏 -->
      <div class="toolbar-row">
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
            @click="editor.chain().focus().toggleTaskList().run()"
            :class="{ 'is-active': editor.isActive('taskList') }"
            class="toolbar-button"
            title="任务列表"
          >
            <el-icon><CheckSquare /></el-icon>
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
            @click="insertTable"
            class="toolbar-button"
            title="插入表格"
          >
            <el-icon><Grid3X3 /></el-icon>
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().addColumnBefore().run()"
            class="toolbar-button"
            title="向前插入列"
          >
            <el-icon><Plus /></el-icon>←列
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().addColumnAfter().run()"
            class="toolbar-button"
            title="向后插入列"
          >
            <el-icon><Plus /></el-icon>列→
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().deleteColumn().run()"
            class="toolbar-button"
            title="删除列"
          >
            <el-icon><Minus /></el-icon>列
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().addRowBefore().run()"
            class="toolbar-button"
            title="向前插入行"
          >
            <el-icon><Plus /></el-icon>↑行
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().addRowAfter().run()"
            class="toolbar-button"
            title="向后插入行"
          >
            <el-icon><Plus /></el-icon>行↓
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().deleteRow().run()"
            class="toolbar-button"
            title="删除行"
          >
            <el-icon><Minus /></el-icon>行
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().mergeCells().run()"
            :disabled="!editor.can().mergeCells()"
            class="toolbar-button"
            title="合并单元格"
          >
            <span style="font-size: 12px; font-weight: bold;">合并</span>
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().splitCell().run()"
            :disabled="!editor.can().splitCell()"
            class="toolbar-button"
            title="拆分单元格"
          >
            <span style="font-size: 12px; font-weight: bold;">拆分</span>
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().toggleHeaderRow().run()"
            class="toolbar-button"
            title="切换表头行"
          >
            <span style="font-size: 12px; font-weight: bold;">表头</span>
          </button>
          <button
            v-if="editor.isActive('table')"
            @click="editor.chain().focus().deleteTable().run()"
            class="toolbar-button"
            title="删除表格"
          >
            <el-icon><Trash2 /></el-icon>
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
            placeholder="选择语言"
            filterable
          >
            <el-option label="JavaScript" value="javascript" />
            <el-option label="TypeScript" value="typescript" />
            <el-option label="Python" value="python" />
            <el-option label="Java" value="java" />
            <el-option label="C++" value="cpp" />
            <el-option label="C#" value="csharp" />
            <el-option label="Go" value="go" />
            <el-option label="Rust" value="rust" />
            <el-option label="PHP" value="php" />
            <el-option label="Ruby" value="ruby" />
            <el-option label="CSS" value="css" />
            <el-option label="SCSS" value="scss" />
            <el-option label="HTML" value="html" />
            <el-option label="Vue" value="vue" />
            <el-option label="React (JSX)" value="jsx" />
            <el-option label="JSON" value="json" />
            <el-option label="XML" value="xml" />
            <el-option label="SQL" value="sql" />
            <el-option label="Bash" value="bash" />
            <el-option label="PowerShell" value="powershell" />
            <el-option label="Dockerfile" value="dockerfile" />
            <el-option label="YAML" value="yaml" />
            <el-option label="Markdown" value="markdown" />
            <el-option label="纯文本" value="text" />
          </el-select>
        </div>

        <div class="toolbar-separator"></div>

        <div class="toolbar-group">
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
          <button
            @click="addYouTubeVideo"
            class="toolbar-button"
            title="插入YouTube视频"
          >
            <el-icon><Video /></el-icon>
          </button>
          <button
            @click="showEmojiPicker = !showEmojiPicker"
            class="toolbar-button"
            title="插入表情"
          >
            😊
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

        <div class="toolbar-separator"></div>

        <div class="toolbar-group">
          <button
            @click="showSearchReplace = !showSearchReplace"
            class="toolbar-button"
            title="搜索替换"
          >
            <el-icon><Search /></el-icon>
          </button>
          <button
            @click="showTableOfContents = !showTableOfContents"
            class="toolbar-button"
            title="目录"
          >
            <el-icon><BookOpen /></el-icon>
          </button>
          <button
            @click="toggleFullscreen"
            class="toolbar-button"
            title="全屏模式"
          >
            <el-icon><Maximize2 v-if="!isFullscreen" /><Minimize2 v-else /></el-icon>
          </button>
        </div>

        <!-- 字数统计 -->
        <div class="character-count" v-if="editor">
          {{ editor.storage.characterCount.characters() }} 字符
          {{ editor.storage.characterCount.words() }} 单词
        </div>
      </div>

      <!-- 搜索替换栏 -->
      <div v-if="showSearchReplace" class="search-replace-bar">
        <div class="search-replace-group">
          <el-input
            v-model="searchText"
            placeholder="搜索..."
            size="small"
            class="search-input"
            @keyup.enter="findNext"
          >
            <template #append>
              <el-button @click="findPrevious" size="small">上一个</el-button>
              <el-button @click="findNext" size="small" type="primary">下一个</el-button>
            </template>
          </el-input>
          <span v-if="searchMatches.length > 0" class="search-count">
            {{ (currentSearchIndex === 0 && searchMatches.length > 0) ? searchMatches.length : currentSearchIndex }}/{{ searchMatches.length }}
          </span>
          <el-input
            v-model="replaceText"
            placeholder="替换为..."
            size="small"
            class="replace-input"
          >
            <template #append>
              <el-button @click="replaceOne" size="small">替换</el-button>
            </template>
          </el-input>
          <el-button @click="replaceAll" size="small" type="primary">全部替换</el-button>
          <el-button @click="showSearchReplace = false" size="small">
            <el-icon><X /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="editor-main">
      <!-- 侧边栏：目录 -->
      <div v-if="showTableOfContents" class="table-of-contents">
        <div class="toc-header">
          <h4>目录</h4>
          <el-button @click="showTableOfContents = false" size="small" text>
            <el-icon><X /></el-icon>
          </el-button>
        </div>
        <div class="toc-content">
          <div 
            v-for="item in tableOfContents" 
            :key="item.id"
            :class="['toc-item', `toc-level-${item.level}`]"
            @click="scrollToHeading(item.id)"
          >
            {{ item.text }}
          </div>
        </div>
      </div>

      <!-- 编辑器内容 -->
      <div class="editor-content">
        <editor-content :editor="editor" />
        
        <!-- 表格右键菜单 -->
        <div 
          v-if="showTableContextMenu" 
          class="table-context-menu"
          :style="{ top: tableMenuPosition.y + 'px', left: tableMenuPosition.x + 'px' }"
          @click.stop
        >
          <div class="context-menu-item" @click="editor?.chain().focus().addColumnBefore().run(); hideTableMenu()">
            <el-icon><Plus /></el-icon>
            <span>向前插入列</span>
          </div>
          <div class="context-menu-item" @click="editor?.chain().focus().addColumnAfter().run(); hideTableMenu()">
            <el-icon><Plus /></el-icon>
            <span>向后插入列</span>
          </div>
          <div class="context-menu-item" @click="editor?.chain().focus().deleteColumn().run(); hideTableMenu()">
            <el-icon><Minus /></el-icon>
            <span>删除列</span>
          </div>
          <div class="context-menu-separator"></div>
          <div class="context-menu-item" @click="editor?.chain().focus().addRowBefore().run(); hideTableMenu()">
            <el-icon><Plus /></el-icon>
            <span>向前插入行</span>
          </div>
          <div class="context-menu-item" @click="editor?.chain().focus().addRowAfter().run(); hideTableMenu()">
            <el-icon><Plus /></el-icon>
            <span>向后插入行</span>
          </div>
          <div class="context-menu-item" @click="editor?.chain().focus().deleteRow().run(); hideTableMenu()">
            <el-icon><Minus /></el-icon>
            <span>删除行</span>
          </div>
          <div class="context-menu-separator"></div>
          <div 
            class="context-menu-item" 
            :class="{ disabled: !editor?.can().mergeCells() }"
            @click="editor?.can().mergeCells() && editor?.chain().focus().mergeCells().run(); hideTableMenu()"
          >
            <span>🔗</span>
            <span>合并单元格</span>
          </div>
          <div 
            class="context-menu-item"
            :class="{ disabled: !editor?.can().splitCell() }"
            @click="editor?.can().splitCell() && editor?.chain().focus().splitCell().run(); hideTableMenu()"
          >
            <span>✂️</span>
            <span>拆分单元格</span>
          </div>
          <div class="context-menu-separator"></div>
          <div class="context-menu-item" @click="editor?.chain().focus().toggleHeaderRow().run(); hideTableMenu()">
            <span>📋</span>
            <span>切换表头行</span>
          </div>
          <div class="context-menu-item" @click="editor?.chain().focus().toggleHeaderColumn().run(); hideTableMenu()">
            <span>📋</span>
            <span>切换表头列</span>
          </div>
          <div class="context-menu-separator"></div>
          <div class="context-menu-item danger" @click="editor?.chain().focus().deleteTable().run(); hideTableMenu()">
            <el-icon><Trash2 /></el-icon>
            <span>删除表格</span>
          </div>
        </div>
      </div>

      <!-- 预览模式 -->
      <div v-if="showPreview" class="editor-preview">
        <div class="preview-content" v-html="previewHtml"></div>
      </div>
    </div>

    <!-- 表情选择器 -->
    <div v-if="showEmojiPicker" class="emoji-picker-overlay" @click="showEmojiPicker = false">
      <div class="emoji-picker" @click.stop>
        <div class="emoji-grid">
          <span 
            v-for="emoji in commonEmojis" 
            :key="emoji"
            @click="insertEmoji(emoji)"
            class="emoji-item"
          >
            {{ emoji }}
          </span>
        </div>
      </div>
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
import vue from 'highlight.js/lib/languages/xml' // Vue使用XML语法高亮
import jsx from 'highlight.js/lib/languages/javascript' // JSX使用JavaScript语法高亮
import json from 'highlight.js/lib/languages/json'
import xml from 'highlight.js/lib/languages/xml'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'
import powershell from 'highlight.js/lib/languages/powershell'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
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
  Strikethrough,
  CheckSquare,
  Grid3X3,
  Plus,
  Minus,
  Trash2,
  Video,
  Search,
  BookOpen,
  Maximize2,
  Minimize2,
  X
} from 'lucide-vue-next'
import {
  Search as ElSearch,
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

// 新增状态
const isFullscreen = ref(false)
const showSearchReplace = ref(false)
const showTableOfContents = ref(false)
const showEmojiPicker = ref(false)
const searchText = ref('')
const replaceText = ref('')
const tableOfContents = ref<Array<{id: string, text: string, level: number}>>([])

// 常用表情
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
  '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
  '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
  '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
  '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
  '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
  '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐', '✋', '🖖', '👏',
  '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵',
  '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀',
  '👁', '👅', '👄', '💋', '🩸', '👶', '🧒', '👦', '👧', '🧑'
]

// 创建 lowlight 实例
const lowlight = createLowlight()

// 注册语言支持
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
    Table.configure({
      resizable: true,
    }),
    TableRow,
    TableHeader,
    TableCell,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    YouTube.configure({
      controls: false,
      nocookie: true,
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
      HTMLAttributes: {
        class: 'code-block-wrapper',
      },
    }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    emit('update:modelValue', html)
    emit('change', html)
    updatePreview(html)
    updateTableOfContents()
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
        
        // 检查 Markdown 语法并删除标记字符
        if (textBefore === '#') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 1, to: $from.pos })
            .setHeading({ level: 1 })
            .run()
          return true
        } else if (textBefore === '##') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 2, to: $from.pos })
            .setHeading({ level: 2 })
            .run()
          return true
        } else if (textBefore === '###') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 3, to: $from.pos })
            .setHeading({ level: 3 })
            .run()
          return true
        } else if (textBefore === '####') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 4, to: $from.pos })
            .setHeading({ level: 4 })
            .run()
          return true
        } else if (textBefore === '#####') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 5, to: $from.pos })
            .setHeading({ level: 5 })
            .run()
          return true
        } else if (textBefore === '######') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 6, to: $from.pos })
            .setHeading({ level: 6 })
            .run()
          return true
        } else if (textBefore === '>') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 1, to: $from.pos })
            .setBlockquote()
            .run()
          return true
        } else if (textBefore === '-' || textBefore === '*') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 1, to: $from.pos })
            .toggleBulletList()
            .run()
          return true
        } else if (textBefore === '- [ ]' || textBefore === '- [x]') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - textBefore.length, to: $from.pos })
            .toggleTaskList()
            .run()
          return true
        } else if (/^(\d+)\./.test(textBefore)) {
          const match = textBefore.match(/^(\d+)\./)
          if (match) {
            editor.value?.chain().focus()
              .deleteRange({ from: $from.pos - match[0].length, to: $from.pos })
              .toggleOrderedList()
              .run()
            return true
          }
        } else if (textBefore === '```') {
          editor.value?.chain().focus()
            .deleteRange({ from: $from.pos - 3, to: $from.pos })
            .setCodeBlock()
            .run()
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
    // 内容变化后更新目录
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

const updatePreview = (html: string) => {
  previewHtml.value = html
}

// 全屏模式
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  if (isFullscreen.value) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}

// 表格相关功能
const insertTable = () => {
  editor.value?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
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

// 添加链接
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

// 添加YouTube视频
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
  }).catch(() => {
    // 用户取消
  })
}

// 插入表情
const insertEmoji = (emoji: string) => {
  if (editor.value) {
    editor.value.chain().focus().insertContent(emoji).run()
  }
  showEmojiPicker.value = false
}

// 搜索替换功能 - 完全重写
const currentSearchIndex = ref(0)
const searchMatches = ref<Array<{from: number, to: number}>>([])

// 表格右键菜单
const showTableContextMenu = ref(false)
const tableMenuPosition = ref({ x: 0, y: 0 })

const findMatches = () => {
  searchMatches.value = []
  currentSearchIndex.value = 0
  
  if (!searchText.value || !editor.value) return
  
  const { state } = editor.value
  const { doc } = state
  const searchValue = searchText.value.toLowerCase()
  
  // 遍历所有文本节点查找匹配
  doc.descendants((node, pos) => {
    if (node.isText && node.text) {
      const text = node.text.toLowerCase()
      let searchIndex = 0
      let index = text.indexOf(searchValue, searchIndex)
      
      while (index !== -1) {
        searchMatches.value.push({
          from: pos + index,
          to: pos + index + searchText.value.length
        })
        searchIndex = index + 1
        index = text.indexOf(searchValue, searchIndex)
      }
    }
  })
}

const findNext = () => {
  if (!searchText.value || !editor.value) return
  
  // 如果还没有搜索过，先搜索
  if (searchMatches.value.length === 0) {
    findMatches()
  }
  
  if (searchMatches.value.length === 0) {
    ElMessage.info('未找到匹配内容')
    return
  }
  
  // 选择当前匹配项
  const match = searchMatches.value[currentSearchIndex.value]
  editor.value.chain().focus().setTextSelection({ from: match.from, to: match.to }).run()
  
  // 滚动到选中位置
  const view = editor.value.view
  view.dispatch(view.state.tr.scrollIntoView())
  
  // 更新索引到下一个
  currentSearchIndex.value = (currentSearchIndex.value + 1) % searchMatches.value.length
  
  ElMessage.success(`找到 ${searchMatches.value.length} 个匹配项，当前第 ${currentSearchIndex.value === 0 ? searchMatches.value.length : currentSearchIndex.value} 个`)
}

const findPrevious = () => {
  if (!searchText.value || !editor.value) return
  
  // 如果还没有搜索过，先搜索
  if (searchMatches.value.length === 0) {
    findMatches()
  }
  
  if (searchMatches.value.length === 0) {
    ElMessage.info('未找到匹配内容')
    return
  }
  
  // 更新索引到上一个
  currentSearchIndex.value = currentSearchIndex.value === 0 ? searchMatches.value.length - 1 : currentSearchIndex.value - 1
  
  // 选择当前匹配项
  const match = searchMatches.value[currentSearchIndex.value]
  editor.value.chain().focus().setTextSelection({ from: match.from, to: match.to }).run()
  
  // 滚动到选中位置
  const view = editor.value.view
  view.dispatch(view.state.tr.scrollIntoView())
  
  ElMessage.success(`找到 ${searchMatches.value.length} 个匹配项，当前第 ${currentSearchIndex.value + 1} 个`)
}

// 监听搜索文本变化
watch(searchText, () => {
  if (searchText.value) {
    findMatches()
  } else {
    searchMatches.value = []
    currentSearchIndex.value = 0
  }
})

// 表格右键菜单功能
const hideTableMenu = () => {
  showTableContextMenu.value = false
}

// 点击其他地方隐藏菜单
const handleGlobalClick = () => {
  hideTableMenu()
}

onMounted(() => {
  document.addEventListener('click', handleGlobalClick)
  
  // 添加表格右键菜单事件监听
  if (editor.value) {
    const editorElement = editor.value.view.dom
    editorElement.addEventListener('contextmenu', (e) => {
      // 检查是否在表格内
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
      // 延迟一点更新目录，确保编辑器内容已渲染
      setTimeout(() => {
        updateTableOfContents()
      }, 100)
    }
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleGlobalClick)
  
  if (editor.value) {
    editor.value.destroy()
  }
  // 恢复body滚动
  if (isFullscreen.value) {
    document.body.style.overflow = ''
  }
})

const replaceOne = () => {
  if (!editor.value || !searchText.value || searchMatches.value.length === 0) return
  
  const { from, to } = editor.value.state.selection
  const currentMatch = searchMatches.value[currentSearchIndex.value === 0 ? searchMatches.value.length - 1 : currentSearchIndex.value - 1]
  
  // 检查当前选中内容是否是搜索匹配项
  if (from === currentMatch.from && to === currentMatch.to) {
    editor.value.chain().focus().deleteSelection().insertContent(replaceText.value).run()
    
    // 重新查找匹配项（因为文档内容已改变）
    setTimeout(() => {
      findMatches()
      if (searchMatches.value.length > 0) {
        // 如果还有匹配项，继续查找下一个
        findNext()
      } else {
        ElMessage.success('替换完成，没有更多匹配项')
      }
    }, 100)
  } else {
    // 如果当前选中内容不是匹配项，则查找下一个
    findNext()
  }
}

const replaceAll = () => {
  if (!editor.value || !searchText.value || searchMatches.value.length === 0) return
  
  const matches = [...searchMatches.value]
  let replaceCount = 0
  
  // 从后往前替换，避免位置偏移
  matches.reverse().forEach(match => {
    editor.value?.chain()
      .focus()
      .setTextSelection(match)
      .deleteSelection()
      .insertContent(replaceText.value)
      .run()
    replaceCount++
  })
  
  // 清空搜索结果
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
  
  const toc: Array<{id: string, text: string, level: number}> = []
  const doc = editor.value.state.doc
  
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const text = node.textContent
      const level = node.attrs.level
      // 创建更简单的ID
      const id = `heading-${text.replace(/\s+/g, '-').toLowerCase()}-${pos}`
      
      toc.push({ id, text, level })
    }
  })
  
  tableOfContents.value = toc
}

const scrollToHeading = (id: string) => {
  if (!editor.value) return
  
  // 从ID中提取文本内容
  const parts = id.split('-')
  const headingText = parts.slice(1, -1).join('-').toLowerCase()
  
  // 在编辑器内容中查找对应的标题
  const doc = editor.value.state.doc
  let targetPos = null
  
  doc.descendants((node, pos) => {
    if (node.type.name === 'heading' && node.textContent.toLowerCase().replace(/\s+/g, '-') === headingText) {
      targetPos = pos
      return false // 停止搜索
    }
  })
  
  if (targetPos !== null) {
    // 滚动到编辑器中的位置
    const view = editor.value.view
    const resolvedPos = view.state.doc.resolve(targetPos)
    const coords = view.coordsAtPos(targetPos)
    
    // 滚动编辑器容器
    const editorContainer = view.dom.closest('.editor-content')
    if (editorContainer && coords) {
      const containerRect = editorContainer.getBoundingClientRect()
      const scrollTop = editorContainer.scrollTop + coords.top - containerRect.top - 100
      editorContainer.scrollTo({ top: scrollTop, behavior: 'smooth' })
    }
    
    // 滚动到指定位置
    const tr = view.state.tr.scrollIntoView()
    view.dispatch(tr)
    view.focus()
  } else {
    // 降级方案：直接查找DOM元素
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

  /* 工具栏 */
  .editor-toolbar {
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
    position: sticky;
    top: 0;
    z-index: 2;

    .toolbar-row {
      padding: 8px 16px; /* 减少了顶部间距 */
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      min-height: 48px; /* 固定高度 */

      .toolbar-group {
        display: flex;
        align-items: center;
        gap: 4px;

        .toolbar-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          border-radius: 6px;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
          padding: 0 8px;
          white-space: nowrap;

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
            font-size: 16px;
          }
        }

        .language-select {
          width: 140px;
          margin-left: 8px;
          
          :deep(.el-input__inner) {
            font-size: 13px;
          }
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

    /* 搜索替换栏 */
    .search-replace-bar {
      padding: 8px 16px;
      border-top: 1px solid #e2e8f0;
      background: #f1f5f9;

      .search-replace-group {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;

        .search-input,
        .replace-input {
          width: 200px;
        }
        
        .search-count {
          font-size: 12px;
          color: #666;
          padding: 4px 8px;
          background: #f0f0f0;
          border-radius: 4px;
          white-space: nowrap;
        }
      }
    }
  }

  /* 主要内容区域 */
  .editor-main {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  /* 目录侧边栏 */
  .table-of-contents {
    width: 250px;
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
    overflow-y: auto;

    .toc-header {
      padding: 16px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;

      h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
      }
    }

    .toc-content {
      padding: 8px;

      .toc-item {
        padding: 6px 12px;
        font-size: 13px;
        color: #64748b;
        cursor: pointer;
        border-radius: 4px;
        transition: all 0.2s ease;
        border-left: 2px solid transparent;

        &:hover {
          background: #e2e8f0;
          color: #374151;
        }

        &.toc-level-1 {
          font-weight: 600;
          color: #374151;
        }

        &.toc-level-2 {
          padding-left: 20px;
          font-weight: 500;
        }

        &.toc-level-3 {
          padding-left: 28px;
        }

        &.toc-level-4 {
          padding-left: 36px;
        }

        &.toc-level-5 {
          padding-left: 44px;
        }

        &.toc-level-6 {
          padding-left: 52px;
        }
      }
    }
  }

  /* 编辑器内容区域 */
  .editor-content {
    flex: 1;
    overflow-y: auto;
    padding: 8px 24px; /* 大幅减少顶部间距 */

    :deep(.ProseMirror) {
      min-height: 400px; /* 减少了最小高度 */
      outline: none;
      font-size: 16px;
      line-height: 1.8;
      color: #334155;
      padding-top: 0; /* 移除编辑器内部顶部间距 */

      > * + * {
        margin-top: 1em;
      }

      > *:first-child {
        margin-top: 0; /* 第一个元素顶部无间距 */
      }

      p {
        margin: 0.8em 0; /* 减少了段落间距 */
      }

      h1 {
        font-size: 2.25em;
        font-weight: 700;
        line-height: 1.3;
        margin: 1.2em 0 0.4em; /* 减少了标题间距 */
        color: #1e293b;
      }

      h2 {
        font-size: 1.875em;
        font-weight: 600;
        line-height: 1.3;
        margin: 1.2em 0 0.4em;
        color: #1e293b;
      }

      h3 {
        font-size: 1.5em;
        font-weight: 600;
        line-height: 1.3;
        margin: 1.2em 0 0.4em;
        color: #1e293b;
      }

      ul, ol {
        padding-left: 1.5em;
        margin: 1em 0;

        li {
          margin: 0.5em 0;
        }
      }

      /* 任务列表样式 */
      ul[data-type="taskList"] {
        list-style: none;
        padding-left: 0;

        li {
          display: flex;
          align-items: flex-start;
          margin: 0.5em 0;

          > label {
            flex: 0 0 auto;
            margin-right: 0.5em;
            user-select: none;
          }

          > div {
            flex: 1 1 auto;
          }

          input[type="checkbox"] {
            margin: 0;
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

        &::before {
          content: attr(data-language);
          position: absolute;
          top: 12px;
          right: 16px;
          font-size: 0.75em;
          color: #64748b;
          background: #334155;
          padding: 4px 8px;
          border-radius: 4px;
          text-transform: uppercase;
          font-weight: 500;
          z-index: 1;
        }

        code {
          background: none;
          padding: 0;
          border-radius: 0;
          color: #e2e8f0;
          font-size: inherit;
          font-family: inherit;
          display: block;
          white-space: pre;

          // 语法高亮样式 - Material Theme
          .hljs-keyword,
          .hljs-built_in {
            color: #c792ea;
            font-weight: 500;
          }
          
          .hljs-string,
          .hljs-template-string {
            color: #c3e88d;
          }
          
          .hljs-number,
          .hljs-literal {
            color: #fd9170;
          }
          
          .hljs-comment {
            color: #546e7a;
            font-style: italic;
          }
          
          .hljs-function,
          .hljs-title.function_ {
            color: #82aaff;
          }
          
          .hljs-variable,
          .hljs-params {
            color: #eeffff;
          }
          
          .hljs-type,
          .hljs-class {
            color: #ffcb6b;
          }
          
          .hljs-operator,
          .hljs-punctuation {
            color: #89ddff;
          }
          
          .hljs-tag {
            color: #f07178;
          }
          
          .hljs-attribute,
          .hljs-property {
            color: #c792ea;
          }
          
          .hljs-title,
          .hljs-section {
            color: #82aaff;
            font-weight: 600;
          }

          .hljs-meta {
            color: #ffcb6b;
          }

          .hljs-regexp {
            color: #c3e88d;
          }

          .hljs-symbol {
            color: #82aaff;
          }
        }

        // 添加复制按钮的样式
        &:hover::after {
          content: '复制';
          position: absolute;
          top: 12px;
          right: 80px;
          font-size: 0.7em;
          color: #94a3b8;
          background: #334155;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 2;
          
          &:hover {
            color: #e2e8f0;
            background: #475569;
          }
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

      /* YouTube 视频样式 */
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

  /* 表情选择器 */
  .emoji-picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;

    .emoji-picker {
      background: white;
      border-radius: 12px;
      padding: 20px;
      max-width: 400px;
      max-height: 500px;
      overflow-y: auto;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

      .emoji-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 8px;

        .emoji-item {
          font-size: 24px;
          padding: 8px;
          text-align: center;
          cursor: pointer;
          border-radius: 6px;
          transition: background 0.2s ease;

          &:hover {
            background: #f1f5f9;
          }
        }
      }
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

/* 表格右键菜单 */
.table-context-menu {
  position: fixed;
  z-index: 10000;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 4px 0;
  min-width: 160px;

  .context-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
    transition: background-color 0.2s ease;

    &:hover {
      background: #f3f4f6;
    }

    &.disabled {
      color: #9ca3af;
      cursor: not-allowed;

      &:hover {
        background: transparent;
      }
    }

    &.danger {
      color: #dc2626;

      &:hover {
        background: #fef2f2;
      }
    }

    .el-icon {
      font-size: 16px;
    }
  }

  .context-menu-separator {
    height: 1px;
    background: #e5e7eb;
    margin: 4px 0;
  }
}
</style> 