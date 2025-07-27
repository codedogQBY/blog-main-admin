<template>
  <node-view-wrapper class="custom-image-node" :class="`image-align-${align}`">
    <div class="image-container" :class="{ selected }" @click="selectImage">
      <img
        :src="src"
        :alt="alt"
        :title="title"
        :style="imageStyle"
        @load="onImageLoad"
        @error="onImageError"
      />
      
      <!-- 选中状态的控制面板 -->
      <div v-if="selected" class="image-controls">
        <!-- 对齐控制 -->
        <div class="align-controls">
          <el-tooltip content="左对齐" placement="top">
            <button
              :class="['align-btn', { active: align === 'left' }]"
              @click="setAlign('left')"
            >
              <AlignLeft :size="16" />
            </button>
          </el-tooltip>
          <el-tooltip content="居中" placement="top">
            <button
              :class="['align-btn', { active: align === 'center' }]"
              @click="setAlign('center')"
            >
              <AlignCenter :size="16" />
            </button>
          </el-tooltip>
          <el-tooltip content="右对齐" placement="top">
            <button
              :class="['align-btn', { active: align === 'right' }]"
              @click="setAlign('right')"
            >
              <AlignRight :size="16" />
            </button>
          </el-tooltip>
        </div>
        
        <!-- 尺寸控制 -->
        <div class="size-controls">
          <el-tooltip content="小尺寸" placement="top">
            <button
              :class="['size-btn', { active: currentSize === 'small' }]"
              @click="setSize('small')"
            >
              小
            </button>
          </el-tooltip>
          <el-tooltip content="中等尺寸" placement="top">
            <button
              :class="['size-btn', { active: currentSize === 'medium' }]"
              @click="setSize('medium')"
            >
              中
            </button>
          </el-tooltip>
          <el-tooltip content="大尺寸" placement="top">
            <button
              :class="['size-btn', { active: currentSize === 'large' }]"
              @click="setSize('large')"
            >
              大
            </button>
          </el-tooltip>
          <el-tooltip content="原始尺寸" placement="top">
            <button
              :class="['size-btn', { active: currentSize === 'original' }]"
              @click="setSize('original')"
            >
              原始
            </button>
          </el-tooltip>
        </div>
        
        <!-- 自定义尺寸输入 -->
        <div class="custom-size-controls">
          <el-input
            v-model="customWidth"
            placeholder="宽度"
            size="small"
            style="width: 80px; margin-right: 5px;"
            @blur="setCustomSize"
            @keyup.enter="setCustomSize"
          />
          <span style="margin: 0 5px;">×</span>
          <el-input
            v-model="customHeight"
            placeholder="高度"
            size="small"
            style="width: 80px;"
            @blur="setCustomSize"
            @keyup.enter="setCustomSize"
          />
        </div>
        
        <!-- 删除按钮 -->
        <div class="delete-control">
          <el-tooltip content="删除图片" placement="top">
            <button class="delete-btn" @click="deleteImage">
              <Trash2 :size="16" />
            </button>
          </el-tooltip>
        </div>
      </div>
      
      <!-- 拖拽调整手柄 -->
      <div v-if="selected" class="resize-handles">
        <!-- 角落手柄 -->
        <div class="resize-handle resize-handle-nw" @mousedown="startResize('nw', $event)">
          <div class="handle-dot"></div>
        </div>
        <div class="resize-handle resize-handle-ne" @mousedown="startResize('ne', $event)">
          <div class="handle-dot"></div>
        </div>
        <div class="resize-handle resize-handle-sw" @mousedown="startResize('sw', $event)">
          <div class="handle-dot"></div>
        </div>
        <div class="resize-handle resize-handle-se" @mousedown="startResize('se', $event)">
          <div class="handle-dot"></div>
        </div>
        
        <!-- 边缘手柄 -->
        <div class="resize-handle resize-handle-n" @mousedown="startResize('n', $event)">
          <div class="handle-dot"></div>
        </div>
        <div class="resize-handle resize-handle-s" @mousedown="startResize('s', $event)">
          <div class="handle-dot"></div>
        </div>
        <div class="resize-handle resize-handle-w" @mousedown="startResize('w', $event)">
          <div class="handle-dot"></div>
        </div>
        <div class="resize-handle resize-handle-e" @mousedown="startResize('e', $event)">
          <div class="handle-dot"></div>
        </div>
      </div>
    </div>
  </node-view-wrapper>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NodeViewWrapper } from '@tiptap/vue-3'
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from 'lucide-vue-next'
import { ElTooltip, ElInput } from 'element-plus'

