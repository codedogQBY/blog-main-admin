<template>
  <div class="about-config">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">
            <el-icon class="title-icon"><User /></el-icon>
            关于页面配置
          </h1>
          <p class="page-description">配置网站的关于页面内容，包括个人信息、标签和章节内容</p>
        </div>
        <div class="header-actions">
          <el-button 
            type="primary" 
            size="large"
            :loading="saving"
            @click="saveConfig"
          >
            <el-icon class="el-icon--left"><Check /></el-icon>
            保存配置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 配置内容 -->
    <div class="config-container" v-loading="loading">
      <el-tabs 
        v-model="activeTab" 
        class="config-tabs"
        type="card"
      >
        <!-- 基本信息 -->
        <el-tab-pane name="basic">
          <template #label>
            <div class="modern-tab-label">
              <el-icon><InfoFilled /></el-icon>
              <span>基本信息</span>
            </div>
          </template>
          
          <div class="config-section">
            <div class="preview-section">
              <div class="preview-card">
                <div class="preview-header">
                  <el-icon><Monitor /></el-icon>
                  <span>预览效果</span>
                </div>
                <div class="preview-content">
                  <div class="hero-preview">
                    <el-image 
                      :src="config.heroAvatar" 
                      fit="cover"
                      class="hero-avatar"
                    >
                      <template #error>
                        <div class="image-placeholder">
                          <el-icon><Avatar /></el-icon>
                        </div>
                      </template>
                    </el-image>
                    <div class="hero-info">
                      <h3 class="hero-signature">{{ config.heroSignature || '个性签名' }}</h3>
                      <div class="hero-logo">
                        <el-image 
                          :src="config.introLogo" 
                          fit="contain"
                          class="intro-logo"
                        >
                          <template #error>
                            <div class="image-placeholder">
                              <el-icon><Picture /></el-icon>
                            </div>
                          </template>
                        </el-image>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-card class="modern-card">
                    <template #header>
                      <div class="modern-card-header">
                        <el-icon><Avatar /></el-icon>
                        <span>个人展示</span>
                      </div>
                    </template>
                    
                    <el-form :model="config" label-position="top">
                      <el-form-item label="个性签名">
                        <el-input 
                          v-model="config.heroSignature" 
                          placeholder="输入个性签名"
                          size="large"
                        />
                      </el-form-item>
                      
                      <el-form-item label="头像图片">
                        <div class="modern-upload">
                          <div class="upload-preview" v-if="config.heroAvatar">
                            <el-image 
                              :src="config.heroAvatar" 
                              fit="cover"
                              class="preview-image"
                            />
                            <div class="upload-overlay">
                              <el-button type="primary" text @click="showAvatarSelector = true">
                                <el-icon><Edit /></el-icon>
                                更换图片
                              </el-button>
                            </div>
                          </div>
                          <div v-else class="upload-placeholder" @click="showAvatarSelector = true">
                            <el-icon><Plus /></el-icon>
                            <span>上传头像</span>
                          </div>
                          <FileSelector
                            v-model="config.heroAvatar"
                            :visible="showAvatarSelector"
                            @update:visible="val => showAvatarSelector = val"
                            accept="image/*"
                            :limit="1"
                          />
                        </div>
                      </el-form-item>
                    </el-form>
                  </el-card>
                </el-col>

                <el-col :span="12">
                  <el-card class="modern-card">
                    <template #header>
                      <div class="modern-card-header">
                        <el-icon><Document /></el-icon>
                        <span>介绍内容</span>
                      </div>
                    </template>
                    
                    <el-form :model="config" label-position="top">
                      <el-form-item label="介绍标题">
                        <el-input 
                          v-model="config.introTitle" 
                          placeholder="输入介绍标题"
                          size="large"
                        />
                      </el-form-item>
                      
                      <el-form-item label="Logo图片">
                        <div class="modern-upload">
                          <div class="upload-preview" v-if="config.introLogo">
                            <el-image 
                              :src="config.introLogo" 
                              fit="contain"
                              class="preview-logo"
                            />
                            <div class="upload-overlay">
                              <el-button type="primary" text @click="showLogoSelector = true">
                                <el-icon><Edit /></el-icon>
                                更换Logo
                              </el-button>
                            </div>
                          </div>
                          <div v-else class="upload-placeholder" @click="showLogoSelector = true">
                            <el-icon><Plus /></el-icon>
                            <span>上传Logo</span>
                          </div>
                          <FileSelector
                            v-model="config.introLogo"
                            :visible="showLogoSelector"
                            @update:visible="val => showLogoSelector = val"
                            accept="image/*"
                            :limit="1"
                          />
                        </div>
                      </el-form-item>
                    </el-form>
                  </el-card>
                </el-col>
              </el-row>

              <el-card class="modern-card content-card">
                <template #header>
                  <div class="modern-card-header">
                    <el-icon><EditPen /></el-icon>
                    <span>介绍段落</span>
                  </div>
                </template>
                
                <div class="modern-content-editor">
                  <div 
                    v-for="(content, index) in config.introContent"
                    :key="index"
                    class="content-item"
                  >
                    <div class="content-header">
                      <span class="content-badge">段落 {{ index + 1 }}</span>
                      <el-button 
                        type="danger" 
                        text 
                        @click="removeIntroContent(index)"
                        v-if="config.introContent.length > 1"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                    <el-input
                      v-model="config.introContent[index]"
                      type="textarea"
                      :rows="4"
                      placeholder="输入段落内容"
                      class="modern-textarea"
                    />
                  </div>
                  
                  <el-button 
                    type="primary" 
                    plain 
                    @click="addIntroContent"
                    class="modern-add-btn"
                  >
                    <el-icon><Plus /></el-icon>
                    添加段落
                  </el-button>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <!-- 标签管理 -->
        <el-tab-pane name="tags">
          <template #label>
            <div class="modern-tab-label">
              <el-icon><PriceTag /></el-icon>
              <span>个性标签</span>
            </div>
          </template>
          
          <div class="config-section">
            <div class="preview-section">
              <div class="preview-card">
                <div class="preview-header">
                  <el-icon><Monitor /></el-icon>
                  <span>标签预览</span>
                </div>
                <div class="preview-content">
                  <div class="tags-preview">
                    <div class="left-tags">
                      <el-tag
                        v-for="tag in leftTags"
                        :key="tag.id"
                        class="preview-tag"
                        effect="plain"
                      >
                        {{ tag.content }}
                      </el-tag>
                    </div>
                    <div class="avatar-placeholder">
                      <el-icon><Avatar /></el-icon>
                    </div>
                    <div class="right-tags">
                      <el-tag
                        v-for="tag in rightTags"
                        :key="tag.id"
                        class="preview-tag"
                        effect="plain"
                      >
                        {{ tag.content }}
                      </el-tag>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-section">
              <el-row :gutter="24">
                <el-col :span="12">
                  <el-card class="modern-card">
                    <template #header>
                      <div class="modern-card-header">
                        <el-icon><Collection /></el-icon>
                        <span>左侧标签</span>
                        <el-button 
                          type="primary" 
                          text 
                          @click="addTag('left')"
                        >
                          <el-icon><Plus /></el-icon>
                          添加标签
                        </el-button>
                      </div>
                    </template>
                    
                    <div class="modern-tags-list">
                      <div 
                        v-for="(tag, index) in leftTags"
                        :key="tag.id || index"
                        class="modern-tag-item"
                      >
                        <el-input 
                          v-model="tag.content"
                          placeholder="输入标签内容"
                          class="tag-input"
                        >
                          <template #prefix>
                            <el-icon><Collection /></el-icon>
                          </template>
                        </el-input>
                        <el-button 
                          type="danger" 
                          text 
                          @click="removeLeftTag(index)"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                      
                      <div v-if="leftTags.length === 0" class="empty-placeholder">
                        <el-icon><InfoFilled /></el-icon>
                        <span>暂无左侧标签</span>
                        <el-button type="primary" plain @click="addTag('left')">
                          <el-icon><Plus /></el-icon>
                          添加标签
                        </el-button>
                      </div>
                    </div>
                  </el-card>
                </el-col>

                <el-col :span="12">
                  <el-card class="modern-card">
                    <template #header>
                      <div class="modern-card-header">
                        <el-icon><Collection /></el-icon>
                        <span>右侧标签</span>
                        <el-button 
                          type="primary" 
                          text 
                          @click="addTag('right')"
                        >
                          <el-icon><Plus /></el-icon>
                          添加标签
                        </el-button>
                      </div>
                    </template>
                    
                    <div class="modern-tags-list">
                      <div 
                        v-for="(tag, index) in rightTags"
                        :key="tag.id || index"
                        class="modern-tag-item"
                      >
                        <el-input 
                          v-model="tag.content"
                          placeholder="输入标签内容"
                          class="tag-input"
                        >
                          <template #prefix>
                            <el-icon><Collection /></el-icon>
                          </template>
                        </el-input>
                        <el-button 
                          type="danger" 
                          text 
                          @click="removeRightTag(index)"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                      
                      <div v-if="rightTags.length === 0" class="empty-placeholder">
                        <el-icon><InfoFilled /></el-icon>
                        <span>暂无右侧标签</span>
                        <el-button type="primary" plain @click="addTag('right')">
                          <el-icon><Plus /></el-icon>
                          添加标签
                        </el-button>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </div>
          </div>
        </el-tab-pane>

        <!-- 章节管理 -->
        <el-tab-pane name="sections">
          <template #label>
            <div class="modern-tab-label">
              <el-icon><Notebook /></el-icon>
              <span>故事章节</span>
            </div>
          </template>
          
          <div class="config-section">
            <div class="modern-sections">
              <div 
                v-for="(section, index) in sections"
                :key="section.id || index"
                class="section-wrapper"
              >
                <el-card class="modern-card section-card">
                  <template #header>
                    <div class="modern-card-header">
                      <div class="section-title">
                        <el-icon><Reading /></el-icon>
                        <span>章节 {{ index + 1 }}</span>
                      </div>
                      <div class="section-actions">
                        <el-button 
                          type="primary" 
                          text 
                          @click="toggleSectionExpand(index)"
                        >
                          <el-icon>
                            <ArrowDown v-if="!section.expanded" />
                            <ArrowUp v-else />
                          </el-icon>
                          {{ section.expanded ? '收起' : '展开' }}
                        </el-button>
                        <el-button 
                          type="danger" 
                          text 
                          @click="removeSection(index)"
                        >
                          <el-icon><Delete /></el-icon>
                          删除
                        </el-button>
                      </div>
                    </div>
                  </template>
                  
                  <div v-show="section.expanded !== false" class="section-content">
                    <el-form :model="section" label-position="top" class="section-form">
                      <el-form-item label="章节标题" class="form-item-full">
                        <el-input 
                          v-model="section.title"
                          placeholder="输入章节标题"
                          size="large"
                        >
                          <template #prefix>
                            <el-icon><EditPen /></el-icon>
                          </template>
                        </el-input>
                      </el-form-item>
                      
                      <el-form-item label="章节内容" class="form-item-full">
                        <div class="modern-content-editor">
                          <div 
                            v-for="(content, contentIndex) in section.content"
                            :key="contentIndex"
                            class="content-item"
                          >
                            <div class="content-header">
                              <span class="content-badge">段落 {{ contentIndex + 1 }}</span>
                              <el-button 
                                type="danger" 
                                text 
                                @click="removeSectionContent(index, contentIndex)"
                                v-if="section.content.length > 1"
                              >
                                <el-icon><Delete /></el-icon>
                              </el-button>
                            </div>
                            <el-input
                              v-model="section.content[contentIndex]"
                              type="textarea"
                              :rows="8"
                              placeholder="输入段落内容"
                              class="modern-textarea"
                            />
                          </div>
                          
                          <el-button 
                            type="primary" 
                            plain 
                            @click="addSectionContent(index)"
                            class="modern-add-btn"
                          >
                            <el-icon><Plus /></el-icon>
                            添加段落
                          </el-button>
                        </div>
                      </el-form-item>
                      
                      <el-form-item label="章节图片">
                        <div class="modern-images">
                          <div class="images-grid" v-if="section.images && section.images.length > 0">
                            <div 
                              v-for="(image, imgIndex) in section.images"
                              :key="image.id || imgIndex"
                              class="modern-image-card"
                            >
                              <div class="image-preview">
                                <el-image 
                                  :src="image.src" 
                                  fit="cover"
                                  class="preview-img"
                                />
                                <div class="image-overlay">
                                  <el-button 
                                    type="danger" 
                                    circle 
                                    @click="removeImage(index, imgIndex)"
                                  >
                                    <el-icon><Delete /></el-icon>
                                  </el-button>
                                </div>
                              </div>
                              <div class="image-form">
                                <el-input 
                                  v-model="image.alt"
                                  placeholder="Alt文本"
                                  size="default"
                                >
                                  <template #prefix>
                                    <el-icon><InfoFilled /></el-icon>
                                  </template>
                                </el-input>
                                <el-input 
                                  v-model="image.caption"
                                  placeholder="图片说明"
                                  size="default"
                                >
                                  <template #prefix>
                                    <el-icon><ChatLineRound /></el-icon>
                                  </template>
                                </el-input>
                              </div>
                            </div>
                          </div>
                          
                          <div class="modern-upload-area">
                            <el-button 
                              type="primary" 
                              plain 
                              @click="openImageSelector(index)"
                              class="modern-add-btn"
                            >
                              <el-icon><Plus /></el-icon>
                              添加章节图片
                            </el-button>
                            
                            <FileSelector
                              v-model="tempImageUrls"
                              :visible="showImageSelector[index] || false"
                              @update:visible="val => showImageSelector[index] = val"
                              @update:model-value="urls => addImages(index, urls)"
                              accept="image/*"
                              :limit="10"
                              multiple
                            />
                          </div>
                        </div>
                      </el-form-item>
                    </el-form>
                  </div>
                </el-card>
              </div>
              
              <el-button 
                type="primary" 
                plain 
                @click="addSection"
                class="modern-add-section-btn"
                size="large"
              >
                <el-icon><Plus /></el-icon>
                添加新章节
              </el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 保存提示 -->
    <div class="save-tip" v-if="hasChanges">
      <el-alert
        title="有未保存的修改"
        type="warning"
        :closable="false"
        show-icon
      >
        <template #default>
          <span>请及时保存您的修改，避免数据丢失</span>
          <el-button 
            type="primary" 
            size="small" 
            @click="saveConfig"
            style="margin-left: 12px"
          >
            立即保存
          </el-button>
        </template>
      </el-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  User,
  Check,
  InfoFilled,
  Avatar,
  Document,
  EditPen,
  Plus,
  Delete,
  ArrowDown,
  ArrowUp,
  Picture,
  Monitor,
  Edit,
  Collection,
  ChatLineRound,
  Reading,
  PriceTag,
  Notebook
} from '@element-plus/icons-vue'
import FileSelector from '../components/FileSelector.vue'
import {
  getAboutList,
  createAbout,
  updateAbout,
  createAboutTag,
  updateAboutTag,
  deleteAboutTag,
  createAboutSection,
  updateAboutSection,
  deleteAboutSection,
  createAboutImage,
  updateAboutImage,
  deleteAboutImage,
  batchCreateAboutTags,
  batchCreateAboutImages,
  type AboutConfig,
  type AboutTag,
  type AboutSection,
  type AboutImage
} from '../api/about'

