import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { MOCK_USER } from '../mockData';
import { authAPI, userAPI } from '../api/index';
import { useAuth } from './AuthContext';
// 常量与基础类型
// 本地存储统一前缀-区分业务缓存
const STORAGE_KEY_PREFIX = 'colearn_user_profile_';
// 定义资料字段：展示昵称、头像地址
export type UserProfileState = {
    displayName: string;
    avatarUrl: string;
};
// 默认兜底资料：接口、缓存失效时使用
const defaultProfile: UserProfileState = {
    displayName: MOCK_USER.name,
    avatarUrl: MOCK_USER.avatar,
};

// 拼接带用户ID的缓存key，多账户隔离
function storageKey(userId: string) {
    return `${STORAGE_KEY_PREFIX}${userId}`;
}
// 读取本地缓存资料
function loadStored(userId: string): UserProfileState | null {
    if (typeof window === 'undefined' || !userId) return null;
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<UserProfileState>;
        // 校验字段合法性
        if (
            typeof parsed.displayName === 'string' &&
            typeof parsed.avatarUrl === 'string'
        ) {
            return {
                displayName: parsed.displayName.trim() || defaultProfile.displayName,
                avatarUrl: parsed.avatarUrl.trim() || defaultProfile.avatarUrl,
            };
        }
    } catch {
        /* ignore */
    }
    return null;
}
// 统一格式化后端返回数据
function mapUserData(userData: Record<string, unknown>): UserProfileState {
    return {
        displayName:
            (typeof userData.nickname === 'string' && userData.nickname) ||
            (typeof userData.displayName === 'string' && userData.displayName) ||
            defaultProfile.displayName,
        avatarUrl:
            (typeof userData.avatarUrl === 'string' && userData.avatarUrl.trim()) ||
            defaultProfile.avatarUrl,
    };
}
// 上下文类型与实例创建
type UserProfileContextValue = {
    profile: UserProfileState;
    setProfile: (next: Partial<UserProfileState>) => Promise<boolean>;
    resetProfile: () => void;
    loading: boolean;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);
// 资料容器组件
export function UserProfileProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, updateUser } = useAuth();
    const [profile, setProfileState] = useState<UserProfileState>(defaultProfile);
    const [loading, setLoading] = useState(true);
// 本地持久化封装
    const persist = useCallback(
        (next: UserProfileState, userId?: string) => {
            setProfileState(next);
            const id = userId ?? user?.id;
            if (!id) return;
            try {
                localStorage.setItem(storageKey(id), JSON.stringify(next));
            } catch {
                /* ignore */
            }
        },
        [user?.id],
    );
// 登录后初始化拉取资料
    useEffect(() => {
        // 未登录重置为默认资料
        if (!isAuthenticated || !user?.id) {
            setProfileState(defaultProfile);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                // 请求后端最新用户信息
                const data = await authAPI.getCurrentUser();

                if (cancelled) return;
                // 后端无数据，降级读取本地缓存
                if (!data || typeof data !== 'object') {
                    const stored = loadStored(user.id);
                    if (stored) persist(stored, user.id);
                    return;
                }
                // 格式化数据并更新状态、缓存、全局登录信息
                const next = mapUserData(data as Record<string, unknown>);
                persist(next, user.id);
                updateUser({
                    nickname: next.displayName,
                    avatarUrl: next.avatarUrl,
                });
            } catch (error) {
                // 接口报错降级策略
                console.error('获取用户信息失败:', error);
                if (!cancelled) {
                    const stored = loadStored(user.id);
                    if (stored) {
                        persist(stored, user.id);
                    } else if (user.avatarUrl || user.nickname) {
                        persist(
                            {
                                displayName: user.nickname || defaultProfile.displayName,
                                avatarUrl: user.avatarUrl || defaultProfile.avatarUrl,
                            },
                            user.id,
                        );
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchProfile();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.id, persist, updateUser]);
// 异步修改个人资料
    const setProfile = useCallback(
        async (partial: Partial<UserProfileState>): Promise<boolean> => {
            if (!user?.id) return false;

            try {
                // 组装接口参数
                const apiData: { nickname?: string; avatarUrl?: string } = {};
                if (partial.displayName !== undefined) {
                    apiData.nickname = partial.displayName;
                }
                if (partial.avatarUrl !== undefined) {
                    apiData.avatarUrl = partial.avatarUrl;
                }

                if (Object.keys(apiData).length === 0) return true;
                // 调用后端更新接口
                await userAPI.updateProfile(apiData);
                // 更新内存与本地缓存
                setProfileState((prev) => {
                    const next: UserProfileState = {
                        displayName:
                            partial.displayName !== undefined
                                ? partial.displayName.trim() || defaultProfile.displayName
                                : prev.displayName,
                        avatarUrl:
                            partial.avatarUrl !== undefined
                                ? partial.avatarUrl.trim() || defaultProfile.avatarUrl
                                : prev.avatarUrl,
                    };
                    try {
                        localStorage.setItem(storageKey(user.id), JSON.stringify(next));
                    } catch {
                        /* ignore */
                    }
                    return next;
                });
                // 同步更新全局登录用户信息
                if (partial.displayName !== undefined) {
                    updateUser({ nickname: partial.displayName.trim() });
                }
                if (partial.avatarUrl !== undefined) {
                    updateUser({ avatarUrl: partial.avatarUrl.trim() });
                }

                return true;
            } catch (error) {
                console.error('更新用户资料失败:', error);
                return false;
            }
        },
        [user?.id, updateUser],
    );
    // 重置默认资料
    const resetProfile = useCallback(() => {
        persist(defaultProfile);
    }, [persist]);
    // 优化上下文传出值
    const value = useMemo(
        () => ({ profile, setProfile, resetProfile, loading }),
        [profile, setProfile, resetProfile, loading],
    );

    return (
        <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
    );
}

export function useUserProfile() {
    const ctx = useContext(UserProfileContext);
    if (!ctx) {
        throw new Error('useUserProfile must be used within UserProfileProvider');
    }
    return ctx;
}
