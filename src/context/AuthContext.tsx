import {
    createContext,
    useContext,
    useState,
    useCallback,
    type ReactNode,
} from 'react';

const TOKEN_KEY = 'accessToken';
const USER_KEY = 'user';
const REFRESH_TOKEN_KEY = 'refreshToken';

export interface User {
    id: string;
    username: string;
    nickname: string;
    email: string;
    role: 'learner' | 'instructor' | 'admin';
    avatarUrl: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, user: User, refreshToken?: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
    /** 已完成从 localStorage 恢复（首屏同步恢复，通常为 true） */
    isReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function loadStoredAuth(): { token: string | null; user: User | null } {
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
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return { token: null, user: null };
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // 同步读取，避免刷新后首帧 isAuthenticated=false 被路由守卫踢到登录页
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

    return (
        <AuthContext.Provider
            value={{
                user: auth.user,
                token: auth.token,
                login,
                logout,
                isAuthenticated: !!auth.token,
                isReady: true,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
