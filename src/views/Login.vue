<template>
  <div class="auth-container">
    <!-- 左侧装饰区域 -->
    <div class="auth-decoration">
      <div class="decoration-content">
        <div class="brand-logo">
          <div class="logo-icon">
            <el-icon :size="60" color="#fff">
              <Edit />
            </el-icon>
          </div>
          <h1>博客管理系统</h1>
          <p>现代化的内容管理平台</p>
        </div>
        
        <div class="feature-list">
          <div class="feature-item">
            <el-icon><Check /></el-icon>
            <span>用户权限管理</span>
          </div>
          <div class="feature-item">
            <el-icon><Check /></el-icon>
            <span>角色权限控制</span>
          </div>
          <div class="feature-item">
            <el-icon><Check /></el-icon>
            <span>现代化界面设计</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧表单区域 -->
    <div class="auth-form-container">
      <div class="auth-card">
        <!-- 顶部切换标签 -->
        <div class="auth-tabs">
          <button
            :class="{ active: !isRegisterMode }"
            @click="switchMode(false)"
            class="tab-button"
          >
            登录
          </button>
          <button
            :class="{ active: isRegisterMode }"
            @click="switchMode(true)"
            class="tab-button"
          >
            注册
          </button>
        </div>

        <!-- 表单标题 -->
        <div class="form-header">
          <h2>{{ isRegisterMode ? '创建新账户' : '欢迎回来' }}</h2>
          <p>{{ isRegisterMode ? '填写信息创建管理员账户' : '登录您的管理员账户' }}</p>
        </div>

        <!-- 登录表单 -->
        <el-form
          v-if="!isRegisterMode"
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="auth-form"
          @submit.prevent="handleLogin"
        >
          <el-form-item prop="mail">
            <el-input
              v-model="loginForm.mail"
              placeholder="邮箱地址"
              size="large"
              prefix-icon="Message"
              class="form-input"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              size="large"
              prefix-icon="Lock"
              show-password
              class="form-input"
            />
          </el-form-item>

          <div class="form-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
            <a href="#" class="forgot-link">忘记密码？</a>
          </div>
          
          <el-button
            type="primary"
            size="large"
            class="submit-button"
            :loading="authStore.loading"
            @click="handleLogin"
          >
            立即登录
          </el-button>
        </el-form>

        <!-- 注册表单 -->
        <el-form
          v-else
          ref="registerFormRef"
          :model="registerForm"
          :rules="registerRules"
          class="auth-form"
          @submit.prevent="handleRegister"
        >
          <el-form-item prop="name">
            <el-input
              v-model="registerForm.name"
              placeholder="用户名"
              size="large"
              prefix-icon="User"
              class="form-input"
            />
          </el-form-item>

          <el-form-item prop="mail">
            <el-input
              v-model="registerForm.mail"
              placeholder="邮箱地址"
              size="large"
              prefix-icon="Message"
              class="form-input"
            />
          </el-form-item>
          
          <el-form-item prop="verificationCode">
            <div class="verification-group">
              <el-input
                v-model="registerForm.verificationCode"
                placeholder="验证码"
                size="large"
                prefix-icon="Key"
                class="verification-input"
              />
              <el-button
                type="default"
                size="large"
                class="send-code-button"
                :loading="sendingCode"
                :disabled="countdown > 0"
                @click="handleSendCode"
              >
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="密码 (至少6位)"
              size="large"
              prefix-icon="Lock"
              show-password
              class="form-input"
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
              v-model="registerForm.confirmPassword"
              type="password"
              placeholder="确认密码"
              size="large"
              prefix-icon="Lock"
              show-password
              class="form-input"
            />
          </el-form-item>

          <div class="terms-checkbox">
            <el-checkbox v-model="agreeTerms">
              我已阅读并同意 <a href="#" class="terms-link">用户协议</a> 和 <a href="#" class="terms-link">隐私政策</a>
            </el-checkbox>
          </div>
          
          <el-button
            type="primary"
            size="large"
            class="submit-button"
            :loading="authStore.loading"
            :disabled="!agreeTerms"
            @click="handleRegister"
          >
            创建账户
          </el-button>
        </el-form>

        <!-- 第三方登录 -->
        <div class="social-login">
          <div class="divider">
            <span>或者使用</span>
          </div>
          
          <div class="social-buttons">
            <button class="social-button github">
              <el-icon><Platform /></el-icon>
              GitHub
            </button>
            <button class="social-button wechat">
              <el-icon><ChatRound /></el-icon>
              微信
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Edit, Check, User, Message, Lock, Key, Platform, ChatRound } from '@element-plus/icons-vue'
import { useAuthStore } from '../lib/store'
import { api as authApi } from '../lib/api'

