<template>
  <div class="diary-notes-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>随记管理</h1>
      <PermissionCheck permission="diary.create">
        <el-button type="primary" @click="handleCreate">
          <i class="fas fa-plus"></i>
          新建随记
        </el-button>
      </PermissionCheck>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards" v-if="stats">
      <div class="stat-card">
        <div class="stat-number">{{ stats.totalNotes }}</div>
        <div class="stat-label">总随记数</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.publicNotes }}</div>
        <div class="stat-label">公开随记</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.privateNotes }}</div>
        <div class="stat-label">私有随记</div>
      </div>
      <div class="stat-card">
        <div class="stat-number">{{ stats.recentNotes }}</div>
        <div class="stat-label">本周新增</div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-filters">
      <el-input
        v-model="searchQuery"
        placeholder="搜索随记标题或内容..."
        @keyup.enter="loadData"
        clearable
        class="search-input"
      >
        <template #prefix>
          <i class="fas fa-search"></i>
        </template>
      </el-input>

      <el-select v-model="weatherFilter" placeholder="天气筛选" clearable @change="loadData">
        <el-option label="全部天气" value=""></el-option>
        <el-option label="晴天" value="sunny"></el-option>
        <el-option label="多云" value="cloudy"></el-option>
        <el-option label="雨天" value="rainy"></el-option>
        <el-option label="雪天" value="snowy"></el-option>
        <el-option label="部分多云" value="partly-cloudy"></el-option>
      </el-select>

      <el-select v-model="statusFilter" placeholder="状态筛选" clearable @change="loadData">
        <el-option label="全部状态" value=""></el-option>
        <el-option label="公开" value="public"></el-option>
        <el-option label="私有" value="private"></el-option>
      </el-select>

      <el-button @click="loadData" type="primary">搜索</el-button>
      <el-button @click="resetFilters">重置</el-button>
    </div>

    <!-- 随记列表 -->
    <div class="table-container">
      <el-table
        :data="notes"
        v-loading="loading"
        style="width: 100%"
        @sort-change="handleSortChange"
      >
        <el-table-column prop="title" label="标题" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="note-title">
              <strong>{{ row.title }}</strong>
              <div class="note-meta">
                <span class="weather-tag">
                  {{ getWeatherName(row.weather) }}
                </span>
                <span class="mood-tag">心情: {{ row.mood || 0 }}/5</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="excerpt" label="摘要" min-width="300" show-overflow-tooltip>
          <template #default="{ row }">
            <div class="note-excerpt">{{ row.excerpt || row.content.substring(0, 100) + '...' }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'public' ? 'success' : 'warning'">
              {{ row.status === 'public' ? '公开' : '私有' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="创建时间" width="180" sortable="custom">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <PermissionCheck permission="diary.read">
                <el-button size="small" @click="handleView(row)">查看</el-button>
              </PermissionCheck>
              <PermissionCheck permission="diary.update">
                <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
              </PermissionCheck>
              <PermissionCheck permission="diary.delete">
                <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
              </PermissionCheck>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <!-- 随记详情/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="60%"
      @closed="resetDialog"
    >
      <el-form
        ref="noteFormRef"
        :model="noteForm"
        :rules="noteRules"
        label-width="100px"
        :disabled="dialogMode === 'view'"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="noteForm.title" placeholder="请输入随记标题" />
        </el-form-item>

        <el-form-item label="内容" prop="content">
          <el-input
            v-model="noteForm.content"
            type="textarea"
            :rows="8"
            placeholder="请输入随记内容"
          />
        </el-form-item>

        <el-form-item label="摘要" prop="excerpt">
          <el-input
            v-model="noteForm.excerpt"
            type="textarea"
            :rows="3"
            placeholder="请输入摘要（可选，会自动生成）"
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="天气" prop="weather">
              <el-select v-model="noteForm.weather" placeholder="选择天气">
                <el-option label="晴天" value="sunny"></el-option>
                <el-option label="多云" value="cloudy"></el-option>
                <el-option label="雨天" value="rainy"></el-option>
                <el-option label="雪天" value="snowy"></el-option>
                <el-option label="部分多云" value="partly-cloudy"></el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="心情" prop="mood">
              <el-slider v-model="noteForm.mood" :min="0" :max="5" show-stops />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="noteForm.status">
            <el-radio value="public">公开</el-radio>
            <el-radio value="private">私有</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="图片" v-if="noteForm.images && noteForm.images.length > 0">
          <div class="image-list">
            <div v-for="(image, index) in noteForm.images" :key="index" class="image-item">
              <img :src="image" :alt="`图片 ${index + 1}`" />
            </div>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            v-if="dialogMode !== 'view'"
            type="primary"
            @click="handleSave"
            :loading="saving"
          >
            保存
          </el-button>
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
const notes = ref([])
const stats = ref(null)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

// 搜索和筛选
const searchQuery = ref('')
const weatherFilter = ref('')
const statusFilter = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref('desc')

// 弹窗相关
const dialogVisible = ref(false)
const dialogMode = ref('create') // create, edit, view
const noteFormRef = ref<FormInstance>()
const noteForm = reactive({
  id: '',
  title: '',
  content: '',
  excerpt: '',
  weather: 'sunny',
  mood: 0,
  status: 'public',
  images: []
})

// 表单验证规则
const noteRules: FormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { max: 200, message: '标题不能超过200个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入内容', trigger: 'blur' },
    { max: 5000, message: '内容不能超过5000个字符', trigger: 'blur' }
  ]
}

// 计算属性
const dialogTitle = computed(() => {
  const titles = {
    create: '新建随记',
    edit: '编辑随记',
    view: '查看随记'
  }
  return titles[dialogMode.value] || '随记'
})

// 生命周期
onMounted(() => {
  loadData()
  loadStats()
})

// 方法
const loadData = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value || undefined,
      weather: weatherFilter.value || undefined,
      status: statusFilter.value || undefined,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value
    }

    const response = await api.get('/diary/admin/notes', { params })
    notes.value = response.data.data
    total.value = response.data.pagination.total
  } catch (error) {
    console.error('加载随记列表失败:', error)
    ElMessage.error('加载随记列表失败')
  } finally {
    loading.value = false
  }
}

