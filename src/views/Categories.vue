<template>
  <div class="categories-page">
    <CategoryList />
  </div>
</template>

<script setup lang="ts">
import CategoryList from './blog/CategoryList.vue'
</script>

<style scoped>
.categories-page {
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}
</style> 