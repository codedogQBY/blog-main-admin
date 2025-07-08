import request from '@/lib/api';

export interface SiteConfig {
  title: string;
  subtitle: string;
  description: string;
  icpNumber: string;
  wechatQrcode: string;
  startTime: string;
  englishTitle: string;
  heroTitle: {
    first: string;
    second: string;
  };
  socialLinks: {
    github?: string;
    email?: string;
  };
  seoDefaults: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const getSystemConfig = async (): Promise<ApiResponse<{data: SiteConfig}>> => {
  const response = await request.get<ApiResponse<SiteConfig>>('/system-config');
  return response;
};

export const updateSystemConfig = async (config: Partial<SiteConfig>): Promise<ApiResponse<{data: SiteConfig}>> => {
  const response = await request.post<ApiResponse<SiteConfig>>('/system-config', config);
  return response;
}; 