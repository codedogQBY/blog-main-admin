<template>
  <div class="two-factor-management">
    <div class="header">
      <h1>双因素认证管理</h1>
      <p class="description">管理用户的2FA设置和安全状态</p>
    </div>

    <!-- 2FA状态概览 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-number">{{ stats.totalUsers }}</div>
        <div class="stat-label">总用户数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.enabled2FA }}</div>
        <div class="stat-label">已启用2FA</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.lockedUsers }}</div>
        <div class="stat-label">被锁定用户</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.pendingRecoveries }}</div>
        <div class="stat-label">待处理恢复</div>
      </div>
    </div>

    <!-- 用户2FA状态列表 -->
    <div class="section">
      <h2>用户2FA状态</h2>
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>邮箱</th>
              <th>2FA状态</th>
              <th>设置时间</th>
              <th>备用码数量</th>
              <th>锁定状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.name }}</td>
              <td>{{ user.mail }}</td>
              <td>
                <span :class="['status-badge', user.twoFactorEnabled ? 'enabled' : 'disabled']">
                  {{ user.twoFactorEnabled ? '已启用' : '未启用' }}
                </span>
              </td>
              <td>{{ user.twoFactorSetupAt ? formatDate(user.twoFactorSetupAt) : '-' }}</td>
              <td>{{ user.backupCodesCount || 0 }}</td>
              <td>
                <span v-if="user.lockStatus?.locked" class="status-badge locked">
                  已锁定 ({{ user.lockStatus.remainingMinutes }}分钟)
                </span>
                <span v-else class="status-badge unlocked">正常</span>
              </td>
              <td>
                <div class="actions">
                  <button 
                    v-if="!user.twoFactorEnabled" 
                    @click="showBind2FAModal(user)"
                    class="btn btn-primary btn-sm"
                  >
                    绑定2FA
                  </button>
                  <button 
                    v-if="user.twoFactorEnabled" 
                    @click="showDisable2FAModal(user)"
                    class="btn btn-danger btn-sm"
                  >
                    禁用2FA
                  </button>
                  <button 
                    @click="showBackupCodesModal(user)"
                    class="btn btn-secondary btn-sm"
                  >
                    备用码
                  </button>
                  <button 
                    v-if="user.lockStatus?.locked" 
                    @click="unlockUser(user)"
                    class="btn btn-warning btn-sm"
                  >
                    解锁
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 2FA安全统计 -->
    <div class="section">
      <h2>安全统计</h2>
      <div class="stats-grid">
        <div class="stat-item">
          <h3>尝试记录</h3>
          <div class="stat-details">
            <p>总尝试次数: {{ securityStats.totalAttempts }}</p>
            <p>成功次数: {{ securityStats.successfulAttempts }}</p>
            <p>失败次数: {{ securityStats.failedAttempts }}</p>
            <p>成功率: {{ securityStats.successRate }}%</p>
          </div>
        </div>
        <div class="stat-item">
          <h3>锁定状态</h3>
          <div class="stat-details">
            <p>活跃锁定: {{ securityStats.activeLocks }}</p>
            <p>待处理恢复: {{ securityStats.pendingRecoveries }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 绑定2FA模态框 -->
    <div v-if="showBindModal" class="modal-overlay" @click="closeBindModal">
      <div class="modal" @click.stop>
        <h3>绑定2FA</h3>
        <div v-if="qrCodeData" class="qr-section">
          <h4>扫描二维码</h4>
          <div class="qr-code">
            <img :src="qrCodeData.qrCode" alt="2FA QR Code" />
          </div>
          <p>请使用Google Authenticator或其他TOTP应用扫描此二维码</p>
          
          <div class="verification-section">
            <h4>验证设置</h4>
            <input 
              v-model="verificationToken" 
              type="text" 
              placeholder="输入6位验证码"
              class="form-input"
              maxlength="6"
            />
            <div class="button-group">
              <button @click="verifyAndBind" class="btn btn-primary" :disabled="!verificationToken">
                验证并绑定
              </button>
              <button @click="closeBindModal" class="btn btn-secondary">取消</button>
            </div>
          </div>
        </div>
        <div v-else class="loading">
          <p>正在生成二维码...</p>
        </div>
      </div>
    </div>

    <!-- 禁用2FA模态框 -->
    <div v-if="showDisableModal" class="modal-overlay" @click="closeDisableModal">
      <div class="modal" @click.stop>
        <h3>禁用2FA</h3>
        <p>为了安全起见，请输入您的2FA验证码来确认禁用操作。</p>
        <input 
          v-model="disableToken" 
          type="text" 
          placeholder="输入6位验证码"
          class="form-input"
          maxlength="6"
        />
        <div class="button-group">
          <button @click="disable2FA" class="btn btn-danger" :disabled="!disableToken">
            确认禁用
          </button>
          <button @click="closeDisableModal" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>

    <!-- 备用码模态框 -->
    <div v-if="showBackupModal" class="modal-overlay" @click="closeBackupModal">
      <div class="modal" @click.stop>
        <h3>备用验证码</h3>
        <div v-if="backupCodes.length > 0" class="backup-codes">
          <p>请妥善保管以下备用验证码，每个码只能使用一次：</p>
          <div class="codes-grid">
            <div v-for="code in backupCodes" :key="code" class="code-item">
              {{ code }}
            </div>
          </div>
          <div class="button-group">
            <button @click="regenerateBackupCodes" class="btn btn-warning">
              重新生成
            </button>
            <button @click="closeBackupModal" class="btn btn-secondary">关闭</button>
          </div>
        </div>
        <div v-else class="loading">
          <p>正在获取备用码...</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { api } from '../lib/api'

// 类型定义
interface User {
  id: string
  name: string
  mail: string
  twoFactorEnabled: boolean
  twoFactorSetupAt?: string
  backupCodesCount?: number
  lockStatus?: {
    locked: boolean
    lockType?: string
    lockedUntil?: string
    remainingMinutes?: number
  }
}

// 响应式数据
const users = ref<User[]>([])
const stats = ref({
  totalUsers: 0,
  enabled2FA: 0,
  lockedUsers: 0,
  pendingRecoveries: 0
})
const securityStats = ref({
  totalAttempts: 0,
  successfulAttempts: 0,
  failedAttempts: 0,
  successRate: '0',
  activeLocks: 0,
  pendingRecoveries: 0
})

// 模态框状态
const showBindModal = ref(false)
const showDisableModal = ref(false)
const showBackupModal = ref(false)
const selectedUser = ref<User | null>(null)
interface QRCodeData {
  secret: string
  qrCode: string
}

const qrCodeData = ref<QRCodeData | null>(null)
const verificationToken = ref('')
const disableToken = ref('')
const backupCodes = ref([])

// 获取用户列表和2FA状态
const loadUsers = async () => {
  try {
    const response = await api.get('/users')
    // 正确处理API返回的数据结构
    const userList = response.data.data || response.data
    users.value = userList.map((user: any) => ({
      ...user,
      backupCodesCount: user.backupCodes ? JSON.parse(user.backupCodes).length : 0,
      lockStatus: null // 稍后获取锁定状态
    }))
    
    // 获取每个用户的锁定状态
    for (const user of users.value) {
      try {
        const lockResponse = await api.get(`/auth/two-factor-auxiliary/locks/check?userId=${user.id}`)
        user.lockStatus = lockResponse.data
      } catch (error) {
        console.error('获取用户锁定状态失败:', error)
        user.lockStatus = { locked: false }
      }
    }
    
    // 计算统计信息
    stats.value = {
      totalUsers: users.value.length,
      enabled2FA: users.value.filter(u => u.twoFactorEnabled).length,
      lockedUsers: users.value.filter(u => u.lockStatus?.locked).length,
      pendingRecoveries: 0 // 稍后获取
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  }
}

// 获取安全统计
const loadSecurityStats = async () => {
  try {
    const response = await api.get('/auth/two-factor-auxiliary/stats')
    securityStats.value = response.data
  } catch (error) {
    console.error('加载安全统计失败:', error)
  }
}

// 显示绑定2FA模态框
const showBind2FAModal = async (user: User) => {
  selectedUser.value = user
  showBindModal.value = true
  verificationToken.value = ''
  
  try {
    const response = await api.get('/auth/two-factor/generate')
    qrCodeData.value = response.data
  } catch (error) {
    console.error('生成二维码失败:', error)
  }
}

// 验证并绑定2FA
const verifyAndBind = async () => {
  if (!verificationToken.value || verificationToken.value.length !== 6) {
    alert('请输入6位验证码')
    return
  }
  
  try {
    if (!qrCodeData.value) {
      alert('二维码数据不存在，请重新生成')
      return
    }
    await api.post('/auth/two-factor/bind', {
      token: verificationToken.value,
      secret: qrCodeData.value.secret
    })
    
    alert('2FA绑定成功！')
    closeBindModal()
    loadUsers() // 重新加载用户列表
  } catch (error) {
    console.error('绑定2FA失败:', error)
    alert('绑定失败，请检查验证码是否正确')
  }
}

// 显示禁用2FA模态框
const showDisable2FAModal = (user: User) => {
  selectedUser.value = user
  showDisableModal.value = true
  disableToken.value = ''
}

// 禁用2FA
const disable2FA = async () => {
  if (!disableToken.value || disableToken.value.length !== 6) {
    alert('请输入6位验证码')
    return
  }
  
  try {
    await api.post('/auth/two-factor/disable', {
      token: disableToken.value
    })
    
    alert('2FA已禁用')
    closeDisableModal()
    loadUsers() // 重新加载用户列表
  } catch (error) {
    console.error('禁用2FA失败:', error)
    alert('禁用失败，请检查验证码是否正确')
  }
}

// 显示备用码模态框
const showBackupCodesModal = async (user: User) => {
  selectedUser.value = user
  showBackupModal.value = true
  backupCodes.value = []
  
  try {
    // 这里需要为特定用户获取备用码，但API可能需要调整
    // 暂时使用当前用户的备用码
    const response = await api.get('/auth/two-factor/backup-codes')
    backupCodes.value = response.data.codes || response.data
  } catch (error) {
    console.error('获取备用码失败:', error)
    alert('获取备用码失败')
  }
}

// 重新生成备用码
const regenerateBackupCodes = async () => {
  try {
    const response = await api.post('/auth/two-factor/regenerate-backup-codes')
    backupCodes.value = response.data.codes || response.data
    alert('备用码已重新生成')
  } catch (error) {
    console.error('重新生成备用码失败:', error)
    alert('重新生成失败')
  }
}

// 解锁用户
const unlockUser = async (user: User) => {
  try {
    await api.post('/auth/two-factor-auxiliary/locks/unlock', {
      userId: user.id
    })
    
    alert('用户已解锁')
    loadUsers() // 重新加载用户列表
  } catch (error) {
    console.error('解锁用户失败:', error)
    alert('解锁失败')
  }
}

// 关闭模态框
const closeBindModal = () => {
  showBindModal.value = false
  selectedUser.value = null
  qrCodeData.value = null
  verificationToken.value = ''
}

const closeDisableModal = () => {
  showDisableModal.value = false
  selectedUser.value = null
  disableToken.value = ''
}

const closeBackupModal = () => {
  showBackupModal.value = false
  selectedUser.value = null
  backupCodes.value = []
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}

// 页面加载时获取数据
onMounted(() => {
  loadUsers()
  loadSecurityStats()
})
</script>

<style scoped>
.two-factor-management {
  padding: 20px;
}

.header {
  margin-bottom: 30px;
}

.header h1 {
  margin: 0 0 10px 0;
  color: #333;
}

.description {
  color: #666;
  margin: 0;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #2563eb;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
}

.section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 20px;
}

.section h2 {
  margin: 0 0 20px 0;
  color: #333;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 500;
}

.status-badge.enabled {
  background: #dcfce7;
  color: #166534;
}

.status-badge.disabled {
  background: #fef2f2;
  color: #dc2626;
}

.status-badge.locked {
  background: #fef3c7;
  color: #d97706;
}

.status-badge.unlocked {
  background: #dcfce7;
  color: #166534;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-sm {
  padding: 4px 8px;
  font-size: 0.7em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.stat-item {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
}

.stat-item h3 {
  margin: 0 0 10px 0;
  color: #333;
}

.stat-details p {
  margin: 5px 0;
  color: #666;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.qr-section {
  text-align: center;
}

.qr-code {
  margin: 20px 0;
}

.qr-code img {
  max-width: 200px;
  height: auto;
}

.verification-section {
  margin-top: 20px;
  text-align: left;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 15px;
  font-size: 1.1em;
  text-align: center;
  letter-spacing: 2px;
}

.button-group {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.backup-codes {
  text-align: center;
}

.codes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin: 20px 0;
}

.code-item {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 1.1em;
  font-weight: bold;
  color: #333;
}

.loading {
  text-align: center;
  color: #666;
}
</style> 