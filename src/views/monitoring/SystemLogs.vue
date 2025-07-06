<template>
  <div class="system-logs">
    <div class="header">
      <h1>系统日志</h1>
      <div class="actions">
        <el-button @click="refreshLogs" :loading="loading">刷新</el-button>
        <el-button @click="showCleanDialog = true" type="warning">清理旧日志</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-content">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="级别">
          <el-select v-model="filters.level" placeholder="选择级别" clearable style="width: 120px;">
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warn" />
            <el-option label="信息" value="info" />
            <el-option label="调试" value="debug" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filters.source" placeholder="选择来源" clearable style="width: 120px;">
            <el-option label="前端" value="frontend" />
            <el-option label="后台" value="admin" />
            <el-option label="后端" value="backend" />
          </el-select>
        </el-form-item>
        <el-form-item label="类别">
          <el-select v-model="filters.category" placeholder="选择类别" clearable style="width: 140px;">
            <el-option label="JS错误" value="js_error" />
            <el-option label="API错误" value="api_error" />
            <el-option label="性能" value="performance" />
            <el-option label="行为" value="behavior" />
            <el-option label="系统" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="搜索日志内容" style="width: 200px;" />
        </el-form-item>
        <el-form-item>
          <el-button @click="applyFilters" type="primary">筛选</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card>
      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">
              {{ row.level.toUpperCase() }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="类别" width="100">
          <template #default="{ row }">
            <el-tag type="info" size="small">{{ row.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="message-cell">
              <span class="message-text">{{ truncateMessage(row.message) }}</span>
              <el-button 
                v-if="row.message.length > 100" 
                @click="viewLogDetails(row)" 
                size="small" 
                type="text"
                class="view-more-btn"
              >
                查看详情
              </el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="用户" width="100" />
        <el-table-column prop="url" label="页面" width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button @click="viewLogDetails(row)" size="small" type="primary">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="日志详情" width="800px">
      <div v-if="selectedLog" class="log-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">
            {{ formatDate(selectedLog.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLevelType(selectedLog.level)">
              {{ selectedLog.level.toUpperCase() }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">{{ selectedLog.source }}</el-descriptions-item>
          <el-descriptions-item label="类别">{{ selectedLog.category }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ selectedLog.userName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ selectedLog.ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="页面" :span="2">{{ selectedLog.url || '-' }}</el-descriptions-item>
          <el-descriptions-item label="消息" :span="2">{{ selectedLog.message }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedLog.details" class="details-section">
          <h4>详细信息</h4>
          <div v-if="getBreadcrumbData(selectedLog.details).length > 0" class="breadcrumb-section">
            <h5>用户行为轨迹</h5>
            <div class="breadcrumb-list">
              <div v-for="(item, index) in getBreadcrumbData(selectedLog.details)" :key="index" class="breadcrumb-item">
                <div class="breadcrumb-header">
                  <span class="breadcrumb-time">{{ formatBreadcrumbTime(item.time) }}</span>
                  <el-tag :type="getBreadcrumbType(item.type)" size="small">{{ item.type }}</el-tag>
                  <el-tag v-if="item.status" :type="item.status === 'error' ? 'danger' : 'success'" size="small">
                    {{ item.status }}
                  </el-tag>
                </div>
                <div class="breadcrumb-content">
                  <div v-if="item.category" class="breadcrumb-category">{{ item.category }}</div>
                  <div v-if="item.data" class="breadcrumb-data">
                    <pre>{{ formatBreadcrumbData(item.data) }}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="other-details">
            <pre>{{ formatJson(selectedLog.details) }}</pre>
          </div>
        </div>

        <div v-if="selectedLog.stack" class="details-section">
          <h4>错误堆栈</h4>
          <pre>{{ selectedLog.stack }}</pre>
        </div>

        <div v-if="selectedLog.tags" class="details-section">
          <h4>标签</h4>
          <pre>{{ formatJson(selectedLog.tags) }}</pre>
        </div>

        <!-- 录屏回放 -->
        <div v-if="selectedLog.recordScreen" class="details-section">
          <h4>录屏回放</h4>
          <RecordScreenPlayer :record-screen-data="recordScreenData" />
        </div>
      </div>
    </el-dialog>

    <!-- 清理日志对话框 -->
    <el-dialog v-model="showCleanDialog" title="清理旧日志" width="400px">
      <el-form :model="cleanForm" label-width="100px">
        <el-form-item label="保留天数">
          <el-input-number v-model="cleanForm.days" :min="1" :max="365" />
        </el-form-item>
        <el-form-item>
          <el-alert
            title="警告"
            type="warning"
            description="此操作将永久删除指定天数之前的日志，请谨慎操作！"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCleanDialog = false">取消</el-button>
        <el-button @click="cleanOldLogs" type="warning" :loading="cleaning">
          确认清理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/lib/api'
import RecordScreenPlayer from '@/components/RecordScreenPlayer.vue'

interface Log {
  id: string
  timestamp: string
  level: string
  source: string
  category: string
  message: string
  details?: string
  stack?: string
  url?: string
  userAgent?: string
  ip?: string
  userId?: string
  userName?: string
  sessionId?: string
  requestId?: string
  duration?: number
  memory?: number
  tags?: string
  // 录屏相关字段
  recordScreenId?: string
  recordScreen?: string
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  total: number
  byLevel: Record<string, number>
  bySource: Record<string, number>
  byCategory: Record<string, number>
}

const loading = ref(false)
const cleaning = ref(false)
const logs = ref<Log[]>([])
const stats = ref<any[]>([])
const pagination = reactive<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const filters = reactive({
  level: '',
  source: '',
  category: '',
  search: ''
})

const showDetailsDialog = ref(false)
const showCleanDialog = ref(false)
const selectedLog = ref<Log | null>(null)
const cleanForm = reactive({
  days: 30
})

// 录屏相关变量
const recordScreenData = ref<any>(null)

// 获取日志列表
const fetchLogs = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...filters
    })
    
    const response = await api.get(`/logs?${params}`)
    logs.value = response.data.data
    pagination.total = response.data.pagination.total
    pagination.totalPages = response.data.pagination.totalPages
  } catch (error) {
    ElMessage.error('获取日志失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取统计信息
const fetchStats = async () => {
  try {
    const response = await api.get('/logs/stats')
    const data: Stats = response.data
    
    stats.value = [
      { label: '总日志数', value: data.total },
      { label: '错误日志', value: data.byLevel.error || 0 },
      { label: '警告日志', value: data.byLevel.warn || 0 },
      { label: '信息日志', value: data.byLevel.info || 0 }
    ]
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 刷新日志
const refreshLogs = () => {
  fetchLogs()
  fetchStats()
}

// 应用筛选
const applyFilters = () => {
  pagination.page = 1
  fetchLogs()
}

// 重置筛选
const resetFilters = () => {
  Object.assign(filters, {
    level: '',
    source: '',
    category: '',
    search: ''
  })
  pagination.page = 1
  fetchLogs()
}

// 查看日志详情
const viewLogDetails = (log: Log) => {
  selectedLog.value = log
  showDetailsDialog.value = true
  
  // 初始化录屏数据
  if (log.recordScreen) {
    recordScreenData.value = parseRecordScreen(log.recordScreen)
  } else {
    recordScreenData.value = null
  }
}

// 清理旧日志
const cleanOldLogs = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除${cleanForm.days}天前的日志吗？此操作不可恢复！`,
      '确认清理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    cleaning.value = true
    const response = await api.post('/logs/clean', { days: cleanForm.days })
    
    ElMessage.success(`成功清理 ${response.data.deletedCount} 条日志`)
    showCleanDialog.value = false
    refreshLogs()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理日志失败')
      console.error(error)
    }
  } finally {
    cleaning.value = false
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchLogs()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchLogs()
}

// 工具函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getLevelType = (level: string) => {
  const types: Record<string, string> = {
    error: 'danger',
    warn: 'warning',
    info: 'info',
    debug: ''
  }
  return types[level] || ''
}

const formatJson = (json: string) => {
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}

const truncateMessage = (message: string) => {
  if (message.length <= 100) {
    return message
  }
  return message.substring(0, 100) + '...'
}

// Breadcrumb 相关函数
const getBreadcrumbData = (details: string) => {
  try {
    const parsed = JSON.parse(details)
    return parsed.breadcrumb || []
  } catch {
    return []
  }
}

const formatBreadcrumbTime = (time: number) => {
  return new Date(time).toLocaleString('zh-CN')
}

const getBreadcrumbType = (type: string) => {
  const types: Record<string, string> = {
    click: 'primary',
    xhr: 'warning',
    fetch: 'warning',
    history: 'info',
    error: 'danger',
    custom: 'success'
  }
  return types[type] || 'info'
}

const formatBreadcrumbData = (data: any) => {
  if (typeof data === 'string') {
    return data
  }
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

// 录屏相关函数
const parseRecordScreen = (recordScreenStr: string) => {
  try {
    return JSON.parse(recordScreenStr)
  } catch {
    return null
  }
}

onMounted(() => {
  fetchLogs()
  fetchStats()
})
</script>

<style scoped>
.system-logs {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header h1 {
  margin: 0;
  color: #303133;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.log-details {
  max-height: 600px;
  overflow-y: auto;
}

.details-section {
  margin-top: 20px;
}

.details-section h4 {
  margin-bottom: 10px;
  color: #303133;
}

.details-section pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.message-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.message-text {
  flex: 1;
  word-break: break-word;
}

.view-more-btn {
  flex-shrink: 0;
  padding: 0;
  font-size: 12px;
  color: #409eff;
}

.view-more-btn:hover {
  color: #66b1ff;
}

/* Breadcrumb 样式 */
.breadcrumb-section {
  margin-bottom: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;
}

.breadcrumb-section h5 {
  margin: 0 0 12px 0;
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.breadcrumb-list {
  max-height: 300px;
  overflow-y: auto;
}

.breadcrumb-item {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  margin-bottom: 8px;
  background: white;
  overflow: hidden;
}

.breadcrumb-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.breadcrumb-time {
  font-size: 12px;
  color: #909399;
  font-family: monospace;
}

.breadcrumb-content {
  padding: 12px;
}

.breadcrumb-category {
  font-size: 12px;
  color: #606266;
  margin-bottom: 8px;
  font-weight: 500;
}

.breadcrumb-data {
  font-size: 12px;
}

.breadcrumb-data pre {
  margin: 0;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 2px;
  font-size: 11px;
  max-height: 150px;
  overflow-y: auto;
}

.other-details {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e4e7ed;
}

/* 录屏相关样式 */
.record-screen-section {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;
}

.record-screen-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.record-screen-time {
  font-family: monospace;
  font-size: 12px;
  color: #606266;
  margin-left: 8px;
}

.record-screen-container {
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  background: white;
  min-height: 200px;
  overflow: hidden;
}

.record-screen-canvas {
  width: 100%;
  height: 100%;
  min-height: 200px;
}
</style> 