interface Props {
  node: any
  updateAttributes: (attributes: Record<string, any>) => void
  deleteNode: () => void
  selected: boolean
}

const props = defineProps<Props>()

const src = computed(() => props.node.attrs.src)
const alt = computed(() => props.node.attrs.alt)
const title = computed(() => props.node.attrs.title)
const width = computed(() => props.node.attrs.width)
const height = computed(() => props.node.attrs.height)
const align = computed(() => props.node.attrs.align || 'center')

const customWidth = ref('')
const customHeight = ref('')
const currentSize = ref('medium')
const naturalWidth = ref(0)
const naturalHeight = ref(0)

// 预设尺寸
const sizePresets = {
  small: { width: '200px' },
  medium: { width: '400px' },
  large: { width: '600px' },
  original: { width: 'auto' }
}

// 计算图片样式
const imageStyle = computed(() => {
  const style: Record<string, string> = {}
  
  if (width.value) {
    style.width = width.value.includes('%') || width.value.includes('px') ? width.value : width.value + 'px'
  }
  
  if (height.value) {
    style.height = height.value.includes('%') || height.value.includes('px') ? height.value : height.value + 'px'
  }
  
  return style
})

// 监听属性变化，更新自定义尺寸输入框
watch([width, height], () => {
  customWidth.value = width.value || ''
  customHeight.value = height.value || ''
  
  // 判断当前尺寸类型
  if (width.value === '200px') {
    currentSize.value = 'small'
  } else if (width.value === '400px') {
    currentSize.value = 'medium'
  } else if (width.value === '600px') {
    currentSize.value = 'large'
  } else if (width.value === 'auto' || !width.value) {
    currentSize.value = 'original'
  } else {
    currentSize.value = 'custom'
  }
}, { immediate: true })

const selectImage = () => {
  // 图片选中逻辑由 Tiptap 处理
}

const setAlign = (newAlign: 'left' | 'center' | 'right') => {
  props.updateAttributes({ align: newAlign })
}

const setSize = (size: 'small' | 'medium' | 'large' | 'original') => {
  const preset = sizePresets[size]
  currentSize.value = size
  
  if (size === 'original') {
    props.updateAttributes({ width: null, height: null })
  } else {
    props.updateAttributes({ width: preset.width, height: null })
  }
}

const setCustomSize = () => {
  const newWidth = customWidth.value.trim()
  const newHeight = customHeight.value.trim()
  
  props.updateAttributes({
    width: newWidth || null,
    height: newHeight || null
  })
  
  currentSize.value = 'custom'
}

const deleteImage = () => {
  props.deleteNode()
}

const onImageLoad = (event: Event) => {
  const img = event.target as HTMLImageElement
  naturalWidth.value = img.naturalWidth
  naturalHeight.value = img.naturalHeight
}

const onImageError = () => {
  console.error('图片加载失败:', src.value)
}

