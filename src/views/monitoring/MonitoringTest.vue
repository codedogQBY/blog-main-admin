<template>
  <div class="monitoring-test">
    <div class="header">
      <h1>监控功能测试</h1>
      <p class="description">用于测试 web-see 监控上报和日志功能</p>
    </div>

    <!-- 测试区域 -->
    <el-card class="test-section">
      <template #header>
        <div class="card-header">
          <span>错误测试</span>
        </div>
      </template>
      
      <div class="test-buttons">
        <el-button @click="testJavaScriptError" type="danger">
          触发 JavaScript 错误
        </el-button>
        <el-button @click="testAsyncError" type="danger">
          触发异步错误
        </el-button>
        <el-button @click="testPromiseRejection" type="danger">
          触发 Promise 拒绝
        </el-button>
        <el-button @click="testCustomError" type="warning">
          触发自定义错误
        </el-button>
      </div>
    </el-card>

    <el-card class="test-section">
      <template #header>
        <div class="card-header">
          <span>性能测试</span>
        </div>
      </template>
      
      <div class="test-buttons">
        <el-button @click="testSlowOperation" type="warning">
          模拟慢操作
        </el-button>
        <el-button @click="testMemoryLeak" type="warning">
          模拟内存泄漏
        </el-button>
        <el-button @click="testNetworkError" type="warning">
          模拟网络错误
        </el-button>
      </div>
    </el-card>

    <el-card class="test-section">
      <template #header>
        <div class="card-header">
          <span>用户行为测试</span>
        </div>
      </template>
      
      <div class="test-buttons">
        <el-button @click="testUserAction" type="primary">
          记录用户行为
        </el-button>
        <el-button @click="testPageNavigation" type="primary">
          模拟页面跳转
        </el-button>
        <el-button @click="testFormSubmission" type="primary">
          模拟表单提交
        </el-button>
      </div>
    </el-card>

    <el-card class="test-section">
      <template #header>
        <div class="card-header">
          <span>自定义日志测试</span>
        </div>
      </template>
      
      <div class="test-buttons">
        <el-button @click="testCustomLog" type="info">
          发送自定义日志
        </el-button>
        <el-button @click="testPerformanceLog" type="info">
          发送性能日志
        </el-button>
        <el-button @click="testBusinessLog" type="info">
          发送业务日志
        </el-button>
      </div>
    </el-card>

    <!-- 测试结果 -->
    <el-card class="test-section">
      <template #header>
        <div class="card-header">
          <span>测试结果</span>
          <el-button @click="clearResults" size="small" type="text">清空</el-button>
        </div>
      </template>
      
      <div class="results">
        <div v-for="(result, index) in testResults" :key="index" class="result-item">
          <div class="result-time">{{ result.time }}</div>
          <div class="result-type" :class="result.type">{{ result.type }}</div>
          <div class="result-message">{{ result.message }}</div>
        </div>
        <div v-if="testResults.length === 0" class="no-results">
          暂无测试结果
        </div>
      </div>
    </el-card>

    <!-- 快速跳转 -->
    <el-card class="test-section">
      <template #header>
        <div class="card-header">
          <span>快速跳转</span>
        </div>
      </template>
      
      <div class="test-buttons">
        <el-button @click="goToLogs" type="success">
          查看系统日志
        </el-button>
        <el-button @click="goToAlerts" type="success">
          查看系统告警
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { reportError, reportLog, reportPerformance } from '@/lib/websee-config'

const router = useRouter()

interface TestResult {
  time: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
}

const testResults = ref<TestResult[]>([])

// 添加测试结果
const addResult = (type: TestResult['type'], message: string) => {
  testResults.value.unshift({
    time: new Date().toLocaleTimeString(),
    type,
    message
  })
}

// 错误测试
const testJavaScriptError = () => {
  try {
    // 故意触发一个 JavaScript 错误
    const obj: any = null
    obj.nonExistentMethod()
  } catch (error) {
    addResult('error', 'JavaScript 错误已触发')
    ElMessage.error('JavaScript 错误已触发')
  }
}

const testAsyncError = () => {
  setTimeout(() => {
    try {
      throw new Error('这是一个异步错误')
    } catch (error) {
      addResult('error', '异步错误已触发')
      ElMessage.error('异步错误已触发')
    }
  }, 1000)
}

const testPromiseRejection = () => {
  Promise.reject(new Error('这是一个 Promise 拒绝错误'))
  addResult('error', 'Promise 拒绝错误已触发')
  ElMessage.error('Promise 拒绝错误已触发')
}

