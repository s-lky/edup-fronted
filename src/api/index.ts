import { API_BASE_URL, API_V1_BASE_URL } from './config';

// 类型定义
interface ApiResponse<T> {
    code: number;
    message: string;
    data: T;
}

interface CourseVO {
    id: string;
    title: string;
    description: string;
    instructor: string;
    price: number;
    thumbnail: string;
    category: string;
    studentsCount: number;
    rating: number;
    videoCount: number;
    videos?: Array<{
        id: string;
        title: string;
        url: string;
        duration: string;
        thumbnail: string;
        order: number;
    }>;
}

interface CourseListResponse {
    total: number;
    page: number;
    pageSize: number;
    list: CourseVO[];
}

interface UserInfo {
    id: string;
    nickname: string;
    displayName?: string;
    avatarUrl: string;
    email?: string;
    role: string;
}

interface LoginResponse {
    userId: string;
    token: string;
    refreshToken?: string;
    nickname: string;
    avatarUrl: string;
    role: string;
    email?: string;
}

interface RefreshTokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

interface RegisterResponse {
    userId: string;
    token: string;
    avatarUrl: string;
}

interface OrderListResponse {
    total: number;
    page: number;
    pageSize: number;
    items: Array<{
        id: string;
        courseId: string;
        courseTitle?: string;
        amount: number;
        status: 'paid' | 'pending';
        createdAt: string;
    }>;
}

interface LearningStats {
    totalMinutes: number;
    completedVideos: number;
    learningDays?: number;
    currentStreak?: number;
}

interface PurchasedCourse {
    id: string;
    title: string;
    thumbnail: string;
    category: string;
    videoCount?: number;
    videos?: Array<{ id: string; title: string }>;
    purchasedAt?: string;
}

interface AIChatResponse {
    reply: string;
    sessionId?: string;
    suggestions?: string[];
}

async function parseApiResponse<T>(response: Response): Promise<T> {
    const result: ApiResponse<T> = await response.json().catch(() => ({
        code: response.status,
        message: '请求失败',
        data: null as unknown as T,
    }));

    if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
    }
    if (result.code !== 200) {
        throw new Error(result.message || '请求失败');
    }
    if (result.data === null || result.data === undefined) {
        throw new Error(result.message || '返回数据为空');
    }
    return result.data;
}

// 通用请求封装（/api/*）
async function request<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });

    return parseApiResponse<T>(response);
}

async function parseApiResponseVoid(response: Response): Promise<void> {
    const result: ApiResponse<unknown> = await response.json().catch(() => ({
        code: response.status,
        message: '请求失败',
        data: null,
    }));

    if (!response.ok) {
        throw new Error(result.message || `HTTP ${response.status}`);
    }
    if (result.code !== 200) {
        throw new Error(result.message || '请求失败');
    }
}

// /api/v1/* 请求
async function requestV1<T>(
    endpoint: string,
    options: RequestInit = {},
): Promise<T> {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_V1_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });

    return parseApiResponse<T>(response);
}

async function requestV1Void(
    endpoint: string,
    options: RequestInit = {},
): Promise<void> {
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_V1_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });

    return parseApiResponseVoid(response);
}

// 认证模块
export const authAPI = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        
        const result: ApiResponse<LoginResponse> = await response.json().catch(() => ({
            code: response.status,
            message: '登录失败',
            data: null as unknown as LoginResponse,
        }));

        if (!response.ok || result.code !== 200 || !result.data) {
            throw new Error(result.message || '登录失败');
        }

        return result.data;
    },

    register: async (data: { username: string; password: string; email: string; nickname: string }): Promise<RegisterResponse> => {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        
        const result: ApiResponse<RegisterResponse> = await response.json().catch(() => ({
            code: response.status,
            message: '注册失败',
            data: null as unknown as RegisterResponse,
        }));

        if (!response.ok || result.code !== 200 || !result.data) {
            throw new Error(result.message || '注册失败');
        }

        return result.data;
    },
        
    refreshToken: (refreshToken: string) =>
        requestV1<RefreshTokenResponse>('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        }),

    getCurrentUser: () => request<UserInfo>('/auth/me'),

    forgotPassword: async (data: {
        username: string;
        email: string;
        newPassword: string;
    }): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result: ApiResponse<null> = await response.json().catch(() => ({
            code: response.status,
            message: '密码重置失败',
            data: null,
        }));

        if (!response.ok || result.code !== 200) {
            throw new Error(result.message || '密码重置失败');
        }
    },
};

