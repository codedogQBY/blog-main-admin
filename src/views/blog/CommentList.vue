<template>
  <div class="comment-list">
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
          <el-form-item label="搜索">
            <el-input
              v-model="filterForm.search"
              placeholder="搜索评论内容或作者"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <el-card class="list-card" shadow="never">
      <template #header>
        <div class="card-header">
          <h3>评论列表</h3>
        </div>
      </template>

      <el-table v-loading="loading" :data="comments" style="width: 100%">
        <el-table-column prop="author" label="作者" width="150">
          <template #default="{ row }">
            <div class="author-cell">
              <span>{{ row.author || '匿名用户' }}</span>
              <el-tag 
                v-if="row.isAdmin" 
                type="primary" 
                size="small" 
                class="admin-tag"
              >
                站长
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" show-overflow-tooltip />
        <el-table-column prop="targetType" label="内容类型" width="150">
          <template #default="{ row }">
            {{ formatType(row.targetType) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="评论时间" width="180">
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
import { getComments, deleteComment } from '@/api/interactions'
import type { Comment } from '@/api/interactions'

const loading = ref(false)
const comments = ref<Comment[]>([])
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const filterForm = ref({
  targetType: '',
  search: ''
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

const loadComments = async () => {
  try {
    loading.value = true
    const response = await getComments({
      page: currentPage.value,
      limit: pageSize.value,
      targetType: filterForm.value.targetType,
      search: filterForm.value.search
    })
    comments.value = response.data.comments
    total.value = response.data.total
  } catch (error) {
    console.error('获取评论列表失败:', error)
    ElMessage.error('获取评论列表失败')
  } finally {
    loading.value = false
  }
}

const resetFilter = () => {
  filterForm.value = {
    targetType: '',
    search: ''
  }
  currentPage.value = 1
  loadComments()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  loadComments()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  loadComments()
}

const handleDelete = async (row: Comment) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    row.deleting = true
    await deleteComment(row.id)
    ElMessage.success('删除成功')
    loadComments()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除评论失败:', error)
      ElMessage.error('删除评论失败')
    }
  } finally {
    row.deleting = false
  }
}

const handleSearch = () => {
  currentPage.value = 1
  loadComments()
}

onMounted(() => {
  loadComments()
})
</script>

<style scoped lang="scss">
.comment-list {
  padding: 20px;

  .filter-card {
    margin-bottom: 20px;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .author-cell {
    display: flex;
    align-items: center;
    gap: 8px;

    .admin-tag {
      margin-left: 4px;
    }
  }

  .pagination {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}
</style> 