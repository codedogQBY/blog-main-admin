<template>
  <div class="dashboard-home">
    <!-- 欢迎区域 -->
    <div class="welcome-section">
      <el-card class="welcome-card" shadow="never">
        <div class="welcome-content">
          <div class="welcome-text">
            <h1 class="welcome-title">
              <el-icon class="welcome-icon"><Sunny /></el-icon>
              欢迎回来，{{ userStore.user?.name }}！
            </h1>
            <p class="welcome-subtitle">今天是个美好的一天，开始您的创作之旅吧</p>
          </div>
          <div class="welcome-actions">
            <PermissionCheck permission="article.create">
              <el-button 
                type="primary" 
                size="large"
                @click="$router.push('/admin/articles/create')"
                class="create-btn"
              >
                <el-icon><EditPen /></el-icon>
                创作新文章
              </el-button>
            </PermissionCheck>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 统计概览 -->
    <div class="stats-overview">
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon articles">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.articles }}</div>
            <div class="stat-label">文章总数</div>
            <div class="stat-change positive">
              <el-icon><ArrowUp /></el-icon>
              +12% 本月
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon views">
            <el-icon><View /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.views }}</div>
            <div class="stat-label">总阅读量</div>
            <div class="stat-change positive">
              <el-icon><ArrowUp /></el-icon>
              +8% 本月
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon users">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.users }}</div>
            <div class="stat-label">用户总数</div>
            <div class="stat-change positive">
              <el-icon><ArrowUp /></el-icon>
              +5% 本月
            </div>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon categories">
            <el-icon><CollectionTag /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stats.categories }}</div>
            <div class="stat-label">分类数量</div>
            <div class="stat-change neutral">
              <el-icon><Minus /></el-icon>
              无变化
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="quick-actions-section">
      <el-card class="actions-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>快捷操作</h3>
            <p>常用功能快速入口</p>
          </div>
        </template>
        
        <div class="actions-grid">
          <PermissionCheck permission="article.create">
            <div class="action-item" @click="$router.push('/admin/articles/create')">
              <div class="action-icon create">
                <el-icon><EditPen /></el-icon>
              </div>
              <div class="action-content">
                <h4>创作文章</h4>
                <p>撰写新的博客文章</p>
              </div>
            </div>
          </PermissionCheck>
          
          <PermissionCheck permission="article.read">
            <div class="action-item" @click="$router.push('/admin/articles')">
              <div class="action-icon manage">
                <el-icon><Document /></el-icon>
              </div>
              <div class="action-content">
                <h4>文章管理</h4>
                <p>管理已发布的文章</p>
              </div>
            </div>
          </PermissionCheck>
          
          <PermissionCheck permission="category.read">
            <div class="action-item" @click="$router.push('/admin/categories')">
              <div class="action-icon category">
                <el-icon><FolderOpened /></el-icon>
              </div>
              <div class="action-content">
                <h4>分类管理</h4>
                <p>组织文章分类结构</p>
              </div>
            </div>
          </PermissionCheck>
          
          <PermissionCheck permission="user.read">
            <div class="action-item" @click="$router.push('/admin/users')">
              <div class="action-icon users">
                <el-icon><UserFilled /></el-icon>
              </div>
              <div class="action-content">
                <h4>用户管理</h4>
                <p>管理系统用户权限</p>
              </div>
            </div>
          </PermissionCheck>
        </div>
      </el-card>
    </div>

    <!-- 最近活动 -->
    <div class="recent-activity">
      <el-card class="activity-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h3>最近活动</h3>
            <p>系统最新动态</p>
          </div>
        </template>
        
        <div class="activity-list">
          <div class="activity-item">
            <div class="activity-icon">
              <el-icon><Document /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">发布了新文章《Vue 3 最佳实践指南》</div>
              <div class="activity-time">2小时前</div>
            </div>
          </div>
          
          <div class="activity-item">
            <div class="activity-icon">
              <el-icon><UserFilled /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">新用户 "张三" 注册成功</div>
              <div class="activity-time">4小时前</div>
            </div>
          </div>
          
          <div class="activity-item">
            <div class="activity-icon">
              <el-icon><Edit /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">更新了文章《JavaScript 进阶教程》</div>
              <div class="activity-time">6小时前</div>
            </div>
          </div>
          
          <div class="activity-item">
            <div class="activity-icon">
              <el-icon><FolderOpened /></el-icon>
            </div>
            <div class="activity-content">
              <div class="activity-title">创建了新分类 "前端开发"</div>
              <div class="activity-time">1天前</div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { 
  Sunny,
  EditPen, 
  Document, 
  View, 
  UserFilled, 
  CollectionTag,
  ArrowUp,
  Minus,
  FolderOpened,
  Edit
} from '@element-plus/icons-vue'
import { useAuthStore } from '../lib/store'
import PermissionCheck from '@/components/PermissionCheck.vue'

