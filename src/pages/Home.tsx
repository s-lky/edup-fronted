import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Users, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { courseAPI } from '../api';
import { cn } from '../lib/utils';

/** 本地 SVG 占位图，避免 onError 再请求外网导致死循环 */
const COURSE_THUMB_FALLBACK =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%23e2e8f0' width='800' height='450'/%3E%3Ctext x='400' y='230' text-anchor='middle' fill='%2394a3b8' font-size='22' font-family='system-ui,sans-serif'%3E%E8%AF%BE%E7%A8%8B%E5%B0%81%E9%9D%A2%3C/text%3E%3C/svg%3E";

function handleCourseThumbError(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.dataset.fallbackApplied === '1') return;
    img.dataset.fallbackApplied = '1';
    img.src = COURSE_THUMB_FALLBACK;
}

interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    price: number;
    thumbnail: string;
    category: string;
    studentsCount: number;
    rating: number;
    videoCount: number;
    videos?: Array<{
        id: string;
        title: string;
        url: string;
        duration: string;
        thumbnail: string;
        order: number;
    }>;
}

export default function Home(){
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('全部');

    // 从 API 获取课程数据
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            setError('');
            
            try {
                const params: any = {
                    page: 1,
                    pageSize: 20
                };
                
                if (searchQuery) {
                    params.keyword = searchQuery;
                }
                
                if (selectedCategory !== '全部') {
                    params.category = selectedCategory;
                }
                
                const response = await courseAPI.getList(params);
                setCourses(response.list || []);
            } catch (err: any) {
                console.error('获取课程列表失败:', err);
                setError('加载课程失败，请检查网络连接');
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [searchQuery, selectedCategory]);

    // 分类筛选
    const categories = ['全部', '前端开发', '人工智能', '区块链', '后端开发', '移动开发'];

    return(
        <div className="space-y-12">
            <section className="relative overflow-hidden rounded-2xl bg-indigo-600 p-8 md:p-12 text-white">
                <div className="relative z-10 max-w-2xl">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold tracking-widest uppercase mb-6"
                    >
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                        AI协同学习社区
                    </motion.div>
                    <motion.h1
                        initial={{ opacity:0,y:20 }}
                        animate={{ opacity:1,y:0 }}
                        className="text-4xl md:text-5xl font-bold leading-tight mb-4 italic"
                    >
                        神经网络与深度学习：<br/><span className="text-indigo-200">从零构建智能未来</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity:0,y:20 }}
                        animate={{ opacity:1,y:0 }}
                        className="text-indigo-100 text-base md:text-lg mb-8 leading-relaxed max-w-xl"
                    >
                        探索前沿技术，与AI助教一同成长
                    </motion.p>
                    <div className="flex flex-wrap gap-4">
                        <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-sm shadow-xl shadow-indigo-900/20 hover:scale-105 transition-transform">
                            立即开始学习
                        </button>
                        <button className="px-6 py-3 bg-indigo-500/30 backdrop-blur-md text-white border border-white/20 rounded-xl font-bold text-sm hover:bg-white/10 transition-all">
                            查看学习路径
                        </button>
                    </div>
                </div>

                <div className="absolute top-0 right-0 w-1/2 h-full hidden lg:block">
                    <div className="absolute inset-0 bg-linear-to-l from-indigo-600 to-transparent z-10" />
                        <div className="w-full h-full bg-indigo-900 opacity-50 flex items-center justify-center" >
                            <div className="w-64 h-64 border-4 border-indigo-400/20 rounded-full animate-ping" />
                            <div className="absolute w-48 h-48 border-2 border-white/10 rounded-full"/>
                        </div>
                    </div>
            </section>

            <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 italic">
                        精选课程专区
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded italic font-normal not-italic">最新更新</span>
                    </h2>
                    <div className="flex gap-4">
                        {categories.map(t => (
                            <button 
                                key={t} 
                                onClick={() => setSelectedCategory(t)}
                                className={cn(
                                    "text-sm font-medium transition-colors uppercase tracking-wider",
                                    selectedCategory === t 
                                        ? "text-indigo-600 font-bold" 
                                        : "text-slate-500 hover:text-indigo-600"
                                )}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 加载状态 */}
                {loading && (
                    <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            <p className="text-sm text-slate-500">正在加载课程...</p>
                        </div>
                    </div>
                )}

                {/* 错误提示 */}
                {error && !loading && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                        <p className="text-red-600 font-medium">{error}</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                        >
                            重新加载
                        </button>
                    </div>
                )}

                {/* 空状态 */}
                {!loading && !error && courses.length === 0 && (
                    <div className="bg-slate-50 rounded-xl p-10 text-center">
                        <p className="text-slate-500 mb-2">暂无课程数据</p>
                        <p className="text-xs text-slate-400">请检查后端服务是否正常运行</p>
                    </div>
                )}

                {/* 课程列表 */}
                {!loading && courses.length > 0 && (
                    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course, index) =>(
                            <motion.div
                                key={course.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="card-polish group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col cursor-pointer"
                                onClick={async () => {
                                    try {
                                        const detail = await courseAPI.getDetail(course.id);
                                        const firstVideo = detail.videos?.[0];
                                        if (firstVideo) {
                                            navigate(`/play/${course.id}/${firstVideo.id}`);
                                        } else {
                                            setError('该课程暂无视频');
                                        }
                                    } catch (err) {
                                        console.error('获取课程详情失败:', err);
                                        setError('无法打开课程，请重试');
                                    }
                                }}
                            >
                                <div className="relative aspect-video overflow-hidden bg-slate-100">
                                    <img
                                        src={course.thumbnail} 
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                        onError={handleCourseThumbError}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                        <span className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/20">
                                            开始学习 <ChevronRight size={14} />
                                        </span>
                                    </div>
                                    <div className="absolute top-3 left-3 px-2 py-0.5 rounded bg-white/90 text-[10px] font-black text-indigo-600 uppercase tracking-tighter shadow-sm">
                                        {course.category}
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col">
                                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors italic leading-tight mb-2 line-clamp-1">
                                        {course.title}
                                    </h3>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-6">
                                        {course.description}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Users size={12} /> 
                                                {course.studentsCount || 0}
                                            </span>
                                            <span className="flex items-center gap-1 text-amber-500">
                                                <Star size={12} fill="currentColor" /> 
                                                {course.rating || 0}
                                            </span>
                                        </div>
                                        <div className="text-lg font-black text-indigo-600">
                                            ￥{course.price || 0}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </section>
                )}
            </div>
        </div>
    );
}