const router = useRouter()
const authStore = useAuthStore()

// 模式切换
const isRegisterMode = ref(false)
const rememberMe = ref(false)
const agreeTerms = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)

// 2FA验证相关状态
const show2FAModal = ref(false)
const twoFAToken = ref('')
const verifying2FA = ref(false)
const showBackupInput = ref(false)
const backupCode = ref('')
const verifyingBackup = ref(false)
const pendingUserId = ref('')

// 表单引用
const loginFormRef = ref<FormInstance>()
const registerFormRef = ref<FormInstance>()

// 登录表单
const loginForm = reactive({
  mail: '',
  password: ''
})

// 注册表单
const registerForm = reactive({
  name: '',
  mail: '',
  verificationCode: '',
  password: '',
  confirmPassword: ''
})

// 登录表单验证规则
const loginRules: FormRules = {
  mail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
}

// 注册表单验证规则
const registerRules: FormRules = {
  name: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在2-20个字符', trigger: 'blur' }
  ],
  mail: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  verificationCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 切换登录/注册模式
const switchMode = (registerMode: boolean) => {
  isRegisterMode.value = registerMode
  // 清空表单
  if (registerMode) {
    loginFormRef.value?.resetFields()
  } else {
    registerFormRef.value?.resetFields()
  }
}

// 发送验证码
const handleSendCode = async () => {
  if (!registerForm.mail) {
    ElMessage.warning('请先输入邮箱地址')
    return
  }

  try {
    sendingCode.value = true
    await authApi.sendCode(registerForm.mail)
    ElMessage.success('验证码已发送到您的邮箱')
    
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error('发送验证码失败:', error)
    ElMessage.error('验证码发送失败，请稍后重试')
  } finally {
    sendingCode.value = false
  }
}

// 处理登录
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const response = await authApi.login({ mail: loginForm.mail, password: loginForm.password })
        
        // 检查是否需要2FA验证
        if (response.requires2FA && response.userId) {
          pendingUserId.value = response.userId
          show2FAModal.value = true
          twoFAToken.value = ''
          showBackupInput.value = false
          backupCode.value = ''
        } else {
          // 正常登录流程
          const success = await authStore.login(loginForm.mail, loginForm.password)
          if (success) {
            ElMessage.success('登录成功')
            router.push('/admin')
          } else {
            ElMessage.error('登录失败，请检查邮箱和密码')
          }
        }
      } catch (error) {
        console.error('登录失败:', error)
        ElMessage.error('登录失败，请检查邮箱和密码')
      }
    }
  })
}

// 验证2FA
const verify2FA = async () => {
  if (!twoFAToken.value || twoFAToken.value.length !== 6) {
    ElMessage.warning('请输入6位验证码')
    return
  }

  try {
    verifying2FA.value = true
    await authApi.verify2FA(pendingUserId.value, twoFAToken.value)
    
    // 2FA验证成功，完成登录
    const success = await authStore.login(loginForm.mail, loginForm.password)
    if (success) {
      ElMessage.success('登录成功')
      show2FAModal.value = false
      router.push('/admin')
    }
  } catch (error) {
    console.error('2FA验证失败:', error)
    ElMessage.error('验证码错误，请重试')
  } finally {
    verifying2FA.value = false
  }
}

// 使用备用验证码
const useBackupCode = () => {
  showBackupInput.value = true
  backupCode.value = ''
}

// 验证备用验证码
const verifyBackupCode = async () => {
  if (!backupCode.value) {
    ElMessage.warning('请输入备用验证码')
    return
  }

  try {
    verifyingBackup.value = true
    await authApi.verifyBackupCode(pendingUserId.value, backupCode.value)
    
    // 备用码验证成功，完成登录
    const success = await authStore.login(loginForm.mail, loginForm.password)
    if (success) {
      ElMessage.success('登录成功')
      show2FAModal.value = false
      router.push('/admin')
    }
  } catch (error) {
    console.error('备用码验证失败:', error)
    ElMessage.error('备用验证码错误，请重试')
  } finally {
    verifyingBackup.value = false
  }
}

