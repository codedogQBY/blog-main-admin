<template>
  <div class="diary-signatures-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>签名管理</h1>
      <PermissionCheck permission="diary.signature.create">
        <el-button type="primary" @click="handleCreate">
          <i class="fas fa-plus"></i>
          新建签名
        </el-button>
      </PermissionCheck>
    </div>

    <!-- 签名列表 -->
    <div class="signatures-container">
      <div class="signature-grid">
        <div
          v-for="signature in signatures"
          :key="signature.id"
          class="signature-card"
          :class="{ active: signature.isActive }"
        >
          <div class="signature-preview">
            <div
              class="signature-text"
              :style="{
                fontFamily: signature.fontFamily,
                fontSize: getFontSizeValue(signature.fontSize),
                color: getColorValue(signature.color),
                transform: `rotate(${signature.rotation}deg)`
              }"
            >
              {{ signature.signatureName }}
            </div>
          </div>
          
          <div class="signature-info">
            <h3>{{ signature.signatureName }}</h3>
            <div class="signature-details">
              <span>字体: {{ signature.fontFamily }}</span>
              <span>大小: {{ signature.fontSize }}</span>
              <span>颜色: {{ signature.color }}</span>
              <span>旋转: {{ signature.rotation }}°</span>
            </div>
          </div>
          
          <div class="signature-actions">
            <el-tag v-if="signature.isActive" type="success" size="small">激活中</el-tag>
            <PermissionCheck permission="diary.signature.update">
              <el-button
                v-if="!signature.isActive"
                size="small"
                type="success"
                @click="handleActivate(signature)"
              >
                激活
              </el-button>
              <el-button size="small" @click="handleEdit(signature)">编辑</el-button>
            </PermissionCheck>
            <PermissionCheck permission="diary.signature.delete">
              <el-button size="small" type="danger" @click="handleDelete(signature)">删除</el-button>
            </PermissionCheck>
          </div>
        </div>
      </div>
      
      <div v-if="signatures.length === 0" class="empty-state">
        <div class="empty-icon">✍️</div>
        <p>还没有签名</p>
        <PermissionCheck permission="diary.signature.create">
          <el-button type="primary" @click="handleCreate">创建第一个签名</el-button>
        </PermissionCheck>
      </div>
    </div>

    <!-- 签名编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="50%"
      @closed="resetDialog"
    >
      <el-form
        ref="signatureFormRef"
        :model="signatureForm"
        :rules="signatureRules"
        label-width="120px"
      >
        <el-form-item label="签名名称" prop="signatureName">
          <el-input v-model="signatureForm.signatureName" placeholder="请输入签名名称" />
        </el-form-item>

        <el-form-item label="字体家族" prop="fontFamily">
          <el-select v-model="signatureForm.fontFamily" placeholder="选择字体">
            <el-option label="手写体 (Kalam)" value="'Kalam', cursive"></el-option>
            <el-option label="楷体" value="'KaiTi', serif"></el-option>
            <el-option label="宋体" value="'SimSun', serif"></el-option>
            <el-option label="黑体" value="'SimHei', sans-serif"></el-option>
            <el-option label="微软雅黑" value="'Microsoft YaHei', sans-serif"></el-option>
            <el-option label="草书" value="'cursive'"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="字体大小" prop="fontSize">
          <el-select v-model="signatureForm.fontSize" placeholder="选择大小">
            <el-option label="小 (sm)" value="sm"></el-option>
            <el-option label="中 (base)" value="base"></el-option>
            <el-option label="大 (lg)" value="lg"></el-option>
            <el-option label="特大 (xl)" value="xl"></el-option>
            <el-option label="超大 (2xl)" value="2xl"></el-option>
            <el-option label="巨大 (3xl)" value="3xl"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="颜色" prop="color">
          <el-select v-model="signatureForm.color" placeholder="选择颜色">
            <el-option label="灰色" value="gray-400"></el-option>
            <el-option label="蓝色" value="blue-400"></el-option>
            <el-option label="绿色" value="green-400"></el-option>
            <el-option label="紫色" value="purple-400"></el-option>
            <el-option label="红色" value="red-400"></el-option>
            <el-option label="黄色" value="yellow-400"></el-option>
            <el-option label="粉色" value="pink-400"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="旋转角度" prop="rotation">
          <el-slider v-model="signatureForm.rotation" :min="-30" :max="30" show-input />
        </el-form-item>

        <el-form-item label="激活状态" prop="isActive">
          <el-switch v-model="signatureForm.isActive" />
          <span class="form-help">激活后将在随记中显示此签名</span>
        </el-form-item>

        <!-- 预览区域 -->
        <el-form-item label="预览效果">
          <div class="signature-preview-area">
            <div
              class="preview-signature"
              :style="{
                fontFamily: signatureForm.fontFamily,
                fontSize: getFontSizeValue(signatureForm.fontSize),
                color: getColorValue(signatureForm.color),
                transform: `rotate(${signatureForm.rotation}deg)`
              }"
            >
              {{ signatureForm.signatureName || '签名预览' }}
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import PermissionCheck from '@/components/PermissionCheck.vue'
import { api } from '../lib/api'