const loading = ref(false)
const saving = ref(false)
const activeTab = ref('basic')
const aboutId = ref('')
const originalData = ref('')
const hasChanges = computed(() => {
  return JSON.stringify(getCurrentData()) !== originalData.value
})

const config = ref({
  heroAvatar: '',
  heroSignature: '',
  introTitle: '',
  introContent: [''],
  introLogo: '',
  status: 'active'
})

const leftTags = ref([])
const rightTags = ref([])
const sections = ref([])

const showAvatarSelector = ref(false)
const showLogoSelector = ref(false)
const tempImageUrls = ref([])

// 获取当前数据的序列化版本
const getCurrentData = () => {
  return {
    config: config.value,
    leftTags: leftTags.value,
    rightTags: rightTags.value,
    sections: sections.value
  }
}

// 初始化数据
const initData = () => {
  config.value = {
    heroAvatar: '',
    heroSignature: '',
    introTitle: '',
    introContent: [''],
    introLogo: '',
    status: 'active'
  }
  leftTags.value = []
  rightTags.value = []
  sections.value = []
}

// 加载配置
const loadConfig = async () => {
  loading.value = true
  try {
    const { data } = await getAboutList()
    
    if (data.length > 0) {
      const aboutData = data[0]
      aboutId.value = aboutData.id
      
      config.value = {
        heroAvatar: aboutData.heroAvatar || '',
        heroSignature: aboutData.heroSignature || '',
        introTitle: aboutData.introTitle,
        introContent: JSON.parse(aboutData.introContent),
        introLogo: aboutData.introLogo || '',
        status: aboutData.status
      }
      
      // 处理标签
      leftTags.value = aboutData.tags?.filter(tag => tag.position === 'left').map(tag => ({
        id: tag.id,
        content: tag.content,
        position: tag.position,
        sort: tag.sort
      })) || []
      
      rightTags.value = aboutData.tags?.filter(tag => tag.position === 'right').map(tag => ({
        id: tag.id,
        content: tag.content,
        position: tag.position,
        sort: tag.sort
      })) || []
      
      // 处理章节
      sections.value = aboutData.sections?.map(section => ({
        id: section.id,
        title: section.title,
        content: JSON.parse(section.content),
        sort: section.sort,
        expanded: false,
        images: section.images?.map(img => ({
          id: img.id,
          src: img.src,
          alt: img.alt,
          caption: img.caption,
          sort: img.sort
        })) || []
      })) || []
      
      // 记录原始数据
      originalData.value = JSON.stringify(getCurrentData())
    } else {
      initData()
    }
  } catch (error) {
    console.error('加载配置失败:', error)
    ElMessage.error('加载配置失败')
    initData()
  } finally {
    loading.value = false
  }
}

