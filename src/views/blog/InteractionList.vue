<template>
  <div class="interaction-management">
    <div class="header">
      <h1>交互管理</h1>
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-number">{{ stats?.overview.totalLikes || 0 }}</div>
          <div class="stat-label">总点赞数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats?.overview.totalComments || 0 }}</div>
          <div class="stat-label">总评论数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats?.overview.totalUsers || 0 }}</div>
          <div class="stat-label">总用户数</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats?.overview.todayLikes || 0 }}</div>
          <div class="stat-label">今日点赞</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ stats?.overview.todayComments || 0 }}</div>
          <div class="stat-label">今日评论</div>
        </div>
      </div>
    </div>

    <div class="tabs">
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'comments' }"
        @click="setActiveTab('comments')"
      >
        评论管理
      </button>
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'likes' }"
        @click="setActiveTab('likes')"
      >
        点赞管理
      </button>
      <button 
        class="tab-button"
        :class="{ active: activeTab === 'stats' }"
        @click="setActiveTab('stats')"
      >
        统计分析
      </button>
    </div>

    <!-- 评论管理 -->
    <div v-if="activeTab === 'comments'" class="tab-content">
      <div class="filters">
        <input
          v-model="commentFilters.search"
          type="text"
          placeholder="搜索评论内容或作者..."
          class="search-input"
          @input="debouncedSearchComments"
        />
        <select v-model="commentFilters.targetType" @change="loadComments">
          <option value="">所有类型</option>
          <option value="article">文章</option>
          <option value="stickyNote">便签</option>
          <option value="galleryImage">图片</option>
        </select>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>内容</th>
              <th>作者</th>
              <th>类型</th>
              <th>目标ID</th>
              <th>位置</th>
              <th>设备</th>
              <th>时间</th>
              <th>回复数</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="comment in comments" :key="comment.id">
              <td class="content-cell">
                <div class="content-preview">{{ comment.content }}</div>
              </td>
              <td>
                <div class="user-info">
                  <div class="nickname">{{ comment.author || '匿名' }}</div>
                  <div class="email">{{ comment.email || '-' }}</div>
                </div>
              </td>
              <td>{{ comment.targetType }}</td>
              <td class="target-id">{{ comment.targetId }}</td>
              <td>{{ comment.userInfo?.location || '-' }}</td>
              <td>{{ comment.userInfo?.deviceType || '-' }}</td>
              <td>{{ formatDate(comment.createdAt) }}</td>
              <td>{{ comment.repliesCount }}</td>
              <td>
                <button 
                  class="delete-btn"
                  @click="deleteCommentHandler(comment.id)"
                  :disabled="loading"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button 
          @click="commentPage > 1 && (commentPage--, loadComments())"
          :disabled="commentPage <= 1 || loading"
        >
          上一页
        </button>
        <span>第 {{ commentPage }} 页</span>
        <button 
          @click="commentsHasMore && (commentPage++, loadComments())"
          :disabled="!commentsHasMore || loading"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 点赞管理 -->
    <div v-if="activeTab === 'likes'" class="tab-content">
      <div class="filters">
        <select v-model="likeFilters.targetType" @change="loadLikes">
          <option value="">所有类型</option>
          <option value="article">文章</option>
          <option value="stickyNote">便签</option>
          <option value="galleryImage">图片</option>
        </select>
      </div>

      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>用户</th>
              <th>类型</th>
              <th>目标ID</th>
              <th>位置</th>
              <th>设备</th>
              <th>浏览器</th>
              <th>IP地址</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="like in likes" :key="like.id">
              <td>
                <div class="user-info">
                  <div class="nickname">{{ like.userInfo?.nickname || '匿名' }}</div>
                </div>
              </td>
              <td>{{ like.targetType }}</td>
              <td class="target-id">{{ like.targetId }}</td>
              <td>{{ like.userInfo?.location || '-' }}</td>
              <td>{{ like.userInfo?.deviceType || '-' }}</td>
              <td>{{ like.userInfo?.browser || '-' }}</td>
              <td class="ip-address">{{ like.userInfo?.ipAddress || '-' }}</td>
              <td>{{ formatDate(like.createdAt) }}</td>
              <td>
                <button 
                  class="delete-btn"
                  @click="deleteLikeHandler(like.id)"
                  :disabled="loading"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button 
          @click="likePage > 1 && (likePage--, loadLikes())"
          :disabled="likePage <= 1 || loading"
        >
          上一页
        </button>
        <span>第 {{ likePage }} 页</span>
        <button 
          @click="likesHasMore && (likePage++, loadLikes())"
          :disabled="!likesHasMore || loading"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 统计分析 -->
    <div v-if="activeTab === 'stats'" class="tab-content">
      <div class="stats-section">
        <h3>热门内容</h3>
        <div v-if="stats?.topTargets && stats.topTargets.length > 0" class="top-targets">
          <div v-for="target in stats.topTargets" :key="`${target.targetType}-${target.targetId}`" class="target-item">
            <div class="target-info">
              <div class="target-type-badge" :class="target.targetType">
                {{ getTargetTypeText(target.targetType) }}
              </div>
              <div class="target-details">
                <div class="target-id">{{ formatTargetId(target.targetId) }}</div>
                <div class="target-meta">{{ target.targetType }}</div>
              </div>
            </div>
            <div class="likes-count">{{ target.likesCount }} 个赞</div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📊</div>
          <div class="empty-text">暂无热门内容数据</div>
        </div>
      </div>

      <div class="stats-section">
        <h3>最近活动</h3>
        <div v-if="stats?.recentActivity && stats.recentActivity.length > 0" class="recent-activity">
          <div v-for="activity in stats.recentActivity" :key="`${activity.timestamp}-${activity.fingerprint}`" class="activity-item">
            <div class="activity-info">
              <div class="action-badge" :class="activity.action">
                {{ getActionText(activity.action) }}
              </div>
              <div class="activity-details">
                <div class="target-info">{{ activity.targetType }}: {{ formatTargetId(activity.targetId) }}</div>
                <div class="activity-time">{{ formatDate(activity.timestamp) }}</div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">🔄</div>
          <div class="empty-text">暂无最近活动数据</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  getLikes, 
  getComments, 
  deleteComment, 
  deleteLike, 
  getInteractionStats,
  type Like,
  type Comment,
  type InteractionStats
} from '../../api/interactions'