const loadStats = async () => {
  try {
    const response = await api.get('/diary/admin/stats')
    stats.value = response.data
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

const handleCreate = () => {
  dialogMode.value = 'create'
  resetNoteForm()
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogMode.value = 'edit'
  Object.assign(noteForm, {
    ...row,
    images: row.images || []
  })
  dialogVisible.value = true
}

const handleView = (row) => {
  dialogMode.value = 'view'
  Object.assign(noteForm, {
    ...row,
    images: row.images || []
  })
  dialogVisible.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除随记"${row.title}"吗？删除后无法恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await api.delete(`/diary/admin/notes/${row.id}`)
    ElMessage.success('删除成功')
    loadData()
    loadStats()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSave = async () => {
  if (!noteFormRef.value) return

  try {
    await noteFormRef.value.validate()
    saving.value = true

    const data = { ...noteForm }
    if (data.images && data.images.length === 0) {
      delete data.images
    }

    if (dialogMode.value === 'create') {
      await api.post('/diary/admin/notes', data)
      ElMessage.success('创建成功')
    } else {
      await api.patch(`/diary/admin/notes/${data.id}`, data)
      ElMessage.success('更新成功')
    }

    dialogVisible.value = false
    loadData()
    loadStats()
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleSortChange = ({ prop, order }) => {
  sortBy.value = prop || 'createdAt'
  sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
  loadData()
}

const resetFilters = () => {
  searchQuery.value = ''
  weatherFilter.value = ''
  statusFilter.value = ''
  currentPage.value = 1
  loadData()
}

const resetDialog = () => {
  resetNoteForm()
  if (noteFormRef.value) {
    noteFormRef.value.resetFields()
  }
}

const resetNoteForm = () => {
  Object.assign(noteForm, {
    id: '',
    title: '',
    content: '',
    excerpt: '',
    weather: 'sunny',
    mood: 0,
    status: 'public',
    images: []
  })
}

const getWeatherName = (weather: string) => {
  const weatherMap = {
    sunny: '晴天',
    cloudy: '多云',
    rainy: '雨天',
    snowy: '雪天',
    'partly-cloudy': '部分多云'
  }
  return weatherMap[weather] || weather
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style scoped>
.diary-notes-page {
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

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #666;
  font-size: 14px;
}

.search-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
  flex-wrap: wrap;
}

.search-input {
  width: 300px;
}

.table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.note-title strong {
  color: #303133;
  font-size: 14px;
}

.note-meta {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.weather-tag,
.mood-tag {
  background: #f0f9ff;
  color: #0369a1;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
}

.note-excerpt {
  color: #666;
  line-height: 1.4;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-container {
  padding: 20px;
  text-align: right;
}

.image-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.image-item img {
  width: 80px;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}
</style> 