const testCustomError = () => {
  try {
    reportError(new Error('这是一个自定义错误'), {
      customData: '测试数据',
      userId: 'test-user',
      action: 'test-custom-error'
    })
    addResult('success', '自定义错误已上报')
    ElMessage.success('自定义错误已上报')
  } catch (error) {
    addResult('error', '自定义错误上报失败')
    ElMessage.error('自定义错误上报失败')
  }
}

// 性能测试
const testSlowOperation = () => {
  const startTime = performance.now()
  
  // 模拟慢操作
  setTimeout(() => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    reportPerformance({
      operation: 'slow-operation',
      duration,
      timestamp: new Date().toISOString()
    })
    
    addResult('warning', `慢操作测试完成，耗时: ${duration.toFixed(2)}ms`)
    ElMessage.warning(`慢操作测试完成，耗时: ${duration.toFixed(2)}ms`)
  }, 2000)
}

const testMemoryLeak = () => {
  // 模拟内存泄漏（创建大量对象）
  const objects: any[] = []
  for (let i = 0; i < 10000; i++) {
    objects.push({
      id: i,
      data: new Array(1000).fill('test data')
    })
  }
  
  reportLog('内存泄漏测试', {
    objectCount: objects.length,
    totalSize: objects.length * 1000,
    timestamp: new Date().toISOString()
  })
  
  addResult('warning', `内存泄漏测试完成，创建了 ${objects.length} 个对象`)
  ElMessage.warning(`内存泄漏测试完成，创建了 ${objects.length} 个对象`)
}

const testNetworkError = () => {
  // 模拟网络错误
  fetch('/api/non-existent-endpoint')
    .then(() => {
      addResult('success', '网络请求成功')
    })
    .catch((error) => {
      addResult('error', '网络请求失败')
      ElMessage.error('网络请求失败')
    })
}

// 用户行为测试
const testUserAction = () => {
  reportLog('用户行为测试', {
    action: 'button-click',
    button: 'test-user-action',
    timestamp: new Date().toISOString(),
    userId: 'test-user'
  })
  
  addResult('info', '用户行为已记录')
  ElMessage.info('用户行为已记录')
}

const testPageNavigation = () => {
  reportLog('页面导航测试', {
    action: 'navigation',
    from: '/monitoring-test',
    to: '/dashboard',
    timestamp: new Date().toISOString()
  })
  
  addResult('info', '页面导航已记录')
  ElMessage.info('页面导航已记录')
}

const testFormSubmission = () => {
  reportLog('表单提交测试', {
    action: 'form-submit',
    form: 'test-form',
    data: { name: 'test', email: 'test@example.com' },
    timestamp: new Date().toISOString()
  })
  
  addResult('info', '表单提交已记录')
  ElMessage.info('表单提交已记录')
}

// 自定义日志测试
const testCustomLog = () => {
  reportLog('这是一条自定义日志消息', {
    level: 'info',
    category: 'test',
    source: 'admin',
    timestamp: new Date().toISOString()
  })
  
  addResult('info', '自定义日志已发送')
  ElMessage.info('自定义日志已发送')
}

const testPerformanceLog = () => {
  reportPerformance({
    metric: 'page-load',
    value: Math.random() * 1000,
    unit: 'ms',
    timestamp: new Date().toISOString()
  })
  
  addResult('info', '性能日志已发送')
  ElMessage.info('性能日志已发送')
}

const testBusinessLog = () => {
  reportLog('业务操作日志', {
    businessType: 'user-management',
    operation: 'create-user',
    userId: 'new-user-123',
    timestamp: new Date().toISOString()
  })
  
  addResult('info', '业务日志已发送')
  ElMessage.info('业务日志已发送')
}

// 清空结果
const clearResults = () => {
  testResults.value = []
  ElMessage.success('测试结果已清空')
}

// 快速跳转
const goToLogs = () => {
  router.push('/system-logs')
}

const goToAlerts = () => {
  router.push('/system-alerts')
}
</script>

<style scoped>
.monitoring-test {
  padding: 20px;
}

.header {
  margin-bottom: 20px;
}

.header h1 {
  margin: 0 0 8px 0;
  color: #303133;
}

.description {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.test-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.test-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.results {
  max-height: 300px;
  overflow-y: auto;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.result-item:last-child {
  border-bottom: none;
}

.result-time {
  font-size: 12px;
  color: #909399;
  min-width: 80px;
}

.result-type {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  min-width: 60px;
  text-align: center;
}

.result-type.success {
  background: #f0f9ff;
  color: #67c23a;
}

.result-type.error {
  background: #fef0f0;
  color: #f56c6c;
}

.result-type.warning {
  background: #fdf6ec;
  color: #e6a23c;
}

.result-type.info {
  background: #f4f4f5;
  color: #909399;
}

.result-message {
  flex: 1;
  font-size: 14px;
  color: #303133;
}

.no-results {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}
</style> 