// 响应式数据
const activeTab = ref('comments')
const loading = ref(false)
const stats = ref<InteractionStats | null>(null)

// 评论相关
const comments = ref<Comment[]>([])
const commentPage = ref(1)
const commentsHasMore = ref(false)
const commentFilters = ref({
  search: '',
  targetType: ''
})

// 点赞相关
const likes = ref<Like[]>([])
const likePage = ref(1)
const likesHasMore = ref(false)
const likeFilters = ref({
  targetType: ''
})

// 防抖搜索
let searchTimeout: ReturnType<typeof setTimeout>
const debouncedSearchComments = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    commentPage.value = 1
    loadComments()
  }, 500)
}

// 加载评论列表
const loadComments = async () => {
  loading.value = true
  try {
    const response = await getComments({
      page: commentPage.value,
      limit: 20,
      ...commentFilters.value
    })
    comments.value = response.data.comments
    commentsHasMore.value = response.data.hasMore
  } catch (error) {
    console.error('加载评论失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载点赞列表
const loadLikes = async () => {
  loading.value = true
  try {
    const response = await getLikes({
      page: likePage.value,
      limit: 20,
      ...likeFilters.value
    })
    likes.value = response.data.likes
    likesHasMore.value = response.data.hasMore
  } catch (error) {
    console.error('加载点赞失败:', error)
  } finally {
    loading.value = false
  }
}

// 加载统计信息
const loadStats = async () => {
  try {
    const response = await getInteractionStats()
    stats.value = response.data
  } catch (error) {
    console.error('加载统计信息失败:', error)
  }
}

// 删除评论
const deleteCommentHandler = async (id: string) => {
  if (!confirm('确定要删除这条评论吗？')) return
  
  try {
    await deleteComment(id)
    await loadComments()
    await loadStats()
    alert('评论已删除')
  } catch (error) {
    console.error('删除评论失败:', error)
    alert('删除失败')
  }
}

// 删除点赞
const deleteLikeHandler = async (id: string) => {
  if (!confirm('确定要删除这个点赞吗？')) return
  
  try {
    await deleteLike(id)
    await loadLikes()
    await loadStats()
    alert('点赞已删除')
  } catch (error) {
    console.error('删除点赞失败:', error)
    alert('删除失败')
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

// 获取操作文本
const getActionText = (action: string) => {
  const actionMap: Record<string, string> = {
    'like': '点赞',
    'unlike': '取消点赞',
    'comment': '评论'
  }
  return actionMap[action] || action
}

// 获取目标类型文本
const getTargetTypeText = (targetType: string) => {
  const typeMap: Record<string, string> = {
    'article': '文章',
    'stickyNote': '便签',
    'galleryImage': '图片'
  }
  return typeMap[targetType] || targetType
}

// 格式化目标ID
const formatTargetId = (targetId: string) => {
  return targetId.slice(0, 10) + '...' // 简单截断，实际应用中可能需要更复杂的格式化
}

// 设置活动标签页并加载对应数据
const setActiveTab = (tab: string) => {
  activeTab.value = tab
  if (tab === 'comments') {
    loadComments()
  } else if (tab === 'likes') {
    loadLikes()
  }
}

// 监听tab切换
const handleTabChange = () => {
  if (activeTab.value === 'comments') {
    loadComments()
  } else if (activeTab.value === 'likes') {
    loadLikes()
  }
}

// 初始化
onMounted(() => {
  loadStats()
  loadComments()
  loadLikes() // 也加载点赞数据
})
</script>

<style scoped>
.interaction-management {
  padding: 24px;
}

.header {
  margin-bottom: 24px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #1f2937;
}

.stats-cards {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  min-width: 120px;
}

.stat-number {
  font-size: 28px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 24px;
}

.tab-button {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-button.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

.tab-button:hover {
  color: #3b82f6;
}

.tab-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 300px;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
}

.table-container {
  overflow-x: auto;
  margin-bottom: 24px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
}

.data-table td {
  font-size: 14px;
  color: #6b7280;
}

.content-cell {
  max-width: 300px;
}

.content-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info .nickname {
  font-weight: 500;
  color: #374151;
}

.user-info .email {
  font-size: 12px;
  color: #9ca3af;
}

.target-id {
  font-family: monospace;
  font-size: 12px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ip-address {
  font-family: monospace;
  font-size: 12px;
}

.delete-btn {
  padding: 6px 12px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.delete-btn:hover:not(:disabled) {
  background: #dc2626;
}

.delete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.pagination button:hover:not(:disabled) {
  background: #f3f4f6;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 16px;
}

.top-targets,
.recent-activity {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.target-item,
.activity-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 6px;
}

.target-info,
.activity-info {
  display: flex;
  gap: 8px;
  align-items: center;
}

.target-type,
.action {
  font-weight: 500;
  color: #374151;
}

.target-id,
.target {
  font-family: monospace;
  font-size: 12px;
  color: #6b7280;
}

.likes-count {
  font-weight: 600;
  color: #3b82f6;
}

.activity-time {
  font-size: 12px;
  color: #9ca3af;
}

.target-type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
}

.target-type-badge.article {
  background: #fef2f2;
  color: #b4111a;
}

.target-type-badge.stickyNote {
  background: #fffbeb;
  color: #a16207;
}

.target-type-badge.galleryImage {
  background: #f3f4ff;
  color: #3b5bdb;
}

.action-badge {
  padding: 4px 8px;
  border-radius: 4px;
  background: #f3f4f6;
  color: #374151;
  font-size: 12px;
}

.action-badge.like {
  background: #fef2f2;
  color: #b4111a;
}

.action-badge.unlike {
  background: #fffbeb;
  color: #a16207;
}

.action-badge.comment {
  background: #f3f4ff;
  color: #3b5bdb;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  text-align: center;
}

.empty-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.empty-text {
  font-size: 14px;
  color: #6b7280;
}
</style> 