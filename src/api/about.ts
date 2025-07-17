import axios from './index'

// 关于页面配置接口
export interface AboutConfig {
  id: string
  heroAvatar?: string
  heroSignature?: string
  introTitle: string
  introContent: string
  introLogo?: string
  status: string
  createdAt: string
  updatedAt: string
  tags?: AboutTag[]
  sections?: AboutSection[]
}

export interface AboutTag {
  id: string
  content: string
  position: string
  sort: number
  aboutId: string
}

export interface AboutSection {
  id: string
  title: string
  content: string[] // 修复：应该是字符串数组
  sort: number
  aboutId: string
  images?: AboutImage[]
  expanded?: boolean
}

export interface AboutImage {
  id: string
  src: string
  alt: string
  caption: string
  sort: number
  sectionId: string
}

// 获取所有关于页面配置
export const getAboutList = () => {
  return axios.get<AboutConfig[]>('/about')
}

// 获取单个关于页面配置
export const getAbout = (id: string) => {
  return axios.get<AboutConfig>(`/about/${id}`)
}

// 创建关于页面配置
export const createAbout = (data: {
  heroAvatar?: string
  heroSignature?: string
  introTitle: string
  introContent: string[]
  introLogo?: string
  status?: string
}) => {
  return axios.post<AboutConfig>('/about', data)
}

// 更新关于页面配置
export const updateAbout = (id: string, data: {
  heroAvatar?: string
  heroSignature?: string
  introTitle: string
  introContent: string[]
  introLogo?: string
  status?: string
}) => {
  return axios.patch<AboutConfig>(`/about/${id}`, data)
}

// 删除关于页面配置
export const deleteAbout = (id: string) => {
  return axios.delete(`/about/${id}`)
}

// 标签管理
export const createAboutTag = (data: {
  content: string
  position: string
  sort?: number
  aboutId: string
}) => {
  return axios.post<AboutTag>('/about/tags', data)
}

export const updateAboutTag = (id: string, data: {
  content: string
  position: string
  sort?: number
}) => {
  return axios.patch<AboutTag>(`/about/tags/${id}`, data)
}

export const deleteAboutTag = (id: string) => {
  return axios.delete(`/about/tags/${id}`)
}

// 批量创建标签
export const batchCreateAboutTags = (aboutId: string, tags: {
  content: string
  position: string
  sort?: number
}[]) => {
  return axios.post(`/about/${aboutId}/tags/batch`, { tags })
}

// 章节管理
export const createAboutSection = (data: {
  title: string
  content: string[]
  sort?: number
  aboutId: string
}) => {
  return axios.post<AboutSection>('/about/sections', data)
}

export const updateAboutSection = (id: string, data: {
  title: string
  content: string[]
  sort?: number
}) => {
  return axios.patch<AboutSection>(`/about/sections/${id}`, data)
}

export const deleteAboutSection = (id: string) => {
  return axios.delete(`/about/sections/${id}`)
}

// 图片管理
export const createAboutImage = (data: {
  src: string
  alt: string
  caption: string
  sort?: number
  sectionId: string
}) => {
  return axios.post<AboutImage>('/about/images', data)
}

export const updateAboutImage = (id: string, data: {
  src: string
  alt: string
  caption: string
  sort?: number
}) => {
  return axios.patch<AboutImage>(`/about/images/${id}`, data)
}

export const deleteAboutImage = (id: string) => {
  return axios.delete(`/about/images/${id}`)
}

// 批量创建图片
export const batchCreateAboutImages = (sectionId: string, images: {
  src: string
  alt: string
  caption: string
  sort?: number
}[]) => {
  return axios.post(`/about/sections/${sectionId}/images/batch`, { images })
} 