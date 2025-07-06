<template>
  <div class="system-alerts">
    <div class="header">
      <h1>系统告警</h1>
      <div class="actions">
        <el-button @click="refreshAlerts" :loading="loading">刷新</el-button>
        <el-button @click="markAllAsRead" type="primary" :disabled="!hasUnreadAlerts">
          全部标记为已读
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-content">
          <div class="stat-value" :class="stat.class">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </el-card>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="级别">
          <el-select v-model="filters.level" placeholder="选择级别" style="width: 100px;" clearable>
            <el-option label="严重" value="critical" />
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warning" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item label="来源">
          <el-select v-model="filters.source" placeholder="选择来源" style="width: 100px;" clearable>
            <el-option label="前端" value="frontend" />
            <el-option label="后台" value="admin" />
            <el-option label="后端" value="backend" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" style="width: 100px;" clearable>
            <el-option label="未读" value="unread" />
            <el-option label="已读" value="read" />
            <el-option label="未处理" value="unresolved" />
            <el-option label="已处理" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="搜索告警内容" />
        </el-form-item>
        <el-form-item>
          <el-button @click="applyFilters" type="primary">筛选</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 告警列表 -->
    <el-card>
      <el-table :data="alerts" v-loading="loading" stripe>
        <el-table-column type="selection" width="55" />
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
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="title-cell">
              <span class="title-text">{{ truncateTitle(row.title) }}</span>
              <el-button 
                v-if="row.title.length > 80" 
                @click="viewAlertDetails(row)" 
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
        <el-table-column prop="isRead" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isRead ? 'success' : 'warning'" size="small">
              {{ row.isRead ? '已读' : '未读' }}
            </el-tag>
            <el-tag v-if="row.isResolved" type="success" size="small" style="margin-left: 4px">
              已处理
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button @click="viewAlertDetails(row)" size="small" type="primary">
              详情
            </el-button>
            <el-button 
              v-if="!row.isRead" 
              @click="markAsRead(row.id)" 
              size="small" 
              type="success"
            >
              标记已读
            </el-button>
            <el-button 
              v-if="!row.isResolved" 
              @click="openResolveDialog(row)" 
              size="small" 
              type="warning"
            >
              标记处理
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

    <!-- 告警详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="告警详情" width="800px">
      <div v-if="selectedAlert" class="alert-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">
            {{ formatDate(selectedAlert.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLevelType(selectedAlert.level)">
              {{ selectedAlert.level.toUpperCase() }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="来源">{{ selectedAlert.source }}</el-descriptions-item>
          <el-descriptions-item label="类别">{{ selectedAlert.category }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ selectedAlert.userName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ selectedAlert.ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="页面" :span="2">{{ selectedAlert.url || '-' }}</el-descriptions-item>
          <el-descriptions-item label="标题" :span="2">{{ selectedAlert.title }}</el-descriptions-item>
          <el-descriptions-item label="消息" :span="2">{{ selectedAlert.message }}</el-descriptions-item>
          <el-descriptions-item label="邮件发送">
            <el-tag :type="selectedAlert.emailSent ? 'success' : 'info'">
              {{ selectedAlert.emailSent ? '已发送' : '未发送' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理状态">
            <el-tag :type="selectedAlert.isResolved ? 'success' : 'warning'">
              {{ selectedAlert.isResolved ? '已处理' : '未处理' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedAlert.details" class="details-section">
          <h4>详细信息</h4>
          <pre>{{ formatJson(selectedAlert.details) }}</pre>
        </div>

        <div v-if="selectedAlert.stack" class="details-section">
          <h4>错误堆栈</h4>
          <pre>{{ selectedAlert.stack }}</pre>
        </div>

        <div v-if="selectedAlert.resolvedNote" class="details-section">
          <h4>处理备注</h4>
          <p>{{ selectedAlert.resolvedNote }}</p>
        </div>

        <div v-if="selectedAlert.notifications && selectedAlert.notifications.length > 0" class="details-section">
          <h4>通知记录</h4>
          <el-table :data="selectedAlert.notifications" size="small">
            <el-table-column prop="type" label="类型" width="80" />
            <el-table-column prop="recipient" label="接收者" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.status === 'sent' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'sent' ? '成功' : '失败' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sentAt" label="发送时间" width="150">
              <template #default="{ row }">
                {{ row.sentAt ? formatDate(row.sentAt) : '-' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>

    <!-- 标记处理对话框 -->
    <el-dialog v-model="showResolveDialog" title="标记为已处理" width="500px">
      <el-form :model="resolveForm" label-width="100px">
        <el-form-item label="处理人">
          <el-input v-model="resolveForm.resolvedBy" placeholder="请输入处理人姓名" />
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input 
            v-model="resolveForm.note" 
            type="textarea" 
            :rows="4"
            placeholder="请输入处理备注（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResolveDialog = false">取消</el-button>
        <el-button @click="markAsResolved" type="primary" :loading="resolving">
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/lib/api'

interface Alert {
  id: string
  timestamp: string
  level: string
  source: string
  category: string
  title: string
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
  tags?: string
  isRead: boolean
  isResolved: boolean
  resolvedBy?: string
  resolvedAt?: string
  resolvedNote?: string
  emailSent: boolean
  emailSentAt?: string
  createdAt: string
  updatedAt: string
  notifications?: any[]
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  total: number
  unread: number
  unresolved: number
  byLevel: Record<string, number>
  bySource: Record<string, number>
  byCategory: Record<string, number>
}

const loading = ref(false)
const resolving = ref(false)
const alerts = ref<Alert[]>([])
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
  status: '',
  search: ''
})

const showDetailsDialog = ref(false)
const showResolveDialog = ref(false)
const selectedAlert = ref<Alert | null>(null)
const resolveForm = reactive({
  alertId: '',
  resolvedBy: '',
  note: ''
})

// 计算属性
const hasUnreadAlerts = computed(() => {
  return alerts.value.some(alert => !alert.isRead)
})

// 获取告警列表
const fetchAlerts = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...filters
    })
    
    const response = await api.get(`/alerts?${params}`)
    alerts.value = response.data.data
    pagination.total = response.data.pagination.total
    pagination.totalPages = response.data.pagination.totalPages
  } catch (error) {
    ElMessage.error('获取告警失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取统计信息
const fetchStats = async () => {
  try {
    const response = await api.get('/alerts/stats')
    const data: Stats = response.data
    
    stats.value = [
      { label: '总告警数', value: data.total, class: '' },
      { label: '未读告警', value: data.unread, class: 'warning' },
      { label: '未处理告警', value: data.unresolved, class: 'danger' },
      { label: '严重告警', value: data.byLevel.critical || 0, class: 'danger' }
    ]
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 刷新告警
const refreshAlerts = () => {
  fetchAlerts()
  fetchStats()
}

// 应用筛选
const applyFilters = () => {
  pagination.page = 1
  fetchAlerts()
}

// 重置筛选
const resetFilters = () => {
  Object.assign(filters, {
    level: '',
    source: '',
    status: '',
    search: ''
  })
  pagination.page = 1
  fetchAlerts()
}

// 查看告警详情
const viewAlertDetails = (alert: Alert) => {
  selectedAlert.value = alert
  showDetailsDialog.value = true
}

// 标记为已读
const markAsRead = async (alertId: string) => {
  try {
    await api.post(`/alerts/${alertId}/read`)
    ElMessage.success('标记成功')
    refreshAlerts()
  } catch (error) {
    ElMessage.error('标记失败')
    console.error(error)
  }
}

// 显示处理对话框
const openResolveDialog = (alert: Alert) => {
  resolveForm.alertId = alert.id
  resolveForm.resolvedBy = ''
  resolveForm.note = ''
  showResolveDialog.value = true
}

// 标记为已处理
const markAsResolved = async () => {
  if (!resolveForm.resolvedBy.trim()) {
    ElMessage.warning('请输入处理人姓名')
    return
  }

  try {
    resolving.value = true
    await api.post(`/alerts/${resolveForm.alertId}/resolve`, {
      resolvedBy: resolveForm.resolvedBy,
      note: resolveForm.note
    })
    
    ElMessage.success('处理成功')
    showResolveDialog.value = false
    refreshAlerts()
  } catch (error) {
    ElMessage.error('处理失败')
    console.error(error)
  } finally {
    resolving.value = false
  }
}

// 全部标记为已读
const markAllAsRead = async () => {
  try {
    // 使用新的API来标记所有未读告警为已读
    const response = await api.post('/alerts/mark-all-read')
    ElMessage.success(response.data.message)
    refreshAlerts()
  } catch (error) {
    ElMessage.error('标记失败')
    console.error(error)
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchAlerts()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchAlerts()
}

// 工具函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getLevelType = (level: string) => {
  const types: Record<string, string> = {
    critical: 'danger',
    error: 'danger',
    warning: 'warning',
    info: 'info'
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

const truncateTitle = (title: string) => {
  if (title.length <= 80) {
    return title
  }
  return title.substring(0, 80) + '...'
}

onMounted(() => {
  fetchAlerts()
  fetchStats()
})
</script>

<style scoped>
.system-alerts {
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
  margin-bottom: 8px;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.danger {
  color: #f56c6c;
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

.alert-details {
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

.title-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
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
</style> 