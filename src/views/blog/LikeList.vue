<template>
  <div class="like-list">
    <el-card class="filter-card" shadow="never">
      <div class="filter-form">
        <el-form :inline="true" :model="filterForm">
          <el-form-item label="内容类型">
            <el-select v-model="filterForm.targetType" placeholder="全部" style="width: 200px">
              <el-option label="全部" value="" />
              <el-option label="文章" value="article" />
              <el-option label="图片" value="gallery_image" />
              <el-option label="便签" value="sticky_note" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadLikes">搜索</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>点赞列表</h3>
        </div>
      </template>

      <el-table v-loading="loading" :data="likes" style="width: 100%">
        <el-table-column prop="userInfo.nickname" label="用户" width="120">
          <template #default="{ row }">
            {{ row.userInfo?.nickname || '匿名用户' }}
          </template>
        </el-table-column>
        <el-table-column prop="targetType" label="内容类型" width="150">
          <template #default="{ row }">
            {{ formatType(row.targetType) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="点赞时间" width="180">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="danger" 
              link
              :loading="row.deleting"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import { getLikes, deleteLike } from '@/api/interactions'
import type { Like } from '@/api/interactions'

const loading = ref(false)
const likes = ref<Like[]>([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)

const filterForm = ref({
  targetType: ''
})

const formatType = (type: string) => {
  const typeMap: Record<string, string> = {
    article: '文章',
    gallery_image: '图片',
    sticky_note: '便签'
  }
  return typeMap[type] || type
}

const formatTime = (time: string) => {
  return dayjs(time).format('YYYY-MM-DD HH:mm:ss')
}

const loadLikes = async () => {
  try {
    loading.value = true
    const response = await getLikes({
      page: currentPage.value,
      limit: pageSize.value,
      targetType: filterForm.value.targetType
    })
    likes.value = response.data.likes
    total.value = response.data.total
  } catch (error) {
    console.error('获取点赞列表失败:', error)
    ElMessage.error('获取点赞列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.value = {
    targetType: ''
  }
  currentPage.value = 1
  loadLikes()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadLikes()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadLikes()
}

const handleDelete = async (row: Like) => {
  try {
    await ElMessageBox.confirm('确定要删除这个点赞记录吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    row.deleting = true
    await deleteLike(row.id)
    ElMessage.success('删除成功')
    loadLikes()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除点赞失败:', error)
      ElMessage.error('删除点赞失败')
    }
  } finally {
    row.deleting = false
  }
}

onMounted(() => {
  loadLikes()
})
</script>

<style scoped lang="scss">
.like-list {
  padding: 20px;

  .filter-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style> 