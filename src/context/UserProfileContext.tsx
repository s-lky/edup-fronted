import {createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MOCK_USER } from '../mockData';
import { authAPI } from '../api/index';

const STORAGE_KEY = 'colearn_user_profile';

export type UserProfileState = {
    displayName: string;
    avatarUrl: string;
};

const defaultProfile: UserProfileState = {
    displayName: MOCK_USER.name,
    avatarUrl: MOCK_USER.avatar,
};

function loadStored(): UserProfileState | null {
    if (typeof window === 'undefined') return null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
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

type UserProfileContextValue = {
    profile: UserProfileState;
    setProfile: (next: Partial<UserProfileState>) => void;
    resetProfile: () => void;
    loading: boolean;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
const [profile, setProfileState] = useState<UserProfileState>(defaultProfile);
const [loading, setLoading] = useState(true);

useEffect(() => {
    const fetchProfile = async () => {
        try {
            const data = await authAPI.getCurrentUser();
            
            if (!data) {
                console.warn('获取用户信息返回空数据');
                const stored = loadStored();
                if (stored) {
                    setProfileState(stored);
                }
                return;
            }
            
            const userData = data as any;
            
            if (!userData || typeof userData !== 'object') {
                console.warn('用户数据格式错误:', userData);
                const stored = loadStored();
                if (stored) {
                    setProfileState(stored);
                }
                return;
            }
            
            setProfileState({
                displayName: userData.nickname || userData.displayName || defaultProfile.displayName,
                avatarUrl: userData.avatarUrl || defaultProfile.avatarUrl,
            });
        } catch (error) {
            console.error('获取用户信息失败:', error);
            const stored = loadStored();
            if (stored) setProfileState(stored);
        } finally {
            setLoading(false);
        }
    };
    
    if (typeof window !== 'undefined') {
        fetchProfile();
    } else {
        setLoading(false);
    }
}, []);

const persist = useCallback((next: UserProfileState) => {
    setProfileState(next);
    try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
    /* ignore */
    }
}, []);

const setProfile = useCallback(
    async (partial: Partial<UserProfileState>) => {
        try {
            const apiData: { nickname?: string; avatarUrl?: string } = {};
            if (partial.displayName !== undefined) {
                apiData.nickname = partial.displayName;
            }
            if (partial.avatarUrl !== undefined) {
                apiData.avatarUrl = partial.avatarUrl;
            }
            
            await userAPI.updateProfile(apiData);
            
            setProfileState((prev) => {
                const next: UserProfileState = {
                    displayName: partial.displayName !== undefined
                        ? partial.displayName.trim() || defaultProfile.displayName
                        : prev.displayName,
                    avatarUrl: partial.avatarUrl !== undefined
                        ? partial.avatarUrl.trim() || defaultProfile.avatarUrl
                        : prev.avatarUrl,
                };
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
                } catch {
                /* ignore */
                }
                return next;
            });
        } catch (error) {
            console.error('更新用户资料失败:', error);
        }
    },
    [],
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