<template>
  <div class="setup-2fa-container">
    <div class="setup-card">
      <!-- 页头 -->
      <div class="setup-header">
        <div class="security-icon">
          <el-icon :size="60" color="#409EFF">
            <Lock />
          </el-icon>
        </div>
        <h1>启用双因素认证</h1>
        <p class="subtitle">为了保护您的账户安全，请设置双因素认证</p>
      </div>

      <!-- 步骤条 -->
      <el-steps :active="activeStep" finish-status="success" class="setup-steps">
        <el-step title="安装认证器" description="在手机上安装认证器应用" />
        <el-step title="扫描二维码" description="使用应用扫描或输入密钥" />
        <el-step title="验证设置" description="输入验证码完成设置" />
      </el-steps>

      <!-- 步骤内容 -->
      <div class="step-content" v-if="activeStep === 1">
        <h3>请在手机上安装以下任一认证器应用：</h3>
        <div class="app-list">
          <el-card class="app-item" shadow="hover">
            <template #header>
              <div class="app-header">
                <span>Google Authenticator</span>
                <el-tag type="success" size="small">推荐</el-tag>
              </div>
            </template>
            <p>Google官方出品，简单易用</p>
          </el-card>
          <el-card class="app-item" shadow="hover">
            <template #header>
              <div class="app-header">
                <span>Microsoft Authenticator</span>
                <el-tag type="info" size="small">备选</el-tag>
              </div>
            </template>
            <p>功能丰富，支持云备份</p>
          </el-card>
          <el-card class="app-item" shadow="hover">
            <template #header>
              <div class="app-header">
                <span>Authy</span>
                <el-tag type="info" size="small">备选</el-tag>
              </div>
            </template>
            <p>支持多设备同步</p>
          </el-card>
        </div>
        <div class="step-actions">
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>

      <div class="step-content" v-if="activeStep === 2">
        <h3>使用认证器应用扫描二维码</h3>
        <div class="qr-section">
          <div class="qr-code-container" v-loading="qrCodeLoading">
            <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="2FA QR Code" />
          </div>
          <div class="manual-setup">
            <h4>无法扫描？手动输入以下信息：</h4>
            <el-descriptions :column="1" border>
              <el-descriptions-item label="账户名称">
                {{ userEmail }}
                <el-button link type="primary" @click="copyToClipboard(userEmail)">复制</el-button>
              </el-descriptions-item>
              <el-descriptions-item label="密钥">
                {{ secretKey }}
                <el-button link type="primary" @click="copyToClipboard(secretKey)">复制</el-button>
              </el-descriptions-item>
            </el-descriptions>
          </div>
        </div>
        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>

      <div class="step-content" v-if="activeStep === 3">
        <h3>验证设置</h3>
        <p>请输入认证器应用中显示的6位验证码：</p>
        <el-form ref="verifyFormRef" :model="verifyForm" :rules="verifyRules" class="verify-form">
          <el-form-item prop="token">
            <el-input
              v-model="verifyForm.token"
              placeholder="请输入6位验证码"
              maxlength="6"
              size="large"
              class="verify-input"
              @input="handleTokenInput"
            />
          </el-form-item>
        </el-form>
        <el-alert
          title="重要提示"
          type="warning"
          :closable="false"
          show-icon
          class="backup-info"
        >
          <p>设置完成后，系统将为您生成备份恢复码，请妥善保存以备设备丢失时使用。</p>
        </el-alert>
        <div class="step-actions">
          <el-button @click="prevStep">上一步</el-button>
          <el-button 
            type="primary" 
            @click="verifyAndEnable2FA"
            :loading="verifying"
            :disabled="!verifyForm.token || verifyForm.token.length !== 6"
          >
            完成设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 成功对话框 -->
    <el-dialog v-model="successDialogVisible" title="设置成功" width="500px" :close-on-click-modal="false">
      <div class="success-content">
        <el-icon size="64" color="#67C23A"><SuccessFilled /></el-icon>
        <h3>双因素认证设置成功！</h3>
        <p>您的账户安全性已大大增强。</p>
        
        <div class="backup-codes" v-if="backupCodes.length > 0">
          <h4>备份恢复码</h4>
          <p class="backup-warning">请将以下恢复码保存在安全的地方，当您无法使用认证器时可以用来登录：</p>
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
          <el-button @click="downloadBackupCodes" type="primary" plain class="download-btn">
            <el-icon><Download /></el-icon>
            下载备份码
          </el-button>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="goToDashboard">进入管理后台</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { 
  Lock, 
  SuccessFilled,
  Download 
} from '@element-plus/icons-vue'
import { useAuthStore } from '../lib/store'
import { api as authApi } from '../lib/api'
import QRCode from 'qrcode'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const activeStep = ref(1)
const qrCodeLoading = ref(true)
const qrCodeUrl = ref('')
const secretKey = ref('')
const userEmail = ref(authStore.user?.mail || '')
const verifying = ref(false)
const successDialogVisible = ref(false)
const backupCodes = ref<string[]>([])

