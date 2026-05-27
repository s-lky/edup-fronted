// 前端登录令牌（Token）刷新、登录状态管理
import { API_ORIGIN } from './config';

// 本地存储key常量
export const TOKEN_KEY = 'accessToken'; //访问令牌
export const REFRESH_TOKEN_KEY = 'refreshToken'; //刷新令牌
export const USER_KEY = 'user'; //用户信息

// 全局自定义事件名，用于跨组件、跨文件监听登录状态变化
export const SESSION_EXPIRED_EVENT = 'colearn:session-expired'; //会话过期
export const TOKEN_REFRESHED_EVENT = 'colearn:token-refreshed'; //Token刷新

// 后端统一返回格式泛型接口
interface ApiResponse<T> {
    code: number; 
    message: string;
    data: T;
}

// 刷新Token接口返回的数据结构
interface RefreshTokenData {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

// 全局变量：防并发刷新锁，防止多个请求同时触发Token刷新
let refreshInFlight: Promise<string | null> | null = null;

// 判断是否为令牌认证错误
export function isTokenAuthError(code: number, message?: string): boolean {
    if (code === 401) return true;
    const msg = message ?? '';
    return (
        msg.includes('令牌') ||
        msg.includes('未登录') ||
        msg.includes('无效的访问令牌') ||
        msg.includes('无效的刷新令牌')
    );
}

// 清空登录凭证
export function clearAuthTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

// 触发“会话过期”全局事件
export function notifySessionExpired(): void {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

// 用于刷新令牌的核心函数
export async function refreshAccessToken(): Promise<string | null> {
    // 读取本地刷新令牌
    const storedRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!storedRefresh) return null; //无令牌，直接刷新失败

    // 防并发：如果正在刷新，直接返回当前进行中的Promise
    if (refreshInFlight) return refreshInFlight;

    // 标记刷新中，开始执行刷新逻辑
    refreshInFlight = (async () => {
        try {

            // 调用后端刷新Token接口
            const response = await fetch(`${API_ORIGIN}/api/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: storedRefresh }),
            });

            // 解析接口返回，增加解析异常兜底
            const result: ApiResponse<RefreshTokenData> = await response.json().catch(() => ({
                code: response.status,
                message: '刷新令牌失败',
                data: null as unknown as RefreshTokenData,
            }));

            // 校验接口是否调用成功
            if (!response.ok || result.code !== 200 || !result.data?.accessToken) {
                return null;
            }

            // 刷新成功，更新本地Token
            const { accessToken, refreshToken } = result.data;
            localStorage.setItem(TOKEN_KEY, accessToken);
            if (refreshToken) {
                localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            }

            // 派发Token刷新成功的事件
            window.dispatchEvent(
                new CustomEvent(TOKEN_REFRESHED_EVENT, {
                    detail: { accessToken, refreshToken },
                }),
            );

            return accessToken; //返回新的访问令牌
        } catch {
            // 网络异常、接口异常、返回失败
            return null;
        } finally {
            // 无论成功/失败，都解锁“刷新中”的锁
            refreshInFlight = null;
        }
    })();

    return refreshInFlight;
}