// 响应式数据
const loading = ref(false)
const saving = ref(false)
const signatures = ref<any[]>([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogMode = ref('create') // create, edit
const signatureFormRef = ref<FormInstance>()
const signatureForm = reactive({
  id: '',
  signatureName: '',
  fontFamily: "'Kalam', cursive",
  fontSize: '2xl',
  color: 'gray-400',
  rotation: 12,
  isActive: false
})

// 表单验证规则
const signatureRules: FormRules = {
  signatureName: [
    { required: true, message: '请输入签名名称', trigger: 'blur' },
    { max: 50, message: '签名名称不能超过50个字符', trigger: 'blur' }
  ],
  fontFamily: [
    { required: true, message: '请选择字体家族', trigger: 'change' }
  ],
  fontSize: [
    { required: true, message: '请选择字体大小', trigger: 'change' }
  ],
  color: [
    { required: true, message: '请选择颜色', trigger: 'change' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  return dialogMode.value === 'create' ? '新建签名' : '编辑签名'
})

// 生命周期
onMounted(() => {
  loadData()
})

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const response = await api.get('/diary/admin/signatures')
    signatures.value = response.data
  } catch (error) {
    console.error('加载签名列表失败:', error)
    ElMessage.error('加载签名列表失败')
  } finally {
    loading.value = false
  }
}

const handleCreate = () => {
  dialogMode.value = 'create'
  resetSignatureForm()
  dialogVisible.value = true
}

const handleEdit = (signature: any) => {
  dialogMode.value = 'edit'
  Object.assign(signatureForm, signature)
  dialogVisible.value = true
}

const handleActivate = async (signature: any) => {
  try {
    await api.patch(`/diary/admin/signatures/${signature.id}`, {
      isActive: true
    })
    ElMessage.success('签名已激活')
    loadData()
  } catch (error) {
    console.error('激活签名失败:', error)
    ElMessage.error('激活签名失败')
  }
}

const handleDelete = async (signature: any) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除签名"${signature.signatureName}"吗？`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await api.delete(`/diary/admin/signatures/${signature.id}`)
    ElMessage.success('删除成功')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSave = async () => {
  if (!signatureFormRef.value) return

  try {
    await signatureFormRef.value.validate()
    saving.value = true

    const data = { 
      ...signatureForm,
      rotation: signatureForm.rotation.toString() // 确保rotation是字符串
    }

    if (dialogMode.value === 'create') {
      await api.post('/diary/admin/signatures', data)
      ElMessage.success('创建成功')
    } else {
      await api.patch(`/diary/admin/signatures/${data.id}`, data)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadData()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const resetDialog = () => {
  resetSignatureForm()
  if (signatureFormRef.value) {
    signatureFormRef.value.resetFields()
  }
}

const resetSignatureForm = () => {
  Object.assign(signatureForm, {
    id: '',
    signatureName: '',
    fontFamily: "'Kalam', cursive",
    fontSize: '2xl',
    color: 'gray-400',
    rotation: 12,
    isActive: false
  })
}

const getFontSizeValue = (size: string) => {
  const sizeMap: { [key: string]: string } = {
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px'
  }
  return sizeMap[size] || '24px'
}

const getColorValue = (color: string) => {
  const colorMap: { [key: string]: string } = {
    'gray-400': '#9ca3af',
    'blue-400': '#60a5fa',
    'green-400': '#4ade80',
    'purple-400': '#a78bfa',
    'red-400': '#f87171',
    'yellow-400': '#facc15',
    'pink-400': '#f472b6'
  }
  return colorMap[color] || '#9ca3af'
}
</script>

<style scoped>
.diary-signatures-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.signatures-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.signature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.signature-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.signature-card:hover {
  border-color: #3b82f6;
  transform: translateY(-2px);
}

.signature-card.active {
  border-color: #10b981;
  background: #f0fdf4;
}

.signature-preview {
  background: white;
  padding: 20px;
  border-radius: 6px;
  margin-bottom: 16px;
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e5e7eb;
}

.signature-text {
  font-weight: bold;
  display: inline-block;
}

.signature-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
}

.signature-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.signature-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-state p {
  color: #666;
  margin-bottom: 20px;
  font-size: 16px;
}

.signature-preview-area {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 30px;
  text-align: center;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-signature {
  font-weight: bold;
  display: inline-block;
}

.form-help {
  margin-left: 10px;
  color: #666;
  font-size: 12px;
}
</style> 