// 保存配置
const saveConfig = async () => {
  saving.value = true
  try {
    // 验证必填字段
    if (!config.value.introTitle.trim()) {
      ElMessage.error('请填写介绍标题')
      activeTab.value = 'basic'
      return
    }
    
    const validContent = config.value.introContent.filter(c => c.trim())
    if (validContent.length === 0) {
      ElMessage.error('请至少填写一段介绍内容')
      activeTab.value = 'basic'
      return
    }
    
    // 保存基本配置
    const aboutData = {
      ...config.value,
      heroAvatar: typeof config.value.heroAvatar === 'string' ? config.value.heroAvatar : '',
      introLogo: typeof config.value.introLogo === 'string' ? config.value.introLogo : '',
      introContent: validContent
    }
    
    let currentAboutId = aboutId.value
    if (currentAboutId) {
      await updateAbout(currentAboutId, aboutData)
    } else {
      const result = await createAbout(aboutData)
      currentAboutId = result.data.id
      aboutId.value = currentAboutId
    }
    
    // 保存标签
    await saveTags(currentAboutId)
    
    // 保存章节
    await saveSections(currentAboutId)
    
    // 重新加载最新数据
    await loadConfig()
    
    ElMessage.success('保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// 保存标签
const saveTags = async (aboutId: string) => {
  try {
    // 先删除所有现有标签
    const { data: currentAbout } = await getAboutList()
    const existingTags = currentAbout[0]?.tags || []
    
    for (const tag of existingTags) {
      try {
        await deleteAboutTag(tag.id)
      } catch (error) {
        console.warn(`标签 ${tag.id} 删除失败，跳过`, error)
      }
    }
    
    // 只创建当前存在的标签（不包括已删除的）
    const currentLeftTags = leftTags.value
      .filter(tag => tag.content && tag.content.trim()) // 过滤掉空标签
      .map((tag, index) => ({
        content: tag.content.trim(),
        position: 'left',
        sort: index,
        aboutId
      }))

    const currentRightTags = rightTags.value
      .filter(tag => tag.content && tag.content.trim()) // 过滤掉空标签
      .map((tag, index) => ({
        content: tag.content.trim(),
        position: 'right',
        sort: index,
        aboutId
      }))

    const allTags = [...currentLeftTags, ...currentRightTags]
    
    // 使用批量创建来提高效率
    if (allTags.length > 0) {
      await batchCreateAboutTags(aboutId, allTags)
    }
  } catch (error) {
    console.error('保存标签失败:', error)
    throw error
  }
}

// 保存章节
const saveSections = async (aboutId: string) => {
  try {
    // 获取当前数据库中的章节
    const { data: currentAbout } = await getAboutList()
    const existingSections = currentAbout[0]?.sections || []
    
    // 删除所有现有章节
    for (const section of existingSections) {
      try {
        if (section.id) {
          await deleteAboutSection(section.id)
        }
      } catch (error) {
        console.warn(`章节 ${section.id} 不存在或删除失败，跳过`, error)
        continue
      }
    }
    
    // 创建新章节（只保存有效章节）
    const validSections = sections.value.filter(section => 
      section.title.trim() && section.content.some(c => c.trim())
    )
    
    for (let i = 0; i < validSections.length; i++) {
      try {
        const section = validSections[i]
        const validContent = section.content.filter(c => c.trim())
        
        const newSection = await createAboutSection({
          title: section.title,
          content: validContent,
          sort: i,
          aboutId
        })
        
        // 保存章节图片
        if (section.images && section.images.length > 0) {
          const validImages = section.images
            .filter(image => image.src)
            .map((image, index) => ({
              src: image.src,
              alt: image.alt || '',
              caption: image.caption || '',
              sort: index
            }))
            
          if (validImages.length > 0) {
            await batchCreateAboutImages(newSection.data.id, validImages)
          }
        }
      } catch (error) {
        console.error(`保存章节 "${validSections[i].title}" 失败:`, error)
        throw error
      }
    }
  } catch (error) {
    console.error('保存章节失败:', error)
    throw error
  }
}

// 介绍内容管理
const addIntroContent = () => {
  config.value.introContent.push('')
}

const removeIntroContent = (index: number) => {
  config.value.introContent.splice(index, 1)
}

// 标签管理
const addTag = (position: string) => {
  const newTag = {
    content: '',
    position,
    sort: 0
  }
  
  if (position === 'left') {
    leftTags.value.push(newTag)
  } else {
    rightTags.value.push(newTag)
  }
}

const removeLeftTag = (index: number) => {
  leftTags.value.splice(index, 1)
  ElMessage.success('标签已删除')
}

const removeRightTag = (index: number) => {
  rightTags.value.splice(index, 1)
  ElMessage.success('标签已删除')
}

// 章节管理
const addSection = () => {
  sections.value.push({
    title: '',
    content: [''],
    sort: sections.value.length,
    expanded: true,
    images: []
  })
}

const removeSection = async (index: number) => {
  try {
    await ElMessageBox.confirm('确定要删除这个章节吗？', '确认删除', {
      type: 'warning'
    })
    sections.value.splice(index, 1)
  } catch {
    // 用户取消
  }
}

const toggleSectionExpand = (index: number) => {
  sections.value[index].expanded = !sections.value[index].expanded
}

const addSectionContent = (sectionIndex: number) => {
  sections.value[sectionIndex].content.push('')
}

const removeSectionContent = (sectionIndex: number, contentIndex: number) => {
  sections.value[sectionIndex].content.splice(contentIndex, 1)
}

// 图片管理
const showImageSelector = ref({})

const addImages = (sectionIndex: number, urls: string[]) => {
  const imageUrls = urls.filter(url => typeof url === 'string')
  if (imageUrls.length > 0) {
    if (!sections.value[sectionIndex].images) {
      sections.value[sectionIndex].images = []
    }
    sections.value[sectionIndex].images.push(...imageUrls.map(url => ({
      src: url,
      alt: '',
      caption: '',
      sort: sections.value[sectionIndex].images.length
    })))
    // 关闭图片选择器
    showImageSelector.value[sectionIndex] = false
  }
}

const removeImage = (sectionIndex: number, imageIndex: number) => {
  sections.value[sectionIndex].images.splice(imageIndex, 1)
}

const openImageSelector = (sectionIndex: number) => {
  showImageSelector.value[sectionIndex] = true
}

// 页面离开提醒
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (hasChanges.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  loadConfig()
  window.addEventListener('beforeunload', beforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnload)
})
</script>

<style scoped>
.about-config {
  padding: 24px;
  min-height: 100vh;
  background-color: var(--el-bg-color-page);
}

.page-header {
  margin-bottom: 24px;
  padding: 24px;
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-lighter);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  flex: 1;
}

.page-title {
  display: flex;
  align-items: center;
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.title-icon {
  margin-right: 12px;
  font-size: 28px;
}

.page-description {
  margin: 8px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.config-container {
  margin-bottom: 24px;
}

.config-tabs :deep(.el-tabs__header) {
  margin-bottom: 24px;
}

.modern-tab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.config-section {
  width: 100%;
  max-width: 100%;
  overflow: visible;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-card {
  background: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-lighter);
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 600;
}

.preview-content {
  padding: 24px;
  min-height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hero-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.hero-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
}

.hero-info {
  text-align: center;
}

.hero-signature {
  margin: 0 0 12px;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.intro-logo {
  max-width: 200px;
  max-height: 60px;
}

.tags-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  padding: 40px 24px;
  min-height: 300px;
  background: linear-gradient(to bottom, var(--el-fill-color-lighter) 0%, var(--el-bg-color) 100%);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.left-tags, .right-tags {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}

.left-tags {
  align-items: flex-end;
}

.right-tags {
  align-items: flex-start;
}

.left-tags::before, .right-tags::before {
  content: '';
  position: absolute;
  width: 2px;
  height: 100%;
  background: var(--el-border-color);
  top: 0;
}

.left-tags::before {
  right: -24px;
  transform: rotate(-15deg);
}

.right-tags::before {
  left: -24px;
  transform: rotate(15deg);
}

.preview-tag {
  margin: 0;
  padding: 8px 16px;
  font-size: 14px;
  border-radius: 16px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  border: none;
  position: relative;
  transition: all 0.3s ease;
}

.left-tags .preview-tag::after,
.right-tags .preview-tag::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 2px;
  background: var(--el-border-color);
  top: 50%;
}

.left-tags .preview-tag::after {
  right: -24px;
}

.right-tags .preview-tag::after {
  left: -24px;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--el-fill-color);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 48px;
  color: var(--el-text-color-secondary);
  box-shadow: 0 4px 12px var(--el-box-shadow-lighter);
  position: relative;
  z-index: 1;
}

.modern-content-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-item {
  width: 100%;
  background: var(--el-fill-color-blank);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px var(--el-box-shadow-lighter);
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  width: 100%;
}

.content-badge {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 500;
}

.modern-textarea {
  width: 100%;
}

.modern-textarea :deep(.el-textarea__inner) {
  width: 100%;
  min-height: 180px !important;
  padding: 16px;
  border-radius: 8px;
  resize: vertical;
  font-family: var(--el-font-family);
  line-height: 1.8;
  font-size: 14px;
}

.modern-tag-item {
  display: flex;
  gap: 12px;
  align-items: center;
  background: var(--el-fill-color-blank);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--el-box-shadow-lighter);
  transition: all 0.3s ease;
}

.modern-tag-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px var(--el-box-shadow);
}

