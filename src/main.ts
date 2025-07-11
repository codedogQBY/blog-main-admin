import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import router from './router/index'
import { useAuthStore } from './lib/store'
import { initWebSee } from './lib/websee-config'
import { setupVueErrorHandler, setupGlobalErrorHandlers } from './lib/websee-examples'
import App from './App.vue'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia)
app.use(router)
app.use(ElementPlus)

// 在应用启动时检查认证状态
const authStore = useAuthStore()

// 等待权限检查完成后再挂载应用
authStore.checkAuth().then(() => {
  // 初始化web-see监控
  initWebSee(authStore.user?.id)
  
  // 设置Vue错误处理器
  setupVueErrorHandler(app)
  
  // 设置全局错误处理器
  setupGlobalErrorHandlers()
  
  app.mount('#app')
})