// 拖拽调整尺寸
const startResize = (direction: string, event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  
  const startX = event.clientX
  const startY = event.clientY
  const startWidth = parseInt(width.value) || naturalWidth.value || 400
  const startHeight = parseInt(height.value) || naturalHeight.value || 300
  
  // 添加拖拽状态样式
  document.body.style.cursor = getResizeCursor(direction)
  document.body.style.userSelect = 'none'
  
  const onMouseMove = (e: MouseEvent) => {
    e.preventDefault()
    
    const deltaX = e.clientX - startX
    const deltaY = e.clientY - startY
    
    let newWidth = startWidth
    let newHeight = startHeight
    
    // 根据方向调整尺寸
    if (direction.includes('e')) {
      newWidth = Math.max(50, startWidth + deltaX)
    }
    if (direction.includes('w')) {
      newWidth = Math.max(50, startWidth - deltaX)
    }
    if (direction.includes('s')) {
      newHeight = Math.max(50, startHeight + deltaY)
    }
    if (direction.includes('n')) {
      newHeight = Math.max(50, startHeight - deltaY)
    }
    
    // 对于纯边缘拖拽，保持宽高比
    if (naturalWidth.value && naturalHeight.value) {
      const aspectRatio = naturalWidth.value / naturalHeight.value
      
      if (direction === 'e' || direction === 'w') {
        // 水平拖拽，根据宽度计算高度
        newHeight = newWidth / aspectRatio
      } else if (direction === 'n' || direction === 's') {
        // 垂直拖拽，根据高度计算宽度
        newWidth = newHeight * aspectRatio
      } else if (direction.includes('e') || direction.includes('w')) {
        // 角落拖拽，优先保持宽度变化
        newHeight = newWidth / aspectRatio
      } else {
        // 角落拖拽，优先保持高度变化
        newWidth = newHeight * aspectRatio
      }
    }
    
    // 限制最小尺寸
    newWidth = Math.max(50, newWidth)
    newHeight = Math.max(50, newHeight)
    
    props.updateAttributes({
      width: `${Math.round(newWidth)}px`,
      height: `${Math.round(newHeight)}px`
    })
    
    currentSize.value = 'custom'
  }
  
  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
    
    // 恢复默认样式
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

// 获取拖拽光标样式
const getResizeCursor = (direction: string) => {
  const cursors: Record<string, string> = {
    'nw': 'nw-resize',
    'ne': 'ne-resize',
    'sw': 'sw-resize',
    'se': 'se-resize',
    'n': 'n-resize',
    's': 's-resize',
    'w': 'w-resize',
    'e': 'e-resize'
  }
  return cursors[direction] || 'default'
}
</script>

<style scoped>
.custom-image-node {
  display: block;
  margin: 1em 0;
}

.image-align-left {
  text-align: left;
}

.image-align-center {
  text-align: center;
}

.image-align-right {
  text-align: right;
}

.image-container {
  position: relative;
  display: inline-block;
  max-width: 100%;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.image-container.selected {
  outline: 2px solid #4f46e5;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
}

.image-container img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  transition: all 0.2s ease;
  display: block;
}

.image-container:hover img {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-container.selected img {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.image-controls {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 100;
  white-space: nowrap;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  animation: fadeInUp 0.2s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 当控制面板可能超出视口时，调整位置 */
.image-controls::before {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid rgba(255, 255, 255, 0.95);
}

.align-controls,
.size-controls {
  display: flex;
  gap: 4px;
}

.align-btn,
.size-btn {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.align-btn:hover,
.size-btn:hover {
  background: #f8fafc;
  border-color: #4f46e5;
}

.align-btn.active,
.size-btn.active {
  background: #4f46e5;
  color: white;
  border-color: #4f46e5;
}

.custom-size-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.delete-btn {
  padding: 4px;
  border: 1px solid #ef4444;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: #ef4444;
  color: white;
}

.resize-handles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 12px;
  height: 12px;
  pointer-events: all;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.handle-dot {
  width: 6px;
  height: 6px;
  background: #4f46e5;
  border: 2px solid white;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.resize-handle:hover .handle-dot {
  width: 8px;
  height: 8px;
  background: #3730a3;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

/* 角落手柄 */
.resize-handle-nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.resize-handle-ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.resize-handle-sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.resize-handle-se {
  bottom: -6px;
  right: -6px;
  cursor: se-resize;
}

/* 边缘手柄 */
.resize-handle-n {
  top: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-handle-s {
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-handle-w {
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: w-resize;
}

.resize-handle-e {
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

/* 分隔线 */
.image-controls > div:not(:last-child)::after {
  content: '';
  width: 1px;
  height: 20px;
  background: #e2e8f0;
  margin-left: 8px;
}
</style>