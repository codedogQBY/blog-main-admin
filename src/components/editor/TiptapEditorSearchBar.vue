<template>
  <div class="search-replace-bar">
    <div class="search-replace-group">
      <el-input
        :model-value="searchText"
        @update:model-value="$emit('update:searchText', $event)"
        placeholder="搜索..."
        size="small"
        class="search-input"
        @keyup.enter="$emit('findNext')"
      >
        <template #append>
          <el-button @click="$emit('findPrevious')" size="small">上一个</el-button>
          <el-button @click="$emit('findNext')" size="small" type="primary">下一个</el-button>
        </template>
      </el-input>
      <span v-if="searchMatches.length > 0" class="search-count">
        {{ (currentSearchIndex === 0 && searchMatches.length > 0) ? searchMatches.length : currentSearchIndex }}/{{ searchMatches.length }}
      </span>
      <el-input
        :model-value="replaceText"
        @update:model-value="$emit('update:replaceText', $event)"
        placeholder="替换为..."
        size="small"
        class="replace-input"
      >
        <template #append>
          <el-button @click="$emit('replaceOne')" size="small">替换</el-button>
        </template>
      </el-input>
      <el-button @click="$emit('replaceAll')" size="small" type="primary">全部替换</el-button>
      <el-button @click="$emit('close')" size="small">
        <el-icon><X /></el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'

interface Props {
  searchText: string
  replaceText: string
  searchMatches: Array<{ from: number; to: number }>
  currentSearchIndex: number
}

interface Emits {
  (e: 'update:searchText', value: string): void
  (e: 'update:replaceText', value: string): void
  (e: 'findNext'): void
  (e: 'findPrevious'): void
  (e: 'replaceOne'): void
  (e: 'replaceAll'): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
</script>

<style scoped lang="scss">
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
</style>