.modern-tag-item .el-input {
  flex: 1;
}

.modern-tag-item .el-input :deep(.el-input__wrapper) {
  box-shadow: none;
  background: var(--el-fill-color-lighter);
}

.modern-tag-item .el-button {
  margin-left: auto;
}

.empty-placeholder {
  text-align: center;
  padding: 32px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-blank);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.empty-placeholder .el-icon {
  font-size: 32px;
  color: var(--el-text-color-placeholder);
}

.section-wrapper {
  margin-bottom: 24px;
}

.section-card {
  width: 100%;
  overflow: visible;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-actions {
  display: flex;
  gap: 8px;
}

.section-content {
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

.modern-images {
  width: 100%;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.modern-image-card {
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.modern-image-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-preview {
  position: relative;
  aspect-ratio: 16/9;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.image-form {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.modern-upload-area {
  padding: 1rem;
  border: 2px dashed var(--el-border-color);
  border-radius: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
}

.modern-upload-area:hover {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.modern-add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modern-add-section-btn {
  width: 100%;
  height: 60px;
  border-style: dashed;
}

.save-tip {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
}

.section-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-item-full {
  width: 100%;
  margin-bottom: 0;
}

.form-item-full :deep(.el-form-item__content) {
  width: 100%;
}

.modern-content-editor {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-item {
  width: 100%;
  background: var(--el-fill-color-blank);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px var(--el-box-shadow-lighter);
}

.modern-textarea {
  width: 100%;
}

.modern-textarea :deep(.el-textarea__inner) {
  width: 100%;
  min-height: 180px !important;
  padding: 16px;
  border-radius: 8px;
  resize: vertical;
  font-family: var(--el-font-family);
  line-height: 1.8;
  font-size: 14px;
}

.section-content {
  padding: 24px;
  width: 100%;
  box-sizing: border-box;
}

.section-card {
  width: 100%;
  overflow: visible;
}

.modern-card {
  width: 100%;
  overflow: visible;
}
</style> 