// 处理注册
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await authApi.register({
          name: registerForm.name,
          mail: registerForm.mail,
          password: registerForm.password,
          code: registerForm.verificationCode
        })
        ElMessage.success('注册成功，请登录')
        switchMode(false)
      } catch (error) {
        console.error('注册失败:', error)
        ElMessage.error('注册失败，请检查信息后重试')
      }
    }
  })
}
</script>

<style scoped>
.auth-container {
  min-height: 100vh;
  display: flex;
  background: #f8fafc;
}

/* 左侧装饰区域 */
.auth-decoration {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.auth-decoration::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.03) 10px,
    rgba(255, 255, 255, 0.03) 20px
  );
  animation: move 20s linear infinite;
}

@keyframes move {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

.decoration-content {
  text-align: center;
  color: white;
  z-index: 1;
  position: relative;
}

.brand-logo {
  margin-bottom: 60px;
}

.logo-icon {
  margin-bottom: 20px;
  display: inline-block;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  backdrop-filter: blur(10px);
}

.brand-logo h1 {
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.brand-logo p {
  font-size: 18px;
  opacity: 0.9;
}

.feature-list {
  max-width: 300px;
  margin: 0 auto;
}

.feature-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 16px;
  font-size: 16px;
  opacity: 0.9;
}

.feature-item .el-icon {
  margin-right: 12px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 右侧表单区域 */
.auth-form-container {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.auth-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  padding: 40px;
}

/* 顶部切换标签 */
.auth-tabs {
  display: flex;
  background: #f1f5f9;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 32px;
}

.tab-button {
  flex: 1;
  padding: 12px 20px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tab-button.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 表单标题 */
.form-header {
  text-align: center;
  margin-bottom: 32px;
}

.form-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 8px;
}

.form-header p {
  color: #64748b;
  font-size: 14px;
}

/* 表单样式 */
.auth-form .el-form-item {
  margin-bottom: 20px;
}

.form-input {
  border-radius: 8px;
}

.form-input :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e2e8f0;
  transition: all 0.2s ease;
}

.form-input :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1;
}

.form-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #3b82f6;
}

/* 验证码输入组 */
.verification-group {
  display: flex;
  gap: 12px;
}

.verification-input {
  flex: 1;
}

.send-code-button {
  min-width: 120px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

/* 表单选项 */
.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  font-size: 14px;
}

.forgot-link {
  color: #3b82f6;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.terms-checkbox {
  margin-bottom: 24px;
  font-size: 14px;
  color: #64748b;
}

.terms-link {
  color: #3b82f6;
  text-decoration: none;
}

.terms-link:hover {
  text-decoration: underline;
}

/* 提交按钮 */
.submit-button {
  width: 100%;
  height: 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  transition: all 0.2s ease;
}

.submit-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 25px rgba(59, 130, 246, 0.3);
}

/* 第三方登录 */
.social-login {
  margin-top: 32px;
}

.divider {
  text-align: center;
  position: relative;
  margin-bottom: 24px;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e2e8f0;
}

.divider span {
  background: white;
  padding: 0 16px;
  color: #64748b;
  font-size: 14px;
}

.social-buttons {
  display: flex;
  gap: 12px;
}

.social-button {
  flex: 1;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.social-button:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.social-button.github:hover {
  background: #24292f;
  color: white;
  border-color: #24292f;
}

.social-button.wechat:hover {
  background: #07c160;
  color: white;
  border-color: #07c160;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .auth-container {
    flex-direction: column;
  }
  
  .auth-decoration {
    min-height: 200px;
    flex: none;
  }
  
  .decoration-content {
    padding: 40px 20px;
  }
  
  .brand-logo h1 {
    font-size: 28px;
  }
  
  .feature-list {
    display: none;
  }
  
  .auth-form-container {
    width: 100%;
    padding: 20px;
  }
  
  .auth-card {
    padding: 20px;
  }
}
</style> 