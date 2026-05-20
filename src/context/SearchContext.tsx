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
    draft: string;
    setDraft: (value: string) => void;
    submitSearch: (keyword?: string) => void;
    clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [draft, setDraft] = useState('');

    useEffect(() => {
        if (location.pathname === '/courses') {
            const q = new URLSearchParams(location.search).get('q') ?? '';
            setDraft(q);
        }
    }, [location.pathname, location.search]);

    const submitSearch = useCallback(
        (keyword?: string) => {
            const q = (keyword ?? draft).trim();
            if (q) {
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

    return (
        <SearchContext.Provider value={{ draft, setDraft, submitSearch, clearSearch }}>
            {children}
        </SearchContext.Provider>
    );
}

export function useSearch() {
    const ctx = useContext(SearchContext);
    if (!ctx) {
        throw new Error('useSearch must be used within SearchProvider');
    }
    return ctx;
}