// 表单相关
const verifyFormRef = ref<FormInstance>()
const verifyForm = reactive({
  token: ''
})

const verifyRules: FormRules = {
  token: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码必须是6位数字', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码只能包含数字', trigger: 'blur' }
  ]
}

// 步骤控制
const nextStep = () => {
  if (activeStep.value < 3) {
    activeStep.value++
  }
}

const prevStep = () => {
  if (activeStep.value > 1) {
    activeStep.value--
  }
}

// 初始化2FA设置
const initSetup2FA = async () => {
  try {
    qrCodeLoading.value = true
    // 调用后端API获取2FA密钥
    const response = await authApi.get('/auth/two-factor/setup')
    secretKey.value = response.data.secret
    
    // 在前端生成二维码
    const otpauthUrl = `otpauth://totp/${userEmail.value}?secret=${secretKey.value}&issuer=BlogAdmin`
    qrCodeUrl.value = await QRCode.toDataURL(otpauthUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    })
    qrCodeLoading.value = false
  } catch (error) {
    ElMessage.error('初始化2FA设置失败')
    qrCodeLoading.value = false
  }
}

// 验证并启用2FA
const verifyAndEnable2FA = async () => {
  if (!verifyFormRef.value) return
  
  await verifyFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        verifying.value = true
        const response = await authApi.post('/auth/two-factor/enable', {
          token: verifyForm.token,
          secret: secretKey.value
        })
        backupCodes.value = response.data.backupCodes
        successDialogVisible.value = true
        // 更新状态，标记2FA已设置
        authStore.needsSetup2FA = false
        ElMessage.success('双因素认证设置成功')
      } catch (error) {
        ElMessage.error('验证失败，请确认验证码是否正确')
      } finally {
        verifying.value = false
      }
    }
  })
}

// 复制到剪贴板
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 下载备份码
const downloadBackupCodes = () => {
  const content = `双因素认证备份恢复码\n\n${backupCodes.value.join('\n')}`
  const blob = new Blob([content], { type: 'text/plain' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = '2fa-backup-codes.txt'
  a.click()
  window.URL.revokeObjectURL(url)
}

// 跳转到管理后台
const goToDashboard = () => {
  router.push('/admin')
}

// 处理验证码输入
const handleTokenInput = (value: string) => {
  verifyForm.token = value.replace(/[^\d]/g, '').slice(0, 6)
}

onMounted(() => {
  initSetup2FA()
})
</script>

<style scoped>
.setup-2fa-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.setup-card {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 800px;
  width: 100%;
}

.setup-header {
  text-align: center;
  margin-bottom: 40px;
}

.security-icon {
  margin-bottom: 20px;
}

.setup-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 10px;
}

.subtitle {
  color: #64748b;
  margin-top: 10px;
  font-size: 16px;
}

.setup-steps {
  margin-bottom: 40px;
}

.step-content {
  padding: 20px 0;
}

.app-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.qr-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.qr-code-container {
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  border-radius: 8px;
  padding: 10px;
}

.manual-setup {
  width: 100%;
  max-width: 500px;
}

.verify-form {
  max-width: 300px;
  margin: 20px auto;
}

.verify-input {
  text-align: center;
  letter-spacing: 4px;
  font-size: 20px;
}

.backup-info {
  margin: 20px 0;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.success-content {
  text-align: center;
}

.backup-codes {
  margin-top: 30px;
  text-align: left;
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

.download-btn {
  margin-top: 20px;
}

.backup-warning {
  color: #e6a23c;
  margin: 10px 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .setup-card {
    padding: 20px;
    margin: 10px;
  }
  
  .setup-header h1 {
    font-size: 24px;
  }
  
  .app-list {
    grid-template-columns: 1fr;
  }
}
</style> 