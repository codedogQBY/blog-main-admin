<template>
  <div 
    v-if="visible" 
    class="table-context-menu"
    :style="{ top: position.y + 'px', left: position.x + 'px' }"
    @click.stop
  >
    <div class="context-menu-item" @click="handleAction('addColumnBefore')">
      <el-icon><Plus /></el-icon>
      <span>向前插入列</span>
    </div>
    <div class="context-menu-item" @click="handleAction('addColumnAfter')">
      <el-icon><Plus /></el-icon>
      <span>向后插入列</span>
    </div>
    <div class="context-menu-item" @click="handleAction('deleteColumn')">
      <el-icon><Minus /></el-icon>
      <span>删除列</span>
    </div>
    <div class="context-menu-separator"></div>
    <div class="context-menu-item" @click="handleAction('addRowBefore')">
      <el-icon><Plus /></el-icon>
      <span>向前插入行</span>
    </div>
    <div class="context-menu-item" @click="handleAction('addRowAfter')">
      <el-icon><Plus /></el-icon>
      <span>向后插入行</span>
    </div>
    <div class="context-menu-item" @click="handleAction('deleteRow')">
      <el-icon><Minus /></el-icon>
      <span>删除行</span>
    </div>
    <div class="context-menu-separator"></div>
    <div 
      class="context-menu-item" 
      :class="{ disabled: !canMergeCells }"
      @click="handleAction('mergeCells')"
    >
      <span>🔗</span>
      <span>合并单元格</span>
    </div>
    <div 
      class="context-menu-item"
      :class="{ disabled: !canSplitCell }"
      @click="handleAction('splitCell')"
    >
      <span>✂️</span>
      <span>拆分单元格</span>
    </div>
    <div class="context-menu-separator"></div>
    <div class="context-menu-item" @click="handleAction('toggleHeaderRow')">
      <span>📋</span>
      <span>切换表头行</span>
    </div>
    <div class="context-menu-item" @click="handleAction('toggleHeaderColumn')">
      <span>📋</span>
      <span>切换表头列</span>
    </div>
    <div class="context-menu-separator"></div>
    <div class="context-menu-item danger" @click="handleAction('deleteTable')">
      <el-icon><Trash2 /></el-icon>
      <span>删除表格</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { type Editor } from '@tiptap/vue-3'
import { Plus, Minus, Trash2 } from 'lucide-vue-next'

interface Props {
  visible: boolean
  position: { x: number; y: number }
  editor: Editor | null
  canMergeCells: boolean
  canSplitCell: boolean
}

interface Emits {
  (e: 'action', action: string): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleAction = (action: string) => {
  if (action === 'mergeCells' && !props.canMergeCells) return
  if (action === 'splitCell' && !props.canSplitCell) return
  
  emit('action', action)
  emit('close')
}
</script>

<style scoped lang="scss">
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