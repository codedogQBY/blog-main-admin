<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElConfigProvider } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import FileSelector from '@/components/FileSelector.vue';
import type { SiteConfig } from '@/api/system-config';
import { getSystemConfig, updateSystemConfig } from '@/api/system-config';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';

const locale = zhCn;

const fileSelectorVisible = ref(false);
const selectedFileId = ref('');

const form = ref<SiteConfig>({
  title: '',
  subtitle: '',
  description: '',
  icpNumber: '',
  wechatQrcode: '',
  startTime: '',
  englishTitle: '',
  heroTitle: {
    first: '',
    second: ''
  },
  socialLinks: {
    github: '',
    email: ''
  },
  seoDefaults: {
    title: '',
    description: '',
    keywords: []
  }
});

// 关键词字符串，用于双向绑定
const keywordsString = ref('');

const handleFileSelect = (file: any) => {
  if (file && file.url) {
    form.value.wechatQrcode = file.url;
  }
};

onMounted(async () => {
  try {
    const response = await getSystemConfig();
    if (response?.data) {
      const config = response.data.data;
      form.value = {
        title: config.title || '',
        subtitle: config.subtitle || '',
        description: config.description || '',
        icpNumber: config.icpNumber || '',
        wechatQrcode: config.wechatQrcode || '',
        startTime: config.startTime || '',
        englishTitle: config.englishTitle || '',
        heroTitle: {
          first: config.heroTitle?.first || '',
          second: config.heroTitle?.second || ''
        },
        socialLinks: {
          github: config.socialLinks?.github || '',
          email: config.socialLinks?.email || ''
        },
        seoDefaults: {
          title: config.seoDefaults?.title || '',
          description: config.seoDefaults?.description || '',
          keywords: config.seoDefaults?.keywords || []
        }
      };
      // 将关键词数组转换为逗号分隔的字符串
      keywordsString.value = form.value.seoDefaults.keywords.join(', ');
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    ElMessage.error('加载配置失败');
  }
});

const handleSubmit = async () => {
  try {
    // 将关键词字符串转换为数组
    form.value.seoDefaults.keywords = keywordsString.value
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);
    
    await updateSystemConfig(form.value);
    ElMessage.success('保存成功');
  } catch (error) {
    console.error('保存失败:', error);
    ElMessage.error('保存失败');
  }
};
</script>

<template>
  <div class="system-config">
    <div class="config-header">
      <h2>系统配置</h2>
      <p>配置网站的基本信息和SEO设置</p>
    </div>

    <el-config-provider :locale="locale">
      <el-form :model="form" label-width="120px" class="config-form">
        <!-- 基本信息 -->
        <div class="form-section">
          <h3>基本信息</h3>
          <div class="form-grid">
            <el-form-item label="站点标题">
              <el-input v-model="form.title" placeholder="请输入站点标题" />
            </el-form-item>
            <el-form-item label="站点英文名">
              <el-input v-model="form.englishTitle" placeholder="请输入站点英文名" />
            </el-form-item>
          </div>
          
          <el-form-item label="首页大标题">
            <div class="hero-title-inputs">
              <el-input v-model="form.heroTitle.first" placeholder="第一个单词" />
              <el-input v-model="form.heroTitle.second" placeholder="第二个单词" />
            </div>
          </el-form-item>
          
          <el-form-item label="站点副标题">
            <el-input v-model="form.subtitle" placeholder="请输入站点副标题" />
          </el-form-item>
          
          <el-form-item label="站点描述">
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="3"
              placeholder="请输入站点描述"
            />
          </el-form-item>
          
          <el-form-item label="ICP备案号">
            <el-input v-model="form.icpNumber" placeholder="请输入ICP备案号" />
          </el-form-item>
        </div>

        <!-- 媒体设置 -->
        <div class="form-section">
          <h3>媒体设置</h3>
          <el-form-item label="微信二维码">
            <div class="qrcode-upload" @click="fileSelectorVisible = true">
              <div v-if="form.wechatQrcode" class="qrcode-preview">
                <img :src="form.wechatQrcode" alt="微信二维码" />
                <div class="qrcode-overlay">
                  <el-icon><Plus /></el-icon>
                  <span>更换图片</span>
                </div>
              </div>
              <div v-else class="qrcode-placeholder">
                <el-icon><Plus /></el-icon>
                <span>上传微信二维码</span>
              </div>
            </div>
            <FileSelector
              v-model:visible="fileSelectorVisible"
              :multiple="false"
              file-type="image"
              @select="handleFileSelect"
            />
          </el-form-item>
          
          <el-form-item label="运营时间">
            <el-date-picker
              v-model="form.startTime"
              type="datetime"
              placeholder="请选择网站开始运营时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              style="width: 100%"
            />
          </el-form-item>
        </div>

        <!-- 社交链接 -->
        <div class="form-section">
          <h3>社交链接</h3>
          <div class="form-grid">
            <el-form-item label="GitHub">
              <el-input v-model="form.socialLinks.github" placeholder="请输入GitHub链接" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="form.socialLinks.email" placeholder="请输入邮箱地址" />
            </el-form-item>
          </div>
        </div>

        <!-- SEO配置 -->
        <div class="form-section">
          <h3>SEO配置</h3>
          <el-form-item label="默认标题">
            <el-input v-model="form.seoDefaults.title" placeholder="请输入默认标题" />
          </el-form-item>
          
          <el-form-item label="默认描述">
            <el-input
              v-model="form.seoDefaults.description"
              type="textarea"
              :rows="3"
              placeholder="请输入默认描述"
            />
          </el-form-item>
          
          <el-form-item label="默认关键词">
            <el-input
              v-model="keywordsString"
              placeholder="请输入关键词，用逗号分隔"
            />
            <div class="form-tip">多个关键词请用逗号分隔，例如：技术博客, 编程, 前端</div>
          </el-form-item>
        </div>

        <!-- 提交按钮 -->
        <div class="form-actions">
          <el-button type="primary" @click="handleSubmit" size="large">
            保存配置
          </el-button>
        </div>
      </el-form>
    </el-config-provider>
  </div>
</template>

<style scoped>
.system-config {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.config-header {
  margin-bottom: 32px;
  text-align: center;
}

.config-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #1f2937;
  font-weight: 600;
}

.config-header p {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.config-form {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f3f4f6;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.form-section h3 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #374151;
  font-weight: 600;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.hero-title-inputs {
  display: flex;
  gap: 12px;
}

.qrcode-upload {
  width: 120px;
  height: 120px;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.qrcode-upload:hover {
  border-color: #3b82f6;
  background-color: #f8fafc;
}

.qrcode-preview {
  width: 100%;
  height: 100%;
  position: relative;
}

.qrcode-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.qrcode-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.qrcode-preview:hover .qrcode-overlay {
  opacity: 1;
}

.qrcode-overlay .el-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.qrcode-overlay span {
  font-size: 12px;
}

.qrcode-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}

.qrcode-placeholder .el-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.qrcode-placeholder span {
  font-size: 14px;
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.form-actions {
  text-align: center;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}

:deep(.el-form-item__label) {
  color: #374151;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

:deep(.el-textarea__inner) {
  border-radius: 6px;
}

:deep(.el-date-editor) {
  width: 100%;
}
</style> 