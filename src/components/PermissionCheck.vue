<template>
  <div v-if="hasPermission">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '../lib/store'

interface Props {
  permission?: string
  permissions?: string[]
  requireAll?: boolean
  allowSuperAdmin?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  requireAll: false,
  allowSuperAdmin: true
})

const authStore = useAuthStore()

const hasPermission = computed(() => {
  // 如果权限未加载完成且不是超级管理员，不显示内容
  if (authStore.permissions.length === 0 && !authStore.user?.isSuperAdmin) {
    return false
  }

  // 如果允许超级管理员且用户是超级管理员
  if (props.allowSuperAdmin && authStore.user?.isSuperAdmin) {
    return true
  }
  
  // 获取用户权限列表
  const userPermissions = authStore.userPermissions
  
  // 检查单个权限
  if (props.permission) {
    return userPermissions.includes(props.permission)
  }
  
  // 检查多个权限
  if (props.permissions && props.permissions.length > 0) {
    if (props.requireAll) {
      // 需要所有权限
      return props.permissions.every(permission => userPermissions.includes(permission))
    } else {
      // 只需要其中一个权限
      return props.permissions.some(permission => userPermissions.includes(permission))
    }
  }
  
  return false
})
</script>

<script lang="ts">
export default {
  name: 'PermissionCheck'
}
</script> 