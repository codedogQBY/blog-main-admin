<template>
  <div class="user-profile">
    <div class="header">
      <h1>个人设置</h1>
      <p class="description">管理您的账户信息和安全设置</p>
    </div>

    <div class="profile-content">
      <!-- 基本信息 -->
      <div class="section">
        <h2>基本信息</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>用户名</label>
            <span>{{ user?.name }}</span>
          </div>
          <div class="info-item">
            <label>邮箱</label>
            <span>{{ user?.mail }}</span>
          </div>
          <div class="info-item">
            <label>角色</label>
            <span>{{ user?.role?.name || '无角色' }}</span>
          </div>
          <div class="info-item">
            <label>注册时间</label>
            <span>{{ formatDate(user?.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- 双因素认证 -->
      <div class="section">
        <h2>双因素认证</h2>
        <div class="twofa-status">
          <div class="status-info">
            <span :class="['status-badge', user?.twoFactorEnabled ? 'enabled' : 'disabled']">
              {{ user?.twoFactorEnabled ? '已启用' : '未启用' }}
            </span>
            <p v-if="user?.twoFactorEnabled">
              设置时间: {{ formatDate(user?.twoFactorSetupAt) }}
            </p>
          </div>
          
          <div class="twofa-actions">
            <button 
              v-if="!user?.twoFactorEnabled" 
              @click="showBind2FAModal"
              class="btn btn-primary"
            >
              启用2FA
            </button>
            <button 
              v-if="user?.twoFactorEnabled" 
              @click="showDisable2FAModal"
              class="btn btn-danger"
            >
              禁用2FA
            </button>
            <button 
              v-if="user?.twoFactorEnabled" 
              @click="showBackupCodesModal"
              class="btn btn-secondary"
            >
              管理备用码
            </button>
          </div>
        </div>
      </div>

      <!-- 安全统计 -->
      <div class="section">
        <h2>安全统计</h2>
        <div class="security-stats">
          <div class="stat-item">
            <div class="stat-number">{{ securityStats.totalAttempts || 0 }}</div>
            <div class="stat-label">总登录尝试</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ securityStats.successfulAttempts || 0 }}</div>
            <div class="stat-label">成功登录</div>
          </div>
          <div class="stat-item">
            <div class="stat-number">{{ securityStats.failedAttempts || 0 }}</div>
            <div class="stat-label">失败尝试</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 绑定2FA模态框 -->
    <div v-if="showBindModal" class="modal-overlay" @click="closeBindModal">
      <div class="modal" @click.stop>
        <h3>启用双因素认证</h3>
        <div v-if="qrCodeData" class="qr-section">
          <h4>步骤1: 扫描二维码</h4>
          <div class="qr-code">
            <img :src="qrCodeData.qrCode" alt="2FA QR Code" />
          </div>
          <p>请使用Google Authenticator或其他TOTP应用扫描此二维码</p>
          
          <div class="verification-section">
            <h4>步骤2: 验证设置</h4>
            <input 
              v-model="verificationToken" 
              type="text" 
              placeholder="输入6位验证码"
              class="form-input"
              maxlength="6"
            />
            <div class="button-group">
              <button @click="verifyAndBind" class="btn btn-primary" :disabled="!verificationToken">
                验证并启用
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
        <h3>禁用双因素认证</h3>
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
import { ElMessage } from 'element-plus'
import { api } from '../lib/api'

// 类型定义
interface User {
  id: string
  name: string
  mail: string
  twoFactorEnabled: boolean
  twoFactorSetupAt?: string
  role?: {
    id: string
    name: string
  }
  createdAt: string
}

interface SecurityStats {
  totalAttempts: number
  successfulAttempts: number
  failedAttempts: number
}

interface QRCodeData {
  secret: string
  qrCode: string
}

// 响应式数据
const user = ref<User | null>(null)
const securityStats = ref<SecurityStats>({
  totalAttempts: 0,
  successfulAttempts: 0,
  failedAttempts: 0
})

// 模态框状态
const showBindModal = ref(false)
const showDisableModal = ref(false)
const showBackupModal = ref(false)
const qrCodeData = ref<QRCodeData | null>(null)
const verificationToken = ref('')
const disableToken = ref('')
const backupCodes = ref<string[]>([])

// 获取用户信息
const loadUserProfile = async () => {
  try {
    const response = await api.getProfile()
    user.value = response
  } catch (error) {
    console.error('获取用户信息失败:', error)
    ElMessage.error('获取用户信息失败')
  }
}

// 获取安全统计
const loadSecurityStats = async () => {
  try {
    const response = await api.get('/auth/two-factor-auxiliary/stats')
    securityStats.value = response.data
  } catch (error) {
    console.error('获取安全统计失败:', error)
  }
}

// 显示绑定2FA模态框
const showBind2FAModal = async () => {
  showBindModal.value = true
  verificationToken.value = ''
  
  try {
    const response = await api.get('/auth/two-factor/generate')
    qrCodeData.value = response.data
  } catch (error) {
    console.error('生成二维码失败:', error)
    ElMessage.error('生成二维码失败')
  }
}

// 验证并绑定2FA
const verifyAndBind = async () => {
  if (!verificationToken.value || verificationToken.value.length !== 6) {
    ElMessage.warning('请输入6位验证码')
    return
  }
  
  try {
    if (!qrCodeData.value) {
      ElMessage.error('二维码数据不存在，请重新生成')
      return
    }
    await api.post('/auth/two-factor/bind', {
      token: verificationToken.value,
      secret: qrCodeData.value.secret
    })
    
    ElMessage.success('2FA启用成功！')
    closeBindModal()
    loadUserProfile() // 重新加载用户信息
  } catch (error) {
    console.error('启用2FA失败:', error)
    ElMessage.error('启用失败，请检查验证码是否正确')
  }
}

// 显示禁用2FA模态框
const showDisable2FAModal = () => {
  showDisableModal.value = true
  disableToken.value = ''
}

// 禁用2FA
const disable2FA = async () => {
  if (!disableToken.value || disableToken.value.length !== 6) {
    ElMessage.warning('请输入6位验证码')
    return
  }
  
  try {
    await api.post('/auth/two-factor/disable', {
      token: disableToken.value
    })
    
    ElMessage.success('2FA已禁用')
    closeDisableModal()
    loadUserProfile() // 重新加载用户信息
  } catch (error) {
    console.error('禁用2FA失败:', error)
    ElMessage.error('禁用失败，请检查验证码是否正确')
  }
}

// 显示备用码模态框
const showBackupCodesModal = async () => {
  showBackupModal.value = true
  backupCodes.value = []
  
  try {
    const response = await api.get('/auth/two-factor/backup-codes')
    backupCodes.value = response.data.codes || response.data
  } catch (error) {
    console.error('获取备用码失败:', error)
    ElMessage.error('获取备用码失败')
  }
}

// 重新生成备用码
const regenerateBackupCodes = async () => {
  try {
    const response = await api.post('/auth/two-factor/regenerate-backup-codes')
    backupCodes.value = response.data.codes || response.data
    ElMessage.success('备用码已重新生成')
  } catch (error) {
    console.error('重新生成备用码失败:', error)
    ElMessage.error('重新生成失败')
  }
}

// 关闭模态框
const closeBindModal = () => {
  showBindModal.value = false
  qrCodeData.value = null
  verificationToken.value = ''
}

const closeDisableModal = () => {
  showDisableModal.value = false
  disableToken.value = ''
}

const closeBackupModal = () => {
  showBackupModal.value = false
  backupCodes.value = []
}

// 格式化日期
const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString()
}

// 页面加载时获取数据
onMounted(() => {
  loadUserProfile()
  loadSecurityStats()
})
</script>

<style scoped>
.user-profile {
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

.profile-content {
  display: grid;
  gap: 30px;
}

.section {
  background: white;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.section h2 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 1.5em;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item label {
  font-weight: 500;
  color: #666;
  font-size: 0.9em;
}

.info-item span {
  color: #333;
  font-size: 1.1em;
}

.twofa-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9em;
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

.twofa-actions {
  display: flex;
  gap: 12px;
}

.security-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background: #f8fafc;
  border-radius: 8px;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #2563eb;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
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
  margin-top: 30px;
  text-align: center;
}

.form-input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 16px;
  margin-bottom: 20px;
}

.button-group {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-warning {
  background: #d97706;
  color: white;
}

.btn-warning:hover {
  background: #b45309;
}

.backup-codes {
  text-align: center;
}

.codes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 12px;
  margin: 20px 0;
}

.code-item {
  padding: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  color: #374151;
}

.loading {
  text-align: center;
  color: #666;
}
</style> 