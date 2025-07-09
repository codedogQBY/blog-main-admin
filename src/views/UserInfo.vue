<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { UserInfo, UserInfoStats } from '@/api/user-info';
import {
  getUserInfoList,
  deleteUserInfo,
  batchDeleteUserInfo,
  getUserInfoStats,
  exportUserInfoCsv,
} from '@/api/user-info';

// 响应式数据
const userInfoList = ref<UserInfo[]>([]);
const loading = ref(false);
const stats = ref<UserInfoStats | null>(null);
const statsLoading = ref(false);

// 分页和搜索
const currentPage = ref(1);
const pageSize = ref(10);
const total = ref(0);
const searchQuery = ref('');
const filters = ref({
  country: '',
  deviceType: '',
  browserName: '',
});

// 选择状态
const selectedUserIds = ref<string[]>([]);
const selectionLoading = ref(false);

// 获取游客列表
const fetchUserInfoList = async () => {
  loading.value = true;
  try {
    const response = await getUserInfoList({
      page: currentPage.value,
      limit: pageSize.value,
      search: searchQuery.value,
      ...filters.value,
    });
    userInfoList.value = response.data || [];
    total.value = response.pagination?.total || 0;
  } catch (error) {
    console.error('获取游客列表失败:', error);
    ElMessage.error('获取游客列表失败');
    userInfoList.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

// 获取统计数据
const fetchStats = async () => {
  statsLoading.value = true;
  try {
    const response = await getUserInfoStats();
    stats.value = response;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    ElMessage.error('获取统计数据失败');
    stats.value = {
      totalUsers: 0,
      activeUsers: 0,
      countries: [],
      devices: [],
      browsers: [],
      topCountries: [],
      topDevices: [],
      topBrowsers: [],
    };
  } finally {
    statsLoading.value = false;
  }
};

// 删除游客
const handleDelete = async (id: string) => {
  try {
    await ElMessageBox.confirm('确定要删除这个游客吗？', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
    
    await deleteUserInfo(id);
    ElMessage.success('删除成功');
    fetchUserInfoList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error);
      ElMessage.error('删除失败');
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedUserIds.value.length === 0) {
    ElMessage.warning('请选择要删除的游客');
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedUserIds.value.length} 个游客吗？`,
      '确认批量删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    selectionLoading.value = true;
    await batchDeleteUserInfo(selectedUserIds.value);
    ElMessage.success('批量删除成功');
    selectedUserIds.value = [];
    fetchUserInfoList();
  } catch (error) {
    if (error !== 'cancel') {
      console.error('批量删除失败:', error);
      ElMessage.error('批量删除失败');
    }
  } finally {
    selectionLoading.value = false;
  }
};

// 导出CSV
const handleExportCsv = async () => {
  try {
    const response = await exportUserInfoCsv({
      search: searchQuery.value,
      ...filters.value,
    });
    
    // 创建下载链接
    const blob = new Blob([response.content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', response.filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    ElMessage.success('导出成功');
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败');
  }
};

// 搜索和过滤
const handleSearch = () => {
  currentPage.value = 1;
  fetchUserInfoList();
};

const handleFilterChange = () => {
  currentPage.value = 1;
  fetchUserInfoList();
};

// 分页处理
const handlePageChange = (page: number) => {
  currentPage.value = page;
  fetchUserInfoList();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
  fetchUserInfoList();
};

// 选择处理
const handleSelectionChange = (selection: UserInfo[]) => {
  selectedUserIds.value = selection.map(item => item.id);
};

// 格式化时间
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN');
};

// 格式化设备信息
const formatDeviceInfo = (userInfo: UserInfo) => {
  const parts = [];
  if (userInfo.deviceType) parts.push(userInfo.deviceType);
  if (userInfo.osName) parts.push(userInfo.osName);
  if (userInfo.browserName) parts.push(userInfo.browserName);
  return parts.join(' / ') || '未知';
};

// 格式化位置信息
const formatLocation = (userInfo: UserInfo) => {
  const parts = [];
  if (userInfo.country) parts.push(userInfo.country);
  if (userInfo.region) parts.push(userInfo.region);
  if (userInfo.city) parts.push(userInfo.city);
  return parts.join(', ') || '未知';
};

// 计算属性
const hasSelection = computed(() => selectedUserIds.value.length > 0);

// 初始化
onMounted(() => {
  fetchUserInfoList();
  fetchStats();
});
</script>

<template>
  <div class="user-info-page">
    <!-- 统计卡片 -->
    <div class="stats-section" v-loading="statsLoading">
      <el-row :gutter="20" v-if="stats">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats?.totalUsers || 0 }}</div>
              <div class="stats-label">总游客数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats?.activeUsers || 0 }}</div>
              <div class="stats-label">活跃游客</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats?.topCountries?.[0]?.count || 0 }}</div>
              <div class="stats-label">{{ stats?.topCountries?.[0]?.country || '未知' }} 游客</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-number">{{ stats?.topDevices?.[0]?.count || 0 }}</div>
              <div class="stats-label">{{ stats?.topDevices?.[0]?.deviceType || '未知' }} 设备</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 统计详情 -->
    <div class="stats-details" v-if="stats">
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>国家分布 (前5)</span>
              </div>
            </template>
            <div class="detail-list">
              <div 
                v-for="(item, index) in stats.topCountries?.slice(0, 5)" 
                :key="item.country"
                class="detail-item"
              >
                <span class="detail-label">{{ index + 1 }}. {{ item.country }}</span>
                <span class="detail-value">{{ item.count }}人</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>设备分布 (前5)</span>
              </div>
            </template>
            <div class="detail-list">
              <div 
                v-for="(item, index) in stats.topDevices?.slice(0, 5)" 
                :key="item.deviceType"
                class="detail-item"
              >
                <span class="detail-label">{{ index + 1 }}. {{ item.deviceType }}</span>
                <span class="detail-value">{{ item.count }}台</span>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="detail-card">
            <template #header>
              <div class="card-header">
                <span>浏览器分布 (前5)</span>
              </div>
            </template>
            <div class="detail-list">
              <div 
                v-for="(item, index) in stats.topBrowsers?.slice(0, 5)" 
                :key="item.browserName"
                class="detail-item"
              >
                <span class="detail-label">{{ index + 1 }}. {{ item.browserName }}</span>
                <span class="detail-value">{{ item.count }}个</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="搜索昵称、邮箱、IP地址等"
          style="width: 300px"
          clearable
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button @click="handleSearch">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>

      <div class="filter-section">
        <el-select
          v-model="filters.country"
          placeholder="选择国家"
          clearable
          style="width: 150px"
          @change="handleFilterChange"
        >
          <el-option
            v-for="country in stats?.countries || []"
            :key="country.country"
            :label="country.country"
            :value="country.country"
          />
        </el-select>

        <el-select
          v-model="filters.deviceType"
          placeholder="选择设备类型"
          clearable
          style="width: 150px"
          @change="handleFilterChange"
        >
          <el-option
            v-for="device in stats?.devices || []"
            :key="device.deviceType"
            :label="device.deviceType"
            :value="device.deviceType"
          />
        </el-select>

        <el-select
          v-model="filters.browserName"
          placeholder="选择浏览器"
          clearable
          style="width: 150px"
          @change="handleFilterChange"
        >
          <el-option
            v-for="browser in stats?.browsers || []"
            :key="browser.browserName"
            :label="browser.browserName"
            :value="browser.browserName"
          />
        </el-select>
      </div>

      <div class="action-section">
        <el-button
          type="danger"
          :disabled="!hasSelection"
          :loading="selectionLoading"
          @click="handleBatchDelete"
        >
          批量删除
        </el-button>
        <el-button type="primary" @click="handleExportCsv">
          导出CSV
        </el-button>
      </div>
    </div>

    <!-- 游客列表 -->
    <el-card class="user-list-card">
      <el-table
        :data="userInfoList"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        style="width: 100%"
      >
        <el-table-column type="selection" width="55" />
        
        <el-table-column prop="nickname" label="昵称" width="120">
          <template #default="{ row }">
            <span>{{ row.nickname || '匿名用户' }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="fingerprint" label="指纹ID" width="200">
          <template #default="{ row }">
            <el-tooltip :content="row.fingerprint" placement="top">
              <span class="fingerprint-text">{{ row.fingerprint.substring(0, 16) }}...</span>
            </el-tooltip>
          </template>
        </el-table-column>

        <el-table-column prop="ipAddress" label="IP地址" width="120">
          <template #default="{ row }">
            <span>{{ row.ipAddress || '未知' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="位置" width="150">
          <template #default="{ row }">
            <span>{{ formatLocation(row) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="设备信息" width="200">
          <template #default="{ row }">
            <span>{{ formatDeviceInfo(row) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="totalLikes" label="点赞数" width="80" />
        <el-table-column prop="totalComments" label="评论数" width="80" />

        <el-table-column prop="lastActiveAt" label="最后活跃" width="160">
          <template #default="{ row }">
            <span>{{ formatDate(row.lastActiveAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{ row }">
            <span>{{ formatDate(row.createdAt) }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.user-info-page {
  padding: 20px;
}

.stats-section {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-content {
  padding: 10px;
}

.stats-number {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
  word-break: break-all;
  line-height: 1.2;
}

.stats-label {
  font-size: 12px;
  color: #666;
}

.stats-details {
  margin-bottom: 20px;
}

.detail-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-list {
  display: flex;
  flex-direction: column;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.detail-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.detail-value {
  font-size: 14px;
  color: #666;
  font-weight: 400;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-section {
  display: flex;
  align-items: center;
}

.filter-section {
  display: flex;
  gap: 10px;
  align-items: center;
}

.action-section {
  display: flex;
  gap: 10px;
}

.user-list-card {
  margin-bottom: 20px;
}

.fingerprint-text {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}
</style> 