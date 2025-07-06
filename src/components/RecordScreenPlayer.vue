<template>
  <div class="record-screen-player">
    <div class="player-controls">
      <el-button @click="play" :disabled="isPlaying" type="primary" size="small">
        <el-icon><VideoPlay /></el-icon>
        播放
      </el-button>
      <el-button @click="pause" :disabled="!isPlaying" type="warning" size="small">
        <el-icon><VideoPause /></el-icon>
        暂停
      </el-button>
      <el-button @click="stop" :disabled="!isPlaying" type="danger" size="small">
        <el-icon><CircleClose /></el-icon>
        停止
      </el-button>
      <el-slider 
        v-model="progress" 
        :min="0" 
        :max="100" 
        :disabled="!recordScreenData"
        @change="seek"
        style="width: 200px; margin-left: 16px;"
      />
      <span v-if="recordScreenData" class="time-display">
        {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
      </span>
    </div>
    
    <div class="player-canvas">
      <canvas ref="canvas" width="800" height="600"></canvas>
      <div v-if="!recordScreenData" class="no-data">
        暂无录屏数据
      </div>
    </div>
    
    <div v-if="recordScreenData" class="player-info">
      <h4>录屏信息</h4>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">时长:</span>
          <span class="value">{{ formatTime(duration) }}</span>
        </div>
        <div class="info-item">
          <span class="label">事件数:</span>
          <span class="value">{{ recordScreenData.events?.length || 0 }}</span>
        </div>
        <div class="info-item">
          <span class="label">分辨率:</span>
          <span class="value">{{ recordScreenData.events?.[0]?.data?.width || 0 }}x{{ recordScreenData.events?.[0]?.data?.height || 0 }}</span>
        </div>
        <div class="info-item">
          <span class="label">开始时间:</span>
          <span class="value">{{ formatDateTime(recordScreenData.meta?.startTime) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { VideoPlay, VideoPause, CircleClose } from '@element-plus/icons-vue'

interface RecordScreenEvent {
  type: string
  timestamp: number
  data: any
}

interface RecordScreenData {
  duration: number
  events: RecordScreenEvent[]
  meta: {
    version: string
    startTime: number
    endTime: number
    url: string
  }
}

interface Props {
  recordScreenData: RecordScreenData | null
}

const props = defineProps<Props>()

const canvas = ref<HTMLCanvasElement>()
const isPlaying = ref(false)
const progress = ref(0)
const currentTime = ref(0)
const duration = ref(0)
const playInterval = ref<NodeJS.Timeout | null>(null)
const startTime = ref(0)

// 监听录屏数据变化
watch(() => props.recordScreenData, (newData) => {
  if (newData) {
    duration.value = newData.duration
    currentTime.value = 0
    progress.value = 0
    stop()
    renderFrame(0)
  }
}, { immediate: true })

const play = () => {
  if (!props.recordScreenData || !canvas.value) return
  
  isPlaying.value = true
  startTime.value = Date.now() - currentTime.value
  
  playInterval.value = setInterval(() => {
    const elapsed = Date.now() - startTime.value
    const newProgress = (elapsed / duration.value) * 100
    
    if (newProgress >= 100) {
      stop()
      return
    }
    
    progress.value = newProgress
    currentTime.value = elapsed
    renderFrame(newProgress)
  }, 16) // 60fps
}

const pause = () => {
  isPlaying.value = false
  if (playInterval.value) {
    clearInterval(playInterval.value)
    playInterval.value = null
  }
}

const stop = () => {
  isPlaying.value = false
  progress.value = 0
  currentTime.value = 0
  if (playInterval.value) {
    clearInterval(playInterval.value)
    playInterval.value = null
  }
  renderFrame(0)
}

const seek = (newProgress: number) => {
  progress.value = newProgress
  currentTime.value = (newProgress / 100) * duration.value
  renderFrame(newProgress)
}

const renderFrame = (progressPercent: number) => {
  if (!props.recordScreenData || !canvas.value) return
  
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
  
  // 绘制背景
  ctx.fillStyle = '#f5f7fa'
  ctx.fillRect(0, 0, canvas.value.width, canvas.value.height)
  
  // 绘制进度信息
  ctx.fillStyle = '#303133'
  ctx.font = '16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`录屏回放 - ${progressPercent.toFixed(1)}%`, canvas.value.width / 2, 30)
  
  // 绘制事件信息
  const currentEvent = getCurrentEvent(progressPercent)
  if (currentEvent) {
    ctx.fillStyle = '#409eff'
    ctx.font = '14px Arial'
    ctx.fillText(`当前事件: ${currentEvent.type}`, canvas.value.width / 2, 60)
    ctx.fillText(`时间戳: ${currentEvent.timestamp}ms`, canvas.value.width / 2, 80)
  }
  
  // 绘制事件时间轴
  drawTimeline(ctx, progressPercent)
}

const getCurrentEvent = (progressPercent: number) => {
  if (!props.recordScreenData?.events) return null
  
  const currentTime = (progressPercent / 100) * duration.value
  return props.recordScreenData.events.find(event => event.timestamp >= currentTime) || 
         props.recordScreenData.events[props.recordScreenData.events.length - 1]
}

const drawTimeline = (ctx: CanvasRenderingContext2D, progressPercent: number) => {
  if (!props.recordScreenData?.events) return
  
  const timelineY = canvas.value!.height - 60
  const timelineWidth = canvas.value!.width - 40
  const timelineX = 20
  
  // 绘制时间轴背景
  ctx.fillStyle = '#e4e7ed'
  ctx.fillRect(timelineX, timelineY, timelineWidth, 4)
  
  // 绘制进度
  ctx.fillStyle = '#409eff'
  ctx.fillRect(timelineX, timelineY, (progressPercent / 100) * timelineWidth, 4)
  
  // 绘制事件点
  props.recordScreenData.events.forEach(event => {
    const eventX = timelineX + (event.timestamp / duration.value) * timelineWidth
    ctx.fillStyle = '#67c23a'
    ctx.beginPath()
    ctx.arc(eventX, timelineY + 2, 4, 0, 2 * Math.PI)
    ctx.fill()
  })
}

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const formatDateTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}

onUnmounted(() => {
  if (playInterval.value) {
    clearInterval(playInterval.value)
  }
})
</script>

<style scoped>
.record-screen-player {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background: white;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.time-display {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  margin-left: 8px;
}

.player-canvas {
  position: relative;
  margin-bottom: 16px;
}

.player-canvas canvas {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: block;
  margin: 0 auto;
}

.no-data {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #909399;
  font-size: 14px;
  border: 1px dashed #e4e7ed;
  border-radius: 4px;
}

.player-info {
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.player-info h4 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.info-item .label {
  color: #606266;
  font-size: 12px;
}

.info-item .value {
  color: #303133;
  font-size: 12px;
  font-weight: 500;
}
</style> 