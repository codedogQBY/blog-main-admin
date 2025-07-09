<template>
  <div class="dashboard-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="4" v-for="(stat, key) in stats" :key="key">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" :class="stat.color">
              <el-icon><component :is="stat.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>内容趋势</span>
              <el-radio-group v-model="trendType" size="small">
                <el-radio-button value="articles">文章</el-radio-button>
          <el-radio-button value="interactions">互动</el-radio-button>
          <el-radio-button value="diary">随记</el-radio-button>
          <el-radio-button value="gallery">图库</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="trend-chart">
            <el-skeleton :loading="loading" animated>
              <template #default>
                <div ref="chartRef" style="height: 300px"></div>
              </template>
            </el-skeleton>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="recent-activities">
        <template #header>
          <div class="card-header">
              <span>最近活动</span>
              <el-button text>查看全部</el-button>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivities"
              :key="activity.id"
              :timestamp="activity.time"
              :type="activity.type"
            >
              {{ activity.content }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最新内容 -->
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最新文章</span>
              <el-button text @click="$router.push('/admin/articles')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentArticles" style="width: 100%" size="small">
            <el-table-column prop="title" label="标题" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'PUBLISHED' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'PUBLISHED' ? '已发布' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="180" />
          </el-table>
      </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
        <template #header>
          <div class="card-header">
              <span>最新评论</span>
              <el-button text @click="$router.push('/admin/interactions')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentComments" style="width: 100%" size="small">
            <el-table-column prop="content" label="内容" show-overflow-tooltip />
            <el-table-column label="目标" show-overflow-tooltip width="200">
              <template #default="{ row }">
                {{ row.targetInfo?.title || '未知内容' }}
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="时间" width="180" />
          </el-table>
      </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { Document, ChatRound, Picture, Notebook, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { markRaw } from 'vue'
import { api } from '@/lib/api'

const router = useRouter()
const loading = ref(true)
const chartRef = ref<HTMLElement>()
const chart = ref<echarts.ECharts>()
const trendType = ref('articles')

// 统计数据
const stats = ref([
  { label: '文章总数', value: 0, icon: markRaw(Document), color: 'blue' },
  { label: '评论数', value: 0, icon: markRaw(ChatRound), color: 'green' },
  { label: '图片数', value: 0, icon: markRaw(Picture), color: 'purple' },
  { label: '随记数', value: 0, icon: markRaw(Notebook), color: 'orange' },
  { label: '用户数', value: 0, icon: markRaw(User), color: 'red' },
])

const recentActivities = ref([])
const recentArticles = ref([])
const recentComments = ref([])
const trend = ref({})

// 获取统计数据
const fetchStats = async () => {
  try {
    const { data } = await api.get('/dashboard/stats')
    stats.value[0].value = data.articles.total
    stats.value[1].value = data.interactions.comments
    stats.value[2].value = data.gallery.total
    stats.value[3].value = data.diary.total
    stats.value[4].value = data.users.total
  } catch (error) {
    ElMessage.error('获取统计数据失败')
  }
}

// 获取最近活动
const fetchRecentActivities = async () => {
  try {
    const { data } = await api.get('/dashboard/recent-activities')
    recentArticles.value = data.articles || []
    recentComments.value = data.comments || []
    
    // 合并活动并按时间排序
    const activities = [
      ...(data.articles || []).map(a => ({
        id: `article-${a.id}`,
        content: `发布了文章《${a.title}》`,
        time: a.createdAt,
        type: 'primary'
      })),
      ...(data.comments || []).map(c => ({
        id: `comment-${c.id}`,
        content: c.targetType === 'article' 
          ? `评论了文章《${c.targetInfo?.title || '未知文章'}》`
          : c.targetType === 'sticky_note'
          ? `评论了留言《${c.targetInfo?.title || '未知留言'}》`
          : `评论了图片《${c.targetInfo?.title || '未知图片'}》`,
        time: c.createdAt,
        type: 'success'
      })),
      ...(data.likes || []).map(l => ({
        id: `like-${l.id}`,
        content: l.targetType === 'article' 
          ? `点赞了文章《${l.targetInfo?.title || '未知文章'}》`
          : l.targetType === 'sticky_note'
          ? `点赞了留言《${l.targetInfo?.title || '未知留言'}》`
          : `点赞了图片《${l.targetInfo?.title || '未知图片'}》`,
        time: l.createdAt,
        type: 'warning'
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    
    recentActivities.value = activities.slice(0, 10)
  } catch (error) {
    console.error('获取最近活动失败:', error)
    ElMessage.error('获取最近活动失败')
          }
        }

// 获取趋势数据
const fetchTrend = async () => {
  try {
    const [articlesData, interactionsData, diaryData, galleryData] = await Promise.all([
      api.get('/dashboard/trend?type=articles'),
      api.get('/dashboard/trend?type=interactions'),
      api.get('/dashboard/trend?type=diary'),
      api.get('/dashboard/trend?type=gallery')
    ])
    
    trend.value = {
      articles: articlesData.data,
      interactions: interactionsData.data,
      diary: diaryData.data,
      gallery: galleryData.data
    }
  } catch (error) {
    console.error('获取趋势数据失败:', error)
    ElMessage.error('获取趋势数据失败')
  }
}

// 更新图表
const updateChart = () => {
  if (!chartRef.value) return

  // 每次切换类型时，销毁旧实例，重新初始化，避免option缓存
  if (chart.value) {
    chart.value.dispose()
    chart.value = undefined
  }
  chart.value = echarts.init(chartRef.value)

  const data = trend.value[trendType.value]
  if (!data || !Array.isArray(data)) {
    return
  }

  let series = []
  if (trendType.value === 'interactions') {
    series = [
      {
        name: '评论',
        data: data.map(d => d.comments || 0),
        type: 'line',
        smooth: true,
        areaStyle: {},
        color: '#67C23A'
      },
      {
        name: '点赞',
        data: data.map(d => d.likes || 0),
        type: 'line',
        smooth: true,
        areaStyle: {},
        color: '#E6A23C'
      }
    ]
  } else {
    series = [
      {
        data: data.map(d => d.count || 0),
        type: 'line',
        smooth: true,
        areaStyle: {}
      }
    ]
  }

  const option = {
    tooltip: {
      trigger: 'axis'
    },
    legend: trendType.value === 'interactions' ? {
      data: ['评论', '点赞']
    } : undefined,
    xAxis: {
      type: 'category',
      data: data.map(d => d.date)
    },
    yAxis: {
      type: 'value'
    },
    series
  }

  chart.value.setOption(option, true) // 强制覆盖
}

// 监听趋势类型变化
watch(trendType, () => {
  updateChart()
})

onMounted(async () => {
  await Promise.all([
    fetchStats(),
    fetchRecentActivities(),
    fetchTrend()
  ])
  loading.value = false
  
  // 确保DOM完全渲染后再初始化图表
  nextTick(() => {
    updateChart()
  })
})
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
    }

.mb-4 {
  margin-bottom: 20px;
}

.stat-card {
  height: 100px;
}

.stat-content {
        display: flex;
        align-items: center;
  height: 100%;
        }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
  margin-right: 16px;
}

.stat-icon :deep(.el-icon) {
          font-size: 24px;
          color: white;
}

.stat-info {
  flex: 1;
          }

.stat-value {
  font-size: 24px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 8px;
}

.stat-label {
            font-size: 14px;
  color: #909399;
}

.blue { background-color: #409EFF; }
.green { background-color: #67C23A; }
.purple { background-color: #B37FEB; }
.orange { background-color: #E6A23C; }
.red { background-color: #F56C6C; }

    .card-header {
        display: flex;
  justify-content: space-between;
        align-items: center;
}

.recent-activities {
  height: 400px;
  overflow-y: auto;
        }

:deep(.el-timeline-item__content) {
  color: #606266;
  }

:deep(.el-timeline-item__timestamp) {
  color: #909399;
}
</style> 