const userStore = useAuthStore()

// 统计数据
const stats = ref({
  articles: 0,
  views: 0,
  users: 0,
  categories: 0
})

// 模拟加载统计数据
onMounted(async () => {
  // 这里可以调用实际的API获取统计数据
  setTimeout(() => {
    stats.value = {
      articles: 156,
      views: 12486,
      users: 89,
      categories: 12
    }
  }, 500)
})
</script>

<style scoped lang="scss">
.dashboard-home {
  padding: 24px;
  background: #f8fafc;
  min-height: 100vh;
}

.welcome-section {
  margin-bottom: 32px;

  .welcome-card {
    border-radius: 20px;
    border: none;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);

    :deep(.el-card__body) {
      padding: 40px;
    }

    .welcome-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;

      .welcome-text {
        .welcome-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 12px 0;
          font-size: 32px;
          font-weight: 700;

          .welcome-icon {
            font-size: 36px;
            color: #fbbf24;
          }
        }

        .welcome-subtitle {
          margin: 0;
          font-size: 18px;
          opacity: 0.9;
        }
      }

      .welcome-actions {
        .create-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 16px 32px;
          font-size: 16px;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: white;
          border-radius: 16px;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;

          &:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
            transform: translateY(-2px);
          }
        }
      }
    }
  }
}

.stats-overview {
  margin-bottom: 32px;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 24px;

    .stat-card {
      background: white;
      border-radius: 20px;
      padding: 32px;
      display: flex;
      align-items: center;
      gap: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
      }

      .stat-icon {
        width: 72px;
        height: 72px;
        border-radius: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        color: white;

        &.articles {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        &.views {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        &.users {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        &.categories {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }
      }

      .stat-content {
        flex: 1;

        .stat-number {
          font-size: 36px;
          font-weight: 700;
          color: #1e293b;
          line-height: 1;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #64748b;
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .stat-change {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 500;

          &.positive {
            color: #22c55e;
          }

          &.neutral {
            color: #64748b;
          }
        }
      }
    }
  }
}

.quick-actions-section {
  margin-bottom: 32px;

  .actions-card {
    border-radius: 20px;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

    :deep(.el-card__header) {
      padding: 32px 32px 24px;
      border-bottom: 1px solid #f1f5f9;
    }

    :deep(.el-card__body) {
      padding: 24px 32px 32px;
    }

    .card-header {
      h3 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
      }

      p {
        margin: 0;
        color: #64748b;
        font-size: 16px;
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;

      .action-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 24px;
        border-radius: 16px;
        border: 2px solid #f1f5f9;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          border-color: #e2e8f0;
          background: #f8fafc;
          transform: translateY(-2px);
        }

        .action-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: white;

          &.create {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          &.manage {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }

          &.category {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }

          &.users {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }

        .action-content {
          h4 {
            margin: 0 0 4px 0;
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
          }

          p {
            margin: 0;
            color: #64748b;
            font-size: 14px;
          }
        }
      }
    }
  }
}

.recent-activity {
  .activity-card {
    border-radius: 20px;
    border: none;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

    :deep(.el-card__header) {
      padding: 32px 32px 24px;
      border-bottom: 1px solid #f1f5f9;
    }

    :deep(.el-card__body) {
      padding: 24px 32px 32px;
    }

    .card-header {
      h3 {
        margin: 0 0 8px 0;
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
      }

      p {
        margin: 0;
        color: #64748b;
        font-size: 16px;
      }
    }

    .activity-list {
      .activity-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid #f1f5f9;

        &:last-child {
          border-bottom: none;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 18px;
        }

        .activity-content {
          .activity-title {
            font-size: 16px;
            font-weight: 500;
            color: #1e293b;
            margin-bottom: 4px;
          }

          .activity-time {
            font-size: 14px;
            color: #94a3b8;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1024px) {
  .welcome-section .welcome-card .welcome-content {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }

  .stats-overview .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .quick-actions-section .actions-card .actions-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .dashboard-home {
    padding: 16px;
  }

  .welcome-section .welcome-card :deep(.el-card__body) {
    padding: 24px;
  }

  .welcome-section .welcome-card .welcome-content .welcome-text .welcome-title {
    font-size: 24px;
  }

  .stats-overview .stats-grid {
    grid-template-columns: 1fr;
  }

  .quick-actions-section .actions-card .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style> 