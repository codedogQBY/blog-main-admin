<template>
  <div class="toolbar-group">
    <button
      @click="$emit('insertTable')"
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
</template>

<script setup lang="ts">
import { type Editor } from '@tiptap/vue-3'
import { Grid3X3, Plus, Minus, Trash2 } from 'lucide-vue-next'

interface Props {
  editor: Editor
}

interface Emits {
  (e: 'insertTable'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped lang="scss">
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
}
</style>