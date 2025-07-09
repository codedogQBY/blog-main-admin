<template>
  <div class="performance-analysis">
    <div class="header">
      <h1>性能分析</h1>
      <div class="actions">
        <el-button @click="refreshData" :loading="loading">刷新</el-button>
        <el-button @click="showCleanDialog = true" type="warning">清理旧数据</el-button>
        <el-button @click="testPerformanceReport" type="success">测试性能上报</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-card v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-content">
          <div class="stat-value" :class="stat.class">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-trend" v-if="stat.trend">
            <span :class="stat.trend > 0 ? 'up' : 'down'">
              {{ stat.trend > 0 ? '+' : '' }}{{ stat.trend }}%
            </span>
            <span class="trend-label">较昨日</span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 页面性能统计 -->
    <el-card class="page-stats-card" style="margin-bottom: 20px;">
      <template #header>
        <div class="chart-header">
          <span>页面性能统计</span>
          <el-select v-model="pageStatsType" placeholder="选择指标" style="width: 150px;" @change="fetchPageStats">
            <el-option label="LCP (最大内容绘制)" value="largestContentfulPaint" />
            <el-option label="FID (首次输入延迟)" value="firstInput" />
            <el-option label="CLS (布局偏移)" value="layoutShift" />
            <el-option label="FCP (首次内容绘制)" value="firstContentfulPaint" />
            <el-option label="长任务数量" value="longTask" />
          </el-select>
        </div>
      </template>
      <div class="page-stats-container">
        <el-table :data="pageStats" stripe>
          <el-table-column prop="pageUrl" label="页面" min-width="200" show-overflow-tooltip />
          <el-table-column prop="count" label="样本数" width="80" />
          <el-table-column prop="avgValue" label="平均值" width="100">
            <template #default="{ row }">
              {{ formatValue(row.avgValue, pageStatsType) }}
            </template>
          </el-table-column>
          <el-table-column prop="minValue" label="最小值" width="100">
            <template #default="{ row }">
              {{ formatValue(row.minValue, pageStatsType) }}
            </template>
          </el-table-column>
          <el-table-column prop="maxValue" label="最大值" width="100">
            <template #default="{ row }">
              {{ formatValue(row.maxValue, pageStatsType) }}
            </template>
          </el-table-column>
          <el-table-column prop="poorRate" label="异常率" width="100">
            <template #default="{ row }">
              <el-tag :type="row.poorRate > 0.1 ? 'danger' : row.poorRate > 0.05 ? 'warning' : 'success'" size="small">
                {{ (row.poorRate * 100).toFixed(1) }}%
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 性能指标图表 -->
    <el-card class="chart-card">
      <template #header>
        <div class="chart-header">
          <span>性能指标趋势</span>
          <div class="chart-controls">
            <el-select v-model="chartSource" placeholder="选择来源" style="width: 120px; margin-right: 10px;">
              <el-option label="前端" value="frontend" />
              <el-option label="后台" value="admin" />
            </el-select>
            <el-select v-model="chartType" placeholder="选择指标" style="width: 150px;">
              <el-option label="LCP (最大内容绘制)" value="largestContentfulPaint" />
              <el-option label="FID (首次输入延迟)" value="firstInput" />
              <el-option label="CLS (布局偏移)" value="layoutShift" />
              <el-option label="FCP (首次内容绘制)" value="firstContentfulPaint" />
              <el-option label="TTFB (首字节时间)" value="TTFB" />
              <el-option label="FSP (首屏时间)" value="FSP" />
              <el-option label="长任务数量" value="longTask" />
              <el-option label="内存使用" value="memory" />
            </el-select>
          </div>
        </div>
      </template>
      <div class="chart-container">
        <div ref="chartRef" style="width: 100%; height: 300px;"></div>
      </div>
    </el-card>

    <!-- 筛选器 -->
    <el-card class="filter-card">
      <el-form :model="filters" inline>
        <el-form-item label="来源">
          <el-select v-model="filters.source" placeholder="选择来源" clearable style="width: 120px;">
            <el-option label="前端" value="frontend" />
            <el-option label="后台" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="选择类型" clearable style="width: 150px;">
            <el-option label="长任务" value="longTask" />
            <el-option label="最大内容绘制" value="largestContentfulPaint" />
            <el-option label="首次输入延迟" value="firstInput" />
            <el-option label="首次绘制" value="firstPaint" />
            <el-option label="首次内容绘制" value="firstContentfulPaint" />
            <el-option label="布局偏移" value="layoutShift" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input v-model="filters.search" placeholder="搜索页面URL或用户" style="width: 200px;" />
        </el-form-item>
        <el-form-item>
          <el-button @click="applyFilters" type="primary">筛选</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 性能数据列表 -->
    <el-card>
      <el-table :data="performanceData" v-loading="loading" stripe>
        <el-table-column prop="timestamp" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.timestamp) }}
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)" size="small">
              {{ getTypeDisplayName(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="数值" width="100">
          <template #default="{ row }">
            <span v-if="row.value !== null && row.value !== undefined">
              {{ formatValue(row.value, row.type) }}
            </span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="持续时间" width="100">
          <template #default="{ row }">
            <span v-if="row.duration">{{ row.duration }}ms</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="pageUrl" label="页面" min-width="200" show-overflow-tooltip />
        <el-table-column prop="userName" label="用户" width="100" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button @click="viewDetails(row)" size="small" type="primary">
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

    <!-- 性能数据详情对话框 -->
    <el-dialog v-model="showDetailsDialog" title="性能数据详情" width="800px">
      <div v-if="selectedData" class="performance-details">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">
            {{ formatDate(selectedData.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            <el-tag>{{ selectedData.source }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="getTypeTagType(selectedData.type)">
              {{ getTypeDisplayName(selectedData.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="数值">
            {{ formatValue(selectedData.value, selectedData.type) }}
          </el-descriptions-item>
          <el-descriptions-item label="持续时间">
            {{ selectedData.duration ? `${selectedData.duration}ms` : '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ selectedData.userName || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="页面" :span="2">
            {{ selectedData.pageUrl || selectedData.url || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="设备信息" :span="2">
            <div v-if="selectedData.deviceInfo" class="device-info">
              <div>浏览器: {{ selectedData.deviceInfo.browser }} {{ selectedData.deviceInfo.browserVersion }}</div>
              <div>操作系统: {{ selectedData.deviceInfo.os }} {{ selectedData.deviceInfo.osVersion }}</div>
              <div>设备: {{ selectedData.deviceInfo.device }} ({{ selectedData.deviceInfo.device_type }})</div>
            </div>
            <span v-else>-</span>
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedData.details" class="details-section">
          <h4>详细信息</h4>
          <pre>{{ formatJson(selectedData.details) }}</pre>
        </div>

        <div v-if="selectedData.tags" class="details-section">
          <h4>标签</h4>
          <pre>{{ formatJson(selectedData.tags) }}</pre>
        </div>
      </div>
    </el-dialog>

    <!-- 清理数据对话框 -->
    <el-dialog v-model="showCleanDialog" title="清理旧性能数据" width="400px">
      <el-form :model="cleanForm" label-width="100px">
        <el-form-item label="保留天数">
          <el-input-number v-model="cleanForm.days" :min="1" :max="365" />
        </el-form-item>
        <el-form-item>
          <el-alert
            title="警告"
            type="warning"
            description="此操作将永久删除指定天数之前的性能数据，请谨慎操作！"
            show-icon
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCleanDialog = false">取消</el-button>
        <el-button @click="cleanOldData" type="warning" :loading="cleaning">
          确认清理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { api } from '@/lib/api'
import * as echarts from 'echarts'

interface PerformanceData {
  id: string
  timestamp: string
  source: string
  type: string
  name?: string
  value?: number
  duration?: number
  url?: string
  userAgent?: string
  ip?: string
  userId?: string
  userName?: string
  sessionId?: string
  requestId?: string
  deviceInfo?: any
  pageUrl?: string
  time?: number
  status?: string
  sdkVersion?: string
  uuid?: string
  details?: any
  tags?: any
  apikey?: string
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
  byType: Record<string, number>
  bySource: Record<string, number>
  byTypeDetail: Record<string, number>
  averages: {
    lcp: number
    fid: number
    longTask: number
  }
  todayCount: number
  frontendAverages?: {
    lcp: number
    fid: number
  }
  frontendPoorRate?: number
  adminAverages?: {
    lcp: number
    fid: number
  }
  adminPoorRate?: number
}

const loading = ref(false)
const cleaning = ref(false)
const performanceData = ref<PerformanceData[]>([])
const stats = ref<any[]>([])
const pagination = reactive<Pagination>({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})

const filters = reactive({
  source: '',
  type: '',
  search: ''
})

const showDetailsDialog = ref(false)
const showCleanDialog = ref(false)
const selectedData = ref<PerformanceData | null>(null)
const cleanForm = reactive({
  days: 30
})

// 图表相关
const chartRef = ref<HTMLElement>()
const chartType = ref('largestContentfulPaint')
const pageStatsType = ref('largestContentfulPaint')
const pageStats = ref<any[]>([])
const chartSource = ref('frontend')
let chart: echarts.ECharts | null = null

// 获取性能数据列表
const fetchPerformanceData = async () => {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: pagination.page.toString(),
      limit: pagination.limit.toString(),
      ...filters
    })
    
    const response = await api.get(`/performance?${params}`)
    performanceData.value = response.data.data
    pagination.total = response.data.pagination.total
    pagination.totalPages = response.data.pagination.totalPages
  } catch (error) {
    ElMessage.error('获取性能数据失败')
    console.error(error)
  } finally {
    loading.value = false
  }
}

// 获取统计信息
const fetchStats = async () => {
  try {
    const response = await api.get('/performance/stats')
    const data: Stats = response.data
    
    // 前端统计数据
    const frontendStats = [
      { label: '前端数据量', value: data.bySource.frontend || 0, class: 'success' },
      { label: '前端平均LCP', value: `${data.frontendAverages?.lcp?.toFixed(0) || 0}ms`, class: 'info' },
      { label: '前端平均FID', value: `${data.frontendAverages?.fid?.toFixed(0) || 0}ms`, class: 'info' },
      { label: '前端异常率', value: `${((data.frontendPoorRate || 0) * 100).toFixed(1)}%`, class: 'danger' },
    ]
    
    // 后台统计数据
    const adminStats = [
      { label: '后台数据量', value: data.bySource.admin || 0, class: 'primary' },
      { label: '后台平均LCP', value: `${data.adminAverages?.lcp?.toFixed(0) || 0}ms`, class: 'info' },
      { label: '后台平均FID', value: `${data.adminAverages?.fid?.toFixed(0) || 0}ms`, class: 'info' },
      { label: '后台异常率', value: `${((data.adminPoorRate || 0) * 100).toFixed(1)}%`, class: 'danger' },
    ]
    
    // 总体统计数据
    const totalStats = [
      { label: '总数据量', value: data.total, class: '' },
      { label: '长任务数', value: data.byType.longTask || 0, class: 'warning' },
      { label: '今日新增', value: data.todayCount || 0, class: 'info' },
    ]
    
    stats.value = [...frontendStats, ...adminStats, ...totalStats]
  } catch (error) {
    console.error('获取统计信息失败:', error)
  }
}

// 刷新数据
const refreshData = () => {
  fetchPerformanceData()
  fetchStats()
  fetchPageStats()
  updateChart()
}

// 应用筛选
const applyFilters = () => {
  pagination.page = 1
  fetchPerformanceData()
}

// 重置筛选
const resetFilters = () => {
  Object.assign(filters, {
    source: '',
    type: '',
    search: ''
  })
  pagination.page = 1
  fetchPerformanceData()
}

// 查看详情
const viewDetails = (data: PerformanceData) => {
  selectedData.value = data
  showDetailsDialog.value = true
}

// 清理旧数据
const cleanOldData = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要删除${cleanForm.days}天前的性能数据吗？此操作不可恢复！`,
      '确认清理',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    cleaning.value = true
    const response = await api.post('/performance/clean', { days: cleanForm.days })
    
    ElMessage.success(`成功清理 ${response.data.deletedCount} 条性能数据`)
    showCleanDialog.value = false
    refreshData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('清理数据失败')
      console.error(error)
    }
  } finally {
    cleaning.value = false
  }
}

// 测试性能数据上报
const testPerformanceReport = async () => {
  try {
    // 测试多种性能指标
    const testDataList = [
      {
        type: 'performance',
        name: 'FCP',
        value: 1000,
        status: 'ok',
        time: Date.now(),
        apikey: 'blog-admin',
        deviceInfo: {
          browser: 'Chrome',
          browserVersion: '135.0.0.0',
          os: 'Mac OS',
          osVersion: '10.15.7',
          device: 'Unknown',
          device_type: 'Pc'
        },
        pageUrl: window.location.href,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          environment: 'development',
          appVersion: '1.0.0',
          source: 'admin'
        }
      },
      {
        type: 'performance',
        name: 'LCP',
        value: 2500,
        status: 'ok',
        time: Date.now(),
        apikey: 'blog-admin',
        deviceInfo: {
          browser: 'Chrome',
          browserVersion: '135.0.0.0',
          os: 'Mac OS',
          osVersion: '10.15.7',
          device: 'Unknown',
          device_type: 'Pc'
        },
        pageUrl: window.location.href,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          environment: 'development',
          appVersion: '1.0.0',
          source: 'admin'
        }
      },
      {
        type: 'performance',
        name: 'FID',
        value: 150,
        status: 'ok',
        time: Date.now(),
        apikey: 'blog-admin',
        deviceInfo: {
          browser: 'Chrome',
          browserVersion: '135.0.0.0',
          os: 'Mac OS',
          osVersion: '10.15.7',
          device: 'Unknown',
          device_type: 'Pc'
        },
        pageUrl: window.location.href,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          environment: 'development',
          appVersion: '1.0.0',
          source: 'admin'
        }
      },
      {
        type: 'performance',
        name: 'longTask',
        longTask: {
          name: 'test-long-task',
          entryType: 'longtask',
          startTime: Date.now(),
          duration: 100,
          attribution: []
        },
        status: 'ok',
        time: Date.now(),
        apikey: 'blog-admin',
        deviceInfo: {
          browser: 'Chrome',
          browserVersion: '135.0.0.0',
          os: 'Mac OS',
          osVersion: '10.15.7',
          device: 'Unknown',
          device_type: 'Pc'
        },
        pageUrl: window.location.href,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          environment: 'development',
          appVersion: '1.0.0',
          source: 'admin'
        }
      }
    ]

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
    
    for (const testData of testDataList) {
      const response = await fetch(API_BASE_URL + '/logs/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testData)
      })
      
      if (response.ok) {
        console.log(`Test performance data sent: ${testData.name}`)
      } else {
        console.error(`Failed to send ${testData.name} data`)
      }
    }
    
    ElMessage.success('测试性能数据上报完成')
    refreshData()
  } catch (error) {
    ElMessage.error('测试性能数据上报失败')
    console.error('Test performance report error:', error)
  }
}

// 分页处理
const handleSizeChange = (size: number) => {
  pagination.limit = size
  pagination.page = 1
  fetchPerformanceData()
}

const handleCurrentChange = (page: number) => {
  pagination.page = page
  fetchPerformanceData()
}

// 工具函数
const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const getTypeDisplayName = (type: string) => {
  const names: Record<string, string> = {
    longTask: '长任务',
    largestContentfulPaint: '最大内容绘制',
    firstInput: '首次输入延迟',
    firstPaint: '首次绘制',
    firstContentfulPaint: '首次内容绘制',
    layoutShift: '布局偏移'
  }
  return names[type] || type
}

const getTypeTagType = (type: string) => {
  const types: Record<string, string> = {
    longTask: 'warning',
    largestContentfulPaint: 'info',
    firstInput: 'info',
    firstPaint: 'info',
    firstContentfulPaint: 'info',
    layoutShift: 'info'
  }
  return types[type] || 'info'
}

const formatValue = (value: number | undefined, type: string) => {
  if (value === null || value === undefined) return '-'
  
  switch (type) {
    case 'largestContentfulPaint':
    case 'firstInput':
    case 'firstPaint':
    case 'firstContentfulPaint':
      return `${value.toFixed(0)}ms`
    case 'layoutShift':
      return value.toFixed(3)
    default:
      return value.toString()
  }
}

const formatJson = (json: any) => {
  try {
    return JSON.stringify(json, null, 2)
  } catch {
    return String(json)
  }
}

// 图表相关
const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }
}

const updateChart = async () => {
  if (!chart) return
  
  try {
    // 获取图表数据
    const response = await api.get(`/performance?limit=100&type=${chartType.value}&source=${chartSource.value}`)
    const data = response.data.data
    
    const xData = data.map((item: PerformanceData) => formatDate(item.timestamp))
    const yData = data.map((item: PerformanceData) => {
      if (chartType.value === 'longTask') {
        return item.duration || 0
      }
      return item.value || 0
    })
    
    const option = {
      title: {
        text: `${getTypeDisplayName(chartType.value)}趋势`,
        left: 'center'
      },
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: xData,
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value',
        name: chartType.value === 'layoutShift' ? '偏移值' : '时间(ms)'
      },
      series: [{
        data: yData,
        type: 'line',
        smooth: true,
        name: getTypeDisplayName(chartType.value)
      }]
    }
    
    chart.setOption(option)
  } catch (error) {
    console.error('更新图表失败:', error)
  }
}

// 监听图表类型和来源变化
watch([chartType, chartSource], () => {
  updateChart()
})

// 获取页面性能统计
const fetchPageStats = async () => {
  try {
    const response = await api.get(`/performance/page-stats?type=${pageStatsType.value}`)
    pageStats.value = response.data
  } catch (error) {
    console.error('获取页面性能统计失败:', error)
  }
}

// 监听页面统计类型变化
watch(pageStatsType, () => {
  fetchPageStats()
})

// 组件挂载
onMounted(() => {
  fetchPerformanceData()
  fetchStats()
  fetchPageStats()
  nextTick(() => {
    initChart()
    updateChart()
  })
})
</script>

<style scoped>
.performance-analysis {
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

.actions {
  display: flex;
  gap: 10px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 8px;
}

.stat-value.warning {
  color: #e6a23c;
}

.stat-value.info {
  color: #409eff;
}

.stat-value.danger {
  color: #f56c6c;
}

.stat-value.success {
  color: #67c23a;
}

.stat-value.primary {
  color: #409eff;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.stat-trend {
  margin-top: 8px;
  font-size: 12px;
}

.stat-trend .up {
  color: #67c23a;
}

.stat-trend .down {
  color: #f56c6c;
}

.trend-label {
  color: #909399;
  margin-left: 4px;
}

.page-stats-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-controls {
  display: flex;
  align-items: center;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-container {
  padding: 10px 0;
}

.filter-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: center;
}

.performance-details {
  max-height: 500px;
  overflow-y: auto;
}

.device-info {
  font-size: 12px;
  color: #606266;
}

.device-info > div {
  margin-bottom: 4px;
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
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}
</style> 