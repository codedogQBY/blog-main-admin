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
        <el-table :data="users" style="width: 100%" v-loading="loading" class="user-table">
          <el-table-column prop="name" label="用户" min-width="150" />
          <el-table-column prop="mail" label="邮箱" min-width="200" />
          <el-table-column label="2FA状态" min-width="120">
            <template #default="{ row }">
              <el-tag :type="row.twoFactorEnabled ? 'success' : 'info'" size="small">
                {{ row.twoFactorEnabled ? '已启用' : '未启用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="设置时间" min-width="180">
            <template #default="{ row }">
              {{ row.twoFactorSetupAt ? formatDate(row.twoFactorSetupAt) : '-' }}
            </template>
          </el-table-column>
          <el-table-column label="备用码数量" min-width="120">
            <template #default="{ row }">
              {{ row.backupCodesCount || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="锁定状态" min-width="150">
            <template #default="{ row }">
              <el-tag v-if="row.lockStatus?.locked" type="danger" size="small">
                已锁定 ({{ row.lockStatus.remainingMinutes }}分钟)
              </el-tag>
              <el-tag v-else type="success" size="small">正常</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="350">
            <template #default="{ row }">
              <PermissionCheck permission="two_factor.bind">
                <el-button 
                  v-if="!row.twoFactorEnabled" 
                  @click="showBind2FAModal(row)"
                  type="primary"
                  size="small"
                >
                  绑定2FA
                </el-button>
              </PermissionCheck>
              
              <PermissionCheck permission="two_factor.unbind">
                <el-button 
                  v-if="row.twoFactorEnabled" 
                  @click="showDisable2FAModal(row)"
                  type="danger"
                  size="small"
                >
                  禁用2FA
                </el-button>
              </PermissionCheck>
              
              <PermissionCheck permission="two_factor.read">
                <el-button 
                  v-if="row.twoFactorEnabled" 
                  @click="showBackupCodesModal(row)"
                  type="warning"
                  size="small"
                >
                  备用码
                </el-button>
              </PermissionCheck>
              
              <PermissionCheck permission="two_factor.unlock">
                <el-button 
                  v-if="row.lockStatus?.locked" 
                  @click="unlockUser(row)"
                  type="warning"
                  size="small"
                >
                  解锁
                </el-button>
              </PermissionCheck>
              
              <PermissionCheck permission="two_factor.update">
                <el-button 
                  v-if="!row.lockStatus?.locked"
                  @click="showLockUserModal(row)"
                  type="danger"
                  size="small"
                >
                  锁定
                </el-button>
              </PermissionCheck>
            </template>
          </el-table-column>
        </el-table>
        
        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
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

    <!-- 审计日志 -->
    <div class="section">
      <h2>审计日志</h2>
      <div class="audit-tabs">
        <el-tabs v-model="activeAuditTab" @tab-click="handleAuditTabChange">
          <el-tab-pane label="尝试记录" name="attempts">
            <div class="audit-table-container">
              <el-table :data="auditAttempts" style="width: 100%" v-loading="auditLoading" class="audit-table">
                <el-table-column label="用户" min-width="150">
                  <template #default="{ row }">
                    {{ row.user?.name || '未知用户' }}
                  </template>
                </el-table-column>
                <el-table-column prop="attemptType" label="类型" min-width="120">
                  <template #default="{ row }">
                    <el-tag :type="row.attemptType === 'totp' ? 'primary' : 'warning'" size="small">
                      {{ row.attemptType === 'totp' ? 'TOTP' : '备用码' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="success" label="结果" min-width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.success ? 'success' : 'danger'" size="small">
                      {{ row.success ? '成功' : '失败' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="ipAddress" label="IP地址" min-width="150" />
                <el-table-column prop="createdAt" label="时间" min-width="200">
                  <template #default="{ row }">
                    {{ formatDate(row.createdAt) }}
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="auditCurrentPage"
                  v-model:page-size="auditPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="auditTotal"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleAuditSizeChange"
                  @current-change="handleAuditCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="锁定记录" name="locks">
            <div class="audit-table-container">
              <el-table :data="auditLocks" style="width: 100%" v-loading="auditLoading" class="audit-table">
                <el-table-column label="用户" min-width="150">
                  <template #default="{ row }">
                    {{ row.user?.name || '未知用户' }}
                  </template>
                </el-table-column>
                <el-table-column prop="lockType" label="锁定类型" min-width="120">
                  <template #default="{ row }">
                    <el-tag :type="getLockTypeColor(row.lockType)" size="small">
                      {{ getLockTypeLabel(row.lockType) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="lockedUntil" label="锁定到" min-width="200">
                  <template #default="{ row }">
                    {{ formatDate(row.lockedUntil) }}
                  </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" min-width="200">
                  <template #default="{ row }">
                    {{ formatDate(row.createdAt) }}
                  </template>
                </el-table-column>
                <el-table-column label="状态" min-width="100">
                  <template #default="{ row }">
                    <el-tag :type="isLockExpired(row.lockedUntil) ? 'success' : 'danger'" size="small">
                      {{ isLockExpired(row.lockedUntil) ? '已过期' : '活跃' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="auditCurrentPage"
                  v-model:page-size="auditPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="auditTotal"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleAuditSizeChange"
                  @current-change="handleAuditCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>
          
          <el-tab-pane label="操作日志" name="logs">
            <div class="audit-table-container">
              <el-table :data="auditLogs" style="width: 100%" v-loading="auditLoading" class="audit-table">
                <el-table-column label="用户" min-width="150">
                  <template #default="{ row }">
                    {{ row.user?.name || '未知用户' }}
                  </template>
                </el-table-column>
                <el-table-column prop="action" label="操作" min-width="120">
                  <template #default="{ row }">
                    <el-tag :type="getActionTypeColor(row.action)" size="small">
                      {{ getActionLabel(row.action) }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作员" min-width="150">
                  <template #default="{ row }">
                    {{ row.admin?.name || '系统' }}
                  </template>
                </el-table-column>
                <el-table-column prop="details" label="详情" min-width="200" />
                <el-table-column prop="createdAt" label="时间" min-width="200">
                  <template #default="{ row }">
                    {{ formatDate(row.createdAt) }}
                  </template>
                </el-table-column>
              </el-table>
              
              <div class="pagination-container">
                <el-pagination
                  v-model:current-page="auditCurrentPage"
                  v-model:page-size="auditPageSize"
                  :page-sizes="[10, 20, 50, 100]"
                  :total="auditTotal"
                  layout="total, sizes, prev, pager, next, jumper"
                  @size-change="handleAuditSizeChange"
                  @current-change="handleAuditCurrentChange"
                />
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>

    <!-- 绑定2FA模态框 -->
    <el-dialog v-model="showBindModal" title="绑定2FA" width="500px" :close-on-click-modal="false">
      <div v-if="qrCodeData" class="qr-section">
        <h4>扫描二维码</h4>
        <div class="qr-code">
          <img :src="qrCodeData.qrCode" alt="2FA QR Code" />
        </div>
        <p>请使用Google Authenticator或其他TOTP应用扫描此二维码</p>
        
        <div class="verification-section">
          <h4>验证设置</h4>
          <el-input 
            v-model="verificationToken" 
            placeholder="输入6位验证码"
            maxlength="6"
            style="margin-bottom: 20px;"
          />
        </div>
      </div>
      <div v-else class="loading">
        <p>正在生成二维码...</p>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeBindModal">取消</el-button>
          <el-button 
            type="primary" 
            @click="verifyAndBind" 
            :disabled="!verificationToken || verificationToken.length !== 6"
            :loading="verifying"
          >
            验证并绑定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 禁用2FA模态框 -->
    <el-dialog v-model="showDisableModal" title="禁用2FA" width="400px" :close-on-click-modal="false">
      <p>为了安全起见，请输入该用户的2FA验证码来确认禁用操作。</p>
      <el-input 
        v-model="disableToken" 
        placeholder="输入6位验证码"
        maxlength="6"
        style="margin: 20px 0;"
      />
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDisableModal">取消</el-button>
          <el-button 
            type="danger" 
            @click="disable2FA" 
            :disabled="!disableToken || disableToken.length !== 6"
            :loading="disabling"
          >
            确认禁用
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 备用码模态框 -->
    <el-dialog v-model="showBackupModal" title="备用验证码" width="600px" :close-on-click-modal="false">
      <div v-if="backupCodes.length > 0" class="backup-codes">
        <p>请妥善保管以下备用验证码，每个码只能使用一次：</p>
        <div class="codes-grid">
          <el-tag
            v-for="code in backupCodes"
            :key="code"
            class="backup-code"
            size="large"
          >
            {{ code }}
          </el-tag>
        </div>
      </div>
      <div v-else class="loading">
        <p>正在获取备用码...</p>
      </div>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="regenerateBackupCodes" type="warning" :loading="regenerating">
            重新生成
          </el-button>
          <el-button @click="closeBackupModal">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 锁定用户模态框 -->
    <el-dialog v-model="showLockModal" title="手动锁定用户" width="400px" :close-on-click-modal="false">
      <div v-if="lockTargetUser">
        <p>锁定用户：<b>{{ lockTargetUser.name }}</b>（{{ lockTargetUser.mail }}）</p>
        <el-form :model="lockForm" label-width="80px" style="margin-top: 20px;">
          <el-form-item label="锁定类型">
            <el-select v-model="lockForm.lockType" placeholder="请选择类型" style="width: 100%">
              <el-option label="TOTP" value="totp" />
              <el-option label="备用码" value="backup_code" />
              <el-option label="登录" value="login" />
            </el-select>
          </el-form-item>
          <el-form-item label="时长(分钟)">
            <el-input-number v-model="lockForm.duration" :min="1" :max="1440" style="width: 100%" />
          </el-form-item>
        </el-form>
      </div>
      <div v-else>未选择用户</div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showLockModal = false">取消</el-button>
          <el-button type="primary" :loading="locking" @click="handleLockUser">确认锁定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../lib/api'
import { useAuthStore } from '../lib/store'
import PermissionCheck from '../components/PermissionCheck.vue'

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
const loading = ref(false)
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

// 分页相关
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

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

// 加载状态
const verifying = ref(false)
const disabling = ref(false)
const regenerating = ref(false)

// 审计日志相关
const activeAuditTab = ref('attempts') // 默认显示尝试记录
const auditAttempts = ref<any[]>([])
const auditLocks = ref<any[]>([])
const auditLogs = ref<any[]>([])
const auditLoading = ref(false)
const auditCurrentPage = ref(1)
const auditPageSize = ref(10)
const auditTotal = ref(0)

// 锁定相关
const showLockModal = ref(false)
const lockTargetUser = ref<User | null>(null)
const lockForm = ref({ lockType: 'totp', duration: 30 })
const locking = ref(false)

function showLockUserModal(user: User) {
  lockTargetUser.value = user
  lockForm.value = { lockType: 'totp', duration: 30 }
  showLockModal.value = true
}

async function handleLockUser() {
  if (!lockTargetUser.value) return
  locking.value = true
  try {
    await api.post('/auth/two-factor-auxiliary/locks/create', {
      userId: lockTargetUser.value.id,
      lockType: lockForm.value.lockType,
      durationMinutes: lockForm.value.duration
    })
    ElMessage.success('锁定成功')
    showLockModal.value = false
    await loadUsers()
    await loadAuditLogs('locks')
  } catch (e) {
    ElMessage.error('锁定失败')
  } finally {
    locking.value = false
  }
}

// 获取用户列表和2FA状态
const loadUsers = async () => {
  loading.value = true
  try {
    const response = await api.get('/users', {
      params: {
        page: currentPage.value,
        limit: pageSize.value
      }
    })
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
        const lockResponse = await api.get(`/auth/two-factor-auxiliary/locks/check-user?userId=${user.id}`)
        user.lockStatus = lockResponse.data
      } catch (error) {
        console.error('获取用户锁定状态失败:', error)
        user.lockStatus = { locked: false }
      }
    }
    
    // 计算统计信息
    stats.value = {
      totalUsers: response.data.total || users.value.length,
      enabled2FA: users.value.filter(u => u.twoFactorEnabled).length,
      lockedUsers: users.value.filter(u => u.lockStatus?.locked).length,
      pendingRecoveries: 0 // 稍后获取
    }
    
    total.value = response.data.total || users.value.length
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  loadUsers()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadUsers()
}

// 获取安全统计
const loadSecurityStats = async () => {
  try {
    const response = await api.get('/auth/two-factor-auxiliary/stats')
    securityStats.value = response.data
  } catch (error) {
    console.error('加载安全统计失败:', error)
    ElMessage.error('加载安全统计失败')
  }
}

// 获取审计日志
const loadAuditLogs = async (type: string) => {
  auditLoading.value = true
  try {
    let response
    if (type === 'attempts') {
      response = await api.get('/auth/two-factor-auxiliary/attempts/all', {
        params: {
          page: auditCurrentPage.value,
          limit: auditPageSize.value
        }
      })
      // 正确处理API返回的数据结构
      auditAttempts.value = response.data?.attempts || []
      auditTotal.value = response.data?.total || 0
    } else if (type === 'locks') {
      response = await api.get('/auth/two-factor-auxiliary/locks/all', {
        params: {
          page: auditCurrentPage.value,
          limit: auditPageSize.value
        }
      })
      // 正确处理API返回的数据结构
      auditLocks.value = response.data?.locks || []
      auditTotal.value = response.data?.total || 0
    } else if (type === 'logs') {
      response = await api.get('/auth/two-factor-auxiliary/logs/all', {
        params: {
          page: auditCurrentPage.value,
          limit: auditPageSize.value
        }
      })
      // 正确处理API返回的数据结构
      auditLogs.value = response.data?.logs || []
      auditTotal.value = response.data?.total || 0
    }
  } catch (error) {
    console.error('加载审计日志失败:', error)
    ElMessage.error('加载审计日志失败')
    // 设置默认空数组
    if (type === 'attempts') {
      auditAttempts.value = []
    } else if (type === 'locks') {
      auditLocks.value = []
    } else if (type === 'logs') {
      auditLogs.value = []
    }
    auditTotal.value = 0
  } finally {
    auditLoading.value = false
  }
}

// 审计日志分页处理
const handleAuditSizeChange = (val: number) => {
  auditPageSize.value = val
  auditCurrentPage.value = 1
  loadAuditLogs(activeAuditTab.value)
}

const handleAuditCurrentChange = (val: number) => {
  auditCurrentPage.value = val
  loadAuditLogs(activeAuditTab.value)
}

// 审计日志标签切换
const handleAuditTabChange = (tab: any) => {
  activeAuditTab.value = tab.paneName
  loadAuditLogs(tab.paneName)
}

// 获取锁定类型颜色
const getLockTypeColor = (type: string) => {
  if (type === 'totp') return 'primary'
  if (type === 'backup_code') return 'warning'
  return 'info'
}

// 获取锁定类型标签
const getLockTypeLabel = (type: string) => {
  if (type === 'totp') return 'TOTP'
  if (type === 'backup_code') return '备用码'
  return type
}

// 判断锁定是否过期
const isLockExpired = (lockedUntil: string | undefined) => {
  if (!lockedUntil) return false
  const lockDate = new Date(lockedUntil)
  const now = new Date()
  return lockDate < now
}

// 获取操作类型颜色
const getActionTypeColor = (action: string) => {
  if (action === 'enable') return 'success'
  if (action === 'disable') return 'danger'
  if (action === 'regenerate_backup_codes') return 'warning'
  if (action === 'unlock') return 'info'
  return 'info'
}

// 获取操作类型标签
const getActionLabel = (action: string) => {
  if (action === 'enable') return '启用2FA'
  if (action === 'disable') return '禁用2FA'
  if (action === 'regenerate_backup_codes') return '重新生成备用码'
  if (action === 'unlock') return '解锁用户'
  return action
}

// 显示绑定2FA模态框
const showBind2FAModal = async (user: User) => {
  selectedUser.value = user
  showBindModal.value = true
  verificationToken.value = ''
  
  try {
    // 使用用户特定的setup API获取密钥
    const response = await api.get(`/auth/two-factor/setup/${user.id}`)
    const secret = response.data.secret
    const userEmail = response.data.userEmail
    
    // 生成otpauth URL，对邮箱地址进行URL编码
    const encodedEmail = encodeURIComponent(userEmail)
    const otpauthUrl = `otpauth://totp/${encodedEmail}?secret=${secret}&issuer=BlogAdmin`
    
    // 使用qrcode库生成二维码图片
    const QRCode = (await import('qrcode')).default
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl)
    
    qrCodeData.value = {
      secret: secret,
      qrCode: qrCodeDataUrl
    }
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
  
  if (!selectedUser.value) {
    ElMessage.error('未选择用户')
    return
  }
  
  verifying.value = true
  try {
    if (!qrCodeData.value) {
      ElMessage.error('二维码数据不存在，请重新生成')
      return
    }
    // 使用用户特定的enable API
    const response = await api.post(`/auth/two-factor/enable/${selectedUser.value.id}`, {
      token: verificationToken.value,
      secret: qrCodeData.value.secret
    })
    
    ElMessage.success('2FA绑定成功！')
    closeBindModal()
    loadUsers() // 重新加载用户列表
  } catch (error) {
    console.error('绑定2FA失败:', error)
    ElMessage.error('绑定失败，请检查验证码是否正确')
  } finally {
    verifying.value = false
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
    ElMessage.warning('请输入6位验证码')
    return
  }
  
  if (!selectedUser.value) {
    ElMessage.error('未选择用户')
    return
  }
  
  disabling.value = true
  try {
    // 使用用户特定的disable API
    await api.post(`/auth/two-factor/disable/${selectedUser.value.id}`, {
      token: disableToken.value
    })
    
    ElMessage.success('2FA已禁用')
    closeDisableModal()
    loadUsers() // 重新加载用户列表
  } catch (error) {
    console.error('禁用2FA失败:', error)
    ElMessage.error('禁用失败，请检查验证码是否正确')
  } finally {
    disabling.value = false
  }
}

// 显示备用码模态框
const showBackupCodesModal = async (user: User) => {
  selectedUser.value = user
  showBackupModal.value = true
  backupCodes.value = []
  
  try {
    // 使用新的用户特定API获取备用码
    const response = await api.get(`/auth/two-factor/backup-codes/${user.id}`)
    backupCodes.value = response.data.codes || response.data
  } catch (error) {
    console.error('获取备用码失败:', error)
    ElMessage.error('获取备用码失败')
  }
}

// 重新生成备用码
const regenerateBackupCodes = async () => {
  if (!selectedUser.value) return
  
  regenerating.value = true
  try {
    // 使用新的用户特定API重新生成备用码
    const response = await api.post(`/auth/two-factor/regenerate-backup-codes/${selectedUser.value.id}`)
    backupCodes.value = response.data.codes || response.data
    ElMessage.success('备用码已重新生成')
  } catch (error) {
    console.error('重新生成备用码失败:', error)
    ElMessage.error('重新生成失败')
  } finally {
    regenerating.value = false
  }
}

// 解锁用户
const unlockUser = async (user: User) => {
  try {
    await api.post('/auth/two-factor-auxiliary/locks/unlock', {
      userId: user.id
    })
    
    ElMessage.success('用户已解锁')
    loadUsers() // 重新加载用户列表
  } catch (error) {
    console.error('解锁用户失败:', error)
    ElMessage.error('解锁失败')
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
  loadAuditLogs('attempts') // 默认加载尝试记录
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

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.stat-item {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
}

.stat-item h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.stat-details p {
  margin: 8px 0;
  color: #666;
}

.qr-section {
  text-align: center;
}

.qr-code {
  margin: 20px 0;
}

.qr-code img {
  max-width: 200px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.verification-section {
  margin-top: 20px;
}

.backup-codes {
  text-align: center;
}

.codes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin: 20px 0;
}

.backup-code {
  text-align: center;
  font-family: monospace;
  font-size: 16px;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #666;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* 审计日志样式 */
.audit-tabs {
  margin-top: 20px;
}

.audit-table-container {
  overflow-x: auto;
  min-width: 100%;
}

.audit-table {
  min-width: 100%;
  width: 100%;
}

.audit-table th,
.audit-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

.audit-table th {
  background: #f8f9fa;
  font-weight: 600;
}

.audit-table .el-tag {
  margin-right: 5px;
}

.audit-table .el-tag:last-child {
  margin-right: 0;
}

/* 用户表格样式 */
.user-table {
  min-width: 100%;
  width: 100%;
}

.user-table th,
.user-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

.user-table th {
  background: #f8f9fa;
  font-weight: 600;
}

/* 确保表格容器有足够的宽度 */
.audit-table-container .el-table {
  min-width: 800px;
}

.table-container .el-table {
  min-width: 1000px;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .audit-table-container .el-table {
    min-width: 1000px;
  }
  
  .table-container .el-table {
    min-width: 1200px;
  }
}

@media (max-width: 768px) {
  .audit-table-container,
  .table-container {
    overflow-x: scroll;
  }
  
  .audit-table-container .el-table {
    min-width: 1200px;
  }
  
  .table-container .el-table {
    min-width: 1400px;
  }
}
</style> 