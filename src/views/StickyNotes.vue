<template>
  <div class="sticky-notes-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1>留言管理</h1>
      <p>管理网站留言墙的所有留言内容</p>
    </div>

    <!-- 筛选工具栏 -->
    <div class="toolbar">
      <div class="filters">
        <el-select v-model="filters.category" placeholder="选择分类" clearable @change="loadStickyNotes">
          <el-option label="全部分类" value="" />
          <el-option 
            v-for="category in categories" 
            :key="category.name" 
            :label="category.name" 
            :value="category.name" 
          />
        </el-select>
        
        <el-input 
          v-model="filters.search" 
          placeholder="搜索留言内容或作者" 
          @keyup.enter="loadStickyNotes"
          clearable
        >
          <template #append>
            <el-button @click="loadStickyNotes" :icon="Search" />
          </template>
        </el-input>
      </div>

      <div class="actions">
        <el-button @click="loadStickyNotes" :icon="Refresh">刷新</el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-cards">
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalNotes }}</div>
          <div class="stat-label">总留言数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalLikes }}</div>
          <div class="stat-label">总点赞数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalComments }}</div>
          <div class="stat-label">总评论数</div>
        </div>
      </el-card>
      <el-card class="stat-card">
        <div class="stat-content">
          <div class="stat-number">{{ stats.recentNotes }}</div>
          <div class="stat-label">最近7天</div>
        </div>
      </el-card>
    </div>

    <!-- 留言列表 -->
    <el-card class="table-card">
      <el-table 
        :data="stickyNotes" 
        v-loading="loading"
        row-key="id"
        stripe
      >
        <el-table-column label="内容" min-width="200">
          <template #default="{ row }">
            <div class="content-cell">
              <div class="content-text">{{ row.content }}</div>
              <div class="content-meta">
                <el-tag :type="getColorType(row.color)" size="small">{{ row.color }}</el-tag>
                <el-tag size="small" effect="plain">{{ row.category }}</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="author" label="作者" width="120">
          <template #default="{ row }">
            <div class="author-cell">
              <div class="author-name">{{ row.author }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'public' ? 'success' : 'warning'" size="small">
              {{ row.status === 'public' ? '公开' : '私有' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="统计" width="120">
          <template #default="{ row }">
            <div class="stats-cell">
              <div class="stat-item">
                <el-icon><StarFilled /></el-icon>
                {{ row.likes }}
              </div>
              <div class="stat-item">
                <el-icon><ChatDotRound /></el-icon>
                {{ row.comments }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            <div class="time-cell">
              <div>{{ formatDateTime(row.createdAt) }}</div>
              <div class="time-relative">{{ formatRelativeTime(row.createdAt) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button 
                type="primary" 
                size="small" 
                @click="viewDetail(row)"
                :icon="View"
                link
              >
                查看
              </el-button>
              <el-button 
                type="warning" 
                size="small" 
                @click="editStickyNote(row)"
                :icon="Edit"
                link
              >
                编辑
              </el-button>
              <el-button 
                type="danger" 
                size="small" 
                @click="deleteStickyNote(row)"
                :icon="Delete"
                link
              >
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.limit"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadStickyNotes"
          @current-change="loadStickyNotes"
        />
      </div>
    </el-card>

    <!-- 留言详情对话框 -->
    <el-dialog 
      v-model="detailDialog.visible" 
      title="留言详情" 
      width="800px"
      :destroy-on-close="true"
    >
      <div v-if="detailDialog.data" class="detail-content">
        <div class="detail-header">
          <h3>{{ detailDialog.data.author }} 的留言</h3>
          <div class="detail-meta">
            <el-tag :type="getColorType(detailDialog.data.color)">{{ detailDialog.data.color }}</el-tag>
            <el-tag effect="plain">{{ detailDialog.data.category }}</el-tag>
            <span class="detail-time">{{ formatDateTime(detailDialog.data.createdAt) }}</span>
          </div>
        </div>
        
        <div class="detail-body">
          <p class="detail-text">{{ detailDialog.data.content }}</p>
        </div>

        <div class="detail-stats">
          <div class="stat-group">
            <el-icon><StarFilled /></el-icon>
            <span>{{ detailDialog.data.likes }} 个赞</span>
          </div>
          <div class="stat-group">
            <el-icon><ChatDotRound /></el-icon>
            <span>{{ detailDialog.data.comments }} 条评论</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑留言对话框 -->
    <el-dialog 
      v-model="editDialog.visible" 
      title="编辑留言" 
      width="600px"
      :destroy-on-close="true"
    >
      <el-form 
        v-if="editDialog.data" 
        :model="editDialog.data" 
        label-width="80px"
      >
        <el-form-item label="作者">
          <el-input v-model="editDialog.data.author" />
        </el-form-item>
        
        <el-form-item label="分类">
          <el-select v-model="editDialog.data.category">
            <el-option 
              v-for="category in defaultCategories" 
              :key="category" 
              :label="category" 
              :value="category" 
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="颜色">
          <el-select v-model="editDialog.data.color">
            <el-option label="粉色" value="pink" />
            <el-option label="黄色" value="yellow" />
            <el-option label="蓝色" value="blue" />
            <el-option label="绿色" value="green" />
            <el-option label="紫色" value="purple" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="状态">
          <el-select v-model="editDialog.data.status">
            <el-option label="公开" value="public" />
            <el-option label="私有" value="private" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="内容">
          <el-input 
            v-model="editDialog.data.content" 
            type="textarea" 
            :rows="6"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="saveEdit" :loading="editDialog.loading">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Search, 
  Refresh, 
  View, 
  Edit, 
  Delete,
  StarFilled,
  ChatDotRound
} from '@element-plus/icons-vue'
import { stickyNoteApi } from '@/lib/api'

// 响应式数据
const loading = ref(false)
const stickyNotes = ref([])
const categories = ref([])
const stats = ref({
  totalNotes: 0,
  totalLikes: 0,
  totalComments: 0,
  recentNotes: 0
})

const filters = reactive({
  category: '',
  search: ''
})

const pagination = reactive({
  page: 1,
  limit: 20,
  total: 0
})

const detailDialog = reactive({
  visible: false,
  data: null
})

const editDialog = reactive({
  visible: false,
  data: null,
  loading: false
})

const defaultCategories = ['留言', '目标', '理想', '过去', '将来', '爱情', '亲情', '友情', '秘密', '信条', '无题']

// 颜色类型映射
const getColorType = (color) => {
  const colorMap = {
    pink: 'danger',
    yellow: 'warning',
    blue: 'primary',
    green: 'success',
    purple: 'info'
  }
  return colorMap[color] || 'info'
}

// 格式化时间
const formatDateTime = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatRelativeTime = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diff = now - date
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return formatDateTime(dateString).split(' ')[0]
}

// 加载留言列表
const loadStickyNotes = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      category: filters.category || undefined,
      search: filters.search || undefined
    }
    
    const response = await stickyNoteApi.getAdminList(params)
    stickyNotes.value = response.data
    pagination.total = response.pagination.total
  } catch (error) {
    console.error('加载留言失败:', error)
    ElMessage.error('加载留言失败')
  } finally {
    loading.value = false
  }
}

// 加载分类
const loadCategories = async () => {
  try {
    const response = await stickyNoteApi.getCategories()
    categories.value = response.data
  } catch (error) {
    console.error('加载分类失败:', error)
  }
}

// 加载统计信息
const loadStats = async () => {
  try {
    const response = await stickyNoteApi.getAdminStats()
    stats.value = response
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 查看详情
const viewDetail = (row) => {
  detailDialog.data = { ...row }
  detailDialog.visible = true
}

// 编辑留言
const editStickyNote = (row) => {
  editDialog.data = { ...row }
  editDialog.visible = true
}

// 保存编辑
const saveEdit = async () => {
  editDialog.loading = true
  try {
    await stickyNoteApi.update(editDialog.data.id, {
      content: editDialog.data.content,
      author: editDialog.data.author,
      category: editDialog.data.category,
      color: editDialog.data.color,
      status: editDialog.data.status
    })
    
    ElMessage.success('留言更新成功')
    editDialog.visible = false
    loadStickyNotes()
    loadStats() // 重新加载统计信息
  } catch (error) {
    console.error('更新留言失败:', error)
    ElMessage.error('更新留言失败')
  } finally {
    editDialog.loading = false
  }
}

// 删除留言
const deleteStickyNote = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除 ${row.author} 的留言吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    await stickyNoteApi.delete(row.id)
    ElMessage.success('留言删除成功')
    loadStickyNotes()
    loadStats() // 重新加载统计信息
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除留言失败:', error)
      ElMessage.error('删除留言失败')
    }
  }
}