// 用户资料模块
export const userAPI = {
    updateProfile: (data: { nickname?: string; avatarUrl?: string }) =>
        requestV1('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),

    changePassword: (data: { currentPassword: string; newPassword: string }) =>
        requestV1Void('/users/me/password', {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
};

export interface CreateCoursePayload {
    title: string;
    description?: string;
    category: string;
    price: number;
    thumbnail?: string;
    publish?: boolean;
    videos?: Array<{
        title: string;
        url: string;
        duration: string;
        thumbnail?: string;
    }>;
}

export interface DraftCourseItem {
    id: string;
    title: string;
    category: string;
    thumbnail?: string;
    videoCount: number;
    updatedAt: string;
}

export interface DraftCoursePage {
    total: number;
    page: number;
    pageSize: number;
    list: DraftCourseItem[];
}

export interface ManageCourseDetail {
    id: string;
    title: string;
    description?: string;
    category: string;
    price: number;
    thumbnail?: string;
    status?: string;
    videos?: Array<{
        id: string;
        title: string;
        url: string;
        duration: string;
        thumbnail?: string;
    }>;
}

export interface CreateCourseResult {
    courseId: string;
}

export interface UploadVideoResult {
    url: string;
    filename: string;
}

export interface UploadAvatarResult {
    url: string;
    filename: string;
}

// 课程模块
export const courseAPI = {
    getList: (params?: { page?: number; pageSize?:number; category?: string; keyword?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return request<CourseListResponse>(`/courses${query ? `?${query}` : ''}`);
    },

    getDetail: (courseId: string) => request<CourseVO>(`/courses/${courseId}`),

    create: (data: CreateCoursePayload) =>
        request<CreateCourseResult>('/courses', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (courseId: string, data: CreateCoursePayload) =>
        request<void>(`/courses/${courseId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    publish: (courseId: string, data: CreateCoursePayload) =>
        request<void>(`/courses/${courseId}/publish`, {
            method: 'POST',
            body: JSON.stringify({ ...data, publish: true }),
        }),

    listDrafts: (page = 1, pageSize = 20) =>
        request<DraftCoursePage>(`/courses/drafts?page=${page}&pageSize=${pageSize}`),

    getForManage: (courseId: string) =>
        request<ManageCourseDetail>(`/courses/${courseId}/manage`),
};

// 文件上传
export const uploadAPI = {
    uploadVideo: async (file: File): Promise<UploadVideoResult> => {
        const token = localStorage.getItem('accessToken');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/uploads/video`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        });

        return parseApiResponse<UploadVideoResult>(response);
    },

    uploadAvatar: async (file: File): Promise<UploadAvatarResult> => {
        const token = localStorage.getItem('accessToken');
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/uploads/avatar`, {
            method: 'POST',
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
            body: formData,
        });

        return parseApiResponse<UploadAvatarResult>(response);
    },
};

// 视频进度模块
export const progressAPI = {
    updateProgress: (
        videoId: string,
        data: {
            watchedSeconds: number;
            lastPositionSec: number;
            duration: number;
            completed: boolean;
        }
    ) =>
        request(`/progress/videos/${videoId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    getStats: () => request<LearningStats>('/learning/stats')
};

// 弹幕模块
export const danmakuAPI = {
    send:(
        videoId: string,
        data: { text: string; color?: string; videoTimeSec: number }
    ) =>
        request(`/videos/${videoId}/danmaku`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getList: (
        videoId: string,
        params?: { fromSec?: number; toSec?:number; limit?: number }
    ) =>{
        const query = new URLSearchParams(params as any).toString();
        return request(`/videos/${videoId}/danmaku${query ? `?${query}` : ''}`);
    },
};

// AI助手模块
export const aiAPI = {
    chat: (data: {
        courseId?: string;
        videoId?: string;
        courseTitle: string;
        context?: string;
        messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }) =>
    request<AIChatResponse>('/ai/tutor/chat', {
        method: 'POST',
        body: JSON.stringify(data),
    }),

    getSuggestions: (courseId?: string, videoId?: string) => {
        const query = new URLSearchParams();
        if (courseId) query.append('courseId', courseId);
        if (videoId) query.append('videoId', videoId);
        return request<string[]>(`/ai/suggestions${query.toString() ? `?${query.toString()}` : ''}`);
    },
};

// 订单模块
export const orderAPI = {
    create: (courseId: string, amount: number) =>
        request('/orders', {
        method: 'POST',
        body: JSON.stringify({ courseId, amount }),
    }),

    getList: (params?: { page?: number; pageSize?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return requestV1<OrderListResponse>(`/users/me/orders${query ? `?${query}` : ''}`);
    },

    pay: (orderId: string) =>
        request(`/orders/${orderId}/pay`, {
        method: 'POST',
    }),

    getPurchasedCourses: () => request<PurchasedCourse[]>('/user/purchased-courses'),
};

// 管理看板（管理员 / 讲师）
export interface AdminStats {
    totalUsers: number;
    totalCourses: number;
    monthlyRevenue: number;
    aiInteractionRate: number;
    userGrowth: number;
    revenueGrowth: number;
}

export interface AdminCourseItem {
    id: string;
    title: string;
    category: string;
    status: string;
    revenue: number;
    studentsCount: number;
    createdAt: string;
}

export interface AdminCoursePage {
    total: number;
    page: number;
    pageSize: number;
    list: AdminCourseItem[];
}

export interface LearningTrend {
    aiQuestions: number;
    regularDanmaku: number;
    dailyStats?: Array<{
        date: string;
        studyMinutes: number;
        activeUsers: number;
        aiInteractions: number;
    }>;
}

export const adminAPI = {
    getStats: () => request<AdminStats>('/admin/stats'),
    listCourses: (page = 1, pageSize = 20) =>
        request<AdminCoursePage>(`/admin/courses?page=${page}&pageSize=${pageSize}`),
    getLearningTrend: (days = 30) =>
        request<LearningTrend>(`/admin/learning-trend?days=${days}`),
};

// 学员看板
export interface LearnerDashboardStats {
    learnedCoursesCount: number;
    aiInteractionRate: number;
}

export interface LearnerCourseItem {
    id: string;
    title: string;
    thumbnail: string;
    category: string;
    status: string;
    progressPercent: number;
    purchasedAt: string;
}

export interface LearnerCoursePage {
    total: number;
    page: number;
    pageSize: number;
    list: LearnerCourseItem[];
}

export interface LearnerLearningTrend {
    completionRate: number;
    aiQuestionCount: number;
    regularDanmaku: number;
}

export const dashboardAPI = {
    getStats: () => request<LearnerDashboardStats>('/dashboard/stats'),
    listCourses: (page = 1, pageSize = 20) =>
        request<LearnerCoursePage>(`/dashboard/courses?page=${page}&pageSize=${pageSize}`),
    getLearningTrend: (days = 30) =>
        request<LearnerLearningTrend>(`/dashboard/learning-trend?days=${days}`),
};

// 学习路径
export interface LearningPathSummary {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    category: string;
    estimatedHours: number;
    difficulty: string;
    stageCount: number;
    overallProgress?: number;
    hasStarted: boolean;
}

export interface PathNode {
    id: string;
    nodeOrder: number;
    title: string;
    courseId: string;
    videoId: string;
    courseTitle: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
    progressPercent: number;
    locked: boolean;
}

export interface PathStage {
    id: string;
    stageOrder: number;
    title: string;
    description: string;
    skipped: boolean;
    stageProgressPercent: number;
    nodes: PathNode[];
}

export interface LearningPathDetail {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    category: string;
    estimatedHours: number;
    difficulty: string;
    overallProgress: number;
    startStageOrder: number;
    skippedStageOrders: number[];
    assessmentSummary?: string;
    needsAssessment: boolean;
    stages: PathStage[];
}

export interface PathAssessmentQuestion {
    id: string;
    stageOrder: number;
    question: string;
    options: string[];
}

export interface PathAssessmentResult {
    totalScore: number;
    startStageOrder: number;
    skippedStageOrders: number[];
    summary: string;
    aiRecommendation: string;
}

export const learningPathAPI = {
    list: () => request<LearningPathSummary[]>('/learning-paths'),
    getDetail: (pathId: string) => request<LearningPathDetail>(`/learning-paths/${pathId}`),
    getAssessment: (pathId: string) =>
        request<PathAssessmentQuestion[]>(`/learning-paths/${pathId}/assessment`),
    submitAssessment: (pathId: string, answers: Record<string, number>) =>
        request<PathAssessmentResult>(`/learning-paths/${pathId}/assessment`, {
            method: 'POST',
            body: JSON.stringify({ answers }),
        }),
};

export interface RankingItem {
    rank: number;
    userId: string;
    nickname: string;
    avatarUrl: string;
    score: number;
    studyMinutes: number;
    completedVideos: number;
    streakDays: number;
}

export interface MyRankInfo {
    rank: number;
    score: number;
    percentile: number;
}

// 排行榜模块
export const rankingAPI = {
    getList: (params?: { type?: 'weekly' | 'monthly' | 'all'; limit?: number }) => {
        const query = new URLSearchParams(
            Object.entries(params ?? {}).reduce(
                (acc, [k, v]) => {
                    if (v !== undefined && v !== null) acc[k] = String(v);
                    return acc;
                },
                {} as Record<string, string>,
            ),
        ).toString();
        return request<RankingItem[]>(`/rankings${query ? `?${query}` : ''}`);
    },

    getMyRank: (type?: 'weekly' | 'monthly' | 'all') => {
        const q = type ? `?type=${type}` : '';
        return request<MyRankInfo>(`/rankings/my-rank${q}`);
    },
};