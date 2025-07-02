<template>
  <div class="interaction-list">
    <el-tabs v-model="activeTab" class="interaction-tabs">
      <el-tab-pane label="统计分析" name="stats">
        <!-- Overview Cards -->
        <el-row :gutter="20" class="overview-cards">
          <el-col v-for="item in overviewData" :key="item.title" :span="4">
            <el-card class="overview-card" shadow="never">
              <div class="card-content">
                <div class="card-title">{{ item.title }}</div>
                <div class="card-value">{{ item.value }}</div>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Charts -->
        <el-row :gutter="20" class="charts-container">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <h3>评论类型分布</h3>
                </div>
              </template>
              <div ref="commentTypeChart" style="height: 300px"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <h3>评论趋势</h3>
                </div>
              </template>
              <div ref="commentTrendChart" style="height: 300px"></div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Lists -->
        <el-row :gutter="20" class="lists-container">
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <h3>活跃评论用户</h3>
                </div>
              </template>
              <el-table :data="topCommenters" style="width: 100%">
                <el-table-column prop="author" label="用户" />
                <el-table-column prop="count" label="评论数" width="100" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card shadow="never">
              <template #header>
                <div class="card-header">
                  <h3>热门评论内容</h3>
                </div>
              </template>
              <el-table :data="topContent" style="width: 100%">
                <el-table-column prop="title" label="标题" show-overflow-tooltip />
                <el-table-column prop="count" label="评论数" width="100" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>

        <!-- Recent Activity -->
        <el-card class="recent-activity" shadow="never">
          <template #header>
            <div class="card-header">
              <h3>最近活动</h3>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="activity in recentActivity"
              :key="activity.timestamp"
              :type="getActivityType(activity.action)"
              :timestamp="formatTime(activity.timestamp)"
            >
              {{ activity.action === 'comment' ? '发表评论' : activity.action === 'like' ? '点赞' : '取消点赞' }}
              {{ formatType(activity.targetType) }}
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="评论管理" name="comments">
        <CommentList />
      </el-tab-pane>

      <el-tab-pane label="点赞管理" name="likes">
        <LikeList />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick } from 'vue'
import { getInteractionStats, type InteractionStats } from '@/api/interactions'
import * as echarts from 'echarts'
import dayjs from 'dayjs'
import CommentList from './CommentList.vue'
import LikeList from './LikeList.vue'

const activeTab = ref('stats')
const commentTypeChart = ref<HTMLElement | null>(null)
const commentTrendChart = ref<HTMLElement | null>(null)

const stats = ref<InteractionStats>({
  overview: {
    totalLikes: 0,
    totalComments: 0,
    totalUsers: 0,
    todayLikes: 0,
    todayComments: 0,
  },
  topTargets: [],
  recentActivity: [],
  commentStats: {
    byType: [],
    dailyTrend: [],
    topCommenters: [],
    topContent: [],
  },
})

const overviewData = computed(() => [
  { title: '总点赞数', value: stats.value.overview.totalLikes },
  { title: '总评论数', value: stats.value.overview.totalComments },
  { title: '总用户数', value: stats.value.overview.totalUsers },
  { title: '今日点赞', value: stats.value.overview.todayLikes },
  { title: '今日评论', value: stats.value.overview.todayComments },
])

const topCommenters = computed(() => stats.value.commentStats.topCommenters)
const topContent = computed(() => stats.value.commentStats.topContent)
const recentActivity = computed(() => stats.value.recentActivity)

const formatType = (type: string) => {
  const typeMap: Record<string, string> = {
    article: '文章',
    galleryImage: '图片',
    stickyNote: '便签',
  }
  return typeMap[type] || type
}

const formatTime = (timestamp: string) => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

const getActivityType = (action: string) => {
  const typeMap: Record<string, string> = {
    like: 'success',
    unlike: 'warning',
    comment: 'primary',
  }
  return typeMap[action] || 'info'
}

const initCharts = () => {
  // 评论类型分布图
  if (commentTypeChart.value) {
    const chart = echarts.init(commentTypeChart.value)
    const typeData = stats.value.commentStats.byType
    chart.setOption({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        left: 'left'
      },
      series: [
        {
          type: 'pie',
          radius: '50%',
          data: typeData.map(item => ({
            name: formatType(item.type),
            value: item.count
          })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    })
  }

  // 评论趋势图
  if (commentTrendChart.value) {
    const chart = echarts.init(commentTrendChart.value)
    const trendData = stats.value.commentStats.dailyTrend
    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      xAxis: {
        type: 'category',
        data: trendData.map(item => item.date),
        axisLabel: {
          rotate: 45
        }
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: trendData.map(item => item.count),
          type: 'line',
          smooth: true
        }
      ]
    })
  }
}

onMounted(async () => {
  try {
    const response = await getInteractionStats()
    stats.value = response.data
    // 等待下一个 DOM 更新周期后初始化图表
    await nextTick()
    initCharts()
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
})

// 监听窗口大小变化，重新渲染图表
window.addEventListener('resize', () => {
  if (commentTypeChart.value) {
    echarts.getInstanceByDom(commentTypeChart.value)?.resize()
  }
  if (commentTrendChart.value) {
    echarts.getInstanceByDom(commentTrendChart.value)?.resize()
  }
})
</script>

<style scoped lang="scss">
.interaction-list {
  padding: 20px;
}

.overview-cards {
  margin-bottom: 20px;
}

.overview-card {
  height: 120px;
}

.card-content {
  text-align: center;
}

.card-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
}

.charts-container,
.lists-container {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-activity {
  margin-bottom: 20px;
}
</style> 