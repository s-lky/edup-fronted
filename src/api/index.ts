import { API_BASE_URL }  from "./config";

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

// 通用请求封装
async function request<T> (
    endpoint:string,
    options:RequestInit = {}
) : Promise<T>{
    const token = localStorage.getItem('accessToken');

    const response = await fetch(`${API_BASE_URL}${endpoint}`,{
        ...options,
        headers:{
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });

    if(!response.ok){
        const error = await response.json().catch(() => ({ message: '请求失败' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    const result: ApiResponse<T> = await response.json();
    return result.data;
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
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '登录失败' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        
        const result: ApiResponse<LoginResponse> = await response.json();
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
        
        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: '注册失败' }));
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        
        const result: ApiResponse<RegisterResponse> = await response.json();
        return result.data;
    },
        
    refreshToken: (refreshToken: string) =>
        request('/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refreshToken }),
        }),

    getCurrentUser: () => request<UserInfo>('/auth/me'),
};

// 用户资料模块
export const userAPI = {
    updateProfile: (data: { nickname?: string; avatarUrl?:string }) =>
        request('/users/me', {
            method: 'PATCH',
            body: JSON.stringify(data),
        }),
};

// 课程模块
export const courseAPI = {
    getList: (params?: { page?: number; pageSize?:number; category?: string; keyword?: string }) => {
        const query = new URLSearchParams(params as any).toString();
        return request<CourseListResponse>(`/courses${query ? `?${query}` : ''}`);
    },

    getDetail: (courseId: string) => request<CourseVO>(`/courses/${courseId}`),
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
        return request<OrderListResponse>(`/users/me/orders${query ? `?${query}` : ''}`);
    },

    pay: (orderId: string) =>
        request(`/orders/${orderId}/pay`, {
        method: 'POST',
    }),

    getPurchasedCourses: () => request<PurchasedCourse[]>('/user/purchased-courses'),
};

// 排行榜模块
export const rankingAPI = {
    getList: (params?: { type?: 'weekly' | 'monthly' | 'all'; limit?: number }) => {
        const query = new URLSearchParams(params as any).toString();
        return request(`/rankings${query ? `?${query}` : ''}`);
    },

    getMyRank: () => request('/rankings/my-rank'),
};