// 初始化
onMounted(() => {
  loadStickyNotes()
  loadCategories()
  loadStats()
})
</script>

<style scoped>
.sticky-notes-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #303133;
}

.page-header p {
  color: #606266;
  margin: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 16px;
}

.filters {
  display: flex;
  gap: 12px;
  flex: 1;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.stat-card {
  border: none;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  text-align: center;
  padding: 10px;
}

.stat-number {
  font-size: 28px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.stat-label {
  color: #606266;
  font-size: 14px;
}

.table-card {
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  border: none;
}

.content-cell {
  max-width: 300px;
}

.content-text {
  line-height: 1.5;
  margin-bottom: 8px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.content-meta {
  display: flex;
  gap: 8px;
}

.author-cell {
  text-align: center;
}

.author-name {
  font-weight: 500;
}

.stats-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}

.time-cell {
  font-size: 12px;
}

.time-relative {
  color: #909399;
  margin-top: 4px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.detail-content {
  padding: 10px;
}

.detail-header {
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 16px;
  margin-bottom: 16px;
}

.detail-header h3 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-time {
  color: #909399;
  font-size: 14px;
}

.detail-body {
  margin-bottom: 20px;
}

.detail-text {
  line-height: 1.6;
  color: #303133;
  margin: 0;
}

.detail-stats {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-group {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
  font-size: 14px;
}

.dialog-footer {
  text-align: right;
}
</style> 