<template>
  <div v-if="showTableOfContents" class="table-of-contents">
    <div class="toc-header">
      <h4>目录</h4>
      <el-button @click="$emit('close')" size="small" text>
        <el-icon><X /></el-icon>
      </el-button>
    </div>
    <div class="toc-content">
      <div v-if="tableOfContents.length === 0" class="no-headings">
        暂无标题
      </div>
      <div 
        v-for="item in tableOfContents" 
        :key="item.id"
        :class="['toc-item', `toc-level-${item.level}`]"
        @click="$emit('scrollToHeading', item.id)"
      >
        {{ item.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  showTableOfContents: boolean
  tableOfContents: Array<{ id: string; text: string; level: number }>
}

interface Emits {
  (e: 'close'): void
  (e: 'scrollToHeading', id: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped lang="scss">
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

    .no-headings {
      padding: 12px;
      text-align: center;
      color: #9ca3af;
      font-size: 13px;
    }

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
</style>