import request from '@/lib/api';

export interface UserInfo {
  id: string;
  fingerprint: string;
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  deviceType?: string;
  deviceModel?: string;
  osName?: string;
  osVersion?: string;
  browserName?: string;
  browserVersion?: string;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  languages?: string;
  nickname?: string;
  email?: string;
  totalLikes: number;
  totalComments: number;
  lastActiveAt: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    comments: number;
    likes: number;
  };
}

export interface UserInfoFilters {
  country?: string;
  deviceType?: string;
  browserName?: string;
}

export interface UserInfoStats {
  totalUsers: number;
  activeUsers: number;
  countries: Array<{ country: string; count: number }>;
  devices: Array<{ deviceType: string; count: number }>;
  browsers: Array<{ browserName: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topDevices: Array<{ deviceType: string; count: number }>;
  topBrowsers: Array<{ browserName: string; count: number }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CsvExportResponse {
  content: string;
  filename: string;
}

// 获取游客列表
export const getUserInfoList = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  deviceType?: string;
  browserName?: string;
}): Promise<PaginatedResponse<UserInfo>> => {
  const response = await request.get<PaginatedResponse<UserInfo>>('/user-info', { params });
  return response.data;
};

// 获取游客详情
export const getUserInfo = async (id: string): Promise<UserInfo> => {
  const response = await request.get<UserInfo>(`/user-info/${id}`);
  return response.data;
};

// 更新游客信息
export const updateUserInfo = async (id: string, data: {
  nickname?: string;
  email?: string;
  country?: string;
  region?: string;
  city?: string;
}): Promise<UserInfo> => {
  const response = await request.put<UserInfo>(`/user-info/${id}`, data);
  return response.data;
};

// 删除游客
export const deleteUserInfo = async (id: string): Promise<void> => {
  await request.delete(`/user-info/${id}`);
};

// 批量删除游客
export const batchDeleteUserInfo = async (ids: string[]): Promise<void> => {
  await request.post('/user-info/batch-delete', { ids });
};

// 获取游客统计信息
export const getUserInfoStats = async (): Promise<UserInfoStats> => {
  const response = await request.get<UserInfoStats>('/user-info/stats');
  return response.data;
};

// 导出CSV
export const exportUserInfoCsv = async (params?: {
  search?: string;
  country?: string;
  deviceType?: string;
  browserName?: string;
}): Promise<CsvExportResponse> => {
  const response = await request.get<CsvExportResponse>('/user-info/export/csv', { params });
  return response.data;
}; 