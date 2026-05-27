// 全局认证上下文-实现登录态持久化、页面初始化静默刷新令牌、会话过期自动登出、用户信息全局读写
import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    type ReactNode,
} from 'react';
// 引入之前写的令牌管理、全局事件、工具方法
import {
    TOKEN_KEY,
    USER_KEY,
    REFRESH_TOKEN_KEY,
    SESSION_EXPIRED_EVENT,
    TOKEN_REFRESHED_EVENT,
    clearAuthTokens,
    refreshAccessToken,
} from '../api/authTokens';

export interface User {
    id: string;
    username: string;
    nickname: string;
    email: string;
    role: 'learner' | 'instructor' | 'admin';
    avatarUrl: string;
}

// 上下文对外类型 AuthContextType
interface AuthContextType {
    user: User | null; // 当前登录用户信息，未登录为 null
    token: string | null;  // 当前有效访问令牌
    login: (token: string, user: User, refreshToken?: string) => void; // 登录方法
    logout: () => void; // 登出方法
    updateUser: (partial: Partial<User>) => void; // 局部更新用户信息
    isAuthenticated: boolean; // 是否已登录（快捷判断）
    /** 已完成本地恢复与令牌静默刷新 */
    isReady: boolean; // 初始化是否完成（本地恢复+令牌刷新完毕）

}

// 创建空上下文-创建 React 上下文容器，初始值为 null，配合后续自定义 Hook 做调用校验
const AuthContext = createContext<AuthContextType | null>(null);

// 工具函数：读取本地缓存 loadStoredAuth
function loadStoredAuth(): { token: string | null; user: User | null } {
    // 兼容 SSR / 服务端渲染（无 window 环境直接返回空）
    if (typeof window === 'undefined') {
        return { token: null, user: null };
    }

    try {
        // 从 localStorage 读取令牌和用户字符串
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        // 缺少任意一项 → 判定为未登录
        if (!storedToken || !storedUser) {
            return { token: null, user: null };
        }
        // 反序列化用户 JSON
        const user = JSON.parse(storedUser) as User;
         // 数据不合法（无用户ID），抛出异常
        if (!user?.id) {
            throw new Error('invalid stored user');
        }
        return { token: storedToken, user };
    } catch {
        // 解析失败/数据损坏：清空所有登录缓存，返回未登录
        clearAuthTokens();
        return { token: null, user: null };
    }
}
// 上下文容器组件 AuthProvider
export function AuthProvider({ children }: { children: ReactNode }) {
    // 登录核心状态：token + user，初始化直接读取本地缓存
    const [auth, setAuth] = useState(loadStoredAuth);
    // 初始化就绪标记：页面加载、令牌刷新是否完成
    const [isReady, setIsReady] = useState(false);

    const logout = useCallback(() => {
        setAuth({ token: null, user: null }); // 清空内存状态
        clearAuthTokens(); // 清空 localStorage 所有登录缓存
    }, []);

    // 登录方法 login-登录成功后，同时更新内存 + 本地缓存，保证刷新页面不丢失登录态
    const login = useCallback((newToken: string, newUser: User, refreshToken?: string) => {
        // 更新内存状态
        setAuth({ token: newToken, user: newUser });
        // 持久化 accessToken、用户信息到本地
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        // 存在 refreshToken 也一并存储
        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    }, []);

    // 更新用户信息 updateUser
    const updateUser = useCallback((partial: Partial<User>) => {
        setAuth((prev) => {
            if (!prev.user) return prev; // 未登录直接返回
            // 合并旧用户数据 + 新字段
            const nextUser = { ...prev.user, ...partial };
            // 同步更新本地缓存
            localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
            return { ...prev, user: nextUser };
        });
    }, []);

    // 核心副作用：页面初始化 & 静默刷新令牌
    useEffect(() => {
        let cancelled = false;  // 组件卸载标记，防止异步回调执行

        (async () => {
            const stored = loadStoredAuth();
            // 本地无登录信息，直接标记初始化完成
            if (!stored.token || !stored.user) {
                if (!cancelled) setIsReady(true);
                return;
            }

             // 存在刷新令牌 → 执行静默续期
            const hasRefresh = !!localStorage.getItem(REFRESH_TOKEN_KEY);
            if (hasRefresh) {
                const newToken = await refreshAccessToken();
                if (cancelled) return;

                if (newToken) {
                    // 刷新成功：更新内存中的 token
                    setAuth({ token: newToken, user: stored.user });
                } else {
                    // 刷新失败（refreshToken 过期/无效）：清空登录态
                    setAuth({ token: null, user: null });
                    clearAuthTokens();
                }
            } else {
                // 无刷新令牌，直接使用原有本地 token
                setAuth(stored);
            }

             // 所有流程走完，标记初始化就绪
            if (!cancelled) setIsReady(true);
        })();

        // 组件卸载时终止异步逻辑
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        // 会话过期事件 → 直接登出
        const onSessionExpired = () => logout();

        // 令牌刷新事件 → 同步全局最新 token
        const onTokenRefreshed = (event: Event) => {
            const detail = (event as CustomEvent<{ accessToken: string }>).detail;
            if (!detail?.accessToken) return;
            setAuth((prev) => ({ ...prev, token: detail.accessToken }));
        };

        // 挂载事件监听
        window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
        window.addEventListener(TOKEN_REFRESHED_EVENT, onTokenRefreshed);
        // 组件卸载时解绑（必做，防止内存泄漏）
        return () => {
            window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
            window.removeEventListener(TOKEN_REFRESHED_EVENT, onTokenRefreshed);
        };
    }, [logout]);

    return (
        <AuthContext.Provider
            value={{
                user: auth.user,
                token: auth.token,
                login,
                logout,
                updateUser,
                isAuthenticated: !!auth.token,
                isReady,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// 自定义 Hook：快捷使用上下文 useAuth
export function useAuth() {
    const context = useContext(AuthContext);
    // 强制校验：必须在 AuthProvider 内部使用
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
