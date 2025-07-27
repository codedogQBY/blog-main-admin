<template>
  <div class="editor-toolbar">
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

      <TiptapEditorTableToolbar
        :editor="editor"
        @insert-table="$emit('insertTable')"
      />

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
          @click="$emit('addImage')"
          class="toolbar-button"
          title="插入图片"
        >
          <el-icon><ImageIcon /></el-icon>
        </button>
        
        <!-- 图片对齐控制 -->
        <template v-if="editor.isActive('customImage')">
          <div class="toolbar-separator-mini"></div>
          <button
            @click="editor.chain().focus().updateAttributes('customImage', { align: 'left' }).run()"
            :class="['toolbar-button', { active: editor.getAttributes('customImage').align === 'left' }]"
            title="图片左对齐"
          >
            <el-icon><AlignLeft /></el-icon>
          </button>
          <button
            @click="editor.chain().focus().updateAttributes('customImage', { align: 'center' }).run()"
            :class="['toolbar-button', { active: editor.getAttributes('customImage').align === 'center' }]"
            title="图片居中"
          >
            <el-icon><AlignCenter /></el-icon>
          </button>
          <button
            @click="editor.chain().focus().updateAttributes('customImage', { align: 'right' }).run()"
            :class="['toolbar-button', { active: editor.getAttributes('customImage').align === 'right' }]"
            title="图片右对齐"
          >
            <el-icon><AlignRight /></el-icon>
          </button>
          
          <div class="toolbar-separator-mini"></div>
          
          <!-- 图片尺寸控制 -->
          <button
            @click="editor.chain().focus().updateAttributes('customImage', { width: '200px', height: null }).run()"
            class="toolbar-button size-btn"
            title="小尺寸"
          >
            小
          </button>
          <button
            @click="editor.chain().focus().updateAttributes('customImage', { width: '400px', height: null }).run()"
            class="toolbar-button size-btn"
            title="中等尺寸"
          >
            中
          </button>
          <button
            @click="editor.chain().focus().updateAttributes('customImage', { width: '600px', height: null }).run()"
            class="toolbar-button size-btn"
            title="大尺寸"
          >
            大
          </button>
          <button
            @click="editor.chain().focus().updateAttributes('customImage', { width: null, height: null }).run()"
            class="toolbar-button size-btn"
            title="原始尺寸"
          >
            原始
          </button>
        </template>
        <button
          @click="$emit('addLink')"
          class="toolbar-button"
          title="插入链接"
        >
          <el-icon><LinkIcon /></el-icon>
        </button>
        <button
          @click="$emit('addYouTubeVideo')"
          class="toolbar-button"
          title="插入YouTube视频"
        >
          <el-icon><Video /></el-icon>
        </button>
        <button
          @click="$emit('showEmojiPicker')"
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
          @click="$emit('showMarkdownImport')"
          class="toolbar-button"
          title="导入Markdown"
        >
          <span style="font-size: 14px; font-weight: bold;">MD</span>
        </button>
        <button
          @click="$emit('toggleSearchReplace')"
          class="toolbar-button"
          title="搜索替换"
        >
          <el-icon><Search /></el-icon>
        </button>
        <button
          @click="$emit('toggleTableOfContents')"
          class="toolbar-button"
          title="目录"
        >
          <el-icon><BookOpen /></el-icon>
        </button>
        <button
          @click="$emit('toggleFullscreen')"
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
    <TiptapEditorSearchBar
      v-if="showSearchReplace"
      :searchText="searchText"
      :replaceText="replaceText"
      :searchMatches="searchMatches"
      :currentSearchIndex="currentSearchIndex"
      @update:searchText="$emit('update:searchText', $event)"
      @update:replaceText="$emit('update:replaceText', $event)"
      @findNext="$emit('findNext')"
      @findPrevious="$emit('findPrevious')"
      @replaceOne="$emit('replaceOne')"
      @replaceAll="$emit('replaceAll')"
      @close="$emit('closeSearchReplace')"
    />
  </div>
</template>

<script setup lang="ts">
import { type Editor } from '@tiptap/vue-3'
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
  Video,
  Search,
  BookOpen,
  Maximize2,
  Minimize2,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-vue-next'
import TiptapEditorTableToolbar from './TiptapEditorTableToolbar.vue'
import TiptapEditorSearchBar from './TiptapEditorSearchBar.vue'

interface Props {
  editor: Editor
  isFullscreen: boolean
  showSearchReplace: boolean
  searchText: string
  replaceText: string
  searchMatches: Array<{ from: number; to: number }>
  currentSearchIndex: number
}

interface Emits {
  (e: 'insertTable'): void
  (e: 'addImage'): void
  (e: 'addLink'): void
  (e: 'addYouTubeVideo'): void
  (e: 'showEmojiPicker'): void
  (e: 'showMarkdownImport'): void
  (e: 'toggleSearchReplace'): void
  (e: 'toggleTableOfContents'): void
  (e: 'toggleFullscreen'): void
  (e: 'update:searchText', value: string): void
  (e: 'update:replaceText', value: string): void
  (e: 'findNext'): void
  (e: 'findPrevious'): void
  (e: 'replaceOne'): void
  (e: 'replaceAll'): void
  (e: 'closeSearchReplace'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取当前代码块的语言
const getCurrentLanguage = () => {
  if (props.editor && props.editor.isActive('codeBlock')) {
    return props.editor.getAttributes('codeBlock').language || 'javascript'
  }
  return 'javascript'
}

// 设置代码块语言
const setCodeBlockLanguage = (language: string) => {
  if (props.editor && props.editor.isActive('codeBlock')) {
    props.editor.chain().focus().updateAttributes('codeBlock', { language }).run()
  }
}
</script>

<style scoped lang="scss">
/* 工具栏 */
.editor-toolbar {
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  position: sticky;
  top: 0;
  z-index: 2;

  .toolbar-row {
    padding: 8px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    min-height: 48px;

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

          &.size-btn {
            padding: 4px 6px;
            font-size: 12px;
            min-width: 28px;
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
    background: #d1d5db;
    margin: 0 4px;
  }
  
  .toolbar-separator-mini {
    width: 1px;
    height: 16px;
    background: #e2e8f0;
    margin: 0 2px;
  }

    .character-count {
      margin-left: auto;
      font-size: 13px;
      color: #64748b;
      white-space: nowrap;
    }
  }
}
</style>