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

const STORAGE_KEY_PREFIX = 'colearn_user_profile_';

export type UserProfileState = {
    displayName: string;
    avatarUrl: string;
};

const defaultProfile: UserProfileState = {
    displayName: MOCK_USER.name,
    avatarUrl: MOCK_USER.avatar,
};

function storageKey(userId: string) {
    return `${STORAGE_KEY_PREFIX}${userId}`;
}

function loadStored(userId: string): UserProfileState | null {
    if (typeof window === 'undefined' || !userId) return null;
    try {
        const raw = localStorage.getItem(storageKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<UserProfileState>;
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

type UserProfileContextValue = {
    profile: UserProfileState;
    setProfile: (next: Partial<UserProfileState>) => Promise<boolean>;
    resetProfile: () => void;
    loading: boolean;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
    const { user, isAuthenticated, updateUser } = useAuth();
    const [profile, setProfileState] = useState<UserProfileState>(defaultProfile);
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        if (!isAuthenticated || !user?.id) {
            setProfileState(defaultProfile);
            setLoading(false);
            return;
        }

        let cancelled = false;

        const fetchProfile = async () => {
            setLoading(true);
            try {
                const data = await authAPI.getCurrentUser();

                if (cancelled) return;

                if (!data || typeof data !== 'object') {
                    const stored = loadStored(user.id);
                    if (stored) persist(stored, user.id);
                    return;
                }

                const next = mapUserData(data as Record<string, unknown>);
                persist(next, user.id);
                updateUser({
                    nickname: next.displayName,
                    avatarUrl: next.avatarUrl,
                });
            } catch (error) {
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

    const setProfile = useCallback(
        async (partial: Partial<UserProfileState>): Promise<boolean> => {
            if (!user?.id) return false;

            try {
                const apiData: { nickname?: string; avatarUrl?: string } = {};
                if (partial.displayName !== undefined) {
                    apiData.nickname = partial.displayName;
                }
                if (partial.avatarUrl !== undefined) {
                    apiData.avatarUrl = partial.avatarUrl;
                }

                if (Object.keys(apiData).length === 0) return true;

                await userAPI.updateProfile(apiData);

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

    const resetProfile = useCallback(() => {
        persist(defaultProfile);
    }, [persist]);

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
