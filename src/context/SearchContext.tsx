// 全局搜索状态上下文
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SearchContextType {
    draft: string; //搜索框实时输入草稿文本
    setDraft: (value: string) => void; //修改输入关键词
    submitSearch: (keyword?: string) => void; //提交搜索，携带关键词跳转课程列表页
    clearSearch: () => void; //清空关键词
}
// 初始化空上下文-由外层Provider注入真实数据逻辑
const SearchContext = createContext<SearchContextType | null>(null);
// 全局搜索容器组件-初始化路由跳转，draft储存当前搜索框输入内容
export function SearchProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [draft, setDraft] = useState('');
// 路由参数回填搜索框
    useEffect(() => {
        if (location.pathname === '/courses') {
            const q = new URLSearchParams(location.search).get('q') ?? '';
            setDraft(q);
        }
    }, [location.pathname, location.search]);
// 提交搜索方法
    const submitSearch = useCallback(
        (keyword?: string) => {
            const q = (keyword ?? draft).trim();
            if (q) { //去除首尾空格，空关键词直接跳默认课程页
                navigate(`/courses?q=${encodeURIComponent(q)}`);
            } else { 
                navigate('/courses');
            }
        },
        [draft, navigate],
    );

    const clearSearch = useCallback(() => {
        setDraft('');
        navigate('/courses');
    }, [navigate]);
    // 向下注入上下文
    return (
        <SearchContext.Provider value={{ draft, setDraft, submitSearch, clearSearch }}>
            {children}
        </SearchContext.Provider>
    );
}
// 自定义搜索调用钩子
export function useSearch() {
    const ctx = useContext(SearchContext);
    if (!ctx) {
        throw new Error('useSearch must be used within SearchProvider');
    }
    return ctx;
}
