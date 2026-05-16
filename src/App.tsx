
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, Search, Trophy, LayoutDashboard, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { UserProfileProvider, useUserProfile } from './context/UserProfileContext';

// Pages
import Home from './pages/Home';
import PlayerPage from './pages/PlayerPage';
import AdminPage from './pages/AdminPage';
import RankingsPage from './pages/RankingsPage';
import UserCenterPage from './pages/UserCenterPage';

function Navbar(){
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const { profile } = useUserProfile();

    const navItems = [
        { name:'学习中心', path:'/', icon:BookOpen },
        { name:'成长中心', path:'/rankings', icon:Trophy },
        { name:'管理后台', path:'/admin', icon:LayoutDashboard },
    ];

    const isProfileActive = location.pathname === '/profile';

    return(
        <nav className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-50 sticky top-0">
            <div className="flex items-center gap-8">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl uppercase tracking-tighter">Σ</div>
                    <span className="font-bold text-lg tracking-tight text-slate-900 hidden md:block italic">CoLearn AI</span>
                </Link>

                <div className="hidden md:flex items-center gap-6">
                    {navItems.map((item) =>(
                        <Link
                            key={item.name}
                            to={item.path}
                            className={cn(
                                "h-14 flex items-center text-sm font-medium transition-all border-b-2 mt-0.5",
                                location.pathname === item.path 
                                ? "text-indigo-600 border-indigo-600" 
                                : "text-slate-500 border-transparent hover:text-slate-800"
                            )}
                        >
                            {item.name}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="搜索知识点..." 
                        className="bg-slate-100 border-none rounded-full py-1.5 pl-9 pr-4 text-sm w-48 lg:w-64 focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>

                <Link
                    to="/profile"
                    className={cn(
                        'flex items-center gap-2 rounded-full border px-1.5 py-1 shadow-sm transition-all outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2',
                        isProfileActive
                            ? 'border-indigo-200 bg-indigo-50/80 ring-1 ring-indigo-100'
                            : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50',
                    )}
                    aria-label="进入个人中心"
                >
                    <img
                        src={profile.avatarUrl}
                        alt="" 
                        className="h-7 w-7 shrink-0 rounded-full border border-slate-100 bg-indigo-50 object-cover"    
                    />
                    <span className="text-xs font-semibold text-slate-700 pr-2 hidden sm:block max-w-[10rem] truncate">
                        {profile.displayName}(学员)
                    </span>
                </Link>

                <button type="button" className="md:hidden p-2 text-slate-500" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X size={20}/> : <Menu size={20}/>}
                </button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity:0, y:-10 }}
                        animate={{ opacity:1,y:0 }}
                        exit={{ opacity:0,y:-10 }}
                        className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 shadow-xl p-4 flex flex-col gap-2"
                    >
                        <Link
                            to="/profile"
                            onClick={() => setIsOpen(false)}
                            className={cn(
                                'p-3 rounded-lg text-sm font-medium flex items-center gap-2',
                                isProfileActive ? 'bg-slate-100 text-indigo-600' : 'text-slate-600',
                            )}
                        >
                            个人中心
                        </Link>
                        {navItems.map((item) =>(
                            <Link
                                key={item.name}
                                to={item.path}
                                onClick={() => setIsOpen(false)}
                                className={cn(
                                    "p-3 rounded-lg text-sm font-medium",
                                    location.pathname === item.path ? "bg-slate-100 text-indigo-600" : "text-slate-600"
                                )}
                            >
                                {item.name}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

function Footer(){
    return(
        <footer className="h-8 bg-slate-900 text-slate-400 text-[10px] px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    系统运行正常
                </span>
                <span>协同学习连接中</span>
            </div>
            <div className="flex items-center gap-4 hidden sm:flex">
                <span>当前处于</span>
                <span className="text-slate-200 font-medium">V1.0.0</span>
            </div>
        </footer>
    );
}

function AppShell(){
    return(
        <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
            <Navbar />
            <main className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col p-4 md:p-6 overflow-y-auto scrollbar-thin">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/play/:courseId/:videoId" element={<PlayerPage />} />
                        <Route path="/rankings" element={<RankingsPage />} />
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/profile" element={<UserCenterPage />} />
                        <Route
                        path="/dashboard"
                        element={<UserCenterPage />}
                        />
                    </Routes>
                </div>
            </main>
            <Footer />
        </div>
    );
}

export default function App(){
    return(
        <UserProfileProvider>
            <Router>
                <AppShell />
            </Router>
        </UserProfileProvider>
    );
}