// 全局认证上下文
import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from 'react';

// 本地储存键名常量
const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';
const REFRESH_TOKEN_KEY = 'refreshToken';
// 用户信息类型
export interface User {
    id: string;
    username: string;
    nickname: string;
    email: string;
    role: 'learner' | 'instructor' | 'admin';
    avatarUrl: string;
}
// 上下文对外暴露类型
interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User, refreshToken?: string) => void;
    logout: () => void;
    updateUser: (partial: Partial<User>) => void;
    isAuthenticated: boolean;
    /** 已完成从 localStorage 恢复（首屏同步恢复，通常为 true） */
    isReady: boolean;
}
// 创建上下文容器
const AuthContext = createContext<AuthContextType | null>(null);
// 本地读取登录态工具函数
function loadStoredAuth(): { token: string | null; user: User | null } {
    // 服务端渲染环境直接返回空
    if (typeof window === 'undefined') {
        return { token: null, user: null };
    }

    try {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);
        if (!storedToken || !storedUser) {
            return { token: null, user: null };
        }
        const user = JSON.parse(storedUser) as User;
        if (!user?.id) {
            throw new Error('invalid stored user');
        }
        return { token: storedToken, user };
    } catch {
        // 数据损坏清空缓存
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return { token: null, user: null };
    }
}
// 认证包裹容器
export function AuthProvider({ children }: { children: ReactNode }) {
    // 同步读取，避免刷新后首帧 isAuthenticated=false 被路由守卫踢到登录页
    // 组件挂载立刻同步读取本地控制态
    const [auth, setAuth] = useState(loadStoredAuth);

    const login = useCallback((newToken: string, newUser: User, refreshToken?: string) => {
        setAuth({ token: newToken, user: newUser });
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        if (refreshToken) {
            localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        }
    }, []);

    const logout = useCallback(() => {
        setAuth({ token: null, user: null });
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
    }, []);
    // 局部更新用户信息(头像\昵称\邮箱)-自动同步内存与本地缓存
    const updateUser = useCallback((partial: Partial<User>) => {
        setAuth((prev) => {
            if (!prev.user) return prev;
            const nextUser = { ...prev.user, ...partial };
            localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
            return { ...prev, user: nextUser };
        });
    }, []);
    // 上下文向外抛出值
    return (
        <AuthContext.Provider
            value={{
                user: auth.user,
                token: auth.token,
                login,
                logout,
                updateUser,
                isAuthenticated: !!auth.token,
                isReady: true,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
// 自定义获取上下文钩子
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
