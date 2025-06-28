<template>
  <div class="articles-page">
    <ArticleList />
  </div>
</template>

<script setup lang="ts">
import ArticleList from './blog/ArticleList.vue'
</script>

<style scoped>
.articles-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}
</style> 